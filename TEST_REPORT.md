# TEST REPORT

Lingkungan: Node 22, tanpa jaringan, tanpa `node_modules` → `npm install`/`vite build`/Playwright/Lighthouse **tidak bisa dijalankan**.

| Suite | Hasil | Cakupan |
|---|---|---|
| `node tests/t_v71.mjs` | 10/10 lulus | Penjualan tunai/bon, piutang, void, stok, workspace delete |
| `node tests/t_v2.mjs` | 12/12 lulus | Enkripsi backup, net worth, health score, simulasi pelunasan, goal, langganan, restoreGuard, migrasi |
| `node tests/t_accounting.mjs` | 5/5 lulus | Invarian akuntansi |
| esbuild bundle `src/App.jsx` (jsx, deps eksternal) | lulus (1,05 MB) | Sintaks JSX + resolusi import; BUKAN `vite build` |
| `node --check` semua `src/**/*.js` | lulus | Sintaks saja |

## TIDAK diuji (jangan dianggap lulus)
Alur UI ekspor/restore di browser (prompt/confirm belum dicoba manual), build produksi Vite, render UI, E2E (registrasi, login, workspace, POS, backup/restore, offline, sync), responsive 320–1440px, aksesibilitas, Core Web Vitals/Lighthouse, APK, Google OAuth/Drive, OCR/AI.

## Reproduksi
```
cd life-os
node tests/t_v71.mjs
node tests/t_v2.mjs
```
Pada mesin dengan internet: `npm install && npm run build`, lalu tambahkan Playwright.
