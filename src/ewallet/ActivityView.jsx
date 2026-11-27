import React, { useMemo, useState } from 'react';
import { Search, QrCode, Pencil, Trash2, Receipt } from 'lucide-react';
import { TxRow } from './parts.jsx';
import { fmt, dayLabel, monthLabel, isQrisTx, catName } from './helpers.js';

export default function ActivityView({ data, lang, maskBalances, onOpenTx, onDeleteTx, onOpenReceipt }) {
  const L = (idText, enText) => (lang === 'id' ? idText : enText);
  const currency = data.profile.currency;
  const [filter, setFilter] = useState('all');
  const [month, setMonth] = useState('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [limit, setLimit] = useState(40);

  const months = useMemo(
    () => [...new Set(data.transactions.map((tx) => tx.date.slice(0, 7)))].sort().reverse(),
    [data.transactions]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.transactions
      .filter((tx) => {
        if (filter === 'in' && tx.type !== 'income') return false;
        if (filter === 'out' && tx.type !== 'expense') return false;
        if (filter === 'transfer' && tx.type !== 'transfer') return false;
        if (filter === 'qris' && !isQrisTx(tx)) return false;
        if (month !== 'all' && !tx.date.startsWith(month)) return false;
        if (q) {
          const hay = `${tx.description || ''} ${tx.category || ''} ${catName(tx.category, lang)} ${tx.notes || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || String(b.id).localeCompare(String(a.id)));
  }, [data.transactions, filter, month, query, lang]);

  const totalIn = filtered.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const totalOut = filtered.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
  const qrisCount = data.transactions.filter(isQrisTx).length;

  const groups = [];
  filtered.slice(0, limit).forEach((tx) => {
    const last = groups[groups.length - 1];
    if (last && last.date === tx.date) last.items.push(tx);
    else groups.push({ date: tx.date, items: [tx] });
  });

  const chips = [
    { id: 'all', label: L('Semua', 'All') },
    { id: 'qris', label: `QRIS & Struk${qrisCount ? ` (${qrisCount})` : ''}` },
    { id: 'in', label: L('Masuk', 'Income') },
    { id: 'out', label: L('Keluar', 'Expense') },
    { id: 'transfer', label: 'Transfer' },
  ];

  return (
    <div className="space-y-4 max-w-xl mx-auto lg:max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-life-text">{L('Aktivitas', 'Activity')}</h1>
        <button onClick={onOpenReceipt} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-life-accent text-life-bg text-xs font-semibold">
          <QrCode className="w-4 h-4" /> {L('Scan', 'Scan')}
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-life-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={L('Cari transaksi, kategori, catatan…', 'Search transactions, categories, notes…')}
          className="w-full rounded-2xl bg-life-surface border border-life-border/50 pl-10 pr-3 py-3 text-sm text-life-text placeholder:text-life-muted/70 outline-none focus:border-life-accent"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 [scrollbar-width:none]">
        {chips.map((c) => (
          <button
            key={c.id}
            onClick={() => { setFilter(c.id); setLimit(40); }}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
              filter === c.id ? 'bg-life-accent text-life-bg border-life-accent' : 'bg-life-surface text-life-muted border-life-border/50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <select
        value={month}
        onChange={(e) => { setMonth(e.target.value); setLimit(40); }}
        className="w-full rounded-2xl bg-life-surface border border-life-border/50 px-3.5 py-2.5 text-xs text-life-text outline-none"
      >
        <option value="all">{L('Semua bulan', 'All months')}</option>
        {months.map((m) => (
          <option key={m} value={m}>{monthLabel(m, lang)}</option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl bg-life-surface border border-life-border/40 p-3">
          <p className="text-[11px] text-life-muted">{L('Total masuk', 'Total in')}</p>
          <p className="text-sm font-bold text-[#87B082] tabular-nums mt-0.5">{fmt(totalIn, currency, maskBalances)}</p>
        </div>
        <div className="rounded-2xl bg-life-surface border border-life-border/40 p-3">
          <p className="text-[11px] text-life-muted">{L('Total keluar', 'Total out')}</p>
          <p className="text-sm font-bold text-life-text tabular-nums mt-0.5">{fmt(totalOut, currency, maskBalances)}</p>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl bg-life-surface border border-life-border/40 py-10 px-6 text-center text-xs text-life-muted flex flex-col items-center gap-2">
          <Receipt className="w-7 h-7 text-life-accent" />
          {L('Tidak ada transaksi yang cocok.', 'No matching transactions.')}
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.date}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-life-muted px-1 mb-1.5">{dayLabel(g.date, lang)}</p>
            <div className="rounded-2xl bg-life-surface border border-life-border/40 px-3.5 divide-y divide-life-border/25">
              {g.items.map((tx) => {
                const acc = data.accounts.find((a) => a.id === tx.accountId);
                return (
                  <div key={tx.id}>
                    <TxRow tx={tx} data={data} lang={lang} masked={maskBalances} onClick={() => setOpenId(openId === tx.id ? null : tx.id)} />
                    {openId === tx.id && (
                      <div className="pb-3 -mt-1 space-y-2">
                        <div className="rounded-xl bg-life-bg/70 border border-life-border/40 p-3 text-[11px] text-life-muted space-y-1">
                          <p>{L('Dompet', 'Wallet')}: <span className="text-life-text">{acc?.name || '-'}</span></p>
                          {tx.paymentMethod && <p>{L('Metode', 'Method')}: <span className="text-life-text">{tx.paymentMethod}</span></p>}
                          {tx.notes && <p>{L('Catatan', 'Notes')}: <span className="text-life-text">{tx.notes}</span></p>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => onOpenTx(tx)} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-life-surface2 border border-life-border/50 text-xs font-semibold text-life-text">
                            <Pencil className="w-3.5 h-3.5" /> {L('Ubah', 'Edit')}
                          </button>
                          <button onClick={() => onDeleteTx(tx)} className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#D96B52]/15 border border-[#D96B52]/40 text-xs font-semibold text-[#F29B87]">
                            <Trash2 className="w-3.5 h-3.5" /> {L('Hapus', 'Delete')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {filtered.length > limit && (
        <button onClick={() => setLimit((n) => n + 40)} className="w-full py-3 rounded-2xl bg-life-surface border border-life-border/50 text-xs font-semibold text-life-accent">
          {L('Muat lebih banyak', 'Load more')} ({filtered.length - limit})
        </button>
      )}
      <div className="h-2" />
    </div>
  );
}
