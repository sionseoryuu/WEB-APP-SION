// Logika murni mode Bisnis (tanpa React). Semua laporan diturunkan dari data yang sudah ada:
// transaksi + penjualan kasir + gerakan stok + slip gaji. Jurnal dibangun otomatis (double-entry),
// sehingga Neraca Saldo dan Neraca pasti seimbang.
import { catName } from '../ewallet/helpers.js';
import { todayYmd } from '../features/dates.js';

export const CAT = {
  sale: 'Penjualan',
  service: 'Jasa / Freelance',
  stock: 'Pembelian Stok',
  payroll: 'Gaji Karyawan',
  ops: 'Sewa & Operasional',
  remit: 'Setoran Potongan Gaji',
  stockLoss: 'Selisih Stok',
  asset: 'Pembelian Aset Tetap',
};

export const n = (v) => Number(v) || 0;
export const newId = (p) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
export const OPEN = '0000-00-00';

export const DEFAULT_POS = {
  shopName: '',
  address: '',
  phone: '',
  footer: 'Terima kasih sudah berbelanja!',
  taxPct: 0,
  taxLabel: 'PPN',
  methods: [
    { name: 'Tunai', accountId: '' },
    { name: 'QRIS', accountId: '' },
    { name: 'Transfer', accountId: '' },
  ],
};

export const isBiz = (data) => data?.profile?.ledgerType === 'business';

export const bizData = (data) => ({
  products: data.products || [],
  sales: data.sales || [],
  employees: data.employees || [],
  payrolls: data.payrolls || [],
  stockMoves: data.stockMoves || [],
  assets: data.assets || [],
  pos: { ...DEFAULT_POS, ...(data.pos || {}), methods: data.pos?.methods?.length ? data.pos.methods : DEFAULT_POS.methods },
});

// Pastikan kategori bisnis ada di daftar kategori kustom
export const withBizCategories = (d) => {
  const inc = new Set(d.customIncomeCategories || []);
  const exp = new Set(d.customExpenseCategories || []);
  [CAT.sale, CAT.service].forEach((c) => inc.add(c));
  [CAT.stock, CAT.payroll, CAT.ops, CAT.remit, CAT.stockLoss, CAT.asset].forEach((c) => exp.add(c));
  return { ...d, customIncomeCategories: [...inc], customExpenseCategories: [...exp] };
};

export const methodAccount = (data, method) => {
  const b = bizData(data);
  const m = b.pos.methods.find((x) => x.name === method);
  const id = m?.accountId;
  return data.accounts.find((a) => a.id === id)?.id || data.accounts[0]?.id || '';
};

export const nextInvoiceNo = (sales, date) => {
  const ymd = date.replace(/-/g, '').slice(2);
  const count = sales.filter((s) => s.date === date).length + 1;
  return `INV-${ymd}-${String(count).padStart(3, '0')}`;
};

// ---------- Periode ----------
export const monthRange = (key) => {
  const [y, m] = key.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${key}-01`, to: `${key}-${String(last).padStart(2, '0')}` };
};
export const thisMonthKey = () => todayYmd().slice(0, 7);

// ---------- Jurnal ----------
const CLS_ORDER = { asset: 1, liab: 2, equity: 3, rev: 4, cogs: 5, exp: 6 };

export function buildLedger(data, lang = 'id') {
  const b = bizData(data);
  const accts = new Map();
  const entries = [];
  const ensure = (id, name, cls) => {
    if (!accts.has(id)) accts.set(id, { id, name, cls });
    return id;
  };
  const kas = (accId) => {
    const a = data.accounts.find((x) => x.id === accId);
    return ensure(`kas:${accId}`, `Kas & Bank — ${a?.name || accId}`, 'asset');
  };
  const J = (date, memo, ...lines) => {
    const clean = lines.filter((l) => n(l[1]) !== 0 || n(l[2]) !== 0);
    if (clean.length) entries.push({ date: date || OPEN, memo, lines: clean });
  };
  const inv = () => ensure('inv', 'Persediaan Barang', 'asset');
  const cap = () => ensure('cap', 'Modal Pemilik', 'equity');
  const wh = () => ensure('wh', 'Utang Potongan Gaji (BPJS/Pajak)', 'liab');

  // Saldo awal rekening/kas
  data.accounts.forEach((a) => J(OPEN, 'Saldo awal', [kas(a.id), n(a.initialBalance), 0], [cap(), 0, n(a.initialBalance)]));

  const txIds = new Set(data.transactions.map((t) => t.id));

  data.transactions.forEach((tx) => {
    const amt = n(tx.amount);
    if (!amt) return;
    if (tx.type === 'income' && tx.biz === 'ar_collect') {
      // Penerimaan piutang dari penjualan kredit: kas bertambah, piutang berkurang (pendapatan sudah diakui saat bon dibuat)
      J(tx.date, tx.description, [kas(tx.accountId), amt, 0], [ensure('ar', 'Piutang Usaha', 'asset'), 0, amt]);
    } else if (tx.type === 'income') {
      const id = ensure(`rev:${tx.category}`, tx.category === CAT.sale ? 'Penjualan' : `Pendapatan — ${catName(tx.category, lang)}`, 'rev');
      J(tx.date, tx.description, [kas(tx.accountId), amt, 0], [id, 0, amt]);
    } else if (tx.type === 'expense') {
      let dr;
      if (tx.biz === 'stock_buy') dr = inv();
      else if (tx.biz === 'asset_buy') dr = ensure('fa', 'Aset Tetap (Harga Perolehan)', 'asset');
      else if (tx.biz === 'payroll') dr = ensure(`exp:${CAT.payroll}`, 'Beban Gaji Karyawan', 'exp');
      else if (tx.category === CAT.remit) dr = wh();
      else if (tx.category === CAT.stock) dr = ensure('purch', 'Pembelian Barang Dagang', 'cogs');
      else if (tx.category === 'Investments') dr = ensure('invest', 'Investasi', 'asset');
      else if (tx.category === 'Vault Allocation') dr = ensure('vault', 'Dana Cadangan / Tabungan', 'asset');
      else dr = ensure(`exp:${tx.category}`, `Beban — ${catName(tx.category, lang)}`, 'exp');
      J(tx.date, tx.description, [dr, amt, 0], [kas(tx.accountId), 0, amt]);
    } else if (tx.type === 'transfer') {
      if (tx.toAccountId) J(tx.date, tx.description, [kas(tx.toAccountId), amt, 0], [kas(tx.accountId), 0, amt]);
      else J(tx.date, tx.description, [ensure('vault', 'Dana Cadangan / Tabungan', 'asset'), amt, 0], [kas(tx.accountId), 0, amt]);
    }
  });

  // HPP dari penjualan kasir (hanya barang yang stoknya dilacak)
  b.sales.forEach((s) => {
    if (s.credit) {
      // Penjualan kredit (bon): pendapatan diakui sekarang, kas diterima nanti
      J(s.date, `Penjualan kredit ${s.no}`, [ensure('ar', 'Piutang Usaha', 'asset'), n(s.total), 0], [ensure(`rev:${CAT.sale}`, 'Penjualan', 'rev'), 0, n(s.total)]);
    } else if (!txIds.has(s.txId)) return;
    const cost = (s.items || []).reduce((a, it) => a + (it.tracked ? n(it.cost) * n(it.qty) : 0), 0);
    J(s.date, `HPP ${s.no}`, [ensure('cogs', 'Harga Pokok Penjualan (HPP)', 'cogs'), cost, 0], [inv(), 0, cost]);
  });

  // Stok awal & selisih stok
  b.stockMoves.forEach((m) => {
    const v = n(m.qty) * n(m.unitCost);
    if (m.kind === 'open') J(m.date, `Stok awal ${m.name || ''}`, [inv(), v, 0], [cap(), 0, v]);
    if (m.kind === 'adjust') {
      if (v < 0) J(m.date, `Selisih stok ${m.name || ''}`, [ensure(`exp:${CAT.stockLoss}`, 'Beban — Selisih Stok', 'exp'), -v, 0], [inv(), 0, -v]);
      else J(m.date, `Selisih stok ${m.name || ''}`, [inv(), v, 0], [ensure('rev:stockgain', 'Pendapatan — Selisih Stok', 'rev'), 0, v]);
    }
  });

  // Potongan gaji yang ditahan (belum disetor)
  b.payrolls.forEach((p) => {
    if (!txIds.has(p.txId)) return;
    const d = n(p.deduction);
    J(p.date, `Potongan gaji ${p.employeeName}`, [ensure(`exp:${CAT.payroll}`, 'Beban Gaji Karyawan', 'exp'), d, 0], [wh(), 0, d]);
  });

  // Aset tetap: perolehan (bila bukan dibeli lewat transaksi kas) + penyusutan garis lurus per bulan
  b.assets.forEach((a) => {
    const cost = n(a.cost);
    if (!cost) return;
    if (!a.txId || !txIds.has(a.txId)) J(a.date, `Aset ${a.name}`, [ensure('fa', 'Aset Tetap (Harga Perolehan)', 'asset'), cost, 0], [cap(), 0, cost]);
    depreciationSchedule(a, today0()).forEach((d) =>
      J(d.date, `Penyusutan ${a.name}`, [ensure('exp:depr', 'Beban Penyusutan', 'exp'), d.amount, 0], [ensure('accdep', 'Akumulasi Penyusutan', 'asset'), 0, d.amount])
    );
  });

  // Piutang & utang berjalan dari modul Utang (hanya bila laporan sampai hari ini)
  const today = todayYmd();
  (data.debts || []).forEach((d) => {
    if (d.saleId) return; // piutang dari penjualan kredit sudah dijurnal lewat penjualan & penerimaannya
    const left = Math.max(0, n(d.totalAmount) - n(d.paidAmount));
    if (!left) return;
    if (d.kind === 'receivable') J(OPEN, `Piutang ${d.counterparty || d.title}`, [ensure('ar', 'Piutang Usaha', 'asset'), left, 0], [cap(), 0, left], );
    else J(OPEN, `Utang ${d.counterparty || d.title}`, [cap(), left, 0], [ensure('ap', 'Utang Usaha / Cicilan', 'liab'), 0, left]);
  });

  return { entries, accts, today };
}

const sumLines = (ledger, { from = '0000-00-00', to = '9999-99-99' }) => {
  const bal = new Map();
  ledger.entries.forEach((e) => {
    if (e.date < from || e.date > to) return;
    e.lines.forEach(([id, dr, cr]) => {
      const cur = bal.get(id) || { dr: 0, cr: 0 };
      cur.dr += n(dr);
      cur.cr += n(cr);
      bal.set(id, cur);
    });
  });
  return bal;
};

const sortRows = (rows) =>
  rows.sort((a, b) => (CLS_ORDER[a.cls] - CLS_ORDER[b.cls]) || (a.id === 'rev:Penjualan' ? -1 : b.id === 'rev:Penjualan' ? 1 : 0) || a.name.localeCompare(b.name));

// ---------- Laporan ----------
export function incomeStatement(data, { from, to, lang = 'id' }) {
  const ledger = buildLedger(data, lang);
  const bal = sumLines(ledger, { from, to });
  const pick = (cls, sign) =>
    [...ledger.accts.values()]
      .filter((a) => a.cls === cls)
      .map((a) => {
        const v = bal.get(a.id) || { dr: 0, cr: 0 };
        return { id: a.id, name: a.name, amount: sign > 0 ? v.cr - v.dr : v.dr - v.cr };
      })
      .filter((r) => Math.round(r.amount) !== 0)
      .sort((x, y) => y.amount - x.amount);
  const revenue = pick('rev', 1);
  const cogs = pick('cogs', -1);
  const expenses = pick('exp', -1);
  const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0);
  const totalCogs = cogs.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expenses.reduce((s, r) => s + r.amount, 0);
  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalExpense;
  return {
    revenue, cogs, expenses, totalRevenue, totalCogs, totalExpense, grossProfit, netProfit,
    margin: totalRevenue ? (netProfit / totalRevenue) * 100 : 0,
    grossMargin: totalRevenue ? (grossProfit / totalRevenue) * 100 : 0,
  };
}

export function trialBalance(data, { to, lang = 'id' }) {
  const ledger = buildLedger(data, lang);
  const bal = sumLines(ledger, { to });
  const rows = sortRows(
    [...ledger.accts.values()].map((a) => {
      const v = bal.get(a.id) || { dr: 0, cr: 0 };
      const net = v.dr - v.cr;
      return { ...a, debit: net > 0 ? net : 0, credit: net < 0 ? -net : 0 };
    }).filter((r) => Math.round(r.debit) !== 0 || Math.round(r.credit) !== 0)
  );
  const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  return { rows, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 1 };
}

export function balanceSheet(data, { to, lang = 'id' }) {
  const ledger = buildLedger(data, lang);
  const bal = sumLines(ledger, { to });
  const val = (a, sign) => {
    const v = bal.get(a.id) || { dr: 0, cr: 0 };
    return sign > 0 ? v.dr - v.cr : v.cr - v.dr;
  };
  const list = (cls, sign) =>
    sortRows([...ledger.accts.values()].filter((a) => a.cls === cls))
      .map((a) => ({ id: a.id, name: a.name, amount: val(a, sign) }))
      .filter((r) => Math.round(r.amount) !== 0);
  const assets = list('asset', 1);
  const liabilities = list('liab', -1);
  const equity = list('equity', -1);
  const profit = [...ledger.accts.values()].reduce((s, a) => {
    if (a.cls === 'rev') return s + val(a, -1);
    if (a.cls === 'cogs' || a.cls === 'exp') return s - val(a, 1);
    return s;
  }, 0);
  equity.push({ id: 'profit', name: 'Laba (Rugi) Berjalan', amount: profit });
  const totalAssets = assets.reduce((s, r) => s + r.amount, 0);
  const totalLiab = liabilities.reduce((s, r) => s + r.amount, 0);
  const totalEquity = equity.reduce((s, r) => s + r.amount, 0);
  return { assets, liabilities, equity, totalAssets, totalLiab, totalEquity, balanced: Math.abs(totalAssets - totalLiab - totalEquity) < 1 };
}

export function salesSummary(data, { from, to }) {
  const b = bizData(data);
  const txIds = new Set(data.transactions.map((t) => t.id));
  const list = b.sales.filter((s) => (s.credit || txIds.has(s.txId)) && s.date >= from && s.date <= to);
  const byProduct = {};
  const byMethod = {};
  const byDay = {};
  let revenue = 0;
  let discount = 0;
  let tax = 0;
  let cogs = 0;
  list.forEach((s) => {
    revenue += n(s.total);
    discount += n(s.discount);
    tax += n(s.tax);
    byMethod[s.method] = (byMethod[s.method] || 0) + n(s.total);
    byDay[s.date] = (byDay[s.date] || 0) + n(s.total);
    (s.items || []).forEach((it) => {
      const k = it.name;
      byProduct[k] = byProduct[k] || { name: k, qty: 0, revenue: 0 };
      byProduct[k].qty += n(it.qty);
      byProduct[k].revenue += n(it.price) * n(it.qty);
      if (it.tracked) cogs += n(it.cost) * n(it.qty);
    });
  });
  return {
    count: list.length, revenue, discount, tax, cogs,
    avg: list.length ? revenue / list.length : 0,
    top: Object.values(byProduct).sort((a, c) => c.qty - a.qty).slice(0, 8),
    byMethod: Object.entries(byMethod).sort((a, c) => c[1] - a[1]),
    byDay,
    list,
  };
}

// ---------- Produk & stok ----------
export const stockValue = (products) => products.filter((p) => p.track !== false).reduce((s, p) => s + n(p.stock) * n(p.cost), 0);
export const lowStock = (products) => products.filter((p) => p.track !== false && p.active !== false && n(p.stock) <= n(p.minStock));
export const buyWeightedCost = (p, qty, unitCost) => {
  const total = n(p.stock) + n(qty);
  if (total <= 0) return n(unitCost);
  return Math.round(((n(p.stock) * n(p.cost)) + n(qty) * n(unitCost)) / total);
};

// ---------- Gaji ----------
export function calcPayslip(emp, input = {}) {
  const days = n(input.days);
  const base = emp.type === 'daily' ? n(emp.baseSalary) * days : n(emp.baseSalary);
  const allowance = n(emp.allowance);
  const overtime = n(input.overtime);
  const bonus = n(input.bonus);
  const gross = base + allowance + overtime + bonus;
  const bpjs = Math.round(((n(emp.deductPct) / 100) * (base + allowance)));
  const other = n(input.otherDeduction);
  const deduction = bpjs + other;
  return { base, allowance, overtime, bonus, gross, bpjs, other, deduction, net: Math.max(0, gross - deduction), days };
}

export const payrollKey = (empId, month) => `${empId}:${month}`;

// ---------- Teks (struk, slip, laporan) ----------
export const rp = (v) => `Rp ${Math.round(n(v)).toLocaleString('id-ID')}`;

export function receiptText(sale, pos, shopFallback = '') {
  const L = [];
  L.push((pos.shopName || shopFallback || 'TOKO').toUpperCase());
  if (pos.address) L.push(pos.address);
  if (pos.phone) L.push(`Telp ${pos.phone}`);
  L.push('--------------------------------');
  L.push(`${sale.no}  ${sale.date} ${sale.time || ''}`.trim());
  if (sale.customer) L.push(`Pelanggan: ${sale.customer}`);
  L.push('--------------------------------');
  (sale.items || []).forEach((it) => {
    L.push(it.name);
    L.push(`  ${it.qty} x ${rp(it.price)} = ${rp(it.qty * it.price)}`);
  });
  L.push('--------------------------------');
  L.push(`Subtotal   ${rp(sale.subtotal)}`);
  if (n(sale.discount)) L.push(`Diskon    -${rp(sale.discount)}`);
  if (n(sale.tax)) L.push(`${pos.taxLabel || 'Pajak'} ${n(sale.taxPct)}%  ${rp(sale.tax)}`);
  L.push(`TOTAL      ${rp(sale.total)}`);
  if (sale.credit) L.push('BON — BELUM LUNAS');
  else L.push(`Bayar (${sale.method})  ${rp(sale.paid)}`);
  if (n(sale.change)) L.push(`Kembali    ${rp(sale.change)}`);
  L.push('--------------------------------');
  if (pos.footer) L.push(pos.footer);
  return L.join('\n');
}

export function payslipText(p, shop = '') {
  const L = [];
  L.push(`SLIP GAJI — ${shop}`.trim());
  L.push(`Periode : ${p.month}`);
  L.push(`Nama    : ${p.employeeName}${p.role ? ` (${p.role})` : ''}`);
  L.push('--------------------------------');
  L.push(`Gaji pokok    ${rp(p.base)}${p.days ? ` (${p.days} hari)` : ''}`);
  if (n(p.allowance)) L.push(`Tunjangan     ${rp(p.allowance)}`);
  if (n(p.overtime)) L.push(`Lembur        ${rp(p.overtime)}`);
  if (n(p.bonus)) L.push(`Bonus         ${rp(p.bonus)}`);
  L.push(`Gaji kotor    ${rp(p.gross)}`);
  if (n(p.bpjs)) L.push(`Pot. BPJS/Pajak -${rp(p.bpjs)}`);
  if (n(p.other)) L.push(`Pot. lain/kasbon -${rp(p.other)}`);
  L.push('--------------------------------');
  L.push(`DITERIMA      ${rp(p.net)}`);
  L.push(`Dibayar       ${p.date}`);
  return L.join('\n');
}

export function reportText({ title, shop, period, lines }) {
  return [`${title} — ${shop}`.trim(), period, '--------------------------------', ...lines].join('\n');
}

export const csvEscape = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCsv = (rows) => rows.map((r) => r.map(csvEscape).join(',')).join('\n');

// ---------- Aset tetap & penyusutan ----------
const today0 = () => todayYmd();
const lastDayOf = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return `${ym}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
};
const addMonths = (ym, k) => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + k, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Jadwal penyusutan garis lurus: bulan perolehan dihitung penuh, berhenti saat umur manfaat habis
// atau nilai buku mencapai nilai sisa. life=0 berarti tidak disusutkan (mis. tanah).
export function depreciationSchedule(a, untilYmd) {
  const life = Math.floor(n(a.lifeMonths));
  const cost = n(a.cost);
  const base = cost - n(a.salvage);
  if (!(life > 0) || !(base > 0) || !a.date) return [];
  const start = a.date.slice(0, 7);
  const lastMonth = untilYmd.slice(0, 7);
  const monthly = base / life;
  const out = [];
  let acc = 0;
  for (let i = 0; i < life; i += 1) {
    const ym = addMonths(start, i);
    if (ym > lastMonth) break;
    const amt = i === life - 1 ? Math.round(base - acc) : Math.round(monthly);
    acc += amt;
    out.push({ date: lastDayOf(ym), amount: amt });
  }
  return out;
}

export function assetSummary(a, asOf = todayYmd()) {
  const sched = depreciationSchedule(a, asOf);
  const accumulated = sched.filter((d) => d.date <= lastDayOf(asOf.slice(0, 7))).reduce((s, d) => s + d.amount, 0);
  const life = Math.floor(n(a.lifeMonths));
  return {
    accumulated,
    bookValue: n(a.cost) - accumulated,
    monthly: life > 0 ? Math.round((n(a.cost) - n(a.salvage)) / life) : 0,
    monthsLeft: life > 0 ? Math.max(0, life - sched.length) : 0,
    fullyDepreciated: life > 0 && sched.length >= life,
  };
}

// ---------- Arus kas (metode langsung) ----------
// Hanya kas yang benar-benar bergerak: penjualan tunai, penerimaan piutang, biaya, gaji, pembelian aset, dll.
// Pindah antar-rekening sendiri (transfer) tidak dihitung karena tidak mengubah total kas.
export function cashFlow(data, { from, to, lang = 'id' }) {
  const opening0 = data.accounts.reduce((s, a) => s + n(a.initialBalance), 0);
  const delta = (tx) => {
    const amt = n(tx.amount);
    if (tx.type === 'income') return amt;
    if (tx.type === 'expense') return -amt;
    if (tx.type === 'transfer' && !tx.toAccountId) return -amt; // ke dana cadangan
    return 0;
  };
  let opening = opening0;
  const groups = { opIn: {}, opOut: {}, invOut: {}, invIn: {} };
  const add = (g, label, v) => {
    g[label] = (g[label] || 0) + v;
  };
  data.transactions.forEach((tx) => {
    const d = delta(tx);
    if (!d) return;
    if (tx.date < from) {
      opening += d;
      return;
    }
    if (tx.date > to) return;
    if (tx.type === 'income') {
      add(groups.opIn, tx.biz === 'ar_collect' ? 'Penerimaan piutang' : tx.category === CAT.sale ? 'Penjualan' : `Pendapatan — ${catName(tx.category, lang)}`, d);
    } else if (tx.type === 'expense') {
      if (tx.biz === 'asset_buy') add(groups.invOut, 'Pembelian aset tetap', -d);
      else if (tx.category === 'Investments') add(groups.invOut, 'Investasi', -d);
      else if (tx.biz === 'stock_buy' || tx.category === CAT.stock) add(groups.opOut, 'Pembelian stok / barang dagang', -d);
      else if (tx.biz === 'payroll') add(groups.opOut, 'Gaji karyawan (bersih)', -d);
      else if (tx.category === CAT.remit) add(groups.opOut, 'Setoran potongan gaji (BPJS/pajak)', -d);
      else add(groups.opOut, `Beban — ${catName(tx.category, lang)}`, -d);
    } else {
      add(groups.invOut, 'Dana cadangan / tabungan', -d);
    }
  });
  const rows = (g) => Object.entries(g).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  const sum = (g) => Object.values(g).reduce((s, v) => s + v, 0);
  const operatingIn = rows(groups.opIn);
  const operatingOut = rows(groups.opOut);
  const investingOut = rows(groups.invOut);
  const netOperating = sum(groups.opIn) - sum(groups.opOut);
  const netInvesting = -sum(groups.invOut);
  const net = netOperating + netInvesting;
  return { opening, operatingIn, operatingOut, investingOut, netOperating, netInvesting, net, closing: opening + net };
}
