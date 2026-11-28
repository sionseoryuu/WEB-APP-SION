// Transaksi berulang otomatis: gaji, kos, cicilan, listrik, dll.
// Mesin murni & idempoten: id transaksi = `tx-rec-<aturan>-<tanggal>` sehingga tidak pernah ganda.
import { addDays, dateInMonth, daysInMonth, monthKey, addMonthsKey, parseYmd, ymd, newId } from './dates.js';

export const FREQUENCIES = ['weekly', 'monthly', 'yearly'];
const MAX_CATCHUP = 120; // batas pengaman bila aplikasi lama tidak dibuka

// Semua tanggal kejadian aturan di antara (after, upto] — `after` boleh kosong
export function occurrences(rule, after, upto) {
  const out = [];
  const start = rule.startDate;
  if (!start || !upto) return out;
  const end = rule.endDate && rule.endDate < upto ? rule.endDate : upto;
  const push = (d) => {
    if (d >= start && d <= end && (!after || d > after)) out.push(d);
  };
  if (rule.frequency === 'weekly') {
    const wd = Number.isInteger(rule.weekday) ? rule.weekday : parseYmd(start).getDay();
    let d = parseYmd(start);
    while (d.getDay() !== wd) d.setDate(d.getDate() + 1);
    let cur = ymd(d);
    let guard = 0;
    while (cur <= end && guard < 2000) {
      push(cur);
      cur = addDays(cur, 7);
      guard += 1;
    }
  } else if (rule.frequency === 'yearly') {
    const sd = parseYmd(start);
    const month = Number.isInteger(rule.month) ? rule.month : sd.getMonth() + 1;
    const day = rule.dayOfMonth || sd.getDate();
    for (let y = sd.getFullYear(); y <= parseYmd(end).getFullYear(); y += 1) {
      const key = `${y}-${String(month).padStart(2, '0')}`;
      push(dateInMonth(key, Math.min(day, daysInMonth(y, month))));
    }
  } else {
    const day = rule.dayOfMonth || parseYmd(start).getDate();
    let key = monthKey(start);
    const lastKey = monthKey(end);
    let guard = 0;
    while (key <= lastKey && guard < 2000) {
      push(dateInMonth(key, day));
      key = addMonthsKey(key, 1);
      guard += 1;
    }
  }
  return out.sort();
}

export const nextOccurrence = (rule, fromYmd) => {
  if (rule.active === false) return null;
  const horizon = addDays(fromYmd, 400);
  const list = occurrences(rule, addDays(fromYmd, -1), horizon);
  return list[0] || null;
};

// Aturan baru: bila tanggal mulai di masa lalu & tanpa isi-ulang, lewati kejadian sebelum hari ini
export function prepareNewRule(rule, today, backfill = false) {
  const base = { active: true, paymentMethod: 'Auto / Recurring', ...rule, id: rule.id || newId('rec') };
  if (backfill || !base.startDate || base.startDate >= today) return { ...base, lastRun: '' };
  const past = occurrences(base, '', addDays(today, -1));
  return { ...base, lastRun: past.length ? past[past.length - 1] : '' };
}

const buildTx = (rule, date) => ({
  id: `tx-rec-${rule.id}-${date}`,
  type: rule.type === 'income' ? 'income' : 'expense',
  amount: Number(rule.amount) || 0,
  date,
  category: rule.category,
  description: rule.name,
  accountId: rule.accountId,
  paymentMethod: rule.paymentMethod || 'Auto / Recurring',
  notes: rule.notes || '',
  recurringId: rule.id,
  ...(rule.items && rule.items.length ? { items: rule.items } : {}),
  ...(rule.debtId ? { debtId: rule.debtId } : {}),
});

// Terapkan semua aturan yang jatuh tempo sampai `today`. Mengembalikan data baru (atau yang sama bila tak ada perubahan).
export function applyRecurring(data, today) {
  const rules = data.recurring || [];
  if (!rules.length) return { data, created: [] };
  const existing = new Set(data.transactions.map((t) => t.id));
  const created = [];
  let debts = data.debts || [];
  const nextRules = rules.map((rule) => {
    if (rule.active === false || !(Number(rule.amount) > 0)) return rule;
    const due = occurrences(rule, rule.lastRun || '', today).slice(-MAX_CATCHUP);
    if (!due.length) return rule;
    due.forEach((date) => {
      const tx = buildTx(rule, date);
      if (existing.has(tx.id)) return;
      existing.add(tx.id);
      created.push(tx);
      if (rule.debtId) {
        debts = debts.map((d) => {
          if (d.id !== rule.debtId) return d;
          const step = Math.min(tx.amount, Math.max(0, d.totalAmount - d.paidAmount));
          return step > 0 ? { ...d, paidAmount: d.paidAmount + step, dueDate: advanceMonth(d.dueDate) } : d;
        });
      }
    });
    return { ...rule, lastRun: due[due.length - 1] };
  });
  if (!created.length && nextRules.every((r, i) => r === rules[i])) return { data, created };
  return {
    data: {
      ...data,
      recurring: nextRules,
      debts,
      transactions: [...created.sort((a, b) => b.date.localeCompare(a.date)), ...data.transactions],
    },
    created,
  };
}

export function advanceMonth(dateStr) {
  if (!dateStr) return dateStr;
  const key = addMonthsKey(monthKey(dateStr), 1);
  return dateInMonth(key, parseYmd(dateStr).getDate());
}

// Perkiraan arus bulanan dari semua aturan aktif (untuk ringkasan di layar)
export function monthlyEquivalent(rule) {
  const a = Number(rule.amount) || 0;
  if (rule.frequency === 'weekly') return (a * 52) / 12;
  if (rule.frequency === 'yearly') return a / 12;
  return a;
}
