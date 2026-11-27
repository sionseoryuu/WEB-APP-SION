// Baca FOTO struk di perangkat (OCR via tesseract.js), lalu rapikan menjadi
// nama merchant + daftar barang (nama, jumlah, harga) + total.
// Modul OCR dimuat malas (lazy) supaya aplikasi tetap ringan saat dibuka.
let workerPromise = null;

const getWorker = () => {
  if (!workerPromise) {
    workerPromise = import('tesseract.js')
      .then(async ({ createWorker }) => {
        const w = await createWorker('ind+eng');
        await w.setParameters({
          tessedit_pageseg_mode: '4', // satu kolom teks dengan ukuran bervariasi = struk
          preserve_interword_spaces: '1', // jaga jarak kolom nama ↔ harga
          user_defined_dpi: '300',
        });
        return w;
      })
      .catch((err) => {
        workerPromise = null; // izinkan coba lagi (mis. setelah koneksi pulih)
        throw err;
      });
  }
  return workerPromise;
};

// Perbesar, jadikan abu-abu, lalu binarisasi adaptif (tahan bayangan/pencahayaan tak rata)
function prepareImage(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const longSide = Math.max(w, h);
  const scale = Math.min(2.5, Math.max(1, 1600 / longSide), 2000 / longSide);
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, cw, ch);
  const px = ctx.getImageData(0, 0, cw, ch);
  const d = px.data;
  const gray = new Uint8Array(cw * ch);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    gray[j] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  }
  // integral image untuk rata-rata lokal
  const W = cw + 1;
  const integral = new Uint32Array(W * (ch + 1));
  for (let y = 1; y <= ch; y++) {
    let row = 0;
    for (let x = 1; x <= cw; x++) {
      row += gray[(y - 1) * cw + (x - 1)];
      integral[y * W + x] = integral[(y - 1) * W + x] + row;
    }
  }
  const r = Math.max(8, Math.round(Math.min(cw, ch) / 24));
  for (let y = 0; y < ch; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(ch, y + r + 1);
    for (let x = 0; x < cw; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(cw, x + r + 1);
      const sum = integral[y1 * W + x1] - integral[y0 * W + x1] - integral[y1 * W + x0] + integral[y0 * W + x0];
      const mean = sum / ((x1 - x0) * (y1 - y0));
      const v = gray[y * cw + x] < mean * 0.9 ? 0 : 255;
      const k = (y * cw + x) * 4;
      d[k] = d[k + 1] = d[k + 2] = v;
    }
  }
  ctx.putImageData(px, 0, 0);
  return canvas;
}

// img: elemen <img>. Mengembalikan teks hasil OCR.
export async function ocrReceiptImage(img) {
  const worker = await getWorker();
  const { data } = await worker.recognize(prepareImage(img));
  return data?.text || '';
}

// ---------- Pembersihan & parser ----------

// Perbaiki salah baca huruf↔angka pada token yang jelas berupa harga: "Rp78.5OO" → "Rp78.500"
function fixNumberTokens(line) {
  return line
    .split(/(\s+)/)
    .map((tok) => {
      if (/^[Rr]?[Pp]?\.?\d{1,3}[.,][\dOo]{3}$/.test(tok)) return tok.replace(/[Oo]/g, '0');
      if (!/^[Rr]?[Pp]?\.?[\dOoIl|SsBb.,]{3,}$/.test(tok)) return tok;
      const digits = (tok.match(/\d/g) || []).length;
      if (digits < 2 || digits < tok.replace(/^[Rr][Pp]?\.?/, '').length / 2) return tok;
      return tok.replace(/^([Rr][Pp]?\.?)?(.*)$/, (_, pre = '', rest) =>
        pre + rest.replace(/[Oo]/g, '0').replace(/[Il|]/g, '1').replace(/[Ss]/g, '5').replace(/B/g, '8'));
    })
    .join('');
}

// Bentuk "huruf saja" untuk mencocokkan kata kunci walau OCR salah ketik (T0tal, Subtota1, Tun4i)
const fold = (s) =>
  String(s)
    .toLowerCase()
    .replace(/0/g, 'o').replace(/1/g, 'l').replace(/5/g, 's').replace(/4/g, 'a').replace(/\|/g, 'l')
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const SUMMARY_START = /^(sub ?total|total|grand|tunai|cash|kembali|kembalian|change|ppn|pajak|tax|pb ?l?|service|servis|biaya|diskon|discount|bayar|pembayaran|payment|qris|debit|kredit|kartu|ongkir|admin|voucher|jumlah|tagihan|harga|dpp|pembulatan|rounding|hemat|promo)\b/;
const HEADER_LINE = /(tanggal|tgl|date|waktu|jam\b|kasir|cashier|order|pesanan #|nomor|no ?\.|telp|phone|npwp|alamat|\bjl\b|jalan|wifi|terima kasih|thank|selamat|www|http|pelanggan|customer|meja|table)/;

const MONEY_RE = /(?<![\d/:.,#-])(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,9})(?:[.,]\d{1,2})?(?![\d/:A-Za-z])/gi;
const toNumber = (s) => Number(String(s).replace(/[.,]/g, '')) || 0;

function moneyTokens(line) {
  const out = [];
  let m;
  MONEY_RE.lastIndex = 0;
  while ((m = MONEY_RE.exec(line))) {
    const value = toNumber(m[1]);
    if (value >= 500 && value < 1e9) out.push({ index: m.index, end: m.index + m[0].length, value });
  }
  return out;
}

const titleCase = (s) =>
  /[a-z]/.test(s)
    ? s
    : s.toLowerCase().replace(/(^|[\s\-/(])([a-z])/g, (_, a, b) => a + b.toUpperCase());

function cleanName(raw) {
  let s = String(raw)
    .replace(/(?<=[A-Za-z])0(?=[A-Za-z])/g, 'o') // Sp0rt → Sport
    .replace(/(?<=[A-Za-z])5(?=[A-Za-z])/g, 's')
    .replace(/(?<=[A-Za-z])4(?=[A-Za-z])/g, 'a')
    .replace(/(?<=[A-Za-z])3(?=[A-Za-z])/g, 'e')
    .replace(/\|/g, 'I')
    .replace(/[_~=*#<>{}[\]\\^`"“”]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // buang sisa titik-titik/strip pemisah di ujung & huruf tunggal liar di ujung
  s = s.replace(/^[\s.,:;\-–—'()]+|[\s.,:;\-–—'(@xX×]+$/g, '');
  s = s.replace(/\s+[^\w\s]\s*$/g, '').replace(/^[^\w\s]\s+/, '');
  s = s.replace(/\s+[A-Za-z]$/, (m) => (/\s[xX]$/.test(m) ? '' : m)).trim();
  return titleCase(s).slice(0, 42);
}

const letterCount = (s) => (String(s).match(/[A-Za-z]/g) || []).length;

function parseItemLine(line, pendingName) {
  const toks = moneyTokens(line);
  if (!toks.length) return null;
  const last = toks[toks.length - 1];
  if (line.slice(last.end).replace(/[\s.,\-*]/g, '').length > 3) return null; // harga harus di ujung baris
  const total = last.value;
  let qty = 1;
  let head = line.slice(0, toks.length > 1 ? toks[0].index : last.index);

  // "2 x Nasi Goreng ..." atau "2 Nasi Goreng ..."
  let m = head.match(/^\s*(\d{1,2})\s*[xX×]\s*/);
  if (m) {
    qty = Number(m[1]);
    head = head.slice(m[0].length);
  } else if ((m = head.match(/^\s*(\d{1,2})\s+(?=[A-Za-z]{3})/)) && Number(m[1]) <= 20) {
    qty = Number(m[1]);
    head = head.slice(m[0].length);
  }
  // "... 2 x" / "... 2x" / "... @" sebelum harga satuan
  if ((m = head.match(/\s+(\d{1,2})\s*[xX×@]\s*$/))) {
    qty = Number(m[1]);
    head = head.slice(0, m.index);
  } else if ((m = head.match(/\s*[xX×@]\s*(\d{1,2})\s*$/))) {
    qty = Number(m[1]);
    head = head.slice(0, m.index);
  }
  // "Ayam Bakar 1 25.000" (kolom jumlah tanpa tanda x)
  else if ((m = head.match(/\s+(\d{1,2})\s*$/)) && letterCount(head.slice(0, m.index)) >= 3) {
    qty = Number(m[1]);
    head = head.slice(0, m.index);
  }
  // Jika ada harga satuan & total, jumlah = total ÷ satuan
  if (toks.length > 1 && toks[toks.length - 2].value > 0) {
    const ratio = total / toks[toks.length - 2].value;
    if (Number.isInteger(ratio) && ratio >= 1 && ratio <= 99) qty = ratio;
  }

  let name = cleanName(head);
  if (letterCount(name) < 2 && pendingName) name = pendingName;
  if (letterCount(name) < 2) return null;
  return { name, qty, price: total };
}

export function parseReceipt(rawText) {
  const lines = String(rawText || '')
    .split('\n')
    .map((l) => fixNumberTokens(l.replace(/\s+/g, ' ').trim()))
    .filter((l) => l && /[A-Za-z0-9]/.test(l));
  if (!lines.length) return { merchant: '', items: [], total: 0 };

  // Merchant: baris awal yang berisi cukup huruf
  let merchant = '';
  for (const l of lines.slice(0, 8)) {
    const letters = letterCount(l);
    const f = fold(l);
    if (letters < 4 || letters / l.length < 0.5 || HEADER_LINE.test(f) || SUMMARY_START.test(f)) continue;
    merchant = cleanName(l.replace(/[^A-Za-z0-9&'.\- ]/g, ' '));
    if (merchant) break;
  }

  const items = [];
  const strong = [];
  const mid = [];
  const weak = [];
  let inItems = true;
  let pending = '';
  lines.forEach((l, idx) => {
    const f = fold(l);
    const toks = moneyTokens(l);
    const isSummary = SUMMARY_START.test(f);
    if (isSummary) {
      let nums = toks.map((t) => t.value);
      if (!nums.length && lines[idx + 1]) nums = moneyTokens(lines[idx + 1]).map((t) => t.value); // angka di baris bawahnya
      if (nums.length) {
        inItems = false;
        const v = Math.max(...nums);
        if (/\b(ppn|pajak|tax|service|servis|diskon|discount|hemat|kembali|kembalian|change|tunai|cash|pembulatan|rounding|ongkir|admin|biaya|promo|voucher)\b/.test(f)) return;
        if (/^(grand|total (bayar|tagihan|pembayaran|belanja)|jumlah (bayar|tagihan)|tagihan|amount due)/.test(f)) strong.push(v);
        else if (/^total\b/.test(f)) mid.push(v);
        else if (/^(sub ?total|harga|jumlah)/.test(f)) weak.push(v);
      }
      return;
    }
    if (!inItems || idx === 0 && merchant && cleanName(l) === merchant) return;
    if (HEADER_LINE.test(f)) return;
    const item = parseItemLine(l, pending);
    if (item) {
      items.push(item);
      pending = '';
    } else if (letterCount(l) >= 3 && !toks.length) {
      pending = cleanName(l);
    }
  });

  const sum = items.reduce((a, b) => a + b.price, 0);
  let total = 0;
  if (strong.length) total = Math.max(...strong);
  else if (mid.length) total = Math.max(...mid);
  else if (weak.length) total = Math.max(...weak);
  else if (sum > 0) total = sum;

  // Selisih (pajak/biaya/diskon/pembulatan) dijadikan baris sendiri supaya totalnya cocok
  const rows = items.slice(0, 40);
  if (rows.length && total > 0) {
    const rest = total - rows.reduce((a, b) => a + b.price, 0);
    if (rest !== 0 && Math.abs(rest) <= Math.max(total, sum)) {
      rows.push({
        name: Math.abs(rest) < 1000 ? 'Pembulatan' : rest > 0 ? 'Pajak & Biaya' : 'Diskon',
        qty: 1,
        price: rest,
        adjust: true,
      });
    }
  }
  if (!total && !rows.length) {
    // tidak ada pola apa pun: pakai angka terbesar sebagai nominal
    const all = lines.flatMap((l) => (HEADER_LINE.test(fold(l)) ? [] : moneyTokens(l).map((t) => t.value)));
    if (all.length) total = Math.max(...all);
  }
  return { merchant, items: rows, total };
}

// Kompatibel dengan pemanggil lama
export const parseReceiptOcr = (text) => {
  const r = parseReceipt(text);
  return { merchant: r.merchant, amount: r.total };
};
