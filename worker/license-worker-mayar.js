// Cloudflare Worker: memverifikasi kode lisensi ke Mayar (sekali saat aktivasi),
// lalu menerbitkan token bertanda tangan yang diperiksa app secara offline.
//
// Secrets / variables yang harus diisi di Cloudflare:
//   MAYAR_API_KEY       (secret)  API key Mayar
//   MAYAR_PRODUCT_ID    (var)     ID produk Software License di Mayar
//   LICENSE_PRIVATE_JWK (secret)  kunci privat dari keygen.html
//   ALLOWED_ORIGIN      (var)     contoh: https://sionseoryuu.github.io
//   MAYAR_BASE          (var, opsional) default https://api.mayar.id

const b64u = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const reply = (obj, status, cors) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });

async function signToken(payload, privateJwk) {
  const key = await crypto.subtle.importKey(
    'jwk',
    typeof privateJwk === 'string' ? JSON.parse(privateJwk) : privateJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, payloadBytes);
  return `${b64u(payloadBytes)}.${b64u(sig)}`;
}

export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return reply({ ok: false, error: 'method' }, 405, cors);

    let body;
    try {
      body = await req.json();
    } catch {
      return reply({ ok: false, error: 'invalid_code' }, 400, cors);
    }
    const code = String(body.licenseCode || '').trim();
    if (!code || code.length > 100) return reply({ ok: false, error: 'invalid_code' }, 400, cors);

    let res;
    try {
      res = await fetch(`${env.MAYAR_BASE || 'https://api.mayar.id'}/software/v2/license/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.MAYAR_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseCode: code, productId: env.MAYAR_PRODUCT_ID }),
      });
    } catch {
      return reply({ ok: false, error: 'upstream' }, 502, cors);
    }

    // 401/403 = masalah API key kita, BUKAN kode pembeli yang salah
    if (res.status === 401 || res.status === 403) return reply({ ok: false, error: 'server_config' }, 502, cors);
    if (res.status === 404) return reply({ ok: false, error: 'not_found' }, 404, cors);

    const data = await res.json().catch(() => ({}));
    if (res.status === 400) {
      const limit = JSON.stringify(data).toLowerCase().includes('limit');
      return reply({ ok: false, error: limit ? 'activation_limit' : 'not_found' }, 400, cors);
    }
    if (!res.ok) return reply({ ok: false, error: 'upstream' }, 502, cors);
    if (data.isLicenseActive !== true) return reply({ ok: false, error: 'inactive' }, 403, cors);

    // Lisensi seumur hidup: token tanpa tanggal kedaluwarsa
    const token = await signToken({ v: 1, lic: code.slice(-4), iat: Date.now() }, env.LICENSE_PRIVATE_JWK);
    return reply({ ok: true, token }, 200, cors);
  },
};
