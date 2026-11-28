import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Minus, ShoppingCart, History, Settings2, Trash2, Share2, PackageX, X } from 'lucide-react';
import { Btn, Card, Chip, Empty, SelectField, Sheet, TextField } from '../features/ui.jsx';
import { CAT, bizData, methodAccount, n, newId, nextInvoiceNo, receiptText, rp, DEFAULT_POS, applySale, applyVoid, voidBlocked, clampQty } from './bizLogic.js';
import { notifyShare, shareText } from './bizUi.jsx';
import { todayYmd } from '../features/dates.js';

const isCash = (m) => /tunai|cash/i.test(m || '');

export default function BizPOS({ data, setData, notify, askConfirm, lang }) {
  const b = bizData(data);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('');
  const [cart, setCart] = useState([]);
  const [checkout, setCheckout] = useState(false);
  const [custom, setCustom] = useState(false);
  const [history, setHistory] = useState(false);
  const [settings, setSettings] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [discType, setDiscType] = useState('amt');
  const [discVal, setDiscVal] = useState('');
  const [customer, setCustomer] = useState('');
  const [method, setMethod] = useState('');
  const [paid, setPaid] = useState('');
  const [credit, setCredit] = useState(false); // bon / jual kredit: bayar nanti
  const shop = b.pos.shopName || data.profile.name;

  const products = b.products.filter((p) => p.active !== false);
  const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const shown = products.filter(
    (p) => (!cat || p.category === cat) && (!query || `${p.name} ${p.sku || ''}`.toLowerCase().includes(query.toLowerCase()))
  );
  const qtyInCart = (pid) => cart.filter((c) => c.productId === pid).reduce((s, c) => s + c.qty, 0);

  const add = (p) => {
    if (p.track !== false && n(p.stock) - qtyInCart(p.id) <= 0) {
      notify(lang === 'id' ? `Stok ${p.name} habis` : `${p.name} is out of stock`);
      return;
    }
    setCart((c) => {
      const i = c.findIndex((x) => x.productId === p.id);
      if (i >= 0) return c.map((x, k) => (k === i ? { ...x, qty: x.qty + 1 } : x));
      return [...c, { key: newId('ci'), productId: p.id, name: p.name, price: n(p.price), cost: n(p.cost), qty: 1, tracked: p.track !== false }];
    });
  };
  const changeQty = (key, d) =>
    setCart((c) =>
      c
        .map((x) => {
          if (x.key !== key) return x;
          const q = x.qty + d;
          if (d > 0 && x.tracked) {
            const p = b.products.find((pp) => pp.id === x.productId);
            if (p && q > n(p.stock)) {
              notify(lang === 'id' ? 'Melebihi stok' : 'Exceeds stock');
              return x;
            }
          }
          return { ...x, qty: q };
        })
        .filter((x) => x.qty > 0)
    );

  // Qty diketik langsung: dibatasi stok, minimal 1
  const setQtyTo = (key, raw) =>
    setCart((c) =>
      c.map((x) => {
        if (x.key !== key) return x;
        const p = x.tracked ? b.products.find((pp) => pp.id === x.productId) : null;
        const { qty, capped } = clampQty(raw, p ? p.stock : null);
        if (capped) notify(lang === 'id' ? `Stok hanya ${qty}` : `Only ${qty} in stock`);
        return { ...x, qty };
      })
    );

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const itemCount = cart.reduce((s, c) => s + c.qty, 0);
  const discount = Math.min(subtotal, discType === 'pct' ? Math.round((subtotal * n(discVal)) / 100) : n(discVal));
  const taxPct = n(b.pos.taxPct);
  const tax = Math.round(((subtotal - discount) * taxPct) / 100);
  const total = subtotal - discount + tax;
  const curMethod = method || b.pos.methods[0]?.name || 'Tunai';
  const cash = !credit && isCash(curMethod);
  const paidNum = credit ? 0 : cash ? (paid === '' ? 0 : n(paid)) : total;
  const change = Math.max(0, paidNum - total);
  const canPay = cart.length > 0 && (credit ? customer.trim().length > 0 : paidNum >= total);

  const resetCart = () => {
    setCart([]);
    setDiscVal('');
    setCustomer('');
    setPaid('');
    setMethod('');
    setCredit(false);
  };

  const finalize = () => {
    const date = todayYmd();
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const no = nextInvoiceNo(b.sales, date);
    const saleId = newId('sale');
    const txId = newId('tx');
    const accountId = methodAccount(data, curMethod);
    const items = cart.map((c) => ({ productId: c.productId, name: c.name, price: c.price, cost: c.cost, qty: c.qty, tracked: c.tracked }));
    const debtId = newId('dbt');
    const sale = {
      id: saleId, no, date, time, items, subtotal, discount, taxPct, tax, total,
      method: credit ? 'Bon' : curMethod, accountId, paid: paidNum, change: credit ? 0 : change, customer: customer.trim(),
      txId: credit ? null : txId, ...(credit ? { credit: true, debtId } : {}),
    };
    const debt = credit
      ? { id: debtId, saleId, kind: 'receivable', title: `Bon ${no}`, counterparty: customer.trim(), totalAmount: total, paidAmount: 0, monthlyAmount: total, tenorMonths: 1, dueDate: '', accountId, notes: `Penjualan kredit ${no}` }
      : null;
    const tx = {
      id: txId, type: 'income', amount: total, date, category: CAT.sale, description: `Penjualan ${no}`,
      accountId, paymentMethod: curMethod, notes: customer.trim() ? `Pelanggan: ${customer.trim()}` : '',
      biz: 'sale', refId: saleId, items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
    };
    setData((prev) => applySale(prev, { sale, tx, debt }));
    setCheckout(false);
    setReceipt(sale);
    resetCart();
  };

  const voidSale = (s) => {
    if (voidBlocked(data, s)) {
      notify(lang === 'id' ? 'Bon ini sudah dicicil/dibayar, tidak bisa dibatalkan. Hubungi pelanggan atau catat retur manual.' : 'This tab already has payments and cannot be voided.');
      return;
    }
    askConfirm(lang === 'id' ? 'Batalkan Penjualan' : 'Void Sale', lang === 'id' ? `Batalkan ${s.no} (${rp(s.total)})? Stok dikembalikan dan transaksi dihapus.` : `Void ${s.no}?`, () => {
      setData((prev) => applyVoid(prev, s));
      setReceipt(null);
      notify(lang === 'id' ? 'Penjualan dibatalkan' : 'Sale voided');
    });
  };

  return (
    <div className="space-y-3 pb-28">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-life-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'id' ? 'Cari produk / SKU' : 'Search product / SKU'}
            className="w-full rounded-xl bg-life-surface border border-life-border/50 pl-9 pr-3 py-2.5 text-sm text-life-text placeholder-life-muted/60 focus:outline-none focus:border-life-accent min-h-[44px]"
          />
        </div>
        <button onClick={() => setCustom(true)} className="w-11 h-11 shrink-0 rounded-xl bg-life-accent/15 border border-life-accent/40 text-life-accent flex items-center justify-center" aria-label="Item bebas">
          <Plus className="w-5 h-5" />
        </button>
        <button onClick={() => setHistory(true)} className="w-11 h-11 shrink-0 rounded-xl bg-life-surface border border-life-border/50 text-life-soft flex items-center justify-center" aria-label="Riwayat">
          <History className="w-5 h-5" />
        </button>
        <button onClick={() => setSettings(true)} className="w-11 h-11 shrink-0 rounded-xl bg-life-surface border border-life-border/50 text-life-soft flex items-center justify-center" aria-label="Pengaturan kasir">
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      {cats.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <Chip active={!cat} onClick={() => setCat('')}>{lang === 'id' ? 'Semua' : 'All'}</Chip>
          {cats.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <Empty icon={PackageX} title={lang === 'id' ? 'Belum ada produk' : 'No products yet'} text={lang === 'id' ? 'Tambah produk di tab Produk, atau jual langsung lewat tombol + (item bebas).' : 'Add products in the Products tab, or sell ad-hoc items with +.'}>
          <Btn onClick={() => setCustom(true)}><Plus className="w-4 h-4" /> {lang === 'id' ? 'Item Bebas' : 'Custom Item'}</Btn>
        </Empty>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {shown.map((p) => {
            const inCart = qtyInCart(p.id);
            const out = p.track !== false && n(p.stock) - inCart <= 0;
            return (
              <button
                key={p.id}
                onClick={() => add(p)}
                className={`relative text-left rounded-2xl border p-3 min-h-[96px] flex flex-col justify-between active:scale-[0.98] transition ${out ? 'opacity-45 border-life-border/30 bg-life-surface' : 'border-life-border/45 bg-life-surface hover:border-life-accent/60'}`}
              >
                {inCart > 0 && (
                  <span className="absolute top-2 right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-life-accent text-life-bg text-[11px] font-bold flex items-center justify-center">{inCart}</span>
                )}
                <p className={`text-sm font-semibold text-life-text line-clamp-2 ${inCart > 0 ? 'pr-7' : ''}`}>{p.name}</p>
                <p className="text-sm text-life-accent font-bold tabular-nums mt-1">{rp(p.price)}</p>
                {p.track !== false && (
                  <p className={`text-[10px] mt-0.5 ${n(p.stock) <= n(p.minStock) ? 'text-[#F29B87]' : 'text-life-muted'}`}>
                    {lang === 'id' ? 'Stok' : 'Stock'} {n(p.stock)} {p.unit || ''}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {cart.length > 0 && !checkout &&
        createPortal(
          <div className="fixed inset-x-0 z-30 px-3 pointer-events-none" style={{ bottom: 'calc(84px + env(safe-area-inset-bottom))' }}>
            <button
              onClick={() => setCheckout(true)}
              className="pointer-events-auto w-full max-w-xl mx-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-life-accent to-life-accent-dark text-life-bg shadow-2xl active:scale-[0.99]"
            >
              <span className="flex items-center gap-2 font-semibold"><ShoppingCart className="w-5 h-5" /> {itemCount} {lang === 'id' ? 'item' : 'items'}</span>
              <span className="font-bold tabular-nums">{rp(subtotal)} · {lang === 'id' ? 'Bayar' : 'Pay'}</span>
            </button>
          </div>,
          document.body
        )}

      {/* Checkout */}
      <Sheet open={checkout} onClose={() => setCheckout(false)} title={lang === 'id' ? 'Pembayaran' : 'Checkout'} closeLabel="Tutup">
        <div className="space-y-2">
          {cart.map((c) => (
            <div key={c.key} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-life-text truncate">{c.name}</p>
                <p className="text-[11px] text-life-muted tabular-nums">{rp(c.price)}</p>
              </div>
              <button onClick={() => changeQty(c.key, -1)} className="w-9 h-9 rounded-xl bg-life-bg border border-life-border/50 flex items-center justify-center" aria-label="Kurangi"><Minus className="w-4 h-4" /></button>
              <QtyInput value={c.qty} onCommit={(v) => setQtyTo(c.key, v)} />
              <button onClick={() => changeQty(c.key, 1)} className="w-9 h-9 rounded-xl bg-life-bg border border-life-border/50 flex items-center justify-center" aria-label="Tambah"><Plus className="w-4 h-4" /></button>
              <button onClick={() => setCart((x) => x.filter((i) => i.key !== c.key))} className="w-9 h-9 rounded-xl text-[#F29B87] flex items-center justify-center" aria-label="Hapus"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
          <TextField label={lang === 'id' ? 'Diskon' : 'Discount'} type="number" inputMode="decimal" value={discVal} onChange={(e) => setDiscVal(e.target.value)} placeholder="0" />
          <div className="flex gap-1.5 pb-0.5">
            <Chip active={discType === 'amt'} onClick={() => setDiscType('amt')}>Rp</Chip>
            <Chip active={discType === 'pct'} onClick={() => setDiscType('pct')}>%</Chip>
          </div>
        </div>
        <TextField label={credit ? (lang === 'id' ? 'Nama pelanggan (wajib untuk bon)' : 'Customer (required for tab)') : (lang === 'id' ? 'Nama pelanggan (opsional)' : 'Customer (optional)')} value={customer} onChange={(e) => setCustomer(e.target.value)} />

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-life-muted mb-1.5">{lang === 'id' ? 'Metode bayar' : 'Payment'}</p>
          <div className="flex flex-wrap gap-2">
            {b.pos.methods.map((m) => (
              <Chip key={m.name} active={!credit && curMethod === m.name} onClick={() => { setCredit(false); setMethod(m.name); }}>{m.name}</Chip>
            ))}
            <Chip active={credit} onClick={() => setCredit(true)}>{lang === 'id' ? 'Bon (bayar nanti)' : 'On tab (pay later)'}</Chip>
          </div>
          {credit && (
            <p className="text-[11px] text-life-muted mt-1.5">
              {lang === 'id' ? 'Penjualan dicatat sebagai pendapatan & piutang pelanggan. Saat pelanggan membayar, catat di Utang/Piutang → Terima.' : 'Recorded as revenue + customer receivable. Record the payment later in Debts → Receive.'}
            </p>
          )}
        </div>

        {cash && (
          <div className="space-y-2">
            <TextField label={lang === 'id' ? 'Uang diterima' : 'Cash received'} type="number" inputMode="numeric" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder={String(total)} />
            <div className="flex flex-wrap gap-2">
              <Chip onClick={() => setPaid(String(total))}>{lang === 'id' ? 'Uang pas' : 'Exact'}</Chip>
              {[20000, 50000, 100000].filter((v) => v >= total).map((v) => (
                <Chip key={v} onClick={() => setPaid(String(v))}>{rp(v)}</Chip>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-life-bg border border-life-border/45 p-3.5 space-y-1 text-sm">
          <div className="flex justify-between text-life-muted"><span>Subtotal</span><span className="tabular-nums">{rp(subtotal)}</span></div>
          {discount > 0 && <div className="flex justify-between text-life-muted"><span>{lang === 'id' ? 'Diskon' : 'Discount'}</span><span className="tabular-nums">-{rp(discount)}</span></div>}
          {tax > 0 && <div className="flex justify-between text-life-muted"><span>{b.pos.taxLabel} {taxPct}%</span><span className="tabular-nums">{rp(tax)}</span></div>}
          <div className="flex justify-between text-base font-bold text-life-text pt-1"><span>Total</span><span className="tabular-nums">{rp(total)}</span></div>
          {cash && paid !== '' && (
            <div className={`flex justify-between ${paidNum >= total ? 'text-[#87B082]' : 'text-[#F29B87]'}`}>
              <span>{paidNum >= total ? (lang === 'id' ? 'Kembalian' : 'Change') : (lang === 'id' ? 'Kurang' : 'Short')}</span>
              <span className="tabular-nums font-semibold">{rp(Math.abs(paidNum - total))}</span>
            </div>
          )}
        </div>
        <Btn className="w-full" disabled={!canPay} onClick={finalize}>{credit ? (lang === 'id' ? 'Simpan sebagai Bon' : 'Save on tab') : (lang === 'id' ? 'Selesaikan & Buat Struk' : 'Complete & Receipt')}</Btn>
      </Sheet>

      <CustomItemSheet open={custom} onClose={() => setCustom(false)} lang={lang} onAdd={(it) => { setCart((c) => [...c, { key: newId('ci'), productId: null, tracked: false, cost: 0, ...it }]); setCustom(false); }} />

      {/* Struk */}
      <Sheet open={!!receipt} onClose={() => setReceipt(null)} title={receipt?.no || ''} subtitle={lang === 'id' ? 'Struk penjualan' : 'Sales receipt'} closeLabel="Tutup">
        {receipt && (
          <>
            <pre className="rounded-2xl bg-white text-[#1f1f1f] p-4 text-[12px] leading-relaxed whitespace-pre-wrap font-mono">{receiptText(receipt, b.pos, shop)}</pre>
            <div className="grid grid-cols-2 gap-2">
              <Btn onClick={async () => notifyShare(notify, await shareText(receipt.no, receiptText(receipt, b.pos, shop)), lang === 'id')}><Share2 className="w-4 h-4" /> {lang === 'id' ? 'Bagikan' : 'Share'}</Btn>
              <Btn variant="secondary" onClick={() => setReceipt(null)}>{lang === 'id' ? 'Transaksi Baru' : 'New Sale'}</Btn>
            </div>
            <Btn variant="danger" className="w-full" onClick={() => voidSale(receipt)}>{lang === 'id' ? 'Batalkan Penjualan Ini' : 'Void this sale'}</Btn>
          </>
        )}
      </Sheet>

      {/* Riwayat */}
      <Sheet open={history} onClose={() => setHistory(false)} title={lang === 'id' ? 'Riwayat Penjualan' : 'Sales History'} closeLabel="Tutup">
        {b.sales.length === 0 ? (
          <p className="text-sm text-life-muted text-center py-6">{lang === 'id' ? 'Belum ada penjualan.' : 'No sales yet.'}</p>
        ) : (
          <div className="divide-y divide-life-border/30">
            {b.sales.slice(0, 40).map((s) => (
              <button key={s.id} className="w-full flex items-center justify-between gap-3 py-2.5 text-left" onClick={() => { setHistory(false); setReceipt(s); }}>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-life-text">{s.no}</span>
                  <span className="block text-[11px] text-life-muted truncate">{s.date} {s.time} · {s.method}{s.customer ? ` · ${s.customer}` : ''}</span>
                </span>
                <span className="text-sm font-semibold tabular-nums">{rp(s.total)}</span>
              </button>
            ))}
          </div>
        )}
      </Sheet>

      <PosSettings open={settings} onClose={() => setSettings(false)} data={data} setData={setData} lang={lang} notify={notify} />
    </div>
  );
}

// Kolom qty yang bisa diketik. Kosong lalu keluar fokus → kembali ke jumlah sebelumnya.
function QtyInput({ value, onCommit }) {
  const [txt, setTxt] = useState(null); // null = tampilkan nilai asli
  const commit = () => {
    if (txt !== null && txt.trim() !== '') onCommit(txt);
    setTxt(null);
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label="Qty"
      value={txt === null ? String(value) : txt}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const v = e.target.value.replace(/[^0-9]/g, '');
        setTxt(v);
        if (v !== '' && Number(v) >= 1) onCommit(v);
        else if (v !== '' && Number(v) < 1) { onCommit(v); setTxt(null); }
      }}
      onBlur={commit}
      className="w-12 h-9 text-center text-sm font-semibold tabular-nums rounded-xl bg-life-bg border border-life-border/50 text-life-text focus:outline-none focus:border-life-accent"
    />
  );
}

function CustomItemSheet({ open, onClose, onAdd, lang }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('1');
  const ok = name.trim() && n(price) > 0 && n(qty) > 0;
  return (
    <Sheet open={open} onClose={onClose} title={lang === 'id' ? 'Item Bebas' : 'Custom Item'} subtitle={lang === 'id' ? 'Jual apa saja tanpa daftar produk (jasa, ongkir, dll).' : 'Sell anything without a catalog entry.'} closeLabel="Tutup">
      <TextField label={lang === 'id' ? 'Nama item' : 'Item name'} value={name} onChange={(e) => setName(e.target.value)} placeholder={lang === 'id' ? 'mis. Jasa servis' : 'e.g. Service fee'} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={lang === 'id' ? 'Harga' : 'Price'} type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
        <TextField label="Qty" type="number" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
      </div>
      <Btn className="w-full" disabled={!ok} onClick={() => { onAdd({ name: name.trim(), price: n(price), qty: Math.max(1, Math.round(n(qty))) }); setName(''); setPrice(''); setQty('1'); }}>
        {lang === 'id' ? 'Tambah ke Keranjang' : 'Add to Cart'}
      </Btn>
    </Sheet>
  );
}

function PosSettings({ open, onClose, data, setData, lang, notify }) {
  const b = bizData(data);
  const [f, setF] = useState(null);
  const cur = f || { ...DEFAULT_POS, ...b.pos, shopName: b.pos.shopName || data.profile.name };
  const set = (k, v) => setF({ ...cur, [k]: v });
  const setMethod = (i, patch) => set('methods', cur.methods.map((m, k) => (k === i ? { ...m, ...patch } : m)));
  const save = () => {
    setData((prev) => ({ ...prev, pos: { ...cur, taxPct: n(cur.taxPct), methods: cur.methods.filter((m) => m.name.trim()) } }));
    setF(null);
    onClose();
    notify(lang === 'id' ? 'Pengaturan kasir disimpan' : 'POS settings saved');
  };
  return (
    <Sheet open={open} onClose={() => { setF(null); onClose(); }} title={lang === 'id' ? 'Pengaturan Kasir' : 'POS Settings'} closeLabel="Tutup">
      <TextField label={lang === 'id' ? 'Nama di struk' : 'Receipt name'} value={cur.shopName} onChange={(e) => set('shopName', e.target.value)} />
      <TextField label={lang === 'id' ? 'Alamat' : 'Address'} value={cur.address} onChange={(e) => set('address', e.target.value)} />
      <TextField label={lang === 'id' ? 'Telepon' : 'Phone'} value={cur.phone} onChange={(e) => set('phone', e.target.value)} />
      <TextField label={lang === 'id' ? 'Catatan kaki struk' : 'Receipt footer'} value={cur.footer} onChange={(e) => set('footer', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <TextField label={lang === 'id' ? 'Pajak (%)' : 'Tax (%)'} type="number" inputMode="decimal" value={cur.taxPct} onChange={(e) => set('taxPct', e.target.value)} hint={lang === 'id' ? '0 = tanpa pajak' : '0 = no tax'} />
        <TextField label={lang === 'id' ? 'Nama pajak' : 'Tax label'} value={cur.taxLabel} onChange={(e) => set('taxLabel', e.target.value)} />
      </div>
      <p className="text-xs font-medium uppercase tracking-wider text-life-muted">{lang === 'id' ? 'Metode bayar → masuk ke akun' : 'Payment methods → account'}</p>
      {cur.methods.map((m, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <TextField value={m.name} onChange={(e) => setMethod(i, { name: e.target.value })} aria-label="Nama metode" />
          <SelectField value={m.accountId || data.accounts[0]?.id} onChange={(e) => setMethod(i, { accountId: e.target.value })} aria-label="Akun">
            {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </SelectField>
          <button onClick={() => set('methods', cur.methods.filter((_, k) => k !== i))} className="h-11 w-10 text-[#F29B87] flex items-center justify-center" aria-label="Hapus"><X className="w-4 h-4" /></button>
        </div>
      ))}
      <Btn variant="secondary" size="sm" onClick={() => set('methods', [...cur.methods, { name: '', accountId: data.accounts[0]?.id || '' }])}><Plus className="w-4 h-4" /> {lang === 'id' ? 'Tambah metode' : 'Add method'}</Btn>
      <Btn className="w-full" onClick={save}>{lang === 'id' ? 'Simpan' : 'Save'}</Btn>
    </Sheet>
  );
}
