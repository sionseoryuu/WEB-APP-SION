# HANDOFF — Alur Registrasi LIFE OS (28 Nov 2026)

## Status
Selesai & lolos kompilasi esbuild (belum diuji di perangkat).

## Alur baru (belum login)
1. **Tipe Pencatatan** — Usaha/Bisnis atau Pribadi/Keluarga (kartu pilihan, centang). Tautan "Sudah punya akun? Masuk" langsung ke langkah 3.
2. **Nama Usaha / Nama Profil** + kotak privasi (wajib dicentang).
3. **Sinkron Google** — `signInWithGoogle()` -> cek data di Drive -> masuk ke aplikasi.
Tautan kecil di bawah: "Pakai email & kata sandi (akun lama)" membuka `AuthPortalScreen` lama (akun lokal + demo tetap ada).

## File berubah
- `src/features/Onboarding.jsx` (BARU) — komponen 3 langkah, teks ID/EN di dalamnya.
- `src/App.jsx`
  - import `OnboardingFlow`
  - `createWorkspaceFromSetup()` — bikin data awal sesuai tipe (usaha: akun "Kas Usaha", kategori Penjualan, Jasa/Freelance, Pembelian Stok, Gaji Karyawan, Sewa & Operasional; `profile.ledgerType` = business|personal)
  - di `LifeOsWorkspace`: state `legacyAuth`, `handleAuthSuccess`, `handleOnboardGoogle`, dan blok `if (!currentUser)` diganti.

## Perilaku penting
- Bila Drive/perangkat sudah punya data akun itu, data lama dipakai dan pilihan registrasi diabaikan.
- Teks privasi sengaja jujur: "terenkripsi saat dikirim (HTTPS)", BUKAN enkripsi data-at-rest. Data di localStorage belum dienkripsi.
- Flag persetujuan: `localStorage['lifeos:privacy_ack']`.

## Ide lanjutan
- Enkripsi data-at-rest (WebCrypto AES-GCM) bila ingin klaim "terenkripsi" penuh.
- Tampilkan/ubah `ledgerType` di Pengaturan ("Bisa diubah nanti" sudah dijanjikan di UI, tapi pengubahnya belum dibuat).
- Login Google berbasis popup bisa gagal di WebView APK Capacitor (lihat README); pertimbangkan plugin Google native.
- Warna mengikuti tema aplikasi (cokelat gelap), bukan indigo seperti referensi.
