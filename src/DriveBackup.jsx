import React, { useState } from 'react';
import { backupToDrive, restoreFromDrive } from './driveSync.js';

export default function DriveBackup({ lang = 'id', data, onRestore }) {
  const id = lang === 'id';
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [last, setLast] = useState(() => localStorage.getItem('lifeos:drive_last') || '');

  const run = async (fn) => {
    setBusy(true);
    setMsg('');
    try {
      await fn();
    } catch (e) {
      setMsg((id ? 'Gagal: ' : 'Failed: ') + (e.message || e));
    } finally {
      setBusy(false);
    }
  };

  const backup = () =>
    run(async () => {
      const when = await backupToDrive(data);
      localStorage.setItem('lifeos:drive_last', when);
      setLast(when);
      setMsg(id ? 'Cadangan tersimpan di Google Drive.' : 'Backup saved to Google Drive.');
    });

  const restore = () =>
    run(async () => {
      const res = await restoreFromDrive();
      if (!res) {
        setMsg(id ? 'Belum ada cadangan di Drive.' : 'No backup found in Drive.');
        return;
      }
      const when = new Date(res.modifiedTime).toLocaleString(id ? 'id-ID' : 'en-US');
      const ok = window.confirm(
        id
          ? `Pulihkan data dari cadangan ${when}? Data di perangkat ini akan diganti.`
          : `Restore from backup of ${when}? Data on this device will be replaced.`
      );
      if (ok) onRestore(res.data);
    });

  const btn =
    'flex-1 px-3 py-2 rounded-xl text-xs font-semibold border border-life-border/60 bg-life-bg text-life-text disabled:opacity-50';

  return (
    <div className="p-3.5 rounded-xl bg-life-bg/90 border border-life-border/50 space-y-3">
      <div>
        <p className="text-xs font-semibold text-life-text">Google Drive</p>
        <p className="text-[11px] text-life-muted">
          {id
            ? 'Cadangkan data ke Drive Anda. App hanya bisa mengakses file yang dibuatnya sendiri.'
            : 'Back up your data to your Drive. The app can only access files it created.'}
        </p>
      </div>
      <div className="flex gap-2">
        <button type="button" className={btn} disabled={busy} onClick={backup}>
          {busy ? '…' : id ? 'Cadangkan' : 'Back up'}
        </button>
        <button type="button" className={btn} disabled={busy} onClick={restore}>
          {id ? 'Pulihkan' : 'Restore'}
        </button>
      </div>
      {last && (
        <p className="text-[11px] text-life-muted">
          {id ? 'Terakhir dicadangkan: ' : 'Last backup: '}
          {new Date(last).toLocaleString(id ? 'id-ID' : 'en-US')}
        </p>
      )}
      {msg && <p className="text-[11px] text-life-accent">{msg}</p>}
    </div>
  );
}
