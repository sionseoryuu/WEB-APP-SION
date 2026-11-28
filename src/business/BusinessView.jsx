import React, { useMemo } from 'react';
import { ChevronLeft, Eye, EyeOff, Store, ShoppingCart, Package, Users, BarChart3, Plus, ScanLine, AlertTriangle, HandCoins, Landmark } from 'lucide-react';
import { TxRow } from '../ewallet/parts.jsx';
import BizPOS from './BizPOS.jsx';
import BizStock from './BizStock.jsx';
import BizPayroll from './BizPayroll.jsx';
import BizReports from './BizReports.jsx';
import BizAssets from './BizAssets.jsx';
import { bizData, incomeStatement, lowStock, monthRange, rp, salesSummary, n, thisMonthKey } from './bizLogic.js';
import { Stat, Row, SectionLabel } from './bizUi.jsx';
import { todayYmd } from '../features/dates.js';
import { WorkspaceChip } from '../features/WorkspaceSwitcher.jsx';

export const BIZ_TABS = [
  { id: 'dashboard', icon: Store, id_: 'Ringkasan', en: 'Overview' },
  { id: 'biz_pos', icon: ShoppingCart, id_: 'Kasir', en: 'POS' },
  { id: 'biz_stock', icon: Package, id_: 'Produk', en: 'Products' },
  { id: 'biz_payroll', icon: Users, id_: 'Gaji', en: 'Payroll' },
  { id: 'biz_assets', icon: Landmark, id_: 'Aset', en: 'Assets' },
  { id: 'biz_reports', icon: BarChart3, id_: 'Laporan', en: 'Reports' },
];

export default function BusinessView(props) {
  const { section, data, setData, derived, lang, maskBalances, onToggleMask, notify, askConfirm, onNavigate, onOpenTx, onOpenReceipt, currentWs, onOpenSwitcher } = props;
  const L = (a, e) => (lang === 'id' ? a : e);
  const current = BIZ_TABS.find((t) => t.id === section) || BIZ_TABS[0];
  const shop = data.pos?.shopName || data.profile.name;
  const shared = { data, setData, notify, askConfirm, lang, maskBalances };

  return (
    <div className="space-y-4 max-w-xl mx-auto lg:max-w-3xl">
      <div className="flex items-center gap-2">
        {section !== 'dashboard' ? (
          <button onClick={() => onNavigate('dashboard')} className="p-2 -ml-2 rounded-xl text-life-text" aria-label={L('Kembali', 'Back')}><ChevronLeft className="w-5 h-5" /></button>
        ) : (
          <span className="w-10 h-10 rounded-2xl bg-life-accent/20 text-life-accent flex items-center justify-center shrink-0"><Store className="w-5 h-5" /></span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-life-muted">{L('Mode Bisnis', 'Business Mode')}</p>
          <h1 className="text-lg font-bold text-life-text truncate">{section === 'dashboard' ? shop : L(current.id_, current.en)}</h1>
        </div>
        {onOpenSwitcher && <WorkspaceChip current={currentWs} lang={lang} onClick={onOpenSwitcher} className="max-w-[120px] shrink" />}
        <button onClick={onToggleMask} className="p-2.5 rounded-xl bg-life-surface border border-life-border/50 text-life-muted" aria-label={L('Sembunyikan saldo', 'Hide balances')}>
          {maskBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none]">
        {BIZ_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onNavigate(t.id)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
              section === t.id ? 'bg-life-accent text-life-bg border-life-accent' : 'bg-life-surface text-life-muted border-life-border/50'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {L(t.id_, t.en)}
          </button>
        ))}
      </div>

      {section === 'dashboard' && <BizHome {...shared} derived={derived} onNavigate={onNavigate} onOpenTx={onOpenTx} onOpenReceipt={onOpenReceipt} />}
      {section === 'biz_pos' && <BizPOS {...shared} />}
      {section === 'biz_stock' && <BizStock {...shared} />}
      {section === 'biz_payroll' && <BizPayroll {...shared} />}
      {section === 'biz_assets' && <BizAssets {...shared} />}
      {section === 'biz_reports' && <BizReports data={data} notify={notify} lang={lang} maskBalances={maskBalances} />}
    </div>
  );
}

function BizHome({ data, derived, lang, maskBalances, onNavigate, onOpenTx, onOpenReceipt }) {
  const L = (a, e) => (lang === 'id' ? a : e);
  const b = bizData(data);
  const today = todayYmd();
  const mk = thisMonthKey();
  const range = monthRange(mk);
  const m = (v) => (maskBalances ? 'Rp ••••' : rp(v));

  const todaySales = useMemo(() => salesSummary(data, { from: today, to: today }), [data, today]);
  const monthSales = useMemo(() => salesSummary(data, range), [data, range.from]);
  const pl = useMemo(() => incomeStatement(data, { ...range, lang }), [data, range.from, lang]);
  const low = lowStock(b.products);
  const cash = Object.values(derived.accountBalances || {}).reduce((s, v) => s + n(v), 0);
  const receivable = (data.debts || []).filter((d) => d.kind === 'receivable').reduce((s, d) => s + Math.max(0, n(d.totalAmount) - n(d.paidAmount)), 0);
  const payable = (data.debts || []).filter((d) => d.kind !== 'receivable').reduce((s, d) => s + Math.max(0, n(d.totalAmount) - n(d.paidAmount)), 0);
  const todayGross = todaySales.revenue - todaySales.tax - todaySales.cogs;
  const recent = [...data.transactions].sort((a, c) => c.date.localeCompare(a.date)).slice(0, 5);

  const actions = [
    { icon: ShoppingCart, label: L('Kasir', 'POS'), go: () => onNavigate('biz_pos') },
    { icon: Plus, label: L('Catat Biaya', 'Add Expense'), go: () => onOpenTx() },
    { icon: Package, label: L('Produk', 'Products'), go: () => onNavigate('biz_stock') },
    { icon: Users, label: L('Gaji', 'Payroll'), go: () => onNavigate('biz_payroll') },
    { icon: Landmark, label: L('Aset', 'Assets'), go: () => onNavigate('biz_assets') },
    { icon: BarChart3, label: L('Laporan', 'Reports'), go: () => onNavigate('biz_reports') },
    { icon: ScanLine, label: L('Scan Struk', 'Scan'), go: onOpenReceipt },
    { icon: HandCoins, label: L('Utang/Piutang', 'Debts'), go: () => onNavigate('debts') },
  ];

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-life-accent to-life-accent-dark text-life-bg shadow-xl">
        <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-xs font-medium opacity-80">{L('Omzet hari ini', "Today's sales")}</p>
          <h2 className="text-3xl font-bold tabular-nums tracking-tight mt-1">{m(todaySales.revenue)}</h2>
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <div className="rounded-2xl bg-black/15 p-3">
              <p className="text-[11px] opacity-80">{L('Transaksi', 'Transactions')}</p>
              <p className="text-sm font-semibold tabular-nums mt-0.5">{todaySales.count}</p>
            </div>
            <div className="rounded-2xl bg-black/15 p-3">
              <p className="text-[11px] opacity-80">{L('Laba kotor hari ini', 'Gross profit today')}</p>
              <p className="text-sm font-semibold tabular-nums mt-0.5">{m(todayGross)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {actions.slice(0, 8).map((a) => (
          <button key={a.label} onClick={a.go} className="flex flex-col items-center gap-1.5 py-2 rounded-2xl active:bg-life-surface">
            <span className="w-12 h-12 rounded-2xl bg-life-accent/15 border border-life-accent/40 text-life-accent flex items-center justify-center"><a.icon className="w-5 h-5" /></span>
            <span className="text-[10px] text-center leading-tight text-life-soft">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Stat label={L('Laba bersih bulan ini', 'Net profit (month)')} value={pl.netProfit} tone={pl.netProfit >= 0 ? 'pos' : 'neg'} sub={`${L('margin', 'margin')} ${pl.margin.toFixed(1)}%`} masked={maskBalances} />
        <Stat label={L('Kas & bank', 'Cash & bank')} value={cash} masked={maskBalances} />
        <Stat label={L('Piutang', 'Receivables')} value={receivable} masked={maskBalances} />
        <Stat label={L('Utang', 'Payables')} value={payable} masked={maskBalances} />
      </div>

      {low.length > 0 && (
        <div className="rounded-2xl bg-[#D96B52]/10 border border-[#D96B52]/35 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-life-text"><AlertTriangle className="w-4 h-4 text-[#F29B87]" /> {L('Stok menipis', 'Low stock')} ({low.length})</p>
          <div className="mt-1.5">
            {low.slice(0, 5).map((p) => <Row key={p.id} label={p.name} value={`${n(p.stock)} ${p.unit || ''}`} tone="neg" />)}
          </div>
          <button onClick={() => onNavigate('biz_stock')} className="mt-1 text-xs font-semibold text-life-accent">{L('Kelola stok →', 'Manage stock →')}</button>
        </div>
      )}

      {monthSales.top.length > 0 && (
        <div className="rounded-2xl bg-life-surface border border-life-border/40 p-4">
          <SectionLabel>{L('Terlaris bulan ini', 'Top sellers this month')}</SectionLabel>
          {monthSales.top.slice(0, 5).map((t) => <Row key={t.name} label={`${t.name} · ${t.qty}x`} value={m(t.revenue)} />)}
        </div>
      )}

      <div className="rounded-2xl bg-life-surface border border-life-border/40 p-4">
        <SectionLabel>{L('Transaksi terbaru', 'Recent transactions')}</SectionLabel>
        {recent.length === 0 ? (
          <p className="text-xs text-life-muted py-2">{L('Belum ada transaksi. Mulai dari Kasir atau catat biaya.', 'No transactions yet. Start with POS or add an expense.')}</p>
        ) : (
          <div className="divide-y divide-life-border/25">
            {recent.map((tx) => <TxRow key={tx.id} tx={tx} data={data} lang={lang} masked={maskBalances} compact onClick={() => onNavigate('activity')} />)}
          </div>
        )}
      </div>
    </div>
  );
}
