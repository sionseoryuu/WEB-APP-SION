// Validasi & ringkasan dampak restore. Murni, tanpa efek samping.
const len = (x) => (Array.isArray(x) ? x.length : 0);
const COLS = ['accounts', 'transactions', 'debts', 'sales', 'products', 'employees', 'assets'];

export const isValidBackup = (o) => !!o && Array.isArray(o.accounts) && Array.isArray(o.transactions);

export function impactSummary(current, incoming) {
  const rows = COLS.map((k) => ({ key: k, now: len(current?.[k]), after: len(incoming?.[k]) })).filter((r) => r.now || r.after);
  return { rows, lossy: rows.some((r) => r.after < r.now) };
}

export function impactText(sum, lang = 'id') {
  const head = lang === 'id' ? 'Data saat ini akan DIGANTI oleh backup ini:' : 'Current data will be REPLACED by this backup:';
  const tail = lang === 'id' ? 'Salinan data saat ini disimpan otomatis sebagai cadangan pra-restore. Lanjutkan?' : 'A pre-restore copy of current data is saved automatically. Continue?';
  const warn = sum.lossy ? (lang === 'id' ? '\n⚠ Beberapa jumlah data akan BERKURANG.\n' : '\n⚠ Some record counts will DECREASE.\n') : '\n';
  return `${head}\n${sum.rows.map((r) => `• ${r.key}: ${r.now} → ${r.after}`).join('\n')}${warn}${tail}`;
}
