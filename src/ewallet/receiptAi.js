// Rapikan struk dengan AI lewat Worker (kunci API tidak ada di app). Mengembalikan null bila AI
// belum diatur / gagal, supaya pemanggil jatuh ke OCR + parser lokal.
const API = (import.meta.env.VITE_AI_API || '').replace(/\/$/, '');
export const aiEnabled = Boolean(API);
const LICENSE_KEY = 'lifeos:license:v1';

// image: data URL JPEG (opsional), text: teks struk (opsional)
export async function aiParseReceipt({ image, text, categories }) {
  if (!API) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    let token = '';
    try { token = localStorage.getItem(LICENSE_KEY) || ''; } catch { /* abaikan */ }
    const res = await fetch(`${API}/receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-License-Token': token },
      body: JSON.stringify({ image, text, categories }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.ok || !json.data) return null;
    const d = json.data;
    if (!d.merchant && !d.items?.length && !(d.total > 0)) return null;
    return d;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
