// Kunci aplikasi: PIN (di-hash dengan PBKDF2 + garam) dan sidik jari/wajah (Android, via plugin biometrik).
// Semua disimpan hanya di perangkat ini (tidak ikut cadangan/sinkron cloud).
import { Capacitor } from '@capacitor/core';

export const LOCK_KEY = 'lifeos:lock:v1';
export const DEFAULT_LOCK = { enabled: false, salt: '', hash: '', length: 4, biometric: false, timeout: 30, fails: 0, lockedUntil: 0 };
export const TIMEOUT_OPTIONS = [0, 30, 60, 300];

const isNative = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export function loadLock() {
  try {
    return { ...DEFAULT_LOCK, ...(JSON.parse(localStorage.getItem(LOCK_KEY) || 'null') || {}) };
  } catch {
    return { ...DEFAULT_LOCK };
  }
}
export function saveLock(cfg) {
  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify(cfg));
  } catch {
    /* abaikan */
  }
}

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const randomSalt = () => {
  const a = new Uint8Array(16);
  (globalThis.crypto || window.crypto).getRandomValues(a);
  return toHex(a);
};

export async function hashPin(pin, salt) {
  const enc = new TextEncoder();
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const key = await subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
    const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 120000 }, key, 256);
    return `p1:${toHex(bits)}`;
  }
  // Cadangan untuk konteks tidak aman (http): FNV berulang — lebih lemah, tapi tetap bukan teks asli
  let h = 2166136261;
  const s = `${salt}:${pin}`;
  for (let r = 0; r < 5000; r += 1) {
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
  }
  return `f1:${(h >>> 0).toString(16)}`;
}

export async function createLock(pin, prev = DEFAULT_LOCK) {
  const salt = randomSalt();
  return { ...prev, enabled: true, salt, hash: await hashPin(pin, salt), length: pin.length, fails: 0, lockedUntil: 0 };
}

// Hasil: { ok, cfg, wait } — `wait` = detik tunggu bila terkunci sementara
export async function verifyPin(pin, cfg = loadLock()) {
  const now = Date.now();
  if (cfg.lockedUntil && cfg.lockedUntil > now) return { ok: false, cfg, wait: Math.ceil((cfg.lockedUntil - now) / 1000) };
  const ok = (await hashPin(pin, cfg.salt)) === cfg.hash;
  if (ok) {
    const next = { ...cfg, fails: 0, lockedUntil: 0 };
    saveLock(next);
    return { ok: true, cfg: next, wait: 0 };
  }
  const fails = (cfg.fails || 0) + 1;
  // Setiap 5 salah: tunggu 30 dtk, lalu berlipat ganda (maks. 1 jam)
  const wait = fails % 5 === 0 ? Math.min(3600, 30 * 2 ** (fails / 5 - 1)) : 0;
  const next = { ...cfg, fails, lockedUntil: wait ? now + wait * 1000 : 0 };
  saveLock(next);
  return { ok: false, cfg: next, wait };
}

export const disableLock = () => {
  const next = { ...DEFAULT_LOCK };
  saveLock(next);
  return next;
};

// ---------- Biometrik ----------
let bioMod = null;
async function bio() {
  if (!bioMod) bioMod = await import('@aparajita/capacitor-biometric-auth');
  return bioMod;
}

export async function biometricAvailable() {
  if (!isNative()) return false;
  try {
    const { BiometricAuth } = await bio();
    const r = await BiometricAuth.checkBiometry();
    return !!r.isAvailable;
  } catch {
    return false;
  }
}

// reason/cancel = teks yang sudah diterjemahkan
export async function biometricAuth({ reason, cancel, title, subtitle }) {
  try {
    const { BiometricAuth } = await bio();
    await BiometricAuth.authenticate({
      reason,
      cancelTitle: cancel,
      allowDeviceCredential: false,
      androidTitle: title,
      androidSubtitle: subtitle,
      androidConfirmationRequired: false,
    });
    return true;
  } catch {
    return false;
  }
}
