// Pengingat & notifikasi lokal. Di Android (Capacitor) memakai @capacitor/local-notifications
// sehingga tetap bunyi saat aplikasi tertutup; di web hanya saat aplikasi terbuka.
import { Capacitor } from '@capacitor/core';
import { addDays, atTime, parseYmd, ymd } from './dates.js';
import { upcomingDue } from './calendarItems.js';

export const PREFS_KEY = 'lifeos:prefs:notify:v1';
export const DEFAULT_NOTIF_PREFS = {
  enabled: false,
  bills: true,
  billDaysBefore: 1,
  billTime: '09:00',
  tasks: true,
  taskTime: '08:00',
  events: true,
  habits: true,
  habitTime: '20:00',
  birthdays: true,
  budget: true,
  weekly: true,
  weeklyTime: '19:00',
};

export const isNative = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export function loadNotifPrefs() {
  try {
    return { ...DEFAULT_NOTIF_PREFS, ...(JSON.parse(localStorage.getItem(PREFS_KEY) || 'null') || {}) };
  } catch {
    return { ...DEFAULT_NOTIF_PREFS };
  }
}
export function saveNotifPrefs(p) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* penyimpanan penuh/dinonaktifkan: abaikan */
  }
}

// id notifikasi: bilangan bulat 31-bit stabil dari kunci teks
export function notifId(key) {
  let h = 5381;
  for (let i = 0; i < key.length; i += 1) h = ((h << 5) + h + key.charCodeAt(i)) | 0;
  return (Math.abs(h) % 2147483000) + 1;
}

const EVENT_OFFSETS = { '15 min before': 15, '1 hour before': 60, '1 day before': 1440 };
const HORIZON_DAYS = 45;
const HABIT_DAYS = 21;
const MAX_ITEMS = 150;

// Menyusun daftar pengingat dari data. Murni: `tr(key, vars)` menerjemahkan teks.
export function buildReminders({ data, prefs, now = new Date(), tr }) {
  if (!prefs.enabled) return [];
  const today = ymd(now);
  const until = addDays(today, HORIZON_DAYS);
  const list = [];
  const add = (key, at, title, body, route, extra = {}) => {
    if (at.getTime() <= now.getTime() + 5000) return; // sudah lewat
    list.push({ key, at, title, body, route, ...extra });
  };

  if (prefs.bills) {
    const money = (n) => `${data.profile?.currency === 'Rp' ? 'Rp ' : data.profile?.currency || ''}${Math.round(Number(n) || 0).toLocaleString(data.profile?.currency === 'Rp' ? 'id-ID' : 'en-US')}`;
    upcomingDue(data, addDays(today, -7), until).forEach((it) => {
      const kind = it.kind;
      const titleKey = kind === 'receivable' ? 'n_receivable_title' : kind === 'debt' ? 'n_debt_title' : 'n_bill_title';
      const vars = { name: it.title, amount: money(it.amount), date: it.date };
      if (it.date < today) {
        add(`late-${it.id}`, atTime(today, prefs.billTime), tr('n_late_title', vars), tr('n_late_body', vars), it.tab);
        return;
      }
      add(`due-${it.id}`, atTime(it.date, prefs.billTime), tr(titleKey, vars), tr('n_due_today_body', vars), it.tab);
      const before = Number(prefs.billDaysBefore) || 0;
      if (before > 0) {
        add(`pre-${it.id}`, atTime(addDays(it.date, -before), prefs.billTime), tr(titleKey, vars), tr('n_due_soon_body', { ...vars, days: before }), it.tab);
      }
    });
  }

  if (prefs.tasks) {
    (data.tasks || []).forEach((tk) => {
      if (tk.status === 'completed' || !tk.dueDate || tk.dueDate < today || tk.dueDate > until) return;
      const vars = { name: tk.title };
      add(`task-${tk.id}`, atTime(tk.dueDate, prefs.taskTime), tr('n_task_title', vars), tr('n_task_body', vars), 'tasks');
      if (tk.priority === 'Urgent' || tk.priority === 'High') {
        add(`task-pre-${tk.id}`, atTime(addDays(tk.dueDate, -1), prefs.taskTime), tr('n_task_title', vars), tr('n_task_tomorrow', vars), 'tasks');
      }
    });
  }

  if (prefs.events) {
    (data.events || []).forEach((ev) => {
      const off = EVENT_OFFSETS[ev.reminder];
      if (!off || !ev.date || ev.date < today || ev.date > until) return;
      const start = atTime(ev.date, ev.startTime || '09:00');
      const at = new Date(start.getTime() - off * 60000);
      add(`event-${ev.id}`, at, tr('n_event_title', { name: ev.title }), tr('n_event_body', { time: ev.startTime || '', place: ev.location || '' }), 'calendar');
    });
  }

  if (prefs.habits && (data.habits || []).length) {
    for (let i = 0; i < HABIT_DAYS; i += 1) {
      const d = addDays(today, i);
      const pending = data.habits.filter((h) => !(h.completedDates || []).includes(d));
      if (i === 0 && pending.length === 0) continue;
      const names = (i === 0 ? pending : data.habits).slice(0, 3).map((h) => h.name).join(', ');
      add(`habit-${d}`, atTime(d, prefs.habitTime), tr('n_habit_title'), tr('n_habit_body', { names }), 'habits');
    }
  }

  if (prefs.birthdays) {
    (data.contacts || []).forEach((c) => {
      if (!c.birthday) return;
      for (let i = 0; i <= HORIZON_DAYS; i += 1) {
        const d = addDays(today, i);
        if (d.slice(5) === c.birthday.slice(5)) {
          add(`bday-${c.id}-${d}`, atTime(d, '09:00'), tr('n_birthday_title', { name: c.name }), tr('n_birthday_body', { name: c.name }), 'crm');
        }
      }
    });
  }

  list.sort((a, b) => a.at - b.at);
  const capped = list.slice(0, MAX_ITEMS);

  if (prefs.weekly) {
    const { hour, minute } = (() => {
      const [h, m] = String(prefs.weeklyTime || '19:00').split(':').map(Number);
      return { hour: h || 19, minute: m || 0 };
    })();
    capped.push({
      key: 'weekly-summary',
      at: null,
      repeatOn: { weekday: 1, hour, minute }, // 1 = Minggu
      title: tr('n_weekly_title'),
      body: tr('n_weekly_body'),
      route: 'dashboard',
    });
  }
  return capped;
}

// ---------- Adaptor platform ----------
let nativeMod = null;
async function native() {
  if (!nativeMod) nativeMod = (await import('@capacitor/local-notifications')).LocalNotifications;
  return nativeMod;
}
const CHANNEL_ID = 'lifeos-reminders';

export async function permissionState() {
  if (isNative()) {
    try {
      const ln = await native();
      return (await ln.checkPermissions()).display;
    } catch {
      return 'denied';
    }
  }
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission === 'default' ? 'prompt' : Notification.permission;
}

export async function requestPermission() {
  if (isNative()) {
    try {
      const ln = await native();
      return (await ln.requestPermissions()).display;
    } catch {
      return 'denied';
    }
  }
  if (typeof Notification === 'undefined') return 'unsupported';
  const r = await Notification.requestPermission();
  return r === 'default' ? 'prompt' : r;
}

async function ensureChannel(ln, channelName, channelDesc) {
  try {
    await ln.createChannel({ id: CHANNEL_ID, name: channelName, description: channelDesc, importance: 4, visibility: 1, vibration: true });
  } catch {
    /* channel sudah ada / iOS: abaikan */
  }
}

let webTimers = [];
const webShow = async (title, body) => {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const reg = navigator.serviceWorker && (await navigator.serviceWorker.getRegistration());
    if (reg && reg.showNotification) await reg.showNotification(title, { body, icon: './icons/icon-192.png', badge: './icons/icon-192.png' });
    else new Notification(title, { body, icon: './icons/icon-192.png' });
  } catch {
    /* abaikan */
  }
};

// Ganti seluruh jadwal pengingat dengan daftar baru
export async function syncReminders(items, { channelName = 'LIFE OS', channelDesc = '' } = {}) {
  if (isNative()) {
    const ln = await native();
    if ((await ln.checkPermissions()).display !== 'granted') return { scheduled: 0, reason: 'permission' };
    await ensureChannel(ln, channelName, channelDesc);
    const pending = await ln.getPending();
    if (pending.notifications.length) await ln.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    const notifications = items.map((it) => ({
      id: notifId(it.key),
      title: it.title,
      body: it.body,
      channelId: CHANNEL_ID,
      extra: { route: it.route || 'dashboard' },
      schedule: it.repeatOn
        ? { on: it.repeatOn, allowWhileIdle: true }
        : { at: it.at, allowWhileIdle: true },
    }));
    // Hindari id ganda
    const seen = new Set();
    const unique = notifications.filter((n) => (seen.has(n.id) ? false : (seen.add(n.id), true)));
    if (unique.length) await ln.schedule({ notifications: unique });
    return { scheduled: unique.length };
  }
  // Web: hanya pengingat 12 jam ke depan selama halaman terbuka
  webTimers.forEach(clearTimeout);
  webTimers = [];
  const limit = Date.now() + 12 * 3600 * 1000;
  let n = 0;
  items.forEach((it) => {
    if (!it.at) return;
    const wait = it.at.getTime() - Date.now();
    if (wait > 0 && it.at.getTime() < limit) {
      webTimers.push(setTimeout(() => webShow(it.title, it.body), wait));
      n += 1;
    }
  });
  return { scheduled: n };
}

export async function cancelAllReminders() {
  webTimers.forEach(clearTimeout);
  webTimers = [];
  if (isNative()) {
    try {
      const ln = await native();
      const pending = await ln.getPending();
      if (pending.notifications.length) await ln.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    } catch {
      /* abaikan */
    }
  }
}

// Notifikasi langsung (mis. peringatan anggaran)
export async function notifyNow({ key, title, body, route }, opts = {}) {
  if (isNative()) {
    try {
      const ln = await native();
      if ((await ln.checkPermissions()).display !== 'granted') return false;
      await ensureChannel(ln, opts.channelName || 'LIFE OS', opts.channelDesc || '');
      await ln.schedule({
        notifications: [
          { id: notifId(`now-${key}-${Date.now()}`), title, body, channelId: CHANNEL_ID, extra: { route: route || 'dashboard' }, schedule: { at: new Date(Date.now() + 1500), allowWhileIdle: true } },
        ],
      });
      return true;
    } catch {
      return false;
    }
  }
  await webShow(title, body);
  return true;
}

// Ketuk notifikasi -> buka layar terkait
export function onNotificationTap(cb) {
  if (!isNative()) return () => {};
  let handle = null;
  let cancelled = false;
  native()
    .then((ln) => ln.addListener('localNotificationActionPerformed', (ev) => cb(ev?.notification?.extra?.route || 'dashboard')))
    .then((h) => {
      handle = h;
      if (cancelled) h.remove();
    })
    .catch(() => {});
  return () => {
    cancelled = true;
    if (handle) handle.remove();
  };
}

export { parseYmd };
