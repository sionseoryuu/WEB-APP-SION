import React, { useMemo, useState } from 'react';
import { Repeat, Plus, Pencil, Trash2, Pause, Play, ArrowDownLeft, ArrowUpRight, CalendarClock } from 'lucide-react';
import { Card, Btn, Sheet, PageHeader, Empty, TextField, SelectField, Chip, useTr } from './ui.jsx';
import { monthlyEquivalent, nextOccurrence, prepareNewRule } from './recurring.js';
import { fmtDate, todayYmd, parseYmd } from './dates.js';
import { catName } from '../ewallet/helpers.js';
import { fmt } from '../ewallet/helpers.js';
import { accountTypeLabel, paymentLabel } from './labels.js';

const PRESETS = [
  { key: 'salary', type: 'income', category: 'Primary Salary', day: 25 },
  { key: 'rent', type: 'expense', category: 'Housing & Utilities', day: 1 },
  { key: 'installment', type: 'expense', category: 'Debt & Installments', day: 5 },
  { key: 'electricity', type: 'expense', category: 'Housing & Utilities', day: 20 },
  { key: 'internet', type: 'expense', category: 'Housing & Utilities', day: 10 },
];

const blank = (data, today) => ({
  id: '',
  type: 'expense',
  name: '',
  amount: '',
  category: 'Housing & Utilities',
  accountId: data.accounts[0]?.id || '',
  frequency: 'monthly',
  dayOfMonth: String(parseYmd(today).getDate()),
  weekday: String(parseYmd(today).getDay()),
  month: String(parseYmd(today).getMonth() + 1),
  startDate: today,
  endDate: '',
  debtId: '',
  notes: '',
  backfill: false,
});

export default function RecurringView({ data, lang, maskBalances, expenseCategories, incomeCategories, onSave, onDelete, onToggle, onBack }) {
  const tr = useTr(lang);
  const today = todayYmd();
  const currency = data.profile.currency;
  const rules = data.recurring || [];
  const [form, setForm] = useState(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const sorted = useMemo(
    () =>
      [...rules]
        .map((r) => ({ r, next: nextOccurrence(r, today) }))
        .sort((a, b) => (a.r.active === false) - (b.r.active === false) || String(a.next || '9999').localeCompare(String(b.next || '9999'))),
    [rules, today]
  );
  const monthlyIn = rules.filter((r) => r.active !== false && r.type === 'income').reduce((s, r) => s + monthlyEquivalent(r), 0);
  const monthlyOut = rules.filter((r) => r.active !== false && r.type !== 'income').reduce((s, r) => s + monthlyEquivalent(r), 0);

  const cats = form?.type === 'income' ? incomeCategories : expenseCategories;
  const debtOptions = (data.debts || []).filter((d) => d.totalAmount - d.paidAmount > 0 && (form?.type === 'income' ? d.kind === 'receivable' : d.kind !== 'receivable'));
  const startsInPast = form && form.startDate < today && !form.id;

  const openNew = () => setForm(blank(data, today));
  const openEdit = (r) =>
    setForm({
      ...blank(data, today),
      ...r,
      amount: String(r.amount),
      dayOfMonth: String(r.dayOfMonth || parseYmd(r.startDate).getDate()),
      weekday: String(Number.isInteger(r.weekday) ? r.weekday : parseYmd(r.startDate).getDay()),
      month: String(r.month || parseYmd(r.startDate).getMonth() + 1),
      endDate: r.endDate || '',
      debtId: r.debtId || '',
      notes: r.notes || '',
      backfill: false,
    });
  const applyPreset = (p) =>
    set({ type: p.type, category: p.category, dayOfMonth: String(p.day), frequency: 'monthly', name: form.name || tr(`rec_preset_${p.key}`) });

  const submit = (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.name.trim() || !(amount > 0) || !form.accountId) return;
    const rule = {
      id: form.id || undefined,
      type: form.type,
      name: form.name.trim(),
      amount,
      category: form.category,
      accountId: form.accountId,
      frequency: form.frequency,
      startDate: form.startDate,
      endDate: form.endDate || '',
      notes: form.notes.trim(),
      ...(form.frequency === 'monthly' || form.frequency === 'yearly' ? { dayOfMonth: Math.min(31, Math.max(1, parseInt(form.dayOfMonth, 10) || 1)) } : {}),
      ...(form.frequency === 'weekly' ? { weekday: parseInt(form.weekday, 10) } : {}),
      ...(form.frequency === 'yearly' ? { month: parseInt(form.month, 10) } : {}),
      ...(form.debtId ? { debtId: form.debtId } : {}),
    };
    if (form.id) {
      const old = rules.find((r) => r.id === form.id);
      onSave({ ...old, ...rule, lastRun: old?.lastRun || '' });
    } else {
      onSave(prepareNewRule(rule, today, form.backfill));
    }
    setForm(null);
  };

  const freqLabel = (r) => {
    if (r.frequency === 'weekly') return tr('rec_every_week', { day: new Date(2024, 0, 7 + (r.weekday || 0)).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { weekday: 'long' }) });
    if (r.frequency === 'yearly') return tr('rec_every_year', { date: new Date(2024, (r.month || 1) - 1, r.dayOfMonth || 1).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long' }) });
    return tr('rec_every_month', { day: r.dayOfMonth || parseYmd(r.startDate).getDate() });
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <PageHeader
        title={tr('rec_title')}
        subtitle={tr('rec_subtitle')}
        onBack={onBack}
        backLabel={tr('back')}
        action={
          <Btn size="sm" onClick={openNew}>
            <Plus className="w-4 h-4" /> {tr('rec_add')}
          </Btn>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3.5">
          <p className="text-[11px] text-life-muted flex items-center gap-1"><ArrowDownLeft className="w-3.5 h-3.5 text-[#87B082]" />{tr('rec_monthly_in')}</p>
          <p className="text-base font-bold text-life-text tabular-nums mt-1">{fmt(monthlyIn, currency, maskBalances)}</p>
        </Card>
        <Card className="p-3.5">
          <p className="text-[11px] text-life-muted flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5 text-life-accent" />{tr('rec_monthly_out')}</p>
          <p className="text-base font-bold text-life-text tabular-nums mt-1">{fmt(monthlyOut, currency, maskBalances)}</p>
        </Card>
      </div>

      {sorted.length === 0 ? (
        <Empty icon={Repeat} title={tr('rec_empty_title')} text={tr('rec_empty_text')}>
          <Btn size="sm" onClick={openNew}><Plus className="w-4 h-4" /> {tr('rec_add')}</Btn>
        </Empty>
      ) : (
        <div className="space-y-2.5">
          {sorted.map(({ r, next }) => {
            const acc = data.accounts.find((a) => a.id === r.accountId);
            const paused = r.active === false;
            const isIn = r.type === 'income';
            return (
              <Card key={r.id} className={`p-3.5 ${paused ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-3">
                  <span className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isIn ? 'bg-[#87B082]/15 text-[#87B082]' : 'bg-life-accent/15 text-life-accent'}`}>
                    {isIn ? <ArrowDownLeft className="w-[18px] h-[18px]" /> : <ArrowUpRight className="w-[18px] h-[18px]" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-life-text truncate">{r.name}</p>
                    <p className="text-[11px] text-life-muted truncate">{freqLabel(r)} • {catName(r.category, lang)}{acc ? ` • ${acc.name}` : ''}</p>
                    <p className="text-[11px] text-life-soft flex items-center gap-1 mt-0.5">
                      <CalendarClock className="w-3 h-3" />
                      {paused ? tr('rec_paused') : next ? tr('rec_next', { date: fmtDate(next, lang) }) : tr('rec_finished')}
                      {r.endDate ? ` • ${tr('rec_until', { date: fmtDate(r.endDate, lang) })}` : ''}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold tabular-nums shrink-0 ${isIn ? 'text-[#87B082]' : 'text-life-text'}`}>
                    {isIn ? '+' : '-'}{fmt(r.amount, currency, maskBalances)}
                  </p>
                </div>
                <div className="flex justify-end gap-1 mt-2">
                  <button onClick={() => onToggle(r)} className="p-2 rounded-lg text-life-muted hover:text-life-soft" aria-label={paused ? tr('rec_resume') : tr('rec_pause')}>
                    {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(r)} className="p-2 rounded-lg text-life-muted hover:text-life-soft" aria-label={tr('edit')}><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => onDelete(r)} className="p-2 rounded-lg text-life-muted hover:text-[#F29B87]" aria-label={tr('delete')}><Trash2 className="w-4 h-4" /></button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={!!form} onClose={() => setForm(null)} title={form?.id ? tr('rec_edit') : tr('rec_add')} closeLabel={tr('close')}>
        {form && (
          <form onSubmit={submit} className="space-y-4">
            {!form.id && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-life-muted mb-2">{tr('rec_quick')}</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <Chip key={p.key} onClick={() => applyPreset(p)}>{tr(`rec_preset_${p.key}`)}</Chip>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-life-bg border border-life-border/50">
              {['expense', 'income'].map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => set({ type: tp, category: tp === 'income' ? incomeCategories[0] : expenseCategories[0], debtId: '' })}
                  className={`py-2 rounded-lg text-xs font-semibold ${form.type === tp ? 'bg-life-accent text-life-bg' : 'text-life-muted'}`}
                >
                  {tp === 'income' ? tr('income') : tr('expense')}
                </button>
              ))}
            </div>
            <TextField label={tr('rec_name')} placeholder={tr('rec_name_ph')} value={form.name} onChange={(e) => set({ name: e.target.value })} required />
            <div className="grid grid-cols-2 gap-3">
              <TextField label={`${tr('amount')} (${currency})`} type="number" min="1" step="any" inputMode="decimal" value={form.amount} onChange={(e) => set({ amount: e.target.value })} required />
              <SelectField label={tr('category')} value={form.category} onChange={(e) => set({ category: e.target.value })}>
                {cats.map((c) => <option key={c} value={c}>{catName(c, lang)}</option>)}
              </SelectField>
            </div>
            <SelectField label={tr('account')} value={form.accountId} onChange={(e) => set({ accountId: e.target.value })}>
              {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({accountTypeLabel(a.type, lang)})</option>)}
            </SelectField>

            <div className="grid grid-cols-2 gap-3">
              <SelectField label={tr('rec_frequency')} value={form.frequency} onChange={(e) => set({ frequency: e.target.value })}>
                <option value="weekly">{tr('rec_f_weekly')}</option>
                <option value="monthly">{tr('rec_f_monthly')}</option>
                <option value="yearly">{tr('rec_f_yearly')}</option>
              </SelectField>
              {form.frequency === 'weekly' ? (
                <SelectField label={tr('rec_weekday')} value={form.weekday} onChange={(e) => set({ weekday: e.target.value })}>
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>{new Date(2024, 0, 7 + d).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { weekday: 'long' })}</option>
                  ))}
                </SelectField>
              ) : (
                <TextField label={tr('rec_day')} type="number" min="1" max="31" value={form.dayOfMonth} onChange={(e) => set({ dayOfMonth: e.target.value })} hint={Number(form.dayOfMonth) > 28 ? tr('rec_day_hint') : undefined} />
              )}
            </div>
            {form.frequency === 'yearly' && (
              <SelectField label={tr('rec_month')} value={form.month} onChange={(e) => set({ month: e.target.value })}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>{new Date(2024, i, 1).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'long' })}</option>
                ))}
              </SelectField>
            )}
            <div className="grid grid-cols-2 gap-3">
              <TextField label={tr('rec_start')} type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} required />
              <TextField label={tr('rec_end')} type="date" value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} hint={tr('rec_end_hint')} />
            </div>
            {startsInPast && (
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-life-bg border border-life-border/50 text-xs text-life-soft">
                <input type="checkbox" className="mt-0.5" checked={form.backfill} onChange={(e) => set({ backfill: e.target.checked })} />
                <span>{tr('rec_backfill')}</span>
              </label>
            )}
            {debtOptions.length > 0 && (
              <SelectField label={tr('rec_link_debt')} hint={tr('rec_link_debt_hint')} value={form.debtId} onChange={(e) => set({ debtId: e.target.value })}>
                <option value="">{tr('none')}</option>
                {debtOptions.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </SelectField>
            )}
            <TextField label={tr('notes')} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
            <div className="flex justify-end gap-2 pt-1">
              <Btn variant="secondary" onClick={() => setForm(null)}>{tr('cancel')}</Btn>
              <Btn type="submit">{tr('save')}</Btn>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  );
}
