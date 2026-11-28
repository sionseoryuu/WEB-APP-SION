// Peringatan anggaran: notifikasi saat kategori mencapai 80% dan 100% dari batas (sekali per bulan per ambang).
export const THRESHOLDS = [80, 100];

// budgets: anggaran efektif bulan ini [{category, limit}]; log: { 'YYYY-MM|Kategori|80': true }
export function computeBudgetAlerts({ transactions, budgets, month, log = {} }) {
  const spent = {};
  transactions.forEach((tx) => {
    if (tx.type === 'expense' && String(tx.date).startsWith(month)) {
      spent[tx.category] = (spent[tx.category] || 0) + (Number(tx.amount) || 0);
    }
  });
  const alerts = [];
  const nextLog = { ...log };
  budgets.forEach((b) => {
    const limit = Number(b.limit) || 0;
    if (limit <= 0) return;
    const used = spent[b.category] || 0;
    const pct = (used / limit) * 100;
    // Ambang tertinggi yang terlewati; ambang di bawahnya ikut ditandai agar tidak muncul susulan
    const crossed = THRESHOLDS.filter((th) => pct >= th);
    if (!crossed.length) return;
    const top = crossed[crossed.length - 1];
    const topKey = `${month}|${b.category}|${top}`;
    crossed.forEach((th) => {
      const k = `${month}|${b.category}|${th}`;
      if (!nextLog[k]) {
        nextLog[k] = true;
        if (th === top && !log[topKey]) {
          alerts.push({ key: topKey, category: b.category, threshold: top, spent: used, limit, pct: Math.round(pct) });
        }
      }
    });
  });
  return { alerts, log: nextLog, changed: alerts.length > 0 || Object.keys(nextLog).length !== Object.keys(log).length };
}

// Bersihkan log bulan-bulan lama agar data tidak membengkak (simpan bulan ini saja)
export const pruneAlertLog = (log = {}, month) =>
  Object.fromEntries(Object.entries(log).filter(([k]) => k.startsWith(`${month}|`)));
