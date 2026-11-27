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
- `VITE_FIREBASE_CONFIG` — sinkron cloud Firebase.
- `VITE_GOOGLE_CLIENT_ID` — cadangan Google Drive.
- `VITE_AI_API` — scan struk dengan AI, lihat `AI_SETUP.md`.
Tanpa ini semuanya tetap jalan penuh secara lokal.
