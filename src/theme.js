// Sistem tema: 3 warna utama (latar, teks, aksen) + 3 warna opsional (kartu, garis, teks redup).
// Warna turunan dihitung otomatis supaya tampilan tetap serasi.

const BASE = { bg: '#171412', text: '#F4E9DC', accent: '#B68B61' };
// Tema bawaan memakai warna kartu/garis/teks redup asli agar tampilan awal tidak berubah
export const DEFAULT_THEME = { ...BASE, surface: '#241B17', border: '#624332', muted: '#A99B90' };

export const PRESETS = [
  { id: 'brown', name: { id: 'Cokelat Gelap', en: 'Dark Brown' }, ...DEFAULT_THEME },
  { id: 'light', name: { id: 'Terang', en: 'Light' }, bg: '#F7F2EA', text: '#2B2119', accent: '#9A6B3F' },
  { id: 'midnight', name: { id: 'Midnight', en: 'Midnight' }, bg: '#0F172A', text: '#E2E8F0', accent: '#38BDF8' },
  { id: 'forest', name: { id: 'Hutan', en: 'Forest' }, bg: '#0F1A14', text: '#E6F0E3', accent: '#6FBF8E' },
  { id: 'rose', name: { id: 'Mawar', en: 'Rose' }, bg: '#1A1215', text: '#F5E6EA', accent: '#E07A9B' },
];

const STORAGE_KEY = 'lifeos:theme:v1';

const hexToRgb = (hex) => {
  const h = String(hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const triplet = (rgb) => rgb.join(' ');

const luminance = ([r, g, b]) => {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

export function contrastRatio(hexA, hexB) {
  const la = luminance(hexToRgb(hexA));
  const lb = luminance(hexToRgb(hexB));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Hitung semua warna dari tema (override opsional: surface, border, muted)
export function deriveColors(theme) {
  const t = { ...BASE, ...theme };
  const bg = hexToRgb(t.bg);
  const text = hexToRgb(t.text);
  const accent = hexToRgb(t.accent);
  return {
    bg,
    text,
    accent,
    surface: t.surface ? hexToRgb(t.surface) : mix(bg, text, 0.06),
    surface2: mix(t.surface ? hexToRgb(t.surface) : bg, text, t.surface ? 0.06 : 0.11),
    border: t.border ? hexToRgb(t.border) : mix(bg, accent, 0.5),
    muted: t.muted ? hexToRgb(t.muted) : mix(bg, text, 0.66),
    soft: mix(accent, text, 0.75),
    accentDark: mix(accent, bg, 0.3),
  };
}

export function applyTheme(theme) {
  const c = deriveColors(theme);
  const root = document.documentElement;
  const map = {
    '--life-bg': c.bg,
    '--life-surface': c.surface,
    '--life-surface2': c.surface2,
    '--life-border': c.border,
    '--life-muted': c.muted,
    '--life-text': c.text,
    '--life-soft': c.soft,
    '--life-accent': c.accent,
    '--life-accent-dark': c.accentDark,
  };
  Object.entries(map).forEach(([k, v]) => root.style.setProperty(k, triplet(v)));
  const hex = '#' + c.bg.map((v) => v.toString(16).padStart(2, '0')).join('');
  root.style.colorScheme = luminance(c.bg) > 0.4 ? 'light' : 'dark';
  document.body && (document.body.style.background = hex);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', hex);
}

export function loadTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...BASE, ...JSON.parse(raw) } : { ...DEFAULT_THEME };
  } catch {
    return { ...DEFAULT_THEME };
  }
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  } catch {
    /* abaikan */
  }
}
