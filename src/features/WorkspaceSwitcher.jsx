import React, { useEffect, useState } from 'react';
import { Store, User, Check, Plus, X, ChevronDown, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { sortList, matchesPhrase, DELETE_PHRASE } from './workspaces.js';

const TYPE_META = {
  business: { icon: Store, id: 'Bisnis', en: 'Business' },
  personal: { icon: User, id: 'Pribadi', en: 'Personal' },
};

// Pil kecil di Beranda: menampilkan akun aktif, ketuk untuk beralih
export const WorkspaceChip = ({ current, lang, onClick, className = '' }) => {
  const meta = TYPE_META[current?.type] || TYPE_META.personal;
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={lang === 'id' ? 'Beralih akun' : 'Switch account'}
      className={`inline-flex items-center gap-1.5 max-w-full pl-2 pr-2.5 py-1.5 rounded-full bg-life-surface border border-life-border/60 text-life-text active:scale-95 transition-transform ${className}`}
    >
      <span className="w-5 h-5 rounded-full bg-life-accent/20 text-life-accent flex items-center justify-center shrink-0">
        <Icon className="w-3 h-3" />
      </span>
      <span className="text-xs font-semibold truncate">{current?.name || (lang === 'id' ? meta.id : meta.en)}</span>
      <ChevronDown className="w-3.5 h-3.5 text-life-muted shrink-0" />
    </button>
  );
};

// Lembar bawah: daftar akun (pribadi / bisnis) + tambah akun baru
export default function WorkspaceSheet({ open, onClose, lang, list, currentId, email, onSwitch, onCreate, onDelete, deleteId, busy }) {
  const L = (a, b) => (lang === 'id' ? a : b);
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState('business');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [delTarget, setDelTarget] = useState(null);
  const [phrase, setPhrase] = useState('');
  const [delErr, setDelErr] = useState('');
  useEffect(() => {
    if (open && deleteId) {
      const w = list.find((x) => x.id === deleteId);
      if (w) {
        setDelTarget(w);
        setPhrase('');
        setDelErr('');
      }
    }
  }, [open, deleteId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null;

  const close = () => {
    if (busy) return;
    setAdding(false);
    setName('');
    setErr('');
    setDelTarget(null);
    setPhrase('');
    setDelErr('');
    onClose();
  };

  const confirmDelete = async () => {
    if (!matchesPhrase(phrase)) return;
    setDelErr('');
    const res = await onDelete(delTarget.id);
    if (res && res.ok === false) setDelErr(res.message || L('Gagal menghapus akun.', 'Could not delete the account.'));
    else {
      setDelTarget(null);
      setPhrase('');
    }
  };

  const submit = async () => {
    if (!name.trim()) {
      setErr(L('Isi nama dulu.', 'Enter a name first.'));
      return;
    }
    setErr('');
    const ok = await onCreate({ type, name: name.trim() });
    if (ok !== false) {
      setAdding(false);
      setName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center" role="dialog" aria-modal="true">
      <button aria-label={L('Tutup', 'Close')} className="absolute inset-0 bg-black/60" onClick={close} />
      <div
        className="relative w-full lg:max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl lg:rounded-3xl bg-life-surface border-t border-life-border/60 px-4 pt-3 life-motion-enter"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto w-10 h-1 rounded-full bg-life-border mb-3" />
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-life-text">{adding ? L('Tambah akun baru', 'Add a new account') : delTarget ? L('Hapus akun', 'Delete account') : L('Beralih akun', 'Switch account')}</h2>
            {email && <p className="text-[11px] text-life-muted truncate">{L('Masuk sebagai', 'Signed in as')} {email}</p>}
          </div>
          <button onClick={close} className="p-2 rounded-xl bg-life-bg text-life-muted" aria-label={L('Tutup', 'Close')}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {!adding && !delTarget && (
          <>
            <div className="space-y-2">
              {sortList(list).map((w) => {
                const meta = TYPE_META[w.type] || TYPE_META.personal;
                const Icon = meta.icon;
                const active = w.id === currentId;
                return (
                  <div key={w.id} className="flex items-stretch gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => (active ? close() : onSwitch(w.id))}
                      className={`flex-1 min-w-0 flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors disabled:opacity-60 ${
                        active ? 'border-life-accent bg-life-accent/10' : 'border-life-border/50 bg-life-bg active:bg-life-bg/60'
                      }`}
                    >
                      <span className="w-11 h-11 rounded-2xl bg-life-accent/15 text-life-accent flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-life-text truncate">{w.name || L(meta.id, meta.en)}</span>
                        <span className="block text-[11px] text-life-muted">{L(meta.id, meta.en)}</span>
                      </span>
                      {active ? <Check className="w-5 h-5 text-life-accent shrink-0" /> : busy ? <Loader2 className="w-4 h-4 animate-spin text-life-muted" /> : null}
                    </button>
                    {onDelete && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => { setDelTarget(w); setPhrase(''); setDelErr(''); }}
                        className="w-11 shrink-0 rounded-2xl border border-life-border/50 bg-life-bg text-[#F29B87] flex items-center justify-center disabled:opacity-60"
                        aria-label={L('Hapus akun', 'Delete account')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => setAdding(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-life-border text-sm font-semibold text-life-soft disabled:opacity-60"
            >
              <Plus className="w-4 h-4" /> {L('Tambah akun Pribadi / Bisnis', 'Add Personal / Business account')}
            </button>
            <p className="mt-3 text-[11px] text-life-muted leading-relaxed">
              {L(
                'Setiap akun punya data sendiri-sendiri (transaksi, kasir, stok, laporan) dan tersimpan terpisah di Google Drive Anda.',
                'Each account keeps its own data (transactions, POS, stock, reports), stored separately in your Google Drive.'
              )}
            </p>
          </>
        )}

        {delTarget && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-[#D96B52]/10 border border-[#D96B52]/35 p-3.5">
              <p className="text-sm font-semibold text-life-text">{L('Hapus akun', 'Delete account')} “{delTarget.name || L('tanpa nama', 'unnamed')}”?</p>
              <p className="text-[12px] text-life-muted mt-1 leading-relaxed">
                {L('Semua data akun ini dihapus permanen dari perangkat dan dari Google Drive Anda. Tidak bisa dibatalkan.', 'All data in this account is permanently deleted from this device and your Google Drive. This cannot be undone.')}
              </p>
            </div>
            <div>
              <label htmlFor="ws-del" className="block text-xs font-medium uppercase tracking-wider text-life-muted mb-1.5">
                {L('Ketik', 'Type')} <span className="text-life-text normal-case">{DELETE_PHRASE}</span> {L('untuk melanjutkan', 'to continue')}
              </label>
              <input
                id="ws-del"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                autoCapitalize="none"
                autoComplete="off"
                className="w-full px-4 py-3 rounded-2xl bg-life-bg border border-life-border/60 text-life-text focus:outline-none focus:border-[#D96B52]"
              />
            </div>
            {delErr && <p className="text-xs text-[#F29B87]">{delErr}</p>}
            <button
              type="button"
              disabled={busy || !matchesPhrase(phrase)}
              onClick={confirmDelete}
              className="w-full py-3.5 rounded-2xl bg-[#D96B52] text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} {L('Hapus akun ini', 'Delete this account')}
            </button>
            <button type="button" disabled={busy} onClick={() => { setDelTarget(null); setPhrase(''); setDelErr(''); }} className="w-full flex items-center justify-center gap-1.5 text-sm text-life-muted">
              <ArrowLeft className="w-4 h-4" /> {L('Batal', 'Cancel')}
            </button>
          </div>
        )}

        {adding && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {['business', 'personal'].map((k) => {
                const meta = TYPE_META[k];
                const Icon = meta.icon;
                const sel = type === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setType(k)}
                    className={`flex flex-col items-center gap-1.5 p-3.5 rounded-2xl border ${sel ? 'border-life-accent bg-life-accent/10' : 'border-life-border/50 bg-life-bg'}`}
                  >
                    <Icon className={`w-6 h-6 ${sel ? 'text-life-accent' : 'text-life-muted'}`} />
                    <span className="text-sm font-semibold text-life-text">{L(meta.id, meta.en)}</span>
                    <span className="text-[10px] text-life-muted text-center leading-tight">
                      {k === 'business' ? L('Kasir, stok, gaji, laba rugi, neraca', 'POS, stock, payroll, P&L, balance sheet') : L('Dompet, anggaran, tabungan, kebiasaan', 'Wallets, budgets, savings, habits')}
                    </span>
                  </button>
                );
              })}
            </div>
            <div>
              <label htmlFor="ws-name" className="block text-xs font-medium uppercase tracking-wider text-life-muted mb-1.5">
                {type === 'business' ? L('Nama usaha', 'Business name') : L('Nama akun', 'Account name')}
              </label>
              <input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                autoFocus
                placeholder={type === 'business' ? L('mis. Warung Kopi Senja', 'e.g. Sunset Coffee Shop') : L('mis. Keuangan Keluarga', 'e.g. Family Finance')}
                className="w-full px-4 py-3 rounded-2xl bg-life-bg border border-life-border/60 text-life-text placeholder:text-life-muted/60 focus:outline-none focus:border-life-accent"
              />
            </div>
            {err && <p className="text-xs text-[#F29B87]">{err}</p>}
            <button
              type="button"
              disabled={busy}
              onClick={submit}
              className="w-full py-3.5 rounded-2xl bg-life-accent text-life-bg text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} {L('Buat & buka akun', 'Create & open account')}
            </button>
            <button type="button" disabled={busy} onClick={() => { setAdding(false); setErr(''); }} className="w-full flex items-center justify-center gap-1.5 text-sm text-life-muted">
              <ArrowLeft className="w-4 h-4" /> {L('Kembali', 'Back')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
