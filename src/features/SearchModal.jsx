import { anyEnumLabel } from './labels.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, ArrowUpRight, ArrowDownLeft, FileText, CheckSquare, Users, CalendarDays, Wallet, Target, ShoppingCart, ArrowLeftRight } from 'lucide-react';
import { useTr } from './ui.jsx';
import { searchAll, highlightParts } from './search.js';
import { catName, fmt } from '../ewallet/helpers.js';

const ICON = {
  transaction: ArrowUpRight, note: FileText, task: CheckSquare, contact: Users, event: CalendarDays,
  bill: Wallet, debt: Wallet, recurring: ArrowLeftRight, template: ArrowLeftRight, goal: Target, habit: Target, savings: Wallet, shopping: ShoppingCart,
};

const Hl = ({ text, q }) => (
  <>
    {highlightParts(text, q).map((p, i) =>
      p.hit ? <mark key={i} className="bg-life-accent/30 text-life-text rounded px-0.5">{p.t}</mark> : <span key={i}>{p.t}</span>
    )}
  </>
);

export default function SearchModal({ open, onClose, data, lang, maskBalances, onPick }) {
  const tr = useTr(lang);
  const [q, setQ] = useState('');
  const [more, setMore] = useState({});
  const inputRef = useRef(null);
  const currency = data.profile.currency;

  useEffect(() => {
    if (open) {
      setQ('');
      setMore({});
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const groups = useMemo(() => (q.trim() ? searchAll(data, q, 40) : []), [data, q]);
  if (!open) return null;
  const total = groups.reduce((s, g) => s + g.total, 0);

  return (
    <div className="fixed inset-0 z-[60] bg-life-bg/95 backdrop-blur-sm flex flex-col" role="dialog" aria-modal="true" aria-label={tr('search_title')}>
      <div className="flex items-center gap-2 px-3 py-3 border-b border-life-border/40" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <Search className="w-5 h-5 text-life-accent shrink-0" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tr('search_placeholder')}
          className="flex-1 bg-transparent text-base text-life-text placeholder-life-muted/60 outline-none min-w-0"
          enterKeyHint="search"
        />
        {q && <button onClick={() => setQ('')} className="p-2 text-life-muted" aria-label={tr('search_clear')}><X className="w-4 h-4" /></button>}
        <button onClick={onClose} className="px-2 py-2 text-sm font-semibold text-life-accent">{tr('close')}</button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 max-w-2xl w-full mx-auto">
        {!q.trim() ? (
          <div className="text-center text-xs text-life-muted py-14 px-6">
            <Search className="w-8 h-8 mx-auto mb-3 text-life-border" />
            {tr('search_hint')}
          </div>
        ) : total === 0 ? (
          <p className="text-center text-sm text-life-muted py-14">{tr('search_none', { q })}</p>
        ) : (
          <div className="space-y-5">
            <p className="text-[11px] text-life-muted px-1">{tr('search_count', { n: total })}</p>
            {groups.map((g) => {
              const shown = more[g.id] ? g.items : g.items.slice(0, 5);
              return (
                <section key={g.id}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-widest text-life-muted/80 px-1 mb-1.5">{tr(`search_g_${g.id}`)} <span className="opacity-60">({g.total})</span></h3>
                  <div className="rounded-2xl bg-life-surface border border-life-border/40 divide-y divide-life-border/25 overflow-hidden">
                    {shown.map((it) => {
                      const Icon = it.kind === 'transaction' ? (it.tx.type === 'income' ? ArrowDownLeft : it.tx.type === 'transfer' ? ArrowLeftRight : ArrowUpRight) : ICON[it.kind] || FileText;
                      return (
                        <button key={`${it.kind}-${it.id}`} onClick={() => onPick(it)} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left active:bg-life-surface2">
                          <span className="w-8 h-8 rounded-xl bg-life-accent/15 text-life-accent flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm text-life-text truncate"><Hl text={it.title} q={q} /></span>
                            <span className="block text-[11px] text-life-muted truncate">
                              {it.kind === 'transaction' ? `${it.tx.date} • ${catName(it.tx.category, lang)}` : <Hl text={catName(anyEnumLabel(it.sub || '', lang), lang)} q={q} />}
                            </span>
                          </span>
                          {typeof it.amount === 'number' && <span className="text-xs font-semibold tabular-nums text-life-soft shrink-0">{fmt(it.amount, currency, maskBalances)}</span>}
                        </button>
                      );
                    })}
                  </div>
                  {g.total > 5 && !more[g.id] && (
                    <button onClick={() => setMore((m) => ({ ...m, [g.id]: true }))} className="mt-1.5 px-1 text-xs font-semibold text-life-accent">{tr('search_show_more', { n: g.total - 5 })}</button>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
