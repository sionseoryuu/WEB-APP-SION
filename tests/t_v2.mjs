import { webcrypto } from 'node:crypto';
if (!globalThis.crypto?.subtle) globalThis.crypto = webcrypto;
import { encryptBackup, decryptBackup, isEncryptedBackup } from '../src/features/vaultCrypto.js';
import { netWorth, accountBalances, monthlySeries, allocation, healthScore, payoffSimulation, goalProgress, subscriptionTotals } from '../src/features/financeCalc.js';
import { isValidBackup, impactSummary, impactText } from '../src/features/restoreGuard.js';
import { migrateToV2, rollbackV2 } from '../src/features/migrations.js';
let pass = 0, fail = 0;
const t = async (name, fn) => { try { await fn(); console.log('ok  -', name); pass++; } catch (e) { console.log('GAGAL -', name, '→', e.message); fail++; } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m || ''} dapat ${JSON.stringify(a)} harap ${JSON.stringify(b)}`); };

await t('enkripsi: round-trip', async () => { const o = { a: 1, t: 'héllo' }; const e = await encryptBackup(o, 'rahasia-123'); eq(isEncryptedBackup(e), true); eq(await decryptBackup(e, 'rahasia-123'), o); });
await t('enkripsi: passphrase salah ditolak', async () => { const e = await encryptBackup({ x: 1 }, 'rahasia-123'); let ok = false; try { await decryptBackup(e, 'salah-salah'); } catch { ok = true; } eq(ok, true); });
await t('enkripsi: ciphertext dirusak ditolak (integritas GCM)', async () => { const e = await encryptBackup({ x: 1 }, 'rahasia-123'); e.ct = e.ct.slice(0, -4) + 'AAAA'; let ok = false; try { await decryptBackup(e, 'rahasia-123'); } catch { ok = true; } eq(ok, true); });
await t('enkripsi: passphrase pendek ditolak; salt/iv acak', async () => { let ok = false; try { await encryptBackup({}, 'abc'); } catch { ok = true; } eq(ok, true); const a = await encryptBackup({}, 'abcdefgh'), b = await encryptBackup({}, 'abcdefgh'); eq(a.salt !== b.salt && a.ct !== b.ct, true); });
await t('netWorth: dompet+investasi+vault+piutang−utang, transfer tidak mengubah total', () => {
  const d = { accounts: [{ id: 'a', initialBalance: 1000 }, { id: 'b', initialBalance: 0 }], transactions: [{ accountId: 'a', type: 'income', amount: 500 }, { accountId: 'a', type: 'expense', amount: 200 }, { accountId: 'a', toAccountId: 'b', type: 'transfer', amount: 300 }],
    investments: [{ currentValue: 700 }], savingsGoals: [{ contributions: [{ amount: 50, accountId: 'a' }, { amount: 99 }] }],
    debts: [{ kind: 'debt', totalAmount: 600, paidAmount: 100 }, { kind: 'receivable', totalAmount: 300, paidAmount: 50 }] };
  eq(accountBalances(d), { a: 1000, b: 300 });
  eq(netWorth(d), { cash: 1300, investments: 700, vault: 50, receivable: 250, debt: 500, appNetWorth: 2050, netWorth: 1800 });
});
await t('monthlySeries & allocation', () => {
  const s = monthlySeries([{ date: '2026-11-03', type: 'income', amount: 10 }, { date: '2026-10-09', type: 'expense', amount: 4 }, { date: '2026-11-04', type: 'transfer', amount: 99 }], '2026-11', 3);
  eq(s.map((x) => x.key), ['2026-09', '2026-10', '2026-11']); eq(s[2].net, 10); eq(s[1].net, -4);
  eq(allocation({ cash: 75, investments: 25, vault: 0, receivable: 0 }).map((x) => x.pct), [75, 25]);
});
await t('netWorth: bayar sebagian tidak membuat sisa negatif', () => eq(netWorth({ accounts: [], transactions: [], debts: [{ kind: 'debt', totalAmount: 100, paidAmount: 150 }] }).debt, 0));
await t('healthScore: null tanpa pemasukan; 100 pada kondisi ideal', () => { eq(healthScore({ income: 0, expense: 0, liquid: 0 }), null); eq(healthScore({ income: 10, expense: 5, liquid: 30, monthlyDebtPayment: 0 }), 100); });
await t('payoff: bunga 0% = saldo/cicilan; cicilan ≤ bunga tidak layak', () => { eq(payoffSimulation(1200, 100, 0).months, 12); eq(payoffSimulation(1000000, 5000, 12).feasible, false); });
await t('goalProgress & subscriptionTotals', () => { eq(goalProgress({ target: 1000, contributions: [{ amount: 250 }, { amount: 250 }] }).pct, 50); eq(subscriptionTotals([{ price: 120, cycle: 'yearly' }, { price: 50 }, { price: 99, active: false }]), { monthly: 60, yearly: 720, count: 2 }); });
await t('restoreGuard: validasi & ringkasan dampak', () => {
  eq(isValidBackup({ accounts: [], transactions: [] }), true); eq(isValidBackup({ accounts: [] }), false); eq(isValidBackup(null), false);
  const s = impactSummary({ accounts: [1], transactions: [1, 2, 3] }, { accounts: [1], transactions: [1] });
  eq(s.lossy, true); eq(s.rows.find((r) => r.key === 'transactions'), { key: 'transactions', now: 3, after: 1 });
  eq(impactText(s, 'id').includes('transactions: 3 → 1'), true);
  eq(impactSummary({ accounts: [1], transactions: [] }, { accounts: [1, 2], transactions: [] }).lossy, false);
});
await t('migrasi V2: aditif, idempoten, field lama utuh; rollback aman', () => {
  const v1 = { accounts: [{ id: 'a' }], transactions: [{ id: 't' }], profile: { name: 'x' } };
  const v2 = migrateToV2(v1);
  eq(v2.accounts, v1.accounts); eq(v2.goals, []); eq(v2.schemaVersion, 2); eq(migrateToV2(v2), v2);
  eq(v1.goals, undefined, 'input tidak dimutasi'); eq(rollbackV2(v2), v1);
  let blocked = false; try { rollbackV2({ ...v2, goals: [{ id: 1 }] }); } catch { blocked = true; } eq(blocked, true);
});
console.log(`\n${pass} lulus, ${fail} gagal`); process.exit(fail ? 1 : 0);
