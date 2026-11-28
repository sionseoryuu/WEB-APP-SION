import {
  LayoutDashboard, Wallet, PieChart, PiggyBank, TrendingUp, Repeat, HandCoins, CalendarDays, CheckSquare,
  Calendar, Flame, Target, HeartHandshake, FileText, ShoppingCart, BarChart3, Star, Bell, Lock, Store, Package, Users, Landmark,
} from 'lucide-react';

// Semua modul LIFE OS dikelompokkan seperti "layanan" di e-wallet
export const SERVICE_GROUPS = [
  {
    id: 'money',
    label: { id: 'Keuangan', en: 'Money' },
    items: [
      { id: 'overview', icon: Landmark, label: { id: 'Ikhtisar', en: 'Overview' } },
      { id: 'wallet', icon: Wallet, label: { id: 'Dompet', en: 'Wallets' } },
      { id: 'budgets', icon: PieChart, label: { id: 'Anggaran', en: 'Budgets' } },
      { id: 'savings', icon: PiggyBank, label: { id: 'Tabungan', en: 'Savings' } },
      { id: 'investments', icon: TrendingUp, label: { id: 'Investasi', en: 'Invest' } },
      { id: 'subscriptions', icon: Repeat, label: { id: 'Langganan', en: 'Bills' } },
      { id: 'debts', icon: HandCoins, label: { id: 'Utang', en: 'Debts' } },
      { id: 'recurring', icon: Repeat, label: { id: 'Berulang', en: 'Recurring' } },
      { id: 'templates', icon: Star, label: { id: 'Favorit', en: 'Favorites' } },
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
  {
    id: 'safety',
    label: { id: 'Keamanan', en: 'Safety' },
    items: [
      { id: 'notifications', icon: Bell, label: { id: 'Pengingat', en: 'Reminders' } },
      { id: 'security', icon: Lock, label: { id: 'Kunci', en: 'Lock' } },
    ],
  },
];

// Grup khusus mode Bisnis (tampil paling atas di Menu)
export const BIZ_GROUP = {
  id: 'biz',
  label: { id: 'Bisnis', en: 'Business' },
  items: [
    { id: 'dashboard', icon: Store, label: { id: 'Ringkasan', en: 'Overview' } },
    { id: 'biz_pos', icon: ShoppingCart, label: { id: 'Kasir', en: 'POS' } },
    { id: 'biz_stock', icon: Package, label: { id: 'Produk & Stok', en: 'Products' } },
    { id: 'biz_payroll', icon: Users, label: { id: 'Gaji', en: 'Payroll' } },
    { id: 'biz_assets', icon: Landmark, label: { id: 'Aset Tetap', en: 'Fixed Assets' } },
    { id: 'biz_reports', icon: BarChart3, label: { id: 'Laba Rugi, Arus Kas & Neraca', en: 'P&L, Cash Flow & Balance' } },
  ],
};

export const ALL_SERVICES = SERVICE_GROUPS.flatMap((g) => g.items);
