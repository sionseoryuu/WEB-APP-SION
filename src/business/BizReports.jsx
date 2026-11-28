import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Share2, FileSpreadsheet, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Btn, Chip, TextField } from '../features/ui.jsx';
import { balanceSheet, cashFlow, incomeStatement, monthRange, reportText, rp, salesSummary, toCsv, trialBalance } from './bizLogic.js';
import { Row, SectionLabel, Stat, notifyShare, shareText } from './bizUi.jsx';
import { addMonthsKey, todayYmd } from '../features/dates.js';
import { saveAndShare, MIME } from '../features/files.js';

const monthLabel = (key, lang) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' });
};

export default function BizReports({ data, notify, lang, maskBalances }) {
  const L = (a, e) => (lang === 'id' ? a : e);
  const shop = data.pos?.shopName || data.profile.name;
  const [tab, setTab] = useState('pl');
  const [mode, setMode] = useState('month');
  const [month, setMonth] = useState(todayYmd().slice(0, 7));
  const [from, setFrom] = useState(`${todayYmd().slice(0, 7)}-01`);
  const [to, setTo] = useState(todayYmd());

  const period = useMemo(() => {
    if (mode === 'year') {
      const y = month.slice(0, 4);
      return { from: `${y}-01-01`, to: `${y}-12-31`, label: `${L('Tahun', 'Year')} ${y}` };
    }
    if (mode === 'custom') return { from, to, label: `${from} → ${to}` };
    return { ...monthRange(month), label: monthLabel(month, lang) };
  }, [mode, month, from, to, lang]);

  const pl = useMemo(() => incomeStatement(data, { ...period, lang }), [data, period, lang]);
  const tb = useMemo(() => trialBalance(data, { to: period.to, lang }), [data, period, lang]);
  const bs = useMemo(() => balanceSheet(data, { to: period.to, lang }), [data, period, lang]);
  const ss = useMemo(() => salesSummary(data, period), [data, period]);
  const cf = useMemo(() => cashFlow(data, { ...period, lang }), [data, period, lang]);
  const m = (v) => (maskBalances ? 'Rp ••••' : rp(v));
  const neg = (v) => (v < 0 ? 'neg' : undefined);

  const buildText = () => {
    if (tab === 'pl') {
      const lines = ['PENDAPATAN', ...pl.revenue.map((r) => `  ${r.name}  ${rp(r.amount)}`), `Total Pendapatan  ${rp(pl.totalRevenue)}`, '', 'HARGA POKOK', ...pl.cogs.map((r) => `  ${r.name}  ${rp(r.amount)}`), `Total HPP  ${rp(pl.totalCogs)}`, `LABA KOTOR  ${rp(pl.grossProfit)}`, '', 'BEBAN', ...pl.expenses.map((r) => `  ${r.name}  ${rp(r.amount)}`), `Total Beban  ${rp(pl.totalExpense)}`, '', `LABA BERSIH  ${rp(pl.netProfit)} (${pl.margin.toFixed(1)}%)`];
      return reportText({ title: 'LAPORAN LABA RUGI', shop, period: period.label, lines });
    }
    if (tab === 'tb') {
      const lines = [...tb.rows.map((r) => `${r.name}\n   D ${rp(r.debit)}   K ${rp(r.credit)}`), '', `TOTAL  D ${rp(tb.totalDebit)}   K ${rp(tb.totalCredit)}`];
      return reportText({ title: 'NERACA SALDO', shop, period: `Per ${period.to}`, lines });
    }
    if (tab === 'cf') {
      const sec = (title, rows) => [title, ...rows.map((r) => `  ${r.name}  ${rp(r.amount)}`)];
      const lines = [`Kas awal  ${rp(cf.opening)}`, '', ...sec('KAS MASUK OPERASIONAL', cf.operatingIn), ...sec('KAS KELUAR OPERASIONAL', cf.operatingOut), `Arus kas operasi  ${rp(cf.netOperating)}`, '', ...sec('INVESTASI (KELUAR)', cf.investingOut), `Arus kas investasi  ${rp(cf.netInvesting)}`, '', `KENAIKAN (PENURUNAN) KAS  ${rp(cf.net)}`, `KAS AKHIR  ${rp(cf.closing)}`];
      return reportText({ title: 'LAPORAN ARUS KAS', shop, period: period.label, lines });
    }
    if (tab === 'bs') {
      const lines = ['ASET', ...bs.assets.map((r) => `  ${r.name}  ${rp(r.amount)}`), `Total Aset  ${rp(bs.totalAssets)}`, '', 'KEWAJIBAN', ...bs.liabilities.map((r) => `  ${r.name}  ${rp(r.amount)}`), `Total Kewajiban  ${rp(bs.totalLiab)}`, '', 'EKUITAS', ...bs.equity.map((r) => `  ${r.name}  ${rp(r.amount)}`), `Total Ekuitas  ${rp(bs.totalEquity)}`];
      return reportText({ title: 'NERACA', shop, period: `Per ${period.to}`, lines });
    }
    const lines = [`Omzet  ${rp(ss.revenue)}`, `Transaksi  ${ss.count}`, `Rata-rata  ${rp(ss.avg)}`, '', 'PRODUK TERLARIS', ...ss.top.map((t) => `  ${t.name}  ${t.qty}x  ${rp(t.revenue)}`)];
    return reportText({ title: 'RINGKASAN PENJUALAN', shop, period: period.label, lines });
  };

  const buildCsv = () => {
    if (tab === 'pl') return toCsv([['Bagian', 'Akun', 'Jumlah'], ...pl.revenue.map((r) => ['Pendapatan', r.name, Math.round(r.amount)]), ...pl.cogs.map((r) => ['HPP', r.name, Math.round(r.amount)]), ...pl.expenses.map((r) => ['Beban', r.name, Math.round(r.amount)]), ['', 'Laba Kotor', Math.round(pl.grossProfit)], ['', 'Laba Bersih', Math.round(pl.netProfit)]]);
    if (tab === 'tb') return toCsv([['Akun', 'Debit', 'Kredit'], ...tb.rows.map((r) => [r.name, Math.round(r.debit), Math.round(r.credit)]), ['TOTAL', Math.round(tb.totalDebit), Math.round(tb.totalCredit)]]);
    if (tab === 'cf') return toCsv([['Bagian', 'Uraian', 'Jumlah'], ['', 'Kas awal', Math.round(cf.opening)], ...cf.operatingIn.map((r) => ['Operasi masuk', r.name, Math.round(r.amount)]), ...cf.operatingOut.map((r) => ['Operasi keluar', r.name, -Math.round(r.amount)]), ...cf.investingOut.map((r) => ['Investasi keluar', r.name, -Math.round(r.amount)]), ['', 'Kenaikan kas', Math.round(cf.net)], ['', 'Kas akhir', Math.round(cf.closing)]]);
    if (tab === 'bs') return toCsv([['Bagian', 'Akun', 'Jumlah'], ...bs.assets.map((r) => ['Aset', r.name, Math.round(r.amount)]), ...bs.liabilities.map((r) => ['Kewajiban', r.name, Math.round(r.amount)]), ...bs.equity.map((r) => ['Ekuitas', r.name, Math.round(r.amount)])]);
    return toCsv([['No', 'Tanggal', 'Metode', 'Pelanggan', 'Total'], ...ss.list.map((s) => [s.no, s.date, s.method, s.customer || '', Math.round(s.total)])]);
  };

  const names = { pl: 'laba-rugi', cf: 'arus-kas', tb: 'neraca-saldo', bs: 'neraca', sales: 'penjualan' };
  const exportCsv = async () => {
    try {
      await saveAndShare({ filename: `${names[tab]}-${period.to}.csv`, content: '\ufeff' + buildCsv(), mime: MIME.csv, dialogTitle: names[tab] });
    } catch {
      notify(L('Gagal mengekspor', 'Export failed'));
    }
  };

  const days = Object.entries(ss.byDay).sort((a, c) => a[0].localeCompare(c[0])).slice(-14);
  const dayMax = Math.max(1, ...days.map((d) => d[1]));

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[['pl', L('Laba Rugi', 'P&L')], ['cf', L('Arus Kas', 'Cash Flow')], ['tb', L('Neraca Saldo', 'Trial Balance')], ['bs', L('Neraca', 'Balance Sheet')], ['sales', L('Penjualan', 'Sales')]].map(([id, label]) => (
          <Chip key={id} active={tab === id} onClick={() => setTab(id)}>{label}</Chip>
        ))}
      </div>

      <div className="rounded-2xl bg-life-surface border border-life-border/40 p-2 space-y-2">
        <div className="flex gap-2 px-1 pt-1">
          <Chip active={mode === 'month'} onClick={() => setMode('month')}>{L('Bulanan', 'Monthly')}</Chip>
          <Chip active={mode === 'year'} onClick={() => setMode('year')}>{L('Tahunan', 'Yearly')}</Chip>
          <Chip active={mode === 'custom'} onClick={() => setMode('custom')}>{L('Kustom', 'Custom')}</Chip>
        </div>
        {mode === 'custom' ? (
          <div className="grid grid-cols-2 gap-2 px-1 pb-1">
            <TextField label={L('Dari', 'From')} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <TextField label={L('Sampai', 'To')} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button onClick={() => setMonth(addMonthsKey(month, mode === 'year' ? -12 : -1))} className="p-2.5 rounded-xl text-life-soft" aria-label="Sebelumnya"><ChevronLeft className="w-5 h-5" /></button>
            <span className="text-sm font-semibold text-life-text capitalize">{period.label}</span>
            <button onClick={() => setMonth(addMonthsKey(month, mode === 'year' ? 12 : 1))} className="p-2.5 rounded-xl text-life-soft" aria-label="Berikutnya"><ChevronRight className="w-5 h-5" /></button>
          </div>
        )}
      </div>

      {tab === 'pl' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <Stat label={L('Pendapatan', 'Revenue')} value={pl.totalRevenue} masked={maskBalances} />
            <Stat label={L('Laba Bersih', 'Net Profit')} value={pl.netProfit} tone={pl.netProfit >= 0 ? 'pos' : 'neg'} sub={`${L('margin', 'margin')} ${pl.margin.toFixed(1)}%`} masked={maskBalances} />
          </div>
          <div className="rounded-2xl bg-life-surface border border-life-border/40 p-4">
            <SectionLabel>{L('Pendapatan', 'Revenue')}</SectionLabel>
            {pl.revenue.length === 0 && <p className="text-xs text-life-muted py-1">{L('Belum ada pendapatan pada periode ini.', 'No revenue in this period.')}</p>}
            {pl.revenue.map((r) => <Row key={r.id} label={r.name} value={m(r.amount)} indent />)}
            <Row label={L('Total Pendapatan', 'Total Revenue')} value={m(pl.totalRevenue)} bold />
            <SectionLabel>{L('Harga Pokok (HPP)', 'Cost of Goods')}</SectionLabel>
            {pl.cogs.map((r) => <Row key={r.id} label={r.name} value={m(r.amount)} indent />)}
            <Row label={L('Total HPP', 'Total COGS')} value={m(pl.totalCogs)} bold />
            <div className="border-t border-life-border/40 mt-2 pt-1">
              <Row label={`${L('Laba Kotor', 'Gross Profit')} (${pl.grossMargin.toFixed(1)}%)`} value={m(pl.grossProfit)} bold tone={neg(pl.grossProfit) || 'pos'} />
            </div>
            <SectionLabel>{L('Beban Operasional', 'Operating Expenses')}</SectionLabel>
            {pl.expenses.map((r) => <Row key={r.id} label={r.name} value={m(r.amount)} indent />)}
            <Row label={L('Total Beban', 'Total Expenses')} value={m(pl.totalExpense)} bold />
            <div className="border-t border-life-border/40 mt-2 pt-1">
              <Row label={L('LABA (RUGI) BERSIH', 'NET PROFIT (LOSS)')} value={m(pl.netProfit)} bold tone={pl.netProfit >= 0 ? 'pos' : 'neg'} />
            </div>
          </div>
        </div>
      )}

      {tab === 'cf' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <Stat label={L('Kas awal', 'Opening cash')} value={cf.opening} masked={maskBalances} />
            <Stat label={L('Kas akhir', 'Closing cash')} value={cf.closing} tone={cf.net >= 0 ? 'pos' : 'neg'} sub={`${cf.net >= 0 ? '+' : ''}${maskBalances ? '••••' : rp(cf.net)}`} masked={maskBalances} />
          </div>
          <div className="rounded-2xl bg-life-surface border border-life-border/40 p-4">
            <SectionLabel>{L('Kas masuk dari operasi', 'Operating inflows')}</SectionLabel>
            {cf.operatingIn.length === 0 && <p className="text-xs text-life-muted py-1">—</p>}
            {cf.operatingIn.map((r) => <Row key={r.name} label={r.name} value={m(r.amount)} indent />)}
            <SectionLabel>{L('Kas keluar untuk operasi', 'Operating outflows')}</SectionLabel>
            {cf.operatingOut.length === 0 && <p className="text-xs text-life-muted py-1">—</p>}
            {cf.operatingOut.map((r) => <Row key={r.name} label={r.name} value={`-${m(r.amount)}`} indent />)}
            <div className="border-t border-life-border/40 mt-2 pt-1">
              <Row label={L('Arus kas dari operasi', 'Net operating cash')} value={m(cf.netOperating)} bold tone={neg(cf.netOperating) || 'pos'} />
            </div>
            <SectionLabel>{L('Investasi & dana cadangan', 'Investing')}</SectionLabel>
            {cf.investingOut.length === 0 && <p className="text-xs text-life-muted py-1">—</p>}
            {cf.investingOut.map((r) => <Row key={r.name} label={r.name} value={`-${m(r.amount)}`} indent />)}
            <Row label={L('Arus kas dari investasi', 'Net investing cash')} value={m(cf.netInvesting)} bold tone={neg(cf.netInvesting)} />
            <div className="border-t border-life-border/40 mt-2 pt-1">
              <Row label={L('Kenaikan (penurunan) kas', 'Net change in cash')} value={m(cf.net)} bold tone={neg(cf.net) || 'pos'} />
              <Row label={L('Kas akhir periode', 'Closing cash')} value={m(cf.closing)} bold />
            </div>
          </div>
          <p className="text-[11px] text-life-muted">{L('Hanya uang yang benar-benar masuk/keluar. Penjualan bon baru masuk saat dibayar; penyusutan tidak memengaruhi kas.', 'Only real cash movements. Tab sales count when paid; depreciation does not affect cash.')}</p>
        </div>
      )}

      {tab === 'tb' && (
        <div className="rounded-2xl bg-life-surface border border-life-border/40 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-life-muted">{L('Per', 'As of')} {period.to}</p>
            <span className={`flex items-center gap-1 text-xs font-semibold ${tb.balanced ? 'text-[#87B082]' : 'text-[#F29B87]'}`}>
              {tb.balanced ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {tb.balanced ? L('Seimbang', 'Balanced') : L('Tidak seimbang', 'Unbalanced')}
            </span>
          </div>
          <div className="grid grid-cols-[1fr_88px_88px] gap-2 text-[10px] uppercase tracking-wider text-life-muted pb-1 border-b border-life-border/40">
            <span>{L('Akun', 'Account')}</span><span className="text-right">Debit</span><span className="text-right">{L('Kredit', 'Credit')}</span>
          </div>
          {tb.rows.length === 0 && <p className="text-xs text-life-muted py-3">{L('Belum ada transaksi.', 'No entries yet.')}</p>}
          {tb.rows.map((r) => (
            <div key={r.id} className="grid grid-cols-[1fr_88px_88px] gap-2 py-1.5 text-xs text-life-soft border-b border-life-border/15">
              <span className="min-w-0 break-words">{r.name}</span>
              <span className="text-right tabular-nums">{r.debit ? (maskBalances ? '••••' : Math.round(r.debit).toLocaleString('id-ID')) : ''}</span>
              <span className="text-right tabular-nums">{r.credit ? (maskBalances ? '••••' : Math.round(r.credit).toLocaleString('id-ID')) : ''}</span>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_88px_88px] gap-2 pt-2 text-xs font-bold text-life-text">
            <span>TOTAL</span>
            <span className="text-right tabular-nums">{maskBalances ? '••••' : Math.round(tb.totalDebit).toLocaleString('id-ID')}</span>
            <span className="text-right tabular-nums">{maskBalances ? '••••' : Math.round(tb.totalCredit).toLocaleString('id-ID')}</span>
          </div>
        </div>
      )}

      {tab === 'bs' && (
        <div className="rounded-2xl bg-life-surface border border-life-border/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-life-muted">{L('Per', 'As of')} {period.to}</p>
            <span className={`flex items-center gap-1 text-xs font-semibold ${bs.balanced ? 'text-[#87B082]' : 'text-[#F29B87]'}`}>
              {bs.balanced ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {bs.balanced ? L('Aset = Kewajiban + Ekuitas', 'Assets = Liabilities + Equity') : L('Tidak seimbang', 'Unbalanced')}
            </span>
          </div>
          <SectionLabel>{L('Aset', 'Assets')}</SectionLabel>
          {bs.assets.map((r) => <Row key={r.id} label={r.name} value={m(r.amount)} indent />)}
          <Row label={L('Total Aset', 'Total Assets')} value={m(bs.totalAssets)} bold />
          <SectionLabel>{L('Kewajiban', 'Liabilities')}</SectionLabel>
          {bs.liabilities.length === 0 && <p className="text-xs text-life-muted pl-4 py-1">—</p>}
          {bs.liabilities.map((r) => <Row key={r.id} label={r.name} value={m(r.amount)} indent />)}
          <Row label={L('Total Kewajiban', 'Total Liabilities')} value={m(bs.totalLiab)} bold />
          <SectionLabel>{L('Ekuitas', 'Equity')}</SectionLabel>
          {bs.equity.map((r) => <Row key={r.id} label={r.name} value={m(r.amount)} indent tone={r.id === 'profit' ? neg(r.amount) : undefined} />)}
          <Row label={L('Total Ekuitas', 'Total Equity')} value={m(bs.totalEquity)} bold />
          <div className="border-t border-life-border/40 mt-2 pt-1">
            <Row label={L('Kewajiban + Ekuitas', 'Liabilities + Equity')} value={m(bs.totalLiab + bs.totalEquity)} bold />
          </div>
        </div>
      )}

      {tab === 'sales' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <Stat label={L('Omzet Kasir', 'POS Revenue')} value={ss.revenue} masked={maskBalances} />
            <Stat label={L('Transaksi', 'Transactions')} value={String(ss.count)} sub={`${L('rata-rata', 'avg')} ${m(ss.avg)}`} />
          </div>
          {days.length > 0 && (
            <div className="rounded-2xl bg-life-surface border border-life-border/40 p-4">
              <SectionLabel>{L('Omzet harian (14 hari terakhir)', 'Daily revenue')}</SectionLabel>
              <div className="flex items-end gap-1 h-24 mt-2">
                {days.map(([d, v]) => (
                  <div key={d} className="flex-1 flex flex-col items-center justify-end h-full" title={`${d}: ${rp(v)}`}>
                    <div className="w-full rounded-t bg-life-accent" style={{ height: `${Math.max(4, (v / dayMax) * 100)}%` }} />
                    <span className="text-[8px] text-life-muted mt-1">{d.slice(8)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-2xl bg-life-surface border border-life-border/40 p-4">
            <SectionLabel>{L('Produk terlaris', 'Top products')}</SectionLabel>
            {ss.top.length === 0 && <p className="text-xs text-life-muted py-1">{L('Belum ada penjualan.', 'No sales yet.')}</p>}
            {ss.top.map((t) => <Row key={t.name} label={`${t.name} · ${t.qty}x`} value={m(t.revenue)} />)}
            <SectionLabel>{L('Per metode bayar', 'By payment method')}</SectionLabel>
            {ss.byMethod.map(([k, v]) => <Row key={k} label={k} value={m(v)} />)}
            {ss.discount > 0 && <Row label={L('Total diskon diberikan', 'Discounts given')} value={m(ss.discount)} />}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Btn onClick={async () => notifyShare(notify, await shareText(`${names[tab]} ${period.label}`, buildText()), lang === 'id')}><Share2 className="w-4 h-4" /> {L('Bagikan', 'Share')}</Btn>
        <Btn variant="secondary" onClick={exportCsv}><FileSpreadsheet className="w-4 h-4" /> CSV</Btn>
      </div>
      <p className="text-[11px] text-life-muted leading-relaxed">
        {L(
          'Laporan dihitung otomatis dari transaksi, kasir, stok, dan gaji Anda dengan pencatatan berpasangan (double-entry). Pembelian stok lewat menu Produk dicatat sebagai persediaan dan baru menjadi HPP saat barang terjual. Ini alat bantu pembukuan, bukan pengganti akuntan/pajak resmi.',
          'Reports are computed automatically (double-entry) from your transactions, POS, stock and payroll. Stock bought via Products is inventory until sold. A bookkeeping aid, not a substitute for a licensed accountant.'
        )}
      </p>
    </div>
  );
}
