import React from 'react';
import { rp } from './bizLogic.js';

// Bagikan teks: lembar "Bagikan" sistem (APK/HP) -> salin ke papan klip bila tidak ada.
export async function shareText(title, text) {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title, text, dialogTitle: title });
      return 'shared';
    }
  } catch {
    /* lanjut ke cara web */
  }
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancel';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export const notifyShare = (notify, status, id = true) => {
  if (status === 'copied') notify(id ? 'Disalin ke papan klip' : 'Copied to clipboard');
  else if (status === 'failed') notify(id ? 'Gagal membagikan' : 'Share failed');
};

export const Money = ({ v, masked, className = '' }) => <span className={`tabular-nums ${className}`}>{masked ? 'Rp ••••' : rp(v)}</span>;

export const Stat = ({ label, value, sub, tone, masked }) => (
  <div className="rounded-2xl bg-life-surface border border-life-border/40 p-3.5 min-w-0">
    <p className="text-[11px] text-life-muted truncate">{label}</p>
    <p className={`text-lg font-bold tabular-nums mt-0.5 truncate ${tone === 'pos' ? 'text-[#87B082]' : tone === 'neg' ? 'text-[#F29B87]' : 'text-life-text'}`}>
      {typeof value === 'number' ? (masked ? 'Rp ••••' : rp(value)) : value}
    </p>
    {sub && <p className="text-[10px] text-life-muted mt-0.5 truncate">{sub}</p>}
  </div>
);

export const Row = ({ label, value, bold, indent, tone }) => (
  <div className={`flex items-center justify-between gap-3 py-1.5 ${bold ? 'font-bold text-life-text' : 'text-life-soft'} ${indent ? 'pl-4' : ''}`}>
    <span className="text-sm min-w-0 break-words">{label}</span>
    <span className={`text-sm tabular-nums shrink-0 ${tone === 'neg' ? 'text-[#F29B87]' : tone === 'pos' ? 'text-[#87B082]' : ''}`}>{value}</span>
  </div>
);

export const SectionLabel = ({ children }) => (
  <p className="text-[11px] font-semibold uppercase tracking-widest text-life-muted/80 mt-3 mb-1">{children}</p>
);
