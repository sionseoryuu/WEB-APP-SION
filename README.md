# LIFE OS — Personal Life & Wealth Platform

Web app (PWA) yang bisa di-install di HP / desktop. Data tersimpan otomatis di perangkat (localStorage).

## Alur pengguna (setelah beli produk digital)
1. **Lisensi** — masukkan email pembelian / kode lisensi (`LicenseGate.jsx`). Aktif hanya bila `VITE_LICENSE_API` & `VITE_LICENSE_PUBLIC_KEY` diisi.
2. **Buat akun** — daftar nama, email, kata sandi (atau masuk bila sudah punya).
3. **Dashboard** — Beranda gaya e-wallet.

## Tampilan e-wallet
Navigasi bawah: **Beranda · Aktivitas · [QRIS] · Dompet · Profil**. Tombol QRIS di tengah langsung membuka scan struk/QRIS.
Kode tampilan baru ada di `src/ewallet/` (HomeView, ActivityView, ProfileView, parts, Stepper). Dashboard lama tetap ada di Beranda → Layanan → Ringkasan.

## Jalankan lokal
```bash
npm install
npm run dev
```

## Deploy ke GitHub Pages
1. Buat repo baru di GitHub, lalu push semua file ini ke branch `main`.
2. Di repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Setiap push ke `main` otomatis build & deploy. URL: `https://<username>.github.io/<nama-repo>/`

## Install
Buka URL di Chrome/Edge (Android/desktop) → menu → **Install app**.
Di iPhone (Safari): Share → **Add to Home Screen**.

## Lisensi
Untuk menjual app sebagai lisensi seumur hidup, ikuti `LICENSE_SETUP.md`.

## Opsional
- **Fitur AI (Gemini):** saat pertama kali dipakai app akan meminta API key dan menyimpannya di perangkat. Jangan menaruh key di repo publik.
- **Sinkron cloud Firebase:** tambahkan secret repo `VITE_FIREBASE_CONFIG` (JSON config Firebase satu baris). Tanpa ini app berjalan penuh secara lokal.
