import React, { useMemo, useState } from 'react';
import { Star, Plus, Pencil, Trash2, Zap, X } from 'lucide-react';
import { Card, Btn, Sheet, PageHeader, Empty, TextField, SelectField, useTr } from './ui.jsx';
import { catName, fmt } from '../ewallet/helpers.js';
import { newId } from './dates.js';

export const templateTotal = (tpl) =>
  tpl.items && tpl.items.length ? tpl.items.reduce((s, it) => s + (Number(it.qty) || 1) * (Number(it.price) || 0), 0) : Number(tpl.amount) || 0;

export const templateSummary = (tpl) =>
  tpl.items && tpl.items.length ? tpl.items.map((it) => ((Number(it.qty) || 1) > 1 ? `${it.qty}× ${it.name}` : it.name)).join(' + ') : tpl.description || '';

// Urutkan: paling sering dipakai, lalu terbaru
export const rankTemplates = (list = []) =>
  [...list].sort((a, b) => (b.useCount || 0) - (a.useCount || 0) || String(b.lastUsed || '').localeCompare(String(a.lastUsed || '')));

// Baris pintasan satu-ketukan untuk Beranda
export function FavoritesStrip({ data, lang, maskBalances, onUse, onManage }) {
  const tr = useTr(lang);
  const list = rankTemplates(data.templates || []).slice(0, 8);
  const currency = data.profile.currency;
  return (
    <div>
      <div className="flex items-center justify-between px-1 mb-2.5">
        <h3 className="text-sm font-semibold text-life-text flex items-center gap-1.5"><Star className="w-4 h-4 text-life-accent" />{tr('fav_title')}</h3>
        <button onClick={onManage} className="text-xs font-semibold text-life-accent">{list.length ? tr('fav_manage') : tr('fav_create')}</button>
      </div>
      {list.length === 0 ? (
        <button onClick={onManage} className="w-full rounded-2xl bg-life-surface border border-dashed border-life-border/60 p-4 text-left text-xs text-life-muted">
          {tr('fav_hint')}
        </button>
      ) : (
        <div className="-mx-3 sm:mx-0">
          <div className="flex gap-2.5 overflow-x-auto px-3 sm:px-0 pb-1 snap-x [scrollbar-width:none]">
            {list.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => onUse(tpl)}
                className="snap-start shrink-0 w-40 text-left rounded-2xl bg-life-surface border border-life-border/45 p-3 active:scale-95 transition-transform"
              >
                <span className="flex items-center gap-1.5 text-life-accent"><Zap className="w-3.5 h-3.5" /><span className="text-[10px] uppercase tracking-wider">{tr('fav_one_tap')}</span></span>
                <p className="text-sm font-semibold text-life-text truncate mt-1">{tpl.name}</p>
                <p className="text-[11px] text-life-muted truncate">{templateSummary(tpl) || catName(tpl.category, lang)}</p>
                <p className="text-sm font-bold text-life-text tabular-nums mt-1.5">{fmt(templateTotal(tpl), currency, maskBalances)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const blank = (data) => ({
  id: '',
  name: '',
  type: 'expense',
  category: 'Dining & Coffee',
  accountId: data.accounts[0]?.id || '',
  paymentMethod: 'QRIS',
  description: '',
  amount: '',
  items: [],
  notes: '',
});

export default function TemplatesView({ data, lang, maskBalances, expenseCategories, incomeCategories, onUse, onSave, onDelete, onBack }) {
  const tr = useTr(lang);
  const currency = data.profile.currency;
  const list = useMemo(() => rankTemplates(data.templates || []), [data.templates]);
  const [form, setForm] = useState(null);
  const set = (p) => setForm((f) => ({ ...f, ...p }));
  const cats = form?.type === 'income' ? incomeCategories : expenseCategories;
  const itemsTotal = form ? form.items.reduce((s, it) => s + (Number(it.qty) || 1) * (Number(it.price) || 0), 0) : 0;
  const hasItems = form && form.items.length > 0;

  const openEdit = (tpl) => setForm({ ...blank(data), ...tpl, amount: tpl.items?.length ? '' : String(tpl.amount || ''), items: (tpl.items || []).map((it) => ({ ...it, id: newId('ti') })) });
  const patchItem = (id, p) => set({ items: form.items.map((it) => (it.id === id ? { ...it, ...p } : it)) });

  const submit = (e) => {
    e.preventDefault();
    const items = form.items.filter((it) => it.name.trim() && Number(it.price) > 0).map((it) => ({ name: it.name.trim(), qty: Number(it.qty) || 1, price: Number(it.price) }));
    const amount = items.length ? items.reduce((s, it) => s + it.qty * it.price, 0) : parseFloat(form.amount);
    if (!form.name.trim() || !(amount > 0)) return;
    onSave({
      id: form.id || undefined,
      name: form.name.trim(),
      type: form.type,
      category: form.category,
      accountId: form.accountId,
      paymentMethod: form.paymentMethod.trim() || 'QRIS',
      description: form.description.trim() || form.name.trim(),
      amount,
      items,
      notes: form.notes.trim(),
    });
    setForm(null);
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <PageHeader
        title={tr('fav_page_title')}
        subtitle={tr('fav_page_subtitle')}
        onBack={onBack}
        backLabel={tr('back')}
        action={<Btn size="sm" onClick={() => setForm(blank(data))}><Plus className="w-4 h-4" /> {tr('fav_new')}</Btn>}
      />
      {list.length === 0 ? (
        <Empty icon={Star} title={tr('fav_empty_title')} text={tr('fav_empty_text')}>
          <Btn size="sm" onClick={() => setForm(blank(data))}><Plus className="w-4 h-4" /> {tr('fav_new')}</Btn>
        </Empty>
      ) : (
        <div className="space-y-2.5">
          {list.map((tpl) => {
            const acc = data.accounts.find((a) => a.id === tpl.accountId);
            return (
              <Card key={tpl.id} className="p-3.5">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-life-accent/15 text-life-accent flex items-center justify-center shrink-0"><Star className="w-[18px] h-[18px]" /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-life-text truncate">{tpl.name}</p>
                    <p className="text-[11px] text-life-soft truncate">{templateSummary(tpl)}</p>
                    <p className="text-[11px] text-life-muted truncate">{catName(tpl.category, lang)}{acc ? ` • ${acc.name}` : ''}{tpl.useCount ? ` • ${tr('fav_used', { n: tpl.useCount })}` : ''}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums text-life-text shrink-0">{fmt(templateTotal(tpl), currency, maskBalances)}</p>
                </div>
                <div className="flex items-center justify-between mt-2.5">
                  <Btn size="sm" onClick={() => onUse(tpl)}><Zap className="w-3.5 h-3.5" /> {tr('fav_log_now')}</Btn>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(tpl)} className="p-2 rounded-lg text-life-muted hover:text-life-soft" aria-label={tr('edit')}><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(tpl)} className="p-2 rounded-lg text-life-muted hover:text-[#F29B87]" aria-label={tr('delete')}><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={!!form} onClose={() => setForm(null)} title={form?.id ? tr('fav_edit') : tr('fav_new')} closeLabel={tr('close')}>
        {form && (
          <form onSubmit={submit} className="space-y-4">
            <TextField label={tr('fav_name')} placeholder={tr('fav_name_ph')} value={form.name} onChange={(e) => set({ name: e.target.value })} required />
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-life-bg border border-life-border/50">
              {['expense', 'income'].map((tp) => (
                <button key={tp} type="button" onClick={() => set({ type: tp, category: tp === 'income' ? incomeCategories[0] : expenseCategories[0], items: tp === 'income' ? [] : form.items })}
                  className={`py-2 rounded-lg text-xs font-semibold ${form.type === tp ? 'bg-life-accent text-life-bg' : 'text-life-muted'}`}>
                  {tp === 'income' ? tr('income') : tr('expense')}
                </button>
              ))}
            </div>

            {form.type === 'expense' && (
              <div className="rounded-2xl border border-life-border/50 bg-life-bg/60 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-life-text">{tr('fav_items')}</p>
                  <button type="button" onClick={() => set({ items: [...form.items, { id: newId('ti'), name: '', qty: 1, price: '' }] })} className="text-xs font-semibold text-life-accent">+ {tr('fav_add_item')}</button>
                </div>
                {!hasItems && <p className="text-[11px] text-life-muted">{tr('fav_items_hint')}</p>}
                {form.items.map((it) => (
                  <div key={it.id} className="grid grid-cols-[1fr_3.2rem_5.5rem_1.5rem] gap-1.5 items-center">
                    <input value={it.name} onChange={(e) => patchItem(it.id, { name: e.target.value })} placeholder={tr('fav_item_ph')}
                      className="min-w-0 rounded-lg bg-life-surface border border-life-border/60 px-2.5 py-2 text-sm text-life-text outline-none focus:border-life-accent" />
                    <input type="number" min="1" inputMode="numeric" value={it.qty} onChange={(e) => patchItem(it.id, { qty: e.target.value })}
                      className="min-w-0 rounded-lg bg-life-surface border border-life-border/60 px-1 py-2 text-sm text-center text-life-text outline-none focus:border-life-accent" />
                    <input type="number" min="0" inputMode="decimal" value={it.price} placeholder="0" onChange={(e) => patchItem(it.id, { price: e.target.value })}
                      className="min-w-0 rounded-lg bg-life-surface border border-life-border/60 px-2 py-2 text-sm text-life-text outline-none focus:border-life-accent" />
                    <button type="button" onClick={() => set({ items: form.items.filter((x) => x.id !== it.id) })} className="text-life-muted hover:text-[#F29B87]" aria-label={tr('delete')}><X className="w-4 h-4" /></button>
                  </div>
                ))}
                {hasItems && <p className="text-xs text-life-soft text-right">{tr('total')} <b className="text-life-text tabular-nums">{fmt(itemsTotal, currency)}</b></p>}
              </div>
            )}
            {!hasItems && (
              <TextField label={`${tr('amount')} (${currency})`} type="number" min="1" step="any" inputMode="decimal" value={form.amount} onChange={(e) => set({ amount: e.target.value })} required />
            )}
            <div className="grid grid-cols-2 gap-3">
              <SelectField label={tr('category')} value={form.category} onChange={(e) => set({ category: e.target.value })}>
                {cats.map((c) => <option key={c} value={c}>{catName(c, lang)}</option>)}
              </SelectField>
              <SelectField label={tr('account')} value={form.accountId} onChange={(e) => set({ accountId: e.target.value })}>
                {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </SelectField>
            </div>
            <TextField label={tr('payment_method')} value={form.paymentMethod} onChange={(e) => set({ paymentMethod: e.target.value })} />
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
