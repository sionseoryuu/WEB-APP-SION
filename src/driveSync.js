// Backup & restore ke Google Drive. Scope tunggal: drive.file
// (app hanya bisa melihat file yang ia buat sendiri).
const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '1035980999137-v3rj893bonk7hpfn7358fpommjprn28g.apps.googleusercontent.com';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'life-os-backup.json';
const TOKEN_KEY = 'lifeos:drive_token';

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
        reject(new Error('Gagal memuat Google Sign-In'));
      };
      document.head.appendChild(s);
    });
  }
  return gisPromise;
}

function readToken() {
  try {
    const t = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || 'null');
    return t && t.exp > Date.now() + 30000 ? t.value : null;
  } catch {
    return null;
  }
}

export async function getToken(interactive = true) {
  const cached = readToken();
  if (cached) return cached;
  await loadGis();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      prompt: interactive ? '' : 'none',
      callback: (res) => {
        if (res.error) return reject(new Error(res.error_description || res.error));
        try {
          sessionStorage.setItem(
            TOKEN_KEY,
            JSON.stringify({ value: res.access_token, exp: Date.now() + (res.expires_in || 3600) * 1000 })
          );
        } catch {
          /* abaikan */
        }
        resolve(res.access_token);
      },
      error_callback: (err) => reject(new Error(err?.type || 'Login dibatalkan')),
    });
    client.requestAccessToken();
  });
}

async function api(token, url, init = {}) {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) } });
  if (res.status === 401) {
    sessionStorage.removeItem(TOKEN_KEY);
    throw new Error('Sesi Google habis, coba lagi');
  }
  if (!res.ok) throw new Error(`Drive error ${res.status}`);
  return res;
}

async function findFile(token) {
  const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
  const res = await api(token, `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,modifiedTime)&orderBy=modifiedTime desc`);
  const json = await res.json();
  return json.files?.[0] || null;
}

export async function backupToDrive(data) {
  const token = await getToken(true);
  const body = JSON.stringify(data);
  const existing = await findFile(token);
  if (existing) {
    await api(token, `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    return new Date().toISOString();
  }
  const boundary = 'lifeos' + Math.random().toString(36).slice(2);
  const meta = JSON.stringify({ name: FILE_NAME, mimeType: 'application/json' });
  const multipart =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
  await api(token, 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipart,
  });
  return new Date().toISOString();
}

export async function restoreFromDrive() {
  const token = await getToken(true);
  const file = await findFile(token);
  if (!file) return null;
  const res = await api(token, `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`);
  return { data: await res.json(), modifiedTime: file.modifiedTime };
}
