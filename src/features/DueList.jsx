import React from 'react';
import { Receipt, HandCoins, Repeat, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useTr } from './ui.jsx';
import { fmt } from '../ewallet/helpers.js';
import { KIND_TONE } from './calendarItems.js';

const ICON = { bill: Receipt, debt: HandCoins, receivable: HandCoins, auto_out: Repeat, auto_in: Repeat };

// Daftar tagihan/cicilan/otomatis untuk hari terpilih di Kalender
export default function DueList({ items, lang, currency, maskBalances, onOpen }) {
  const tr = useTr(lang);
  return (
    <div className="space-y-2.5 pt-2 border-t border-life-border/30">
      <h3 className="text-xs uppercase tracking-wider text-life-muted">{tr('cal_due_title')}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-life-muted/70">{tr('cal_due_none')}</p>
      ) : (
        items.map((it) => {
          const Icon = ICON[it.kind] || Receipt;
          const incoming = it.kind === 'receivable' || it.kind === 'auto_in';
          return (
            <button key={it.id} onClick={() => onOpen(it.tab)} className="w-full p-2.5 rounded-xl bg-life-surface2/60 border border-life-border/40 flex items-center gap-2.5 text-left">
              <span className={`w-1.5 self-stretch rounded-full ${KIND_TONE[it.kind]}`} />
              <Icon className="w-4 h-4 text-life-accent shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-xs text-life-text truncate">{it.title}</span>
                <span className="block text-[10px] text-life-muted">{tr(`cal_kind_${it.kind}`)}{it.paid ? ` • ${tr(it.kind === 'auto_in' || it.kind === 'auto_out' ? 'cal_recorded' : 'cal_paid')}` : ''}</span>
              </span>
              <span className={`text-xs font-semibold tabular-nums shrink-0 flex items-center gap-1 ${it.paid ? 'text-life-muted line-through' : incoming ? 'text-[#87B082]' : 'text-life-text'}`}>
                {it.paid && <CheckCircle2 className="w-3 h-3 text-[#87B082] no-underline" />}
                {incoming ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                {fmt(it.amount, currency, maskBalances)}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
