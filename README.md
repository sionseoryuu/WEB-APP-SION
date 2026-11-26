# LIFE OS — Personal Life & Wealth Platform

Web app (PWA) yang bisa di-install di HP / desktop. Data tersimpan otomatis di perangkat (localStorage).

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

## Opsional
- **Fitur AI (Gemini):** saat pertama kali dipakai app akan meminta API key dan menyimpannya di perangkat. Jangan menaruh key di repo publik.
- **Sinkron cloud Firebase:** tambahkan secret repo `VITE_FIREBASE_CONFIG` (JSON config Firebase satu baris). Tanpa ini app berjalan penuh secara lokal.
