import React, { useState } from 'react';
import { Plus, PackagePlus, Pencil, Package, ClipboardCheck, Trash2, Search } from 'lucide-react';
import { Btn, Empty, SelectField, Sheet, TextField, ToggleRow } from '../features/ui.jsx';
import { CAT, bizData, buyWeightedCost, lowStock, n, newId, rp, stockValue, withBizCategories } from './bizLogic.js';
import { Stat } from './bizUi.jsx';
import { todayYmd } from '../features/dates.js';

const blank = { name: '', sku: '', category: '', unit: 'pcs', price: '', cost: '', stock: '', minStock: '3', track: true };

export default function BizStock({ data, setData, notify, askConfirm, lang, maskBalances }) {
  const b = bizData(data);
  const L = (a, e) => (lang === 'id' ? a : e);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null); // { id?, ...fields }
  const [buy, setBuy] = useState(null);
  const [count, setCount] = useState(null);
  const low = lowStock(b.products);
  const list = b.products.filter((p) => !q || `${p.name} ${p.sku || ''} ${p.category || ''}`.toLowerCase().includes(q.toLowerCase()));

  const saveProduct = () => {
    const f = form;
    const base = {
      name: f.name.trim(), sku: f.sku.trim(), category: f.category.trim(), unit: f.unit.trim() || 'pcs',
      price: n(f.price), cost: n(f.cost), minStock: n(f.minStock), track: f.track, active: true,
    };
    if (!base.name) return;
    if (f.id) {
      setData((prev) => ({ ...prev, products: bizData(prev).products.map((p) => (p.id === f.id ? { ...p, ...base } : p)) }));
    } else {
      const id = newId('prd');
      const stock = base.track ? n(f.stock) : 0;
      setData((prev) => {
        const pb = bizData(prev);
        const moves = stock > 0 ? [{ id: newId('mv'), date: todayYmd(), productId: id, name: base.name, qty: stock, unitCost: base.cost, kind: 'open' }] : [];
        return { ...prev, products: [...pb.products, { id, ...base, stock }], stockMoves: [...pb.stockMoves, ...moves] };
      });
    }
    setForm(null);
    notify(L('Produk disimpan', 'Product saved'));
  };

  const doBuy = () => {
    const p = b.products.find((x) => x.id === buy.id);
    const qty = n(buy.qty);
    const unitCost = n(buy.unitCost);
    if (!p || qty <= 0) return;
    const date = todayYmd();
    const tx = {
      id: newId('tx'), type: 'expense', amount: Math.round(qty * unitCost), date, category: CAT.stock,
      description: `Beli stok ${p.name}`, accountId: buy.accountId, paymentMethod: 'Transfer', notes: buy.supplier ? `Supplier: ${buy.supplier}` : '', biz: 'stock_buy',
    };
    setData((prev) => {
      const pb = bizData(prev);
      return withBizCategories({
        ...prev,
        transactions: tx.amount > 0 ? [tx, ...prev.transactions] : prev.transactions,
        products: pb.products.map((x) => (x.id === p.id ? { ...x, stock: n(x.stock) + qty, cost: buyWeightedCost(x, qty, unitCost) } : x)),
        stockMoves: [...pb.stockMoves, { id: newId('mv'), date, productId: p.id, name: p.name, qty, unitCost, kind: 'buy' }],
      });
    });
    setBuy(null);
    notify(L(`Stok ${p.name} +${qty}`, `${p.name} stock +${qty}`));
  };

  const doCount = () => {
    const p = b.products.find((x) => x.id === count.id);
    const actual = n(count.actual);
    const delta = actual - n(p.stock);
    if (delta === 0) { setCount(null); return; }
    setData((prev) => {
      const pb = bizData(prev);
      return {
        ...prev,
        products: pb.products.map((x) => (x.id === p.id ? { ...x, stock: actual } : x)),
        stockMoves: [...pb.stockMoves, { id: newId('mv'), date: todayYmd(), productId: p.id, name: p.name, qty: delta, unitCost: n(p.cost), kind: 'adjust' }],
      };
    });
    setCount(null);
    notify(L('Stok disesuaikan', 'Stock adjusted'));
  };

  const remove = (p) =>
    askConfirm(L('Hapus Produk', 'Delete Product'), L(`Hapus "${p.name}"? Riwayat penjualan tetap tersimpan.`, `Delete "${p.name}"?`), () => {
      setData((prev) => ({ ...prev, products: bizData(prev).products.filter((x) => x.id !== p.id) }));
      setForm(null);
    });

  const F = form;
  const set = (k, v) => setForm({ ...F, [k]: v });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        <Stat label={L('Produk', 'Products')} value={String(b.products.length)} />
        <Stat label={L('Nilai Stok', 'Stock Value')} value={maskBalances ? 'Rp ••••' : rp(stockValue(b.products))} />
        <Stat label={L('Stok Menipis', 'Low Stock')} value={String(low.length)} tone={low.length ? 'neg' : undefined} />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-life-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L('Cari produk', 'Search products')} className="w-full rounded-xl bg-life-surface border border-life-border/50 pl-9 pr-3 py-2.5 text-sm text-life-text placeholder-life-muted/60 focus:outline-none focus:border-life-accent min-h-[44px]" />
        </div>
        <Btn onClick={() => setForm({ ...blank })}><Plus className="w-4 h-4" /> {L('Produk', 'Product')}</Btn>
      </div>

      {b.products.length === 0 ? (
        <Empty icon={Package} title={L('Belum ada produk', 'No products yet')} text={L('Tambah produk agar bisa dijual di Kasir, dengan stok dan HPP otomatis.', 'Add products to sell them in POS with automatic stock and COGS.')}>
          <Btn onClick={() => setForm({ ...blank })}><Plus className="w-4 h-4" /> {L('Tambah Produk', 'Add Product')}</Btn>
        </Empty>
      ) : (
        <div className="rounded-2xl bg-life-surface border border-life-border/40 divide-y divide-life-border/30">
          {list.map((p) => {
            const isLow = p.track !== false && n(p.stock) <= n(p.minStock);
            return (
              <div key={p.id} className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-life-text truncate">{p.name}</p>
                  <p className="text-[11px] text-life-muted truncate tabular-nums">
                    {rp(p.price)} · {L('modal', 'cost')} {rp(p.cost)}{p.category ? ` · ${p.category}` : ''}
                  </p>
                </div>
                {p.track !== false ? (
                  <span className={`px-2 py-1 rounded-lg text-[11px] font-semibold tabular-nums ${isLow ? 'bg-[#D96B52]/20 text-[#F29B87]' : 'bg-life-bg text-life-soft'}`}>{n(p.stock)} {p.unit}</span>
                ) : (
                  <span className="px-2 py-1 rounded-lg text-[11px] bg-life-bg text-life-muted">{L('Jasa', 'Service')}</span>
                )}
                {p.track !== false && (
                  <button onClick={() => setBuy({ id: p.id, qty: '', unitCost: String(p.cost || ''), accountId: data.accounts[0]?.id || '', supplier: '' })} className="p-2 rounded-xl bg-life-accent/15 text-life-accent" aria-label={L('Tambah stok', 'Restock')}><PackagePlus className="w-4 h-4" /></button>
                )}
                <button onClick={() => setForm({ ...p, price: String(p.price), cost: String(p.cost), stock: String(p.stock), minStock: String(p.minStock) })} className="p-2 rounded-xl bg-life-bg text-life-soft" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
              </div>
            );
          })}
        </div>
      )}

      <Sheet open={!!F} onClose={() => setForm(null)} title={F?.id ? L('Ubah Produk', 'Edit Product') : L('Produk Baru', 'New Product')} closeLabel="Tutup">
        {F && (
          <>
            <TextField label={L('Nama produk', 'Product name')} value={F.name} onChange={(e) => set('name', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label={L('Harga jual', 'Sell price')} type="number" inputMode="numeric" value={F.price} onChange={(e) => set('price', e.target.value)} />
              <TextField label={L('Harga modal (HPP)', 'Cost')} type="number" inputMode="numeric" value={F.cost} onChange={(e) => set('cost', e.target.value)} />
              <TextField label={L('Kategori', 'Category')} value={F.category} onChange={(e) => set('category', e.target.value)} placeholder={L('mis. Minuman', 'e.g. Drinks')} />
              <TextField label="SKU / Barcode" value={F.sku} onChange={(e) => set('sku', e.target.value)} />
            </div>
            <ToggleRow label={L('Lacak stok', 'Track stock')} hint={L('Matikan untuk jasa', 'Turn off for services')} checked={F.track !== false} onChange={(v) => set('track', v)} />
            {F.track !== false && (
              <div className="grid grid-cols-3 gap-3">
                {!F.id && <TextField label={L('Stok awal', 'Opening')} type="number" inputMode="numeric" value={F.stock} onChange={(e) => set('stock', e.target.value)} />}
                <TextField label={L('Satuan', 'Unit')} value={F.unit} onChange={(e) => set('unit', e.target.value)} />
                <TextField label={L('Batas menipis', 'Low at')} type="number" inputMode="numeric" value={F.minStock} onChange={(e) => set('minStock', e.target.value)} />
              </div>
            )}
            <Btn className="w-full" disabled={!F.name.trim()} onClick={saveProduct}>{L('Simpan', 'Save')}</Btn>
            {F.id && (
              <div className="grid grid-cols-2 gap-2">
                {F.track !== false && <Btn variant="secondary" onClick={() => { setCount({ id: F.id, actual: F.stock }); setForm(null); }}><ClipboardCheck className="w-4 h-4" /> {L('Stok Opname', 'Stock Count')}</Btn>}
                <Btn variant="danger" onClick={() => remove(F)}><Trash2 className="w-4 h-4" /> {L('Hapus', 'Delete')}</Btn>
              </div>
            )}
          </>
        )}
      </Sheet>

      <Sheet open={!!buy} onClose={() => setBuy(null)} title={L('Tambah Stok (Beli Barang)', 'Restock')} subtitle={buy ? b.products.find((p) => p.id === buy.id)?.name : ''} closeLabel="Tutup">
        {buy && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <TextField label={L('Jumlah masuk', 'Quantity')} type="number" inputMode="numeric" value={buy.qty} onChange={(e) => setBuy({ ...buy, qty: e.target.value })} />
              <TextField label={L('Harga beli / satuan', 'Unit cost')} type="number" inputMode="numeric" value={buy.unitCost} onChange={(e) => setBuy({ ...buy, unitCost: e.target.value })} />
            </div>
            <SelectField label={L('Dibayar dari', 'Paid from')} value={buy.accountId} onChange={(e) => setBuy({ ...buy, accountId: e.target.value })}>
              {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </SelectField>
            <TextField label={L('Supplier (opsional)', 'Supplier')} value={buy.supplier} onChange={(e) => setBuy({ ...buy, supplier: e.target.value })} />
            <p className="text-xs text-life-muted">{L('Total', 'Total')}: <strong className="text-life-text">{rp(n(buy.qty) * n(buy.unitCost))}</strong> — {L('tercatat sebagai pembelian persediaan (aset), bukan beban, sampai barang terjual.', 'recorded as inventory (asset) until sold.')}</p>
            <Btn className="w-full" disabled={n(buy.qty) <= 0} onClick={doBuy}>{L('Catat Pembelian', 'Record Purchase')}</Btn>
          </>
        )}
      </Sheet>

      <Sheet open={!!count} onClose={() => setCount(null)} title={L('Stok Opname', 'Stock Count')} subtitle={count ? b.products.find((p) => p.id === count.id)?.name : ''} closeLabel="Tutup">
        {count && (
          <>
            <TextField label={L('Stok fisik sebenarnya', 'Actual stock')} type="number" inputMode="numeric" value={count.actual} onChange={(e) => setCount({ ...count, actual: e.target.value })} hint={L('Selisih dicatat sebagai beban/pendapatan selisih stok.', 'Difference is booked as stock variance.')} />
            <Btn className="w-full" onClick={doCount}>{L('Sesuaikan Stok', 'Adjust')}</Btn>
          </>
        )}
      </Sheet>
    </div>
  );
}
