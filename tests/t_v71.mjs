// Uji logika v7.1: kasir (applySale/applyVoid/voidBlocked/clampQty) + hapus akun (planDelete/matchesPhrase)
import assert from 'node:assert/strict';
import { applySale, applyVoid, voidBlocked, clampQty, trialBalance, balanceSheet, bizData, newId, nextInvoiceNo } from '../src/business/bizLogic.js';
import { planDelete, matchesPhrase, MAIN_WS } from '../src/features/workspaces.js';

let pass = 0;
const t = (name, fn) => { fn(); pass += 1; console.log('ok  -', name); };

const DATE = '2026-11-28';
const base = () => ({
  profile: { name: 'Toko', ledgerType: 'business' },
  accounts: [{ id: 'a1', name: 'Kas', type: 'cash', balance: 0, initialBalance: 0 }],
  transactions: [], debts: [], sales: [], stockMoves: [], assets: [], employees: [], payrolls: [],
  products: [
    { id: 'p1', name: 'Kopi', price: 10000, cost: 6000, stock: 10, minStock: 2, track: true, active: true },
    { id: 'p2', name: 'Jasa', price: 5000, cost: 0, stock: 0, track: false, active: true },
  ],
});
const mkSale = (d, { credit, qty = 3, paid = 0 }) => {
  const no = nextInvoiceNo(d.sales || [], DATE);
  const id = newId('sale'); const txId = newId('tx'); const debtId = newId('dbt');
  const items = [{ productId: 'p1', name: 'Kopi', price: 10000, cost: 6000, qty, tracked: true }];
  const total = 10000 * qty;
  const sale = { id, no, date: DATE, time: '10:00', items, subtotal: total, discount: 0, taxPct: 0, tax: 0, total, method: credit ? 'Bon' : 'Tunai', accountId: 'a1', paid: credit ? 0 : total, change: 0, customer: credit ? 'Budi' : '', txId: credit ? null : txId, ...(credit ? { credit: true, debtId } : {}) };
  const debt = credit ? { id: debtId, saleId: id, kind: 'receivable', title: `Bon ${no}`, counterparty: 'Budi', totalAmount: total, paidAmount: 0, monthlyAmount: total, tenorMonths: 1, dueDate: '', accountId: 'a1' } : null;
  const tx = { id: txId, type: 'income', amount: total, date: DATE, category: 'Penjualan', description: `Penjualan ${no}`, accountId: 'a1', paymentMethod: 'Tunai', biz: 'sale', refId: id, items: [] };
  return { sale, tx, debt };
};
const bal = (d) => ({ tb: trialBalance(d, { to: '2026-12-31' }), bs: balanceSheet(d, { to: '2026-12-31' }) });

t('applySale tunai: transaksi masuk, stok turun, stockMoves bertambah', () => {
  const d0 = base(); const s = mkSale(d0, { credit: false, qty: 3 });
  const d1 = applySale(d0, s);
  assert.equal(d1.transactions.length, 1);
  assert.equal(d1.transactions[0].amount, 30000);
  assert.equal(d1.products.find((p) => p.id === 'p1').stock, 7);
  assert.equal(d1.products.find((p) => p.id === 'p2').stock, 0);
  assert.equal(bizData(d1).stockMoves.length, 1);
  assert.equal(d1.stockMoves[0].qty, -3);
  assert.equal(d1.sales.length, 1);
  const { tb, bs } = bal(d1); assert.ok(tb.balanced); assert.ok(bs.balanced);
});

t('applySale bon: tanpa transaksi kas, ada debt bersaldo saleId, piutang = total, neraca seimbang', () => {
  const d0 = base(); const s = mkSale(d0, { credit: true, qty: 4 });
  const d1 = applySale(d0, s);
  assert.equal(d1.transactions.length, 0);
  assert.equal(d1.debts.length, 1);
  assert.equal(d1.debts[0].saleId, s.sale.id);
  assert.equal(d1.products.find((p) => p.id === 'p1').stock, 6);
  const { tb, bs } = bal(d1); assert.ok(tb.balanced, 'neraca saldo'); assert.ok(bs.balanced, 'neraca');
  const piutang = bs.assets.find((r) => /piutang|receiv/i.test(r.name));
  assert.ok(piutang, 'ada akun piutang di neraca'); assert.equal(piutang.amount, 40000);
});

t('bayar bon (ar_collect): piutang turun, kas naik, tetap seimbang', () => {
  const d0 = base(); const s = mkSale(d0, { credit: true, qty: 4 });
  let d1 = applySale(d0, s);
  d1 = { ...d1,
    debts: d1.debts.map((x) => ({ ...x, paidAmount: 40000 })),
    transactions: [{ id: 'tc', type: 'income', amount: 40000, date: DATE, category: 'Penjualan', description: 'Terima bon', accountId: 'a1', biz: 'ar_collect', refId: s.sale.id }, ...d1.transactions] };
  const { tb, bs } = bal(d1); assert.ok(tb.balanced); assert.ok(bs.balanced);
  const piutang = bs.assets.find((r) => /piutang|receiv/i.test(r.name));
  assert.ok(!piutang || piutang.amount === 0, 'piutang nol');
  const kas = bs.assets.find((r) => /kas|cash/i.test(r.name));
  assert.ok(kas && kas.amount === 40000, `kas naik (dapat ${kas?.amount})`);
});

t('voidBlocked: bon belum dibayar = false; sudah dicicil = true; lewat ar_collect = true; tunai = false', () => {
  const d0 = base(); const s = mkSale(d0, { credit: true });
  const d1 = applySale(d0, s);
  assert.equal(voidBlocked(d1, s.sale), false);
  const paid = { ...d1, debts: d1.debts.map((x) => ({ ...x, paidAmount: 1000 })) };
  assert.equal(voidBlocked(paid, s.sale), true);
  const viaTx = { ...d1, transactions: [{ id: 'z', biz: 'ar_collect', refId: s.sale.id }] };
  assert.equal(voidBlocked(viaTx, s.sale), true);
  const c = mkSale(base(), { credit: false });
  assert.equal(voidBlocked(applySale(base(), c), c.sale), false);
});

t('applyVoid: stok kembali, debt/transaksi/sale/stockMoves hilang', () => {
  const d0 = base(); const s = mkSale(d0, { credit: true, qty: 5 });
  const d1 = applySale(d0, s); assert.equal(d1.products[0].stock, 5);
  const d2 = applyVoid(d1, s.sale);
  assert.equal(d2.products.find((p) => p.id === 'p1').stock, 10);
  assert.equal(d2.debts.length, 0); assert.equal(d2.sales.length, 0); assert.equal(d2.stockMoves.length, 0);
  const c = mkSale(d0, { credit: false, qty: 2 });
  const e2 = applyVoid(applySale(d0, c), c.sale);
  assert.equal(e2.transactions.length, 0); assert.equal(e2.products[0].stock, 10);
});

t('clampQty', () => {
  assert.deepEqual(clampQty('0', 10), { qty: 1, capped: false });
  assert.deepEqual(clampQty('abc', 10), { qty: 1, capped: false });
  assert.deepEqual(clampQty('', 10), { qty: 1, capped: false });
  assert.deepEqual(clampQty('4', 10), { qty: 4, capped: false });
  assert.deepEqual(clampQty('99', 10), { qty: 10, capped: true });
  assert.deepEqual(clampQty('999', null), { qty: 999, capped: false }); // non-stok tanpa batas
  assert.deepEqual(clampQty('3.6', 10), { qty: 4, capped: false });
});

const L3 = [{ id: MAIN_WS, type: 'personal', name: 'Pribadi' }, { id: 'w1', type: 'business', name: 'Toko' }, { id: 'w2', type: 'business', name: 'Kafe' }];
t('planDelete: aktif dihapus → buka akun pertama tersisa', () => {
  const r = planDelete(L3, MAIN_WS, MAIN_WS);
  assert.equal(r.signOut, false); assert.equal(r.open, 'w1'); assert.equal(r.list.length, 2);
  assert.ok(!r.list.some((w) => w.id === MAIN_WS));
});
t('planDelete: non-aktif dihapus → tetap di akun sekarang', () => {
  const r = planDelete(L3, 'w2', 'w1');
  assert.equal(r.open, 'w1'); assert.equal(r.signOut, false); assert.equal(r.list.length, 2);
});
t('planDelete: akun terakhir → signOut', () => {
  const r = planDelete([L3[1]], 'w1', 'w1');
  assert.equal(r.signOut, true); assert.equal(r.open, null); assert.equal(r.list.length, 0);
});
t('matchesPhrase', () => {
  assert.equal(matchesPhrase('  Hapus   AKUN '), true);
  assert.equal(matchesPhrase('hapus akun'), true);
  assert.equal(matchesPhrase('hapus'), false);
  assert.equal(matchesPhrase('hapus akun!'), false);
  assert.equal(matchesPhrase(''), false);
});

console.log(`\n${pass} uji lulus`);
