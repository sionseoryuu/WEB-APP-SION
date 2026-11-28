import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Lock, Delete, Fingerprint } from 'lucide-react';
import { useTr } from './ui.jsx';
import { verifyPin, biometricAuth, biometricAvailable, loadLock, saveLock } from './appLock.js';

export function PinDots({ length, filled, error }) {
  return (
    <div className={`flex justify-center gap-3 h-4 ${error ? 'animate-pulse' : ''}`}>
      {Array.from({ length }, (_, i) => (
        <span key={i} className={`w-3.5 h-3.5 rounded-full border-2 transition-colors ${i < filled ? (error ? 'bg-[#D96B52] border-[#D96B52]' : 'bg-life-accent border-life-accent') : 'border-life-border'}`} />
      ))}
    </div>
  );
}

export function PinPad({ onDigit, onBackspace, extra, disabled, lang }) {
  const tr = useTr(lang);
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const btn = 'h-16 rounded-2xl bg-life-surface border border-life-border/40 text-xl font-semibold text-life-text active:bg-life-surface2 disabled:opacity-40';
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[18rem] mx-auto select-none">
      {keys.map((k) => (
        <button key={k} type="button" disabled={disabled} onClick={() => onDigit(k)} className={btn}>{k}</button>
      ))}
      <div className="flex items-center justify-center">{extra}</div>
      <button type="button" disabled={disabled} onClick={() => onDigit('0')} className={btn}>0</button>
      <button type="button" disabled={disabled} onClick={onBackspace} aria-label={tr('lock_backspace')} className={`${btn} flex items-center justify-center`}>
        <Delete className="w-5 h-5" />
      </button>
    </div>
  );
}

// Layar kunci penuh. `verifyPassword(pw)` (opsional) dipakai untuk reset PIN lewat kata sandi akun.
export default function LockScreen({ lang, cfg, onUnlock, onReset, verifyPassword, userName, viaGoogle }) {
  const tr = useTr(lang);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState(false);
  const [bioReady, setBioReady] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState(false);
  const triedBio = useRef(false);

  const tryBio = useCallback(async () => {
    const ok = await biometricAuth({ reason: tr('lock_bio_reason'), cancel: tr('lock_use_pin'), title: tr('lock_bio_title'), subtitle: tr('lock_bio_subtitle') });
    if (ok) onUnlock();
  }, [onUnlock, tr]);

  useEffect(() => {
    if (!cfg.biometric) return;
    biometricAvailable().then((ok) => {
      setBioReady(ok);
      if (ok && !triedBio.current) {
        triedBio.current = true;
        tryBio();
      }
    });
  }, [cfg.biometric, tryBio]);

  useEffect(() => {
    const initial = cfg.lockedUntil > Date.now() ? Math.ceil((cfg.lockedUntil - Date.now()) / 1000) : 0;
    setWait(initial);
  }, [cfg.lockedUntil]);
  useEffect(() => {
    if (wait <= 0) return undefined;
    const id = setInterval(() => setWait((w) => Math.max(0, w - 1)), 1000);
    return () => clearInterval(id);
  }, [wait > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (value) => {
    setBusy(true);
    const res = await verifyPin(value, loadLock());
    setBusy(false);
    if (res.ok) return onUnlock();
    setError(true);
    setWait(res.wait);
    setTimeout(() => {
      setPin('');
      setError(false);
    }, 450);
  };

  const onDigit = (d) => {
    if (busy || wait > 0 || error) return;
    const next = (pin + d).slice(0, cfg.length);
    setPin(next);
    if (next.length === cfg.length) submit(next);
  };

  const doForgot = async (e) => {
    e.preventDefault();
    const ok = verifyPassword ? await verifyPassword(pw) : false;
    if (ok) {
      onReset();
    } else {
      setPwErr(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-life-bg text-life-text flex flex-col items-center justify-center px-6" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-life-accent to-life-accent-dark text-life-bg flex items-center justify-center shadow-xl mb-5"><Lock className="w-7 h-7" /></div>
      <h1 className="text-lg font-bold">{tr('lock_title')}</h1>
      <p className="text-xs text-life-muted mt-1 mb-7 text-center">{userName ? tr('lock_hello', { name: userName }) : tr('lock_subtitle')}</p>

      {!forgot ? (
        <>
          <PinDots length={cfg.length} filled={pin.length} error={error} />
          <p className="h-5 mt-3 text-xs text-[#F29B87] text-center" role="alert">
            {wait > 0 ? tr('lock_wait', { s: wait }) : error ? tr('lock_wrong') : ''}
          </p>
          <div className="mt-4 w-full">
            <PinPad
              lang={lang}
              disabled={busy || wait > 0}
              onDigit={onDigit}
              onBackspace={() => setPin((p) => p.slice(0, -1))}
              extra={bioReady ? (
                <button type="button" onClick={tryBio} aria-label={tr('lock_use_bio')} className="h-16 w-16 rounded-2xl text-life-accent flex items-center justify-center active:bg-life-surface2"><Fingerprint className="w-7 h-7" /></button>
              ) : null}
            />
          </div>
          {verifyPassword && (
            <button onClick={() => setForgot(true)} className="mt-6 text-xs font-semibold text-life-accent">{tr('lock_forgot')}</button>
          )}
        </>
      ) : (
        <form onSubmit={doForgot} className="w-full max-w-xs space-y-3">
          <p className="text-xs text-life-muted text-center">{viaGoogle ? tr('lock_forgot_google') : tr('lock_forgot_help')}</p>
          {!viaGoogle && (
          <input
            type="password"
            autoFocus
            value={pw}
            onChange={(e) => { setPw(e.target.value); setPwErr(false); }}
            placeholder={tr('lock_password')}
            className="w-full rounded-xl bg-life-surface border border-life-border/60 px-3.5 py-3 text-sm text-life-text outline-none focus:border-life-accent"
          />
          )}
          {pwErr && <p className="text-xs text-[#F29B87]" role="alert">{tr('lock_password_wrong')}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => { setForgot(false); setPw(''); setPwErr(false); }} className="flex-1 py-3 rounded-xl bg-life-surface2 border border-life-border/60 text-sm">{tr('cancel')}</button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-life-accent text-life-bg text-sm font-semibold">{tr('lock_reset_pin')}</button>
          </div>
        </form>
      )}
    </div>
  );
}
