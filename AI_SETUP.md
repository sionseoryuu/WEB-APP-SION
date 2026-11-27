# Setup AI untuk Scan Struk (opsional)

Tanpa langkah ini, scan struk tetap jalan memakai OCR di HP. Dengan AI, foto struk dibaca & dirapikan Claude:
merchant, daftar barang, total, dan kategori terisi otomatis. Kunci API disimpan di Cloudflare Worker, bukan di app.

1. Buat API key di https://console.anthropic.com (beri batas pengeluaran bulanan di sana).
2. Cloudflare -> Workers & Pages -> Create -> Worker -> Edit code -> tempel isi `worker/receipt-ai-worker.js` -> Deploy.
3. Worker -> Settings -> Variables and Secrets:
   - Secret `ANTHROPIC_API_KEY` = API key langkah 1
   - Variable `ALLOWED_ORIGIN` = `https://localhost` (origin APK Android)
   - Variable `AI_MODEL` (opsional) default `claude-haiku-5-5`
4. GitHub repo -> Settings -> Secrets and variables -> Actions -> Variables: `VITE_AI_API` = URL Worker (tanpa `/receipt`).
5. Jalankan ulang workflow **Build APK** di tab Actions.

Cek: buka Scan, foto struk. Di bawah gambar ada "Teks hasil baca · AI ✓" bila AI yang membaca.
Bila AI tidak terjangkau, app otomatis memakai OCR lokal.
