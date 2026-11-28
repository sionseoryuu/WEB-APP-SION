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
