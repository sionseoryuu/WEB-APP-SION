import React, { useMemo } from 'react';
import { CalendarRange, TrendingDown, TrendingUp, Flame, Target, PiggyBank, X, CheckCircle2, Wallet } from 'lucide-react';
import { Sheet, Card, useTr } from './ui.jsx';
import { buildWeeklySummary, isSunday } from './weekly.js';
import { catName, fmt } from '../ewallet/helpers.js';
import { fmtDate, todayYmd } from './dates.js';

const DISMISS_KEY = 'lifeos:weekly:dismissed';
export const weeklyDismissedToday = () => {
  try {
    return localStorage.getItem(DISMISS_KEY) === todayYmd();
  } catch {
    return false;
  }
};
export const dismissWeeklyToday = () => {
  try {
    localStorage.setItem(DISMISS_KEY, todayYmd());
  } catch {
    /* abaikan */
  }
};

function Delta({ s, tr }) {
  if (s.deltaPct === null) return <span className="text-[11px] text-life-muted">{tr('wk_no_prev')}</span>;
  const down = s.delta <= 0;
  const Icon = down ? TrendingDown : TrendingUp;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${down ? 'bg-[#87B082]/15 text-[#87B082]' : 'bg-[#D96B52]/15 text-[#F29B87]'}`}>
      <Icon className="w-3 h-3" />
      {s.delta === 0 ? tr('wk_same') : down ? tr('wk_less', { pct: Math.abs(s.deltaPct) }) : tr('wk_more', { pct: s.deltaPct })}
    </span>
  );
}

export function WeeklyBody({ data, lang, maskBalances, today }) {
  const tr = useTr(lang);
  const s = useMemo(() => buildWeeklySummary(data, today), [data, today]);
  const cur = data.profile.currency;
  const m = (n) => fmt(n, cur, maskBalances);
  return (
    <div className="space-y-4">
      <p className="text-[11px] text-life-muted">{tr('wk_range', { from: fmtDate(s.start, lang, { day: 'numeric', month: 'short' }), to: fmtDate(s.end, lang, { day: 'numeric', month: 'short' }) })}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-life-bg border border-life-border/40 p-3">
          <p className="text-[11px] text-life-muted flex items-center gap-1"><Wallet className="w-3.5 h-3.5 text-life-accent" />{tr('wk_spent')}</p>
          <p className="text-lg font-bold text-life-text tabular-nums mt-0.5">{m(s.spent)}</p>
          <div className="mt-1"><Delta s={s} tr={tr} /></div>
          <p className="text-[11px] text-life-muted mt-1">{tr('wk_last_week', { amount: m(s.prevSpent) })}</p>
        </div>
        <div className="rounded-2xl bg-life-bg border border-life-border/40 p-3">
          <p className="text-[11px] text-life-muted">{tr('wk_income')}</p>
          <p className="text-lg font-bold text-life-text tabular-nums mt-0.5">{m(s.income)}</p>
          <p className="text-[11px] text-life-muted mt-1">{tr('wk_no_spend', { n: s.noSpendDays, of: s.elapsed })}</p>
        </div>
      </div>

      {(s.topCategory || s.biggestRise || s.biggestDrop) && (
        <div className="space-y-1.5 text-xs text-life-soft">
          {s.topCategory && s.topCategory.now > 0 && <p>• {tr('wk_top_cat', { cat: catName(s.topCategory.category, lang), amount: m(s.topCategory.now) })}</p>}
          {s.biggestRise && <p>• {tr('wk_rise', { cat: catName(s.biggestRise.category, lang), amount: m(s.biggestRise.diff) })}</p>}
          {s.biggestDrop && <p>• {tr('wk_drop', { cat: catName(s.biggestDrop.category, lang), amount: m(Math.abs(s.biggestDrop.diff)) })}</p>}
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-life-text flex items-center gap-1.5 mb-1.5"><Flame className="w-3.5 h-3.5 text-life-accent" />{tr('wk_habits')}</p>
        {s.habits.length === 0 ? (
          <p className="text-[11px] text-life-muted">{tr('wk_no_habits')}</p>
        ) : (
          <div className="space-y-1.5">
            {s.habits.map((h) => (
              <div key={h.id} className="flex items-center gap-2 text-xs">
                {h.consistent ? <CheckCircle2 className="w-3.5 h-3.5 text-[#87B082] shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full border border-life-border shrink-0" />}
                <span className="flex-1 min-w-0 truncate text-life-text">{h.name}</span>
                <span className="tabular-nums text-life-muted shrink-0">{h.done}/{h.target}</span>
              </div>
            ))}
            <p className="text-[11px] text-life-muted">{tr('wk_consistent', { n: s.consistentHabits.length, total: s.habits.length })}</p>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-life-text flex items-center gap-1.5 mb-1.5"><Target className="w-3.5 h-3.5 text-life-accent" />{tr('wk_targets')}</p>
        {s.savingsMoves.length === 0 && s.goalMoves.length === 0 ? (
          <p className="text-[11px] text-life-muted">{tr('wk_no_targets')}</p>
        ) : (
          <div className="space-y-1.5 text-xs">
            {s.savingsMoves.map((v) => (
              <p key={v.id} className="flex items-center gap-1.5 text-life-soft"><PiggyBank className="w-3.5 h-3.5 text-life-accent shrink-0" /><span className="truncate">{tr('wk_saving_moved', { name: v.name, amount: `${v.added >= 0 ? '+' : '-'}${m(Math.abs(v.added))}`, pct: v.pct })}</span></p>
            ))}
            {s.goalMoves.map((g) => (
              <p key={g.id} className="flex items-center gap-1.5 text-life-soft"><Target className="w-3.5 h-3.5 text-life-accent shrink-0" /><span className="truncate">{tr('wk_goal_progress', { name: g.title, done: g.done, total: g.total })}</span></p>
            ))}
          </div>
        )}
      </div>
      <p className="text-[11px] text-life-muted">{tr('wk_tasks_done', { n: s.tasksDone })}</p>
    </div>
  );
}

// Kartu di Beranda — tampil tiap hari Minggu
export function WeeklyCard({ data, lang, maskBalances, onOpen, onDismiss, force }) {
  const tr = useTr(lang);
  const today = todayYmd();
  if (!force && (!isSunday(today) || weeklyDismissedToday())) return null;
  const s = buildWeeklySummary(data, today);
  const cur = data.profile.currency;
  return (
    <div className="rounded-3xl p-4 bg-gradient-to-br from-life-surface2 to-life-surface border border-life-accent/40 relative">
      {onDismiss && (
        <button onClick={onDismiss} className="absolute top-3 right-3 p-1.5 rounded-lg text-life-muted" aria-label={tr('wk_dismiss')}><X className="w-4 h-4" /></button>
      )}
      <p className="text-[11px] font-semibold uppercase tracking-widest text-life-accent flex items-center gap-1.5"><CalendarRange className="w-3.5 h-3.5" />{tr('wk_title')}</p>
      <p className="text-xl font-bold text-life-text tabular-nums mt-1.5">{fmt(s.spent, cur, maskBalances)}</p>
      <div className="flex items-center gap-2 mt-1 flex-wrap"><Delta s={s} tr={tr} /><span className="text-[11px] text-life-muted">{tr('wk_habit_short', { n: s.consistentHabits.length, total: s.habits.length })}</span></div>
      <button onClick={onOpen} className="mt-3 text-xs font-semibold text-life-accent">{tr('wk_see_detail')}</button>
    </div>
  );
}

export function WeeklyModal({ open, onClose, data, lang, maskBalances }) {
  const tr = useTr(lang);
  return (
    <Sheet open={open} onClose={onClose} title={tr('wk_title')} subtitle={tr('wk_subtitle')} closeLabel={tr('close')}>
      <WeeklyBody data={data} lang={lang} maskBalances={maskBalances} today={todayYmd()} />
    </Sheet>
  );
}
export { Card };
