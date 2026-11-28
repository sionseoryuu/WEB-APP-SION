# SECURITY REPORT — LIFE OS V2 (parsial)

Tidak ada klaim keamanan sempurna. Penilaian berdasarkan pembacaan source + uji logika Node; bukan penetration test.

## Sudah ada (v1.2 audit)
- PBKDF2-SHA256, salt 16 byte, 310.000 iterasi untuk verifier kata sandi lokal; migrasi hash legacy saat login.

## Baru di V2
- `vaultCrypto.js`: enkripsi backup yang benar secara kriptografis (AEAD). Teruji: round-trip, passphrase salah ditolak, ciphertext rusak ditolak, salt/IV acak.
- **Terhubung** ke Ekspor JSON (opsional per ekspor) dan Impor/Restore (otomatis mendeteksi file terenkripsi).
- **Belum** mengenkripsi backup Drive/auto-backup (tetap plaintext) — mengenkripsi otomatis butuh manajemen passphrase yang aman agar sinkron antarperangkat tidak rusak.
- Restore kini: konfirmasi dampak + salinan pra-restore. Batas: hanya 1 salinan terakhir, tersimpan di localStorage (tidak terenkripsi, dan bisa gagal bila storage penuh → pengguna diminta konfirmasi).
- Ekspor dengan passphrase kosong tetap plaintext (pilihan pengguna, ditampilkan di notifikasi).

## Risiko terbuka
| Level | Risiko | Status |
|---|---|---|
| Critical | Login lokal = sisi-klien; bukan batas keamanan. Butuh backend (auth, otorisasi server) untuk multi-user/karyawan | Terbuka |
| High | Data localStorage tidak terenkripsi at-rest | Terbuka |
| High | Backup Drive/auto-backup plaintext | Terbuka (ekspor manual sudah bisa terenkripsi) |
| High | Tanpa Content-Security-Policy; belum ada audit XSS menyeluruh atas 11.580 baris App.jsx | Terbuka |
| Medium | Tidak ada rate limiting login (hanya mungkin di backend) | Terbuka |
| Medium | Key enkripsi in-memory/passphrase: lupa passphrase = data hilang permanen (harus dijelaskan di UI) | Dicatat |
| Low | ID transaksi `tx-dbt-${Date.now()}` bisa bentrok bila dua pembayaran dalam 1 ms | Terbuka |

## Catatan
Pemisahan workspace via key LocalStorage bukan batas keamanan. Secret API tidak boleh di `VITE_*`.
