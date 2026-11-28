// Ringkasan mingguan: pengeluaran vs minggu lalu, kebiasaan konsisten, dan target yang bergerak.
import { addDays, startOfWeek, ymd, parseYmd } from './dates.js';

const sumRange = (txs, type, from, to) =>
  txs.filter((t) => t.type === type && t.date >= from && t.date <= to).reduce((s, t) => s + (Number(t.amount) || 0), 0);

export function buildWeeklySummary(data, today) {
  const start = startOfWeek(today); // Senin minggu berjalan
  const end = addDays(start, 6);
  const prevStart = addDays(start, -7);
  const prevEnd = addDays(start, -1);
  const txs = data.transactions || [];

  const spent = sumRange(txs, 'expense', start, end);
  const prevSpent = sumRange(txs, 'expense', prevStart, prevEnd);
  const income = sumRange(txs, 'income', start, end);
  const delta = spent - prevSpent;
  const deltaPct = prevSpent > 0 ? Math.round((delta / prevSpent) * 100) : null;

  // Kategori yang paling berubah
  const byCat = (from, to) => {
    const m = {};
    txs.forEach((t) => {
      if (t.type === 'expense' && t.date >= from && t.date <= to) m[t.category] = (m[t.category] || 0) + (Number(t.amount) || 0);
    });
    return m;
  };
  const cur = byCat(start, end);
  const prev = byCat(prevStart, prevEnd);
  const cats = [...new Set([...Object.keys(cur), ...Object.keys(prev)])].map((c) => ({
    category: c,
    now: cur[c] || 0,
    before: prev[c] || 0,
    diff: (cur[c] || 0) - (prev[c] || 0),
  }));
  const topCategory = [...cats].sort((a, b) => b.now - a.now)[0] || null;
  const biggestRise = [...cats].filter((c) => c.diff > 0).sort((a, b) => b.diff - a.diff)[0] || null;
  const biggestDrop = [...cats].filter((c) => c.diff < 0).sort((a, b) => a.diff - b.diff)[0] || null;

  // Hari tanpa belanja (hanya hari yang sudah lewat/hari ini)
  let noSpendDays = 0;
  let elapsed = 0;
  for (let i = 0; i < 7; i += 1) {
    const d = addDays(start, i);
    if (d > today) break;
    elapsed += 1;
    if (!txs.some((t) => t.type === 'expense' && t.date === d)) noSpendDays += 1;
  }

  // Kebiasaan: berapa hari selesai minggu ini dibanding target mingguan
  const habits = (data.habits || []).map((h) => {
    const done = (h.completedDates || []).filter((d) => d >= start && d <= end).length;
    const target = Math.max(1, Math.min(7, Number(h.targetPerWeek) || 7));
    return { id: h.id, name: h.name, done, target, consistent: done >= Math.min(target, Math.max(1, elapsed)) && done >= 1 };
  });
  const consistentHabits = habits.filter((h) => h.consistent);

  // Target yang bergerak: tabungan (setoran minggu ini) & tujuan (milestone selesai)
  const savingsMoves = (data.savingsGoals || [])
    .map((sg) => {
      const total = sg.contributions.reduce((s, c) => s + (Number(c.amount) || 0), 0);
      const added = sg.contributions.filter((c) => c.date >= start && c.date <= end).reduce((s, c) => s + (Number(c.amount) || 0), 0);
      const pct = sg.targetAmount > 0 ? Math.min(100, Math.round((total / sg.targetAmount) * 100)) : 0;
      return { id: sg.id, name: sg.name, added, pct };
    })
    .filter((m) => m.added !== 0);
  const goalMoves = (data.goals || [])
    .map((g) => {
      const doneMs = g.milestones.filter((m) => m.completed).length;
      return { id: g.id, title: g.title || g.name, done: doneMs, total: g.milestones.length };
    })
    .filter((g) => g.total > 0);

  const tasksDone = (data.tasks || []).filter((t) => t.status === 'completed' && t.dueDate >= start && t.dueDate <= end).length;

  return {
    start, end, spent, prevSpent, income, delta, deltaPct, topCategory, biggestRise, biggestDrop,
    noSpendDays, elapsed, habits, consistentHabits, savingsMoves, goalMoves, tasksDone,
  };
}

export const isSunday = (today) => parseYmd(today).getDay() === 0;
export { ymd };
