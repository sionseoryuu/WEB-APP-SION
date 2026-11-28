// Masuk dengan Google + sinkron/backup ke Google Drive pengguna sendiri.
// Scope: drive.file (app hanya bisa melihat file yang ia buat sendiri) + profil dasar (nama, email).
// Kode galat bersifat netral bahasa (mis. 'drive_expired'); teks untuk pengguna diterjemahkan di UI.
const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '1035980999137-v3rj893bonk7hpfn7358fpommjprn28g.apps.googleusercontent.com';
const SCOPE = 'https://www.googleapis.com/auth/drive.file openid email profile';
const FILE_NAME = 'life-os-backup.json';
const TOKEN_KEY = 'lifeos:drive_token';
const LINKED_KEY = 'lifeos:drive_linked';

// Penanda bahwa pengguna pernah menautkan Drive di perangkat ini (dipakai cadangan otomatis)
export const isDriveLinked = () => {
  try {
    return localStorage.getItem(LINKED_KEY) === '1';
  } catch {
    return false;
  }
};

let gisPromise = null;
function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        gisPromise = null;
        reject(new Error('drive_gis_load'));
      };
      document.head.appendChild(s);
    });
  }
  return gisPromise;
}

function readToken() {
  try {
    const t = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
    return t && t.exp > Date.now() + 30000 ? t.value : null;
  } catch {
    return null;
  }
}

// interactive=false: coba diam-diam (tanpa jendela) — gagal bila izin Google tidak berlaku lagi.
export async function getToken(interactive = true) {
  const cached = readToken();
  if (cached) return cached;
  await loadGis();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('drive_timeout')), interactive ? 120000 : 15000);
    const done = (fn) => (arg) => {
      clearTimeout(timer);
      fn(arg);
    };
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: done((res) => {
        if (res.error) return reject(new Error(res.error_description || res.error));
        try {
          localStorage.setItem(
            TOKEN_KEY,
            JSON.stringify({ value: res.access_token, exp: Date.now() + (res.expires_in || 3600) * 1000 })
          );
          localStorage.setItem(LINKED_KEY, '1');
        } catch {
          /* abaikan */
        }
        return resolve(res.access_token);
      }),
      error_callback: done((err) => reject(new Error(err?.type || 'drive_cancelled'))),
    });
    client.requestAccessToken({ prompt: interactive ? '' : 'none' });
  });
}

async function api(token, url, init = {}) {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) } });
  if (res.status === 401) {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* abaikan */
    }
    throw new Error('drive_expired');
  }
  if (!res.ok) throw new Error(`drive_http_${res.status}`);
  return res;
}

async function findFile(token) {
  const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
  const res = await api(token, `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,modifiedTime)&orderBy=modifiedTime desc`);
  const json = await res.json();
  return json.files?.[0] || null;
}

// Token lama (sebelum ada scope profil) tidak cukup untuk membaca profil, jadi masuk selalu meminta token baru.
export async function signInWithGoogle() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* abaikan */
  }
  const token = await getToken(true);
  const res = await api(token, 'https://www.googleapis.com/oauth2/v3/userinfo');
  const p = await res.json();
  if (!p?.sub) throw new Error('drive_http_0');
  return { token, profile: { sub: p.sub, email: (p.email || '').toLowerCase(), name: p.name || (p.email || '').split('@')[0], picture: p.picture || '' } };
}

// Keluar: lupakan token di perangkat ini (data di Drive pengguna tidak disentuh)
export function forgetDriveToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LINKED_KEY);
  } catch {
    /* abaikan */
  }
}

// Metadata file cloud tanpa mengunduh isinya: { id, modifiedTime } atau null
export async function peekCloud(interactive = false) {
  const token = await getToken(interactive);
  return findFile(token);
}

// Unduh data cloud memakai token yang sudah ada (atau minta token bila perlu)
export async function loadCloud(interactive = false) {
  const token = await getToken(interactive);
  const file = await findFile(token);
  if (!file) return null;
  const res = await api(token, `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`);
  return { data: await res.json(), modifiedTime: file.modifiedTime };
}

export async function backupToDrive(data, { interactive = true } = {}) {
  const token = await getToken(interactive);
  const body = JSON.stringify(data);
  const existing = await findFile(token);
  if (existing) {
    const up = await api(token, `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media&fields=modifiedTime`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    }).then((r) => r.json().catch(() => ({})));
    return up.modifiedTime || new Date().toISOString();
  }
  const boundary = 'lifeos' + Math.random().toString(36).slice(2);
  const meta = JSON.stringify({ name: FILE_NAME, mimeType: 'application/json' });
  const multipart =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
  const created = await api(token, 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=modifiedTime', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipart,
  }).then((r) => r.json().catch(() => ({})));
  return created.modifiedTime || new Date().toISOString();
}

export async function restoreFromDrive() {
  const token = await getToken(true);
  const file = await findFile(token);
  if (!file) return null;
  const res = await api(token, `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`);
  return { data: await res.json(), modifiedTime: file.modifiedTime };
}
