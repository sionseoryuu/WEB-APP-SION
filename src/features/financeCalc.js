// Logika murni Personal Finance V2 (belum terhubung ke UI). Semua angka dihitung dari data nyata.
const n = (v) => (Number.isFinite(+v) ? +v : 0);

// Saldo per akun — aturan sama dengan `derived` di App.jsx (termasuk transfer antar-rekening)
export function accountBalances(data) {
  const bal = {};
  (data.accounts || []).forEach((a) => { bal[a.id] = n(a.initialBalance); });
  (data.transactions || []).forEach((t) => {
    const amt = n(t.amount);
    if (t.type === 'income' && t.accountId in bal) bal[t.accountId] += amt;
    else if (t.type === 'expense' && t.accountId in bal) bal[t.accountId] -= amt;
    else if (t.type === 'transfer') {
      if (t.accountId in bal) bal[t.accountId] -= amt;
      if (t.toAccountId && t.toAccountId in bal) bal[t.toAccountId] += amt;
    }
  });
  return bal;
}

const openOf = (d) => Math.max(0, n(d.totalAmount) - n(d.paidAmount));

// `appNetWorth` = definisi di Beranda (dompet + investasi + dana tabungan);
// `netWorth` = appNetWorth + piutang − utang (tambahan V2, ditampilkan terpisah agar transparan).
export function netWorth(data) {
  const cash = Object.values(accountBalances(data)).reduce((s, v) => s + v, 0);
  const investments = (data.investments || []).reduce((s, i) => s + n(i.currentValue), 0);
  const vault = (data.savingsGoals || []).reduce((s, g) => s + (g.contributions || []).reduce((x, c) => x + (c.accountId ? n(c.amount) : 0), 0), 0);
  const receivable = (data.debts || []).filter((d) => d.kind !== 'debt').reduce((s, d) => s + openOf(d), 0);
  const debt = (data.debts || []).filter((d) => d.kind === 'debt').reduce((s, d) => s + openOf(d), 0);
  const appNetWorth = cash + investments + vault;
  return { cash, investments, vault, receivable, debt, appNetWorth, netWorth: appNetWorth + receivable - debt };
}

// Deret bulanan (pemasukan, pengeluaran) untuk `count` bulan berakhir di endKey (YYYY-MM)
export function monthlySeries(txs, endKey, count = 6) {
  const [y, m] = endKey.split('-').map(Number);
  const out = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(y, m - 1 - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const mt = (txs || []).filter((t) => String(t.date).startsWith(key));
    const income = mt.filter((t) => t.type === 'income').reduce((s, t) => s + n(t.amount), 0);
    const expense = mt.filter((t) => t.type === 'expense').reduce((s, t) => s + n(t.amount), 0);
    out.push({ key, income, expense, net: income - expense });
  }
  return out;
}

export function allocation(nw) {
  const parts = [['cash', nw.cash], ['investments', nw.investments], ['vault', nw.vault], ['receivable', nw.receivable]].filter(([, v]) => v > 0);
  const total = parts.reduce((s, [, v]) => s + v, 0);
  return parts.map(([key, value]) => ({ key, value, pct: total ? (value / total) * 100 : 0 }));
}

// Skor kesehatan keuangan 0–100 dari 3 rasio nyata: tabungan, dana darurat, beban utang. Mengembalikan null bila data kurang.
export function healthScore({ income, expense, liquid, monthlyDebtPayment }) {
  if (!(income > 0)) return null;
  const savingsRate = (income - expense) / income;
  const runway = expense > 0 ? liquid / expense : 6;
  const dti = n(monthlyDebtPayment) / income;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const s = 40 * clamp(savingsRate / 0.2) + 35 * clamp(runway / 6) + 25 * clamp(1 - dti / 0.4);
  return Math.round(s);
}

// Simulasi pelunasan (anuitas). rate = bunga per tahun (%, boleh 0).
export function payoffSimulation(balance, monthlyPayment, annualRate = 0, maxMonths = 600) {
  let b = n(balance), months = 0, interest = 0;
  const r = n(annualRate) / 100 / 12;
  if (b <= 0) return { months: 0, totalInterest: 0, feasible: true };
  if (monthlyPayment <= b * r) return { months: Infinity, totalInterest: Infinity, feasible: false };
  while (b > 0.005 && months < maxMonths) {
    const i = b * r; interest += i;
    b = b + i - Math.min(monthlyPayment, b + i); months++;
  }
  return { months, totalInterest: Math.round(interest * 100) / 100, feasible: months < maxMonths };
}

export function goalProgress(goal) {
  const saved = (goal.contributions || []).reduce((s, c) => s + n(c.amount), 0);
  const target = n(goal.target);
  return { saved, pct: target > 0 ? Math.min(100, (saved / target) * 100) : 0, remaining: Math.max(0, target - saved) };
}

export function subscriptionTotals(subs) {
  const act = (subs || []).filter((s) => s.active !== false);
  const monthly = act.reduce((s, x) => s + (x.cycle === 'yearly' ? n(x.price) / 12 : n(x.price)), 0);
  return { monthly: Math.round(monthly), yearly: Math.round(monthly * 12), count: act.length };
}
