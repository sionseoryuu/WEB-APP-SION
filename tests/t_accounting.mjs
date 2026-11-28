// Uji akuntansi: setiap entri jurnal seimbang + invarian laporan pada skenario gabungan.
import assert from 'node:assert/strict';
import { buildLedger, trialBalance, balanceSheet, incomeStatement, cashFlow, applySale, depreciationSchedule, assetSummary, stockValue } from '../src/business/bizLogic.js';

let pass = 0;
const t = (name, fn) => { fn(); pass += 1; console.log('ok  -', name); };
const D = '2026-11-10', TO = '2026-12-31';
const entryBalanced = (d) => buildLedger(d).entries.every((e) => Math.abs(e.lines.reduce((s, [, dr, cr]) => s + dr - cr, 0)) < 0.5);

const base = () => ({
  profile: { name: 'Toko', ledgerType: 'business' },
  accounts: [{ id: 'a1', name: 'Kas', type: 'cash', initialBalance: 1000000 }],
  transactions: [], debts: [], sales: [], stockMoves: [{ id: 'm0', kind: 'open', date: '2026-11-01', productId: 'p1', name: 'Kopi', qty: 10, unitCost: 6000 }], assets: [], employees: [], payrolls: [],
  products: [{ id: 'p1', name: 'Kopi', price: 10000, cost: 6000, stock: 10, minStock: 2, track: true, active: true }],
});
const sale = (id, credit, qty) => {
  const total = 10000 * qty;
  return { sale: { id, no: id, date: D, items: [{ productId: 'p1', price: 10000, cost: 6000, qty, tracked: true }], total, subtotal: total, method: credit ? 'Bon' : 'Tunai', accountId: 'a1', txId: credit ? null : `tx-${id}`, ...(credit ? { credit: true, debtId: `d-${id}` } : {}) },
    tx: { id: `tx-${id}`, type: 'income', amount: total, date: D, category: 'Penjualan', description: id, accountId: 'a1', biz: 'sale', refId: id },
    debt: credit ? { id: `d-${id}`, saleId: id, kind: 'receivable', title: id, totalAmount: total, paidAmount: 0, accountId: 'a1' } : null };
};
const collect = (d, id, amt, date) => ({ ...d,
  debts: d.debts.map((x) => (x.saleId === id ? { ...x, paidAmount: x.paidAmount + amt } : x)),
  transactions: [{ id: `c-${id}-${amt}-${date}`, type: 'income', amount: amt, date, category: 'Other Income', description: 'Terima', accountId: 'a1', biz: 'ar_collect', refId: id }, ...d.transactions] });

t('bon dengan 2 pembayaran sebagian: sisa piutang benar & seimbang', () => {
  let d = applySale(base(), sale('S1', true, 5)); // 50.000
  d = collect(d, 'S1', 20000, '2026-11-12'); d = collect(d, 'S1', 10000, '2026-11-15');
  const bs = balanceSheet(d, { to: TO });
  assert.equal(bs.assets.find((r) => /piutang/i.test(r.name)).amount, 20000);
  assert.ok(entryBalanced(d)); assert.ok(trialBalance(d, { to: TO }).balanced); assert.ok(bs.balanced);
});

t('laba kotor = penjualan − HPP (tunai 3 × 10.000, HPP 6.000)', () => {
  const d = applySale(base(), sale('S2', false, 3));
  const is = incomeStatement(d, { from: '2026-11-01', to: TO });
  const flat = JSON.stringify(is);
  assert.ok(flat.includes('30000') && flat.includes('18000'), flat.slice(0, 300));
});

t('aset tetap: penyusutan garis lurus, nilai buku, jumlah total = harga − sisa', () => {
  const a = { id: 'x', name: 'Mesin', date: '2026-01-15', cost: 12000000, salvage: 0, lifeMonths: 24 };
  const s = depreciationSchedule(a, '2027-12-31');
  assert.equal(s.length, 24); assert.equal(s.reduce((x, y) => x + y.amount, 0), 12000000);
  assert.equal(assetSummary(a, '2026-12-31').accumulated, 6000000);
  assert.equal(assetSummary(a, '2026-12-31').bookValue, 6000000);
  const tanah = { ...a, lifeMonths: 0 }; assert.equal(depreciationSchedule(tanah, '2030-01-01').length, 0);
});

t('gabungan: tunai + bon + aset + stok → semua jurnal seimbang; kas akhir arus kas = kas neraca', () => {
  let d = applySale(base(), sale('S3', false, 2));
  d = applySale(d, sale('S4', true, 3));
  d = collect(d, 'S4', 12000, '2026-11-20');
  d = { ...d, assets: [{ id: 'x', name: 'Rak', date: '2026-10-01', cost: 600000, salvage: 0, lifeMonths: 12 }] };
  assert.ok(entryBalanced(d));
  const tb = trialBalance(d, { to: TO }); const bs = balanceSheet(d, { to: TO });
  assert.ok(tb.balanced && bs.balanced);
  const cf = cashFlow(d, { from: '0000-00-00', to: TO });
  const kas = bs.assets.filter((r) => /kas|bank|rekening|dompet/i.test(r.name)).reduce((s, r) => s + r.amount, 0);
  assert.equal(Math.round(cf.closing), Math.round(kas), `arus kas ${cf.closing} vs kas neraca ${kas}`);
});

t('nilai persediaan neraca = nilai stok fisik setelah penjualan', () => {
  const d = applySale(base(), sale('S5', false, 4));
  const inv = balanceSheet(d, { to: TO }).assets.find((r) => /persediaan/i.test(r.name));
  assert.ok(inv, 'akun persediaan ada');
  assert.equal(inv.amount, stockValue(d.products));
});

console.log(`\n${pass} uji akuntansi lulus`);
