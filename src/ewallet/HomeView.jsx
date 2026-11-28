import React, { useMemo } from 'react';
import {
  Eye, EyeOff, Plus, ScanLine, Split, Banknote, Send, LayoutGrid, CheckCircle2, Circle,
  ArrowDownLeft, ArrowUpRight, ListTodo, Flame, CalendarDays, TrendingDown, PiggyBank, Search,
} from 'lucide-react';
import { FavoritesStrip } from '../features/TemplatesView.jsx';
import { WeeklyCard, dismissWeeklyToday } from '../features/WeeklySummary.jsx';
import { Avatar, SectionTitle, TxRow } from './parts.jsx';
import { WorkspaceChip } from '../features/WorkspaceSwitcher.jsx';
import { fmt, todayStr, catName } from './helpers.js';
import { ALL_SERVICES } from './services.js';

// Hanya 4 pintasan di Beranda; sisanya lewat tombol Menu
const PINNED_SERVICE_IDS = ['budgets', 'savings', 'tasks', 'habits'];

export default function HomeView({
  data, derived, lang, maskBalances, onToggleMask, onNavigate,
  onOpenTx, onOpenReceipt, onOpenSplit, onOpenPayday, onOpenBriefing, onOpenMenu,
  onOpenSearch, onOpenWeekly, onUseTemplate, currentWs, onOpenSwitcher,
}) {
  const [, forceTick] = React.useState(0);
  const L = (idText, enText) => (lang === 'id' ? idText : enText);
  const { profile } = data;
  const currency = profile.currency;
  const sec = { balance: true, shortcuts: true, today: true, services: true, activity: true, ...(profile.homeSections || {}) };
  const today = todayStr();

  // Pengeluaran 7 hari terakhir + kategori teratas bulan ini
  const { week, weekTotal, weekMax, topCats, monthSpent } = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ key, label: d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { weekday: 'narrow' }), value: 0 });
    }
    const cats = {};
    let spent = 0;
    data.transactions.forEach((tx) => {
      if (tx.type !== 'expense') return;
      const slot = days.find((d) => d.key === tx.date);
      if (slot) slot.value += Number(tx.amount) || 0;
      if (String(tx.date).startsWith(today.slice(0, 7))) {
        cats[tx.category] = (cats[tx.category] || 0) + (Number(tx.amount) || 0);
        spent += Number(tx.amount) || 0;
      }
    });
    return {
      week: days,
      weekTotal: days.reduce((a, d) => a + d.value, 0),
      weekMax: Math.max(1, ...days.map((d) => d.value)),
      topCats: Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 4),
      monthSpent: spent,
    };
  }, [data.transactions, today, lang]);
  const saved = derived.monthlyIncome - derived.monthlyExpenses;

  const recent = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const openTasks = data.tasks.filter((tk) => tk.status !== 'completed').length;
  const habitsDone = data.habits.filter((h) => h.completedDates.includes(today)).length;
  const eventsToday = data.events.filter((e) => e.date === today).length;
  const hour = new Date().getHours();
  const greet = hour < 11 ? L('Selamat pagi', 'Good morning') : hour < 15 ? L('Selamat siang', 'Good afternoon') : hour < 19 ? L('Selamat sore', 'Good evening') : L('Selamat malam', 'Good night');

  const shortcuts = [
    { icon: Plus, label: L('Catat', 'Add'), onClick: () => onOpenTx() },
    { icon: ScanLine, label: L('Scan Struk', 'Scan'), onClick: onOpenReceipt },
    { icon: Split, label: L('Bagi Tagihan', 'Split Bill'), onClick: onOpenSplit },
    { icon: Banknote, label: L('Bagi Gaji', 'Payday'), onClick: onOpenPayday },
  ];

  const pinned = PINNED_SERVICE_IDS.map((id) => ALL_SERVICES.find((s) => s.id === id)).filter(Boolean);

  const checklist = [
    { done: data.transactions.length > 0, label: L('Catat transaksi pertama (Menu → Scan QRIS/Struk)', 'Log your first transaction (Menu → Scan QRIS/Receipt)'), onClick: onOpenReceipt },
    { done: data.accounts.length > 1, label: L('Tambah dompet / rekening lain', 'Add another wallet / account'), onClick: () => onNavigate('wallet') },
    { done: (data.budgets || []).length > 0, label: L('Atur anggaran bulanan', 'Set a monthly budget'), onClick: () => onNavigate('budgets') },
    { done: Boolean(profile.avatar), label: L('Pasang foto profil', 'Add a profile photo'), onClick: () => onNavigate('profile') },
  ];
  const showChecklist = checklist.some((c) => !c.done) && data.transactions.length < 3;

  return (
    <div className="space-y-5 max-w-xl mx-auto lg:max-w-3xl">
      {/* Header (mobile) */}
      <div className="flex items-center gap-3 lg:hidden">
        <button onClick={() => onNavigate('profile')} aria-label={L('Profil saya', 'My profile')}>
          <Avatar profile={profile} size={46} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-life-muted">{greet}</p>
          <p className="text-base font-semibold text-life-text truncate">{profile.name}</p>
          {onOpenSwitcher && <WorkspaceChip current={currentWs} lang={lang} onClick={onOpenSwitcher} className="mt-1" />}
        </div>
        <button onClick={onOpenSearch} className="p-2.5 rounded-xl bg-life-surface border border-life-border/50 text-life-muted" aria-label={L('Cari', 'Search')}>
          <Search className="w-4 h-4" />
        </button>
        <button onClick={onOpenBriefing} className="p-2.5 rounded-xl bg-life-surface border border-life-border/50 text-life-muted" aria-label={L('Ringkasan harian', 'Daily briefing')}>
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Kartu saldo */}
      {sec.balance && (
        <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-life-accent to-life-accent-dark text-life-bg shadow-xl">
          <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-white/10" />
          <div className="absolute -right-2 -bottom-16 w-40 h-40 rounded-full bg-black/10" />
          <div className="relative">
            <p className="text-xs font-medium opacity-80">{L('Total Kekayaan Bersih', 'Total Net Worth')}</p>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-3xl font-bold tabular-nums tracking-tight">{fmt(derived.totalNetWorth, currency, maskBalances)}</h2>
              <button onClick={onToggleMask} className="p-1.5 rounded-full bg-black/15" aria-label={L('Tampilkan atau sembunyikan saldo', 'Show or hide balance')}>
                {maskBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mt-4">
              <div className="rounded-2xl bg-black/15 p-3">
                <p className="text-[11px] opacity-80 flex items-center gap-1"><ArrowDownLeft className="w-3.5 h-3.5" />{L('Masuk bulan ini', 'In this month')}</p>
                <p className="text-sm font-semibold tabular-nums mt-0.5">{fmt(derived.monthlyIncome, currency, maskBalances)}</p>
              </div>
              <div className="rounded-2xl bg-black/15 p-3">
                <p className="text-[11px] opacity-80 flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" />{L('Keluar bulan ini', 'Out this month')}</p>
                <p className="text-sm font-semibold tabular-nums mt-0.5">{fmt(derived.monthlyExpenses, currency, maskBalances)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dompet (geser) */}
      {sec.balance && data.accounts.length > 0 && (
        <div className="-mx-3 sm:mx-0">
          <div className="flex gap-2.5 overflow-x-auto px-3 sm:px-0 pb-1 snap-x [scrollbar-width:none]">
            {data.accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => onNavigate('wallet')}
                className="snap-start shrink-0 w-40 text-left rounded-2xl bg-life-surface border border-life-border/45 p-3"
              >
                <p className="text-[11px] text-life-muted truncate">{a.name}</p>
                <p className="text-sm font-semibold text-life-text tabular-nums mt-1 truncate">
                  {fmt(derived.accountBalances[a.id] || 0, currency, maskBalances)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Aksi cepat */}
      {sec.shortcuts && (
        <div className="grid grid-cols-4 gap-2">
          {shortcuts.map((s) => (
            <button key={s.label} onClick={s.onClick} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-life-surface border border-life-border/40 shadow-sm active:scale-95 transition-transform">
              <span className="w-11 h-11 rounded-2xl bg-life-accent/15 text-life-accent flex items-center justify-center">
                <s.icon className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-medium text-life-text">{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Ringkasan mingguan (tiap Minggu) */}
      <WeeklyCard
        data={data}
        lang={lang}
        maskBalances={maskBalances}
        onOpen={onOpenWeekly}
        onDismiss={() => {
          dismissWeeklyToday();
          forceTick((n) => n + 1);
        }}
      />

      {/* Menu favorit: satu ketukan */}
      {sec.shortcuts && (
        <FavoritesStrip data={data} lang={lang} maskBalances={maskBalances} onUse={onUseTemplate} onManage={() => onNavigate('templates')} />
      )}

      {/* Mulai cepat untuk pengguna baru */}
      {showChecklist && (
        <div className="rounded-2xl bg-life-surface border border-life-accent/35 p-4">
          <p className="text-sm font-semibold text-life-text">{L('Mulai cepat', 'Quick start')}</p>
          <p className="text-[11px] text-life-muted mb-2">{L('Beberapa langkah agar LIFE OS siap dipakai.', 'A few steps to get LIFE OS ready.')}</p>
          <div className="space-y-1">
            {checklist.map((c) => (
              <button key={c.label} onClick={c.onClick} className="w-full flex items-center gap-2.5 py-1.5 text-left">
                {c.done ? <CheckCircle2 className="w-4 h-4 text-[#87B082] shrink-0" /> : <Circle className="w-4 h-4 text-life-muted shrink-0" />}
                <span className={`text-xs ${c.done ? 'text-life-muted line-through' : 'text-life-text'}`}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grafik 7 hari */}
      {sec.balance && (
        <div className="rounded-3xl bg-life-surface border border-life-border/40 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] text-life-muted flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5 text-life-accent" />{L('Pengeluaran 7 hari terakhir', 'Spending, last 7 days')}</p>
              <p className="text-xl font-bold text-life-text tabular-nums mt-0.5">{fmt(weekTotal, currency, maskBalances)}</p>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${saved >= 0 ? 'bg-[#87B082]/15 text-[#87B082]' : 'bg-[#D96B52]/15 text-[#F29B87]'}`}>
              <PiggyBank className="w-3.5 h-3.5" />
              {maskBalances ? '••••' : `${saved >= 0 ? '+' : '-'}${fmt(Math.abs(saved), currency)}`}
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-2 h-24">
            {week.map((d, i) => {
              const h = d.value > 0 ? Math.max(8, Math.round((d.value / weekMax) * 100)) : 4;
              const isToday = i === week.length - 1;
              return (
                <div key={d.key} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                  <div
                    className={`w-full rounded-lg transition-all ${isToday ? 'bg-gradient-to-t from-life-accent-dark to-life-accent' : d.value > 0 ? 'bg-life-accent/40' : 'bg-life-border/30'}`}
                    style={{ height: `${h}%` }}
                    title={maskBalances ? '' : fmt(d.value, currency)}
                  />
                  <span className={`text-[10px] uppercase ${isToday ? 'text-life-accent font-bold' : 'text-life-muted'}`}>{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kategori teratas bulan ini */}
      {sec.balance && topCats.length > 0 && (
        <div className="rounded-3xl bg-life-surface border border-life-border/40 p-4">
          <p className="text-sm font-semibold text-life-text mb-3">{L('Terbanyak bulan ini', 'Top spending this month')}</p>
          <div className="space-y-3">
            {topCats.map(([cat, val]) => {
              const pct = monthSpent > 0 ? Math.round((val / monthSpent) * 100) : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-life-text truncate pr-2">{catName(cat, lang)}</span>
                    <span className="text-life-muted tabular-nums shrink-0">{fmt(val, currency, maskBalances)} • {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-life-bg overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-life-accent-dark to-life-accent" style={{ width: `${Math.max(3, pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hari ini */}
      {sec.today && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: ListTodo, value: openTasks, label: L('Tugas aktif', 'Open tasks'), tab: 'tasks' },
            { icon: Flame, value: `${habitsDone}/${data.habits.length}`, label: L('Kebiasaan', 'Habits'), tab: 'habits' },
            { icon: CalendarDays, value: eventsToday, label: L('Agenda hari ini', 'Events today'), tab: 'calendar' },
          ].map((c) => (
            <button key={c.tab} onClick={() => onNavigate(c.tab)} className="rounded-2xl bg-life-surface border border-life-border/40 p-3 text-left">
              <c.icon className="w-4 h-4 text-life-accent" />
              <p className="text-lg font-bold text-life-text tabular-nums mt-1.5">{c.value}</p>
              <p className="text-[10px] text-life-muted leading-tight">{c.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Pintasan modul (ringkas; selebihnya di tombol Menu) */}
      {sec.services && (
        <div>
          <SectionTitle action={L('Semua menu', 'All menu')} onAction={onOpenMenu}>
            {L('Pintasan', 'Shortcuts')}
          </SectionTitle>
          <div className="grid grid-cols-4 gap-2">
            {pinned.map((s) => (
              <button key={s.id} onClick={() => onNavigate(s.id)} className="flex flex-col items-center gap-1.5 py-2.5 rounded-2xl bg-life-surface border border-life-border/40 active:scale-95 transition-transform">
                <s.icon className="w-5 h-5 text-life-accent" />
                <span className="text-[11px] text-life-text text-center leading-tight">{s.label[lang]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Aktivitas terbaru */}
      {sec.activity && (
        <div>
          <SectionTitle action={L('Lihat semua', 'See all')} onAction={() => onNavigate('activity')}>
            {L('Aktivitas Terbaru', 'Recent Activity')}
          </SectionTitle>
          <div className="rounded-2xl bg-life-surface border border-life-border/40 px-3.5 divide-y divide-life-border/25">
            {recent.length === 0 ? (
              <button onClick={onOpenReceipt} className="w-full py-6 text-center text-xs text-life-muted flex flex-col items-center gap-1.5">
                <ScanLine className="w-6 h-6 text-life-accent" />
                {L('Belum ada transaksi. Ketuk tombol Menu lalu Catat atau Scan Struk.', 'No transactions yet. Tap Menu, then Add or Scan.')}
              </button>
            ) : (
              recent.map((tx) => (
                <TxRow key={tx.id} tx={tx} data={data} lang={lang} masked={maskBalances} compact onClick={() => onOpenTx(tx)} />
              ))
            )}
          </div>
        </div>
      )}
      <div className="h-2" />
    </div>
  );
}
