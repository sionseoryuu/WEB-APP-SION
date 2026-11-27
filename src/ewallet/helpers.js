// Helper kecil untuk tampilan e-wallet LIFE OS (tanpa dependensi ke App.jsx)

export const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function fmt(amount, currency = 'Rp', masked = false) {
  if (masked) return `${currency} ••••••`;
  const num = Number(amount) || 0;
  const abs = Math.abs(num);
  if (currency === 'Rp') {
    const s = Math.round(abs).toLocaleString('id-ID');
    return num < 0 ? `-Rp ${s}` : `Rp ${s}`;
  }
  const s = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return num < 0 ? `-${currency}${s}` : `${currency}${s}`;
}

// Nama kategori bawaan (tersimpan dalam bahasa Inggris) ditampilkan dalam Bahasa Indonesia
const CAT_ID = {
  'Housing & Utilities': 'Rumah & Tagihan',
  'Dining & Coffee': 'Makan & Kopi',
  Groceries: 'Belanja Harian',
  'Transport & Travel': 'Transportasi & Perjalanan',
  'Software & Subscriptions': 'Software & Langganan',
  'Health & Wellness': 'Kesehatan',
  'Shopping & Lifestyle': 'Belanja & Gaya Hidup',
  Investments: 'Investasi',
  'Debt & Installments': 'Utang & Cicilan',
  'Primary Salary': 'Gaji Utama',
  'Consulting & Advisory': 'Konsultasi',
  'Dividends & Yield': 'Dividen & Imbal Hasil',
  'Client Retainer': 'Retainer Klien',
  'Other Income': 'Pemasukan Lain',
};
export const catName = (cat, lang) => (lang === 'id' ? CAT_ID[cat] || cat : cat);

export const isQrisTx = (tx) => /qris|scan|receipt|struk|barcode/i.test(tx?.paymentMethod || '');

export function dayLabel(dateStr, lang) {
  const today = todayStr();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yest = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  if (dateStr === today) return lang === 'id' ? 'Hari ini' : 'Today';
  if (dateStr === yest) return lang === 'id' ? 'Kemarin' : 'Yesterday';
  const [yy, mm, dd] = dateStr.split('-').map(Number);
  return new Date(yy, mm - 1, dd).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function monthLabel(mk, lang) {
  const [y, m] = mk.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' });
}

// Foto profil: dipotong persegi & dikecilkan agar ringan disimpan/disinkronkan
export function resizeImageToDataUrl(file, size = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const s = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

// Baca payload QRIS (standar EMVCo TLV): nama merchant (59), kota (60), nominal (54)
export function parseQris(raw) {
  const str = String(raw || '');
  if (!str.startsWith('000201')) return null;
  const out = {};
  let i = 0;
  while (i + 4 <= str.length) {
    const tag = str.slice(i, i + 2);
    const len = parseInt(str.slice(i + 2, i + 4), 10);
    if (Number.isNaN(len)) break;
    const val = str.slice(i + 4, i + 4 + len);
    if (tag === '59') out.merchant = val.trim();
    else if (tag === '60') out.city = val.trim();
    else if (tag === '54') out.amount = Number(val) || 0;
    else if (tag === '55') out.feeType = val; // 02 = biaya tetap, 03 = persen
    else if (tag === '56') out.feeFixed = Number(val) || 0;
    else if (tag === '57') out.feePct = Number(val) || 0;
    i += 4 + len;
  }
  // Nominal sudah termasuk biaya layanan/tip bila QR mencantumkannya
  if (out.amount > 0) {
    if (out.feeType === '02' && out.feeFixed) out.amount += out.feeFixed;
    else if (out.feeType === '03' && out.feePct) out.amount = Math.round(out.amount * (1 + out.feePct / 100));
  }
  return out;
}

// Tebak kategori dari nama merchant (hanya kategori bawaan; pengguna tetap bisa ganti)
const GUESS = [
  [/kopi|coffee|cafe|caf[eé]|resto|warung|bakso|mie|nasi|ayam|bakery|roti|food|kitchen|pizza|burger|janji jiwa|starbucks|kfc|mcd/i, 'Dining & Coffee'],
  [/indomaret|alfamart|alfamidi|supermarket|swalayan|hypermart|superindo|lotte|mart\b|toko|pasar/i, 'Groceries'],
  [/grab|gojek|pertamina|spbu|shell|bp\b|parkir|tol|krl|mrt|transjakarta|bluebird|kai|garuda|traveloka/i, 'Transport & Travel'],
  [/apotek|apotik|klinik|rumah sakit|\brs\b|dokter|kimia farma|guardian|watson|gym|fitness/i, 'Health & Wellness'],
  [/pln|pdam|telkom|indihome|listrik|air\b|pulsa/i, 'Housing & Utilities'],
  [/netflix|spotify|youtube|google|apple|software|cloud/i, 'Software & Subscriptions'],
];
export function guessCategory(name) {
  const hit = GUESS.find(([re]) => re.test(String(name || '')));
  return hit ? hit[1] : '';
}
