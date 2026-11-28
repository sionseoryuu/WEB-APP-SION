import React, { useState } from 'react';
import { Wallet, Store, User, Check, ShieldCheck, ArrowLeft, Globe, CloudUpload } from 'lucide-react';

// Alur registrasi 3 langkah:
// 1) Tipe pencatatan  2) Nama usaha/profil + persetujuan privasi  3) Sinkron Google -> masuk aplikasi
const TXT = {
  id: {
    tagline: 'Catat keuangan & hidup, tersinkron di Google Drive Anda',
    s1_title: 'Tipe Pencatatan',
    s1_sub: 'Pilih yang sesuai kebutuhan Anda. Satu akun Google bisa punya akun Pribadi dan Bisnis sekaligus — beralih kapan saja dari Beranda.',
    biz: 'Usaha / Bisnis',
    biz_desc: 'Warung, toko, UMKM, freelance. Kategori: Penjualan, Pembelian Stok, Gaji, dll.',
    per: 'Pribadi / Keluarga',
    per_desc: 'Keuangan rumah tangga, tabungan, dll. Kategori: Gaji, Belanja, Transportasi, dll.',
    next: 'Lanjutkan',
    back: 'Kembali',
    s2_title_biz: 'Nama Usaha',
    s2_title_per: 'Nama Profil',
    s2_sub: 'Nama ini tampil di beranda dan laporan Anda.',
    ph_biz: 'mis. Warung Bu Siti',
    ph_per: 'mis. Budi Santoso',
    lbl_biz: 'Nama usaha',
    lbl_per: 'Nama profil',
    priv_title: 'Privasi & penyimpanan data',
    priv_body:
      'Data disimpan di perangkat ini dan, jika sinkronisasi diaktifkan, di Google Drive pribadi Anda. Koneksi memakai HTTPS, tetapi data lokal dan file cadangan Drive belum dienkripsi oleh aplikasi saat tersimpan. Lindungi perangkat dan akun Google Anda.',
    priv_check: 'Saya mengerti dan setuju',
    s3_title: 'Sinkron dengan Google',
    s3_sub: 'Masuk dengan akun Google agar data tercadang otomatis dan bisa dibuka di perangkat lain.',
    s3_point1: 'Cadangan otomatis ke Google Drive milik Anda',
    s3_point2: 'Ganti HP? Masuk lagi, data kembali',
    s3_point3: 'Aplikasi tidak bisa melihat file Drive Anda yang lain',
    google: 'Lanjutkan dengan Google',
    google_signin: 'Masuk dengan Google',
    have_account: 'Sudah punya akun? Masuk',
    legacy: 'Pakai email & kata sandi (akun lama)',
    summary: 'Ringkasan',
    existing_note: 'Data lama ditemukan di Google Drive Anda dan akan dipulihkan.',
  },
  en: {
    tagline: 'Track money & life, synced to your own Google Drive',
    s1_title: 'Tracking Type',
    s1_sub: 'Pick what fits your needs. One Google account can hold both a Personal and a Business account — switch anytime from Home.',
    biz: 'Business',
    biz_desc: 'Shop, small business, freelance. Categories: Sales, Stock Purchases, Payroll, etc.',
    per: 'Personal / Family',
    per_desc: 'Household money, savings, etc. Categories: Salary, Shopping, Transport, etc.',
    next: 'Continue',
    back: 'Back',
    s2_title_biz: 'Business Name',
    s2_title_per: 'Profile Name',
    s2_sub: 'This name appears on your home screen and reports.',
    ph_biz: 'e.g. Siti’s Corner Shop',
    ph_per: 'e.g. Jane Smith',
    lbl_biz: 'Business name',
    lbl_per: 'Profile name',
    priv_title: 'Privacy & data storage',
    priv_body:
      'Your data is stored on this device and, if sync is enabled, in your own Google Drive. Connections use HTTPS, but local data and Drive backup files are not encrypted by the app at rest. Protect your device and Google account.',
    priv_check: 'I understand and agree',
    s3_title: 'Sync with Google',
    s3_sub: 'Sign in with Google to back up automatically and open your data on other devices.',
    s3_point1: 'Automatic backup to your own Google Drive',
    s3_point2: 'New phone? Sign in again and your data is back',
    s3_point3: 'The app cannot see your other Drive files',
    google: 'Continue with Google',
    google_signin: 'Sign in with Google',
    have_account: 'Already have an account? Sign in',
    legacy: 'Use email & password (legacy account)',
    summary: 'Summary',
    existing_note: 'Existing data was found in your Google Drive and will be restored.',
  },
};

const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
    <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

const Stepper = ({ step, lang }) => (
  <div className="flex items-center justify-center gap-2" aria-label={lang === 'en' ? `Step ${step} of 3` : `Langkah ${step} dari 3`}>
    {[1, 2, 3].map((n, i) => (
      <React.Fragment key={n}>
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
            n === step
              ? 'bg-life-accent text-life-bg scale-110'
              : n < step
              ? 'bg-life-accent/70 text-life-bg'
              : 'bg-life-surface2 text-life-muted'
          }`}
        >
          {n < step ? <Check className="w-4 h-4" /> : n}
        </div>
        {i < 2 && <div className={`w-10 h-0.5 rounded ${n < step ? 'bg-life-accent/70' : 'bg-life-border/50'}`} />}
      </React.Fragment>
    ))}
  </div>
);

const TypeCard = ({ icon: Icon, title, desc, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`w-full flex items-center gap-4 p-4 rounded-3xl border-2 text-left transition-all ${
      selected ? 'border-life-accent bg-life-surface2' : 'border-life-border/50 bg-life-surface hover:border-life-accent/60'
    }`}
  >
    <div
      className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center ${
        selected ? 'bg-life-accent/25 text-life-accent' : 'bg-life-bg text-life-muted'
      }`}
    >
      <Icon className="w-6 h-6" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-base font-bold text-life-text">{title}</div>
      <div className="text-xs text-life-muted mt-1 leading-relaxed">{desc}</div>
    </div>
    {selected && (
      <div className="w-7 h-7 shrink-0 rounded-full bg-life-accent text-life-bg flex items-center justify-center">
        <Check className="w-4 h-4" />
      </div>
    )}
  </button>
);

const PrimaryBtn = ({ children, ...rest }) => (
  <button
    type="button"
    {...rest}
    className="w-full py-3.5 rounded-2xl bg-life-accent text-life-bg font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition-all"
  >
    {children}
  </button>
);

export default function OnboardingFlow({ lang = 'id', onToggleLang, tr, onGoogle, onLegacy }) {
  const L = TXT[lang === 'en' ? 'en' : 'id'];
  const [step, setStep] = useState(1);
  const [type, setType] = useState('personal');
  const [name, setName] = useState('');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [signinOnly, setSigninOnly] = useState(false);

  const isBiz = type === 'business';

  const go = async (setup) => {
    setErr('');
    setBusy(true);
    try {
      try {
        localStorage.setItem('lifeos:privacy_ack', String(Date.now()));
      } catch {
        /* abaikan */
      }
      await onGoogle(setup);
    } catch (e) {
      const m = String(e?.message || e);
      if (/google_drive_denied/.test(m)) setErr(tr('google_err_drive'));
      else if (/drive_cancelled|popup_closed|access_denied|drive_timeout/.test(m)) setErr(tr('google_err_cancel'));
      else if (/Failed to fetch|network|drive_gis_load/i.test(m)) setErr(tr('bk_err_network'));
      else setErr(tr('google_err_generic'));
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-life-bg text-life-text flex flex-col items-center px-5"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)', paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}
    >
      <div className="w-full max-w-md flex justify-end">
        <button
          type="button"
          onClick={onToggleLang}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-life-surface border border-life-border/60 text-xs font-semibold text-life-soft"
        >
          <Globe className="w-4 h-4 text-life-accent" />
          {lang === 'id' ? 'Indonesia' : 'English'}
        </button>
      </div>

      <div className="w-full max-w-md flex-1 flex flex-col items-center">
        <div className="mt-2 w-20 h-20 rounded-full bg-life-accent/20 flex items-center justify-center">
          <Wallet className="w-9 h-9 text-life-accent" />
        </div>
        <h1 className="mt-3 text-3xl font-extrabold text-life-accent tracking-tight">LIFE OS</h1>
        <p className="mt-1 text-sm text-life-muted text-center">{L.tagline}</p>

        <div className="mt-6">
          <Stepper step={step} lang={lang} />
        </div>

        <div className="mt-6 w-full rounded-[28px] bg-life-surface border border-life-border/40 p-5 shadow-xl">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold">{L.s1_title}</h2>
                <p className="text-sm text-life-muted mt-2">{L.s1_sub}</p>
              </div>
              <TypeCard icon={Store} title={L.biz} desc={L.biz_desc} selected={isBiz} onClick={() => setType('business')} />
              <TypeCard icon={User} title={L.per} desc={L.per_desc} selected={!isBiz} onClick={() => setType('personal')} />
              <PrimaryBtn onClick={() => setStep(2)}>{L.next}</PrimaryBtn>
              <button
                type="button"
                onClick={() => {
                  setSigninOnly(true);
                  setStep(3);
                }}
                className="w-full text-center text-sm text-life-soft underline underline-offset-4"
              >
                {L.have_account}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold">{isBiz ? L.s2_title_biz : L.s2_title_per}</h2>
                <p className="text-sm text-life-muted mt-2">{L.s2_sub}</p>
              </div>
              <div>
                <label htmlFor="ob-name" className="block text-xs font-medium uppercase tracking-wider text-life-muted mb-1.5">
                  {isBiz ? L.lbl_biz : L.lbl_per}
                </label>
                <input
                  id="ob-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isBiz ? L.ph_biz : L.ph_per}
                  maxLength={60}
                  autoFocus
                  className="w-full px-4 py-3 rounded-2xl bg-life-bg border border-life-border/60 text-life-text placeholder:text-life-muted/60 focus:outline-none focus:border-life-accent"
                />
              </div>

              <div className="p-4 rounded-2xl bg-life-bg border border-life-border/50">
                <div className="flex items-center gap-2 text-sm font-semibold text-life-soft">
                  <ShieldCheck className="w-4 h-4 text-life-accent" />
                  {L.priv_title}
                </div>
                <p className="text-xs text-life-muted mt-2 leading-relaxed">{L.priv_body}</p>
                <label className="mt-3 flex items-center gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="sr-only peer" />
                  <span
                    className={`w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                      agree ? 'bg-life-accent border-life-accent text-life-bg' : 'border-life-border'
                    } peer-focus-visible:ring-2 peer-focus-visible:ring-life-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-life-bg`}
                    aria-hidden="true"
                  >
                    {agree && <Check className="w-4 h-4" />}
                  </span>
                  <span className="text-sm text-life-text">{L.priv_check}</span>
                </label>
              </div>

              <PrimaryBtn disabled={!name.trim() || !agree} onClick={() => setStep(3)}>
                {L.next}
              </PrimaryBtn>
              <button type="button" onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-1.5 text-sm text-life-muted">
                <ArrowLeft className="w-4 h-4" /> {L.back}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-life-accent/20 flex items-center justify-center">
                  <CloudUpload className="w-6 h-6 text-life-accent" />
                </div>
                <h2 className="text-xl font-bold mt-3">{L.s3_title}</h2>
                <p className="text-sm text-life-muted mt-2">{L.s3_sub}</p>
              </div>

              <ul className="space-y-2">
                {[L.s3_point1, L.s3_point2, L.s3_point3].map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-life-soft">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-life-accent" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              {!signinOnly && (
                <div className="p-3 rounded-2xl bg-life-bg border border-life-border/50 text-xs text-life-muted">
                  <span className="font-semibold text-life-soft">{L.summary}: </span>
                  {isBiz ? L.biz : L.per} · {name.trim()}
                </div>
              )}

              {err && <div className="p-3 rounded-xl bg-[#D96B52]/15 border border-[#D96B52]/40 text-xs text-[#F29B87]">{err}</div>}

              <button
                type="button"
                disabled={busy}
                onClick={() => go(signinOnly ? null : { type, name: name.trim() })}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-white text-[#1f1f1f] text-base font-semibold disabled:opacity-60"
              >
                <GoogleG />
                {busy ? '…' : signinOnly ? L.google_signin : L.google}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setErr('');
                  if (signinOnly) {
                    setSigninOnly(false);
                    setStep(1);
                  } else setStep(2);
                }}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-life-muted"
              >
                <ArrowLeft className="w-4 h-4" /> {L.back}
              </button>
            </div>
          )}
        </div>

        <button type="button" onClick={onLegacy} className="mt-5 text-xs text-life-muted underline underline-offset-4">
          {L.legacy}
        </button>
      </div>
    </div>
  );
}
