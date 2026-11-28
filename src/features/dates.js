// Utilitas tanggal murni (tanpa dependensi) — dipakai semua fitur baru.
export const pad2 = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const todayYmd = () => ymd(new Date());
export const parseYmd = (s) => {
  const [y, m, d] = String(s || '').split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
};
export const addDays = (s, n) => {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
};
export const daysInMonth = (y, m1) => new Date(y, m1, 0).getDate(); // m1 = 1..12
export const monthKey = (s) => String(s).slice(0, 7);
export const addMonthsKey = (key, delta) => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
};
// Hari ke-`day` pada bulan `key`, dipotong ke hari terakhir bulan (31 → 28/29/30).
export const dateInMonth = (key, day) => {
  const [y, m] = key.split('-').map(Number);
  return `${key}-${pad2(Math.min(Math.max(1, day), daysInMonth(y, m)))}`;
};
export const diffDays = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
// Awal minggu (Senin) dari tanggal yang diberikan
export const startOfWeek = (s) => {
  const d = parseYmd(s);
  const wd = (d.getDay() + 6) % 7; // Senin = 0
  d.setDate(d.getDate() - wd);
  return ymd(d);
};
export const localeOf = (lang) => (lang === 'id' ? 'id-ID' : 'en-US');
export const fmtDate = (s, lang, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  parseYmd(s).toLocaleDateString(localeOf(lang), opts);
export const fmtMonth = (key, lang) =>
  parseYmd(`${key}-01`).toLocaleDateString(localeOf(lang), { month: 'long', year: 'numeric' });
// "HH:mm" -> {hour, minute}
export const parseHm = (s, fallback = '09:00') => {
  const [h, m] = String(s || fallback).split(':').map(Number);
  return { hour: Number.isFinite(h) ? h : 9, minute: Number.isFinite(m) ? m : 0 };
};
export const atTime = (dateStr, hm) => {
  const { hour, minute } = parseHm(hm);
  const d = parseYmd(dateStr);
  d.setHours(hour, minute, 0, 0);
  return d;
};
export const newId = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const money = (amount, currency = 'Rp', lang = 'id') => {
  const num = Number(amount) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (currency === 'Rp') return `${sign}Rp ${Math.round(abs).toLocaleString('id-ID')}`;
  return `${sign}${currency}${abs.toLocaleString(localeOf(lang === 'id' ? 'en' : lang), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
