import React from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, QrCode, Home, History, Wallet, User, LayoutGrid, X, Plus, ScanLine, Split, Banknote, Send, Search, FileText, CalendarRange, ShoppingCart } from 'lucide-react';
import { fmt, catName, isQrisTx } from './helpers.js';
import { SERVICE_GROUPS, BIZ_GROUP } from './services.js';

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
          {catName(tx.category, lang) || 'Transfer'}
          {!compact && acc ? ` • ${acc.name}` : ''}
          {qris ? ' • QRIS' : ''}
          {tx.items?.length > 1 ? ` • ${tx.items.length} ${lang === 'id' ? 'item' : 'items'}` : ''}
        </span>
      </span>
      <span className={`text-sm font-semibold tabular-nums shrink-0 ${isIn ? 'text-[#87B082]' : 'text-life-text'}`}>
        {masked ? `${currency} ••••` : `${isIn ? '+' : isTransfer ? '' : '-'}${fmt(tx.amount, currency)}`}
      </span>
    </button>
  );
};

// Navigasi bawah gaya e-wallet: tombol Menu besar di tengah = membuka semua fitur
export const BottomNav = ({ active, onNavigate, onMenu, menuOpen, lang, bizMode = false }) => {
  const id = lang === 'id';
  const items = [
    { id: 'dashboard', label: id ? 'Beranda' : 'Home', icon: Home },
    { id: 'activity', label: id ? 'Aktivitas' : 'Activity', icon: History },
    null,
    bizMode ? { id: 'biz_pos', label: id ? 'Kasir' : 'POS', icon: ShoppingCart } : { id: 'wallet', label: id ? 'Dompet' : 'Wallet', icon: Wallet },
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
            <div key="menu" className="flex flex-col items-center">
              <button
                onClick={onMenu}
                aria-label={id ? 'Buka menu' : 'Open menu'}
                aria-expanded={!!menuOpen}
                className="-mt-8 w-16 h-16 rounded-full bg-gradient-to-br from-life-accent to-life-accent-dark text-life-bg flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.45)] ring-4 ring-life-bg active:scale-95 transition-transform"
              >
                <LayoutGrid className="w-7 h-7" />
              </button>
              <span className="text-[10px] font-bold mt-1 text-life-accent tracking-wide">MENU</span>
            </div>
          )
        )}
      </div>
    </nav>
  );
};

// Lembar menu (bottom sheet): aksi cepat + semua modul aplikasi
export const MenuSheet = ({ open, onClose, onNavigate, actions, lang, bizMode = false, currentWs, onOpenSwitcher }) => {
  if (!open) return null;
  const L = (a, b) => (lang === 'id' ? a : b);
  const personalQuick = [
    { icon: Plus, label: L('Catat', 'Add'), run: actions.addTx },
    { icon: ScanLine, label: L('Scan QRIS/Struk', 'Scan QRIS/Receipt'), run: actions.scan },
    { icon: Split, label: L('Bagi Tagihan', 'Split Bill'), run: actions.split },
    { icon: Banknote, label: L('Bagi Gaji', 'Payday'), run: actions.payday },
    { icon: Send, label: L('Ringkasan Harian', 'Daily Briefing'), run: actions.briefing },
    { icon: Search, label: L('Cari', 'Search'), run: actions.search },
    { icon: CalendarRange, label: L('Ringkasan Mingguan', 'Weekly Summary'), run: actions.weekly },
    { icon: FileText, label: L('Ekspor Laporan', 'Export Report'), run: actions.exportReport },
  ];
  const bizQuick = [
    { icon: ShoppingCart, label: L('Kasir', 'POS'), run: () => onNavigate('biz_pos') },
    { icon: Plus, label: L('Catat Biaya', 'Add Expense'), run: actions.addTx },
    { icon: ScanLine, label: L('Scan Struk', 'Scan Receipt'), run: actions.scan },
    { icon: Banknote, label: L('Gaji', 'Payroll'), run: () => onNavigate('biz_payroll') },
    { icon: FileText, label: L('Laba Rugi', 'P&L'), run: () => onNavigate('biz_reports') },
    { icon: Search, label: L('Cari', 'Search'), run: actions.search },
    { icon: Send, label: L('Ringkasan Harian', 'Daily Briefing'), run: actions.briefing },
    { icon: FileText, label: L('Ekspor Laporan', 'Export Report'), run: actions.exportReport },
  ];
  const quick = bizMode ? bizQuick : personalQuick;
  const groups = bizMode ? [BIZ_GROUP, ...SERVICE_GROUPS] : SERVICE_GROUPS;
  const go = (fn) => () => { onClose(); fn(); };
  return (
    <div className="fixed inset-0 z-40 flex items-end lg:items-center lg:justify-center" role="dialog" aria-modal="true">
      <button aria-label={L('Tutup', 'Close')} className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full lg:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl lg:rounded-3xl bg-life-surface border-t border-life-border/60 px-4 pt-3 pb-6 life-motion-enter"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="mx-auto w-10 h-1 rounded-full bg-life-border absolute left-1/2 -translate-x-1/2 top-2" />
          <h2 className="text-base font-bold text-life-text pt-2">{L('Semua Menu', 'All Menu')}</h2>
          <button onClick={onClose} className="p-2 rounded-xl bg-life-bg text-life-muted" aria-label={L('Tutup', 'Close')}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {onOpenSwitcher && (
          <button onClick={go(onOpenSwitcher)} className="w-full flex items-center gap-3 p-3 mb-4 rounded-2xl bg-life-bg border border-life-border/50 text-left active:scale-[0.99]">
            <span className="w-10 h-10 rounded-2xl bg-life-accent/15 text-life-accent flex items-center justify-center shrink-0"><ArrowLeftRight className="w-5 h-5" /></span>
            <span className="flex-1 min-w-0">
              <span className="block text-[11px] text-life-muted">{L('Akun aktif · ketuk untuk beralih', 'Active account · tap to switch')}</span>
              <span className="block text-sm font-semibold text-life-text truncate">{currentWs?.name} · {bizMode ? L('Bisnis', 'Business') : L('Pribadi', 'Personal')}</span>
            </span>
          </button>
        )}
        <p className="text-[11px] font-semibold uppercase tracking-widest text-life-muted/75 mb-2">{L('Aksi Cepat', 'Quick Actions')}</p>
        <div className="grid grid-cols-4 gap-2 mb-5">
          {quick.map((q) => (
            <button key={q.label} onClick={go(q.run)} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
              <span className="w-12 h-12 rounded-2xl bg-life-accent/15 border border-life-accent/40 text-life-accent flex items-center justify-center">
                <q.icon className="w-5 h-5" />
              </span>
              <span className="text-[10px] text-center leading-tight text-life-soft">{q.label}</span>
            </button>
          ))}
        </div>

        {groups.map((g) => (
          <div key={g.id} className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-life-muted/75 mb-2">{g.label[lang === 'id' ? 'id' : 'en']}</p>
            <div className="grid grid-cols-4 gap-2">
              {g.items.map((s) => (
                <button
                  key={s.id}
                  onClick={go(() => onNavigate(s.id))}
                  className="flex flex-col items-center gap-1.5 py-2 rounded-2xl active:bg-life-bg/70"
                >
                  <span className="w-11 h-11 rounded-2xl bg-life-bg border border-life-border/50 text-life-accent flex items-center justify-center">
                    <s.icon className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] text-center leading-tight text-life-soft">{s.label[lang === 'id' ? 'id' : 'en']}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
