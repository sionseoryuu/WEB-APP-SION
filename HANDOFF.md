# HANDOFF — LIFE OS (update 28 Nov 2026, v7: Akun Ganda Pribadi/Bisnis + fitur bisnis lanjutan)

## Yang berubah di v7
**Akar masalah "pilih Pribadi/Bisnis hasilnya sama":** akun Google yang sudah punya data langsung membuka data lama (`existing || create...`), sehingga pilihan tipe di registrasi diabaikan; baris "Tipe pencatatan" di Profil juga hanya membalik label tanpa data baru. Sekarang satu login Google = beberapa **ruang kerja** (akun Pribadi / Bisnis), tiap ruang kerja punya data sendiri.

### Ruang kerja ganda
- `features/workspaces.js` — logika murni: kunci (`g_<sub>` = utama, `g_<sub>~<id>` = lainnya), registry lokal (`lifeos:wslist:<base>`), `pickWorkspace` (pilih/buat ruang kerja sesuai tipe), `mergeRegistry`.
- `driveSync.js` — file Drive per ruang kerja: utama `life-os-backup.json` (kompatibel data lama), lainnya `life-os-backup-<id>.json`. `listCloudWorkspaces()` memulihkan daftar akun di perangkat baru. `setActiveWs()` untuk fitur yang tak membawa id (cadangan otomatis).
- `features/WorkspaceSwitcher.jsx` — `WorkspaceChip` (Beranda pribadi), `WorkspaceSheet` (daftar akun + tambah akun baru).
- `App.jsx` — `handleOnboardGoogle` (pilih tipe → buka akun bertipe itu atau buat baru), `switchWorkspace`, `createWorkspace`, logout membersihkan salinan lokal semua akun yang sudah tersinkron. `currentUser` kini punya `baseKey` & `wsId`.
- Titik masuk "Beralih akun": chip di Beranda Pribadi, tombol "Beralih" di header Bisnis, kartu di atas Menu, baris di Profil, chip di header desktop.
- Aturan beralih: akun lama dikirim ke Drive dulu; bila salinan lokal akun tujuan punya perubahan belum terkirim, salinan lokal dipakai (tidak ditimpa cloud).

### Fitur bisnis baru
- **Penjualan kredit (Bon):** di Kasir pilih "Bon (bayar nanti)" (nama pelanggan wajib). Pendapatan diakui saat bon dibuat (Dr Piutang / Cr Penjualan), masuk modul Utang sebagai piutang (`debts[].saleId`). Tombol "Terima" di Utang/Piutang mencatat transaksi `biz:'ar_collect'` (Dr Kas / Cr Piutang). Bon yang sudah dibayar tidak bisa di-void.
- **Aset tetap & penyusutan** (`BizAssets.jsx`, `data.assets[]`): garis lurus per bulan, nilai sisa, tanah tidak disusutkan, beli dari kas (`biz:'asset_buy'`, kategori "Pembelian Aset Tetap") atau aset lama/modal. Masuk Laba Rugi (Beban Penyusutan) dan Neraca (Aset Tetap − Akumulasi Penyusutan).
- **Laporan Arus Kas** (metode langsung) di tab Laporan: kas awal, operasi masuk/keluar, investasi, kas akhir (cocok dengan saldo kas Neraca).
- Diuji dengan skenario: Neraca Saldo & Neraca seimbang, piutang = bon − pembayaran, kas akhir Arus Kas = saldo kas Neraca.

### Belum diuji / ide lanjut
- BELUM dijalankan di browser/HP (hanya bundling esbuild + uji logika murni). Uji alur: daftar Pribadi → Beralih → tambah Bisnis → keluar → masuk lagi di perangkat lain.
- Hapus/ganti nama akun dari daftar (file Drive akun yang dihapus belum ikut dihapus).
- Bon: cicilan sebagian (tombol Terima saat ini melunasi penuh), PPN keluaran/masukan terpisah, barcode, struk Bluetooth, multi-kasir.
- Jalur masuk email lama (legacy) tidak punya pilihan tipe; akun tambahan tetap bisa dibuat lewat "Beralih akun".

---


## Status
Alur registrasi 3 langkah (v5) + **Mode Bisnis lengkap (v6)**. Lolos bundling esbuild penuh; mesin akuntansi diuji dengan skenario contoh (Neraca Saldo & Neraca seimbang, nilai persediaan jurnal = nilai stok fisik). BELUM diuji di HP/browser.

## Cara mode bisnis aktif
`data.profile.ledgerType === 'business'` (dipilih saat registrasi, bisa diganti di Profil → "Tipe pencatatan").
Efeknya: Beranda = ringkasan bisnis, tombol bawah "Dompet" -> "Kasir", Menu punya grup "Bisnis" di paling atas.

## File baru (src/business/)
- `bizLogic.js` — logika murni: `buildLedger` (jurnal double-entry otomatis dari transaksi + penjualan + stok + gaji + utang/piutang), `incomeStatement`, `trialBalance`, `balanceSheet`, `salesSummary`, `calcPayslip`, teks struk/slip, CSV.
- `BusinessView.jsx` — hub (header, pill navigasi, Ringkasan/BizHome).
- `BizPOS.jsx` — Kasir: grid produk, item bebas, keranjang, diskon Rp/%, pajak, pelanggan, metode bayar -> akun, kembalian, struk (bagikan), riwayat, batalkan (void), pengaturan struk/pajak/metode.
- `BizStock.jsx` — produk CRUD, stok awal, beli stok (harga rata-rata tertimbang), stok opname, stok menipis.
- `BizPayroll.jsx` — karyawan (bulanan/harian), hitung gaji (lembur, bonus, potongan %, kasbon), bayar + slip gaji, setor potongan BPJS/pajak.
- `BizReports.jsx` — Laba Rugi, Neraca Saldo, Neraca, Penjualan; periode bulanan/tahunan/kustom; bagikan teks & CSV.
- `bizUi.jsx` — helper (shareText, Stat, Row).

## File berubah
- `App.jsx`: import BusinessView; `createWorkspaceFromSetup` (bisnis: akun "Kas Usaha", kategori bisnis, `pos`, array kosong); `renderBiz`, `bizMode`, case `biz_pos|biz_stock|biz_payroll|biz_reports`; `ownHeader`/`PRIMARY_TABS`; reset data mempertahankan tipe.
- `ewallet/parts.jsx` (BottomNav & MenuSheet menerima `bizMode`), `ewallet/services.js` (`BIZ_GROUP`), `ewallet/ProfileView.jsx` (baris ganti tipe).

## Model data tambahan (di dalam `data`, ikut tersinkron ke Drive)
`products[]`, `sales[]`, `employees[]`, `payrolls[]`, `stockMoves[]`, `pos{}`. Transaksi bisnis diberi `biz: 'sale'|'stock_buy'|'payroll'|'remit'`.

## Aturan akuntansi (penting)
- Penjualan kasir = transaksi income kategori "Penjualan" + HPP dari `sales.items.cost` (hanya barang `tracked`).
- Beli stok lewat menu Produk = **persediaan (aset)**; baru jadi HPP saat terjual. Kategori manual "Pembelian Stok" = langsung HPP (pembelian).
- Gaji: beban = gaji kotor; kas keluar = bersih; potongan masuk "Utang Potongan Gaji" sampai disetor (kategori "Setoran Potongan Gaji").
- Piutang/utang diambil dari modul Utang (saldo berjalan) dan diimbangi ke Modal.
- Menghapus transaksi penjualan dari Aktivitas tidak mengembalikan stok; pakai "Batalkan penjualan" di Kasir.

## Belum dibuat / ide lanjut
- Penjualan kredit (bon pelanggan) otomatis jadi piutang.
- Aset tetap & penyusutan, arus kas (cash flow), PPN keluaran/masukan terpisah.
- Barcode scan di kasir, cetak struk Bluetooth (ESC/POS), multi-outlet/kasir.
- Sidebar desktop belum memuat menu bisnis (mobile via Menu sudah).
- Enkripsi data-at-rest (teks privasi hanya klaim "terenkripsi saat dikirim/HTTPS").
- Ikon lucide baru (PackagePlus, PackageX, Landmark, ClipboardCheck, Settings2, UserPlus) belum diverifikasi di build asli.

## v7.1 (v8 zip) — Kasir & manajemen akun
- **Kasir (`business/BizPOS.jsx`)**: bar keranjang dirender lewat `createPortal` ke `document.body` (induk ber-`transform` membuat `fixed` salah acuan) dan disembunyikan saat lembar Pembayaran terbuka; qty bisa diketik (`QtyInput`, dibatasi stok, minimal 1); toolbar seragam 44px; kartu produk `min-h-[96px]` dengan badge di dalam kartu.
- **Logika kasir murni** di `business/bizLogic.js`: `applySale`, `applyVoid`, `voidBlocked`, `clampQty` (diuji, lihat `tests/t_v71.mjs`).
- **Tombol beralih akun** sama di Pribadi & Bisnis: header Bisnis memakai `WorkspaceChip`.
- **Hapus akun**: ikon tempat sampah per akun di lembar Beralih Akun + baris "Hapus akun ini" di Profil; konfirmasi mengetik `hapus akun` (`matchesPhrase`). Urutan: hapus file Drive dulu (`deleteCloudWorkspace`; gagal → batal, tidak ada yang hilang) → salinan lokal → registry. Akun aktif dihapus → buka akun lain lewat `switchWorkspace(id, { skipPush, force })` (agar data lama tidak terkirim ulang ke Drive); akun terakhir → keluar (`planDelete`).
- Uji: `node tests/t_v71.mjs` (10 uji). Bundling: `esbuild src/main.jsx --bundle --packages=external --format=esm --loader:.js=jsx --outfile=/tmp/x.js`.
- Catatan: kode v7.1 sempat hilang dari sesi sebelumnya (zip v7 tidak memuatnya) sehingga ditulis ulang dari catatan; BELUM diuji di browser/HP.


## Audit & hardening (28 Nov 2026)
- `App.jsx`: hash kata sandi lokal baru menggunakan PBKDF2-SHA-256 (310.000 iterasi, salt acak 16 byte). Login akun lama tetap kompatibel dan migrasi verifier legacy dilakukan setelah autentikasi berhasil.
- Verifikasi kata sandi untuk kunci aplikasi menggunakan fungsi verifier asynchronous.
- Registrasi lokal dibatalkan dengan pesan yang jelas bila Web Crypto tidak tersedia; penyimpanan akun/workspace dibersihkan jika proses simpan gagal.
- `index.css`: baseline focus-visible, reduced-motion, safe-area utilities, ukuran form mobile, dan touch handling.
- `README.md`: keterbatasan keamanan localStorage dan backup cloud dijelaskan secara eksplisit.
- `AUDIT_REPORT.md`: cakupan, temuan, skor sementara dan status pengujian.
- Validasi: 10/10 tes `t_v71`, pemeriksaan sintaks seluruh 50 file `.js/.jsx`, dan uji PBKDF2 terisolasi lulus. Build belum dapat dijalankan karena dependency Vite tidak tersedia di lingkungan audit. Tidak ada uji browser/HP.
