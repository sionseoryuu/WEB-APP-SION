# ROADMAP — sisa pekerjaan V2 (jujur)

**Selesai:** audit awal, baseline test, modul enkripsi backup, logika finansial pribadi (murni).

**Batas lingkungan ini:** tanpa React/Vite/browser terpasang, UI baru tidak bisa dijalankan atau diuji di sini. Fitur UI besar (redesain, dashboard widget, Kanban/Kalender/Habit/Catatan, multi-gudang/PO, AI) sengaja TIDAK ditulis buta karena akan menjadi kode tak terverifikasi di atas 11.580 baris `App.jsx`. CI (`ci.yml`) disiapkan agar build dan uji berjalan di GitHub.

**Selesai tambahan:** halaman Ikhtisar Keuangan (Net Worth, Health Score, tren, alokasi, simulasi utang) — belum diuji di browser.

**Prioritas berikutnya (urut):**
1. Di mesin dengan internet: `npm install`, `npm run build`, perbaiki error build. (Blocker semua fase)
2. ~~Ekspor terenkripsi + restore aman~~ SELESAI (manual). Sisa: UI pemulihan dari salinan pra-restore, riwayat versi Drive, enkripsi Drive opsional, ganti `window.prompt/confirm` dengan modal yang layak (prompt menampilkan passphrase terbuka).
3. Tambah CSP di `index.html`/header hosting; audit XSS pada render input pengguna.
4. Playwright E2E untuk skenario di prompt §13.
5. Hubungkan `financeCalc.js` ke UI: Net Worth, Goals, Subscription, simulasi utang. Skema baru: `data.goals[]`, `data.subscriptions[]` — tambah dengan migrasi aditif (default `[]`), tanpa mengubah field lama.
6. Pecah `App.jsx` (11.580 baris) menjadi modul + lazy loading.
7. Bisnis: bayar bon sebagian dari kasir, PPN masuk/keluar, multi-gudang, PO/supplier, barcode, Bluetooth printer.
8. Produktivitas: Kanban, kalender, habit, catatan.
9. AI assistant (via Worker; konfirmasi pengguna untuk setiap perubahan data).
10. Redesain UI/design system & dashboard widget.

**Temuan:** fitur bayar sebagian utang/piutang sudah ada di `handleSettleDebtInstallment` (dibatasi sisa saldo); HANDOFF menyebut "melunasi penuh" — sudah usang.

## Skor (berbasis bukti)
Tidak diberikan: tanpa build/runtime test, skor akan fiktif. Satu-satunya hal terverifikasi: logika bisnis inti (19 uji) dan kriptografi backup.
