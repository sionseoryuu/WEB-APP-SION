# LIFE OS — Personal Life & Wealth (All-in-One)

Satu aplikasi untuk semua kebutuhan: keuangan (dompet, anggaran, tabungan, investasi, langganan, utang), waktu (planner, tugas, kalender), pengembangan diri (kebiasaan, tujuan, relasi, catatan, belanja) dan laporan. Data tersimpan di perangkat; cadangan opsional ke Google Drive / Firebase.

## Navigasi
Bawah: **Beranda · Aktivitas · [MENU] · Dompet · Profil**. Tombol **Menu** di tengah membuka lembar berisi aksi cepat (Catat, Scan QRIS/Struk, Split Bill, Bagi Gaji, Briefing) dan semua modul.

## Jadi APK (Android)
1. Buat repo GitHub, push semua isi folder ini ke branch `main`.
2. Tab **Actions → Build APK** jalan otomatis (atau *Run workflow*).
3. Unduh `life-os-apk` dari hasil run → ekstrak → `app-debug.apk` → pasang di HP (izinkan "sumber tidak dikenal").

Atau lokal (butuh Node 20, JDK 17, Android SDK): `npm install && npm run build && bash scripts/prepare-android.sh && cd android && ./gradlew assembleDebug`.

## Jalankan sebagai web
`npm install && npm run dev`

## Opsional (variabel build)
- `VITE_GOOGLE_CLIENT_ID` — ID klien OAuth Google untuk "Masuk dengan Google" dan sinkron ke Google Drive pengguna.
- `VITE_AI_API` — scan struk dengan AI, lihat `AI_SETUP.md`.
Tanpa ini semuanya tetap jalan penuh secara lokal.


## Masuk dengan Google & sinkron cloud

Tidak ada token/kode admin. Siapa pun bisa masuk dengan akun Google-nya; data tiap orang disimpan di
**Google Drive miliknya sendiri** (file `life-os-backup.json`, scope `drive.file`) dan disinkronkan
otomatis antar perangkat. Tanpa server dan tanpa database bersama.

Agar semua orang bisa memakainya (bukan hanya Anda):
1. Google Cloud Console → buat project → **APIs & Services → Library → aktifkan Google Drive API**.
2. **OAuth consent screen**: tipe External, isi nama app & email. Scope yang dipakai (`drive.file`, `openid`,
   `email`, `profile`) tergolong non-sensitif. Ubah status dari *Testing* ke **In production**; bila tidak,
   hanya "test user" yang boleh masuk.
3. **Credentials → Create OAuth client ID → Web application**. Tambahkan *Authorized JavaScript origins*:
   alamat situs Anda (mis. `https://namaanda.github.io`) dan `http://localhost:5173` untuk uji coba.
4. Isi `VITE_GOOGLE_CLIENT_ID` (variabel repo GitHub atau `.env`).

Catatan: login Google berbasis web (popup). Di APK Capacitor, popup ini bisa tidak jalan di WebView; bila itu
terjadi, pakai versi web/PWA atau tambahkan plugin login Google native.
Kebijakan konflik: bila perangkat lain punya versi lebih baru dan perangkat ini tidak punya perubahan
tertunda, versi cloud dipakai; bila ada perubahan tertunda, versi perangkat ini yang dikirim.
