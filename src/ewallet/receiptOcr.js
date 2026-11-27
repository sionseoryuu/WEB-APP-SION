// Baca FOTO struk di perangkat (OCR via tesseract.js), lalu rapikan menjadi
// nama merchant + daftar barang (nama, jumlah, harga) + total.
// Modul OCR dimuat malas (lazy) supaya aplikasi tetap ringan saat dibuka.
export const OCR_BUILD = 'OCR v3 (crop + angka)';
let workerPromise = null;

const getWorker = () => {
  if (!workerPromise) {
    workerPromise = import('tesseract.js')
      .then(async ({ createWorker }) => {
        const w = await createWorker('eng');
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

const makeCanvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

// Cari kertas struk (area terang terbesar) di foto agar motif kain/meja di sekitarnya tidak ikut terbaca.
// Mengembalikan {x, y, w, h} dalam piksel gambar asli, atau null bila tidak meyakinkan.
function detectReceiptBox(img) {
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  const cell = Math.max(8, Math.round(Math.max(W, H) / 140));
  const gw = Math.floor(W / cell);
  const gh = Math.floor(H / cell);
  if (gw < 8 || gh < 8) return null;
  const small = makeCanvas(gw, gh);
  const sctx = small.getContext('2d', { willReadFrequently: true });
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(img, 0, 0, gw, gh);
  const px = sctx.getImageData(0, 0, gw, gh).data;
  const g = new Float32Array(gw * gh);
  const hist = new Array(64).fill(0);
  for (let i = 0; i < g.length; i++) {
    g[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    hist[Math.min(63, Math.floor(g[i] / 4))]++;
  }
  // ambang Otsu
  const total = g.length;
  let sumAll = 0;
  for (let i = 0; i < 64; i++) sumAll += i * hist[i];
  let wB = 0;
  let sumB = 0;
  let best = 0;
  let bestT = 32;
  for (let i = 0; i < 64; i++) {
    wB += hist[i];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += i * hist[i];
    const mB = sumB / wB;
    const mF = (sumAll - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) {
      best = between;
      bestT = i + 1;
    }
  }
  const thr = bestT * 4;
  // komponen terang terbesar (BFS 4 arah)
  const seen = new Uint8Array(gw * gh);
  let bestComp = null;
  for (let start = 0; start < g.length; start++) {
    if (seen[start] || g[start] <= thr) continue;
    const stack = [start];
    seen[start] = 1;
    let count = 0;
    let x0 = gw;
    let y0 = gh;
    let x1 = 0;
    let y1 = 0;
    while (stack.length) {
      const cur = stack.pop();
      const cx = cur % gw;
      const cy = (cur - cx) / gw;
      count++;
      if (cx < x0) x0 = cx;
      if (cx > x1) x1 = cx;
      if (cy < y0) y0 = cy;
      if (cy > y1) y1 = cy;
      const nbs = [cx > 0 ? cur - 1 : -1, cx < gw - 1 ? cur + 1 : -1, cy > 0 ? cur - gw : -1, cy < gh - 1 ? cur + gw : -1];
      for (const nb of nbs) {
        if (nb >= 0 && !seen[nb] && g[nb] > thr) {
          seen[nb] = 1;
          stack.push(nb);
        }
      }
    }
    if (!bestComp || count > bestComp.count) bestComp = { count, x0, y0, x1, y1 };
  }
  if (!bestComp) return null;
  const frac = bestComp.count / (gw * gh);
  if (frac < 0.08 || frac > 0.92) return null;
  const m = 2;
  const bx0 = Math.max(0, bestComp.x0 - m) * cell;
  const by0 = Math.max(0, bestComp.y0 - m) * cell;
  const bx1 = Math.min(gw, bestComp.x1 + 1 + m) * cell;
  const by1 = Math.min(gh, bestComp.y1 + 1 + m) * cell;
  return { x: bx0, y: by0, w: Math.min(W, bx1) - bx0, h: Math.min(H, by1) - by0 };
}

// Potong area struk dari gambar ASLI (resolusi penuh), skalakan ke ukuran teks yang nyaman dibaca,
// lalu ratakan pencahayaan (bayangan/lipatan) tanpa memutihkan-hitamkan paksa.
function prepareImage(img, box) {
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  const sx = box ? box.x : 0;
  const sy = box ? box.y : 0;
  const sw = box ? box.w : W;
  const sh = box ? box.h : H;
  const target = box ? 1200 : 1600; // lebar yang dituju
  const scale = Math.min(2.5, Math.max(0.35, target / sw));
  const cw = Math.round(sw * scale);
  const ch = Math.round(sh * scale);
  const canvas = makeCanvas(cw, ch);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  const px = ctx.getImageData(0, 0, cw, ch);
  const d = px.data;
  const gray = new Uint8Array(cw * ch);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    gray[j] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  }
  const W1 = cw + 1;
  const integral = new Uint32Array(W1 * (ch + 1));
  for (let y = 1; y <= ch; y++) {
    let row = 0;
    for (let x = 1; x <= cw; x++) {
      row += gray[(y - 1) * cw + (x - 1)];
      integral[y * W1 + x] = integral[(y - 1) * W1 + x] + row;
    }
  }
  const r = Math.max(15, Math.round(Math.min(cw, ch) / 10));
  for (let y = 0; y < ch; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(ch, y + r + 1);
    for (let x = 0; x < cw; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(cw, x + r + 1);
      const sum = integral[y1 * W1 + x1] - integral[y0 * W1 + x1] - integral[y1 * W1 + x0] + integral[y0 * W1 + x0];
      const mean = sum / ((x1 - x0) * (y1 - y0));
      const ratio = gray[y * cw + x] / Math.max(1, mean);
      const v = Math.max(0, Math.min(1, (ratio - 0.45) / 0.55)) * 255;
      const k = (y * cw + x) * 4;
      d[k] = d[k + 1] = d[k + 2] = v;
    }
  }
  ctx.putImageData(px, 0, 0);
  return canvas;
}

const MONEY_OK = /^(\d{1,3}([.,]\d{3})+|\d{4,6})$/;

// Pass kedua: baca ulang angka di ujung kanan tiap baris dengan mode "hanya angka".
// Mengatasi salah baca khas struk seperti 39.000 → 39.800 atau 3.545 → 3.945.
async function refineNumbers(worker, canvas, lines) {
  const out = [];
  await worker.setParameters({ tessedit_char_whitelist: '0123456789.,', tessedit_pageseg_mode: '8' });
  try {
    let budget = 30;
    for (const line of lines) {
      const text = String(line.text || '').replace(/\s+$/, '');
      const words = line.words || [];
      const last = words[words.length - 1];
      const tok = last ? String(last.text || '') : '';
      const digits = (tok.match(/\d/g) || []).length;
      if (!last || !last.bbox || digits < 2 || /[:/-]/.test(tok) || budget <= 0 || !text.endsWith(tok)) {
        out.push(text);
        continue;
      }
      budget--;
      try {
        const { x0, y0, x1, y1 } = last.bbox;
        const h = y1 - y0;
        const pad = Math.round(h * 0.35);
        const sx = Math.max(0, x0 - pad);
        const sy = Math.max(0, y0 - pad);
        const sw = Math.min(canvas.width, x1 + pad) - sx;
        const sh = Math.min(canvas.height, y1 + pad) - sy;
        const c = makeCanvas(sw * 2 + 40, sh * 2 + 40);
        const cx = c.getContext('2d');
        cx.fillStyle = '#fff';
        cx.fillRect(0, 0, c.width, c.height);
        cx.imageSmoothingQuality = 'high';
        cx.drawImage(canvas, sx, sy, sw, sh, 20, 20, sw * 2, sh * 2);
        const { data } = await worker.recognize(c);
        const num = String(data?.text || '').replace(/\s+/g, '');
        if (MONEY_OK.test(num)) {
          const prefix = /^[Rr][Pp]?\.?/.exec(tok)?.[0] || '';
          out.push(text.slice(0, text.length - tok.length) + prefix + num);
          continue;
        }
      } catch {
        /* pakai hasil pass pertama */
      }
      out.push(text);
    }
  } finally {
    await worker.setParameters({ tessedit_char_whitelist: '', tessedit_pageseg_mode: '4' });
  }
  return out.join('\n');
}

async function recognizeOnce(worker, img, box) {
  const canvas = prepareImage(img, box);
  const { data } = await worker.recognize(canvas);
  const lines = (data?.lines || []).filter((l) => (l.text || '').trim() && (l.confidence === undefined || l.confidence >= 45));
  if (!lines.length) return data?.text || '';
  try {
    return await refineNumbers(worker, canvas, lines);
  } catch {
    return lines.map((l) => l.text.trim()).join('\n');
  }
}

// Foto struk (dipotong dari latarnya, warna asli) sebagai JPEG kecil untuk dikirim ke AI.
export function receiptToJpeg(img, maxSide = 1400, quality = 0.82) {
  const box = detectReceiptBox(img);
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;
  const sx = box ? box.x : 0;
  const sy = box ? box.y : 0;
  const sw = box ? box.w : W;
  const sh = box ? box.h : H;
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  const canvas = makeCanvas(sw * scale, sh * scale);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

// img: elemen <img>. Mengembalikan teks hasil OCR (sudah dirapikan).
export async function ocrReceiptImage(img) {
  const worker = await getWorker();
  const box = detectReceiptBox(img);
  const text = await recognizeOnce(worker, img, box);
  if (box) {
    // Bila pemotongan meleset (tidak ada hasil berarti), ulangi dengan seluruh foto
    const r = parseReceipt(text);
    if (!r.items.length && !(r.total > 0)) {
      const full = await recognizeOnce(worker, img, null);
      const rf = parseReceipt(full);
      if (rf.items.length || rf.total > 0) return full;
    }
  }
  return text;
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

const KEYWORDS = ['total', 'subtotal', 'tunai', 'kembali', 'kembalian', 'diskon', 'discount', 'service', 'servis', 'pajak', 'bayar', 'pembayaran', 'tagihan', 'jumlah', 'ongkir', 'voucher', 'payment', 'pembulatan', 'tanggal', 'pelanggan', 'kasir', 'metode', 'nomor'];
const lev1 = (a, b) => {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const ra = a.slice(i);
  const rb = b.slice(i);
  return ra.slice(1) === rb.slice(1) || ra.slice(1) === rb || ra === rb.slice(1);
};
// "lotal Bayar" → "total bayar" (salah baca 1 huruf pada kata kunci)
const canon = (f) =>
  f.split(' ').map((w, i) => {
    if (i > 1 || w.length < 5) return w;
    const hit = KEYWORDS.find((k) => k.length >= 5 && lev1(w, k));
    return hit || w;
  }).join(' ');

const SUMMARY_START = /^(sub ?total|total|grand|tunai|cash|kembali|kembalian|change|ppn|pajak|tax|pb ?l?|service|servis|biaya|diskon|discount|bayar|pembayaran|payment|qris|debit|kredit|kartu|ongkir|admin|voucher|jumlah|tagihan|harga|dpp|pembulatan|rounding|hemat|promo)\b/;
const MONTH = /\b(jan(uari)?|feb(ruari)?|mar(et)?|apr(il)?|mei|may|jun[ie]?|jul[iy]?|agu(stus)?|ags|aug(ust)?|sep(t|tember)?|okt(ober)?|oct(ober)?|nov(ember)?|des(ember)?|dec(ember)?)\b/;
const HEADER_LINE = /(metode|tanggal|tgl|date|waktu|jam\b|kasir|cashier|order|pesanan #|nomor|no ?\.|telp|phone|npwp|alamat|\bjl\b|jalan|wifi|terima kasih|thank|selamat|www|http|pelanggan|customer|meja|table)/;

const MONEY_RE = /(?<![\d/:.,#-])(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{4,6})(?:[.,]\d{1,2})?(?![\d/:A-Za-z])/gi;
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
// Nama yang masuk akal: cukup huruf dan tidak penuh angka/simbol (buang sampah hasil salah baca)
const looksLikeName = (s, min = 3, ratio = 0.55) => {
  const t = String(s).replace(/\s+/g, '');
  return letterCount(t) >= min && letterCount(t) / t.length >= ratio;
};

function parseItemLine(line, pendingName) {
  const toks = moneyTokens(line);
  if (!toks.length) return null;
  const last = toks[toks.length - 1];
  if (line.slice(last.end).replace(/[\s.,\-*]/g, '').length > 3) return null; // harga harus di ujung baris
  let total = last.value;
  let qty = 1;
  let head = line.slice(0, toks.length > 1 ? toks[0].index : last.index);

  // "2 x Nasi Goreng ..." atau "2 Nasi Goreng ..."
  let explicitQty = false;
  let m = head.match(/^\s*(\d{1,2})\s*[xX×]\s*/);
  if (m) {
    qty = Number(m[1]);
    explicitQty = true;
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
    // "1 x 39000" + total salah baca → percaya jumlah × harga satuan
    else if (explicitQty && qty >= 1) total = qty * toks[toks.length - 2].value;
  }

  let name = cleanName(head);
  if (!looksLikeName(name, 2) && pendingName) name = pendingName;
  if (!looksLikeName(name, 3)) return null;
  return { name, qty, price: total };
}

// Selisih antara jumlah semua barang dan total struk (pajak/biaya/diskon/pembulatan) dijadikan baris sendiri
// supaya total di aplikasi sama dengan total di struk.
export function reconcileRows(items, total) {
  const rows = items.slice(0, 40).map((it) => ({ ...it }));
  const sum = rows.reduce((a, b) => a + b.price, 0);
  if (rows.length && total > 0) {
    const rest = total - sum;
    if (rest !== 0 && Math.abs(rest) <= Math.max(total, sum)) {
      rows.push({
        name: Math.abs(rest) < 1000 ? 'Pembulatan' : rest > 0 ? 'Pajak & Biaya' : 'Diskon',
        qty: 1,
        price: rest,
        adjust: true,
      });
    }
  }
  return rows;
}

export function parseReceipt(rawText) {
  const lines = String(rawText || '')
    .split('\n')
    .map((l) => fixNumberTokens(l.replace(/\s+/g, ' ').trim()))
    .filter((l) => l && /[A-Za-z0-9]/.test(l));
  if (!lines.length) return { merchant: '', items: [], total: 0 };

  // Merchant: utamakan baris tepat sebelum alamat (Jl./Jalan); logo stylish sering salah baca.
  const okMerchant = (l) => {
    const f = canon(fold(l));
    return letterCount(l) >= 4 && looksLikeName(l, 4, 0.7) && !HEADER_LINE.test(f) && !SUMMARY_START.test(f) && !MONTH.test(f);
  };
  let merchant = '';
  const head = lines.slice(0, 10);
  const addrIdx = head.findIndex((l) => /^(jl|jln|jalan)\b/.test(fold(l)));
  if (addrIdx > 0 && okMerchant(head[addrIdx - 1])) merchant = cleanName(head[addrIdx - 1].replace(/[^A-Za-z0-9&'.\- ]/g, ' '));
  if (!merchant) {
    for (const l of head.slice(0, 8)) {
      if (!okMerchant(l)) continue;
      merchant = cleanName(l.replace(/[^A-Za-z0-9&'.\- ]/g, ' '));
      if (merchant) break;
    }
  }

  const items = [];
  const strong = [];
  const mid = [];
  const weak = [];
  let inItems = true;
  let pending = '';
  let pendingIdx = -2;
  lines.forEach((l, idx) => {
    const f = canon(fold(l));
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
    if (HEADER_LINE.test(f) || MONTH.test(f) || /\s[:;]\s|\s[:;]$/.test(l)) return;
    const item = parseItemLine(l, pendingIdx === idx - 1 ? pending : '');
    if (item) {
      items.push(item);
      pending = '';
    } else if (looksLikeName(l, 3) && !toks.length) {
      pending = cleanName(l);
      pendingIdx = idx;
    }
  });

  const sum = items.reduce((a, b) => a + b.price, 0);
  let total = 0;
  if (strong.length) total = Math.max(...strong);
  else if (mid.length) total = Math.max(...mid);
  else if (weak.length) total = Math.max(...weak);
  else if (sum > 0) total = sum;

  const rows = reconcileRows(items, total);
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
