import React from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, QrCode, Home, History, Wallet, User } from 'lucide-react';
import { fmt, catName, isQrisTx } from './helpers.js';

export const Avatar = ({ profile, size = 44, className = '' }) => {
  const initials = String(profile?.name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return profile?.avatar ? (
    <img
      src={profile.avatar}
      alt=""
      style={{ width: size, height: size }}
      className={`rounded-full object-cover border-2 border-life-accent/60 shrink-0 ${className}`}
    />
  ) : (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={`rounded-full bg-gradient-to-br from-life-accent to-life-accent-dark text-life-bg font-bold flex items-center justify-center shrink-0 ${className}`}
    >
      {initials || '?'}
    </div>
  );
};

export const Switch = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-life-accent' : 'bg-life-border/60'}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-life-bg transition-transform ${checked ? 'translate-x-5' : ''}`}
    />
  </button>
);

export const SectionTitle = ({ children, action, onAction }) => (
  <div className="flex items-center justify-between px-1 mb-2.5">
    <h3 className="text-sm font-semibold text-life-text">{children}</h3>
    {action && (
      <button onClick={onAction} className="text-xs font-semibold text-life-accent">
        {action}
      </button>
    )}
  </div>
);

export const TxRow = ({ tx, data, lang, masked, onClick, compact = false }) => {
  const currency = data.profile.currency;
  const isIn = tx.type === 'income';
  const isTransfer = tx.type === 'transfer';
  const qris = isQrisTx(tx);
  const Icon = qris ? QrCode : isTransfer ? ArrowLeftRight : isIn ? ArrowDownLeft : ArrowUpRight;
  const tone = isIn ? 'text-[#87B082] bg-[#87B082]/15' : isTransfer ? 'text-life-soft bg-life-surface2' : 'text-life-accent bg-life-accent/15';
  const acc = data.accounts.find((a) => a.id === tx.accountId);
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2.5 text-left active:opacity-70"
    >
      <span className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${tone}`}>
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-life-text truncate">{tx.description || catName(tx.category, lang)}</span>
        <span className="block text-[11px] text-life-muted truncate">
          {catName(tx.category, lang) || (lang === 'id' ? 'Transfer' : 'Transfer')}
          {!compact && acc ? ` • ${acc.name}` : ''}
          {qris ? ' • QRIS' : ''}
        </span>
      </span>
      <span className={`text-sm font-semibold tabular-nums shrink-0 ${isIn ? 'text-[#87B082]' : 'text-life-text'}`}>
        {masked ? `${currency} ••••` : `${isIn ? '+' : isTransfer ? '' : '-'}${fmt(tx.amount, currency)}`}
      </span>
    </button>
  );
};

// Navigasi bawah gaya e-wallet: tombol QRIS besar di tengah = langsung catat transaksi dari struk
export const BottomNav = ({ active, onNavigate, onScan, lang }) => {
  const id = lang === 'id';
  const items = [
    { id: 'dashboard', label: id ? 'Beranda' : 'Home', icon: Home },
    { id: 'activity', label: id ? 'Aktivitas' : 'Activity', icon: History },
    null,
    { id: 'wallet', label: id ? 'Dompet' : 'Wallet', icon: Wallet },
    { id: 'profile', label: id ? 'Profil' : 'Profile', icon: User },
  ];
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-life-surface/95 backdrop-blur-xl border-t border-life-border/50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5 items-end px-1 pt-1.5 pb-1.5">
        {items.map((it) =>
          it ? (
            <button
              key={it.id}
              onClick={() => onNavigate(it.id)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl ${active === it.id ? 'text-life-accent' : 'text-life-muted'}`}
            >
              <it.icon className="w-5 h-5" strokeWidth={active === it.id ? 2.4 : 1.8} />
              <span className="text-[10px] font-medium mt-1">{it.label}</span>
            </button>
          ) : (
            <div key="qris" className="flex flex-col items-center">
              <button
                onClick={onScan}
                aria-label={id ? 'Scan QRIS atau struk' : 'Scan QRIS or receipt'}
                className="-mt-8 w-16 h-16 rounded-full bg-gradient-to-br from-life-accent to-life-accent-dark text-life-bg flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.45)] ring-4 ring-life-bg active:scale-95 transition-transform"
              >
                <QrCode className="w-7 h-7" />
              </button>
              <span className="text-[10px] font-bold mt-1 text-life-accent tracking-wide">QRIS</span>
            </div>
          )
        )}
      </div>
    </nav>
  );
};
