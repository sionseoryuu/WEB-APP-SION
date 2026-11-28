# LIFE OS — Audit & Perbaikan (28 November 2026)

## Ringkasan hasil

Audit dilakukan terhadap source ZIP `life-os-allinone_8.zip` secara statis, menjalankan test logika yang tersedia, dan mencoba build produksi. Ini **bukan** audit runtime penuh: dependency tidak berhasil dipasang di lingkungan ini dan `vite build` tidak dapat berjalan (`vite: not found`). Browser, perangkat fisik, API Google, dan akun Drive nyata tidak diuji.

### Perubahan yang diimplementasikan

1. **Verifikasi kata sandi lokal diperkuat**
   - Pendaftaran baru menggunakan PBKDF2-HMAC-SHA-256, salt acak 16-byte, 310.000 iterasi.
   - Login tetap menerima hash legacy agar akun lama tidak terkunci; setelah login legacy berhasil, verifier dimigrasikan.
   - Verifikasi kunci aplikasi menggunakan verifier baru secara asynchronous.
   - Jika Web Crypto tidak tersedia, proses registrasi dihentikan dengan pesan yang jelas.
   - Batasan: ini tetap autentikasi lokal sisi-klien, bukan autentikasi server. Pengguna yang dapat mengakses storage/devtools masih dapat memodifikasi aplikasi/data.

2. **Penyimpanan registrasi dibuat atomik secara praktis**
   - Jika penulisan akun atau workspace gagal, kedua key lokal dibersihkan sejauh storage mengizinkan dan UI menampilkan pesan gagal.
   - Mencegah UI melanjutkan seolah akun berhasil dibuat ketika penyimpanan gagal.

3. **Baseline aksesibilitas dan mobile**
   - Menambahkan focus-visible yang jelas, dukungan `prefers-reduced-motion`, penanganan ukuran layar minimum, kontrol form, safe-area utility, dan perbaikan touch interaction.
   - Mengurangi zoom otomatis iOS pada kontrol formulir di layar kecil.

4. **Transparansi keamanan**
   - README kini menjelaskan bahwa data lokal disimpan di `localStorage` tanpa enkripsi-at-rest, backup JSON Drive tidak dienkripsi aplikasi sebelum upload, dan `VITE_*` bukan tempat menyimpan secret.

## Cakupan source yang diperiksa

### Shell dan navigasi
- `src/main.jsx`, `src/App.jsx`, `src/index.css`, `src/theme.js`, `src/ThemeSettings.jsx`
- Alur autentikasi lokal/Google, onboarding, state workspace, menu/tab utama, pengaturan tema, serta penyimpanan lokal.

### Keuangan dan dompet
- `src/ewallet/HomeView.jsx`, `ActivityView.jsx`, `ProfileView.jsx`, `parts.jsx`, `services.js`, `helpers.js`
- Alur transaksi, tampilan beranda, aktivitas, profil, navigasi bawah/menu, helper QRIS/kategori.

### Bisnis
- `src/business/BusinessView.jsx`, `BizPOS.jsx`, `BizStock.jsx`, `BizPayroll.jsx`, `BizAssets.jsx`, `BizReports.jsx`, `bizLogic.js`, `bizUi.jsx`
- Kasir, stok, penggajian, aset, laporan dan logika jurnal.

### Fitur pendukung
- Seluruh file pada `src/features/`: onboarding, workspace switcher, pencarian, recurring, templates, notifikasi, lock screen, due list, weekly summary, export, backup otomatis, label, kalender, tanggal, laporan, file dan security settings.

### Integrasi dan deployment
- `src/driveSync.js`, `src/DriveBackup.jsx`, `src/ewallet/qrScan.js`, `receiptOcr.js`, `receiptAi.js`
- `worker/receipt-ai-worker.js`, konfigurasi Vite/Tailwind, manifest PWA, service worker, Capacitor, GitHub Actions dan dokumentasi.

## Temuan dan prioritas

| Prioritas | Temuan | Status |
|---|---|---|
| Critical | Login lokal hanya berjalan di browser dan tidak menyediakan batas keamanan server; data ruang kerja berada di localStorage | Didokumentasikan; perlu keputusan arsitektur/backend untuk proteksi sungguhan |
| High | Data lokal dan file backup Drive belum dienkripsi oleh aplikasi saat tersimpan | Didokumentasikan; enkripsi-at-rest belum diimplementasikan |
| High | Build produksi tidak dapat diverifikasi karena dependency tidak tersedia; instalasi dependency time-out | Belum terselesaikan di lingkungan audit |
| High | Browser, perangkat fisik, alur OAuth/Drive, service worker, dan integrasi AI belum diuji end-to-end | Belum diuji |
| Medium | Belum ada suite E2E/aksesibilitas yang terlihat dalam source yang diterima | Perlu ditambahkan dan dijalankan |
| Medium | Pengujian responsive seluruh route dan breakpoint belum dapat dilakukan tanpa menjalankan aplikasi | Belum diuji |
| Low | Baseline fokus keyboard dan reduced motion sebelumnya belum ditetapkan secara global | Diperbaiki pada `src/index.css` |

## Pengujian yang dijalankan

- `node tests/t_v71.mjs`: **10/10 lulus**.
  - Penjualan tunai dan bon.
  - Piutang dan penerimaan bon.
  - Pencegahan void bon yang telah dibayar.
  - Pengembalian stok saat void.
  - Pembatasan kuantitas.
  - Rencana penghapusan workspace.
  - Validasi frasa konfirmasi.
- Uji PBKDF2 terisolasi dengan Node Web Crypto: **lulus** (kata sandi benar diterima, kata sandi salah ditolak).
- `node --check` untuk seluruh file `.js`: **lulus**.
- Transpile pemeriksaan sintaks TypeScript untuk 50 file `.js/.jsx`: **lulus** (bukan pengganti build Vite).
- `npm run build`: **tidak berjalan**, karena executable Vite tidak tersedia (`vite: not found`).
- Instalasi dependency: dicoba, tetapi proses melewati batas waktu lingkungan; tidak dianggap berhasil.
- Tidak ada klaim bahwa browser/HP, Core Web Vitals, WCAG 2.2 AA, keamanan endpoint, atau integrasi cloud telah lulus.

## Penilaian sementara (1–100)

Nilai ini adalah **baseline risiko berdasarkan source dan pengujian yang tersedia**, bukan skor sertifikasi atau hasil pengukuran runtime.

| Area | Skor sementara | Dasar |
|---|---:|---|
| UX | 55 | Modul luas dan alur dasar tersedia; observasi pengguna belum dilakukan |
| UI | 55 | Struktur komponen dan tema ada; visual aktual belum dapat diverifikasi |
| Usability | 50 | Belum ada uji tugas dengan pengguna baru/awam |
| Responsive | 45 | Ada utility responsive, tetapi seluruh breakpoint belum diuji |
| Performa | 45 | Belum ada build bundle, Lighthouse, atau Core Web Vitals |
| Keamanan | 35 | Penyimpanan lokal tidak terenkripsi dan tidak ada otorisasi server untuk mode lokal |
| Kelengkapan fitur | 60 | Banyak modul tersedia; belum semua alur terverifikasi end-to-end |

## Langkah wajib sebelum rilis

1. Jalankan `npm ci` (atau `npm install` jika lockfile belum tersedia), lalu `npm run build`.
2. Uji login/registrasi, pemulihan sesi, workspace Pribadi/Bisnis, penghapusan workspace, dan konflik sinkronisasi Drive di browser nyata.
3. Uji seluruh form, tombol, modal, tabel, ekspor/impor, backup/restore, QRIS/OCR, notifikasi dan kasir pada data uji.
4. Jalankan E2E pada Chromium, Firefox, WebKit dan perangkat Android/iOS; uji viewport 320, 375, 430, 768, 1024, 1440 px.
5. Jalankan Lighthouse dan audit WCAG 2.2 AA dengan keyboard dan screen reader.
6. Untuk multi-pengguna atau data finansial sensitif, gunakan backend autentikasi dan otorisasi server, enkripsi-at-rest dengan pengelolaan kunci yang benar, validasi server, rate limiting, dan audit log. Jangan menganggap localStorage sebagai database aman.

