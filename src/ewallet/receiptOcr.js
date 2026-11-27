// Baca teks dari FOTO struk (OCR di perangkat via tesseract.js) lalu tebak merchant & total.
// Modul OCR dimuat malas (lazy) supaya tidak memberatkan aplikasi saat pertama dibuka.
let workerPromise = null;

const getWorker = () => {
  if (!workerPromise) {
    workerPromise = import('tesseract.js')
      .then(({ createWorker }) => createWorker('eng'))
      .catch((err) => {
        workerPromise = null; // izinkan coba lagi (mis. setelah koneksi pulih)
        throw err;
      });
  }
  return workerPromise;
};

// Perbesar/perkecil, jadikan abu-abu & tingkatkan kontras agar teks struk lebih terbaca
function prepareImage(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const scale = Math.min(2, 1800 / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const px = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = px.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const c = Math.max(0, Math.min(255, (g - 128) * 1.35 + 128));
    d[i] = d[i + 1] = d[i + 2] = c;
  }
  ctx.putImageData(px, 0, 0);
  return canvas;
}

// img: elemen <img>. Mengembalikan teks hasil OCR ('' bila gagal).
export async function ocrReceiptImage(img) {
  const worker = await getWorker();
  const { data } = await worker.recognize(prepareImage(img));
  return data?.text || '';
}

// ---- Parser teks struk ----
const toNumber = (s) => {
  let t = String(s).replace(/[^\d.,]/g, '');
  if (!t) return 0;
  // 78.500 / 1.250.000 / 78,500 -> pemisah ribuan
  if (/^\d{1,3}([.,]\d{3})+$/.test(t)) return Number(t.replace(/[.,]/g, ''));
  // 78.500,00 / 78,500.00 -> buang desimal
  t = t.replace(/[.,]\d{1,2}$/, '');
  return Number(t.replace(/[.,]/g, '')) || 0;
};

const NUM_RE = /(?:rp\.?\s*)?\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|(?:rp\.?\s*)\d+|\b\d{4,9}\b/gi;
const TOTAL_RE = /grand\s*total|total\s*(bayar|tagihan|pembayaran|belanja|harga)?|jumlah|tagihan|amount\s*due|harga\s*(pesanan|total)|bayar|subtotal|sub\s*total/i;
const STRONG_TOTAL_RE = /grand\s*total|total\s*(bayar|tagihan|pembayaran|belanja)|jumlah\s*(bayar|tagihan)?|amount\s*due|harga\s*pesanan|tagihan/i;
const SKIP_NUM_LINE_RE = /tunai|cash|kembali|change|kembalian|telp|tel\b|hp\b|phone|npwp|no\.?\s|nomor|order|invoice|inv\b|tanggal|date|waktu|jam|pajak|ppn|tax|diskon|discount|hemat/i;

const numbersIn = (line) =>
  (line.match(NUM_RE) || [])
    .map(toNumber)
    .filter((n) => n >= 500 && n < 1e9); // abaikan angka kecil (qty, jam, tanggal)

export function parseReceiptOcr(text) {
  const lines = String(text || '')
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (!lines.length) return { merchant: '', amount: 0 };

  // Merchant: baris awal yang berisi cukup huruf (bukan alamat/angka/tanggal)
  let merchant = '';
  for (const l of lines.slice(0, 8)) {
    const letters = (l.match(/[A-Za-z]/g) || []).length;
    if (letters < 4 || letters / l.length < 0.5) continue;
    if (/^(jl\.?|jalan|telp|tel\b|alamat|kasir|no\b|tanggal|date)/i.test(l)) continue;
    merchant = l.replace(/[^A-Za-z0-9&'.\- ]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 42);
    if (merchant) break;
  }

  // Nominal: utamakan baris "Total/Jumlah/Tagihan", lalu baris berkata "bayar/subtotal", terakhir angka terbesar
  let amount = 0;
  const strong = [];
  const weak = [];
  const all = [];
  lines.forEach((l, i) => {
    let nums = numbersIn(l);
    // angka kadang ada di baris sesudah label
    if (!nums.length && TOTAL_RE.test(l) && lines[i + 1]) nums = numbersIn(lines[i + 1]);
    if (!nums.length) return;
    if (STRONG_TOTAL_RE.test(l) && !SKIP_NUM_LINE_RE.test(l.replace(STRONG_TOTAL_RE, ''))) strong.push(...nums);
    else if (TOTAL_RE.test(l)) weak.push(...nums);
    if (!SKIP_NUM_LINE_RE.test(l)) all.push(...nums);
  });
  if (strong.length) amount = Math.max(...strong);
  else if (weak.length) amount = Math.max(...weak);
  else if (all.length) amount = Math.max(...all);

  return { merchant, amount };
}
