// Cloudflare Worker: lisensi seumur hidup dengan penyimpanan di Cloudflare KV.
// Dua jalur aktivasi (keduanya lewat POST / dari app, field `licenseCode`):
//   1) Otomatis: webhook Sociabuzz (POST /webhook/sociabuzz) mencatat email pembeli -> pembeli mengetik email itu di app.
//   2) Manual: kode XXXX-XXXX-XXXX dibuat lewat /admin/generate (admin.html).
// Valid -> token bertanda tangan (seumur hidup), jumlah perangkat dibatasi.
//
// Binding / variabel yang harus diisi di Cloudflare:
//   KV namespace binding  LICENSES
//   Secret  LICENSE_PRIVATE_JWK        (dari keygen.html)
//   Secret  ADMIN_TOKEN                (string acak panjang buatan kamu)
//   Secret  SOCIABUZZ_WEBHOOK_TOKEN    (token yang kamu isi di menu Webhook Sociabuzz)
//   Var     ALLOWED_ORIGIN             contoh: https://sionseoryuu.github.io
//   Var     SOCIABUZZ_ITEM_ID          (opsional) hanya terima pesanan produk ini
//   Var     MAX_DEVICES                (opsional) default 3

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // tanpa huruf/angka yang mirip (0/O, 1/I/L)

const b64u = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const reply = (obj, status, cors) =>
  new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });

// days kosong/0 = seumur hidup; angka positif = masa aktif (dihitung sejak aktivasi pertama)
const parseDays = (d) => {
  const n = parseInt(d, 10);
  return n > 0 ? Math.min(n, 3650) : null;
};
const normalizeCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const prettyCode = (raw) => raw.match(/.{1,4}/g).join('-');

function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

async function signToken(payload, privateJwk) {
  const key = await crypto.subtle.importKey(
    'jwk',
    typeof privateJwk === 'string' ? JSON.parse(privateJwk) : privateJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, bytes);
  return `${b64u(bytes)}.${b64u(sig)}`;
}

function safeEqual(given, expected) {
  if (!expected || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

const isAdmin = (req, env) =>
  safeEqual((req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, ''), env.ADMIN_TOKEN || '');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (e) => String(e || '').trim().toLowerCase();

// Kunci KV: `buyer:<email>` untuk pembeli Sociabuzz, `code:<KODE>` untuk kode manual
function keyFor(input) {
  const v = String(input || '').trim();
  if (v.includes('@')) {
    const email = normalizeEmail(v);
    return EMAIL_RE.test(email) ? `buyer:${email}` : null;
  }
  const code = normalizeCode(v);
  return code.length === 12 ? `code:${code}` : null;
}

async function getRecord(env, key) {
  const raw = await env.LICENSES.get(key);
  return raw ? JSON.parse(raw) : null;
}
const putRecord = (env, key, rec) => env.LICENSES.put(key, JSON.stringify(rec));

// Webhook Sociabuzz: catat pembeli. Idempoten per id pesanan (webhook bisa terkirim ulang).
async function handleSociabuzzWebhook(req, body, env, cors) {
  if (!safeEqual(req.headers.get('sb-webhook-token') || '', env.SOCIABUZZ_WEBHOOK_TOKEN || '')) {
    return reply({ ok: false, error: 'unauthorized' }, 401, cors);
  }
  const email = normalizeEmail(body.buyer_email);
  if (!EMAIL_RE.test(email)) return reply({ ok: true, ignored: 'no_email' }, 200, cors);
  // Notifikasi uji Sociabuzz memakai email contoh; jangan dicatat sebagai pembeli
  if (email.endsWith('@example.com')) return reply({ ok: true, ignored: 'test' }, 200, cors);
  if (env.SOCIABUZZ_ITEM_ID && String(body.item_id) !== String(env.SOCIABUZZ_ITEM_ID)) {
    return reply({ ok: true, ignored: 'other_item' }, 200, cors);
  }
  const orderKey = `order:${body.id}`;
  if (body.id !== undefined && (await env.LICENSES.get(orderKey))) return reply({ ok: true, duplicate: true }, 200, cors);

  const key = `buyer:${email}`;
  const rec = (await getRecord(env, key)) || {
    created: Date.now(),
    max: Math.min(Math.max(parseInt(env.MAX_DEVICES, 10) || 3, 1), 20),
    devices: [],
    revoked: false,
    source: 'sociabuzz',
    name: String(body.buyer_name || '').slice(0, 80),
    orders: [],
  };
  rec.orders.push(String(body.id ?? ''));
  await putRecord(env, key, rec);
  if (body.id !== undefined) await env.LICENSES.put(orderKey, email);
  return reply({ ok: true }, 200, cors);
}

async function handleAdmin(path, body, env, cors) {
  if (path === '/admin/generate') {
    const count = Math.min(Math.max(parseInt(body.count, 10) || 1, 1), 100);
    const max = Math.min(Math.max(parseInt(body.max, 10) || 3, 1), 20);
    const codes = [];
    for (let i = 0; i < count; i++) {
      const raw = newCode();
      await putRecord(env, `code:${raw}`, {
        created: Date.now(), max, devices: [], revoked: false, source: 'code',
        days: parseDays(body.days), note: String(body.note || '').slice(0, 80),
      });
      codes.push(prettyCode(raw));
    }
    return reply({ ok: true, codes }, 200, cors);
  }
  if (path === '/admin/grant') {
    const email = normalizeEmail(body.email);
    if (!EMAIL_RE.test(email)) return reply({ ok: false, error: 'invalid_email' }, 400, cors);
    const key = `buyer:${email}`;
    const days = parseDays(body.days);
    const existing = await getRecord(env, key);
    if (existing) {
      // Jangan menurunkan akses: pembeli seumur hidup tetap seumur hidup; tanpa durasi = naikkan jadi seumur hidup
      if (days === null) existing.days = null;
      else if (existing.days !== null && existing.days !== undefined) existing.days = Math.max(existing.days, days);
      if (days === null) existing.expires = null;
      existing.revoked = false;
      await putRecord(env, key, existing);
      return reply({ ok: true, existing: true, days: existing.days ?? null }, 200, cors);
    }
    await putRecord(env, key, {
      created: Date.now(), max: Math.min(Math.max(parseInt(env.MAX_DEVICES, 10) || 3, 1), 20),
      devices: [], revoked: false, source: 'grant', days, name: String(body.name || '').slice(0, 80),
      note: String(body.note || '').slice(0, 80), orders: [],
    });
    return reply({ ok: true, days }, 200, cors);
  }
  if (path === '/admin/buyers') {
    const list = await env.LICENSES.list({ prefix: 'buyer:', limit: 100 });
    const buyers = [];
    for (const k of list.keys) {
      const r = await getRecord(env, k.name);
      if (r) buyers.push({ email: k.name.slice(6), name: r.name, devices: r.devices.length, max: r.max, revoked: r.revoked, source: r.source || 'sociabuzz', days: r.days ?? null, expires: r.expires ?? null });
    }
    return reply({ ok: true, buyers }, 200, cors);
  }
  const key = keyFor(body.code);
  const rec = key ? await getRecord(env, key) : null;
  if (!rec) return reply({ ok: false, error: 'not_found' }, 404, cors);
  if (path === '/admin/info') return reply({ ok: true, record: { ...rec, devices: rec.devices.length } }, 200, cors);
  if (path === '/admin/reset') {
    rec.devices = [];
    await putRecord(env, key, rec);
    return reply({ ok: true }, 200, cors);
  }
  if (path === '/admin/revoke') {
    rec.revoked = body.revoked !== false;
    await putRecord(env, key, rec);
    return reply({ ok: true, revoked: rec.revoked }, 200, cors);
  }
  return reply({ ok: false, error: 'not_found' }, 404, cors);
}

export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return reply({ ok: false, error: 'method' }, 405, cors);

    const path = new URL(req.url).pathname;
    let body;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    if (path.startsWith('/admin/')) {
      if (!isAdmin(req, env)) return reply({ ok: false, error: 'unauthorized' }, 401, cors);
      return handleAdmin(path, body, env, cors);
    }

    if (path === '/webhook/sociabuzz') return handleSociabuzzWebhook(req, body, env, cors);

    // Aktivasi dari app: email pembelian (Sociabuzz) atau kode lisensi manual
    const key = keyFor(body.licenseCode);
    const deviceId = String(body.deviceId || '').slice(0, 64);
    if (!key || !deviceId) return reply({ ok: false, error: 'invalid_code' }, 400, cors);

    const rec = await getRecord(env, key);
    if (!rec) return reply({ ok: false, error: 'not_found' }, 404, cors);
    if (rec.revoked) return reply({ ok: false, error: 'inactive' }, 403, cors);

    // Akses berdurasi: masa aktif mulai dihitung saat aktivasi pertama
    let dirty = false;
    if (rec.days && !rec.expires) {
      rec.expires = Date.now() + rec.days * 86400000;
      dirty = true;
    }
    if (rec.expires && Date.now() > rec.expires) return reply({ ok: false, error: 'expired' }, 403, cors);

    if (!rec.devices.includes(deviceId)) {
      if (rec.devices.length >= rec.max) return reply({ ok: false, error: 'activation_limit' }, 400, cors);
      rec.devices.push(deviceId);
      dirty = true;
    }
    if (dirty) await putRecord(env, key, rec);

    const payload = { v: 1, lic: key.slice(-6), iat: Date.now() };
    if (rec.expires) payload.exp = rec.expires;
    const token = await signToken(payload, env.LICENSE_PRIVATE_JWK);
    return reply({ ok: true, token }, 200, cors);
  },
};
