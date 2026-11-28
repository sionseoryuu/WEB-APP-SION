import React, { useEffect, useState } from 'react';
import { ShieldCheck, Fingerprint, Lock as LockIcon } from 'lucide-react';
import { Card, Btn, PageHeader, ToggleRow, SelectField, Chip, useTr } from './ui.jsx';
import { PinDots, PinPad } from './LockScreen.jsx';
import { createLock, verifyPin, disableLock, saveLock, biometricAvailable, TIMEOUT_OPTIONS } from './appLock.js';

// Alur pengaturan PIN: 'enter' -> 'confirm' ; atau verifikasi PIN lama sebelum mengubah/mematikan
function PinFlow({ lang, mode, title, hint, length, onDone, onCancel, expectVerify }) {
  const tr = useTr(lang);
  const [step, setStep] = useState(expectVerify ? 'verify' : 'enter');
  const [first, setFirst] = useState('');
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState('');
  const [len] = useState(length);

  const finish = async (value) => {
    if (step === 'verify') {
      const res = await expectVerify(value);
      if (res) {
        if (mode === 'disable') return onDone('');
        setStep('enter');
        setPin('');
        setMsg('');
      } else {
        setMsg(tr('lock_wrong'));
        setTimeout(() => setPin(''), 300);
      }
    } else if (step === 'enter') {
      setFirst(value);
      setStep('confirm');
      setPin('');
      setMsg('');
    } else if (value === first) {
      onDone(value);
    } else {
      setMsg(tr('sec_mismatch'));
      setStep('enter');
      setFirst('');
      setTimeout(() => setPin(''), 300);
    }
  };
  const onDigit = (d) => {
    const next = (pin + d).slice(0, len);
    setPin(next);
    if (next.length === len) finish(next);
  };
  const label = step === 'verify' ? tr('sec_enter_current') : step === 'enter' ? tr('sec_enter_new', { n: len }) : tr('sec_confirm_new');
  return (
    <Card className="p-5 space-y-4">
      <div className="text-center">
        <p className="text-sm font-semibold text-life-text">{title}</p>
        <p className="text-xs text-life-muted mt-1">{label}</p>
      </div>
      <PinDots length={len} filled={pin.length} />
      <p className="h-4 text-xs text-[#F29B87] text-center" role="alert">{msg}</p>
      <PinPad lang={lang} onDigit={onDigit} onBackspace={() => setPin((p) => p.slice(0, -1))} />
      {hint && <p className="text-[11px] text-life-muted text-center">{hint}</p>}
      <div className="flex justify-center"><Btn variant="ghost" size="sm" onClick={onCancel}>{tr('cancel')}</Btn></div>
    </Card>
  );
}

export default function SecuritySettings({ lang, cfg, onChange, onLockNow, onBack }) {
  const tr = useTr(lang);
  const [flow, setFlow] = useState(null); // 'setup' | 'change' | 'disable'
  const [pinLen, setPinLen] = useState(cfg.length || 4);
  const [bioOk, setBioOk] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    biometricAvailable().then(setBioOk);
  }, []);

  const verifyCurrent = async (value) => (await verifyPin(value, cfg)).ok;

  if (flow) {
    return (
      <div className="space-y-5 max-w-md mx-auto">
        <PageHeader title={tr('sec_title')} onBack={() => setFlow(null)} backLabel={tr('back')} />
        <PinFlow
          lang={lang}
          mode={flow}
          title={flow === 'setup' ? tr('sec_setup') : flow === 'change' ? tr('sec_change') : tr('sec_disable')}
          length={flow === 'disable' ? cfg.length : flow === 'change' ? pinLen : pinLen}
          expectVerify={flow === 'setup' ? null : verifyCurrent}
          onCancel={() => setFlow(null)}
          hint={flow !== 'disable' ? tr('sec_pin_hint') : undefined}
          onDone={async (pin) => {
            if (flow === 'disable') {
              onChange(disableLock());
              setNotice(tr('sec_disabled_notice'));
            } else {
              const next = await createLock(pin, cfg);
              saveLock(next);
              onChange(next);
              setNotice(tr('sec_enabled_notice'));
            }
            setFlow(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <PageHeader title={tr('sec_title')} subtitle={tr('sec_subtitle')} onBack={onBack} backLabel={tr('back')} />
      {notice && <p className="text-xs text-life-accent px-1" role="status">{notice}</p>}

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${cfg.enabled ? 'bg-[#87B082]/15 text-[#87B082]' : 'bg-life-surface2 text-life-muted'}`}>
            {cfg.enabled ? <ShieldCheck className="w-5 h-5" /> : <LockIcon className="w-5 h-5" />}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-life-text">{cfg.enabled ? tr('sec_status_on') : tr('sec_status_off')}</p>
            <p className="text-[11px] text-life-muted">{cfg.enabled ? tr('sec_status_on_hint', { n: cfg.length }) : tr('sec_status_off_hint')}</p>
          </div>
        </div>

        {!cfg.enabled ? (
          <>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-life-muted mb-2">{tr('sec_pin_length')}</p>
              <div className="flex gap-2">
                {[4, 6].map((n) => <Chip key={n} active={pinLen === n} onClick={() => setPinLen(n)}>{tr('sec_digits', { n })}</Chip>)}
              </div>
            </div>
            <Btn onClick={() => setFlow('setup')} className="w-full"><LockIcon className="w-4 h-4" /> {tr('sec_enable')}</Btn>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="secondary" size="sm" onClick={() => { setPinLen(cfg.length); setFlow('change'); }}>{tr('sec_change')}</Btn>
            <Btn variant="danger" size="sm" onClick={() => setFlow('disable')}>{tr('sec_disable')}</Btn>
          </div>
        )}
      </Card>

      {cfg.enabled && (
        <Card className="p-4 divide-y divide-life-border/25">
          <div className="pb-3">
            <ToggleRow
              label={tr('sec_biometric')}
              hint={bioOk ? tr('sec_biometric_hint') : tr('sec_biometric_na')}
              checked={cfg.biometric && bioOk}
              disabled={!bioOk}
              onChange={(v) => {
                const next = { ...cfg, biometric: v };
                saveLock(next);
                onChange(next);
              }}
            />
          </div>
          <div className="pt-3">
            <SelectField
              label={tr('sec_timeout')}
              value={String(cfg.timeout)}
              onChange={(e) => {
                const next = { ...cfg, timeout: Number(e.target.value) };
                saveLock(next);
                onChange(next);
              }}
            >
              {TIMEOUT_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === 0 ? tr('sec_t_immediately') : s < 60 ? tr('sec_t_seconds', { n: s }) : tr('sec_t_minutes', { n: s / 60 })}</option>
              ))}
            </SelectField>
            <p className="text-[11px] text-life-muted mt-2">{tr('sec_timeout_hint')}</p>
          </div>
        </Card>
      )}

      {cfg.enabled && (
        <Btn variant="secondary" onClick={onLockNow} className="w-full"><Fingerprint className="w-4 h-4" /> {tr('sec_lock_now')}</Btn>
      )}
      <p className="text-[11px] text-life-muted px-1">{tr('sec_local_note')}</p>
    </div>
  );
}
