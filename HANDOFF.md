# HANDOFF — LIFE OS (update 28 Nov 2026, v6: Mode Bisnis)

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
