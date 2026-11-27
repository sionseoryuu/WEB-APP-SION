import React, { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, QrCode, ArrowRight } from 'lucide-react';
import { verifyLicenseToken, isTokenCurrent } from './licenseCrypto.js';
import Stepper from './ewallet/Stepper.jsx';

const API = import.meta.env.VITE_LICENSE_API;
const PUB = import.meta.env.VITE_LICENSE_PUBLIC_KEY;
const BUY_URL = import.meta.env.VITE_PURCHASE_URL;
const STORAGE_KEY = 'lifeos:license:v1';
const DEVICE_KEY = 'lifeos:device:v1';

// ID acak per perangkat: aktivasi ulang di perangkat yang sama tidak memakai jatah lagi
function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'unknown-device';
  }
}

// Gerbang lisensi hanya aktif bila API & kunci publik diisi saat build. Tanpa itu, app terbuka (mode pengembangan).
export const licenseEnabled = Boolean(API && PUB);

const ERRORS = {
  invalid_code: 'Masukkan email pembelian atau kode lisensi yang benar.',
  not_found: 'Email atau kode tidak ditemukan. Gunakan email yang sama persis dengan saat membeli. Pesanan baru bisa butuh beberapa menit.',
  expired: 'Masa aktif akses ini sudah habis. Hubungi penjual untuk memperpanjang atau membeli lisensi seumur hidup.',
  inactive: 'Lisensi ini tidak aktif. Hubungi penjual bila kamu merasa ini keliru.',
  activation_limit: 'Batas jumlah perangkat untuk lisensi ini sudah tercapai. Hubungi penjual untuk bantuan.',
  server_config: 'Layanan aktivasi sedang bermasalah. Coba lagi nanti.',
  upstream: 'Tidak bisa terhubung ke layanan aktivasi. Periksa koneksi internetmu.',
  network: 'Tidak bisa terhubung ke layanan aktivasi. Periksa koneksi internetmu.',
};

export default function LicenseGate({ children }) {
  // checking -> locked -> activated (layar sukses) -> ok (lanjut ke buat akun / dashboard)
  const [state, setState] = useState(licenseEnabled ? 'checking' : 'ok');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!licenseEnabled) return;
    let alive = true;
    (async () => {
      const token = localStorage.getItem(STORAGE_KEY);
      const payload = token ? await verifyLicenseToken(token, PUB) : null;
      if (alive) setState(isTokenCurrent(payload) ? 'ok' : 'locked');
    })();
    return () => {
      alive = false;
    };
  }, []);

  const activate = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return setError(ERRORS.invalid_code);
    setBusy(true);
    setError('');
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseCode: trimmed, deviceId: getDeviceId() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok && (await verifyLicenseToken(data.token, PUB))) {
        localStorage.setItem(STORAGE_KEY, data.token);
        setState('activated');
      } else {
        setError(ERRORS[data.error] || 'Aktivasi gagal. Coba lagi.');
      }
    } catch {
      setError(ERRORS.network);
    } finally {
      setBusy(false);
    }
  };

  if (state === 'ok') return children;
  if (state === 'checking') return <div className="min-h-screen bg-life-bg" />;

  const Logo = (
    <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-br from-life-accent to-life-accent-dark text-life-bg flex items-center justify-center shadow-xl">
      <QrCode className="w-8 h-8" />
    </div>
  );

  return (
    <div className="min-h-screen bg-life-bg text-life-text flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <Stepper current="license" withLicense lang="id" />

        {state === 'activated' ? (
          <div className="rounded-3xl bg-life-surface border border-life-border/50 p-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#87B082]/20 text-[#87B082] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Lisensi aktif!</h1>
              <p className="text-xs text-life-muted mt-1">Langkah berikutnya: buat akun LIFE OS-mu. Setelah itu kamu langsung masuk ke dashboard.</p>
            </div>
            <button
              onClick={() => setState('ok')}
              className="w-full rounded-2xl bg-life-accent text-life-bg font-semibold py-3.5 text-sm flex items-center justify-center gap-2"
            >
              Lanjut buat akun <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form onSubmit={activate} className="rounded-3xl bg-life-surface border border-life-border/50 p-6 space-y-4">
            <div className="text-center space-y-3">
              {Logo}
              <div>
                <h1 className="text-xl font-bold">Aktivasi LIFE OS</h1>
                <p className="text-xs text-life-muted mt-1">
                  Masukkan email yang kamu pakai saat membeli (atau kode lisensi bila kamu menerimanya). Aktivasi cukup sekali per perangkat dan berlaku seumur hidup.
                </p>
              </div>
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-life-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Email pembelian atau kode lisensi"
                autoCapitalize="none"
                inputMode="email"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-2xl bg-life-bg border border-life-border/60 pl-10 pr-3 py-3.5 text-sm text-life-text outline-none focus:border-life-accent"
              />
            </div>
            {error && <p className="text-xs text-[#F29B87]">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-2xl bg-life-accent text-life-bg font-semibold py-3.5 text-sm disabled:opacity-60">
              {busy ? 'Memeriksa…' : 'Aktifkan'}
            </button>
            {BUY_URL && (
              <p className="text-center text-xs text-life-muted">
                Belum punya lisensi?{' '}
                <a href={BUY_URL} className="text-life-soft underline" target="_blank" rel="noreferrer">
                  Beli di sini
                </a>
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
