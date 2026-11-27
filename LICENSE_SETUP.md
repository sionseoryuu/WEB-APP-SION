# Setup Lisensi Seumur Hidup (Sociabuzz + Cloudflare Worker + KV)

Alur otomatis: pembeli bayar di Sociabuzz -> webhook Sociabuzz memberi tahu Worker -> Worker mencatat email pembeli di KV
-> pembeli mengetik email pembeliannya di app -> Worker membatasi jumlah perangkat -> app menyimpan token bertanda tangan (dicek offline).
Cadangan manual: kode XXXX-XXXX-XXXX dari admin.html tetap bisa dipakai.
Selama variabel di langkah 4 belum diisi, app tetap terbuka tanpa lisensi (mode pengembangan).

## 1. Buat pasangan kunci
Buka `https://<username>.github.io/<repo>/keygen.html`, tekan **Buat pasangan kunci**. Simpan kunci PRIVAT dengan aman.
Setelah selesai, hapus `public/keygen.html` dari repo.

## 2. Cloudflare
1. Workers & Pages -> KV -> **Create namespace** (nama bebas, mis. `lifeos-licenses`).
2. Workers & Pages -> Create -> Worker -> Edit code -> tempel isi `worker/license-worker.js` -> Deploy.
3. Worker -> Settings -> **Bindings** -> Add -> KV namespace: variable name **LICENSES**, pilih namespace tadi.
4. Settings -> Variables and Secrets:
   - Secret `LICENSE_PRIVATE_JWK` (kunci privat langkah 1)
   - Secret `ADMIN_TOKEN` (string acak panjang, minimal 32 karakter, buat sendiri)
   - Secret `SOCIABUZZ_WEBHOOK_TOKEN` (token webhook Sociabuzz, lihat langkah 3)
   - Variable `SOCIABUZZ_ITEM_ID` (opsional, ID produk LIFE OS di Sociabuzz agar produk lain diabaikan)
   - Variable `ALLOWED_ORIGIN` = `https://<username>.github.io`
5. Catat URL Worker.

## 3. Sociabuzz
1. Buat produk digital di SHOP.
2. Edit Shop -> Page Settings -> Integrations -> **Webhook**: aktifkan, isi
   - Webhook URL: `<URL Worker>/webhook/sociabuzz`
   - Webhook Token: token baru buatanmu (samakan dengan secret `SOCIABUZZ_WEBHOOK_TOKEN`). Jangan pakai token yang pernah kamu bagikan/screenshot.
3. Tekan **Test Notification**: Worker harus membalas 200. Notifikasi uji (email example.com) sengaja tidak dicatat sebagai pembeli.
4. Di deskripsi produk tulis: "Setelah bayar, buka app lalu masukkan EMAIL yang kamu pakai saat membeli."
5. Uji dengan satu pembelian nyata (produk harga kecil), lalu cek admin.html -> Daftar pembeli.

## 4. GitHub
Repo -> Settings -> Secrets and variables -> Actions -> tab **Variables**:
- `VITE_LICENSE_API` = URL Worker
- `VITE_LICENSE_PUBLIC_KEY` = kunci PUBLIK langkah 1 (satu baris JSON)
- `VITE_PURCHASE_URL` = link produk Sociabuzz
Lalu jalankan ulang workflow di tab Actions.

## 5. Kelola kode
Buka `https://<username>.github.io/<repo>/admin.html`, isi URL Worker dan ADMIN_TOKEN:
- **Daftar pembeli**: email, jumlah perangkat terpakai, status.
- **Cek / Reset perangkat / Cabut**: isi email pembeli (atau kode) untuk bantuan (ganti HP, refund).
- **Buat kode**: kode manual cadangan (default 3 perangkat).

## Alternatif
`worker/license-worker-mayar.js` memverifikasi ke Software License Mayar (kode terbit otomatis setelah bayar).

## 6. Akses gratis (hadiah / benefit)
Di admin.html -> **Beri akses gratis**: isi email penerima.
- Durasi kosong = seumur hidup. Isi angka (mis. 30) = akses berdurasi; hitungan hari dimulai saat penerima mengaktifkan pertama kali.
- Penerima mengetik email itu di layar aktivasi, sama seperti pembeli. Daftar pembeli menandai mereka dengan [GRATIS].
- Untuk dibagikan ke banyak orang (giveaway), pakai **Buat kode** dengan kolom durasi.
- Memberi akses ke pembeli berbayar tidak menurunkan aksesnya; memberi ulang tanpa durasi menaikkan akses berdurasi menjadi seumur hidup.
- Mencabut akses: kolom "Cek / kelola" -> isi email -> **Cabut**.
