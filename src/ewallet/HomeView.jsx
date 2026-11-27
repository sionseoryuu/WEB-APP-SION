import React, { useState } from 'react';
import {
  Eye, EyeOff, Plus, ScanLine, Split, Banknote, Send, ChevronRight, LayoutGrid, CheckCircle2, Circle,
  ArrowDownLeft, ArrowUpRight, ListTodo, Flame, CalendarDays,
} from 'lucide-react';
import { Avatar, SectionTitle, TxRow } from './parts.jsx';
import { fmt, todayStr } from './helpers.js';
import { SERVICE_GROUPS, ALL_SERVICES, PINNED_SERVICE_IDS } from './services.js';

export default function HomeView({
  data, derived, lang, maskBalances, onToggleMask, onNavigate,
  onOpenTx, onOpenReceipt, onOpenSplit, onOpenPayday, onOpenBriefing,
}) {
  const L = (idText, enText) => (lang === 'id' ? idText : enText);
  const [allServices, setAllServices] = useState(false);
  const { profile } = data;
  const currency = profile.currency;
  const sec = { balance: true, shortcuts: true, today: true, services: true, activity: true, ...(profile.homeSections || {}) };
  const today = todayStr();

  const recent = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const openTasks = data.tasks.filter((tk) => tk.status !== 'completed').length;
  const habitsDone = data.habits.filter((h) => h.completedDates.includes(today)).length;
  const eventsToday = data.events.filter((e) => e.date === today).length;
  const hour = new Date().getHours();
  const greet = hour < 11 ? L('Selamat pagi', 'Good morning') : hour < 15 ? L('Selamat siang', 'Good afternoon') : hour < 19 ? L('Selamat sore', 'Good evening') : L('Selamat malam', 'Good night');

  const shortcuts = [
    { icon: Plus, label: L('Catat', 'Add'), onClick: () => onOpenTx() },
    { icon: ScanLine, label: L('Scan Struk', 'Scan'), onClick: onOpenReceipt },
    { icon: Split, label: L('Split Bill', 'Split'), onClick: onOpenSplit },
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
        </div>
        <button onClick={onOpenBriefing} className="p-2.5 rounded-xl bg-life-surface border border-life-border/50 text-life-muted" aria-label="Briefing">
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
              <button onClick={onToggleMask} className="p-1.5 rounded-full bg-black/15" aria-label="Toggle saldo">
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
            <button key={s.label} onClick={s.onClick} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-life-surface border border-life-border/40 active:scale-95 transition-transform">
              <span className="w-11 h-11 rounded-2xl bg-life-accent/15 text-life-accent flex items-center justify-center">
                <s.icon className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-medium text-life-text">{s.label}</span>
            </button>
          ))}
        </div>
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

      {/* Layanan LIFE OS */}
      {sec.services && (
        <div>
          <SectionTitle action={allServices ? L('Tutup', 'Close') : L('Semua', 'All')} onAction={() => setAllServices((v) => !v)}>
            {L('Layanan LIFE OS', 'LIFE OS Services')}
          </SectionTitle>
          {!allServices ? (
            <div className="grid grid-cols-4 gap-y-4 gap-x-1">
              {pinned.map((s) => (
                <button key={s.id} onClick={() => onNavigate(s.id)} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
                  <span className="w-12 h-12 rounded-2xl bg-life-surface border border-life-border/40 text-life-accent flex items-center justify-center">
                    <s.icon className="w-5 h-5" />
                  </span>
                  <span className="text-[11px] text-life-text text-center leading-tight">{s.label[lang]}</span>
                </button>
              ))}
              <button onClick={() => setAllServices(true)} className="flex flex-col items-center gap-1.5">
                <span className="w-12 h-12 rounded-2xl bg-life-accent/15 text-life-accent flex items-center justify-center">
                  <LayoutGrid className="w-5 h-5" />
                </span>
                <span className="text-[11px] text-life-text">{L('Lainnya', 'More')}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl bg-life-surface border border-life-border/40 p-4">
              {SERVICE_GROUPS.map((g) => (
                <div key={g.id}>
                  <p className="text-[10px] uppercase tracking-widest text-life-muted mb-2">{g.label[lang]}</p>
                  <div className="grid grid-cols-4 gap-y-3 gap-x-1">
                    {g.items.map((s) => (
                      <button key={s.id} onClick={() => onNavigate(s.id)} className="flex flex-col items-center gap-1.5">
                        <span className="w-11 h-11 rounded-2xl bg-life-bg border border-life-border/40 text-life-accent flex items-center justify-center">
                          <s.icon className="w-5 h-5" />
                        </span>
                        <span className="text-[11px] text-life-text text-center leading-tight">{s.label[lang]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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
