// Enkripsi backup berbasis passphrase (AES-256-GCM + PBKDF2-SHA256).
// Kunci TIDAK disimpan: hanya diturunkan dari passphrase pengguna. Passphrase hilang = data tidak bisa dipulihkan.
const ITER = 310000;
const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (u8) => btoa(String.fromCharCode(...u8));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(pass, salt, iter) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export const isEncryptedBackup = (o) => !!o && o.lifeosEnc === 1 && typeof o.ct === 'string';

export async function encryptBackup(obj, pass) {
  if (!crypto?.subtle) throw new Error('Web Crypto tidak tersedia');
  if (!pass || pass.length < 8) throw new Error('Passphrase minimal 8 karakter');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pass, salt, ITER);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj))));
  return { lifeosEnc: 1, alg: 'AES-256-GCM', kdf: 'PBKDF2-SHA256', iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}

export async function decryptBackup(env, pass) {
  if (!isEncryptedBackup(env)) throw new Error('Format backup terenkripsi tidak valid');
  try {
    const key = await deriveKey(pass, unb64(env.salt), env.iter || ITER);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(env.iv) }, key, unb64(env.ct));
    return JSON.parse(dec.decode(pt));
  } catch {
    throw new Error('Passphrase salah atau file rusak');
  }
}
