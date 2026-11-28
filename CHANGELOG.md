# CHANGELOG

## V2 — Fase 1 & 2 (parsial) — 28 Nov 2026
Dasar: `life-os-audited.zip` (superset dari `life-os-allinone_8.zip`; perbedaan hanya HANDOFF, README, App.jsx, index.css + AUDIT_REPORT).

### Ditambahkan (logika murni, teruji, BELUM terhubung ke UI)
- `src/features/vaultCrypto.js` — enkripsi backup AES-256-GCM, kunci dari passphrase via PBKDF2-SHA256 (310.000 iterasi), salt & IV acak, integritas GCM. Kunci tidak disimpan.
- `src/features/financeCalc.js` — net worth (kas + piutang − utang), skor kesehatan keuangan (rasio tabungan, runway dana darurat, beban utang), simulasi pelunasan, progres target, total langganan. Semua dari data nyata; skor `null` bila data kurang (bukan angka dummy).
- `tests/t_v2.mjs` — 9 uji baru.

### Diubah di App.jsx (langkah 2)
- **Ekspor JSON**: meminta passphrase; diisi → file `.enc.json` terenkripsi AES-256-GCM; kosong → plaintext dengan notifikasi jelas "tanpa enkripsi"; batal → tidak ada file.
- **Impor/Restore JSON & Restore Drive** (satu jalur `handleImportJson`): mendukung backup terenkripsi (minta passphrase, pesan jelas bila salah/rusak); validasi format; **ringkasan dampak** (jumlah data sekarang → sesudah, peringatan bila berkurang) + konfirmasi; **salinan pra-restore** disimpan di `localStorage` key `lifeos:prerestore:<workspaceKey>` (1 salinan terakhir) sebelum menimpa.
- Bug diperbaiki: file non-JSON sebelumnya gagal diam-diam; kini muncul pesan error.
- Baru: `src/features/restoreGuard.js` + 1 uji.

### Langkah 3
- `tests/t_accounting.mjs` (5 uji): bon dengan 2 pembayaran sebagian, laba kotor, penyusutan, skenario gabungan (jurnal per entri seimbang, neraca saldo & neraca seimbang, kas akhir Arus Kas = kas Neraca), nilai persediaan = stok fisik. Tidak ditemukan bug di mesin akuntansi; satu kegagalan awal berasal dari fixture uji (stok tanpa stok awal), bukan kode aplikasi.
- `src/features/migrations.js`: migrasi skema V2 aditif + idempoten + rollback yang menolak bila ada data pengguna (belum dipanggil dari aplikasi; menunggu UI Goals/Langganan).
- `.github/workflows/ci.yml`: menjalankan 3 suite uji + `npm run build` di CI (satu-satunya tempat build Vite bisa diverifikasi).

### Langkah 4 — Ikhtisar Keuangan (UI baru)
- `src/features/FinanceOverview.jsx`, rute `overview`, menu "Ikhtisar" (grup Keuangan di Menu + sidebar). Isi: kekayaan bersih (dengan rincian & catatan selisih dari Beranda), skor kesehatan keuangan (rumus ditampilkan, "belum cukup data" bila tanpa pemasukan), grafik pemasukan vs pengeluaran 6 bulan, alokasi aset, simulasi pelunasan utang (read-only, tidak mengubah data).
- `financeCalc.js` diselaraskan dengan `derived` di App.jsx: saldo kini menghitung transfer antar-rekening, kekayaan bersih memasukkan investasi & dana tabungan. (Versi awal mengabaikan transfer — dikoreksi + diuji.)
- Temuan: modul Langganan, Tabungan/Target, Investasi, Utang, Anggaran, Habit, Tugas, Kalender, Catatan SUDAH ADA di aplikasi. `migrations.js` (goals/subscriptions) karena itu tidak diperlukan sekarang dan tidak dipakai; pekerjaan V2 untuk modul-modul itu = penyempurnaan, bukan modul baru.
- Verifikasi: bundling esbuild OK + 12 uji logika. BELUM dirender di browser (kemungkinan bug tampilan/tema belum terdeteksi).

### Tidak diubah
Skema data, key LocalStorage lama, Drive sync/backup otomatis (tetap plaintext). Tidak ada migrasi → data lama aman.

## Belum dikerjakan
Lihat ROADMAP.md.
