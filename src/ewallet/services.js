import {
  LayoutDashboard, Wallet, PieChart, PiggyBank, TrendingUp, Repeat, HandCoins, CalendarDays, CheckSquare,
  Calendar, Flame, Target, HeartHandshake, FileText, ShoppingCart, BarChart3,
} from 'lucide-react';

// Semua modul LIFE OS dikelompokkan seperti "layanan" di e-wallet
export const SERVICE_GROUPS = [
  {
    id: 'money',
    label: { id: 'Keuangan', en: 'Money' },
    items: [
      { id: 'wallet', icon: Wallet, label: { id: 'Dompet', en: 'Wallets' } },
      { id: 'budgets', icon: PieChart, label: { id: 'Anggaran', en: 'Budgets' } },
      { id: 'savings', icon: PiggyBank, label: { id: 'Tabungan', en: 'Savings' } },
      { id: 'investments', icon: TrendingUp, label: { id: 'Investasi', en: 'Invest' } },
      { id: 'subscriptions', icon: Repeat, label: { id: 'Langganan', en: 'Bills' } },
      { id: 'debts', icon: HandCoins, label: { id: 'Utang', en: 'Debts' } },
    ],
  },
  {
    id: 'time',
    label: { id: 'Waktu', en: 'Time' },
    items: [
      { id: 'planner', icon: CalendarDays, label: { id: 'Planner', en: 'Planner' } },
      { id: 'tasks', icon: CheckSquare, label: { id: 'Tugas', en: 'Tasks' } },
      { id: 'calendar', icon: Calendar, label: { id: 'Kalender', en: 'Calendar' } },
    ],
  },
  {
    id: 'growth',
    label: { id: 'Pengembangan Diri', en: 'Growth' },
    items: [
      { id: 'habits', icon: Flame, label: { id: 'Kebiasaan', en: 'Habits' } },
      { id: 'goals', icon: Target, label: { id: 'Tujuan', en: 'Goals' } },
      { id: 'crm', icon: HeartHandshake, label: { id: 'Relasi', en: 'People' } },
      { id: 'notes', icon: FileText, label: { id: 'Catatan', en: 'Notes' } },
      { id: 'shopping', icon: ShoppingCart, label: { id: 'Belanja', en: 'Shopping' } },
    ],
  },
  {
    id: 'intel',
    label: { id: 'Analitik', en: 'Insights' },
    items: [
      { id: 'overview', icon: LayoutDashboard, label: { id: 'Ringkasan', en: 'Overview' } },
      { id: 'reports', icon: BarChart3, label: { id: 'Laporan', en: 'Reports' } },
    ],
  },
];

export const ALL_SERVICES = SERVICE_GROUPS.flatMap((g) => g.items);
// 7 layanan paling sering dipakai tampil di Beranda, sisanya lewat tombol "Semua"
export const PINNED_SERVICE_IDS = ['budgets', 'savings', 'tasks', 'habits', 'subscriptions', 'goals', 'reports'];
