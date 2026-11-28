// Cadangan otomatis terjadwal ke Google Drive.
// Catatan teknis: Google hanya memberi token akses 1 jam (tanpa server tidak ada refresh token),
// jadi pencadangan berjalan saat aplikasi aktif dan mencoba masuk ulang diam-diam; bila Google
// meminta persetujuan lagi, pengguna diberi tahu dan cukup mengetuk sekali.
import { backupToDrive, isDriveLinked } from '../driveSync.js';

export const AUTO_KEY = 'lifeos:autobackup:v1';
export const DEFAULT_AUTO = { enabled: false, frequency: 'daily', lastAuto: '', lastHash: '', lastError: '', needsAuth: false };
export const FREQ_MS = { daily: 20 * 3600 * 1000, weekly: 6.5 * 24 * 3600 * 1000 };

export function loadAutoPrefs() {
  try {
    return { ...DEFAULT_AUTO, ...(JSON.parse(localStorage.getItem(AUTO_KEY) || 'null') || {}) };
  } catch {
    return { ...DEFAULT_AUTO };
  }
}
export function saveAutoPrefs(p) {
  try {
    localStorage.setItem(AUTO_KEY, JSON.stringify(p));
  } catch {
    /* abaikan */
  }
}

// Hash ringan agar tidak mengunggah data yang tidak berubah
export function hashData(data) {
  const str = JSON.stringify(data);
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return `${str.length}:${(h >>> 0).toString(36)}`;
}

export const isAutoDue = (prefs, now = Date.now()) =>
  prefs.enabled && (!prefs.lastAuto || now - new Date(prefs.lastAuto).getTime() >= (FREQ_MS[prefs.frequency] || FREQ_MS.daily));

let running = false;
// Mengembalikan { status: 'off'|'not_due'|'unchanged'|'done'|'needs_auth'|'error'|'busy', prefs }
export async function runAutoBackup(data, { force = false, interactive = false } = {}) {
  let prefs = loadAutoPrefs();
  if (!prefs.enabled) return { status: 'off', prefs };
  if (running) return { status: 'busy', prefs };
  if (!force && !isAutoDue(prefs)) return { status: 'not_due', prefs };
  if (!isDriveLinked() && !interactive) {
    prefs = { ...prefs, needsAuth: true };
    saveAutoPrefs(prefs);
    return { status: 'needs_auth', prefs };
  }
  const hash = hashData(data);
  if (!force && hash === prefs.lastHash) {
    prefs = { ...prefs, lastAuto: new Date().toISOString(), lastError: '', needsAuth: false };
    saveAutoPrefs(prefs);
    return { status: 'unchanged', prefs };
  }
  running = true;
  try {
    const when = await backupToDrive(data, { interactive });
    prefs = { ...prefs, lastAuto: when, lastHash: hash, lastError: '', needsAuth: false };
    saveAutoPrefs(prefs);
    try {
      localStorage.setItem('lifeos:drive_last', when);
    } catch {
      /* abaikan */
    }
    return { status: 'done', prefs };
  } catch (e) {
    const msg = String(e?.message || e);
    const auth = /drive_timeout|drive_cancelled|drive_expired|popup|access_denied|interaction_required|immediate_failed|login_required|consent/i.test(msg);
    prefs = { ...prefs, lastError: auth ? '' : msg, needsAuth: auth };
    saveAutoPrefs(prefs);
    return { status: auth ? 'needs_auth' : 'error', prefs, error: msg };
  } finally {
    running = false;
  }
}
