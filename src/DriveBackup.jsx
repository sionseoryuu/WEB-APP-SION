import React, { useState } from 'react';
import { backupToDrive, restoreFromDrive } from './driveSync.js';
import { loadAutoPrefs, saveAutoPrefs, runAutoBackup, hashData } from './features/autoBackup.js';
import { makeTr } from './features/i18n.js';

const driveError = (e, tr) => {
  const m = String(e?.message || e);
  if (/drive_expired|drive_timeout|drive_cancelled|popup/i.test(m)) return tr('bk_err_auth');
  if (/drive_gis_load/.test(m)) return tr('bk_err_load');
  if (/drive_http_(\d+)/.test(m)) return tr('bk_err_http', { code: m.match(/drive_http_(\d+)/)[1] });
  if (/Failed to fetch|NetworkError|network/i.test(m)) return tr('bk_err_network');
  return tr('bk_err_generic');
};

export default function DriveBackup({ lang = 'id', data, onRestore }) {
  const tr = makeTr(lang);
  const loc = lang === 'id' ? 'id-ID' : 'en-US';
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [last, setLast] = useState(() => {
    try {
      return localStorage.getItem('lifeos:drive_last') || '';
    } catch {
      return '';
    }
  });
  const [auto, setAuto] = useState(loadAutoPrefs);

  const updateAuto = (patch) => {
    const next = { ...auto, ...patch };
    setAuto(next);
    saveAutoPrefs(next);
  };

  const run = async (fn) => {
    setBusy(true);
    setMsg('');
    try {
      await fn();
    } catch (e) {
      setMsg(`${tr('bk_failed')} ${driveError(e, tr)}`);
    } finally {
      setBusy(false);
    }
  };

  const markDone = (when) => {
    try {
      localStorage.setItem('lifeos:drive_last', when);
    } catch {
      /* abaikan */
    }
    setLast(when);
    updateAuto({ lastAuto: when, lastHash: hashData(data), lastError: '', needsAuth: false });
  };

  const backup = () =>
    run(async () => {
      const when = await backupToDrive(data);
      markDone(when);
      setMsg(tr('bk_saved'));
    });

  const restore = () =>
    run(async () => {
      const res = await restoreFromDrive();
      if (!res) {
        setMsg(tr('bk_none'));
        return;
      }
      const when = new Date(res.modifiedTime).toLocaleString(loc);
      if (window.confirm(tr('bk_confirm_restore', { when }))) onRestore(res.data);
    });

  const toggleAuto = (on) =>
    run(async () => {
      if (on) {
        // Tautkan Drive dulu (butuh satu ketukan/persetujuan), lalu cadangkan sekarang
        const when = await backupToDrive(data);
        markDone(when);
        updateAuto({ enabled: true, needsAuth: false, lastError: '' });
        setMsg(tr('bk_auto_on'));
      } else {
        updateAuto({ enabled: false, needsAuth: false });
      }
    });

  const reauth = () =>
    run(async () => {
      const res = await runAutoBackup(data, { force: true, interactive: true });
      setAuto(res.prefs);
      if (res.status === 'done') {
        setLast(res.prefs.lastAuto);
        setMsg(tr('bk_saved'));
      } else if (res.status === 'error') setMsg(`${tr('bk_failed')} ${driveError({ message: res.error }, tr)}`);
    });

  const btn =
    'flex-1 px-3 py-2 rounded-xl text-xs font-semibold border border-life-border/60 bg-life-bg text-life-text disabled:opacity-50';

  return (
    <div className="p-3.5 rounded-xl bg-life-bg/90 border border-life-border/50 space-y-3">
      <div>
        <p className="text-xs font-semibold text-life-text">Google Drive</p>
        <p className="text-[11px] text-life-muted">{tr('bk_desc')}</p>
      </div>
      <div className="flex gap-2">
        <button type="button" className={btn} disabled={busy} onClick={backup}>
          {busy ? '…' : tr('bk_backup')}
        </button>
        <button type="button" className={btn} disabled={busy} onClick={restore}>
          {tr('bk_restore')}
        </button>
      </div>
      {last && (
        <p className="text-[11px] text-life-muted">
          {tr('bk_last')} {new Date(last).toLocaleString(loc)}
        </p>
      )}

      <div className="pt-3 border-t border-life-border/40 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-life-text">{tr('bk_auto')}</p>
            <p className="text-[11px] text-life-muted">{tr('bk_auto_desc')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={auto.enabled}
            aria-label={tr('bk_auto')}
            disabled={busy}
            onClick={() => toggleAuto(!auto.enabled)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${auto.enabled ? 'bg-life-accent' : 'bg-life-border/60'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-life-bg transition-transform ${auto.enabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>
        {auto.enabled && (
          <>
            <div className="flex gap-2">
              {['daily', 'weekly'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => updateAuto({ frequency: f })}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border ${auto.frequency === f ? 'bg-life-accent text-life-bg border-life-accent' : 'bg-life-bg text-life-muted border-life-border/60'}`}
                >
                  {f === 'daily' ? tr('bk_daily') : tr('bk_weekly')}
                </button>
              ))}
            </div>
            {auto.needsAuth && (
              <div className="p-2.5 rounded-xl border border-[#D9A441]/50 bg-[#D9A441]/10 space-y-2">
                <p className="text-[11px] text-life-text">{tr('bk_needs_auth')}</p>
                <button type="button" className={btn} disabled={busy} onClick={reauth}>{tr('bk_reauth')}</button>
              </div>
            )}
            {auto.lastError && <p className="text-[11px] text-[#F29B87]">{tr('bk_failed')} {auto.lastError}</p>}
            <p className="text-[11px] text-life-muted">{tr('bk_auto_note')}</p>
          </>
        )}
      </div>
      {msg && <p className="text-[11px] text-life-accent">{msg}</p>}
    </div>
  );
}
