import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Landmark, HeartPulse, Calculator, PieChart as PieIcon } from 'lucide-react';
import { Card, PageHeader, Empty, TextField, SelectField } from './ui.jsx';
import { fmt } from '../ewallet/helpers.js';
import { todayYmd } from './dates.js';
import { netWorth, monthlySeries, allocation, healthScore, payoffSimulation } from './financeCalc.js';

const n = (v) => Number(v) || 0;
const openOf = (d) => Math.max(0, n(d.totalAmount) - n(d.paidAmount));

const Row = ({ label, value, strong }) => (
  <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
    <span className="text-life-muted">{label}</span>
    <span className={`tabular-nums ${strong ? 'font-semibold text-life-text' : 'text-life-text'}`}>{value}</span>
  </div>
);

export default function FinanceOverview({ data, lang, maskBalances, onBack }) {
  const L = (id, en) => (lang === 'id' ? id : en);
  const cur = data.profile?.currency || 'Rp';
  const money = (v) => fmt(v, cur, maskBalances);
  const nowKey = todayYmd().slice(0, 7);

  const nw = useMemo(() => netWorth(data), [data]);
  const series = useMemo(() => monthlySeries(data.transactions || [], nowKey, 6), [data.transactions, nowKey]);
  const alloc = useMemo(() => allocation(nw), [nw]);
  const thisMonth = series[series.length - 1];
  const debtsOpen = useMemo(() => (data.debts || []).filter((d) => d.kind === 'debt' && openOf(d) > 0), [data.debts]);
  const monthlyDebt = debtsOpen.reduce((s, d) => s + n(d.monthlyAmount), 0);
  const score = healthScore({ income: thisMonth.income, expense: thisMonth.expense, liquid: nw.cash, monthlyDebtPayment: monthlyDebt });
  const savingsRate = thisMonth.income > 0 ? ((thisMonth.income - thisMonth.expense) / thisMonth.income) * 100 : null;
  const runway = thisMonth.expense > 0 ? nw.cash / thisMonth.expense : null;

  const [debtId, setDebtId] = useState('');
  const [pay, setPay] = useState('');
  const [rate, setRate] = useState('0');
  const debt = debtsOpen.find((d) => d.id === debtId) || null;
  const sim = debt ? payoffSimulation(openOf(debt), n(pay || debt.monthlyAmount), n(rate)) : null;
  const finish = sim && sim.feasible && sim.months > 0 ? (() => { const d = new Date(); d.setMonth(d.getMonth() + sim.months); return d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' }); })() : '';

  const allocLabel = { cash: L('Kas & rekening', 'Cash & accounts'), investments: L('Investasi', 'Investments'), vault: L('Dana tabungan', 'Savings vault'), receivable: L('Piutang', 'Receivables') };
  const scoreTone = score == null ? 'text-life-muted' : score >= 70 ? 'text-life-accent' : score >= 40 ? 'text-life-text' : 'text-[#F29B87]';
  const hasTx = (data.transactions || []).length > 0;

  return (
    <div className="space-y-4 pb-24">
      <PageHeader title={L('Ikhtisar Keuangan', 'Financial Overview')} subtitle={L('Dihitung dari transaksi dan aset Anda', 'Computed from your transactions and assets')} onBack={onBack} backLabel={L('Kembali', 'Back')} />

      <Card className="p-4">
        <div className="flex items-center gap-2 text-life-muted text-xs uppercase tracking-wider"><Landmark className="w-4 h-4" />{L('Kekayaan bersih', 'Net worth')}</div>
        <p className="text-2xl font-semibold text-life-text mt-1 tabular-nums">{money(nw.netWorth)}</p>
        <div className="mt-2 divide-y divide-life-border/30">
          <Row label={L('Kas & rekening', 'Cash & accounts')} value={money(nw.cash)} />
          <Row label={L('Investasi', 'Investments')} value={money(nw.investments)} />
          <Row label={L('Dana tabungan (dari rekening)', 'Savings vault (from accounts)')} value={money(nw.vault)} />
          <Row label={L('Piutang belum tertagih', 'Outstanding receivables')} value={money(nw.receivable)} />
          <Row label={L('Utang belum lunas', 'Outstanding debts')} value={`− ${money(nw.debt)}`} />
        </div>
        <p className="text-[11px] text-life-muted mt-2">{L(`Beranda menampilkan ${maskBalances ? '••••' : money(nw.appNetWorth)} (tanpa piutang & utang).`, `Home shows ${maskBalances ? '••••' : money(nw.appNetWorth)} (excluding receivables & debts).`)}</p>
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 text-life-muted text-xs uppercase tracking-wider"><HeartPulse className="w-4 h-4" />{L('Kesehatan keuangan bulan ini', 'Financial health this month')}</div>
        {score == null ? (
          <p className="text-sm text-life-muted mt-2">{L('Belum cukup data: skor butuh pemasukan bulan ini.', 'Not enough data: the score needs income this month.')}</p>
        ) : (
          <p className={`text-3xl font-semibold mt-1 tabular-nums ${scoreTone}`}>{score}<span className="text-sm text-life-muted"> / 100</span></p>
        )}
        <div className="mt-2 divide-y divide-life-border/30">
          <Row label={L('Rasio tabungan', 'Savings rate')} value={savingsRate == null ? '—' : `${savingsRate.toFixed(0)}%`} />
          <Row label={L('Ketahanan kas (bulan pengeluaran)', 'Cash runway (months of spending)')} value={runway == null ? '—' : runway.toFixed(1)} />
          <Row label={L('Cicilan utang / pemasukan', 'Debt payments / income')} value={thisMonth.income > 0 ? `${((monthlyDebt / thisMonth.income) * 100).toFixed(0)}%` : '—'} />
        </div>
        <p className="text-[11px] text-life-muted mt-2">{L('Skor = 40 poin rasio tabungan (target 20%), 35 poin ketahanan kas (target 6 bulan), 25 poin beban utang (batas 40%). Ini indikator sederhana, bukan nasihat keuangan.', 'Score = 40 pts savings rate (target 20%), 35 pts cash runway (target 6 months), 25 pts debt load (limit 40%). A simple indicator, not financial advice.')}</p>
      </Card>

      <Card className="p-4">
        <div className="text-life-muted text-xs uppercase tracking-wider mb-2">{L('Pemasukan vs pengeluaran (6 bulan)', 'Income vs expense (6 months)')}</div>
        {hasTx ? (
          <div className="h-52 text-life-accent" aria-label={L('Grafik pemasukan dan pengeluaran per bulan', 'Monthly income and expense chart')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series.map((s) => ({ ...s, label: s.key.slice(5) }))} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.6} />
                <YAxis hide />
                <Tooltip formatter={(v) => (maskBalances ? '••••' : money(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="income" name={L('Pemasukan', 'Income')} fill="currentColor" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name={L('Pengeluaran', 'Expense')} fill="#D96B52" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty icon={PieIcon} title={L('Belum ada transaksi', 'No transactions yet')} text={L('Catat transaksi agar grafik muncul.', 'Log transactions to see the chart.')} />
        )}
      </Card>

      <Card className="p-4">
        <div className="text-life-muted text-xs uppercase tracking-wider mb-2">{L('Alokasi aset', 'Asset allocation')}</div>
        {alloc.length === 0 ? (
          <p className="text-sm text-life-muted">{L('Belum ada aset positif.', 'No positive assets yet.')}</p>
        ) : alloc.map((a) => (
          <div key={a.key} className="mb-2.5">
            <div className="flex justify-between text-xs text-life-text mb-1"><span>{allocLabel[a.key]}</span><span className="tabular-nums">{a.pct.toFixed(0)}%</span></div>
            <div className="h-2 rounded-full bg-life-surface2 overflow-hidden" role="progressbar" aria-valuenow={Math.round(a.pct)} aria-valuemin={0} aria-valuemax={100} aria-label={allocLabel[a.key]}>
              <div className="h-full bg-life-accent" style={{ width: `${a.pct}%` }} />
            </div>
          </div>
        ))}
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-life-muted text-xs uppercase tracking-wider"><Calculator className="w-4 h-4" />{L('Simulasi pelunasan utang', 'Debt payoff simulator')}</div>
        {debtsOpen.length === 0 ? (
          <p className="text-sm text-life-muted">{L('Tidak ada utang aktif untuk disimulasikan.', 'No active debts to simulate.')}</p>
        ) : (
          <>
            <SelectField label={L('Pilih utang', 'Choose debt')} value={debtId} onChange={(e) => { setDebtId(e.target.value); setPay(''); }}>
              <option value="">{L('— pilih —', '— select —')}</option>
              {debtsOpen.map((d) => <option key={d.id} value={d.id}>{d.title} · {money(openOf(d))}</option>)}
            </SelectField>
            {debt && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <TextField label={L('Cicilan / bulan', 'Payment / month')} type="number" inputMode="decimal" min="0" value={pay} placeholder={String(n(debt.monthlyAmount) || '')} onChange={(e) => setPay(e.target.value)} />
                  <TextField label={L('Bunga / tahun (%)', 'Interest / year (%)')} type="number" inputMode="decimal" min="0" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} />
                </div>
                {n(pay || debt.monthlyAmount) <= 0 ? (
                  <p className="text-sm text-[#F29B87]" role="alert">{L('Isi cicilan per bulan lebih dari 0.', 'Enter a monthly payment above 0.')}</p>
                ) : !sim.feasible ? (
                  <p className="text-sm text-[#F29B87]" role="alert">{L('Cicilan tidak cukup menutup bunga — utang tidak akan lunas.', 'Payment does not cover interest — the debt will not be paid off.')}</p>
                ) : (
                  <div className="divide-y divide-life-border/30">
                    <Row label={L('Sisa utang', 'Remaining')} value={money(openOf(debt))} />
                    <Row label={L('Lunas dalam', 'Paid off in')} value={`${sim.months} ${L('bulan', 'months')}`} strong />
                    <Row label={L('Perkiraan lunas', 'Estimated payoff')} value={finish} />
                    <Row label={L('Total bunga', 'Total interest')} value={money(sim.totalInterest)} />
                  </div>
                )}
                <p className="text-[11px] text-life-muted">{L('Simulasi sederhana (bunga menurun bulanan); tidak mengubah data utang Anda.', 'Simple simulation (monthly declining interest); does not change your debt records.')}</p>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
