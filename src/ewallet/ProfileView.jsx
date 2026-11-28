import React, { useMemo, useRef, useState } from 'react';
import {
  Camera, UserRound, Tags, Wallet, PieChart, Repeat, HandCoins, Palette, Languages, EyeOff, LayoutGrid,
  CloudUpload, Download, Upload, FileSpreadsheet, RotateCcw, Sparkles, KeyRound, LogOut, ChevronRight,
  ChevronLeft, MessageCircle, Plus, Trash2, Pencil, Check, X, Lock, BadgeCheck, Info, Mail, Smartphone, Bell, Star, FileText, Store, ArrowLeftRight,
} from 'lucide-react';
import ThemeSettings from '../ThemeSettings.jsx';
import DriveBackup from '../DriveBackup.jsx';
import { Avatar, Switch } from './parts.jsx';
import { catName, fmt, resizeImageToDataUrl } from './helpers.js';

const DEFAULT_EXPENSE = [
  'Housing & Utilities', 'Dining & Coffee', 'Groceries', 'Transport & Travel', 'Software & Subscriptions',
  'Health & Wellness', 'Shopping & Lifestyle', 'Investments', 'Debt & Installments',
];
const DEFAULT_INCOME = ['Primary Salary', 'Consulting & Advisory', 'Dividends & Yield', 'Client Retainer', 'Other Income'];



// ---------- komponen kecil ----------
const Group = ({ title, children }) => (
  <div>
    {title && <p className="text-[11px] font-semibold uppercase tracking-widest text-life-muted px-1 mb-2">{title}</p>}
    <div className="rounded-2xl bg-life-surface border border-life-border/40 divide-y divide-life-border/25 overflow-hidden">{children}</div>
  </div>
);

const Row = ({ icon: Icon, label, hint, onClick, right, danger, chevron = true }) => {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className={`w-full flex items-center gap-3 px-3.5 py-3 text-left ${onClick ? 'active:bg-life-surface2' : ''}`}>
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-[#D96B52]/15 text-[#F29B87]' : 'bg-life-accent/15 text-life-accent'}`}>
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-sm font-medium ${danger ? 'text-[#F29B87]' : 'text-life-text'}`}>{label}</span>
        {hint && <span className="block text-[11px] text-life-muted truncate">{hint}</span>}
      </span>
      {right}
      {onClick && chevron && !right && <ChevronRight className="w-4 h-4 text-life-muted shrink-0" />}
    </Tag>
  );
};

const SubHeader = ({ title, onBack, lang }) => (
  <div className="flex items-center gap-2 mb-4">
    <button onClick={onBack} className="p-2 -ml-2 rounded-xl text-life-text" aria-label={lang === 'id' ? 'Kembali' : 'Back'}><ChevronLeft className="w-5 h-5" /></button>
    <h1 className="text-lg font-bold text-life-text">{title}</h1>
  </div>
);

// ---------- halaman: ubah profil ----------
function EditPage({ data, lang, onUpdateProfile, onBack }) {
  const L = (a, b) => (lang === 'id' ? a : b);
  const [name, setName] = useState(data.profile.name || '');
  const [role, setRole] = useState(data.profile.role || '');
  const [currency, setCurrency] = useState(data.profile.currency || 'Rp');
  const [language, setLanguage] = useState(data.profile.language || 'id');
  const field = 'w-full rounded-xl bg-life-bg border border-life-border/60 px-3 py-3 text-sm text-life-text outline-none focus:border-life-accent';
  return (
    <div>
      <SubHeader title={L('Ubah Nama & Info', 'Edit Name & Info')} onBack={onBack} lang={lang} />
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onUpdateProfile({ name: name.trim() || (lang === 'id' ? 'Pemilik Ruang Kerja' : 'Workspace Owner'), role: role.trim(), currency, language });
          onBack();
        }}
      >
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-life-muted">{L('Nama lengkap', 'Full name')}</span>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={48} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-life-muted">{L('Julukan / status', 'Tagline')}</span>
          <input className={field} value={role} onChange={(e) => setRole(e.target.value)} maxLength={48} placeholder="Personal Life OS" />
        </label>
        <div className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-life-muted">{L('Mata uang', 'Currency')}</span>
          <div className="grid grid-cols-4 gap-2">
            {['Rp', '$', '€', '£'].map((c) => (
              <button key={c} type="button" onClick={() => setCurrency(c)} className={`py-2.5 rounded-xl border text-sm font-semibold ${currency === c ? 'bg-life-accent text-life-bg border-life-accent' : 'bg-life-bg border-life-border/50 text-life-muted'}`}>{c}</button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-life-muted">{L('Bahasa', 'Language')}</span>
          <div className="grid grid-cols-2 gap-2">
            {[['id', 'Bahasa Indonesia'], ['en', 'English']].map(([v, label]) => (
              <button key={v} type="button" onClick={() => setLanguage(v)} className={`py-2.5 rounded-xl border text-sm font-semibold ${language === v ? 'bg-life-accent text-life-bg border-life-accent' : 'bg-life-bg border-life-border/50 text-life-muted'}`}>{label}</button>
            ))}
          </div>
        </div>
        <button type="submit" className="w-full rounded-xl bg-life-accent text-life-bg font-semibold py-3 text-sm">{L('Simpan', 'Save')}</button>
      </form>
    </div>
  );
}

// ---------- halaman: semua kategori ----------
function CategoryPage({ data, derived, lang, onAddCategory, onDeleteCategory, onRenameCategory, onBack }) {
  const L = (a, b) => (lang === 'id' ? a : b);
  const [kind, setKind] = useState('expense');
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null); // { from, to }
  const currency = data.profile.currency;

  const defaults = kind === 'expense' ? DEFAULT_EXPENSE : DEFAULT_INCOME;
  const custom = (kind === 'expense' ? data.customExpenseCategories : data.customIncomeCategories) || [];
  const spent = useMemo(() => {
    const map = {};
    (derived.categoryBreakdown || []).forEach((c) => { map[c.category] = c.amount; });
    return map;
  }, [derived.categoryBreakdown]);
  const count = (cat) => data.transactions.filter((tx) => tx.category === cat).length;

  const add = (e) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean || defaults.includes(clean) || custom.includes(clean)) return;
    onAddCategory(kind, clean);
    setName('');
  };
  const commitRename = () => {
    const to = (editing?.to || '').trim();
    if (to && to !== editing.from && !defaults.includes(to) && !custom.includes(to)) onRenameCategory(kind, editing.from, to);
    setEditing(null);
  };

  return (
    <div>
      <SubHeader title={L('Semua Kategori', 'All Categories')} onBack={onBack} lang={lang} />
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-life-bg border border-life-border/50 mb-4">
        {[['expense', L('Pengeluaran', 'Expense')], ['income', L('Pemasukan', 'Income')]].map(([v, label]) => (
          <button key={v} onClick={() => { setKind(v); setEditing(null); }} className={`py-2.5 rounded-lg text-xs font-semibold ${kind === v ? 'bg-life-accent text-life-bg' : 'text-life-muted'}`}>{label}</button>
        ))}
      </div>

      <form onSubmit={add} className="flex gap-2 mb-4">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={32} placeholder={L('Kategori baru, mis. Hobi', 'New category, e.g. Hobbies')} className="flex-1 min-w-0 rounded-xl bg-life-surface border border-life-border/60 px-3 py-3 text-sm text-life-text outline-none focus:border-life-accent" />
        <button type="submit" className="px-4 rounded-xl bg-life-accent text-life-bg" aria-label={L('Tambah', 'Add')}><Plus className="w-5 h-5" /></button>
      </form>

      <div className="space-y-4">
        <Group title={L('Kategori saya', 'My categories')}>
          {custom.length === 0 && <p className="px-3.5 py-4 text-xs text-life-muted">{L('Belum ada kategori buatan sendiri.', 'No custom categories yet.')}</p>}
          {custom.map((c) => (
            <div key={c} className="flex items-center gap-2 px-3.5 py-2.5">
              {editing?.from === c ? (
                <>
                  <input autoFocus value={editing.to} onChange={(e) => setEditing({ ...editing, to: e.target.value })} maxLength={32} className="flex-1 min-w-0 rounded-lg bg-life-bg border border-life-accent px-2.5 py-2 text-sm text-life-text outline-none" />
                  <button onClick={commitRename} className="p-2 rounded-lg bg-life-accent text-life-bg" aria-label="OK"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditing(null)} className="p-2 rounded-lg bg-life-surface2 text-life-muted" aria-label="Cancel"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-life-text truncate">{c}</span>
                    <span className="block text-[11px] text-life-muted">{count(c)} {L('transaksi', 'transactions')}{kind === 'expense' && spent[c] ? ` • ${fmt(spent[c], currency)} ${L('bulan ini', 'this month')}` : ''}</span>
                  </span>
                  <button onClick={() => setEditing({ from: c, to: c })} className="p-2 rounded-lg text-life-muted" aria-label="Rename"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => onDeleteCategory(kind, c)} className="p-2 rounded-lg text-[#F29B87]" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
                </>
              )}
            </div>
          ))}
        </Group>

        <Group title={L('Kategori bawaan', 'Default categories')}>
          {defaults.map((c) => (
            <div key={c} className="flex items-center gap-2 px-3.5 py-2.5">
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-life-text truncate">{catName(c, lang)}</span>
                <span className="block text-[11px] text-life-muted">{count(c)} {L('transaksi', 'transactions')}{kind === 'expense' && spent[c] ? ` • ${fmt(spent[c], currency)} ${L('bulan ini', 'this month')}` : ''}</span>
              </span>
              <Lock className="w-3.5 h-3.5 text-life-muted/60" />
            </div>
          ))}
        </Group>
      </div>
      <p className="text-[11px] text-life-muted mt-3 px-1">{L('Menghapus kategori tidak menghapus transaksi lama; transaksi tetap tersimpan dengan nama kategorinya.', 'Deleting a category keeps old transactions with their category name.')}</p>
    </div>
  );
}

// ---------- halaman: atur beranda ----------
function LayoutPage({ data, lang, onUpdateProfile, onBack }) {
  const L = (a, b) => (lang === 'id' ? a : b);
  const sec = { balance: true, shortcuts: true, today: true, services: true, activity: true, ...(data.profile.homeSections || {}) };
  const items = [
    ['balance', L('Kartu saldo & dompet', 'Balance card & wallets')],
    ['shortcuts', L('Aksi cepat (Catat, Scan, Split, Gaji)', 'Quick actions')],
    ['today', L('Ringkasan hari ini', "Today's summary")],
    ['services', L('Layanan LIFE OS', 'LIFE OS services')],
    ['activity', L('Aktivitas terbaru', 'Recent activity')],
  ];
  return (
    <div>
      <SubHeader title={L('Atur Tampilan Beranda', 'Customize Home')} onBack={onBack} lang={lang} />
      <Group>
        {items.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between gap-3 px-3.5 py-3.5">
            <span className="text-sm text-life-text">{label}</span>
            <Switch checked={sec[key]} label={label} onChange={(v) => onUpdateProfile({ homeSections: { ...sec, [key]: v } })} />
          </div>
        ))}
      </Group>
    </div>
  );
}

function BackupPage({ data, lang, onImportJson, onBack }) {
  const L = (a, b) => (lang === 'id' ? a : b);
  return (
    <div>
      <SubHeader title={L('Cadangan Google Drive', 'Google Drive Backup')} onBack={onBack} lang={lang} />
      <DriveBackup lang={lang} data={data} onRestore={onImportJson} />
    </div>
  );
}

function ThemePage({ lang, onBack }) {
  return (
    <div>
      <SubHeader title={lang === 'id' ? 'Tema & Warna' : 'Theme & Colors'} onBack={onBack} lang={lang} />
      <ThemeSettings lang={lang} />
    </div>
  );
}

// ---------- halaman utama profil ----------
export default function ProfileView(props) {
  const {
    data, derived, currentUser, lang, maskBalances, onToggleMask, onUpdateProfile, onNavigate,
    onExportJson, onExportCsv, onImportJson, onResetEmpty, onRestoreDemo, onLogout,
    onAddCategory, onDeleteCategory, onRenameCategory, lockEnabled, onExportReport,
    currentWs, wsCount, onOpenSwitcher, onOpenDelete,
  } = props;
  const L = (a, b) => (lang === 'id' ? a : b);
  const [page, setPage] = useState('menu');
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoRef = useRef(null);
  const importRef = useRef(null);
  const { profile } = data;
  const back = () => setPage('menu');

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoBusy(true);
    try {
      onUpdateProfile({ avatar: await resizeImageToDataUrl(file, 256) });
    } catch {
      /* foto tidak terbaca: abaikan */
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try { onImportJson(JSON.parse(String(ev.target?.result || '{}'))); } catch { onImportJson(null); }
    };
    reader.readAsText(file);
  };

  const shell = (children) => <div className="max-w-xl mx-auto lg:max-w-3xl">{children}</div>;

  if (page === 'edit') return shell(<EditPage data={data} lang={lang} onUpdateProfile={onUpdateProfile} onBack={back} />);
  if (page === 'categories') return shell(<CategoryPage data={data} derived={derived} lang={lang} onAddCategory={onAddCategory} onDeleteCategory={onDeleteCategory} onRenameCategory={onRenameCategory} onBack={back} />);
  if (page === 'layout') return shell(<LayoutPage data={data} lang={lang} onUpdateProfile={onUpdateProfile} onBack={back} />);
  if (page === 'backup') return shell(<BackupPage data={data} lang={lang} onImportJson={onImportJson} onBack={back} />);
  if (page === 'theme') return shell(<ThemePage lang={lang} onBack={back} />);

  const customCount = (data.customExpenseCategories || []).length + (data.customIncomeCategories || []).length;

  return shell(
    <div className="space-y-5">
      <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
      <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />

      {/* Kartu profil */}
      <div className="rounded-3xl bg-life-surface border border-life-border/40 p-5 text-center">
        <div className="relative inline-block">
          <Avatar profile={profile} size={92} />
          <button
            onClick={() => photoRef.current?.click()}
            disabled={photoBusy}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-life-accent text-life-bg flex items-center justify-center border-2 border-life-surface"
            aria-label={L('Ubah foto profil', 'Change profile photo')}
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <h1 className="text-lg font-bold text-life-text mt-3 break-words">{profile.name}</h1>
        <p className="text-xs text-life-muted">{profile.role || 'Personal Life OS'}</p>
        {currentUser?.email && <p className="text-[11px] text-life-muted/80 mt-0.5 truncate">{currentUser.email}</p>}
        <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-life-accent/15 text-life-accent text-[11px] font-semibold">
          <BadgeCheck className="w-3.5 h-3.5" /> LIFE OS
        </span>
        {profile.avatar && (
          <button onClick={() => onUpdateProfile({ avatar: '' })} className="block mx-auto mt-2 text-[11px] text-life-muted underline">{L('Hapus foto', 'Remove photo')}</button>
        )}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            [data.transactions.length, L('Transaksi', 'Transactions')],
            [data.accounts.length, L('Dompet', 'Wallets')],
            [customCount + 14, L('Kategori', 'Categories')],
          ].map(([v, label]) => (
            <div key={label} className="rounded-2xl bg-life-bg/70 border border-life-border/35 py-2.5">
              <p className="text-base font-bold text-life-text tabular-nums">{v}</p>
              <p className="text-[10px] text-life-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <Group title={L('Akun', 'Account')}>
        <Row icon={Camera} label={L('Ubah foto profil', 'Change profile photo')} hint={profile.avatar ? L('Foto terpasang', 'Photo set') : L('Belum ada foto', 'No photo yet')} onClick={() => photoRef.current?.click()} />
        <Row icon={UserRound} label={L('Ubah nama & info', 'Edit name & info')} hint={`${profile.name} • ${profile.currency}`} onClick={() => setPage('edit')} />
        {currentUser?.email && <Row icon={Mail} label="Email" hint={currentUser.email} chevron={false} />}
      </Group>

      <Group title={L('Keuangan & Kategori', 'Finance & Categories')}>
        <Row icon={Tags} label={L('Semua kategori', 'All categories')} hint={L('Tambah, ubah, hapus kategori', 'Add, rename, delete categories')} onClick={() => setPage('categories')} />
        <Row icon={Wallet} label={L('Dompet & rekening', 'Wallets & accounts')} hint={`${data.accounts.length} ${L('dompet', 'wallets')}`} onClick={() => onNavigate('wallet')} />
        <Row icon={PieChart} label={L('Anggaran', 'Budgets')} onClick={() => onNavigate('budgets')} />
        <Row icon={Repeat} label={L('Langganan & tagihan', 'Bills & subscriptions')} onClick={() => onNavigate('subscriptions')} />
        <Row icon={HandCoins} label={L('Utang & piutang', 'Debts')} onClick={() => onNavigate('debts')} />
        <Row icon={Repeat} label={L('Transaksi berulang', 'Recurring transactions')} hint={L('Gaji, kos, cicilan otomatis', 'Automatic salary, rent, installments')} onClick={() => onNavigate('recurring')} />
        <Row icon={Star} label={L('Menu favorit', 'Favorite orders')} hint={L('Catat pesanan langganan sekali ketuk', 'Log usual orders in one tap')} onClick={() => onNavigate('templates')} />
      </Group>

      <Group title={L('Keamanan & Pengingat', 'Security & Reminders')}>
        <Row icon={Bell} label={L('Pengingat & notifikasi', 'Reminders & notifications')} hint={L('Tagihan, tugas, kebiasaan', 'Bills, tasks, habits')} onClick={() => onNavigate('notifications')} />
        <Row icon={Lock} label={L('Kunci aplikasi', 'App lock')} hint={lockEnabled ? L('Aktif', 'On') : L('Mati', 'Off')} onClick={() => onNavigate('security')} />
      </Group>

      <Group title={L('Tampilan & Preferensi', 'Appearance & Preferences')}>
        <Row icon={Palette} label={L('Tema & warna', 'Theme & colors')} onClick={() => setPage('theme')} />
        <Row icon={LayoutGrid} label={L('Atur tampilan beranda', 'Customize home')} hint={L('Pilih bagian yang ditampilkan', 'Choose visible sections')} onClick={() => setPage('layout')} />
        <Row icon={ArrowLeftRight} label={L('Beralih akun (Pribadi / Bisnis)', 'Switch account (Personal / Business)')} hint={`${currentWs?.name || profile.name} • ${data.profile.ledgerType === 'business' ? L('Bisnis', 'Business') : L('Pribadi', 'Personal')}${wsCount > 1 ? ` • ${wsCount} ${L('akun', 'accounts')}` : ''}`} onClick={onOpenSwitcher} />
        {onOpenDelete && <Row icon={Trash2} label={L('Hapus akun ini', 'Delete this account')} hint={L('Hapus permanen akun & datanya', 'Permanently delete this account & data')} danger onClick={onOpenDelete} />}
        <Row icon={Languages} label={L('Bahasa', 'Language')} hint={lang === 'id' ? 'Bahasa Indonesia' : 'English'} onClick={() => onUpdateProfile({ language: lang === 'id' ? 'en' : 'id' })} />
        <Row icon={EyeOff} label={L('Sembunyikan saldo', 'Hide balances')} chevron={false} right={<Switch checked={maskBalances} onChange={onToggleMask} label={L('Sembunyikan saldo', 'Hide balances')} />} />
      </Group>

      <Group title={L('Data & Cadangan', 'Data & Backup')}>
        <Row icon={CloudUpload} label={L('Cadangan Google Drive', 'Google Drive backup')} onClick={() => setPage('backup')} />
        <Row icon={FileText} label={L('Ekspor laporan bulanan', 'Export monthly report')} hint={L('PDF, Excel, atau CSV', 'PDF, Excel or CSV')} onClick={onExportReport} />
        <Row icon={Download} label={L('Ekspor data (JSON)', 'Export data (JSON)')} onClick={onExportJson} />
        <Row icon={FileSpreadsheet} label={L('Ekspor transaksi (CSV)', 'Export transactions (CSV)')} onClick={onExportCsv} />
        <Row icon={Upload} label={L('Impor dari JSON', 'Import from JSON')} onClick={() => importRef.current?.click()} />
        <Row icon={Sparkles} label={L('Pulihkan data contoh', 'Restore demo data')} onClick={onRestoreDemo} />
        <Row icon={RotateCcw} label={L('Kosongkan semua data', 'Clear all data')} danger onClick={onResetEmpty} />
      </Group>

      <Group title={L('Tentang', 'About')}>
        <Row icon={Info} label={L('Tentang LIFE OS', 'About LIFE OS')} hint={`v1.0 • ${L('Kehidupan & Kekayaan Pribadi', 'Personal Life & Wealth')}`} chevron={false} />
      </Group>

      <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#D96B52]/15 border border-[#D96B52]/40 text-sm font-semibold text-[#F29B87]">
        <LogOut className="w-4 h-4" /> {L('Keluar dari akun', 'Sign out')}
      </button>
      <div className="h-2" />
    </div>
  );
}
