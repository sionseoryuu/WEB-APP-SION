// Verifikasi token lisensi secara offline (ECDSA P-256). Token dibuat oleh Worker setelah kode lisensi valid di Mayar.
const b64uToBytes = (str) => {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=');
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

export async function verifyLicenseToken(token, publicJwk) {
  try {
    const [payloadB64, sigB64] = String(token || '').split('.');
    if (!payloadB64 || !sigB64) return null;
    const key = await crypto.subtle.importKey(
      'jwk',
      typeof publicJwk === 'string' ? JSON.parse(publicJwk) : publicJwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      b64uToBytes(sigB64),
      b64uToBytes(payloadB64)
    );
    if (!ok) return null;
    return JSON.parse(new TextDecoder().decode(b64uToBytes(payloadB64)));
  } catch {
    return null;
  }
}

// Token tanpa `exp` = seumur hidup; dengan `exp` = akses berdurasi (hadiah/giveaway)
export const isTokenCurrent = (payload, now = Date.now()) => Boolean(payload) && (!payload.exp || payload.exp > now);
