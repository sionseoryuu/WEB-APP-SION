import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Wallet,
  PieChart,
  PiggyBank,
  CalendarDays,
  CheckSquare,
  Calendar,
  Flame,
  Target,
  FileText,
  ShoppingCart,
  BarChart3,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Eye,
  EyeOff,
  Check,
  X,
  Edit3,
  Trash2,
  Pin,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Settings,
  Download,
  Upload,
  RefreshCw,
  CreditCard,
  Landmark,
  Banknote,
  Tag,
  Bell,
  BookOpen,
  ListTodo,
  Kanban,
  CheckCircle2,
  Circle,
  Award,
  ShieldCheck,
  MoreHorizontal,
  Sparkles,
  Repeat,
  Play,
  Pause,
  RotateCcw,
  Globe,
  LogOut,
  Cloud,
  HandCoins,
  Split,
  ScanLine,
  Receipt,
  Send,
  Copy,
  History,
  Camera,
  Image as ImageIcon,
  Loader2,
  QrCode,
  TrendingUp,
  Users,
  BrainCircuit,
  Wand2,
  Moon,
  Droplets,
  Activity,
  Scale,
  HeartHandshake,
  Cake,
  PhoneCall,
  MessageSquare,
  User,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart as RePieChart,
  Pie,
} from 'recharts';
import ThemeSettings from './ThemeSettings.jsx';
import DriveBackup from './DriveBackup.jsx';
import HomeView from './ewallet/HomeView.jsx';
import ActivityView from './ewallet/ActivityView.jsx';
import ProfileView from './ewallet/ProfileView.jsx';
import { BottomNav, MenuSheet } from './ewallet/parts.jsx';
import { parseQris, guessCategory, catName } from './ewallet/helpers.js';
import { Star, Lock, BellRing } from 'lucide-react';
import { makeTr } from './features/i18n.js';
import { enumLabel } from './features/labels.js';
import { todayYmd, newId } from './features/dates.js';
import { applyRecurring, advanceMonth } from './features/recurring.js';
import { computeBudgetAlerts, pruneAlertLog } from './features/budgetAlerts.js';
import { dueItemsForMonth } from './features/calendarItems.js';
import { buildReminders, loadNotifPrefs, saveNotifPrefs, syncReminders, cancelAllReminders, notifyNow, onNotificationTap, requestPermission } from './features/notify.js';
import { loadLock, saveLock, DEFAULT_LOCK } from './features/appLock.js';
import { loadAutoPrefs, runAutoBackup } from './features/autoBackup.js';
import LockScreen from './features/LockScreen.jsx';
import OnboardingFlow from './features/Onboarding.jsx';
import BusinessView from './business/BusinessView.jsx';
import { withBizCategories, DEFAULT_POS } from './business/bizLogic.js';
import RecurringView from './features/RecurringView.jsx';
import TemplatesView from './features/TemplatesView.jsx';
import NotificationSettings from './features/NotificationSettings.jsx';
import SecuritySettings from './features/SecuritySettings.jsx';
import SearchModal from './features/SearchModal.jsx';
import ExportModal from './features/ExportModal.jsx';
import DueList from './features/DueList.jsx';
import { WeeklyModal } from './features/WeeklySummary.jsx';
import { decodeCode, loadImage } from './ewallet/qrScan.js';
import { ocrReceiptImage, parseReceipt, reconcileRows, receiptToJpeg, OCR_BUILD } from './ewallet/receiptOcr.js';
import { aiParseReceipt, aiEnabled } from './ewallet/receiptAi.js';
import { signInWithGoogle, forgetDriveToken, loadCloud, peekCloud, backupToDrive, listCloudWorkspaces, setActiveWs, deleteCloudWorkspace } from './driveSync.js';
import WorkspaceSheet, { WorkspaceChip } from './features/WorkspaceSwitcher.jsx';
import {
  MAIN_WS, keyFor, baseOf, newWsId, typeOf, entryFromData, readRegistry, writeRegistry, upsert, mergeRegistry, pickWorkspace, lastWsKey, wsRegKey, planDelete,
} from './features/workspaces.js';
import { hashData } from './features/autoBackup.js';

// Persistensi lokal (offline-first)
const STORAGE_KEY = 'lifeos:workspace:v1';
function loadSavedWorkspace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Akun lokal (per perangkat): data tiap akun disimpan terpisah agar tidak saling menimpa
const acctStoreKey = (k) => `lifeos:acct:${k}`;
const wsStoreKey = (k) => `lifeos:ws:${k}`;
function readStoredJson(k) {
  try {
    return JSON.parse(localStorage.getItem(k) || 'null');
  } catch {
    return null;
  }
}

function deriveWorkspaceKey(email) {
  const normalized = String(email || 'guest').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `ws_${Math.abs(hash).toString(36)}_${normalized.replace(/[^a-z0-9]/g, '_')}`;
}

function hashPasswordClient(raw) {
  let h = 2166136261;
  const str = String(raw || '');
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

// ============================================================================
// 1. BILINGUAL DICTIONARY (BAHASA INDONESIA & ENGLISH)
// ============================================================================

const I18N = {
  en: {
    grp_command: 'Command',
    grp_wealth: 'Wealth & Vault',
    grp_time: 'Time & Execution',
    grp_growth: 'Growth & Life',
    grp_intel: 'Intelligence',
    nav_dashboard: 'Home',
    nav_activity: 'Activity',
    nav_profile: 'My Profile',
    nav_overview: 'Full Overview',
    nav_wallet: 'Digital Wallet',
    nav_budgets: 'Budgets',
    nav_savings: 'Savings Vaults',
    nav_subscriptions: 'Bills & Subscriptions',
    nav_debts: 'Debts & Installments',
    nav_planner: 'Daily Planner',
    nav_tasks: 'Tasks',
    nav_calendar: 'Calendar',
    nav_habits: 'Habit Tracker',
    nav_goals: 'Goals',
    nav_crm: 'Personal CRM',
    nav_notes: 'Notes & Journal',
    nav_shopping: 'Shopping Lists',
    nav_reports: 'Reports & Analytics',
    nav_investments: 'Investment Portfolio',

    net_worth: 'Net Worth',
    quick_entry: 'Quick Entry',
    all_modules: 'All Modules',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    add: 'Add',
    edit: 'Edit',
    search_placeholder: 'Search...',
    actions: 'Actions',
    date: 'Date',
    description: 'Description',
    category: 'Category',
    amount: 'Amount',
    notes: 'Notes',
    status: 'Status',
    priority: 'Priority',

    today_banner_date: 'Thursday, November 26, 2026',
    welcome_back: 'Welcome back',
    welcome_subtitle:
      'Your personal wealth vault, daily execution plan, and habit telemetry in one command center.',
    btn_transaction: 'Transaction',
    btn_task: 'Task',
    btn_event: 'Event',
    kpi_total_balance: 'Total Net Balance',
    kpi_active_accounts: 'active wallet accounts',
    kpi_monthly_income: 'Monthly Income',
    kpi_inflows_label: 'November 2026 inflows',
    kpi_monthly_expenses: 'Monthly Expenses',
    kpi_net_savings: 'Net savings',
    kpi_budget_util: 'Budget Utilization',
    kpi_left: 'left',
    chart_cashflow_title: 'Cashflow Trajectory',
    chart_cashflow_sub: 'Income vs. Expenses derived from ledger history',
    btn_full_analytics: 'Full Analytics',
    todays_schedule: "Today's Schedule",
    events_scheduled: 'events scheduled',
    no_events_today: 'No events scheduled for today.',
    open_time_blocker: 'Open Daily Time-Blocker',
    recent_ledger: 'Recent Ledger Activity',
    view_all: 'View All',
    priority_tasks: 'Priority Tasks',
    completed_count: 'completed',
    daily_habit_checkin: 'Daily Habit Check-In',
    completed_today: 'completed today',
    active_goals_completion: 'Active Goals Completion',

    wallet_title: 'Digital Wallet & Finance',
    wallet_subtitle:
      'Personal finance & double-entry balance tracker (does not initiate external bank transfers).',
    custom_category: 'Custom Category',
    add_account: 'Add Account',
    new_transaction: 'New Transaction',
    spending_by_cat: 'November Spending by Category',
    excludes_transfers: 'Excludes internal account transfers so net worth remains accurate',
    ledger_summary: 'November Ledger Summary',
    savings_rate: 'Savings Rate',
    all_types: 'All Types',
    all_categories: 'All Categories',
    all_months: 'All Months',
    clear_account_filter: 'Clear Account Filter',

    budget_title: 'Budget Architecture',
    budget_subtitle: 'Category spending guardrails synchronized automatically with your expense ledger.',
    set_cat_limit: 'Set Category Limit',
    budget_alert_title: 'Budget Threshold Notification',
    allocated_budget: 'Allocated Monthly Budget',
    tracked_spend: 'Tracked Category Spend',
    remaining_allowance: 'Remaining Allowance',
    remaining: 'remaining',
    over_by: 'Over by',
    prev_month: 'Prev month',

    savings_title: 'Savings Vaults',
    savings_subtitle: 'Dedicated capital targets with contribution ledger history and milestone tracking.',
    new_savings_vault: 'New Savings Vault',
    contribute: 'Contribute',
    history: 'History',
    target_funded: 'Target fully funded!',
    remaining_to_target: 'remaining to target',

    subs_title: 'Recurring Bills & Subscriptions',
    subs_subtitle: 'Track fixed monthly commitments, due dates, and pay directly into your expense ledger.',
    add_subscription: 'Add Recurring Bill',
    monthly_fixed_burn: 'Monthly Fixed Burn',
    annualized_cost: 'Annualized Commitment',
    paid_this_month: 'Paid This Month',
    pay_and_log: 'Pay & Log',
    paid_badge: 'Paid (Nov)',
    due_day: 'Due day',

    planner_title: 'Executive Planner',
    planner_subtitle: 'Align daily priorities, time-blocked schedules, and weekly execution targets.',
    mode_daily: 'Daily',
    mode_weekly: 'Weekly',
    mode_monthly: 'Monthly',
    top_3_priorities: 'Top 3 Priorities',
    high_leverage_sub: 'High-leverage focus outcomes',
    focus_timer_title: 'Deep Work Focus Timer',
    focus_sessions_done: 'sessions completed today',
    daily_timeline: 'Daily Time-Block Timeline',
    add_time_block: 'Add Time Block',

    tasks_title: 'Task Command',
    tasks_subtitle: 'Structured execution across list and Kanban workflows.',
    view_list: 'List',
    view_board: 'Board',
    new_task: 'New Task',
    todo: 'To Do',
    in_progress: 'In Progress',
    completed: 'Completed',

    calendar_title: 'Calendar & Agenda',
    calendar_subtitle: 'Unified view of scheduled events, reminders, and task deadlines.',
    new_event: 'New Event',
    daily_agenda: 'Daily Agenda',
    task_deadlines: 'Task Deadlines',

    habits_title: 'Habit Rituals & Streaks',
    habits_subtitle: 'Track daily consistency, unbroken streaks, and 7-day completion velocity.',
    new_habit: 'New Habit',
    consistency_chart_title: '7-Day Consistency Rate (%)',
    habit_ritual: 'Habit Ritual',
    streak: 'Streak',

    goals_title: 'Goals & Personal Milestones',
    goals_subtitle: 'Short-term sprints and long-term vision backed by verifiable milestone execution.',
    new_goal: 'New Goal',
    milestone_progress: 'Milestone Progress',

    notes_title: 'Notes & Daily Journal',
    notes_subtitle: 'Structured knowledge vault, pinned references, and daily reflective journaling.',
    new_journal: 'New Journal Entry',
    new_note: 'New Note',
    words: 'words',
    autosaved: 'Auto-saved to workspace state',

    shopping_title: 'Shopping & Provisioning',
    shopping_subtitle: 'Organize lists by category, estimate basket costs, and sync purchased totals to your wallet.',
    new_list: 'New List',
    log_purchased: 'Log Purchased',
    est_basket: 'Estimated Basket',
    purchased_cart: 'Purchased Cart',
    remaining_buy: 'Remaining to Buy',

    reports_title: 'Intelligence & Analytics',
    reports_subtitle: 'Cross-domain telemetry across cashflow, budget variance, savings velocity, and productivity.',
    export_csv: 'Export Ledger CSV',

    settings_title: 'Workspace Settings & Data Vault',
    settings_sub: 'Manage language, currency, portable JSON backups, and workspace resets.',
    profile_display: 'Language, Profile & Currency',
    language_label: 'Interface Language',
    display_name: 'Display Name',
    currency_symbol: 'Currency Symbol',
    save_preferences: 'Save Preferences',
    data_portability: 'Data Portability & Backup',
    export_json: 'Export JSON Snapshot',
    import_json: 'Import JSON Snapshot',
    workspace_reset: 'Workspace Environment Reset',
    start_fresh: 'Start Fresh (Clear All Data)',
    restore_demo: 'Restore Reference Dataset',

    auth_badge: 'Isolated Multi-Account Database Architecture',
    auth_title: 'Sign in to your personal LIFE OS',
    auth_subtitle: 'Each account maintains an independent, isolated database synchronized across sessions.',
    tab_login: 'Sign In',
    tab_register: 'Create Account',
    fullname_label: 'Full Name',
    email_label: 'Email Address',
    password_label: 'Password',
    workspace_mode_label: 'Initial Workspace Setup',
    seed_blank: 'Clean Slate (Empty Database)',
    seed_demo: 'Pre-filled Executive Template',
    btn_login: 'Access My Workspace',
    btn_register: 'Create Account & Database',
    btn_demo_access: 'Instant Demo Workspace',
    logout: 'Sign Out',
    cloud_synced: 'Cloud Vault Active',
    cloud_syncing: 'Syncing...',
    local_session: 'Isolated Session',

    debts_title: 'Debts, Receivables & Installments',
    debts_subtitle: 'Track installment loans and receivables with direct wallet settlement.',
    add_debt: 'Add Debt / Receivable',
    total_debt_owed: 'Total Remaining Debt',
    total_receivable: 'Total Receivables',
    monthly_installments: 'Monthly Installments',
    debt_type_owe: 'Debt / Installment',
    debt_type_receivable: 'Receivable (Owed to You)',
    pay_installment: 'Pay Installment',
    receive_payment: 'Record Repayment',
    tenor_months: 'Tenor (Months)',
    payday_splitter: 'Payday Splitter',
    payday_sub: 'Automatically allocate incoming salary across multiple wallet accounts.',
    total_payday_amount: 'Net Payday Amount',
    execute_split: 'Execute Allocation',
    scan_receipt: 'Scan Barcode & Receipt',
    scan_receipt_sub: 'Use your live camera to scan QRIS/barcodes or snap a receipt for auto-extraction.',
    mode_camera: 'Live Camera',
    mode_upload: 'Upload Photo',
    mode_text: 'Paste Text',
    capture_scan: 'Snap & Extract Data',
    scanning_ai: 'Reading image...',
    camera_error_hint: 'Camera access unavailable or blocked in preview frame. Please allow camera permission or use Upload Photo.',
    extract_and_review: 'Extract Receipt Data',
    daily_briefing: 'Daily Briefing',
    copy_briefing: 'Copy for WhatsApp / Telegram',
    briefing_copied: 'Daily briefing copied to clipboard',

    smart_cmd_placeholder:
      'Type naturally, e.g. "Coffee 45k via QRIS and schedule project review tomorrow at 14:00"',
    smart_cmd_btn: 'Auto-Create',
    smart_cmd_processing: 'Parsing...',
    split_bill: 'Split Bill',
    split_bill_sub: 'Split shared expenses and auto-log friends’ shares as receivables.',
    split_equal: 'Split Equally',
    split_custom: 'Custom Amounts',
    your_share: 'Your Own Share',
    add_participant: 'Add Friend',
    log_total_wallet: 'Log total paid as wallet expense',
    execute_split_bill: 'Create Split & Receivables',
    inv_title: 'Investment Portfolio',
    inv_subtitle: 'Track gold, mutual funds, equities, and bonds integrated into your Total Net Worth.',
    add_investment: 'Add Asset',
    inv_current_value: 'Current Market Value',
    inv_invested_capital: 'Invested Capital',
    inv_unrealized_pnl: 'Unrealized Gain / Loss',
    update_market_val: 'Update Value',
    ai_advisor_title: 'AI Financial & Productivity Advisor',
    ai_advisor_sub: 'Executive telemetry audit across cashflow, budgets, debts, tasks, and habit streaks.',
    ai_run_audit: 'Analyze My Data',
    ai_analyzing: 'Auditing workspace...',

    // NEW: Wellness Telemetry & Personal CRM
    wellness_title: 'Wellness, Sleep & Hydration',
    wellness_sub: 'Daily sleep duration, hydration intake, body weight & energy telemetry',
    sleep_hours: 'Sleep (hrs)',
    water_glasses: 'Water (glasses)',
    body_weight: 'Weight (kg)',
    energy_score: 'Energy (1–10)',
    save_wellness: 'Save Wellness Log',
    wellness_corr_title: 'Sleep Duration vs. Energy & Productivity',
    wellness_corr_sub: '7-day correlation between sleep hours, energy levels, and completed tasks',
    avg_sleep: '7-Day Avg Sleep',
    avg_energy: 'Avg Energy Score',
    crm_title: 'Personal CRM & Relationship Vault',
    crm_sub: 'Nurture key relationships with birthday alerts, last-contact logs, and follow-up reminders.',
    add_contact: 'Add Contact',
    contact_name: 'Full Name / Group',
    relationship_cat: 'Relationship Circle',
    birthday: 'Birthday',
    last_contacted: 'Last Contacted',
    followup_days: 'Follow-Up Cycle (Days)',
    log_contact_today: 'Log Contact Today',
    overdue_followup: 'Follow-Up Due',
    on_track: 'On Track',
    last_topic: 'Last Conversation Topic',
    contact_handle: 'Phone / Handle',
    upcoming_birthdays: 'Upcoming Birthdays',
    due_followups: 'Due for Check-In',
  },
  id: {
    grp_command: 'Pusat Kendali',
    grp_wealth: 'Keuangan & Brankas',
    grp_time: 'Waktu & Eksekusi',
    grp_growth: 'Pengembangan Diri',
    grp_intel: 'Analitik',
    nav_dashboard: 'Beranda',
    nav_activity: 'Aktivitas',
    nav_profile: 'Profil Saya',
    nav_overview: 'Ringkasan Lengkap',
    nav_wallet: 'Dompet Digital',
    nav_budgets: 'Anggaran',
    nav_savings: 'Brankas Tabungan',
    nav_subscriptions: 'Tagihan & Langganan',
    nav_debts: 'Utang, Piutang & Cicilan',
    nav_planner: 'Perencana Harian',
    nav_tasks: 'Manajemen Tugas',
    nav_calendar: 'Kalender',
    nav_habits: 'Pelacak Kebiasaan',
    nav_goals: 'Target & Tujuan',
    nav_crm: 'Personal CRM & Relasi',
    nav_notes: 'Catatan & Jurnal',
    nav_shopping: 'Daftar Belanja',
    nav_reports: 'Laporan & Analitik',
    nav_investments: 'Portofolio Investasi',

    net_worth: 'Total Kekayaan',
    quick_entry: 'Catat Cepat',
    all_modules: 'Semua Modul',
    save: 'Simpan',
    cancel: 'Batal',
    delete: 'Hapus',
    add: 'Tambah',
    edit: 'Ubah',
    search_placeholder: 'Cari...',
    actions: 'Aksi',
    date: 'Tanggal',
    description: 'Deskripsi',
    category: 'Kategori',
    amount: 'Nominal',
    notes: 'Catatan',
    status: 'Status',
    priority: 'Prioritas',

    today_banner_date: 'Kamis, 26 November 2026',
    welcome_back: 'Selamat datang kembali',
    welcome_subtitle:
      'Brankas keuangan pribadi, rencana harian, dan progres kebiasaan Anda dalam satu pusat kendali.',
    btn_transaction: 'Transaksi',
    btn_task: 'Tugas',
    btn_event: 'Agenda',
    kpi_total_balance: 'Total Saldo Bersih',
    kpi_active_accounts: 'akun dompet aktif',
    kpi_monthly_income: 'Pemasukan Bulanan',
    kpi_inflows_label: 'Arus masuk November 2026',
    kpi_monthly_expenses: 'Pengeluaran Bulanan',
    kpi_net_savings: 'Tabungan bersih',
    kpi_budget_util: 'Pemakaian Anggaran',
    kpi_left: 'tersisa',
    chart_cashflow_title: 'Arus Kas Bulanan',
    chart_cashflow_sub: 'Perbandingan pemasukan & pengeluaran dari buku kas',
    btn_full_analytics: 'Analitik Lengkap',
    todays_schedule: 'Jadwal Hari Ini',
    events_scheduled: 'agenda terjadwal',
    no_events_today: 'Tidak ada agenda terjadwal hari ini.',
    open_time_blocker: 'Buka Time-Blocker Harian',
    recent_ledger: 'Transaksi Terbaru',
    view_all: 'Lihat Semua',
    priority_tasks: 'Tugas Prioritas',
    completed_count: 'selesai',
    daily_habit_checkin: 'Check-In Kebiasaan Harian',
    completed_today: 'selesai hari ini',
    active_goals_completion: 'Progres Target Aktif',

    wallet_title: 'Dompet Digital & Keuangan',
    wallet_subtitle:
      'Pencatatan keuangan pribadi & saldo akurat (tidak melakukan transfer bank eksternal secara nyata).',
    custom_category: 'Kategori Kustom',
    add_account: 'Tambah Akun',
    new_transaction: 'Transaksi Baru',
    spending_by_cat: 'Pengeluaran November per Kategori',
    excludes_transfers: 'Tidak termasuk transfer antar akun agar total kekayaan tetap akurat',
    ledger_summary: 'Ringkasan Kas November',
    savings_rate: 'Rasio Tabungan',
    all_types: 'Semua Tipe',
    all_categories: 'Semua Kategori',
    all_months: 'Semua Bulan',
    clear_account_filter: 'Reset Filter Akun',

    budget_title: 'Manajemen Anggaran',
    budget_subtitle: 'Batas pengeluaran per kategori yang tersinkronisasi otomatis dengan buku kas.',
    set_cat_limit: 'Atur Batas Kategori',
    budget_alert_title: 'Peringatan Batas Anggaran',
    allocated_budget: 'Total Anggaran Bulanan',
    tracked_spend: 'Pengeluaran Terpakai',
    remaining_allowance: 'Sisa Anggaran',
    remaining: 'tersisa',
    over_by: 'Melebihi batas',
    prev_month: 'Bulan lalu',

    savings_title: 'Brankas Tabungan',
    savings_subtitle: 'Target dana khusus lengkap dengan riwayat setoran dan visualisasi progres.',
    new_savings_vault: 'Buat Target Tabungan',
    contribute: 'Setor Dana',
    history: 'Riwayat',
    target_funded: 'Target tabungan tercapai!',
    remaining_to_target: 'lagi menuju target',

    subs_title: 'Tagihan Rutin & Langganan',
    subs_subtitle: 'Pantau tagihan bulanan tetap, tanggal jatuh tempo, dan catat pembayaran ke dompet dalam 1 klik.',
    add_subscription: 'Tambah Tagihan Rutin',
    monthly_fixed_burn: 'Total Tagihan Bulanan',
    annualized_cost: 'Estimasi Biaya Tahunan',
    paid_this_month: 'Lunas Bulan Ini',
    pay_and_log: 'Bayar & Catat',
    paid_badge: 'Lunas (Nov)',
    due_day: 'Jatuh tempo tgl',

    planner_title: 'Perencana Eksekutif',
    planner_subtitle: 'Selaraskan prioritas harian, blok waktu kerja fokus, dan target mingguan.',
    mode_daily: 'Harian',
    mode_weekly: 'Mingguan',
    mode_monthly: 'Bulanan',
    top_3_priorities: '3 Prioritas Utama',
    high_leverage_sub: 'Fokus utama paling berdampak hari ini',
    focus_timer_title: 'Timer Fokus Deep Work',
    focus_sessions_done: 'sesi fokus selesai hari ini',
    daily_timeline: 'Jadwal Time-Block Harian',
    add_time_block: 'Tambah Blok Waktu',

    tasks_title: 'Manajemen Tugas',
    tasks_subtitle: 'Kelola daftar tugas terstruktur dengan tampilan Daftar maupun Papan Kanban.',
    view_list: 'Daftar',
    view_board: 'Papan',
    new_task: 'Tugas Baru',
    todo: 'Akan Dikerjakan',
    in_progress: 'Sedang Berjalan',
    completed: 'Selesai',

    calendar_title: 'Kalender & Agenda',
    calendar_subtitle: 'Tampilan terpadu untuk jadwal acara, pengingat, dan tenggat tugas.',
    new_event: 'Agenda Baru',
    daily_agenda: 'Agenda Harian',
    task_deadlines: 'Tenggat Tugas',

    habits_title: 'Pelacak Kebiasaan & Streak',
    habits_subtitle: 'Bangun konsistensi harian, pantau streak tanpa putus, dan grafik 7 hari terakhir.',
    new_habit: 'Kebiasaan Baru',
    consistency_chart_title: 'Tingkat Konsistensi 7 Hari (%)',
    habit_ritual: 'Rutinitas Kebiasaan',
    streak: 'Streak',

    goals_title: 'Target & Pencapaian Pribadi',
    goals_subtitle: 'Target jangka pendek & panjang yang terukur melalui daftar milestone.',
    new_goal: 'Target Baru',
    milestone_progress: 'Progres Milestone',

    notes_title: 'Catatan & Jurnal Harian',
    notes_subtitle: 'Brankas pengetahuan terstruktur, catatan penting tersemat, dan refleksi harian.',
    new_journal: 'Entri Jurnal Baru',
    new_note: 'Catatan Baru',
    words: 'kata',
    autosaved: 'Tersimpan otomatis ke ruang kerja',

    shopping_title: 'Daftar Belanja & Kebutuhan',
    shopping_subtitle: 'Kelompokkan belanja per kategori, hitung estimasi biaya, dan catat ke pengeluaran dompet.',
    new_list: 'Daftar Baru',
    log_purchased: 'Catat Belanja',
    est_basket: 'Estimasi Total Keranjang',
    purchased_cart: 'Sudah Dibeli',
    remaining_buy: 'Belum Dibeli',

    reports_title: 'Laporan & Analitik Terpadu',
    reports_subtitle: 'Statistik arus kas, evaluasi anggaran, progres tabungan, dan produktivitas.',
    export_csv: 'Ekspor CSV Buku Kas',

    settings_title: 'Pengaturan Ruang Kerja & Cadangan Data',
    settings_sub: 'Atur bahasa aplikasi, simbol mata uang, ekspor/impor JSON, atau reset data.',
    profile_display: 'Bahasa, Profil & Mata Uang',
    language_label: 'Bahasa Antarmuka',
    display_name: 'Nama Pengguna',
    currency_symbol: 'Simbol Mata Uang',
    save_preferences: 'Simpan Pengaturan',
    data_portability: 'Portabilitas & Cadangan Data',
    export_json: 'Ekspor Cadangan JSON',
    import_json: 'Impor Cadangan JSON',
    workspace_reset: 'Reset Ruang Kerja',
    start_fresh: 'Mulai dari Nol (Hapus Semua Data)',
    restore_demo: 'Pulihkan Data Referensi',

    auth_badge: 'Arsitektur Database Terpisah per Akun',
    auth_title: 'Masuk ke Ruang Kerja LIFE OS Anda',
    auth_subtitle: 'Setiap akun memiliki database terpisah yang aman dan tersinkronisasi otomatis.',
    tab_login: 'Masuk Akun',
    tab_register: 'Buat Akun Baru',
    fullname_label: 'Nama Lengkap',
    email_label: 'Alamat Email',
    password_label: 'Kata Sandi',
    workspace_mode_label: 'Pilihan Awal Database',
    seed_blank: 'Mulai dari Nol (Database Kosong)',
    seed_demo: 'Gunakan Template Data Contoh',
    btn_login: 'Masuk ke Ruang Kerja',
    btn_register: 'Buat Akun & Database Baru',
    btn_demo_access: 'Akses Cepat Akun Demo',
    logout: 'Keluar Akun',
    cloud_synced: 'Cloud Vault Aktif',
    cloud_syncing: 'Menyimpan...',
    local_session: 'Sesi Terisolasi',

    debts_title: 'Utang, Piutang & Cicilan',
    debts_subtitle: 'Pantau sisa cicilan, pinjaman, dan piutang yang terhubung langsung ke saldo dompet.',
    add_debt: 'Tambah Utang / Piutang',
    total_debt_owed: 'Total Sisa Utang & Cicilan',
    total_receivable: 'Total Piutang (Dana Masuk)',
    monthly_installments: 'Komitmen Cicilan / Bulan',
    debt_type_owe: 'Utang / Cicilan',
    debt_type_receivable: 'Piutang (Orang Berutang)',
    pay_installment: 'Bayar Cicilan',
    receive_payment: 'Terima Pembayaran',
    tenor_months: 'Tenor (Bulan)',
    payday_splitter: 'Alokasi Gaji',
    payday_sub: 'Bagi pemasukan gaji secara otomatis berdasarkan persentase ke beberapa akun dompet.',
    total_payday_amount: 'Nominal Gaji / Pemasukan',
    execute_split: 'Jalankan Alokasi Dana',
    scan_receipt: 'Scan Barcode & Struk',
    scan_receipt_sub: 'Buka kamera langsung untuk memindai QRIS/barcode atau foto struk belanja otomatis.',
    mode_camera: 'Kamera Langsung',
    mode_upload: 'Unggah Foto',
    mode_text: 'Teks Struk',
    capture_scan: 'Jepret & Ekstrak Data',
    scanning_ai: 'Membaca gambar...',
    camera_error_hint: 'Akses kamera diblokir browser/iframe atau kamera tidak ditemukan. Izinkan akses kamera atau gunakan Unggah Foto.',
    extract_and_review: 'Ekstrak Data Struk',
    daily_briefing: 'Ringkasan Harian',
    copy_briefing: 'Salin untuk WhatsApp / Telegram',
    briefing_copied: 'Ringkasan harian disalin ke clipboard',

    smart_cmd_placeholder:
      'Ketik bebas: "Beli kopi 45rb pakai QRIS dan jadwalkan evaluasi proyek besok jam 14.00"',
    smart_cmd_btn: 'Proses Otomatis',
    smart_cmd_processing: 'Memproses...',
    split_bill: 'Bagi Tagihan',
    split_bill_sub: 'Bagi tagihan bersama dan otomatis catat bagian teman sebagai piutang.',
    split_equal: 'Bagi Rata',
    split_custom: 'Nominal Kustom',
    your_share: 'Bagian Anda Sendiri',
    add_participant: 'Tambah Teman',
    log_total_wallet: 'Catat total pembayaran ke pengeluaran dompet',
    execute_split_bill: 'Proses Split & Piutang',
    inv_title: 'Portofolio Investasi',
    inv_subtitle: 'Pantau emas, reksadana, saham, dan obligasi yang terhubung otomatis ke Total Kekayaan.',
    add_investment: 'Tambah Aset',
    inv_current_value: 'Nilai Pasar Terkini',
    inv_invested_capital: 'Total Modal Awal',
    inv_unrealized_pnl: 'Keuntungan / Rugi',
    update_market_val: 'Update Nilai',
    ai_advisor_title: 'Asisten Analis Keuangan & Kebiasaan (AI)',
    ai_advisor_sub: 'Audit cerdas berdasarkan arus kas, anggaran, cicilan, tugas, dan streak kebiasaan Anda.',
    ai_run_audit: 'Analisis Data Saya',
    ai_analyzing: 'Menganalisis data...',

    // BARU: Pelacak Kesehatan & Personal CRM
    wellness_title: 'Kesehatan, Tidur & Hidrasi',
    wellness_sub: 'Catat durasi tidur, asupan air minum, berat badan & skor energi harian',
    sleep_hours: 'Tidur (jam)',
    water_glasses: 'Air (gelas)',
    body_weight: 'Berat (kg)',
    energy_score: 'Energi (1–10)',
    save_wellness: 'Simpan Log Kesehatan',
    wellness_corr_title: 'Korelasi Durasi Tidur vs. Energi & Tugas',
    wellness_corr_sub: 'Perbandingan 7 hari terakhir antara jam tidur, skor energi, dan penyelesaian tugas',
    avg_sleep: 'Rata-Rata Tidur 7 Hari',
    avg_energy: 'Rata-Rata Skor Energi',
    crm_title: 'Personal CRM & Pengingat Relasi',
    crm_sub: 'Jaga silaturahmi dengan pengingat ulang tahun, catatan diskusi terakhir, dan jadwal follow-up.',
    add_contact: 'Tambah Kontak Relasi',
    contact_name: 'Nama Lengkap / Keluarga',
    relationship_cat: 'Lingkaran Relasi',
    birthday: 'Tanggal Lahir',
    last_contacted: 'Kontak Terakhir',
    followup_days: 'Siklus Follow-Up (Hari)',
    log_contact_today: 'Catat Silaturahmi Hari Ini',
    overdue_followup: 'Perlu Dihubungi',
    on_track: 'Terjaga Baik',
    last_topic: 'Topik Pembicaraan Terakhir',
    contact_handle: 'No. HP / Kontak',
    upcoming_birthdays: 'Ulang Tahun Mendatang',
    due_followups: 'Jadwal Sapa Ulang',
  },
};

// ============================================================================
// 2. CONSTANTS & NAVIGATION CONFIG
// ============================================================================

['nav_recurring', 'nav_templates', 'nav_notifications', 'nav_security'].forEach((k) => {
  I18N.id[k] = makeTr('id')(k);
  I18N.en[k] = makeTr('en')(k);
});

const _now = new Date();
const TODAY_STR = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;
const CURRENT_MONTH = TODAY_STR.slice(0, 7);

// Anggaran berlaku berkelanjutan: pakai anggaran terbaru per kategori yang bulannya <= bulan terpilih
function effectiveBudgets(budgets = [], month) {
  const byCat = {};
  budgets.forEach((b) => {
    if (!b.month || b.month > month) return;
    if (!byCat[b.category] || b.month > byCat[b.category].month) byCat[b.category] = b;
  });
  return Object.values(byCat);
}

const DEFAULT_EXPENSE_CATEGORIES = [
  'Housing & Utilities',
  'Dining & Coffee',
  'Groceries',
  'Transport & Travel',
  'Software & Subscriptions',
  'Health & Wellness',
  'Shopping & Lifestyle',
  'Investments',
  'Debt & Installments',
];

const DEFAULT_INCOME_CATEGORIES = [
  'Primary Salary',
  'Consulting & Advisory',
  'Dividends & Yield',
  'Client Retainer',
  'Other Income',
];

const CHART_PALETTE = [
  'rgb(var(--life-accent))',
  'rgb(var(--life-soft))',
  'rgb(var(--life-accent-dark))',
  'rgb(var(--life-accent))',
  'rgb(var(--life-accent-dark))',
  'rgb(var(--life-soft))',
  'rgb(var(--life-accent-dark))',
  'rgb(var(--life-border))',
];

const NAV_GROUPS = [
  {
    labelKey: 'grp_command',
    items: [
      { id: 'dashboard', labelKey: 'nav_dashboard', icon: LayoutDashboard },
      { id: 'activity', labelKey: 'nav_activity', icon: History },
    ],
  },
  {
    labelKey: 'grp_wealth',
    items: [
      { id: 'wallet', labelKey: 'nav_wallet', icon: Wallet },
      { id: 'budgets', labelKey: 'nav_budgets', icon: PieChart },
      { id: 'savings', labelKey: 'nav_savings', icon: PiggyBank },
      { id: 'investments', labelKey: 'nav_investments', icon: TrendingUp },
      { id: 'subscriptions', labelKey: 'nav_subscriptions', icon: Repeat },
      { id: 'debts', labelKey: 'nav_debts', icon: HandCoins },
      { id: 'recurring', labelKey: 'nav_recurring', icon: Repeat },
      { id: 'templates', labelKey: 'nav_templates', icon: Star },
    ],
  },
  {
    labelKey: 'grp_time',
    items: [
      { id: 'planner', labelKey: 'nav_planner', icon: CalendarDays },
      { id: 'tasks', labelKey: 'nav_tasks', icon: CheckSquare },
      { id: 'calendar', labelKey: 'nav_calendar', icon: Calendar },
    ],
  },
  {
    labelKey: 'grp_growth',
    items: [
      { id: 'habits', labelKey: 'nav_habits', icon: Flame },
      { id: 'goals', labelKey: 'nav_goals', icon: Target },
      { id: 'crm', labelKey: 'nav_crm', icon: HeartHandshake },
      { id: 'notes', labelKey: 'nav_notes', icon: FileText },
      { id: 'shopping', labelKey: 'nav_shopping', icon: ShoppingCart },
    ],
  },
  {
    labelKey: 'grp_intel',
    items: [
      { id: 'overview', labelKey: 'nav_overview', icon: LayoutDashboard },
      { id: 'reports', labelKey: 'nav_reports', icon: BarChart3 },
    ],
  },
  {
    labelKey: 'nav_profile',
    items: [
      { id: 'profile', labelKey: 'nav_profile', icon: User },
      { id: 'notifications', labelKey: 'nav_notifications', icon: BellRing },
      { id: 'security', labelKey: 'nav_security', icon: Lock },
    ],
  },
];

// ============================================================================
// 3. INITIAL APPLICATION DATA & EMPTY TEMPLATE
// ============================================================================

const createInitialState = () => ({
  profile: {
    name: 'Alexander Vance',
    role: 'Executive Workspace',
    currency: 'Rp',
    language: 'id',
  },
  accounts: [
    {
      id: 'acc-1',
      name: 'BCA Prioritas Utama',
      type: 'Checking',
      institution: 'Bank Central Asia',
      initialBalance: 18500000,
      lastFour: '4821',
    },
    {
      id: 'acc-2',
      name: 'Brankas Tabungan & RDPU',
      type: 'Savings',
      institution: 'Mandiri & Bibit',
      initialBalance: 45000000,
      lastFour: '9104',
    },
    {
      id: 'acc-3',
      name: 'Kartu Kredit Platinum',
      type: 'Credit',
      institution: 'Atelier Credit',
      initialBalance: -1250000,
      lastFour: '3309',
    },
    {
      id: 'acc-4',
      name: 'Dompet Tunai & QRIS',
      type: 'Cash',
      institution: 'Physical & E-Wallet',
      initialBalance: 1450000,
      lastFour: 'CASH',
    },
  ],
  customExpenseCategories: [],
  customIncomeCategories: [],
  transactions: [
    {
      id: 'tx-h1',
      type: 'income',
      amount: 16500000,
      date: '2026-09-28',
      category: 'Primary Salary',
      description: 'Gaji Bulanan & Tunjangan',
      accountId: 'acc-1',
      paymentMethod: 'Direct Deposit',
      notes: 'Payroll September',
    },
    {
      id: 'tx-h2',
      type: 'expense',
      amount: 6400000,
      date: '2026-09-19',
      category: 'Housing & Utilities',
      description: 'Sewa Apartemen & Internet',
      accountId: 'acc-1',
      paymentMethod: 'Bank Transfer',
      notes: '',
    },
    {
      id: 'tx-h3',
      type: 'income',
      amount: 17200000,
      date: '2026-10-28',
      category: 'Primary Salary',
      description: 'Gaji Bulanan & Bonus Proyek',
      accountId: 'acc-1',
      paymentMethod: 'Direct Deposit',
      notes: '',
    },
    {
      id: 'tx-h4',
      type: 'expense',
      amount: 7100000,
      date: '2026-10-15',
      category: 'Transport & Travel',
      description: 'Tiket Perjalanan & Hotel',
      accountId: 'acc-3',
      paymentMethod: 'Credit Card',
      notes: '',
    },
    {
      id: 'tx-1',
      type: 'income',
      amount: 16500000,
      date: '2026-11-01',
      category: 'Primary Salary',
      description: 'Gaji Eksekutif November',
      accountId: 'acc-1',
      paymentMethod: 'Direct Deposit',
      notes: 'Transfer masuk utama',
    },
    {
      id: 'tx-2',
      type: 'expense',
      amount: 3800000,
      date: '2026-11-03',
      category: 'Housing & Utilities',
      description: 'Hunian, Listrik & Fiber Optik',
      accountId: 'acc-1',
      paymentMethod: 'Bank Transfer',
      notes: 'Termasuk listrik token & internet 300Mbps',
    },
    {
      id: 'tx-3',
      type: 'transfer',
      amount: 3500000,
      date: '2026-11-05',
      category: 'Vault Allocation',
      description: 'Alokasi Dana Cadangan Bulanan',
      accountId: 'acc-1',
      toAccountId: 'acc-2',
      paymentMethod: 'Internal Ledger Transfer',
      notes: 'Auto-allocation ke brankas',
    },
    {
      id: 'tx-4',
      type: 'expense',
      amount: 780000,
      date: '2026-11-09',
      category: 'Groceries',
      description: 'Belanja Bahan Makanan & Buah Segar',
      accountId: 'acc-3',
      paymentMethod: 'QRIS / Card',
      notes: 'Kebutuhan dapur mingguan',
    },
    {
      id: 'tx-5',
      type: 'income',
      amount: 4200000,
      date: '2026-11-14',
      category: 'Consulting & Advisory',
      description: 'Fee Konsultasi Arsitektur Sistem',
      accountId: 'acc-1',
      paymentMethod: 'Wire Settlement',
      notes: 'Sprint Q4',
    },
    {
      id: 'tx-6',
      type: 'expense',
      amount: 450000,
      date: '2026-11-18',
      category: 'Software & Subscriptions',
      description: 'Cloud Hosting & Design Suite',
      accountId: 'acc-3',
      paymentMethod: 'Credit Card',
      notes: '',
    },
    {
      id: 'tx-7',
      type: 'expense',
      amount: 620000,
      date: '2026-11-21',
      category: 'Dining & Coffee',
      description: 'Makan Malam Klien & Biji Kopi Arabika',
      accountId: 'acc-3',
      paymentMethod: 'Credit Card',
      notes: '',
    },
    {
      id: 'tx-8',
      type: 'expense',
      amount: 490000,
      date: '2026-11-24',
      category: 'Health & Wellness',
      description: 'Membership Gym & Fisioterapi',
      accountId: 'acc-1',
      paymentMethod: 'Debit Card',
      notes: '',
    },
    {
      id: 'tx-9',
      type: 'expense',
      amount: 215000,
      date: '2026-11-26',
      category: 'Groceries',
      description: 'Restock Kopi & Kebutuhan Harian',
      accountId: 'acc-4',
      paymentMethod: 'QRIS',
      notes: '',
    },
  ],
  budgets: [
    { id: 'bud-1', category: 'Housing & Utilities', limit: 4200000, month: '2026-11' },
    { id: 'bud-2', category: 'Dining & Coffee', limit: 1000000, month: '2026-11' },
    { id: 'bud-3', category: 'Groceries', limit: 1500000, month: '2026-11' },
    { id: 'bud-4', category: 'Software & Subscriptions', limit: 500000, month: '2026-11' },
    { id: 'bud-5', category: 'Health & Wellness', limit: 750000, month: '2026-11' },
    { id: 'bud-6', category: 'Transport & Travel', limit: 1200000, month: '2026-11' },
  ],
  savingsGoals: [
    {
      id: 'sav-1',
      name: 'Dana Liburan Kyoto & Swiss',
      targetAmount: 35000000,
      targetDate: '2027-06-15',
      linkedAccountId: 'acc-2',
      contributions: [
        { id: 'sc-1', amount: 12000000, date: '2026-09-15', note: 'Setoran awal' },
        { id: 'sc-2', amount: 6500000, date: '2026-10-15', note: 'Alokasi bonus Oktober' },
        { id: 'sc-3', amount: 3500000, date: '2026-11-05', note: 'Alokasi November' },
      ],
    },
    {
      id: 'sav-2',
      name: 'Dana Darurat 12 Bulan',
      targetAmount: 80000000,
      targetDate: '2027-03-01',
      linkedAccountId: 'acc-2',
      contributions: [
        { id: 'sc-4', amount: 48000000, date: '2026-08-01', note: 'Cadangan inti' },
        { id: 'sc-5', amount: 7000000, date: '2026-11-10', note: 'Top-up rutin' },
      ],
    },
    {
      id: 'sav-3',
      name: 'Upgrade Studio Kerja & Audio',
      targetAmount: 15000000,
      targetDate: '2027-01-30',
      linkedAccountId: 'acc-1',
      contributions: [
        { id: 'sc-6', amount: 6500000, date: '2026-10-20', note: 'Milestone proyek' },
        { id: 'sc-7', amount: 2500000, date: '2026-11-18', note: 'Setoran November' },
      ],
    },
  ],
  investments: [
    {
      id: 'inv-1',
      name: 'Emas Batangan Antam (15 Gram)',
      assetClass: 'Gold',
      quantity: '15 gr',
      investedAmount: 19500000,
      currentValue: 23400000,
      updatedAt: '2026-11-26',
    },
    {
      id: 'inv-2',
      name: 'Reksadana Pasar Uang & Pendapatan Tetap',
      assetClass: 'Mutual Fund',
      quantity: '12.450 Unit',
      investedAmount: 20000000,
      currentValue: 21850000,
      updatedAt: '2026-11-26',
    },
    {
      id: 'inv-3',
      name: 'Saham Blue-Chip IDX (BBCA & BMRI)',
      assetClass: 'Stocks',
      quantity: '18 Lot',
      investedAmount: 16200000,
      currentValue: 18100000,
      updatedAt: '2026-11-26',
    },
  ],
  subscriptions: [
    {
      id: 'sub-1',
      name: 'Cloud Workspace & AI Pro Suite',
      amount: 320000,
      billingCycle: 'Monthly',
      dueDay: 28,
      category: 'Software & Subscriptions',
      accountId: 'acc-3',
      lastPaidMonth: '2026-10',
    },
    {
      id: 'sub-2',
      name: 'Internet Fiber Gigabit & VPN',
      amount: 485000,
      billingCycle: 'Monthly',
      dueDay: 5,
      category: 'Housing & Utilities',
      accountId: 'acc-1',
      lastPaidMonth: '2026-11',
    },
    {
      id: 'sub-3',
      name: 'Membership Athletic Club',
      amount: 490000,
      billingCycle: 'Monthly',
      dueDay: 24,
      category: 'Health & Wellness',
      accountId: 'acc-1',
      lastPaidMonth: '2026-11',
    },
    {
      id: 'sub-4',
      name: 'Asuransi Kesehatan & Jiwa',
      amount: 650000,
      billingCycle: 'Monthly',
      dueDay: 30,
      category: 'Health & Wellness',
      accountId: 'acc-3',
      lastPaidMonth: '2026-10',
    },
  ],
  debts: [
    {
      id: 'dbt-1',
      title: 'Cicilan Workstation MacBook Pro 0%',
      counterparty: 'BCA Cicilan 0%',
      kind: 'debt',
      totalAmount: 18000000,
      paidAmount: 12000000,
      monthlyAmount: 1500000,
      tenorMonths: 12,
      dueDate: '2026-12-05',
      accountId: 'acc-1',
      notes: 'Cicilan ke-8 dari 12 bulan',
    },
    {
      id: 'dbt-2',
      title: 'Reimbursement Perjalanan Klien Q4',
      counterparty: 'PT Nusantara Digital',
      kind: 'receivable',
      totalAmount: 3250000,
      paidAmount: 0,
      monthlyAmount: 3250000,
      tenorMonths: 1,
      dueDate: '2026-12-01',
      accountId: 'acc-1',
      notes: 'Invoice #INV-209 disetujui',
    },
  ],
  wellnessLogs: [
    { date: '2026-11-20', sleepHours: 7.2, waterGlasses: 7, weightKg: 71.5, energyScore: 8 },
    { date: '2026-11-21', sleepHours: 6.5, waterGlasses: 6, weightKg: 71.4, energyScore: 7 },
    { date: '2026-11-22', sleepHours: 8.0, waterGlasses: 8, weightKg: 71.3, energyScore: 9 },
    { date: '2026-11-23', sleepHours: 7.5, waterGlasses: 8, weightKg: 71.2, energyScore: 9 },
    { date: '2026-11-24', sleepHours: 6.0, waterGlasses: 5, weightKg: 71.4, energyScore: 6 },
    { date: '2026-11-25', sleepHours: 7.8, waterGlasses: 8, weightKg: 71.1, energyScore: 9 },
    { date: '2026-11-26', sleepHours: 7.5, waterGlasses: 7, weightKg: 71.0, energyScore: 8 },
  ],
  contacts: [
    {
      id: 'cnt-1',
      name: 'Hendra Wijaya',
      category: 'Client',
      handle: '+62 812-8800-4411',
      birthday: '1988-12-04',
      lastContacted: '2026-10-20',
      followUpIntervalDays: 30,
      lastTopic: 'Diskusi ekspansi proyek Q1 & arsitektur cloud',
    },
    {
      id: 'cnt-2',
      name: 'Dr. Ratna Kusuma',
      category: 'Mentor',
      handle: 'ratna.k@advisory.id',
      birthday: '1979-05-14',
      lastContacted: '2026-11-12',
      followUpIntervalDays: 45,
      lastTopic: 'Review strategi portofolio & kepemimpinan tim',
    },
    {
      id: 'cnt-3',
      name: 'Ayah & Ibu (Keluarga Inti)',
      category: 'Family',
      handle: 'Bandung',
      birthday: '1962-12-15',
      lastContacted: '2026-11-24',
      followUpIntervalDays: 7,
      lastTopic: 'Rencana makan malam keluarga akhir pekan',
    },
    {
      id: 'cnt-4',
      name: 'Dimas Pratama',
      category: 'Friend',
      handle: '@dimaspratama',
      birthday: '1993-08-22',
      lastContacted: '2026-09-10',
      followUpIntervalDays: 60,
      lastTopic: 'Lari bareng & rekomendasi buku sistem terdistribusi',
    },
  ],
  tasks: [
    {
      id: 'tsk-1',
      title: 'Evaluasi Portofolio Q4 & Rebalancing Aset',
      description: 'Audit alokasi reksadana dan catatan dividen tahunan.',
      priority: 'Urgent',
      dueDate: '2026-11-26',
      category: 'Finance',
      status: 'in_progress',
      isTopPriority: true,
    },
    {
      id: 'tsk-2',
      title: 'Finalisasi Checklist Rilis LIFE OS v2.0',
      description: 'Verifikasi tampilan responsif desktop & mobile serta isolasi database.',
      priority: 'High',
      dueDate: '2026-11-26',
      category: 'Work',
      status: 'in_progress',
      isTopPriority: true,
    },
    {
      id: 'tsk-3',
      title: 'Lari Sore 8km & Peregangan Mobilitas',
      description: 'Jaga pace zona 3 di jalur taman kota.',
      priority: 'Medium',
      dueDate: '2026-11-26',
      category: 'Health',
      status: 'todo',
      isTopPriority: true,
    },
    {
      id: 'tsk-4',
      title: 'Perpanjang Asuransi Perjalanan Internasional',
      description: 'Konfirmasi cakupan untuk jadwal kuartal depan.',
      priority: 'Low',
      dueDate: '2026-11-28',
      category: 'Personal',
      status: 'todo',
      isTopPriority: false,
    },
    {
      id: 'tsk-5',
      title: 'Rangkum Catatan Arsitektur Sistem Terdistribusi',
      description: 'Buat ringkasan protokol konsensus.',
      priority: 'Medium',
      dueDate: '2026-11-25',
      category: 'Learning',
      status: 'completed',
      isTopPriority: false,
    },
  ],
  events: [
    {
      id: 'evt-1',
      title: 'Blok Fokus Deep Work: Arsitektur Sistem',
      date: '2026-11-26',
      startTime: '09:00',
      endTime: '11:30',
      category: 'Work',
      location: 'Ruang Kerja Pribadi',
      reminder: '15 min before',
      notes: 'Matikan notifikasi. Fokus pada pipeline data inti.',
    },
    {
      id: 'evt-2',
      title: 'Review Strategi Keuangan & Arus Kas',
      date: '2026-11-26',
      startTime: '15:00',
      endTime: '16:00',
      category: 'Finance',
      location: 'Video Call',
      reminder: '15 min before',
      notes: 'Evaluasi tabungan November dan anggaran Desember.',
    },
    {
      id: 'evt-3',
      title: 'Kopi Sore & Waktu Membaca Buku',
      date: '2026-11-26',
      startTime: '17:30',
      endTime: '18:30',
      category: 'Personal',
      location: 'Noir Roastery',
      reminder: 'None',
      notes: 'Selesaikan bab 7 buku arsitektur data.',
    },
    {
      id: 'evt-4',
      title: 'Perencanaan Sprint Mingguan',
      date: '2026-11-27',
      startTime: '10:00',
      endTime: '11:00',
      category: 'Work',
      location: 'Studio A',
      reminder: '1 hour before',
      notes: '',
    },
  ],
  habits: [
    {
      id: 'hab-1',
      name: 'Kopi Pagi & Membaca Buku 30 Menit',
      category: 'Mindset',
      timeOfDay: 'Morning',
      targetPerWeek: 7,
      completedDates: [
        '2026-11-20',
        '2026-11-21',
        '2026-11-22',
        '2026-11-23',
        '2026-11-24',
        '2026-11-25',
        '2026-11-26',
      ],
    },
    {
      id: 'hab-2',
      name: 'Latihan Kekuatan atau Lari 8km',
      category: 'Health',
      timeOfDay: 'Evening',
      targetPerWeek: 5,
      completedDates: ['2026-11-20', '2026-11-22', '2026-11-23', '2026-11-25'],
    },
    {
      id: 'hab-3',
      name: 'Audit Pengeluaran Harian & Tanpa Belanja Impulsif',
      category: 'Finance',
      timeOfDay: 'Evening',
      targetPerWeek: 7,
      completedDates: [
        '2026-11-21',
        '2026-11-22',
        '2026-11-23',
        '2026-11-24',
        '2026-11-25',
        '2026-11-26',
      ],
    },
    {
      id: 'hab-4',
      name: 'Blok Fokus 90 Menit Tanpa Gangguan',
      category: 'Productivity',
      timeOfDay: 'Morning',
      targetPerWeek: 6,
      completedDates: ['2026-11-20', '2026-11-21', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26'],
    },
  ],
  goals: [
    {
      id: 'gol-1',
      title: 'Capai Total Kekayaan Likuid Rp 100 Juta',
      horizon: 'Long-Term',
      category: 'Financial',
      deadline: '2027-04-30',
      status: 'Active',
      milestones: [
        { id: 'ms-1', title: 'Bangun Dana Darurat Rp 45 Juta', completed: true },
        { id: 'ms-2', title: 'Otomatisasi transfer brankas Rp 3,5 Juta/bln', completed: true },
        { id: 'ms-3', title: 'Capai saldo gabungan Rp 60 Juta', completed: true },
        { id: 'ms-4', title: 'Tembus milestone Rp 100 Juta', completed: false },
      ],
    },
    {
      id: 'gol-2',
      title: 'Selesaikan Half-Marathon di Bawah 1 Jam 40 Menit',
      horizon: 'Short-Term',
      category: 'Health',
      deadline: '2027-02-15',
      status: 'Active',
      milestones: [
        { id: 'ms-5', title: 'Bangun jarak tempuh mingguan 40km', completed: true },
        { id: 'ms-6', title: 'Time trial 10k di bawah 45 menit', completed: true },
        { id: 'ms-7', title: 'Simulasi lari jarak 18km', completed: false },
      ],
    },
  ],
  notes: [
    {
      id: 'not-1',
      title: 'Prinsip Alokasi Keuangan & Brankas Q4',
      type: 'Note',
      category: 'Finance',
      pinned: true,
      updatedAt: '2026-11-25T19:40:00',
      content:
        '1. Jaga dana darurat minimal 6 bulan pengeluaran tetap di Brankas Tabungan.\n2. Batasi biaya rutin tetap di bawah 35% pemasukan bulanan.\n3. Alokasikan 100% pendapatan proyek sampingan ke tabungan tujuan.',
    },
    {
      id: 'not-2',
      title: 'Refleksi Harian — 26 Nov 2026',
      type: 'Journal',
      category: 'Daily Journal',
      pinned: true,
      mood: 'Fokus & Tenang',
      updatedAt: '2026-11-26T08:15:00',
      content:
        'Kejernihan Pagi:\nMemulai hari dengan kopi seduh manual dan membaca 30 menit sebelum membuka pesan.\n\nFokus Utama Hari Ini:\nMenjaga blok kerja pagi dan menyelesaikan checklist evaluasi kuartal.',
    },
  ],
  shoppingLists: [
    {
      id: 'shp-1',
      name: 'Belanja Dapur & Kopi Mingguan',
      items: [
        { id: 'si-1', name: 'Biji Kopi Arabika Single-Origin (500g)', qty: 2, estimatedPrice: 145000, category: 'Pantry', purchased: true },
        { id: 'si-2', name: 'Fillet Salmon Segar', qty: 2, estimatedPrice: 120000, category: 'Produce', purchased: false },
        { id: 'si-3', name: 'Alpukat Mentega & Sayuran Organik', qty: 1, estimatedPrice: 85000, category: 'Produce', purchased: false },
        { id: 'si-4', name: 'Minyak Zaitun Extra Virgin', qty: 1, estimatedPrice: 165000, category: 'Pantry', purchased: true },
      ],
    },
    {
      id: 'shp-2',
      name: 'Perlengkapan Meja Kerja',
      items: [
        { id: 'si-6', name: 'Stand Monitor Kayu Walnut', qty: 1, estimatedPrice: 650000, category: 'Electronics', purchased: false },
        { id: 'si-7', name: 'Kabel Braided USB-C Thunderbolt (2m)', qty: 2, estimatedPrice: 185000, category: 'Electronics', purchased: true },
      ],
    },
  ],
});

const createEmptyState = (lang = 'id', ownerName = '') => ({
  profile: {
    name: ownerName || (lang === 'id' ? 'Pemilik Ruang Kerja' : 'Workspace Owner'),
    role: 'Personal Life OS',
    currency: lang === 'id' ? 'Rp' : '$',
    language: lang,
  },
  accounts: [
    {
      id: 'acc-default',
      name: lang === 'id' ? 'Rekening Utama' : 'Primary Checking Account',
      type: 'Checking',
      institution: 'Main Bank',
      initialBalance: 0,
      lastFour: '0001',
    },
  ],
  customExpenseCategories: [],
  customIncomeCategories: [],
  transactions: [],
  budgets: [],
  savingsGoals: [],
  investments: [],
  subscriptions: [],
  debts: [],
  wellnessLogs: [],
  contacts: [],
  tasks: [],
  events: [],
  habits: [],
  goals: [],
  recurring: [],
  templates: [],
  alertLog: {},
  notes: [],
  shoppingLists: [
    {
      id: 'shp-default',
      name: lang === 'id' ? 'Daftar Belanja Umum' : 'General Shopping List',
      items: [],
    },
  ],
});

// Ruang kerja baru dari pilihan registrasi (tipe pencatatan + nama)
const createWorkspaceFromSetup = (lang, fallbackName, setup) => {
  const business = setup?.type === 'business';
  const id = lang === 'id';
  const name = (setup?.name || '').trim() || fallbackName;
  const base = createEmptyState(lang, name);
  if (!business) return { ...base, profile: { ...base.profile, ledgerType: 'personal' } };
  return withBizCategories({
    ...base,
    profile: { ...base.profile, role: id ? 'Pencatatan Usaha' : 'Business Ledger', ledgerType: 'business' },
    accounts: [{ ...base.accounts[0], name: id ? 'Kas Usaha' : 'Business Cash' }],
    products: [],
    sales: [],
    employees: [],
    payrolls: [],
    stockMoves: [],
    pos: { ...DEFAULT_POS, shopName: name },
  });
};

// ============================================================================
// 4. DETERMINISTIC FINANCIAL, WELLNESS & CRM CALCULATION ENGINE
// ============================================================================

function formatMoney(amount, currency = 'Rp', masked = false) {
  if (masked) return `${currency} ••••••`;
  const num = Number(amount) || 0;
  const abs = Math.abs(num);

  if (currency === 'Rp') {
    const formattedIdr = Math.round(abs).toLocaleString('id-ID');
    return num < 0 ? `-Rp ${formattedIdr}` : `Rp ${formattedIdr}`;
  }

  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return num < 0 ? `-${currency}${formatted}` : `${currency}${formatted}`;
}

function formatDateReadable(dateStr, lang = 'id') {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysBetweenDates(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  const [y1, m1, d1] = startIso.split('-').map(Number);
  const [y2, m2, d2] = endIso.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

function getLastNDays(n = 7, anchorStr = TODAY_STR, lang = 'id') {
  const [y, m, d] = anchorStr.split('-').map(Number);
  const anchor = new Date(y, m - 1, d);
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(anchor);
    dt.setDate(anchor.getDate() - i);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    days.push({
      dateStr: `${yyyy}-${mm}-${dd}`,
      dayShort: dt.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' }),
      dayNum: dd,
    });
  }
  return days;
}

function calculateHabitStreak(completedDates = [], anchorStr = TODAY_STR) {
  if (!completedDates.length) return 0;
  const set = new Set(completedDates);
  const [y, m, d] = anchorStr.split('-').map(Number);
  let cursor = new Date(y, m - 1, d);

  const toIso = (dt) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

  if (!set.has(toIso(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!set.has(toIso(cursor))) return 0;
  }

  let streak = 0;
  while (set.has(toIso(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// ============================================================================
// 4B. LENIS SMOOTH SCROLL, MULTI-LAYER PARALLAX & MOTION ENGINE
// ============================================================================

const MOTION_STYLES = `
  @keyframes lifeFadeSlideUp {
    0% {
      opacity: 0;
      transform: translate3d(0, 18px, 0) scale(0.985);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1);
    }
  }

  @keyframes lifeFloatSlow {
    0%, 100% {
      transform: translate3d(0, 0px, 0) rotate(0deg);
    }
    50% {
      transform: translate3d(0, -10px, 0) rotate(2deg);
    }
  }

  @keyframes lifePulseGlow {
    0%, 100% {
      opacity: 0.35;
    }
    50% {
      opacity: 0.65;
    }
  }

  .life-motion-enter {
    animation: lifeFadeSlideUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .life-float-slow {
    animation: lifeFloatSlow 7s ease-in-out infinite;
  }

  .life-pulse-glow {
    animation: lifePulseGlow 5s ease-in-out infinite;
  }

  .life-glass-interactive {
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
                border-color 0.25s ease,
                background-color 0.25s ease,
                box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform;
  }

  .life-glass-interactive:hover {
    transform: translate3d(0, -2px, 0);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(182, 139, 97, 0.22);
  }
`;

function useLenisAndParallax() {
  const scrollYRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const lenisInstanceRef = useRef(null);

  useEffect(() => {
    let rafId = null;
    let lenisInstance = null;
    let isDestroyed = false;

    const updateCssVars = () => {
      document.documentElement.style.setProperty('--life-scroll-y', `${scrollYRef.current}px`);
      document.documentElement.style.setProperty('--life-px', `${pointerRef.current.x}`);
      document.documentElement.style.setProperty('--life-py', `${pointerRef.current.y}`);
    };

    const handleNativeScroll = () => {
      if (!lenisInstance) {
        scrollYRef.current = window.scrollY || 0;
        updateCssVars();
      }
    };

    const handlePointerMove = (e) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      const ny = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      pointerRef.current = { x: nx, y: ny };
      updateCssVars();
    };

    window.addEventListener('scroll', handleNativeScroll, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Dynamically initialize Lenis smooth inertial scroll engine
    (async () => {
      try {
        const mod = await import('https://esm.sh/lenis@1.1.20');
        const LenisCtor = mod?.default || mod?.Lenis;
        if (!LenisCtor || isDestroyed) return;

        lenisInstance = new LenisCtor({
          duration: 1.15,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          wheelMultiplier: 0.95,
          touchMultiplier: 1.5,
        });
        lenisInstanceRef.current = lenisInstance;

        lenisInstance.on('scroll', (ev) => {
          scrollYRef.current = ev?.scroll ?? window.scrollY ?? 0;
          updateCssVars();
        });

        const raf = (time) => {
          if (isDestroyed) return;
          lenisInstance.raf(time);
          rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);
      } catch {
        // Native smooth scroll + CSS variable parallax remains active seamlessly
        document.documentElement.style.scrollBehavior = 'smooth';
      }
    })();

    return () => {
      isDestroyed = true;
      window.removeEventListener('scroll', handleNativeScroll);
      window.removeEventListener('pointermove', handlePointerMove);
      if (rafId) cancelAnimationFrame(rafId);
      if (lenisInstance && typeof lenisInstance.destroy === 'function') {
        lenisInstance.destroy();
      }
    };
  }, []);

  const scrollToTop = useCallback(() => {
    if (lenisInstanceRef.current && typeof lenisInstanceRef.current.scrollTo === 'function') {
      lenisInstanceRef.current.scrollTo(0, { duration: 0.75 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return { scrollToTop };
}

const ParallaxLayer = ({ speed = -0.15, pointerFactor = 12, className = '', children }) => {
  const layerRef = useRef(null);

  useEffect(() => {
    let raf = null;
    const tick = () => {
      if (layerRef.current) {
        const sy = parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--life-scroll-y') || '0'
        );
        const px = parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--life-px') || '0'
        );
        const py = parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--life-py') || '0'
        );
        const ty = sy * speed + py * pointerFactor;
        const tx = px * pointerFactor;
        layerRef.current.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed, pointerFactor]);

  return (
    <div ref={layerRef} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
};

const MotionReveal = ({ delay = 0, className = '', children }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.06 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}ms` }}
      className={`${visible ? 'life-motion-enter' : 'opacity-0 translate-y-4'} ${className}`}
    >
      {children}
    </div>
  );
};

// ============================================================================
// 5. ERROR BOUNDARY & DARK CHOCOLATE LUXURY UI PRIMITIVES
// ============================================================================

class WorkspaceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || 'Unexpected UI error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-life-bg text-life-text flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-life-surface border border-life-accent/60 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-life-soft">LIFE OS Recovery</h2>
            <p className="text-xs text-life-muted">{this.state.errorMsg}</p>
            <button
              onClick={() => this.setState({ hasError: false, errorMsg: '' })}
              className="px-4 py-2 rounded-xl bg-life-accent text-life-bg text-sm font-semibold"
            >
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const GlassCard = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl bg-life-surface/85 backdrop-blur-md border border-life-border/40 shadow-[0_12px_32px_rgba(0,0,0,0.42)] life-glass-interactive min-w-0 ${
      onClick ? 'cursor-pointer hover:border-life-accent/60 hover:bg-life-surface2' : ''
    } ${className}`}
  >
    {children}
  </div>
);

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  type = 'button',
  disabled = false,
}) => {
  const variants = {
    primary:
      'bg-gradient-to-r from-life-accent to-life-accent-dark text-life-bg font-semibold hover:from-life-accent hover:to-life-accent shadow-[0_4px_16px_rgba(182,139,97,0.28)]',
    secondary:
      'bg-life-surface2 text-life-text border border-life-border/60 hover:border-life-accent/70 hover:bg-life-surface2',
    ghost: 'text-life-muted hover:text-life-text hover:bg-life-surface2/70',
    danger:
      'bg-[#D96B52]/20 text-[#F29B87] border border-[#D96B52]/40 hover:bg-[#D96B52]/30',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-xl min-h-[38px]',
    md: 'px-4 py-2.5 text-sm rounded-xl min-h-[44px]',
    lg: 'px-5 py-3 text-base rounded-2xl min-h-[48px]',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, className = '', ...props }) => (
  <div className="space-y-1.5 min-w-0">
    {label && (
      <label className="block text-xs font-medium uppercase tracking-wider text-life-muted">
        {label}
      </label>
    )}
    <input
      {...props}
      className={`w-full rounded-xl bg-life-bg/90 border border-life-border/55 px-3.5 py-2.5 text-sm text-life-text placeholder-life-muted/50 focus:outline-none focus:border-life-accent transition-colors min-h-[44px] ${className}`}
    />
  </div>
);

const Select = ({ label, children, className = '', ...props }) => (
  <div className="space-y-1.5 min-w-0">
    {label && (
      <label className="block text-xs font-medium uppercase tracking-wider text-life-muted">
        {label}
      </label>
    )}
    <select
      {...props}
      className={`w-full rounded-xl bg-life-bg/90 border border-life-border/55 px-3.5 py-2.5 text-sm text-life-text focus:outline-none focus:border-life-accent transition-colors min-h-[44px] ${className}`}
    >
      {children}
    </select>
  </div>
);

const ProgressBar = ({ value, max = 100, tone = 'bronze', height = 'h-2' }) => {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const tones = {
    bronze: 'bg-gradient-to-r from-life-accent-dark to-life-accent',
    champagne: 'bg-gradient-to-r from-life-accent to-life-soft',
    danger: 'bg-gradient-to-r from-[#B84D35] to-[#D96B52]',
    success: 'bg-gradient-to-r from-[#5B8056] to-[#87B082]',
  };
  return (
    <div className={`w-full rounded-full bg-life-bg overflow-hidden border border-life-border/30 ${height}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${tones[tone]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const Modal = ({ open, onClose, title, subtitle, children, maxWidth = 'max-w-lg' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div
        className={`w-full ${maxWidth} rounded-t-3xl sm:rounded-2xl bg-life-surface border border-life-border/70 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col life-motion-enter`}
      >
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-life-border/40 bg-life-bg/50">
          <div className="min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-semibold text-life-text truncate">{title}</h3>
            {subtitle && <p className="text-xs text-life-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-life-muted hover:text-life-text hover:bg-life-surface2 shrink-0"
            aria-label={typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'Close' : 'Tutup'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">{children}</div>
      </div>
    </div>
  );
};

const ConfirmDialog = ({ open, title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', onConfirm, onCancel }) => (
  <Modal open={open} onClose={onCancel} title={title} maxWidth="max-w-md">
    <p className="text-sm text-life-soft/90 leading-relaxed">{message}</p>
    <div className="flex items-center justify-end gap-3 pt-3">
      <Button variant="secondary" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button variant="danger" onClick={onConfirm}>
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-2xl border border-dashed border-life-border/50 bg-life-bg/40">
    <div className="w-12 h-12 rounded-2xl bg-life-surface2 border border-life-border/60 flex items-center justify-center text-life-accent mb-3">
      <Icon className="w-6 h-6" />
    </div>
    <h4 className="text-base font-medium text-life-text">{title}</h4>
    <p className="text-xs text-life-muted max-w-sm mt-1">{description}</p>
    {actionLabel && onAction && (
      <Button size="sm" className="mt-4" onClick={onAction}>
        <Plus className="w-4 h-4" /> {actionLabel}
      </Button>
    )}
  </div>
);

// ============================================================================
// 6. MULTI-ACCOUNT ISOLATED AUTHENTICATION PORTAL
// ============================================================================

const AuthPortalScreen = ({ lang, onToggleLang, t, onAuthenticateSuccess }) => {
  const tr = makeTr(lang);
  const [mode, setMode] = useState('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [seedMode, setSeedMode] = useState('blank');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password.trim()) {
      setErrorMsg(lang === 'id' ? 'Email dan kata sandi wajib diisi.' : 'Email and password are required.');
      return;
    }

    setSubmitting(true);
    const workspaceKey = deriveWorkspaceKey(cleanEmail);
    const pwHash = hashPasswordClient(password);

    // Mode lokal (tanpa cloud): akun disimpan di perangkat ini
    const stored = readStoredJson(acctStoreKey(workspaceKey));
    let ownerName;
    let initialWorkspace;
    if (mode === 'register') {
      if (stored) {
        setErrorMsg(
          lang === 'id'
            ? 'Email sudah terdaftar di perangkat ini. Silakan masuk pada tab Masuk Akun.'
            : 'Email already registered on this device. Please sign in instead.'
        );
        setSubmitting(false);
        return;
      }
      ownerName = fullName.trim() || cleanEmail.split('@')[0];
      initialWorkspace =
        seedMode === 'demo'
          ? { ...createInitialState(), profile: { ...createInitialState().profile, name: ownerName, language: lang } }
          : createEmptyState(lang, ownerName);
      try {
        localStorage.setItem(
          acctStoreKey(workspaceKey),
          JSON.stringify({ email: cleanEmail, name: ownerName, passwordHash: pwHash })
        );
        localStorage.setItem(wsStoreKey(workspaceKey), JSON.stringify(initialWorkspace));
      } catch (err) {
        console.error('Local account save failed:', err);
      }
    } else {
      if (!stored) {
        setErrorMsg(
          lang === 'id'
            ? 'Akun tidak ditemukan di perangkat ini. Silakan buat akun baru terlebih dahulu.'
            : 'Account not found on this device. Please create an account first.'
        );
        setSubmitting(false);
        return;
      }
      if (stored.passwordHash && stored.passwordHash !== pwHash) {
        setErrorMsg(lang === 'id' ? 'Kata sandi tidak sesuai.' : 'Incorrect password.');
        setSubmitting(false);
        return;
      }
      ownerName = stored.name || cleanEmail.split('@')[0];
      initialWorkspace = readStoredJson(wsStoreKey(workspaceKey)) || createEmptyState(lang, ownerName);
    }

    onAuthenticateSuccess({
      email: cleanEmail,
      name: ownerName,
      workspaceKey,
      initialData: initialWorkspace,
      isCloud: false,
    });
    setSubmitting(false);
  };

  const handleGoogle = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      const { profile } = await signInWithGoogle();
      const workspaceKey = `g_${profile.sub}`;
      let cloud = null;
      try {
        cloud = await loadCloud(false);
      } catch (e) {
        if (/drive_http_(401|403)/.test(String(e?.message))) throw new Error('google_drive_denied');
        throw e;
      }
      const fromCloud = cloud?.data?.profile ? cloud.data : null;
      const initialWorkspace = fromCloud || readStoredJson(wsStoreKey(workspaceKey)) || createEmptyState(lang, profile.name);
      onAuthenticateSuccess({
        email: profile.email,
        name: profile.name,
        workspaceKey,
        initialData: initialWorkspace,
        isCloud: true,
        google: true,
        picture: profile.picture,
        cloudMeta: fromCloud ? { hash: hashData(fromCloud), modified: cloud.modifiedTime } : { hash: '', modified: '' },
      });
    } catch (e) {
      const m = String(e?.message || e);
      if (/google_drive_denied/.test(m)) setErrorMsg(tr('google_err_drive'));
      else if (/drive_cancelled|popup_closed|access_denied|drive_timeout/.test(m)) setErrorMsg(tr('google_err_cancel'));
      else if (/Failed to fetch|network|drive_gis_load/i.test(m)) setErrorMsg(tr('bk_err_network'));
      else setErrorMsg(tr('google_err_generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoAccess = () => {
    const demoState = createInitialState();
    demoState.profile.language = lang;
    onAuthenticateSuccess({
      email: 'alexander@lifeos.app',
      name: demoState.profile.name,
      workspaceKey: deriveWorkspaceKey('alexander@lifeos.app'),
      initialData: demoState,
      isCloud: false,
    });
  };

  return (
    <div className="min-h-screen bg-life-bg text-life-text flex flex-col justify-between p-4 sm:p-8 relative overflow-x-hidden">
      <style>{MOTION_STYLES}</style>
      <ParallaxLayer speed={-0.12} pointerFactor={18} className="fixed -top-24 -left-24 pointer-events-none">
        <div className="w-96 h-96 rounded-full bg-life-accent/12 blur-3xl life-pulse-glow" />
      </ParallaxLayer>
      <ParallaxLayer speed={0.14} pointerFactor={-16} className="fixed -bottom-24 -right-24 pointer-events-none">
        <div className="w-96 h-96 rounded-full bg-life-border/25 blur-3xl" />
      </ParallaxLayer>

      <div className="max-w-5xl w-full mx-auto flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-life-accent to-life-border flex items-center justify-center text-life-bg font-bold text-lg shadow-lg">
            L
          </div>
          <div>
            <span className="text-base font-bold tracking-wider text-life-text block">LIFE OS</span>
            <span className="text-[10px] uppercase tracking-widest text-life-accent">
              {lang === 'id' ? 'Edisi Cokelat Gelap' : 'Dark Chocolate Edition'}
            </span>
          </div>
        </div>

        <button
          onClick={onToggleLang}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-life-surface border border-life-border/60 text-xs font-semibold text-life-soft hover:border-life-accent"
        >
          <Globe className="w-4 h-4 text-life-accent" />
          <span>{lang === 'id' ? 'Bahasa Indonesia' : 'English'}</span>
        </button>
      </div>

      <div className="max-w-md w-full mx-auto my-8 relative z-10 life-motion-enter">
        <GlassCard className="p-6 sm:p-8 space-y-6 border-life-accent/35">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-life-bg border border-life-border/60 text-[11px] text-life-soft">
              <ShieldCheck className="w-3.5 h-3.5 text-life-accent" />
              <span>{t('auth_badge')}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{t('auth_title')}</h1>
            <p className="text-xs text-life-muted">{t('auth_subtitle')}</p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-white text-[#1f1f1f] text-sm font-semibold border border-life-border/60 disabled:opacity-60"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
                <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
              </svg>
              {submitting ? '…' : tr('auth_google')}
            </button>
            <p className="text-[11px] text-life-muted text-center">{tr('auth_google_note')}</p>
            <div className="flex items-center gap-3 pt-1">
              <span className="flex-1 h-px bg-life-border/50" />
              <span className="text-[11px] text-life-muted">{tr('auth_or_email')}</span>
              <span className="flex-1 h-px bg-life-border/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-life-bg border border-life-border/50">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'login' ? 'bg-life-accent text-life-bg' : 'text-life-muted hover:text-life-text'
              }`}
            >
              {t('tab_login')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`py-2.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'register' ? 'bg-life-accent text-life-bg' : 'text-life-muted hover:text-life-text'
              }`}
            >
              {t('tab_register')}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#D96B52]/15 border border-[#D96B52]/40 text-xs text-[#F29B87] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {mode === 'register' && (
              <Input
                label={t('fullname_label')}
                placeholder={lang === 'id' ? 'mis. Budi Santoso' : 'e.g. Jane Smith'}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}

            <Input
              label={t('email_label')}
              type="email"
              placeholder={lang === 'id' ? 'nama@email.com' : 'name@email.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label={t('password_label')}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-wider text-life-muted">
                  {t('workspace_mode_label')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'blank', label: t('seed_blank') },
                    { id: 'demo', label: t('seed_demo') },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSeedMode(opt.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                        seedMode === opt.id
                          ? 'bg-life-surface2 border-life-accent text-life-soft'
                          : 'bg-life-bg/80 border-life-border/45 text-life-muted'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {mode === 'login' ? t('btn_login') : t('btn_register')}
            </Button>
          </form>

          <div className="pt-3 border-t border-life-border/35">
            <Button variant="secondary" className="w-full" onClick={handleQuickDemoAccess}>
              <Sparkles className="w-4 h-4 text-life-accent" /> {t('btn_demo_access')}
            </Button>
          </div>
        </GlassCard>
      </div>

      <div className="text-center text-[11px] text-life-muted/70 relative z-10">
        {lang === 'id' ? 'LIFE OS • Arsitektur Keuangan & Produktivitas Pribadi' : 'LIFE OS • Private Personal Wealth & Productivity Architecture'}
      </div>
    </div>
  );
};

// ============================================================================
// 7. MODULE VIEWS
// ============================================================================

// --- MODULE A: EXECUTIVE DASHBOARD (WITH MULTI-LAYER PARALLAX HERO) ---
const DashboardView = ({
  data,
  derived,
  maskBalances,
  t,
  lang,
  onNavigate,
  onOpenTxModal,
  onOpenTaskModal,
  onOpenEventModal,
  onToggleTask,
  onToggleHabitToday,
}) => {
  const { currency } = data.profile;
  const recentTransactions = [...data.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const upcomingTasks = data.tasks
    .filter((tk) => tk.status !== 'completed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  const todaysEvents = data.events
    .filter((e) => e.date === TODAY_STR)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const completedHabitsToday = data.habits.filter((h) =>
    h.completedDates.includes(TODAY_STR)
  ).length;

  const dueFollowUpsCount = (data.contacts || []).filter(
    (c) => daysBetweenDates(c.lastContacted, TODAY_STR) >= (c.followUpIntervalDays || 30)
  ).length;

  return (
    <div className="space-y-6">
      {/* Multi-Layer Parallax Hero Banner */}
      <MotionReveal delay={0}>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-life-surface2 via-life-surface to-life-bg border border-life-accent/35 p-5 sm:p-8 shadow-2xl">
          {/* Parallax Deep Layer 1: Radial Bronze Glow */}
          <ParallaxLayer speed={-0.14} pointerFactor={16} className="absolute -right-16 -top-16 pointer-events-none">
            <div className="w-72 h-72 rounded-full bg-life-accent/15 blur-3xl life-pulse-glow" />
          </ParallaxLayer>

          {/* Parallax Mid Layer 2: Luxury Geometric Ring Watermark */}
          <ParallaxLayer speed={0.09} pointerFactor={-10} className="absolute right-8 -bottom-10 pointer-events-none hidden sm:block">
            <div className="w-44 h-44 rounded-full border border-life-soft/12 flex items-center justify-center life-float-slow">
              <div className="w-28 h-28 rounded-full border border-life-accent/18" />
            </div>
          </ParallaxLayer>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative z-10">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-life-bg/80 border border-life-border/60 text-xs text-life-soft mb-3">
                <Sparkles className="w-3.5 h-3.5 text-life-accent" />
                <span>{new Date().toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-life-text break-words">
                {t('welcome_back')}, {data.profile.name}
              </h1>
              <p className="text-xs sm:text-sm text-life-muted mt-1">{t('welcome_subtitle')}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => onOpenTxModal()}>
                <Plus className="w-4 h-4" /> {t('btn_transaction')}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onOpenTaskModal()}>
                <Plus className="w-4 h-4" /> {t('btn_task')}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onOpenEventModal()}>
                <Plus className="w-4 h-4" /> {t('btn_event')}
              </Button>
            </div>
          </div>
        </div>
      </MotionReveal>

      {/* Staggered KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MotionReveal delay={60}>
          <GlassCard className="p-5 h-full" onClick={() => onNavigate('wallet')}>
            <div className="flex items-center justify-between text-life-muted text-xs uppercase tracking-wider">
              <span>{t('kpi_total_balance')}</span>
              <div className="p-2 rounded-xl bg-life-surface2 text-life-accent">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-xl sm:text-2xl font-semibold text-life-text tabular-nums truncate">
              {formatMoney(derived.totalNetWorth, currency, maskBalances)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-life-soft truncate">
              <span>
                {data.accounts.length} {t('kpi_active_accounts')}
                {(data.investments || []).length > 0
                  ? ` • ${(data.investments || []).length} ${lang === 'id' ? 'aset investasi' : 'assets'}`
                  : ''}
              </span>
            </div>
          </GlassCard>
        </MotionReveal>

        <MotionReveal delay={120}>
          <GlassCard className="p-5 h-full" onClick={() => onNavigate('wallet')}>
            <div className="flex items-center justify-between text-life-muted text-xs uppercase tracking-wider">
              <span>{t('kpi_monthly_income')}</span>
              <div className="p-2 rounded-xl bg-life-surface2 text-life-soft">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-xl sm:text-2xl font-semibold text-life-soft tabular-nums truncate">
              {formatMoney(derived.monthlyIncome, currency, maskBalances)}
            </div>
            <div className="mt-2 text-xs text-life-muted">{t('kpi_inflows_label')}</div>
          </GlassCard>
        </MotionReveal>

        <MotionReveal delay={180}>
          <GlassCard className="p-5 h-full" onClick={() => onNavigate('wallet')}>
            <div className="flex items-center justify-between text-life-muted text-xs uppercase tracking-wider">
              <span>{t('kpi_monthly_expenses')}</span>
              <div className="p-2 rounded-xl bg-life-surface2 text-[#D96B52]">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 text-xl sm:text-2xl font-semibold text-life-text tabular-nums truncate">
              {formatMoney(derived.monthlyExpenses, currency, maskBalances)}
            </div>
            <div className="mt-2 text-xs text-life-muted truncate">
              {t('kpi_net_savings')}:{' '}
              <span className="text-life-accent font-medium tabular-nums">
                {formatMoney(derived.monthlyIncome - derived.monthlyExpenses, currency, maskBalances)}
              </span>
            </div>
          </GlassCard>
        </MotionReveal>

        <MotionReveal delay={240}>
          <GlassCard className="p-5 h-full" onClick={() => onNavigate('budgets')}>
            <div className="flex items-center justify-between text-life-muted text-xs uppercase tracking-wider">
              <span>{t('kpi_budget_util')}</span>
              <div className="p-2 rounded-xl bg-life-surface2 text-life-accent">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span className="text-xl sm:text-2xl font-semibold text-life-text tabular-nums">
                {derived.budgetUtilizationPct.toFixed(0)}%
              </span>
              <span className="text-xs text-life-muted tabular-nums truncate">
                {formatMoney(derived.totalBudgetRemaining, currency, maskBalances)} {t('kpi_left')}
              </span>
            </div>
            <div className="mt-3">
              <ProgressBar
                value={derived.totalBudgetSpent}
                max={derived.totalBudgetLimit || 1}
                tone={derived.budgetUtilizationPct >= 100 ? 'danger' : 'bronze'}
              />
            </div>
          </GlassCard>
        </MotionReveal>
      </div>

      {/* Charts & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MotionReveal delay={100} className="lg:col-span-2">
          <GlassCard className="p-5 h-full">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-semibold text-life-text">{t('chart_cashflow_title')}</h2>
                <p className="text-xs text-life-muted">{t('chart_cashflow_sub')}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('reports')}>
                {t('btn_full_analytics')}
              </Button>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={derived.monthlySeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--life-soft))" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="rgb(var(--life-soft))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--life-accent))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="rgb(var(--life-accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--life-border))" strokeOpacity={0.25} />
                  <XAxis dataKey="label" stroke="rgb(var(--life-muted))" fontSize={12} tickLine={false} />
                  <YAxis stroke="rgb(var(--life-muted))" fontSize={11} tickLine={false} width={45} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(var(--life-surface))',
                      borderColor: 'rgb(var(--life-border))',
                      borderRadius: '12px',
                      color: 'rgb(var(--life-text))',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name={lang === 'id' ? 'Pemasukan' : 'Income'}
                    stroke="rgb(var(--life-soft))"
                    strokeWidth={2.2}
                    fillOpacity={1}
                    fill="url(#incomeGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name={lang === 'id' ? 'Pengeluaran' : 'Expenses'}
                    stroke="rgb(var(--life-accent))"
                    strokeWidth={2.2}
                    fillOpacity={1}
                    fill="url(#expenseGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </MotionReveal>

        <MotionReveal delay={180}>
          <GlassCard className="p-5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-life-text">{t('todays_schedule')}</h2>
                  <p className="text-xs text-life-muted">
                    {todaysEvents.length} {t('events_scheduled')}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('calendar')}>
                  {t('nav_calendar')}
                </Button>
              </div>
              {todaysEvents.length === 0 ? (
                <p className="text-xs text-life-muted py-8 text-center">{t('no_events_today')}</p>
              ) : (
                <div className="space-y-3">
                  {todaysEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 rounded-xl bg-life-bg/80 border border-life-border/40 flex items-start gap-3"
                    >
                      <div className="px-2 py-1 rounded-lg bg-life-surface2 text-life-soft text-xs font-medium tabular-nums shrink-0">
                        {evt.startTime}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-life-text truncate">{evt.title}</p>
                        <p className="text-xs text-life-muted mt-0.5 truncate">
                          {evt.startTime} – {evt.endTime} • {evt.location || evt.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button variant="secondary" size="sm" className="w-full mt-4" onClick={() => onNavigate('planner')}>
              {t('open_time_blocker')}
            </Button>
          </GlassCard>
        </MotionReveal>
      </div>

      {/* Bottom Telemetry Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MotionReveal delay={80}>
          <GlassCard className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-life-text">{t('recent_ledger')}</h2>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('wallet')}>
                {t('view_all')}
              </Button>
            </div>
            {recentTransactions.length === 0 ? (
              <p className="text-xs text-life-muted py-6 text-center">
                {lang === 'id' ? 'Belum ada transaksi tercatat.' : 'No transactions logged yet.'}
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentTransactions.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-life-bg/70 border border-life-border/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-life-surface2 flex items-center justify-center text-life-accent shrink-0">
                          {isIncome ? (
                            <ArrowUpRight className="w-4 h-4 text-life-soft" />
                          ) : isTransfer ? (
                            <ArrowLeftRight className="w-4 h-4 text-life-accent" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-[#D96B52]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-life-text truncate">{tx.description}</p>
                          <p className="text-[11px] text-life-muted truncate">
                            {tx.category} • {formatDateReadable(tx.date, lang)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs sm:text-sm font-semibold tabular-nums shrink-0 ml-2 ${
                          isIncome
                            ? 'text-life-soft'
                            : isTransfer
                            ? 'text-life-accent'
                            : 'text-life-text'
                        }`}
                      >
                        {isIncome ? '+' : isTransfer ? '' : '-'}
                        {formatMoney(tx.amount, currency, maskBalances)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </MotionReveal>

        <MotionReveal delay={140}>
          <GlassCard className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-life-text">{t('priority_tasks')}</h2>
                <p className="text-xs text-life-muted">
                  {data.tasks.filter((tk) => tk.status === 'completed').length}/{data.tasks.length}{' '}
                  {t('completed_count')}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('tasks')}>
                {t('view_all')}
              </Button>
            </div>
            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-life-muted py-6 text-center">
                {lang === 'id' ? 'Semua tugas selesai.' : 'All tasks completed.'}
              </p>
            ) : (
              <div className="space-y-2.5">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleTask(task.id)}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-life-bg/70 border border-life-border/30 hover:border-life-accent/50 cursor-pointer transition-colors"
                  >
                    <button
                      type="button"
                      className="mt-0.5 text-life-accent hover:text-life-soft shrink-0"
                      aria-label={lang === 'id' ? 'Tandai tugas selesai' : 'Toggle task completion'}
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-life-text truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-life-surface2 text-life-soft">
                          {task.priority}
                        </span>
                        <span className="text-[11px] text-life-muted">
                          {formatDateReadable(task.dueDate, lang)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </MotionReveal>

        <MotionReveal delay={200}>
          <GlassCard className="p-5 h-full flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-semibold text-life-text">{t('daily_habit_checkin')}</h2>
                  <p className="text-xs text-life-muted">
                    {completedHabitsToday}/{data.habits.length} {t('completed_today')}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('habits')}>
                  {t('nav_habits')}
                </Button>
              </div>
              <div className="space-y-2">
                {data.habits.slice(0, 4).map((habit) => {
                  const doneToday = habit.completedDates.includes(TODAY_STR);
                  const streak = calculateHabitStreak(habit.completedDates);
                  return (
                    <button
                      key={habit.id}
                      onClick={() => onToggleHabitToday(habit.id, TODAY_STR)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                        doneToday
                          ? 'bg-life-surface2/90 border-life-accent/60 text-life-text'
                          : 'bg-life-bg/70 border-life-border/30 text-life-muted hover:text-life-text'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                            doneToday ? 'bg-life-accent text-life-bg' : 'border border-life-border'
                          }`}
                        >
                          {doneToday && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                        </div>
                        <span className="text-xs font-medium truncate">{habit.name}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] text-life-soft shrink-0 ml-2">
                        <Flame className="w-3.5 h-3.5 text-life-accent" /> {streak}d
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-life-border/30 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-life-muted">{t('active_goals_completion')}</span>
                  <span className="text-life-soft font-semibold tabular-nums">
                    {derived.overallGoalPct.toFixed(0)}%
                  </span>
                </div>
                <ProgressBar value={derived.overallGoalPct} max={100} tone="champagne" />
              </div>

              {dueFollowUpsCount > 0 && (
                <button
                  onClick={() => onNavigate('crm')}
                  className="w-full p-2.5 rounded-xl bg-life-surface2/80 border border-life-accent/45 flex items-center justify-between text-xs text-life-soft hover:border-life-accent"
                >
                  <span className="flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-life-accent" />
                    <span>{t('due_followups')}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-life-accent text-life-bg font-bold">
                    {dueFollowUpsCount}
                  </span>
                </button>
              )}
            </div>
          </GlassCard>
        </MotionReveal>
      </div>
    </div>
  );
};

// --- MODULE B: DIGITAL WALLET & FINANCE ---
const WalletView = ({
  data,
  derived,
  maskBalances,
  t,
  lang,
  onOpenTxModal,
  onDeleteTx,
  onAddAccount,
  onAddCustomCategory,
  onOpenPaydayModal,
  onOpenReceiptModal,
  onOpenSplitBillModal,
}) => {
  const { currency } = data.profile;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState('Checking');
  const [accInstitution, setAccInstitution] = useState('');
  const [accInitial, setAccInitial] = useState('0');
  const [accLastFour, setAccLastFour] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [newCatKind, setNewCatKind] = useState('expense');

  const allCategories = useMemo(
    () => [
      ...new Set([
        ...DEFAULT_EXPENSE_CATEGORIES,
        ...DEFAULT_INCOME_CATEGORIES,
        ...data.customExpenseCategories,
        ...data.customIncomeCategories,
        'Vault Allocation',
      ]),
    ],
    [data.customExpenseCategories, data.customIncomeCategories]
  );

  const availableMonths = useMemo(() => {
    const months = new Set(data.transactions.map((tx) => tx.date.slice(0, 7)));
    months.add(CURRENT_MONTH);
    return [...months].sort().reverse();
  }, [data.transactions]);

  const filteredTransactions = useMemo(() => {
    return data.transactions
      .filter((tx) => {
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
        if (
          accountFilter !== 'all' &&
          tx.accountId !== accountFilter &&
          tx.toAccountId !== accountFilter
        ) {
          return false;
        }
        if (monthFilter !== 'all' && !tx.date.startsWith(monthFilter)) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchDesc = tx.description.toLowerCase().includes(q);
          const matchCat = tx.category.toLowerCase().includes(q);
          const matchNotes = (tx.notes || '').toLowerCase().includes(q);
          if (!matchDesc && !matchCat && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.transactions, typeFilter, categoryFilter, accountFilter, monthFilter, search]);

  const accountMap = useMemo(() => {
    const map = {};
    data.accounts.forEach((a) => {
      map[a.id] = a;
    });
    return map;
  }, [data.accounts]);

  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (!accName.trim()) return;
    onAddAccount({
      name: accName.trim(),
      type: accType,
      institution: accInstitution.trim() || 'Private Ledger',
      initialBalance: parseFloat(accInitial) || 0,
      lastFour: (accLastFour.trim() || '0000').slice(0, 4),
    });
    setAccName('');
    setAccInstitution('');
    setAccInitial('0');
    setAccLastFour('');
    setShowAccountModal(false);
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCustomCategory(newCatKind, newCatName.trim());
    setNewCatName('');
    setShowCategoryModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{t('wallet_title')}</h1>
          <p className="text-xs text-life-muted mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-life-accent shrink-0" />
            <span>{t('wallet_subtitle')}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onOpenReceiptModal}>
            <ScanLine className="w-4 h-4 text-life-accent" /> {t('scan_receipt')}
          </Button>
          <Button variant="secondary" size="sm" onClick={onOpenSplitBillModal}>
            <Users className="w-4 h-4 text-life-soft" /> {t('split_bill')}
          </Button>
          <Button variant="secondary" size="sm" onClick={onOpenPaydayModal}>
            <Split className="w-4 h-4 text-life-soft" /> {t('payday_splitter')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowCategoryModal(true)}>
            <Tag className="w-4 h-4" /> {t('custom_category')}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowAccountModal(true)}>
            <CreditCard className="w-4 h-4" /> {t('add_account')}
          </Button>
          <Button size="sm" onClick={() => onOpenTxModal()}>
            <Plus className="w-4 h-4" /> {t('new_transaction')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {data.accounts.map((acc) => {
          const bal = derived.accountBalances[acc.id] ?? acc.initialBalance;
          const isSelected = accountFilter === acc.id;
          return (
            <div
              key={acc.id}
              onClick={() => setAccountFilter(isSelected ? 'all' : acc.id)}
              className={`cursor-pointer rounded-2xl p-5 life-glass-interactive border relative overflow-hidden ${
                isSelected
                  ? 'bg-gradient-to-br from-life-surface2 to-life-surface border-life-soft shadow-lg'
                  : 'bg-gradient-to-br from-life-surface2 to-life-bg border-life-border/50 hover:border-life-accent/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-life-bg/80 text-life-soft border border-life-border/50">
                  {acc.type}
                </span>
                {acc.type === 'Credit' ? (
                  <CreditCard className="w-4 h-4 text-life-accent" />
                ) : acc.type === 'Cash' ? (
                  <Banknote className="w-4 h-4 text-life-accent" />
                ) : (
                  <Landmark className="w-4 h-4 text-life-accent" />
                )}
              </div>
              <div className="mt-4">
                <p className="text-xs text-life-muted truncate">{acc.institution}</p>
                <h3 className="text-sm font-medium text-life-text truncate">{acc.name}</h3>
              </div>
              <div className="mt-4 flex items-end justify-between gap-2">
                <span className="text-lg sm:text-xl font-semibold text-life-text tabular-nums truncate">
                  {formatMoney(bal, currency, maskBalances)}
                </span>
                <span className="text-xs text-life-muted font-mono shrink-0">•••• {acc.lastFour}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-life-text mb-1">{t('spending_by_cat')}</h2>
          <p className="text-xs text-life-muted mb-4">{t('excludes_transfers')}</p>
          {derived.categoryBreakdown.length === 0 ? (
            <p className="text-xs text-life-muted py-12 text-center">
              {lang === 'id' ? 'Belum ada pengeluaran bulan ini.' : 'No expenses recorded this month.'}
            </p>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={derived.categoryBreakdown}
                  layout="vertical"
                  margin={{ top: 0, right: 15, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--life-border))" strokeOpacity={0.2} horizontal={false} />
                  <XAxis type="number" stroke="rgb(var(--life-muted))" fontSize={11} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    stroke="rgb(var(--life-text))"
                    fontSize={11}
                    width={110}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(var(--life-surface))',
                      borderColor: 'rgb(var(--life-border))',
                      borderRadius: '12px',
                      color: 'rgb(var(--life-text))',
                    }}
                  />
                  <Bar dataKey="amount" name={t('amount')} radius={[0, 8, 8, 0]}>
                    {derived.categoryBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-5 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-semibold text-life-text mb-1">{t('ledger_summary')}</h2>
            <p className="text-xs text-life-muted">{t('chart_cashflow_sub')}</p>
            <div className="mt-5 space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-life-bg/80 gap-2">
                <span className="text-xs text-life-muted">{t('net_worth')}</span>
                <span className="text-sm font-semibold text-life-soft tabular-nums truncate">
                  {formatMoney(derived.totalNetWorth, currency, maskBalances)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-life-bg/80 gap-2">
                <span className="text-xs text-life-muted">{t('kpi_monthly_income')}</span>
                <span className="text-sm font-semibold text-life-text tabular-nums truncate">
                  +{formatMoney(derived.monthlyIncome, currency, maskBalances)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-life-bg/80 gap-2">
                <span className="text-xs text-life-muted">{t('kpi_monthly_expenses')}</span>
                <span className="text-sm font-semibold text-[#D96B52] tabular-nums truncate">
                  -{formatMoney(derived.monthlyExpenses, currency, maskBalances)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-life-surface2/70 border border-life-accent/40 gap-2">
                <span className="text-xs text-life-soft">{t('savings_rate')}</span>
                <span className="text-sm font-bold text-life-soft tabular-nums">
                  {derived.monthlyIncome > 0
                    ? `${Math.max(
                        0,
                        ((derived.monthlyIncome - derived.monthlyExpenses) / derived.monthlyIncome) * 100
                      ).toFixed(1)}%`
                    : '0.0%'}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-life-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full rounded-xl bg-life-bg border border-life-border/55 pl-10 pr-4 py-2 text-sm text-life-text placeholder-life-muted/50 focus:outline-none focus:border-life-accent"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl bg-life-bg border border-life-border/55 px-3 py-2 text-xs text-life-text"
            >
              <option value="all">{t('all_types')}</option>
              <option value="income">{lang === 'id' ? 'Pemasukan' : 'Income'}</option>
              <option value="expense">{lang === 'id' ? 'Pengeluaran' : 'Expense'}</option>
              <option value="transfer">{lang === 'id' ? 'Transfer' : 'Transfer'}</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl bg-life-bg border border-life-border/55 px-3 py-2 text-xs text-life-text"
            >
              <option value="all">{t('all_categories')}</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="rounded-xl bg-life-bg border border-life-border/55 px-3 py-2 text-xs text-life-text"
            >
              <option value="all">{t('all_months')}</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {accountFilter !== 'all' && (
              <Button size="sm" variant="ghost" onClick={() => setAccountFilter('all')}>
                {t('clear_account_filter')}
              </Button>
            )}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={lang === 'id' ? 'Tidak ada transaksi cocok' : 'No matching transactions'}
            description={
              lang === 'id'
                ? 'Ubah filter pencarian atau catat pemasukan, pengeluaran, maupun transfer baru.'
                : 'Adjust your search filters or log a new income, expense, or internal transfer.'
            }
            actionLabel={t('new_transaction')}
            onAction={() => onOpenTxModal()}
          />
        ) : (
          <>
            <div className="md:hidden space-y-2.5">
              {filteredTransactions.map((tx) => {
                const srcAcc = accountMap[tx.accountId]?.name || 'Wallet';
                const dstAcc = tx.toAccountId ? accountMap[tx.toAccountId]?.name : null;
                return (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-xl bg-life-bg/85 border border-life-border/40 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-life-text truncate">{tx.description}</p>
                        <p className="text-[11px] text-life-muted">
                          {formatDateReadable(tx.date, lang)} • {tx.category}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-semibold tabular-nums shrink-0 ${
                          tx.type === 'income'
                            ? 'text-life-soft'
                            : tx.type === 'transfer'
                            ? 'text-life-accent'
                            : 'text-life-text'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '⇄ ' : '-'}
                        {formatMoney(tx.amount, currency, maskBalances)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-life-border/25 text-xs text-life-muted">
                      <span className="truncate">
                        {tx.type === 'transfer' && dstAcc ? `${srcAcc} → ${dstAcc}` : srcAcc}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onOpenTxModal(tx)}
                          className="p-1.5 rounded-lg text-life-muted hover:text-life-soft"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTx(tx)}
                          className="p-1.5 rounded-lg text-life-muted hover:text-[#D96B52]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-life-border/40 text-[11px] uppercase tracking-wider text-life-muted">
                    <th className="py-3 px-3">{t('date')}</th>
                    <th className="py-3 px-3">{t('description')}</th>
                    <th className="py-3 px-3">{t('category')}</th>
                    <th className="py-3 px-3">{lang === 'id' ? 'Akun / Metode' : 'Account / Method'}</th>
                    <th className="py-3 px-3 text-right">{t('amount')}</th>
                    <th className="py-3 px-3 text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-life-border/25 text-sm">
                  {filteredTransactions.map((tx) => {
                    const srcAcc = accountMap[tx.accountId]?.name || 'Wallet';
                    const dstAcc = tx.toAccountId ? accountMap[tx.toAccountId]?.name : null;
                    return (
                      <tr key={tx.id} className="hover:bg-life-surface2/35 transition-colors">
                        <td className="py-3 px-3 text-xs text-life-muted whitespace-nowrap">
                          {formatDateReadable(tx.date, lang)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-life-text">{tx.description}</div>
                          {tx.notes && <div className="text-xs text-life-muted">{tx.notes}</div>}
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs bg-life-surface2 text-life-soft border border-life-border/40">
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs text-life-muted">
                          {tx.type === 'transfer' && dstAcc ? (
                            <span>
                              {srcAcc} → <strong className="text-life-soft">{dstAcc}</strong>
                            </span>
                          ) : (
                            <span>
                              {srcAcc} • {tx.paymentMethod}
                            </span>
                          )}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-semibold tabular-nums whitespace-nowrap ${
                            tx.type === 'income'
                              ? 'text-life-soft'
                              : tx.type === 'transfer'
                              ? 'text-life-accent'
                              : 'text-life-text'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '⇄ ' : '-'}
                          {formatMoney(tx.amount, currency, maskBalances)}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => onOpenTxModal(tx)}
                              className="p-1.5 rounded-lg text-life-muted hover:text-life-soft hover:bg-life-surface2"
                              title={t('edit')}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteTx(tx)}
                              className="p-1.5 rounded-lg text-life-muted hover:text-[#D96B52] hover:bg-life-surface2"
                              title={t('delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </GlassCard>

      <Modal open={showAccountModal} onClose={() => setShowAccountModal(false)} title={t('add_account')}>
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <Input
            label={lang === 'id' ? 'Nama Akun / Rekening' : 'Account Name'}
            placeholder={lang === 'id' ? 'mis. BCA Prioritas / Mandiri Tabungan' : 'e.g. Main Bank / Savings Account'}
            value={accName}
            onChange={(e) => setAccName(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label={lang === 'id' ? 'Tipe Akun' : 'Account Type'}
              value={accType}
              onChange={(e) => setAccType(e.target.value)}
            >
              <option value="Checking">{enumLabel('accountType', 'Checking', lang)}</option>
              <option value="Savings">{enumLabel('accountType', 'Savings', lang)}</option>
              <option value="Credit">{enumLabel('accountType', 'Credit', lang)}</option>
              <option value="Cash">{enumLabel('accountType', 'Cash', lang)}</option>
              <option value="Investment">{enumLabel('accountType', 'Investment', lang)}</option>
            </Select>
            <Input
              label={lang === 'id' ? 'Saldo Awal' : 'Opening Balance'}
              type="number"
              step="0.01"
              value={accInitial}
              onChange={(e) => setAccInitial(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={lang === 'id' ? 'Bank / Penyedia' : 'Institution'}
              placeholder={lang === 'id' ? 'mis. Bank Central Asia' : 'e.g. National Bank'}
              value={accInstitution}
              onChange={(e) => setAccInstitution(e.target.value)}
            />
            <Input
              label={lang === 'id' ? '4 Digit Terakhir' : 'Last 4 Digits'}
              maxLength={4}
              placeholder="4821"
              value={accLastFour}
              onChange={(e) => setAccLastFour(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAccountModal(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showCategoryModal} onClose={() => setShowCategoryModal(false)} title={t('custom_category')}>
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Select
            label={lang === 'id' ? 'Jenis Kategori' : 'Category Type'}
            value={newCatKind}
            onChange={(e) => setNewCatKind(e.target.value)}
          >
            <option value="expense">{lang === 'id' ? 'Kategori Pengeluaran' : 'Expense Category'}</option>
            <option value="income">{lang === 'id' ? 'Kategori Pemasukan' : 'Income Category'}</option>
          </Select>
          <Input
            label={lang === 'id' ? 'Nama Kategori' : 'Category Name'}
            placeholder={lang === 'id' ? 'mis. Kopi & Ngopi / Zakat & Sedekah' : 'e.g. Coffee Runs / Charity'}
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// --- MODULE C: BUDGET MANAGEMENT ---
const BudgetsView = ({ data, maskBalances, t, lang, onSaveBudget, onDeleteBudget }) => {
  const { currency } = data.profile;
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [limit, setLimit] = useState('500000');

  const expenseCategories = useMemo(
    () => [...new Set([...DEFAULT_EXPENSE_CATEGORIES, ...data.customExpenseCategories])],
    [data.customExpenseCategories]
  );

  const prevMonth = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const dt = new Date(y, m - 2, 1);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  }, [selectedMonth]);

  const spendingByCategory = useMemo(() => {
    const map = {};
    data.transactions
      .filter((tx) => tx.type === 'expense' && tx.date.startsWith(selectedMonth))
      .forEach((tx) => {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
      });
    return map;
  }, [data.transactions, selectedMonth]);

  const prevSpendingByCategory = useMemo(() => {
    const map = {};
    data.transactions
      .filter((tx) => tx.type === 'expense' && tx.date.startsWith(prevMonth))
      .forEach((tx) => {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
      });
    return map;
  }, [data.transactions, prevMonth]);

  const monthBudgets = useMemo(
    () => effectiveBudgets(data.budgets, selectedMonth),
    [data.budgets, selectedMonth]
  );

  const summary = useMemo(() => {
    const totalLimit = monthBudgets.reduce((acc, b) => acc + b.limit, 0);
    const totalSpent = monthBudgets.reduce((acc, b) => acc + (spendingByCategory[b.category] || 0), 0);
    const alerts = monthBudgets.filter((b) => (spendingByCategory[b.category] || 0) >= b.limit * 0.85);
    return {
      totalLimit,
      totalSpent,
      remaining: totalLimit - totalSpent,
      alerts,
    };
  }, [monthBudgets, spendingByCategory]);

  const openModal = (bud = null) => {
    setEditingBudget(bud);
    setCategory(bud ? bud.category : expenseCategories[0]);
    setLimit(bud ? String(bud.limit) : currency === 'Rp' ? '1000000' : '500');
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericLimit = parseFloat(limit);
    if (!numericLimit || numericLimit <= 0) return;
    onSaveBudget({
      id: editingBudget?.id,
      category,
      limit: numericLimit,
      month: selectedMonth,
    });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{t('budget_title')}</h1>
          <p className="text-xs text-life-muted mt-1">{t('budget_subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl bg-life-surface border border-life-border/60 px-3 py-2 text-sm text-life-text"
          />
          <Button size="sm" onClick={() => openModal()}>
            <Plus className="w-4 h-4" /> {t('set_cat_limit')}
          </Button>
        </div>
      </div>

      {summary.alerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#D96B52]/15 border border-[#D96B52]/40 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#D96B52] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-life-text">{t('budget_alert_title')}</h3>
            <p className="text-xs text-life-soft mt-0.5">
              {summary.alerts
                .map(
                  (a) =>
                    `${a.category} (${Math.round(((spendingByCategory[a.category] || 0) / a.limit) * 100)}%)`
                )
                .join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <span className="text-xs uppercase tracking-wider text-life-muted">{t('allocated_budget')}</span>
          <div className="mt-2 text-xl sm:text-2xl font-semibold text-life-text tabular-nums">
            {formatMoney(summary.totalLimit, currency, maskBalances)}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <span className="text-xs uppercase tracking-wider text-life-muted">{t('tracked_spend')}</span>
          <div className="mt-2 text-xl sm:text-2xl font-semibold text-life-accent tabular-nums">
            {formatMoney(summary.totalSpent, currency, maskBalances)}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <span className="text-xs uppercase tracking-wider text-life-muted">{t('remaining_allowance')}</span>
          <div
            className={`mt-2 text-xl sm:text-2xl font-semibold tabular-nums ${
              summary.remaining < 0 ? 'text-[#D96B52]' : 'text-life-soft'
            }`}
          >
            {formatMoney(summary.remaining, currency, maskBalances)}
          </div>
        </GlassCard>
      </div>

      {monthBudgets.length === 0 ? (
        <EmptyState
          icon={PieChart}
          title={lang === 'id' ? `Belum ada anggaran untuk ${selectedMonth}` : `No budgets configured for ${selectedMonth}`}
          description={
            lang === 'id'
              ? 'Tetapkan batas pengeluaran bulanan per kategori untuk mengontrol arus kas.'
              : 'Establish monthly spending ceilings per category to monitor burn rate.'
          }
          actionLabel={t('set_cat_limit')}
          onAction={() => openModal()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {monthBudgets.map((b) => {
            const spent = spendingByCategory[b.category] || 0;
            const prevSpent = prevSpendingByCategory[b.category] || 0;
            const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
            const rem = b.limit - spent;
            const tone = pct >= 100 ? 'danger' : pct >= 80 ? 'champagne' : 'bronze';
            return (
              <GlassCard key={b.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-life-text">{b.category}</h3>
                    <p className="text-xs text-life-muted mt-0.5 tabular-nums">
                      {formatMoney(spent, currency, maskBalances)} /{' '}
                      {formatMoney(b.limit, currency, maskBalances)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openModal(b)}
                      className="p-1.5 rounded-lg text-life-muted hover:text-life-soft hover:bg-life-surface2"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteBudget(b)}
                      className="p-1.5 rounded-lg text-life-muted hover:text-[#D96B52] hover:bg-life-surface2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <ProgressBar value={spent} max={b.limit} tone={tone} height="h-2.5" />

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                  <span className={rem < 0 ? 'text-[#D96B52] font-medium' : 'text-life-soft'}>
                    {rem < 0
                      ? `${t('over_by')} ${formatMoney(Math.abs(rem), currency, maskBalances)}`
                      : `${formatMoney(rem, currency, maskBalances)} ${t('remaining')}`}
                  </span>
                  <span className="text-life-muted tabular-nums">
                    {t('prev_month')}: {formatMoney(prevSpent, currency, maskBalances)} ({pct.toFixed(0)}%)
                  </span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('set_cat_limit')} subtitle={selectedMonth}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label={t('category')} value={category} onChange={(e) => setCategory(e.target.value)}>
            {expenseCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Input
            label={`${t('amount')} (${currency})`}
            type="number"
            step="0.01"
            min="1"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// --- MODULE D: SAVINGS VAULTS & GOALS ---
const SavingsView = ({
  data,
  maskBalances,
  t,
  lang,
  onCreateSavingsGoal,
  onAddContribution,
  onDeleteSavingsGoal,
  accountBalances = {},
}) => {
  const { currency } = data.profile;
  const [sourceAccountId, setSourceAccountId] = useState(data.accounts[0]?.id || '');
  const effectiveAccountId = data.accounts.some((a) => a.id === sourceAccountId)
    ? sourceAccountId
    : data.accounts[0]?.id || '';
  const accountMapLocal = Object.fromEntries(data.accounts.map((a) => [a.id, a]));
  const balanceOf = (id) => (accountBalances[id] ?? Number(accountMapLocal[id]?.initialBalance)) || 0;
  const accountOptions = data.accounts.map((a) => (
    <option key={a.id} value={a.id}>
      {a.name} — {formatMoney(balanceOf(a.id), currency)}
    </option>
  ));
  const noAccountMsg =
    lang === 'id'
      ? 'Belum ada akun. Buat akun di Digital Wallet dulu supaya setoran tercatat.'
      : 'No accounts yet. Create one in Digital Wallet first so deposits are recorded.';
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contribModalGoal, setContribModalGoal] = useState(null);
  const [historyModalGoal, setHistoryModalGoal] = useState(null);

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('2027-06-30');
  const [initialSaved, setInitialSaved] = useState('0');

  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (!name.trim() || !target || target <= 0) return;
    const initial = Math.max(0, parseFloat(initialSaved) || 0);
    if (initial > 0 && !effectiveAccountId) return;
    onCreateSavingsGoal({
      name: name.trim(),
      targetAmount: target,
      targetDate,
      initialSaved: initial,
      accountId: initial > 0 ? effectiveAccountId : undefined,
    });
    setName('');
    setTargetAmount('');
    setInitialSaved('0');
    setShowCreateModal(false);
  };

  const handleContrib = (e) => {
    e.preventDefault();
    const amt = parseFloat(contribAmount);
    if (!contribModalGoal || !amt || amt <= 0 || !effectiveAccountId) return;
    onAddContribution(
      contribModalGoal.id,
      amt,
      contribNote.trim() || (lang === 'id' ? 'Setoran tabungan' : 'Savings deposit'),
      effectiveAccountId
    );
    setContribAmount('');
    setContribNote('');
    setContribModalGoal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{t('savings_title')}</h1>
          <p className="text-xs text-life-muted mt-1">{t('savings_subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" /> {t('new_savings_vault')}
        </Button>
      </div>

      {data.savingsGoals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={lang === 'id' ? 'Belum ada target tabungan' : 'No savings vaults yet'}
          description={
            lang === 'id'
              ? 'Buat brankas tabungan khusus untuk dana darurat, liburan, atau pembelian besar.'
              : 'Create dedicated capital vaults with contribution logs and target dates.'
          }
          actionLabel={t('new_savings_vault')}
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.savingsGoals.map((sg) => {
            const saved = sg.contributions.reduce((s, c) => s + c.amount, 0);
            const pct = sg.targetAmount > 0 ? Math.min(100, (saved / sg.targetAmount) * 100) : 0;
            const rem = Math.max(0, sg.targetAmount - saved);
            const funded = saved >= sg.targetAmount;

            return (
              <GlassCard key={sg.id} className="p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-life-text">{sg.name}</h3>
                      <p className="text-xs text-life-muted mt-0.5">
                        {lang === 'id' ? 'Target' : 'Target'}: {formatDateReadable(sg.targetDate, lang)}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteSavingsGoal(sg)}
                      className="p-1.5 rounded-lg text-life-muted hover:text-[#D96B52]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-1">
                    <div className="flex items-baseline justify-between text-xs mb-1.5 tabular-nums">
                      <span className="text-base font-semibold text-life-soft">
                        {formatMoney(saved, currency, maskBalances)}
                      </span>
                      <span className="text-life-muted">
                        / {formatMoney(sg.targetAmount, currency, maskBalances)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <ProgressBar value={saved} max={sg.targetAmount} tone={funded ? 'success' : 'champagne'} height="h-2.5" />
                  </div>

                  <p className="text-xs text-life-muted">
                    {funded
                      ? t('target_funded')
                      : `${formatMoney(rem, currency, maskBalances)} ${t('remaining_to_target')}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-life-border/35">
                  <Button size="sm" className="flex-1" onClick={() => setContribModalGoal(sg)}>
                    <Plus className="w-3.5 h-3.5" /> {t('contribute')}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setHistoryModalGoal(sg)}>
                    <History className="w-3.5 h-3.5" /> {t('history')} ({sg.contributions.length})
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title={t('new_savings_vault')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label={lang === 'id' ? 'Nama Target Tabungan' : 'Vault Name'}
            placeholder={lang === 'id' ? 'mis. Dana Pendidikan / Rumah Impian' : 'e.g. Education Fund / Dream Home'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={`${lang === 'id' ? 'Target Dana' : 'Target Amount'} (${currency})`}
              type="number"
              step="0.01"
              min="1"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
            <Input
              label={`${lang === 'id' ? 'Saldo Awal' : 'Initial Deposit'} (${currency})`}
              type="number"
              step="0.01"
              min="0"
              value={initialSaved}
              onChange={(e) => setInitialSaved(e.target.value)}
            />
          </div>
          {(parseFloat(initialSaved) || 0) > 0 && (
            <div className="space-y-1.5">
              {data.accounts.length === 0 ? (
                <p className="text-[11px] text-[#F29B87]">{noAccountMsg}</p>
              ) : (
                <>
                  <Select
                    label={lang === 'id' ? 'Ambil dari Akun' : 'Pay from Account'}
                    value={effectiveAccountId}
                    onChange={(e) => setSourceAccountId(e.target.value)}
                  >
                    {accountOptions}
                  </Select>
                  {(parseFloat(initialSaved) || 0) > balanceOf(effectiveAccountId) && (
                    <p className="text-[11px] text-[#F29B87]">
                      {lang === 'id' ? 'Saldo akun ini tidak cukup untuk setoran tersebut.' : 'This account balance is lower than the deposit.'}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
          <Input
            label={lang === 'id' ? 'Target Tanggal Tercapai' : 'Target Date'}
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(contribModalGoal)}
        onClose={() => setContribModalGoal(null)}
        title={`${t('contribute')} — ${contribModalGoal?.name || ''}`}
      >
        <form onSubmit={handleContrib} className="space-y-4">
          <Input
            label={`${t('amount')} (${currency})`}
            type="number"
            step="0.01"
            min="1"
            value={contribAmount}
            onChange={(e) => setContribAmount(e.target.value)}
            required
          />
          {data.accounts.length === 0 ? (
            <p className="text-[11px] text-[#F29B87]">{noAccountMsg}</p>
          ) : (
            <div className="space-y-1.5">
              <Select
                label={lang === 'id' ? 'Ambil dari Akun' : 'Pay from Account'}
                value={effectiveAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
              >
                {accountOptions}
              </Select>
              {(parseFloat(contribAmount) || 0) > balanceOf(effectiveAccountId) && (
                <p className="text-[11px] text-[#F29B87]">
                  {lang === 'id' ? 'Saldo akun ini tidak cukup untuk setoran tersebut.' : 'This account balance is lower than the deposit.'}
                </p>
              )}
            </div>
          )}
          <Input
            label={t('notes')}
            placeholder={lang === 'id' ? 'mis. Setoran gaji bulanan' : 'e.g. Monthly salary deposit'}
            value={contribNote}
            onChange={(e) => setContribNote(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setContribModalGoal(null)}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(historyModalGoal)}
        onClose={() => setHistoryModalGoal(null)}
        title={`${t('history')} — ${historyModalGoal?.name || ''}`}
      >
        <div className="space-y-2.5">
          {(historyModalGoal?.contributions || []).length === 0 ? (
            <p className="text-xs text-life-muted text-center py-6">
              {lang === 'id' ? 'Belum ada riwayat setoran.' : 'No contributions logged yet.'}
            </p>
          ) : (
            [...(historyModalGoal?.contributions || [])].reverse().map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-xl bg-life-bg/80 border border-life-border/40"
              >
                <div>
                  <p className="text-sm font-medium text-life-text">{c.note}</p>
                  <p className="text-xs text-life-muted">
                    {formatDateReadable(c.date, lang)} ·{' '}
                    {c.accountId && accountMapLocal[c.accountId]
                      ? accountMapLocal[c.accountId].name
                      : lang === 'id'
                      ? 'tidak terhubung ke akun'
                      : 'not linked to an account'}
                  </p>
                </div>
                <span className="text-sm font-semibold text-life-soft tabular-nums">
                  +{formatMoney(c.amount, currency, maskBalances)}
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

// --- MODULE: RECURRING BILLS & SUBSCRIPTIONS ---
const SubscriptionsView = ({ data, maskBalances, t, lang, onAddSub, onPaySub, onDeleteSub }) => {
  const { currency } = data.profile;
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('15');
  const [category, setCategory] = useState('Software & Subscriptions');
  const [accountId, setAccountId] = useState(data.accounts[0]?.id || '');

  const subs = data.subscriptions || [];

  const summary = useMemo(() => {
    const monthlyTotal = subs.reduce((s, item) => s + item.amount, 0);
    const paidThisMonth = subs
      .filter((item) => item.lastPaidMonth === CURRENT_MONTH)
      .reduce((s, item) => s + item.amount, 0);
    return {
      monthlyTotal,
      annualized: monthlyTotal * 12,
      paidThisMonth,
    };
  }, [subs]);

  const handleCreate = (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!name.trim() || !amt || amt <= 0) return;
    onAddSub({
      name: name.trim(),
      amount: amt,
      billingCycle: 'Monthly',
      dueDay: Math.min(31, Math.max(1, parseInt(dueDay, 10) || 1)),
      category,
      accountId: accountId || data.accounts[0]?.id,
      lastPaidMonth: '',
    });
    setName('');
    setAmount('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{t('subs_title')}</h1>
          <p className="text-xs text-life-muted mt-1">{t('subs_subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> {t('add_subscription')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <span className="text-xs uppercase tracking-wider text-life-muted">{t('monthly_fixed_burn')}</span>
          <div className="mt-2 text-xl sm:text-2xl font-semibold text-life-text tabular-nums">
            {formatMoney(summary.monthlyTotal, currency, maskBalances)}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <span className="text-xs uppercase tracking-wider text-life-muted">{t('annualized_cost')}</span>
          <div className="mt-2 text-xl sm:text-2xl font-semibold text-life-accent tabular-nums">
            {formatMoney(summary.annualized, currency, maskBalances)}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <span className="text-xs uppercase tracking-wider text-life-muted">{t('paid_this_month')}</span>
          <div className="mt-2 text-xl sm:text-2xl font-semibold text-life-soft tabular-nums">
            {formatMoney(summary.paidThisMonth, currency, maskBalances)}
          </div>
        </GlassCard>
      </div>

      {subs.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title={lang === 'id' ? 'Belum ada tagihan rutin' : 'No recurring bills configured'}
          description={
            lang === 'id'
              ? 'Tambahkan langganan internet, listrik, atau SaaS untuk memantau tanggal jatuh tempo bulanan.'
              : 'Track monthly utilities, insurance, and subscriptions with 1-click ledger logging.'
          }
          actionLabel={t('add_subscription')}
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subs.map((sub) => {
            const isPaid = sub.lastPaidMonth === CURRENT_MONTH;
            return (
              <GlassCard key={sub.id} className="p-5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-life-text truncate">{sub.name}</h3>
                    {isPaid && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5B8056]/25 text-[#87B082] border border-[#5B8056]/40 shrink-0">
                        {t('paid_badge')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-life-muted mt-1">
                    {sub.category} • {t('due_day')} {sub.dueDay}
                  </p>
                  <p className="text-sm font-semibold text-life-soft tabular-nums mt-2">
                    {formatMoney(sub.amount, currency, maskBalances)} / {lang === 'id' ? 'bln' : 'mo'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isPaid && (
                    <Button size="sm" onClick={() => onPaySub(sub)}>
                      {t('pay_and_log')}
                    </Button>
                  )}
                  <button
                    onClick={() => onDeleteSub(sub)}
                    className="p-2 rounded-xl text-life-muted hover:text-[#D96B52] hover:bg-life-surface2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('add_subscription')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label={lang === 'id' ? 'Nama Tagihan / Langganan' : 'Bill / Subscription Name'}
            placeholder={lang === 'id' ? 'mis. Listrik PLN / Netflix / Internet' : 'e.g. Electricity / Netflix / Internet'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={`${t('amount')} (${currency})`}
              type="number"
              step="0.01"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Input
              label={t('due_day')}
              type="number"
              min="1"
              max="31"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label={t('category')} value={category} onChange={(e) => setCategory(e.target.value)}>
              {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <Select
              label={lang === 'id' ? 'Akun Pembayaran' : 'Payment Account'}
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {data.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// --- MODULE: DEBTS, RECEIVABLES & INSTALLMENTS ---
const DebtsView = ({
  data,
  maskBalances,
  t,
  lang,
  onAddDebt,
  onSettleDebtInstallment,
  onDeleteDebt,
  onOpenSplitBillModal,
}) => {
  const { currency } = data.profile;
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [kind, setKind] = useState('debt');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [tenorMonths, setTenorMonths] = useState('6');
  const [dueDate, setDueDate] = useState('2026-12-10');
  const [accountId, setAccountId] = useState(data.accounts[0]?.id || '');

  const debts = data.debts || [];

  const summary = useMemo(() => {
    const totalOwed = debts
      .filter((d) => d.kind === 'debt')
      .reduce((s, d) => s + Math.max(0, d.totalAmount - d.paidAmount), 0);
    const totalReceivable = debts
      .filter((d) => d.kind === 'receivable')
      .reduce((s, d) => s + Math.max(0, d.totalAmount - d.paidAmount), 0);
    const monthlyCommitment = debts
      .filter((d) => d.kind === 'debt' && d.paidAmount < d.totalAmount)
      .reduce((s, d) => s + Math.min(d.monthlyAmount, d.totalAmount - d.paidAmount), 0);
    return { totalOwed, totalReceivable, monthlyCommitment };
  }, [debts]);

  const handleCreate = (e) => {
    e.preventDefault();
    const tot = parseFloat(totalAmount);
    if (!title.trim() || !tot || tot <= 0) return;
    const tenor = Math.max(1, parseInt(tenorMonths, 10) || 1);
    const monthly = parseFloat(monthlyAmount) || Math.round((tot / tenor) * 100) / 100;

    onAddDebt({
      title: title.trim(),
      counterparty: counterparty.trim() || (kind === 'debt' ? 'Lender' : 'Borrower'),
      kind,
      totalAmount: tot,
      paidAmount: Math.min(tot, Math.max(0, parseFloat(paidAmount) || 0)),
      monthlyAmount: monthly,
      tenorMonths: tenor,
      dueDate,
      accountId: accountId || data.accounts[0]?.id,
      notes: '',
    });
    setTitle('');
    setCounterparty('');
    setTotalAmount('');
    setPaidAmount('0');
    setMonthlyAmount('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{t('debts_title')}</h1>
          <p className="text-xs text-life-muted mt-1">{t('debts_subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={onOpenSplitBillModal}>
            <Users className="w-4 h-4 text-life-soft" /> {t('split_bill')}
          </Button>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> {t('add_debt')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <span className="text-xs uppercase tracking-wider text-life-muted">{t('total_debt_owed')}</span>
          <div className="mt-2 text-xl sm:text-2xl font-semibold text-[#D96B52] tabular-nums">
            {formatMoney(summary.totalOwed, currency, maskBalances)}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <span className="text-xs uppercase tracking-wider text-life-muted">{t('total_receivable')}</span>
          <div className="mt-2 text-xl sm:text-2xl font-semibold text-life-soft tabular-nums">
            {formatMoney(summary.totalReceivable, currency, maskBalances)}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <span className="text-xs uppercase tracking-wider text-life-muted">{t('monthly_installments')}</span>
          <div className="mt-2 text-xl sm:text-2xl font-semibold text-life-accent tabular-nums">
            {formatMoney(summary.monthlyCommitment, currency, maskBalances)}
          </div>
        </GlassCard>
      </div>

      {debts.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={lang === 'id' ? 'Belum ada catatan utang atau piutang' : 'No debts or receivables recorded'}
          description={
            lang === 'id'
              ? 'Catat cicilan kartu kredit, pinjaman, atau piutang teman agar arus kas lebih terukur.'
              : 'Track installment loans or money owed to you and settle directly through your wallet.'
          }
          actionLabel={t('add_debt')}
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debts.map((item) => {
            const remaining = Math.max(0, item.totalAmount - item.paidAmount);
            const pct = item.totalAmount > 0 ? Math.min(100, (item.paidAmount / item.totalAmount) * 100) : 0;
            const isSettled = remaining <= 0;
            const nextStepAmount = Math.min(item.monthlyAmount, remaining);
            const isDebt = item.kind === 'debt';

            return (
              <GlassCard key={item.id} className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          isDebt
                            ? 'bg-[#D96B52]/15 text-[#F29B87] border-[#D96B52]/40'
                            : 'bg-life-accent/20 text-life-soft border-life-accent/40'
                        }`}
                      >
                        {isDebt ? t('debt_type_owe') : t('debt_type_receivable')}
                      </span>
                      <h3 className="text-base font-semibold text-life-text mt-2">{item.title}</h3>
                      <p className="text-xs text-life-muted">
                        {item.counterparty} • {lang === 'id' ? 'Jatuh tempo' : 'Due'}: {formatDateReadable(item.dueDate, lang)}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteDebt(item)}
                      className="p-1.5 rounded-lg text-life-muted hover:text-[#D96B52]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex flex-wrap justify-between gap-1 text-xs tabular-nums">
                      <span className="text-life-muted">
                        {lang === 'id' ? 'Terbayar' : 'Settled'}:{' '}
                        <strong className="text-life-text">
                          {formatMoney(item.paidAmount, currency, maskBalances)}
                        </strong>{' '}
                        / {formatMoney(item.totalAmount, currency, maskBalances)}
                      </span>
                      <span className="text-life-soft font-semibold">{pct.toFixed(0)}%</span>
                    </div>
                    <ProgressBar
                      value={item.paidAmount}
                      max={item.totalAmount}
                      tone={isSettled ? 'success' : isDebt ? 'danger' : 'champagne'}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-life-border/35">
                  <div className="text-xs text-life-muted tabular-nums">
                    {lang === 'id' ? 'Sisa' : 'Remaining'}:{' '}
                    <strong className="text-life-text">
                      {formatMoney(remaining, currency, maskBalances)}
                    </strong>
                  </div>
                  {isSettled ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#87B082]">
                      <CheckCircle2 className="w-4 h-4" /> {lang === 'id' ? 'Lunas' : 'Settled'}
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => onSettleDebtInstallment(item, nextStepAmount)}>
                      <Wallet className="w-3.5 h-3.5" />
                      {isDebt ? t('pay_installment') : t('receive_payment')} (
                      {formatMoney(nextStepAmount, currency, maskBalances)})
                    </Button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('add_debt')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-life-bg border border-life-border/50">
            {[
              { id: 'debt', label: t('debt_type_owe') },
              { id: 'receivable', label: t('debt_type_receivable') },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setKind(opt.id)}
                className={`py-2 rounded-lg text-xs font-semibold ${
                  kind === opt.id ? 'bg-life-accent text-life-bg' : 'text-life-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Input
            label={lang === 'id' ? 'Judul Utang / Piutang' : 'Title'}
            placeholder={lang === 'id' ? 'mis. Cicilan Laptop / Pinjaman Budi' : 'e.g. Laptop Installment / Loan from Jane'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label={lang === 'id' ? 'Pihak Terkait (Bank / Nama)' : 'Counterparty'}
            placeholder={lang === 'id' ? 'mis. BCA PayLater / Budi Santoso' : 'e.g. PayLater / Jane Smith'}
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={`${lang === 'id' ? 'Total Nominal' : 'Total Amount'} (${currency})`}
              type="number"
              step="0.01"
              min="1"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              required
            />
            <Input
              label={`${lang === 'id' ? 'Sudah Dibayar' : 'Already Paid'} (${currency})`}
              type="number"
              step="0.01"
              min="0"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label={t('tenor_months')}
              type="number"
              min="1"
              value={tenorMonths}
              onChange={(e) => setTenorMonths(e.target.value)}
            />
            <Input
              label={`${lang === 'id' ? 'Cicilan / Bln' : 'Monthly'} (${currency})`}
              type="number"
              step="0.01"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(e.target.value)}
            />
            <Input
              label={t('date')}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <Select
            label={lang === 'id' ? 'Akun Dompet Terkait' : 'Wallet Account'}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {data.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// --- MODULE: INVESTMENT PORTFOLIO ---
const InvestmentsView = ({
  data,
  maskBalances,
  t,
  lang,
  onAddInvestment,
  onUpdateInvestmentValue,
  onDeleteInvestment,
}) => {
  const { currency } = data.profile;
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [updatedMarketVal, setUpdatedMarketVal] = useState('');

  const [name, setName] = useState('');
  const [assetClass, setAssetClass] = useState('Gold');
  const [quantity, setQuantity] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');

  const holdings = data.investments || [];

  const summary = useMemo(() => {
    const totalCurrent = holdings.reduce((s, item) => s + (Number(item.currentValue) || 0), 0);
    const totalInvested = holdings.reduce((s, item) => s + (Number(item.investedAmount) || 0), 0);
    const pnl = totalCurrent - totalInvested;
    const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
    return { totalCurrent, totalInvested, pnl, pnlPct };
  }, [holdings]);

  const handleCreate = (e) => {
    e.preventDefault();
    const invAmt = parseFloat(investedAmount) || 0;
    const curVal = parseFloat(currentValue) || invAmt;
    if (!name.trim() || curVal < 0) return;

    onAddInvestment({
      name: name.trim(),
      assetClass,
      quantity: quantity.trim() || '1 Unit',
      investedAmount: invAmt,
      currentValue: curVal,
      updatedAt: TODAY_STR,
      accountId: sourceAccountId || undefined,
    });
    setSourceAccountId('');
    setName('');
    setQuantity('');
    setInvestedAmount('');
    setCurrentValue('');
    setShowAddModal(false);
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(updatedMarketVal);
    if (!editingAsset || Number.isNaN(val) || val < 0) return;
    onUpdateInvestmentValue(editingAsset.id, val);
    setEditingAsset(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{t('inv_title')}</h1>
          <p className="text-xs text-life-muted mt-1">{t('inv_subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4" /> {t('add_investment')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <span className="text-xs uppercase tracking-wider text-life-muted">{t('inv_current_value')}</span>
          <div className="mt-2 text-xl sm:text-2xl font-semibold text-life-soft tabular-nums">
            {formatMoney(summary.totalCurrent, currency, maskBalances)}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <span className="text-xs uppercase tracking-wider text-life-muted">{t('inv_invested_capital')}</span>
          <div className="mt-2 text-xl sm:text-2xl font-semibold text-life-text tabular-nums">
            {formatMoney(summary.totalInvested, currency, maskBalances)}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <span className="text-xs uppercase tracking-wider text-life-muted">{t('inv_unrealized_pnl')}</span>
          <div
            className={`mt-2 text-xl sm:text-2xl font-semibold tabular-nums ${
              summary.pnl >= 0 ? 'text-[#87B082]' : 'text-[#D96B52]'
            }`}
          >
            {summary.pnl >= 0 ? '+' : ''}
            {formatMoney(summary.pnl, currency, maskBalances)}{' '}
            <span className="text-xs font-normal">
              ({summary.pnl >= 0 ? '+' : ''}
              {summary.pnlPct.toFixed(1)}%)
            </span>
          </div>
        </GlassCard>
      </div>

      {holdings.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={lang === 'id' ? 'Belum ada aset investasi tercatat' : 'No investment assets yet'}
          description={
            lang === 'id'
              ? 'Catat kepemilikan emas, reksadana, atau saham Anda agar terhitung dalam Total Kekayaan Bersih.'
              : 'Record gold, mutual funds, or equity positions to track portfolio performance.'
          }
          actionLabel={t('add_investment')}
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {holdings.map((asset) => {
            const gain = asset.currentValue - asset.investedAmount;
            const gainPct = asset.investedAmount > 0 ? (gain / asset.investedAmount) * 100 : 0;
            return (
              <GlassCard key={asset.id} className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-life-surface2 text-life-soft border border-life-border/50">
                      {asset.assetClass} • {asset.quantity}
                    </span>
                    <button
                      onClick={() => onDeleteInvestment(asset)}
                      className="p-1.5 rounded-lg text-life-muted hover:text-[#D96B52]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-base font-semibold text-life-text mt-2">{asset.name}</h3>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-life-muted">{t('inv_current_value')}</span>
                      <span className="text-sm font-semibold text-life-text tabular-nums">
                        {formatMoney(asset.currentValue, currency, maskBalances)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-life-muted">{t('inv_invested_capital')}</span>
                      <span className="text-life-muted tabular-nums">
                        {formatMoney(asset.investedAmount, currency, maskBalances)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs pt-1">
                      <span className="text-life-muted">{lang === 'id' ? 'Imbal hasil' : 'Return'}</span>
                      <span
                        className={`font-semibold tabular-nums ${
                          gain >= 0 ? 'text-[#87B082]' : 'text-[#D96B52]'
                        }`}
                      >
                        {gain >= 0 ? '+' : ''}
                        {formatMoney(gain, currency, maskBalances)} ({gain >= 0 ? '+' : ''}
                        {gainPct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-life-border/35 flex items-center justify-between">
                  <span className="text-[11px] text-life-muted">
                    {formatDateReadable(asset.updatedAt, lang)}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingAsset(asset);
                      setUpdatedMarketVal(String(asset.currentValue));
                    }}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> {t('update_market_val')}
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={t('add_investment')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label={lang === 'id' ? 'Nama Aset Investasi' : 'Asset Name'}
            placeholder={lang === 'id' ? 'mis. Emas Antam / Reksadana RDPU / Saham BBCA' : 'e.g. Gold Bar / Index Fund / Blue-Chip Stock'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label={lang === 'id' ? 'Kelas Aset' : 'Asset Class'}
              value={assetClass}
              onChange={(e) => setAssetClass(e.target.value)}
            >
              <option value="Gold">{enumLabel('assetClass', 'Gold', lang)}</option>
              <option value="Mutual Fund">{enumLabel('assetClass', 'Mutual Fund', lang)}</option>
              <option value="Stocks">{enumLabel('assetClass', 'Stocks', lang)}</option>
              <option value="Bonds">{enumLabel('assetClass', 'Bonds', lang)}</option>
              <option value="Other">{enumLabel('assetClass', 'Other', lang)}</option>
            </Select>
            <Input
              label={lang === 'id' ? 'Jumlah / Unit / Gram' : 'Quantity / Units'}
              placeholder={lang === 'id' ? 'mis. 10 gr / 5 Lot' : 'e.g. 10 g / 5 Lots'}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={`${t('inv_invested_capital')} (${currency})`}
              type="number"
              step="0.01"
              min="0"
              value={investedAmount}
              onChange={(e) => setInvestedAmount(e.target.value)}
              required
            />
            <Input
              label={`${t('inv_current_value')} (${currency})`}
              type="number"
              step="0.01"
              min="0"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              required
            />
          </div>
          <Select
            label={lang === 'id' ? 'Dibayar dari Akun' : 'Paid from Account'}
            value={sourceAccountId}
            onChange={(e) => setSourceAccountId(e.target.value)}
          >
            <option value="">
              {lang === 'id' ? 'Aset yang sudah dimiliki (tidak memotong saldo)' : 'Already owned (does not debit an account)'}
            </option>
            {data.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(editingAsset)}
        onClose={() => setEditingAsset(null)}
        title={`${t('update_market_val')} — ${editingAsset?.name || ''}`}
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <Input
            label={`${t('inv_current_value')} (${currency})`}
            type="number"
            step="0.01"
            min="0"
            value={updatedMarketVal}
            onChange={(e) => setUpdatedMarketVal(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditingAsset(null)}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// --- MODULE E: DAILY, WEEKLY & MONTHLY PLANNER (WITH FOCUS TIMER & WELLNESS TELEMETRY) ---
const PlannerView = ({
  data,
  t,
  lang,
  onToggleTask,
  onToggleTopPriority,
  onOpenTaskModal,
  onOpenEventModal,
  onSaveWellnessLog,
}) => {
  const [horizon, setHorizon] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(TODAY_STR);

  const [focusDuration, setFocusDuration] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(2);

  // Wellness Telemetry State synced with selectedDate
  const existingWellness = useMemo(
    () => (data.wellnessLogs || []).find((w) => w.date === selectedDate),
    [data.wellnessLogs, selectedDate]
  );

  const [sleepHours, setSleepHours] = useState('7.5');
  const [waterGlasses, setWaterGlasses] = useState(7);
  const [weightKg, setWeightKg] = useState('71.0');
  const [energyScore, setEnergyScore] = useState(8);

  useEffect(() => {
    if (existingWellness) {
      setSleepHours(String(existingWellness.sleepHours ?? 7.5));
      setWaterGlasses(existingWellness.waterGlasses ?? 7);
      setWeightKg(String(existingWellness.weightKg ?? 71.0));
      setEnergyScore(existingWellness.energyScore ?? 8);
    } else {
      setSleepHours('7.0');
      setWaterGlasses(6);
      setWeightKg('71.0');
      setEnergyScore(7);
    }
  }, [existingWellness, selectedDate]);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          setSessionsCompleted((s) => s + 1);
          return focusDuration * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, focusDuration]);

  const selectPreset = (mins) => {
    setTimerRunning(false);
    setFocusDuration(mins);
    setSecondsLeft(mins * 60);
  };

  const formattedClock = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(
    secondsLeft % 60
  ).padStart(2, '0')}`;

  const weekDays = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const base = new Date(y, m - 1, d);
    const dayOfWeek = base.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(base);
    monday.setDate(base.getDate() + mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(monday);
      dt.setDate(monday.getDate() + i);
      const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
        dt.getDate()
      ).padStart(2, '0')}`;
      return {
        dateStr: iso,
        weekday: dt.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' }),
        dayNum: dt.getDate(),
      };
    });
  }, [selectedDate, lang]);

  const dayTasks = useMemo(
    () => data.tasks.filter((tk) => tk.dueDate === selectedDate),
    [data.tasks, selectedDate]
  );
  const topPriorities = useMemo(
    () => data.tasks.filter((tk) => tk.isTopPriority && tk.status !== 'completed').slice(0, 3),
    [data.tasks]
  );
  const dayEvents = useMemo(
    () =>
      data.events
        .filter((e) => e.date === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [data.events, selectedDate]
  );

  const dayCompletionPct = useMemo(() => {
    if (!dayTasks.length) return 0;
    const done = dayTasks.filter((tk) => tk.status === 'completed').length;
    return (done / dayTasks.length) * 100;
  }, [dayTasks]);

  const handleWellnessSubmit = (e) => {
    e.preventDefault();
    onSaveWellnessLog({
      date: selectedDate,
      sleepHours: Math.max(0, Math.min(24, parseFloat(sleepHours) || 0)),
      waterGlasses: Math.max(0, Math.min(20, Number(waterGlasses) || 0)),
      weightKg: Math.max(0, parseFloat(weightKg) || 0),
      energyScore: Math.max(1, Math.min(10, Number(energyScore) || 5)),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{t('planner_title')}</h1>
          <p className="text-xs text-life-muted mt-1">{t('planner_subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-life-surface p-1 border border-life-border/50">
            {[
              { id: 'daily', label: t('mode_daily') },
              { id: 'weekly', label: t('mode_weekly') },
              { id: 'monthly', label: t('mode_monthly') },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setHorizon(mode.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  horizon === mode.id
                    ? 'bg-life-accent text-life-bg'
                    : 'text-life-muted hover:text-life-text'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl bg-life-surface border border-life-border/60 px-3 py-2 text-xs text-life-text"
          />
        </div>
      </div>

      {/* 7-Day Selector Strip */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDays.map((wd) => {
          const active = wd.dateStr === selectedDate;
          const count =
            data.tasks.filter((tk) => tk.dueDate === wd.dateStr).length +
            data.events.filter((e) => e.date === wd.dateStr).length;
          return (
            <button
              key={wd.dateStr}
              onClick={() => setSelectedDate(wd.dateStr)}
              className={`p-2 sm:p-3 rounded-2xl border text-center transition-all ${
                active
                  ? 'bg-gradient-to-b from-life-surface2 to-life-surface border-life-accent text-life-text'
                  : 'bg-life-surface/60 border-life-border/35 text-life-muted hover:border-life-border'
              }`}
            >
              <div className="text-[10px] sm:text-[11px] uppercase truncate">{wd.weekday}</div>
              <div className="text-sm sm:text-lg font-semibold mt-0.5 text-life-text">{wd.dayNum}</div>
              <div className="text-[10px] text-life-accent mt-1">{count}</div>
            </button>
          );
        })}
      </div>

      {horizon === 'daily' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            {/* Focus Timer Card */}
            <GlassCard className="p-5 space-y-4 bg-gradient-to-br from-life-surface2 to-life-bg">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-life-text">{t('focus_timer_title')}</h2>
                  <p className="text-xs text-life-muted">
                    {sessionsCompleted} {t('focus_sessions_done')}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {[25, 50].map((m) => (
                    <button
                      key={m}
                      onClick={() => selectPreset(m)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium ${
                        focusDuration === m
                          ? 'bg-life-accent text-life-bg'
                          : 'bg-life-bg text-life-muted'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center py-3 rounded-2xl bg-life-bg/90 border border-life-border/40">
                <div className="text-3xl sm:text-4xl font-bold tracking-wider text-life-soft tabular-nums font-mono">
                  {formattedClock}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setTimerRunning((prev) => !prev)}
                >
                  {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {timerRunning
                    ? lang === 'id'
                      ? 'Jeda'
                      : 'Pause'
                    : lang === 'id'
                    ? 'Mulai Fokus'
                    : 'Start Focus'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setTimerRunning(false);
                    setSecondsLeft(focusDuration * 60);
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </GlassCard>

            {/* NEW MODULE #4: WELLNESS, SLEEP & HYDRATION TELEMETRY WIDGET */}
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-life-text flex items-center gap-2">
                    <Activity className="w-4 h-4 text-life-accent" />
                    <span>{t('wellness_title')}</span>
                  </h2>
                  <p className="text-xs text-life-muted mt-0.5">{t('wellness_sub')}</p>
                </div>
              </div>

              <form onSubmit={handleWellnessSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-life-bg/80 border border-life-border/40 space-y-1">
                    <label className="text-[11px] text-life-muted flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-life-soft" /> {t('sleep_hours')}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(e.target.value)}
                      className="w-full bg-transparent text-base font-semibold text-life-text focus:outline-none tabular-nums"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-life-bg/80 border border-life-border/40 space-y-1">
                    <label className="text-[11px] text-life-muted flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-life-accent" /> {t('body_weight')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="20"
                      max="250"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="w-full bg-transparent text-base font-semibold text-life-text focus:outline-none tabular-nums"
                    />
                  </div>
                </div>

                {/* Hydration Interactive Glasses */}
                <div className="p-3 rounded-xl bg-life-bg/80 border border-life-border/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-life-muted flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-life-soft" /> {t('water_glasses')}
                    </span>
                    <span className="font-semibold text-life-soft tabular-nums">{waterGlasses} / 8</span>
                  </div>
                  <div className="grid grid-cols-8 gap-1.5">
                    {Array.from({ length: 8 }, (_, idx) => {
                      const filled = idx < waterGlasses;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setWaterGlasses(idx + 1)}
                          className={`h-7 rounded-lg flex items-center justify-center transition-all ${
                            filled
                              ? 'bg-life-accent text-life-bg'
                              : 'bg-life-surface border border-life-border/45 text-life-muted/50'
                          }`}
                          aria-label={`Water glass ${idx + 1}`}
                        >
                          <Droplets className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Energy Score Selector (1 - 10) */}
                <div className="p-3 rounded-xl bg-life-bg/80 border border-life-border/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-life-muted">{t('energy_score')}</span>
                    <span className="font-semibold text-life-soft tabular-nums">{energyScore} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={energyScore}
                    onChange={(e) => setEnergyScore(Number(e.target.value))}
                    className="w-full accent-life-accent cursor-pointer"
                  />
                </div>

                <Button type="submit" size="sm" variant="secondary" className="w-full">
                  <Check className="w-3.5 h-3.5 text-life-accent" /> {t('save_wellness')}
                </Button>
              </form>
            </GlassCard>

            {/* Top 3 Priorities */}
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-life-text">{t('top_3_priorities')}</h2>
                  <p className="text-xs text-life-muted">{t('high_leverage_sub')}</p>
                </div>
                <Award className="w-5 h-5 text-life-accent" />
              </div>
              {topPriorities.length === 0 ? (
                <p className="text-xs text-life-muted">
                  {lang === 'id'
                    ? 'Sematkan hingga 3 tugas prioritas utama di bawah.'
                    : 'Pin up to 3 tasks as Top Priority below.'}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {topPriorities.map((tp, idx) => (
                    <div
                      key={tp.id}
                      className="p-3 rounded-xl bg-gradient-to-r from-life-surface2 to-life-surface border border-life-accent/45 flex items-center gap-3"
                    >
                      <span className="w-6 h-6 rounded-lg bg-life-accent text-life-bg text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-life-text flex-1 truncate">{tp.title}</span>
                      <button
                        onClick={() => onToggleTask(tp.id)}
                        className="p-1.5 rounded-lg bg-life-bg/70 text-life-soft hover:bg-life-accent hover:text-life-bg shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Right 2 Columns: Timeline + Daily Tasks */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-life-text">{t('daily_timeline')}</h2>
                  <p className="text-xs text-life-muted">{formatDateReadable(selectedDate, lang)}</p>
                </div>
                <Button size="sm" onClick={() => onOpenEventModal(null, selectedDate)}>
                  <Plus className="w-4 h-4" /> {t('add_time_block')}
                </Button>
              </div>

              {dayEvents.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title={lang === 'id' ? 'Jadwal masih kosong' : 'Open schedule block'}
                  description={
                    lang === 'id'
                      ? 'Tambahkan sesi kerja fokus, rapat, atau rutinitas pribadi untuk menata hari Anda.'
                      : 'Add deep work sessions, meetings, or personal rituals to structure your day.'
                  }
                  actionLabel={t('add_time_block')}
                  onAction={() => onOpenEventModal(null, selectedDate)}
                />
              ) : (
                <div className="space-y-3">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => onOpenEventModal(ev)}
                      className="cursor-pointer p-4 rounded-2xl bg-life-bg/80 border border-life-border/45 hover:border-life-accent/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                        <div className="px-3 py-1.5 rounded-xl bg-life-surface2 border border-life-border/50 text-xs font-semibold text-life-soft tabular-nums shrink-0">
                          {ev.startTime} – {ev.endTime}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-life-text">{ev.title}</h3>
                          {ev.notes && <p className="text-xs text-life-muted mt-1">{ev.notes}</p>}
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-life-surface border border-life-border/40 text-life-accent self-start sm:self-center shrink-0">
                        {ev.location || ev.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-life-text">
                    {t('nav_tasks')} — {formatDateReadable(selectedDate, lang)}
                  </h2>
                  <p className="text-xs text-life-muted">
                    {dayCompletionPct.toFixed(0)}% {t('completed_count')}
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => onOpenTaskModal(null, selectedDate)}>
                  <Plus className="w-3.5 h-3.5" /> {t('btn_task')}
                </Button>
              </div>
              <ProgressBar value={dayCompletionPct} max={100} />
              {dayTasks.length === 0 ? (
                <p className="text-xs text-life-muted py-4 text-center">
                  {lang === 'id' ? 'Tidak ada tugas jatuh tempo tanggal ini.' : 'No tasks due on this date.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {dayTasks.map((tk) => (
                    <div
                      key={tk.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-life-bg/75 border border-life-border/35"
                    >
                      <button
                        onClick={() => onToggleTask(tk.id)}
                        className="flex items-center gap-2.5 text-left min-w-0 flex-1"
                      >
                        {tk.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-life-accent shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-life-muted shrink-0" />
                        )}
                        <span
                          className={`text-sm truncate ${
                            tk.status === 'completed' ? 'line-through text-life-muted' : 'text-life-text'
                          }`}
                        >
                          {tk.title}
                        </span>
                      </button>
                      <button
                        onClick={() => onToggleTopPriority(tk.id)}
                        className={`p-1.5 rounded-lg ml-2 shrink-0 ${
                          tk.isTopPriority ? 'text-life-accent' : 'text-life-muted/40 hover:text-life-muted'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}

      {horizon === 'weekly' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {weekDays.map((wd) => {
            const wTasks = data.tasks.filter((tk) => tk.dueDate === wd.dateStr);
            const wEvents = data.events.filter((e) => e.date === wd.dateStr);
            return (
              <GlassCard key={wd.dateStr} className="p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-life-border/30 pb-2">
                  <span className="text-sm font-semibold text-life-text">
                    {wd.weekday} {wd.dayNum}
                  </span>
                  <span className="text-xs text-life-accent">{wEvents.length + wTasks.length}</span>
                </div>
                <div className="space-y-2 min-h-[110px]">
                  {wEvents.map((e) => (
                    <div key={e.id} className="p-2 rounded-lg bg-life-surface2/80 text-xs text-life-soft">
                      <span className="font-semibold">{e.startTime}</span> {e.title}
                    </div>
                  ))}
                  {wTasks.map((tk) => (
                    <div
                      key={tk.id}
                      onClick={() => onToggleTask(tk.id)}
                      className="cursor-pointer p-2 rounded-lg bg-life-bg/80 text-xs text-life-text flex items-center gap-2"
                    >
                      {tk.status === 'completed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-life-accent shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-life-muted shrink-0" />
                      )}
                      <span className={tk.status === 'completed' ? 'line-through text-life-muted' : ''}>
                        {tk.title}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {horizon === 'monthly' && (
        <GlassCard className="p-5 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-life-text">
            {t('mode_monthly')} ({selectedDate.slice(0, 7)})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <h3 className="text-xs uppercase tracking-wider text-life-accent font-semibold">
                {t('task_deadlines')}
              </h3>
              {data.tasks
                .filter((tk) => tk.dueDate.startsWith(selectedDate.slice(0, 7)))
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .map((tk) => (
                  <div
                    key={tk.id}
                    className="p-3 rounded-xl bg-life-bg/80 border border-life-border/40 flex items-center justify-between gap-2"
                  >
                    <span className="text-sm text-life-text truncate">{tk.title}</span>
                    <span className="text-xs text-life-muted shrink-0">{formatDateReadable(tk.dueDate, lang)}</span>
                  </div>
                ))}
            </div>
            <div className="space-y-2.5">
              <h3 className="text-xs uppercase tracking-wider text-life-soft font-semibold">
                {t('daily_agenda')}
              </h3>
              {data.events
                .filter((e) => e.date.startsWith(selectedDate.slice(0, 7)))
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((e) => (
                  <div
                    key={e.id}
                    className="p-3 rounded-xl bg-life-bg/80 border border-life-border/40 flex items-center justify-between gap-2"
                  >
                    <span className="text-sm text-life-text truncate">{e.title}</span>
                    <span className="text-xs text-life-accent shrink-0">
                      {formatDateReadable(e.date, lang)} • {e.startTime}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

// --- MODULE F: TASK MANAGEMENT ---
const TasksView = ({ data, t, lang, onOpenTaskModal, onToggleTask, onUpdateTaskStatus, onDeleteTask }) => {
  const [viewMode, setViewMode] = useState('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredTasks = useMemo(() => {
    return data.tasks.filter((tk) => {
      if (statusFilter !== 'all' && tk.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && tk.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && tk.category !== categoryFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !tk.title.toLowerCase().includes(q) &&
          !(tk.description || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [data.tasks, statusFilter, priorityFilter, categoryFilter, search]);

  const statusColumns = [
    { key: 'todo', label: t('todo') },
    { key: 'in_progress', label: t('in_progress') },
    { key: 'completed', label: t('completed') },
  ];

  const priorityTone = {
    Urgent: 'bg-[#D96B52]/20 text-[#F29B87] border-[#D96B52]/40',
    High: 'bg-life-accent/25 text-life-soft border-life-accent/50',
    Medium: 'bg-life-surface2 text-life-soft border-life-border/50',
    Low: 'bg-life-bg text-life-muted border-life-border/40',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{t('tasks_title')}</h1>
          <p className="text-xs text-life-muted mt-1">{t('tasks_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-xl bg-life-surface p-1 border border-life-border/50">
            <button
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                viewMode === 'list' ? 'bg-life-accent text-life-bg' : 'text-life-muted'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" /> {t('view_list')}
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                viewMode === 'board' ? 'bg-life-accent text-life-bg' : 'text-life-muted'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> {t('view_board')}
            </button>
          </div>
          <Button size="sm" onClick={() => onOpenTaskModal()}>
            <Plus className="w-4 h-4" /> {t('new_task')}
          </Button>
        </div>
      </div>

      <GlassCard className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-life-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full rounded-xl bg-life-bg border border-life-border/55 pl-10 pr-4 py-2 text-sm text-life-text"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-life-bg border border-life-border/55 px-3 py-2 text-xs text-life-text"
          >
            <option value="all">{t('status')}: {lang === 'id' ? 'Semua' : 'All'}</option>
            <option value="todo">{t('todo')}</option>
            <option value="in_progress">{t('in_progress')}</option>
            <option value="completed">{t('completed')}</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl bg-life-bg border border-life-border/55 px-3 py-2 text-xs text-life-text"
          >
            <option value="all">{t('priority')}: {lang === 'id' ? 'Semua' : 'All'}</option>
            <option value="Urgent">{enumLabel('priority', 'Urgent', lang)}</option>
            <option value="High">{enumLabel('priority', 'High', lang)}</option>
            <option value="Medium">{enumLabel('priority', 'Medium', lang)}</option>
            <option value="Low">{enumLabel('priority', 'Low', lang)}</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl bg-life-bg border border-life-border/55 px-3 py-2 text-xs text-life-text"
          >
            <option value="all">{t('all_categories')}</option>
            <option value="Work">{enumLabel('taskCategory', 'Work', lang)}</option>
            <option value="Finance">{enumLabel('taskCategory', 'Finance', lang)}</option>
            <option value="Health">{enumLabel('taskCategory', 'Health', lang)}</option>
            <option value="Personal">{enumLabel('taskCategory', 'Personal', lang)}</option>
            <option value="Learning">{enumLabel('taskCategory', 'Learning', lang)}</option>
          </select>
        </div>
      </GlassCard>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={lang === 'id' ? 'Tidak ada tugas ditemukan' : 'No tasks match your filter'}
          description={
            lang === 'id'
              ? 'Buat tugas baru atau bersihkan filter pencarian aktif.'
              : 'Create a new action item or clear your active filters.'
          }
          actionLabel={t('new_task')}
          onAction={() => onOpenTaskModal()}
        />
      ) : viewMode === 'list' ? (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => (
            <GlassCard
              key={task.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  onClick={() => onToggleTask(task.id)}
                  className="mt-0.5 text-life-accent hover:text-life-soft shrink-0"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      task.status === 'completed' ? 'line-through text-life-muted' : 'text-life-text'
                    }`}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-life-muted mt-0.5">{task.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md border ${
                        priorityTone[task.priority] || priorityTone.Medium
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-life-bg text-life-muted">
                      {task.category}
                    </span>
                    <span className="text-[11px] text-life-muted">
                      {formatDateReadable(task.dueDate, lang)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <select
                  value={task.status}
                  onChange={(e) => onUpdateTaskStatus(task.id, e.target.value)}
                  className="rounded-xl bg-life-bg border border-life-border/55 px-2.5 py-1.5 text-xs text-life-soft"
                >
                  <option value="todo">{t('todo')}</option>
                  <option value="in_progress">{t('in_progress')}</option>
                  <option value="completed">{t('completed')}</option>
                </select>
                <button
                  onClick={() => onOpenTaskModal(task)}
                  className="p-1.5 rounded-lg text-life-muted hover:text-life-soft hover:bg-life-surface2"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteTask(task)}
                  className="p-1.5 rounded-lg text-life-muted hover:text-[#D96B52] hover:bg-life-surface2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {statusColumns.map((col) => {
            const colTasks = filteredTasks.filter((tk) => tk.status === col.key);
            return (
              <GlassCard key={col.key} className="p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-life-border/35 pb-2.5">
                  <h3 className="text-sm font-semibold text-life-text">{col.label}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-life-surface2 text-life-soft">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-life-bg/85 border border-life-border/45 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-life-text">{task.title}</p>
                        <button
                          onClick={() => onOpenTaskModal(task)}
                          className="text-life-muted hover:text-life-soft shrink-0"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`px-2 py-0.5 rounded border ${priorityTone[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className="text-life-muted">{formatDateReadable(task.dueDate, lang)}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {statusColumns
                          .filter((s) => s.key !== task.status)
                          .map((target) => (
                            <button
                              key={target.key}
                              onClick={() => onUpdateTaskStatus(task.id, target.key)}
                              className="text-[10px] px-2 py-1 rounded-lg bg-life-surface hover:bg-life-surface2 text-life-soft border border-life-border/40"
                            >
                              → {target.label}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- MODULE G: CALENDAR ---
const CalendarView = ({ data, t, lang, onOpenEventModal, onDeleteEvent, onNavigate, maskBalances }) => {
  const [cursorMonth, setCursorMonth] = useState(CURRENT_MONTH);
  const [selectedDay, setSelectedDay] = useState(TODAY_STR);
  const dueMap = useMemo(() => dueItemsForMonth(data, cursorMonth), [data, cursorMonth]);

  const calendarCells = useMemo(() => {
    const [y, m] = cursorMonth.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const cells = [];

    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateStr: iso });
    }
    return cells;
  }, [cursorMonth]);

  const shiftMonth = (delta) => {
    const [y, m] = cursorMonth.split('-').map(Number);
    const dt = new Date(y, m - 1 + delta, 1);
    setCursorMonth(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthLabel = useMemo(() => {
    const [y, m] = cursorMonth.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [cursorMonth, lang]);

  const selectedEvents = data.events
    .filter((e) => e.date === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const selectedDeadlines = data.tasks.filter((tk) => tk.dueDate === selectedDay);

  const selectedBirthdays = (data.contacts || []).filter(
    (c) => c.birthday && c.birthday.slice(5) === selectedDay.slice(5)
  );

  const weekdays =
    lang === 'id'
      ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{t('calendar_title')}</h1>
          <p className="text-xs text-life-muted mt-1">{t('calendar_subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => shiftMonth(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-2 text-sm font-semibold text-life-text min-w-[130px] text-center">
            {monthLabel}
          </span>
          <Button variant="secondary" size="sm" onClick={() => shiftMonth(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => onOpenEventModal(null, selectedDay)}>
            <Plus className="w-4 h-4" /> {t('new_event')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="p-3 sm:p-5 lg:col-span-2">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-[11px] uppercase tracking-wider text-life-muted mb-2">
            {weekdays.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarCells.map((cell, idx) => {
              if (!cell)
                return <div key={`empty-${idx}`} className="h-14 sm:h-24 rounded-xl bg-life-bg/30" />;
              const dayEvents = data.events.filter((e) => e.date === cell.dateStr);
              const dayTasks = data.tasks.filter((tk) => tk.dueDate === cell.dateStr);
              const dayBdays = (data.contacts || []).filter(
                (c) => c.birthday && c.birthday.slice(5) === cell.dateStr.slice(5)
              );
              const dayDue = dueMap[cell.dateStr] || [];
              const isSelected = cell.dateStr === selectedDay;
              const isToday = cell.dateStr === TODAY_STR;

              return (
                <button
                  key={cell.dateStr}
                  onClick={() => setSelectedDay(cell.dateStr)}
                  className={`h-14 sm:h-24 p-1.5 sm:p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-life-surface2 border-life-accent'
                      : 'bg-life-bg/70 border-life-border/30 hover:border-life-border'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-life-accent text-life-bg' : 'text-life-text'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {dayBdays.length > 0 && <Cake className="w-3 h-3 text-life-soft" />}
                  </div>
                  <div className="flex sm:hidden gap-1">
                    {dayEvents.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-life-soft" />}
                    {dayTasks.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-life-accent" />}
                    {dayDue.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[#D96B52]" />}
                  </div>
                  <div className="hidden sm:block space-y-1 w-full overflow-hidden">
                    {dayEvents.slice(0, 1).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[10px] truncate px-1.5 py-0.5 rounded bg-life-accent/25 text-life-soft"
                      >
                        {ev.startTime} {ev.title}
                      </div>
                    ))}
                    {dayTasks.length > 0 && (
                      <div className="text-[10px] truncate px-1.5 py-0.5 rounded bg-life-border/40 text-life-text">
                        {dayTasks.length} {lang === 'id' ? 'tugas' : 'due'}
                      </div>
                    )}
                    {dayDue.length > 0 && (
                      <div className="text-[10px] truncate px-1.5 py-0.5 rounded bg-[#D96B52]/20 text-[#F29B87]">
                        {dayDue.length} {lang === 'id' ? 'tagihan' : 'bills'}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-life-border/35 pb-3">
            <div>
              <h2 className="text-base font-semibold text-life-text">{t('daily_agenda')}</h2>
              <p className="text-xs text-life-accent">{formatDateReadable(selectedDay, lang)}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => onOpenEventModal(null, selectedDay)}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {selectedBirthdays.length > 0 && (
            <div className="p-3 rounded-xl bg-life-surface2/80 border border-life-accent/50 space-y-1">
              <div className="text-[11px] uppercase tracking-wider text-life-soft font-semibold flex items-center gap-1.5">
                <Cake className="w-3.5 h-3.5 text-life-accent" /> {t('birthday')}
              </div>
              {selectedBirthdays.map((b) => (
                <p key={b.id} className="text-xs text-life-text">
                  {b.name} ({b.category})
                </p>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-life-muted">{t('daily_agenda')}</h3>
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-life-muted/70">{t('no_events_today')}</p>
            ) : (
              selectedEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-life-bg/85 border border-life-border/45 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-life-text">{ev.title}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onOpenEventModal(ev)}
                        className="p-1 text-life-muted hover:text-life-soft"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteEvent(ev)}
                        className="p-1 text-life-muted hover:text-[#D96B52]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-life-soft tabular-nums">
                    {ev.startTime} – {ev.endTime} • {ev.location || ev.category}
                  </p>
                  {ev.reminder && ev.reminder !== 'None' && (
                    <p className="text-[11px] text-life-muted flex items-center gap-1">
                      <Bell className="w-3 h-3 text-life-accent" /> {ev.reminder}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="space-y-2.5 pt-2 border-t border-life-border/30">
            <h3 className="text-xs uppercase tracking-wider text-life-muted">{t('task_deadlines')}</h3>
            {selectedDeadlines.length === 0 ? (
              <p className="text-xs text-life-muted/70">
                {lang === 'id' ? 'Tidak ada tenggat tugas.' : 'No task deadlines on this day.'}
              </p>
            ) : (
              selectedDeadlines.map((tk) => (
                <div
                  key={tk.id}
                  className="p-2.5 rounded-xl bg-life-surface2/60 border border-life-border/40 flex items-center justify-between text-xs gap-2"
                >
                  <span className="text-life-text truncate">{tk.title}</span>
                  <span className="text-life-accent shrink-0">{tk.priority}</span>
                </div>
              ))
            )}
          </div>
          <DueList
            items={dueMap[selectedDay] || []}
            lang={lang}
            currency={data.profile.currency}
            maskBalances={maskBalances}
            onOpen={(tab) => onNavigate && onNavigate(tab)}
          />
        </GlassCard>
      </div>
    </div>
  );
};

// --- MODULE H: HABIT TRACKER ---
const HabitsView = ({ data, t, lang, onToggleHabitDate, onCreateHabit, onDeleteHabit }) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Mindset');
  const [timeOfDay, setTimeOfDay] = useState('Morning');

  const last7Days = useMemo(() => getLastNDays(7, TODAY_STR, lang), [lang]);

  const weeklyChartData = useMemo(() => {
    return last7Days.map((day) => {
      const completed = data.habits.filter((h) => h.completedDates.includes(day.dateStr)).length;
      const pct = data.habits.length > 0 ? Math.round((completed / data.habits.length) * 100) : 0;
      return {
        day: `${day.dayShort} ${day.dayNum}`,
        consistency: pct,
      };
    });
  }, [data.habits, last7Days]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateHabit({ name: name.trim(), category, timeOfDay, targetPerWeek: 7 });
    setName('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{t('habits_title')}</h1>
          <p className="text-xs text-life-muted mt-1">{t('habits_subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> {t('new_habit')}
        </Button>
      </div>

      <GlassCard className="p-5">
        <h2 className="text-base font-semibold text-life-text mb-4">{t('consistency_chart_title')}</h2>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--life-border))" strokeOpacity={0.25} vertical={false} />
              <XAxis dataKey="day" stroke="rgb(var(--life-muted))" fontSize={11} />
              <YAxis stroke="rgb(var(--life-muted))" fontSize={11} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgb(var(--life-surface))',
                  borderColor: 'rgb(var(--life-border))',
                  borderRadius: '12px',
                  color: 'rgb(var(--life-text))',
                }}
              />
              <Bar dataKey="consistency" name="%" fill="rgb(var(--life-accent))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {data.habits.length === 0 ? (
        <EmptyState
          icon={Flame}
          title={lang === 'id' ? 'Belum ada kebiasaan dilacak' : 'No habits tracked yet'}
          description={
            lang === 'id'
              ? 'Buat rutinitas harian untuk membangun konsistensi dan streak jangka panjang.'
              : 'Define daily rituals to measure consistency streaks and build compounding momentum.'
          }
          actionLabel={t('new_habit')}
          onAction={() => setShowModal(true)}
        />
      ) : (
        <GlassCard className="p-4 sm:p-5 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-life-border/40 text-[11px] uppercase tracking-wider text-life-muted">
                <th className="py-3 px-2">{t('habit_ritual')}</th>
                {last7Days.map((d) => (
                  <th key={d.dateStr} className="py-3 px-2 text-center">
                    <div>{d.dayShort}</div>
                    <div className="text-life-text font-semibold">{d.dayNum}</div>
                  </th>
                ))}
                <th className="py-3 px-2 text-center">{t('streak')}</th>
                <th className="py-3 px-2 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-life-border/25">
              {data.habits.map((habit) => {
                const streak = calculateHabitStreak(habit.completedDates);
                return (
                  <tr key={habit.id} className="hover:bg-life-surface2/30">
                    <td className="py-3.5 px-2">
                      <div className="text-sm font-medium text-life-text">{habit.name}</div>
                      <div className="text-xs text-life-muted">
                        {habit.category} • {habit.timeOfDay}
                      </div>
                    </td>
                    {last7Days.map((d) => {
                      const checked = habit.completedDates.includes(d.dateStr);
                      return (
                        <td key={d.dateStr} className="py-3.5 px-2 text-center">
                          <button
                            onClick={() => onToggleHabitDate(habit.id, d.dateStr)}
                            className={`w-9 h-9 rounded-xl inline-flex items-center justify-center transition-all ${
                              checked
                                ? 'bg-gradient-to-br from-life-accent to-life-accent-dark text-life-bg shadow'
                                : 'bg-life-bg border border-life-border/50 text-life-muted hover:border-life-accent'
                            }`}
                          >
                            {checked && <Check className="w-4 h-4 stroke-[2.5]" />}
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-3.5 px-2 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-life-surface2 text-xs font-semibold text-life-soft">
                        <Flame className="w-3.5 h-3.5 text-life-accent" /> {streak}d
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      <button
                        onClick={() => onDeleteHabit(habit)}
                        className="p-1.5 rounded-lg text-life-muted hover:text-[#D96B52]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GlassCard>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('new_habit')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label={t('habit_ritual')}
            placeholder={lang === 'id' ? 'mis. Baca Buku 30 Menit / Olahraga Pagi' : 'e.g. Read 30 Minutes / Morning Workout'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label={t('category')} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Mindset">{enumLabel('taskCategory', 'Mindset', lang)}</option>
              <option value="Health">{enumLabel('taskCategory', 'Health', lang)}</option>
              <option value="Finance">{enumLabel('taskCategory', 'Finance', lang)}</option>
              <option value="Productivity">{enumLabel('taskCategory', 'Productivity', lang)}</option>
            </Select>
            <Select
              label={lang === 'id' ? 'Waktu Pelaksanaan' : 'Time of Day'}
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
            >
              <option value="Morning">{enumLabel('timeOfDay', 'Morning', lang)}</option>
              <option value="Afternoon">{enumLabel('timeOfDay', 'Afternoon', lang)}</option>
              <option value="Evening">{enumLabel('timeOfDay', 'Evening', lang)}</option>
              <option value="Anytime">{enumLabel('timeOfDay', 'Anytime', lang)}</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// --- MODULE I: GOALS & MILESTONES ---
const GoalsView = ({ data, t, lang, onCreateGoal, onToggleMilestone, onAddMilestone, onDeleteGoal }) => {
  const [horizonFilter, setHorizonFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [newMilestoneInputs, setNewMilestoneInputs] = useState({});

  const [title, setTitle] = useState('');
  const [horizon, setHorizon] = useState('Short-Term');
  const [category, setCategory] = useState('Career');
  const [deadline, setDeadline] = useState('2027-03-31');
  const [firstMilestone, setFirstMilestone] = useState('');

  const filteredGoals = data.goals.filter((g) =>
    horizonFilter === 'all' ? true : g.horizon === horizonFilter
  );

  const handleCreate = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateGoal({
      title: title.trim(),
      horizon,
      category,
      deadline,
      milestones: firstMilestone.trim()
        ? [{ id: `ms-${Date.now()}`, title: firstMilestone.trim(), completed: false }]
        : [],
    });
    setTitle('');
    setFirstMilestone('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{t('goals_title')}</h1>
          <p className="text-xs text-life-muted mt-1">{t('goals_subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-life-surface p-1 border border-life-border/50">
            {['all', 'Short-Term', 'Long-Term'].map((h) => (
              <button
                key={h}
                onClick={() => setHorizonFilter(h)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                  horizonFilter === h ? 'bg-life-accent text-life-bg' : 'text-life-muted'
                }`}
              >
                {h === 'all' ? (lang === 'id' ? 'Semua' : 'All') : h}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> {t('new_goal')}
          </Button>
        </div>
      </div>

      {filteredGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={lang === 'id' ? 'Belum ada target pada kategori ini' : 'No goals in this horizon'}
          description={
            lang === 'id'
              ? 'Tetapkan target terukur beserta langkah milestone untuk memantau pertumbuhan pribadi.'
              : 'Define measurable milestones and target dates to track personal growth.'
          }
          actionLabel={t('new_goal')}
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredGoals.map((goal) => {
            const totalMs = goal.milestones.length;
            const doneMs = goal.milestones.filter((m) => m.completed).length;
            const pct = totalMs > 0 ? Math.round((doneMs / totalMs) * 100) : 0;

            return (
              <GlassCard key={goal.id} className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-life-surface2 text-life-soft">
                        {goal.horizon}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-life-bg text-life-muted">
                        {goal.category}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-life-text">{goal.title}</h3>
                    <p className="text-xs text-life-muted mt-0.5">
                      {lang === 'id' ? 'Tenggat' : 'Deadline'}: {formatDateReadable(goal.deadline, lang)}
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteGoal(goal)}
                    className="p-1.5 rounded-lg text-life-muted hover:text-[#D96B52] shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-life-muted">
                      {t('milestone_progress')} ({doneMs}/{totalMs})
                    </span>
                    <span className="text-life-soft font-semibold tabular-nums">{pct}%</span>
                  </div>
                  <ProgressBar value={pct} max={100} tone={pct === 100 ? 'success' : 'bronze'} />
                </div>

                <div className="space-y-2 pt-1">
                  {goal.milestones.map((ms) => (
                    <button
                      key={ms.id}
                      onClick={() => onToggleMilestone(goal.id, ms.id)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-life-bg/75 border border-life-border/35 hover:border-life-accent/50 text-left"
                    >
                      {ms.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-life-accent shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-life-muted shrink-0" />
                      )}
                      <span
                        className={`text-xs ${
                          ms.completed ? 'line-through text-life-muted' : 'text-life-text'
                        }`}
                      >
                        {ms.title}
                      </span>
                    </button>
                  ))}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const val = (newMilestoneInputs[goal.id] || '').trim();
                      if (!val) return;
                      onAddMilestone(goal.id, val);
                      setNewMilestoneInputs((prev) => ({ ...prev, [goal.id]: '' }));
                    }}
                    className="flex gap-2 pt-1"
                  >
                    <input
                      value={newMilestoneInputs[goal.id] || ''}
                      onChange={(e) =>
                        setNewMilestoneInputs((prev) => ({ ...prev, [goal.id]: e.target.value }))
                      }
                      placeholder={lang === 'id' ? 'Tambah langkah milestone...' : 'Add next milestone...'}
                      className="flex-1 min-w-0 rounded-xl bg-life-bg border border-life-border/45 px-3 py-1.5 text-xs text-life-text"
                    />
                    <Button type="submit" size="sm" variant="secondary">
                      {t('add')}
                    </Button>
                  </form>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('new_goal')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label={lang === 'id' ? 'Nama Target' : 'Goal Objective'}
            placeholder={lang === 'id' ? 'mis. Capai Dana Darurat 100 Juta' : 'e.g. Reach $10,000 Emergency Fund'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label={lang === 'id' ? 'Jangka Waktu' : 'Time Horizon'}
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
            >
              <option value="Short-Term">{enumLabel('horizon', 'Short-Term', lang)}</option>
              <option value="Long-Term">{enumLabel('horizon', 'Long-Term', lang)}</option>
            </Select>
            <Select label={t('category')} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Career">{enumLabel('goalCategory', 'Career', lang)}</option>
              <option value="Financial">Financial</option>
              <option value="Health">{enumLabel('taskCategory', 'Health', lang)}</option>
              <option value="Personal">{enumLabel('taskCategory', 'Personal', lang)}</option>
            </Select>
          </div>
          <Input
            label={lang === 'id' ? 'Tenggat' : 'Deadline'}
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
          <Input
            label={lang === 'id' ? 'Milestone Pertama (Opsional)' : 'Initial Milestone (Optional)'}
            placeholder={lang === 'id' ? 'mis. Selesaikan tahap 1' : 'e.g. Finish phase 1'}
            value={firstMilestone}
            onChange={(e) => setFirstMilestone(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// --- MODULE #6: PERSONAL CRM & RELATIONSHIP VAULT ---
const PersonalCrmView = ({ data, t, lang, onAddContact, onLogContactToday, onDeleteContact }) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Client');
  const [handle, setHandle] = useState('');
  const [birthday, setBirthday] = useState('1990-06-15');
  const [lastContacted, setLastContacted] = useState(TODAY_STR);
  const [followUpIntervalDays, setFollowUpIntervalDays] = useState('30');
  const [lastTopic, setLastTopic] = useState('');

  const contacts = data.contacts || [];

  const filteredContacts = useMemo(() => {
    return contacts
      .filter((c) => {
        if (catFilter !== 'all' && c.category !== catFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          if (
            !c.name.toLowerCase().includes(q) &&
            !(c.lastTopic || '').toLowerCase().includes(q) &&
            !(c.handle || '').toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const aOverdue = daysBetweenDates(a.lastContacted, TODAY_STR) - (a.followUpIntervalDays || 30);
        const bOverdue = daysBetweenDates(b.lastContacted, TODAY_STR) - (b.followUpIntervalDays || 30);
        return bOverdue - aOverdue;
      });
  }, [contacts, catFilter, search]);

  const metrics = useMemo(() => {
    const overdueCount = contacts.filter(
      (c) => daysBetweenDates(c.lastContacted, TODAY_STR) >= (c.followUpIntervalDays || 30)
    ).length;
    const decBirthdays = contacts.filter((c) => c.birthday && c.birthday.slice(5, 7) === '12').length;
    return { total: contacts.length, overdueCount, decBirthdays };
  }, [contacts]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddContact({
      name: name.trim(),
      category,
      handle: handle.trim(),
      birthday,
      lastContacted,
      followUpIntervalDays: Math.max(1, parseInt(followUpIntervalDays, 10) || 30),
      lastTopic: lastTopic.trim(),
    });
    setName('');
    setHandle('');
    setLastTopic('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{t('crm_title')}</h1>
          <p className="text-xs text-life-muted mt-1">{t('crm_sub')}</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> {t('add_contact')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <span className="text-xs uppercase tracking-wider text-life-muted">
            {lang === 'id' ? 'Total Relasi Terdaftar' : 'Total Contacts'}
          </span>
          <div className="mt-2 text-xl sm:text-2xl font-semibold text-life-text tabular-nums">
            {metrics.total}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <span className="text-xs uppercase tracking-wider text-life-muted">{t('due_followups')}</span>
          <div
            className={`mt-2 text-xl sm:text-2xl font-semibold tabular-nums ${
              metrics.overdueCount > 0 ? 'text-[#D96B52]' : 'text-[#87B082]'
            }`}
          >
            {metrics.overdueCount}
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <span className="text-xs uppercase tracking-wider text-life-muted">{t('upcoming_birthdays')}</span>
          <div className="mt-2 text-xl sm:text-2xl font-semibold text-life-soft tabular-nums">
            {metrics.decBirthdays}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-life-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full rounded-xl bg-life-bg border border-life-border/55 pl-10 pr-4 py-2 text-sm text-life-text"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all', 'Family', 'Client', 'Mentor', 'Friend'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                catFilter === cat ? 'bg-life-accent text-life-bg' : 'bg-life-bg text-life-muted'
              }`}
            >
              {cat === 'all' ? (lang === 'id' ? 'Semua' : 'All') : cat}
            </button>
          ))}
        </div>
      </GlassCard>

      {filteredContacts.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title={lang === 'id' ? 'Belum ada kontak relasi' : 'No contacts in this circle'}
          description={
            lang === 'id'
              ? 'Tambahkan keluarga, klien penting, mentor, atau sahabat untuk menjaga komunikasi berkala.'
              : 'Add family, clients, mentors, or friends to schedule periodic check-ins.'
          }
          actionLabel={t('add_contact')}
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredContacts.map((contact) => {
            const elapsed = daysBetweenDates(contact.lastContacted, TODAY_STR);
            const interval = contact.followUpIntervalDays || 30;
            const isDue = elapsed >= interval;
            const remainingDays = Math.max(0, interval - elapsed);

            return (
              <GlassCard key={contact.id} className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-life-surface2 text-life-soft border border-life-border/50">
                          {contact.category}
                        </span>
                        <span
                          className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            isDue
                              ? 'bg-[#D96B52]/20 text-[#F29B87] border-[#D96B52]/40'
                              : 'bg-[#5B8056]/20 text-[#87B082] border-[#5B8056]/40'
                          }`}
                        >
                          {isDue
                            ? `${t('overdue_followup')} (${elapsed}d)`
                            : `${t('on_track')} • ${remainingDays}d`}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-life-text mt-2">{contact.name}</h3>
                      <p className="text-xs text-life-muted mt-0.5">
                        {contact.handle || '—'} • {t('birthday')}: {contact.birthday?.slice(5) || '—'}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteContact(contact)}
                      className="p-1.5 rounded-lg text-life-muted hover:text-[#D96B52]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {contact.lastTopic && (
                    <div className="mt-3 p-3 rounded-xl bg-life-bg/80 border border-life-border/35 text-xs text-life-soft flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-life-accent shrink-0 mt-0.5" />
                      <span>{contact.lastTopic}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-life-border/35">
                  <span className="text-[11px] text-life-muted">
                    {t('last_contacted')}: {formatDateReadable(contact.lastContacted, lang)}
                  </span>
                  <Button size="sm" variant="secondary" onClick={() => onLogContactToday(contact.id)}>
                    <PhoneCall className="w-3.5 h-3.5 text-life-accent" /> {t('log_contact_today')}
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={t('add_contact')}>
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label={t('contact_name')}
            placeholder={lang === 'id' ? 'mis. Budi Santoso / Klien PT Maju' : 'e.g. Jane Smith / Client Acme Inc.'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label={t('relationship_cat')}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Family">{enumLabel('contact', 'Family', lang)}</option>
              <option value="Client">{enumLabel('contact', 'Client', lang)}</option>
              <option value="Mentor">{enumLabel('contact', 'Mentor', lang)}</option>
              <option value="Friend">{enumLabel('contact', 'Friend', lang)}</option>
            </Select>
            <Input
              label={t('contact_handle')}
              placeholder={lang === 'id' ? '+62 812... / @nama_pengguna' : '+1 555... / @username'}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label={t('birthday')}
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
            <Input
              label={t('last_contacted')}
              type="date"
              value={lastContacted}
              onChange={(e) => setLastContacted(e.target.value)}
            />
            <Input
              label={t('followup_days')}
              type="number"
              min="1"
              value={followUpIntervalDays}
              onChange={(e) => setFollowUpIntervalDays(e.target.value)}
            />
          </div>
          <Input
            label={t('last_topic')}
            placeholder={lang === 'id' ? 'mis. Pembahasan kerjasama Q1' : 'e.g. Q1 partnership discussion'}
            value={lastTopic}
            onChange={(e) => setLastTopic(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// --- MODULE J: NOTES & JOURNALING ---
const NotesView = ({ data, t, lang, onSaveNote, onDeleteNote, onTogglePinNote }) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedNoteId, setSelectedNoteId] = useState(data.notes[0]?.id || null);

  const filteredNotes = useMemo(() => {
    return data.notes
      .filter((n) => {
        if (typeFilter !== 'all' && n.type !== typeFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          if (
            !n.title.toLowerCase().includes(q) &&
            !n.content.toLowerCase().includes(q) &&
            !n.category.toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [data.notes, typeFilter, search]);

  const activeNote = useMemo(
    () => data.notes.find((n) => n.id === selectedNoteId) || filteredNotes[0] || null,
    [data.notes, selectedNoteId, filteredNotes]
  );

  const handleCreateEntry = (type = 'Note') => {
    const isJournal = type === 'Journal';
    const created = onSaveNote({
      title: isJournal
        ? `${lang === 'id' ? 'Jurnal Harian' : 'Daily Journal'} — ${formatDateReadable(TODAY_STR, lang)}`
        : lang === 'id'
        ? 'Catatan Baru'
        : 'Untitled Executive Note',
      type,
      category: isJournal ? 'Daily Journal' : 'General',
      pinned: false,
      mood: isJournal ? (lang === 'id' ? 'Fokus & Tenang' : 'Focused') : '',
      content: isJournal
        ? lang === 'id'
          ? 'Hal yang Disyukuri:\n- \n\nFokus Utama Hari Ini:\n- \n\nRefleksi Malam:\n'
          : 'Gratitude & Wins:\n- \n\nKey Priorities:\n- \n\nEvening Reflection:\n'
        : '',
    });
    if (created?.id) setSelectedNoteId(created.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{t('notes_title')}</h1>
          <p className="text-xs text-life-muted mt-1">{t('notes_subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleCreateEntry('Journal')}>
            <BookOpen className="w-4 h-4" /> {t('new_journal')}
          </Button>
          <Button size="sm" onClick={() => handleCreateEntry('Note')}>
            <Plus className="w-4 h-4" /> {t('new_note')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-life-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full rounded-xl bg-life-bg border border-life-border/55 pl-9 pr-3 py-2 text-xs text-life-text"
            />
          </div>
          <div className="flex gap-1.5">
            {['all', 'Note', 'Journal'].map((tp) => (
              <button
                key={tp}
                onClick={() => setTypeFilter(tp)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                  typeFilter === tp ? 'bg-life-accent text-life-bg' : 'bg-life-bg text-life-muted'
                }`}
              >
                {tp === 'all' ? (lang === 'id' ? 'Semua' : 'All') : tp === 'Note' ? 'Notes' : 'Jurnal'}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[360px] lg:max-h-[480px] overflow-y-auto pr-1">
            {filteredNotes.length === 0 ? (
              <p className="text-xs text-life-muted text-center py-8">
                {lang === 'id' ? 'Belum ada catatan.' : 'No notes found.'}
              </p>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = activeNote?.id === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`cursor-pointer p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-life-surface2 border-life-accent'
                        : 'bg-life-bg/70 border-life-border/35 hover:border-life-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium text-life-text truncate">{note.title}</h3>
                      {note.pinned && <Pin className="w-3.5 h-3.5 text-life-accent shrink-0" />}
                    </div>
                    <p className="text-xs text-life-muted line-clamp-2 mt-1">{note.content || '...'}</p>
                    <div className="flex items-center justify-between text-[10px] text-life-soft mt-2">
                      <span>{note.type} • {note.category}</span>
                      <span>{note.updatedAt.slice(0, 10)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5 lg:col-span-2 flex flex-col justify-between min-h-[420px]">
          {!activeNote ? (
            <EmptyState
              icon={FileText}
              title={lang === 'id' ? 'Pilih atau buat catatan' : 'Select or create a note'}
              description={
                lang === 'id'
                  ? 'Simpan ide strategis, ringkasan rapat, atau refleksi jurnal harian.'
                  : 'Capture strategic insights, meeting notes, or daily journal reflections.'
              }
              actionLabel={t('new_note')}
              onAction={() => handleCreateEntry('Note')}
            />
          ) : (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between gap-2 border-b border-life-border/40 pb-3">
                <input
                  value={activeNote.title}
                  onChange={(e) => onSaveNote({ ...activeNote, title: e.target.value })}
                  className="bg-transparent text-base sm:text-lg font-semibold text-life-text focus:outline-none flex-1 min-w-0"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onTogglePinNote(activeNote.id)}
                    className={`p-2 rounded-xl border transition-colors ${
                      activeNote.pinned
                        ? 'bg-life-surface2 border-life-accent text-life-accent'
                        : 'bg-life-bg border-life-border/50 text-life-muted'
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteNote(activeNote)}
                    className="p-2 rounded-xl bg-life-bg border border-life-border/50 text-life-muted hover:text-[#D96B52]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={activeNote.type}
                  onChange={(e) => onSaveNote({ ...activeNote, type: e.target.value })}
                  className="rounded-xl bg-life-bg border border-life-border/50 px-3 py-1.5 text-xs text-life-soft"
                >
                  <option value="Note">{enumLabel('noteType', 'Note', lang)}</option>
                  <option value="Journal">{enumLabel('noteType', 'Journal', lang)}</option>
                </select>
                <input
                  value={activeNote.category}
                  onChange={(e) => onSaveNote({ ...activeNote, category: e.target.value })}
                  className="rounded-xl bg-life-bg border border-life-border/50 px-3 py-1.5 text-xs text-life-text"
                />
                {activeNote.type === 'Journal' && (
                  <input
                    value={activeNote.mood || ''}
                    onChange={(e) => onSaveNote({ ...activeNote, mood: e.target.value })}
                    placeholder={lang === 'id' ? 'Suasana hati...' : 'Mood...'}
                    className="rounded-xl bg-life-bg border border-life-border/50 px-3 py-1.5 text-xs text-life-soft"
                  />
                )}
              </div>

              <textarea
                value={activeNote.content}
                onChange={(e) => onSaveNote({ ...activeNote, content: e.target.value })}
                className="w-full flex-1 min-h-[240px] rounded-xl bg-life-bg/70 border border-life-border/40 p-4 text-sm text-life-text leading-relaxed focus:outline-none focus:border-life-accent resize-none"
              />

              <div className="flex items-center justify-between text-[11px] text-life-muted">
                <span>
                  {activeNote.content.trim()
                    ? `${activeNote.content.trim().split(/\s+/).length} ${t('words')}`
                    : `0 ${t('words')}`}
                </span>
                <span>{t('autosaved')}</span>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

// --- MODULE K: SHOPPING LIST ---
const ShoppingView = ({
  data,
  maskBalances,
  t,
  lang,
  onCreateShoppingList,
  onAddShoppingItem,
  onToggleShoppingItem,
  onDeleteShoppingItem,
  onLogShoppingAsExpense,
}) => {
  const { currency } = data.profile;
  const [selectedListId, setSelectedListId] = useState(data.shoppingLists[0]?.id || null);
  const [shopAccountId, setShopAccountId] = useState(data.accounts[0]?.id || '');
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');

  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('Pantry');

  const activeList =
    data.shoppingLists.find((l) => l.id === selectedListId) || data.shoppingLists[0] || null;

  const totals = useMemo(() => {
    if (!activeList) return { estimated: 0, purchased: 0, remaining: 0 };
    const estimated = activeList.items.reduce((s, i) => s + i.qty * i.estimatedPrice, 0);
    const purchased = activeList.items
      .filter((i) => i.purchased)
      .reduce((s, i) => s + i.qty * i.estimatedPrice, 0);
    return {
      estimated,
      purchased,
      remaining: estimated - purchased,
    };
  }, [activeList]);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!activeList || !itemName.trim()) return;
    onAddShoppingItem(activeList.id, {
      name: itemName.trim(),
      qty: Math.max(1, parseInt(itemQty, 10) || 1),
      estimatedPrice: Math.max(0, parseFloat(itemPrice) || 0),
      category: itemCategory,
      purchased: false,
    });
    setItemName('');
    setItemQty('1');
    setItemPrice('');
  };

  const handleCreateList = (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const created = onCreateShoppingList(newListName.trim());
    if (created?.id) setSelectedListId(created.id);
    setNewListName('');
    setShowNewListModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{t('shopping_title')}</h1>
          <p className="text-xs text-life-muted mt-1">{t('shopping_subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowNewListModal(true)}>
            <Plus className="w-4 h-4" /> {t('new_list')}
          </Button>
          {activeList && totals.purchased - (activeList.loggedAmount || 0) > 0 && (
            <>
              {data.accounts.length > 0 && (
                <select
                  value={data.accounts.some((a) => a.id === shopAccountId) ? shopAccountId : data.accounts[0].id}
                  onChange={(e) => setShopAccountId(e.target.value)}
                  className="rounded-xl bg-life-bg/90 border border-life-border/55 px-3 py-2 text-xs text-life-text min-h-[36px]"
                  aria-label={lang === 'id' ? 'Akun pembayaran' : 'Payment account'}
                >
                  {data.accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              )}
              <Button
                size="sm"
                onClick={() =>
                  onLogShoppingAsExpense(
                    activeList.name,
                    totals.purchased - (activeList.loggedAmount || 0),
                    data.accounts.some((a) => a.id === shopAccountId) ? shopAccountId : data.accounts[0]?.id,
                    activeList.id,
                    totals.purchased
                  )
                }
              >
                <Wallet className="w-4 h-4" /> {t('log_purchased')} (
                {formatMoney(totals.purchased - (activeList.loggedAmount || 0), currency, maskBalances)})
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {data.shoppingLists.map((list) => (
          <button
            key={list.id}
            onClick={() => setSelectedListId(list.id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
              activeList?.id === list.id
                ? 'bg-life-accent text-life-bg border-life-accent'
                : 'bg-life-surface text-life-text border-life-border/50 hover:border-life-accent/60'
            }`}
          >
            {list.name} ({list.items.length})
          </button>
        ))}
      </div>

      {activeList && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <span className="text-xs text-life-muted uppercase tracking-wider">{t('est_basket')}</span>
              <div className="mt-1.5 text-xl font-semibold text-life-text tabular-nums">
                {formatMoney(totals.estimated, currency, maskBalances)}
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <span className="text-xs text-life-muted uppercase tracking-wider">{t('purchased_cart')}</span>
              <div className="mt-1.5 text-xl font-semibold text-life-soft tabular-nums">
                {formatMoney(totals.purchased, currency, maskBalances)}
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <span className="text-xs text-life-muted uppercase tracking-wider">{t('remaining_buy')}</span>
              <div className="mt-1.5 text-xl font-semibold text-life-accent tabular-nums">
                {formatMoney(totals.remaining, currency, maskBalances)}
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-4">
            <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <Input
                  label={lang === 'id' ? 'Nama Barang' : 'Item Name'}
                  placeholder={lang === 'id' ? 'mis. Kopi Arabika / Beras Organik' : 'e.g. Arabica Coffee / Organic Rice'}
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label={lang === 'id' ? 'Jumlah' : 'Qty'}
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label={`${lang === 'id' ? 'Harga Satuan' : 'Est. Unit'} (${currency})`}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Select
                  label={t('category')}
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                >
                  <option value="Pantry">{enumLabel('shopCategory', 'Pantry', lang)}</option>
                  <option value="Produce">{enumLabel('shopCategory', 'Produce', lang)}</option>
                  <option value="Household">{enumLabel('shopCategory', 'Household', lang)}</option>
                  <option value="Electronics">{enumLabel('shopCategory', 'Electronics', lang)}</option>
                  <option value="Personal">{enumLabel('taskCategory', 'Personal', lang)}</option>
                </Select>
              </div>
              <div className="sm:col-span-1">
                <Button type="submit" className="w-full" aria-label={t('add')}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </GlassCard>

          {activeList.items.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title={lang === 'id' ? 'Daftar belanja masih kosong' : 'This shopping list is empty'}
              description={
                lang === 'id'
                  ? 'Tambahkan barang belanjaan beserta estimasi harganya di formulir atas.'
                  : 'Add items and estimated unit costs using the bar above.'
              }
            />
          ) : (
            <GlassCard className="p-4 sm:p-5 space-y-2.5">
              {activeList.items.map((item) => {
                const lineTotal = item.qty * item.estimatedPrice;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                      item.purchased
                        ? 'bg-life-bg/50 border-life-border/25 opacity-70'
                        : 'bg-life-bg/85 border-life-border/45'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleShoppingItem(activeList.id, item.id)}
                      className="flex items-center gap-3 text-left min-w-0 flex-1"
                    >
                      {item.purchased ? (
                        <CheckCircle2 className="w-5 h-5 text-life-accent shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-life-muted shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-medium truncate ${
                            item.purchased ? 'line-through text-life-muted' : 'text-life-text'
                          }`}
                        >
                          {item.name}
                        </p>
                        <p className="text-xs text-life-muted">
                          {item.qty}x • {item.category}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs sm:text-sm font-semibold text-life-soft tabular-nums">
                        {formatMoney(lineTotal, currency, maskBalances)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteShoppingItem(activeList.id, item.id)}
                        className="p-1.5 rounded-lg text-life-muted hover:text-[#D96B52]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </GlassCard>
          )}
        </>
      )}

      <Modal open={showNewListModal} onClose={() => setShowNewListModal(false)} title={t('new_list')}>
        <form onSubmit={handleCreateList} className="space-y-4">
          <Input
            label={lang === 'id' ? 'Nama Daftar Belanja' : 'List Name'}
            placeholder={lang === 'id' ? 'mis. Belanja Bulanan / Perlengkapan Rumah' : 'e.g. Monthly Groceries / Household Supplies'}
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowNewListModal(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// --- MODULE L: REPORTS & ANALYTICS (WITH AI ADVISOR & WELLNESS CORRELATION CHART) ---
const ReportsView = ({ data, derived, maskBalances, t, lang, onExportCsv }) => {
  const { currency } = data.profile;

  const wellnessCorrelationData = useMemo(() => {
    const last7 = getLastNDays(7, TODAY_STR, lang);
    const logMap = {};
    (data.wellnessLogs || []).forEach((w) => {
      logMap[w.date] = w;
    });

    return last7.map((d) => {
      const log = logMap[d.dateStr] || { sleepHours: 0, energyScore: 0, waterGlasses: 0 };
      const habitsDone = data.habits.filter((h) => h.completedDates.includes(d.dateStr)).length;
      return {
        day: `${d.dayShort} ${d.dayNum}`,
        sleep: log.sleepHours,
        energy: log.energyScore,
        habits: habitsDone,
      };
    });
  }, [data.wellnessLogs, data.habits, lang]);

  const wellnessAverages = useMemo(() => {
    const logs = data.wellnessLogs || [];
    if (!logs.length) return { avgSleep: '0.0', avgEnergy: '0.0' };
    const avgSleep = (logs.reduce((s, l) => s + (l.sleepHours || 0), 0) / logs.length).toFixed(1);
    const avgEnergy = (logs.reduce((s, l) => s + (l.energyScore || 0), 0) / logs.length).toFixed(1);
    return { avgSleep, avgEnergy };
  }, [data.wellnessLogs]);

  const budgetComparisonData = useMemo(() => {
    const spendMap = {};
    data.transactions
      .filter((tx) => tx.type === 'expense' && tx.date.startsWith(CURRENT_MONTH))
      .forEach((tx) => {
        spendMap[tx.category] = (spendMap[tx.category] || 0) + tx.amount;
      });
    return effectiveBudgets(data.budgets, CURRENT_MONTH)
      .map((b) => ({
        category: b.category.split(' ')[0],
        Planned: b.limit,
        Actual: spendMap[b.category] || 0,
      }));
  }, [data.budgets, data.transactions]);

  const totalSavingsVaults = useMemo(
    () =>
      data.savingsGoals.reduce(
        (sum, sg) => sum + sg.contributions.reduce((s, c) => s + c.amount, 0),
        0
      ),
    [data.savingsGoals]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{t('reports_title')}</h1>
          <p className="text-xs text-life-muted mt-1">{t('reports_subtitle')}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={onExportCsv}>
          <Download className="w-4 h-4" /> {t('export_csv')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <span className="text-xs text-life-muted uppercase">{t('nav_savings')}</span>
          <div className="mt-1.5 text-xl font-semibold text-life-soft tabular-nums">
            {formatMoney(totalSavingsVaults, currency, maskBalances)}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs text-life-muted uppercase">{t('avg_sleep')}</span>
          <div className="mt-1.5 text-xl font-semibold text-life-text tabular-nums">
            {wellnessAverages.avgSleep}h
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs text-life-muted uppercase">{t('avg_energy')}</span>
          <div className="mt-1.5 text-xl font-semibold text-life-accent tabular-nums">
            {wellnessAverages.avgEnergy} / 10
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <span className="text-xs text-life-muted uppercase">{t('active_goals_completion')}</span>
          <div className="mt-1.5 text-xl font-semibold text-life-soft tabular-nums">
            {derived.overallGoalPct.toFixed(0)}%
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sleep Duration vs Energy & Habits Correlation Chart */}
        <GlassCard className="p-5">
          <h2 className="text-base font-semibold text-life-text mb-1">{t('wellness_corr_title')}</h2>
          <p className="text-xs text-life-muted mb-4">{t('wellness_corr_sub')}</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={wellnessCorrelationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--life-border))" strokeOpacity={0.25} vertical={false} />
                <XAxis dataKey="day" stroke="rgb(var(--life-muted))" fontSize={11} />
                <YAxis stroke="rgb(var(--life-muted))" fontSize={11} domain={[0, 10]} width={35} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--life-surface))',
                    borderColor: 'rgb(var(--life-border))',
                    borderRadius: '12px',
                    color: 'rgb(var(--life-text))',
                  }}
                />
                <Bar
                  dataKey="sleep"
                  name={t('sleep_hours')}
                  fill="rgb(var(--life-accent))"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="energy"
                  name={t('energy_score')}
                  stroke="rgb(var(--life-soft))"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'rgb(var(--life-soft))' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-base font-semibold text-life-text mb-4">{t('chart_cashflow_title')}</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived.monthlySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--life-border))" strokeOpacity={0.25} vertical={false} />
                <XAxis dataKey="label" stroke="rgb(var(--life-muted))" fontSize={11} />
                <YAxis stroke="rgb(var(--life-muted))" fontSize={11} width={45} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--life-surface))',
                    borderColor: 'rgb(var(--life-border))',
                    borderRadius: '12px',
                    color: 'rgb(var(--life-text))',
                  }}
                />
                <Bar dataKey="income" name={lang === 'id' ? 'Pemasukan' : 'Income'} fill="rgb(var(--life-soft))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name={lang === 'id' ? 'Pengeluaran' : 'Expenses'} fill="rgb(var(--life-accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-base font-semibold text-life-text mb-4">
            {t('nav_budgets')} ({CURRENT_MONTH})
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--life-border))" strokeOpacity={0.25} vertical={false} />
                <XAxis dataKey="category" stroke="rgb(var(--life-muted))" fontSize={11} />
                <YAxis stroke="rgb(var(--life-muted))" fontSize={11} width={45} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--life-surface))',
                    borderColor: 'rgb(var(--life-border))',
                    borderRadius: '12px',
                    color: 'rgb(var(--life-text))',
                  }}
                />
                <Bar dataKey="Planned" fill="rgb(var(--life-border))" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Actual" fill="rgb(var(--life-accent))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-base font-semibold text-life-text mb-4">{t('spending_by_cat')}</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={derived.categoryBreakdown}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {derived.categoryBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--life-surface))',
                    borderColor: 'rgb(var(--life-border))',
                    borderRadius: '12px',
                    color: 'rgb(var(--life-text))',
                  }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// ============================================================================
// 8. GLOBAL CRUD MODALS, SMART TOOLS & SYSTEM SETTINGS
// ============================================================================

const SplitBillModal = ({ open, onClose, data, t, lang, onExecuteSplitBill }) => {
  const { currency } = data.profile;
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [splitMode, setSplitMode] = useState('equal');
  const [accountId, setAccountId] = useState(data.accounts[0]?.id || '');
  const [logTotalExpense, setLogTotalExpense] = useState(true);
  const [friends, setFriends] = useState([
    { id: 'fr-1', name: 'Raka', customAmount: '' },
    { id: 'fr-2', name: 'Nadia', customAmount: '' },
  ]);

  const numericTotal = parseFloat(totalAmount) || 0;
  const headcount = friends.length + 1;
  const equalShare = headcount > 0 ? Math.round((numericTotal / headcount) * 100) / 100 : 0;

  const computedFriends = friends.map((f) => ({
    ...f,
    owedAmount:
      splitMode === 'equal' ? equalShare : Math.max(0, parseFloat(f.customAmount) || 0),
  }));

  const friendsSum = computedFriends.reduce((s, f) => s + f.owedAmount, 0);
  const yourOwnShare = Math.max(0, numericTotal - friendsSum);

  const handleAddFriend = () => {
    setFriends((prev) => [...prev, { id: `fr-${Date.now()}`, name: '', customAmount: '' }]);
  };

  const handleRemoveFriend = (id) => {
    if (friends.length <= 1) return;
    setFriends((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || numericTotal <= 0) return;
    const validParticipants = computedFriends.filter((f) => f.name.trim() && f.owedAmount > 0);
    if (validParticipants.length === 0) return;
    if (friendsSum > numericTotal + 0.01) return; // total piutang tidak boleh melebihi tagihan

    onExecuteSplitBill({
      title: title.trim(),
      totalAmount: numericTotal,
      accountId: accountId || data.accounts[0]?.id,
      logTotalExpense,
      participants: validParticipants.map((p) => ({
        name: p.name.trim(),
        amount: p.owedAmount,
      })),
    });

    setTitle('');
    setTotalAmount('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('split_bill')} subtitle={t('split_bill_sub')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={lang === 'id' ? 'Judul Patungan / Makan Bersama' : 'Bill Description'}
          placeholder={lang === 'id' ? 'mis. Makan Malam Klien & Tim' : 'e.g. Client & Team Dinner'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={`${lang === 'id' ? 'Total Tagihan' : 'Total Bill'} (${currency})`}
            type="number"
            step="0.01"
            min="1"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            required
          />
          <Select
            label={lang === 'id' ? 'Dibayar dari Akun' : 'Paid From Account'}
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {data.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-life-bg border border-life-border/50">
          {[
            { id: 'equal', label: t('split_equal') },
            { id: 'custom', label: t('split_custom') },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSplitMode(m.id)}
              className={`py-2 rounded-lg text-xs font-semibold ${
                splitMode === m.id ? 'bg-life-accent text-life-bg' : 'text-life-muted'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-life-muted">
              {lang === 'id' ? 'Daftar Peserta Patungan' : 'Participants'}
            </span>
            <button
              type="button"
              onClick={handleAddFriend}
              className="text-xs font-semibold text-life-soft hover:text-life-accent inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> {t('add_participant')}
            </button>
          </div>

          {computedFriends.map((f) => (
            <div key={f.id} className="flex items-center gap-2">
              <input
                value={f.name}
                onChange={(e) =>
                  setFriends((prev) =>
                    prev.map((item) => (item.id === f.id ? { ...item, name: e.target.value } : item))
                  )
                }
                placeholder={lang === 'id' ? 'Nama teman...' : 'Friend name...'}
                className="flex-1 min-w-0 rounded-xl bg-life-bg border border-life-border/55 px-3 py-2 text-xs text-life-text"
                required
              />
              {splitMode === 'equal' ? (
                <span className="px-3 py-2 rounded-xl bg-life-surface2 text-xs font-semibold text-life-soft tabular-nums shrink-0">
                  {formatMoney(f.owedAmount, currency)}
                </span>
              ) : (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={f.customAmount}
                  onChange={(e) =>
                    setFriends((prev) =>
                      prev.map((item) =>
                        item.id === f.id ? { ...item, customAmount: e.target.value } : item
                      )
                    )
                  }
                  className="w-28 rounded-xl bg-life-bg border border-life-border/55 px-3 py-2 text-xs text-life-text text-right"
                  required
                />
              )}
              {friends.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveFriend(f.id)}
                  className="p-2 text-life-muted hover:text-[#D96B52]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-life-bg/80 border border-life-border/40 flex items-center justify-between text-xs">
          <span className="text-life-muted">{t('your_share')}</span>
          <span className="font-semibold text-life-text tabular-nums">
            {formatMoney(yourOwnShare, currency)}
          </span>
        </div>
        {friendsSum > numericTotal + 0.01 && (
          <p className="text-[11px] text-[#F29B87]">
            {lang === 'id'
              ? 'Total bagian teman melebihi total tagihan. Kurangi nominalnya.'
              : "Friends' shares exceed the bill total. Reduce the amounts."}
          </p>
        )}

        <label className="flex items-center gap-2.5 text-xs text-life-soft cursor-pointer">
          <input
            type="checkbox"
            checked={logTotalExpense}
            onChange={(e) => setLogTotalExpense(e.target.checked)}
            className="rounded accent-life-accent"
          />
          {t('log_total_wallet')}
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit">{t('execute_split_bill')}</Button>
        </div>
      </form>
    </Modal>
  );
};

const PaydaySplitterModal = ({ open, onClose, data, t, lang, onExecuteSplit }) => {
  const { currency } = data.profile;
  const [totalSalary, setTotalSalary] = useState(currency === 'Rp' ? '15000000' : '8000');
  const [allocations, setAllocations] = useState([]);

  useEffect(() => {
    if (open && data.accounts.length > 0) {
      const equalPct = Math.floor(100 / data.accounts.length);
      const remainder = 100 - equalPct * data.accounts.length;
      setAllocations(
        data.accounts.map((acc, idx) => ({
          accountId: acc.id,
          accountName: acc.name,
          pct: idx === 0 ? equalPct + remainder : equalPct,
        }))
      );
    }
  }, [open, data.accounts]);

  const totalPct = allocations.reduce((s, a) => s + (Number(a.pct) || 0), 0);
  const numericSalary = parseFloat(totalSalary) || 0;

  const handlePctChange = (accountId, val) => {
    setAllocations((prev) =>
      prev.map((a) => (a.accountId === accountId ? { ...a, pct: Math.max(0, Math.min(100, Number(val) || 0)) } : a))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (numericSalary <= 0 || totalPct !== 100) return;
    const splits = allocations
      .filter((a) => a.pct > 0)
      .map((a) => ({
        accountId: a.accountId,
        accountName: a.accountName,
        amount: Math.round(((numericSalary * a.pct) / 100) * 100) / 100,
        pct: a.pct,
      }));
    onExecuteSplit(splits);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('payday_splitter')} subtitle={t('payday_sub')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={`${t('total_payday_amount')} (${currency})`}
          type="number"
          step="0.01"
          min="1"
          value={totalSalary}
          onChange={(e) => setTotalSalary(e.target.value)}
          required
        />

        <div className="space-y-2.5">
          {allocations.map((al) => {
            const share = (numericSalary * al.pct) / 100;
            return (
              <div
                key={al.accountId}
                className="p-3 rounded-xl bg-life-bg/80 border border-life-border/40 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-life-text truncate">{al.accountName}</p>
                  <p className="text-xs text-life-soft tabular-nums">
                    {formatMoney(share, currency)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={al.pct}
                    onChange={(e) => handlePctChange(al.accountId, e.target.value)}
                    className="w-16 rounded-lg bg-life-surface border border-life-border/60 px-2 py-1.5 text-right text-sm text-life-text"
                  />
                  <span className="text-xs text-life-muted">%</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-life-muted">{lang === 'id' ? 'Total Alokasi' : 'Total Allocation'}</span>
          <span className={totalPct === 100 ? 'text-[#87B082] font-semibold' : 'text-[#D96B52] font-semibold'}>
            {totalPct}% {totalPct !== 100 && (lang === 'id' ? '(Harus 100%)' : '(Must equal 100%)')}
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={totalPct !== 100 || numericSalary <= 0}>
            {t('execute_split')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const ReceiptScannerModal = ({ open, onClose, data, t, lang, onSaveExtractedTx }) => {
  const [scanMode, setScanMode] = useState('camera');
  const [rawText, setRawText] = useState('');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [accountId, setAccountId] = useState(data.accounts[0]?.id || '');

  const [cameraError, setCameraError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [detectedCode, setDetectedCode] = useState('');
  const [capturedPreview, setCapturedPreview] = useState('');
  const [qrMissed, setQrMissed] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [items, setItems] = useState([]);
  const [readBy, setReadBy] = useState('');
  const [saveMode, setSaveMode] = useState('items');
  const [ocrFailed, setOcrFailed] = useState(false);
  const ocrRunRef = useRef(0);
  const sumItems = (list) => list.reduce((a, b) => a + (Number(b.price) || 0), 0);
  const applyItems = (list) => {
    setItems(list);
    setAmount(String(sumItems(list)));
  };
  const updateItem = (id, patch) => applyItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const removeItem = (id) => applyItems(items.filter((it) => it.id !== id));
  const addItem = () =>
    setItems([...items, { id: `it-${Date.now()}-${items.length}`, name: '', qty: 1, price: '' }]);
  const hasNegative = items.some((it) => Number(it.price) < 0);
  const effectiveMode = items.length >= 2 && !hasNegative ? saveMode : 'single';
  const expenseCats = [...new Set([...DEFAULT_EXPENSE_CATEGORIES, ...(data.customExpenseCategories || [])])];
  // Isi form dari hasil baca (AI atau OCR): merchant, daftar barang, total, kategori
  const applyParsed = (parsed, by) => {
    const list = parsed.items.map((it, i) => ({
      id: `it-${Date.now()}-${i}`,
      name: it.name,
      qty: it.qty,
      price: String(it.price),
      adjust: !!it.adjust,
      category: it.category || '',
    }));
    setItems(list);
    setReadBy(by);
    if (parsed.merchant) setMerchant(parsed.merchant);
    const cat = parsed.category || guessCategory(parsed.merchant);
    if (cat && expenseCats.includes(cat)) setCategory(cat);
    if (parsed.total > 0) setAmount(String(parsed.total));
    else if (list.length) setAmount(String(sumItems(list)));
    return Boolean(parsed.merchant || parsed.total > 0 || list.length);
  };
  const aiParsedToRows = (d) => ({
    merchant: d.merchant,
    category: d.category,
    total: d.total,
    items: reconcileRows(d.items, d.total || d.items.reduce((a, b) => a + b.price, 0)),
  });
  const [scanKey, setScanKey] = useState(0);
  const scannedRef = useRef('');
  const applyCodeRef = useRef(() => {});
  // Begitu QR terbaca: isi form otomatis (merchant, nominal, kategori), hentikan kamera, tinggal tekan Selesai
  applyCodeRef.current = (codeVal) => {
    if (!codeVal || scannedRef.current === codeVal) return;
    scannedRef.current = codeVal;
    try { navigator.vibrate?.(60); } catch { /* abaikan */ }
    setDetectedCode(codeVal);
    setQrMissed(false);
    const qris = parseQris(codeVal);
    let name;
    if (qris) {
      name = qris.merchant || 'QRIS';
      setAmount(qris.amount > 0 ? String(qris.amount) : '');
    } else {
      let host = '';
      try { host = new URL(codeVal).hostname; } catch { /* bukan URL */ }
      name = host ? `Struk ${host}` : `Scan: ${codeVal.slice(0, 32)}`;
    }
    setMerchant(name);
    const guess = guessCategory(name);
    if (guess) setCategory(guess);
    stopCameraStream();
    if (!(qris && qris.amount > 0)) {
      setTimeout(() => document.getElementById('scan-amount-input')?.focus(), 150);
    }
  };

  const rescan = () => {
    scannedRef.current = '';
    setDetectedCode('');
    setMerchant('');
    setAmount('');
    setCapturedPreview('');
    setQrMissed(false);
    setOcrBusy(false);
    setItems([]);
    ocrRunRef.current += 1;
    setScanKey((k) => k + 1);
  };

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopCameraStream();
      setCapturedPreview('');
      setDetectedCode('');
      scannedRef.current = '';
      setCameraError('');
      setQrMissed(false);
      setOcrBusy(false);
      setItems([]);
      ocrRunRef.current += 1;
      return undefined;
    }

    if (scanMode !== 'camera') {
      stopCameraStream();
      return undefined;
    }

    let cancelled = false;
    let barcodeInterval = null;

    const startCamera = async () => {
      setCameraError('');
      setCameraReady(false);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('MediaDevices API not supported');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }

        // Baca QR langsung di perangkat (tanpa AI & tanpa internet)
        barcodeInterval = setInterval(async () => {
          if (scannedRef.current || !videoRef.current || videoRef.current.readyState !== 4) return;
          const codeVal = await decodeCode(videoRef.current).catch(() => '');
          if (codeVal) applyCodeRef.current(codeVal);
        }, 500);
      } catch {
        if (!cancelled) {
          setCameraError(t('camera_error_hint'));
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (barcodeInterval) clearInterval(barcodeInterval);
      stopCameraStream();
    };
  }, [open, scanMode, scanKey, stopCameraStream, t]);

  const scanStillImage = async (dataUrl, mimeType) => {
    setCapturedPreview(dataUrl);
    setQrMissed(false);
    setOcrFailed(false);
    setItems([]);
    setReadBy('');
    try {
      const img = await loadImage(dataUrl);
      const codeVal = await decodeCode(img);
      if (codeVal) {
        applyCodeRef.current(codeVal);
        return;
      }
      // Bukan QR → baca struk: AI (bila sudah diatur) → kalau gagal, OCR + parser lokal
      const runId = ++ocrRunRef.current;
      setOcrBusy(true);
      setOcrFailed(false);
      try {
        if (aiEnabled) {
          const d = await aiParseReceipt({ image: receiptToJpeg(img), categories: expenseCats });
          if (runId !== ocrRunRef.current) return;
          if (d) {
            setRawText(JSON.stringify(d, null, 1));
            if (applyParsed(aiParsedToRows(d), 'ai')) return;
          }
        }
        const text = await ocrReceiptImage(img);
        if (runId !== ocrRunRef.current) return;
        setRawText(text);
        if (!applyParsed(parseReceipt(text), 'ocr')) setQrMissed(true);
      } catch {
        if (runId === ocrRunRef.current) {
          setOcrFailed(true);
          setQrMissed(true);
        }
      } finally {
        if (runId === ocrRunRef.current) setOcrBusy(false);
      }
    } catch {
      setQrMissed(true);
    }
  };

  const handleSnapCamera = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    await scanStillImage(canvas.toDataURL('image/jpeg', 0.85), 'image/jpeg');
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // supaya file yang sama bisa dipilih lagi
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = String(ev.target?.result || '');
      if (dataUrl) await scanStillImage(dataUrl, file.type || 'image/jpeg');
    };
    reader.onerror = () => setQrMissed(true);
    reader.readAsDataURL(file);
  };

  const parseReceiptText = (text) => {
    setRawText(text);
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length > 0 && !merchant) {
      setMerchant(lines[0].slice(0, 42));
    }
    const matches = text.match(/(\d[\d.,]*\d)/g);
    if (matches && matches.length > 0) {
      const parsedNums = matches
        .map((m) => Number(m.replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.')))
        .filter((n) => !Number.isNaN(n) && n > 0);
      if (parsedNums.length > 0) {
        setAmount(String(Math.max(...parsedNums)));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) return;
    stopCameraStream();
    const base = {
      type: 'expense',
      date: TODAY_STR,
      accountId: accountId || data.accounts[0]?.id,
      paymentMethod: detectedCode ? 'QRIS / Barcode Scan' : 'Camera / Receipt Scan',
    };
    const shop = merchant.trim() || (lang === 'id' ? 'Belanja Scan Struk' : 'Scanned Receipt');
    const valid = items.filter((it) => it.name.trim() && Number(it.price) > 0);
    if (!detectedCode && effectiveMode === 'items' && valid.length >= 2) {
      // Satu transaksi per barang
      valid.forEach((it) => {
        const qty = Number(it.qty) || 1;
        onSaveExtractedTx({
          ...base,
          amount: Number(it.price),
          category: (!it.adjust && (expenseCats.includes(it.category) ? it.category : guessCategory(it.name))) || category,
          description: `${it.name.trim()}${qty > 1 ? ` ×${qty}` : ''} (${shop})`,
          notes: `${lang === 'id' ? 'Struk' : 'Receipt'}: ${shop}`,
        });
      });
    } else {
      const lines = items
        .filter((it) => it.name.trim())
        .map((it) => `${it.name.trim()}${Number(it.qty) > 1 ? ` ×${it.qty}` : ''} ${formatMoney(Number(it.price) || 0, data.profile.currency)}`)
        .join('; ');
      onSaveExtractedTx({
        ...base,
        amount: numAmt,
        category,
        description: shop,
        notes: detectedCode ? `Code: ${detectedCode}` : (lines || rawText).slice(0, 400),
      });
    }
    setRawText('');
    setMerchant('');
    setAmount('');
    setItems([]);
    setDetectedCode('');
    scannedRef.current = '';
    setCapturedPreview('');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('scan_receipt')} subtitle={t('scan_receipt_sub')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-life-bg border border-life-border/50">
          {[
            { id: 'camera', icon: Camera, label: t('mode_camera') },
            { id: 'upload', icon: ImageIcon, label: t('mode_upload') },
            { id: 'text', icon: Receipt, label: t('mode_text') },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setScanMode(tab.id)}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  scanMode === tab.id
                    ? 'bg-life-accent text-life-bg'
                    : 'text-life-muted hover:text-life-text'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {ocrBusy && (
          <div className="p-3 rounded-xl bg-life-bg border border-life-border/50 text-xs text-life-muted flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-life-accent shrink-0" />
            <span>{aiEnabled
                ? (lang === 'id' ? 'AI sedang membaca & merapikan struk...' : 'AI is reading the receipt...')
                : (lang === 'id' ? 'Membaca teks struk... (pertama kali bisa beberapa detik)' : 'Reading receipt text... (may take a few seconds the first time)')}</span>
          </div>
        )}
        {qrMissed && (
          <div className="p-3 rounded-xl bg-life-bg border border-life-border/50 text-xs text-life-muted space-y-2">
            <p>
              {ocrFailed
                ? lang === 'id'
                  ? 'Teks struk belum bisa dibaca (butuh internet untuk memuat pembaca teks pertama kali). Isi nama & nominal manual, atau coba lagi.'
                  : 'Could not read the receipt text (internet is needed the first time to load the reader). Enter details manually or try again.'
                : lang === 'id'
                  ? 'QR/teks tidak terbaca pada gambar ini. Arahkan lebih dekat/terang, atau isi nominal di bawah secara manual.'
                  : 'No QR/text found in this image. Move closer / add light, or enter the amount manually below.'}
            </p>
          </div>
        )}
        {detectedCode && (
          <div className="p-3.5 rounded-2xl bg-[#5B8056]/20 border border-[#5B8056]/50 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#87B082] shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[#87B082]">
                {lang === 'id' ? 'QR terbaca & terisi otomatis' : 'QR read & filled in'}
              </p>
              <p className="text-sm font-semibold text-life-text truncate">{merchant}</p>
              <p className="text-xs text-life-muted">
                {Number(amount) > 0
                  ? formatMoney(Number(amount), data.profile.currency)
                  : lang === 'id'
                    ? 'Nominal tidak ada di QR — isi di bawah'
                    : 'No amount in the QR — enter it below'}
              </p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={rescan}>
              {lang === 'id' ? 'Scan ulang' : 'Rescan'}
            </Button>
          </div>
        )}
        {scanMode === 'camera' && !detectedCode && (
          <div className="space-y-2.5">
            {cameraError ? (
              <div className="p-4 rounded-2xl bg-[#D96B52]/15 border border-[#D96B52]/40 text-xs text-[#F29B87] space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setScanMode('upload')}>
                  <ImageIcon className="w-3.5 h-3.5" /> {t('mode_upload')}
                </Button>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black border border-life-accent/50 aspect-video flex items-center justify-center">
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-56 h-36 sm:w-64 sm:h-40 border-2 border-life-accent/80 rounded-2xl shadow-[0_0_0_9999px_rgba(23,20,18,0.45)] flex items-end justify-center pb-2">
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-life-bg/80 text-life-soft">
                      {lang === 'id' ? 'QRIS • Barcode • Struk' : 'QRIS • Barcode • Receipt'}
                    </span>
                  </div>
                </div>
                {!cameraReady && (
                  <div className="absolute inset-0 bg-life-bg/85 flex items-center justify-center gap-2 text-xs text-life-soft">
                    <Loader2 className="w-4 h-4 animate-spin text-life-accent" />
                    <span>{lang === 'id' ? 'Membuka kamera...' : 'Starting camera...'}</span>
                  </div>
                )}
              </div>
            )}

            {detectedCode && (
              <div className="p-2.5 rounded-xl bg-[#5B8056]/20 border border-[#5B8056]/50 text-xs text-[#87B082] flex items-center gap-2">
                <QrCode className="w-4 h-4 shrink-0" />
                <span className="truncate font-mono">{detectedCode}</span>
              </div>
            )}

            {cameraReady && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={handleSnapCamera}
              >
                <Camera className="w-4 h-4 text-life-accent" /> {lang === 'id' ? 'Ambil foto & baca QR' : 'Capture & read QR'}
              </Button>
            )}
          </div>
        )}

        {scanMode === 'upload' && (
          <div className="grid grid-cols-2 gap-2.5">
            <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-life-border/70 bg-life-bg/70 hover:border-life-accent cursor-pointer text-center transition-colors">
              <ImageIcon className="w-6 h-6 text-life-accent mb-1.5" />
              <span className="text-xs font-medium text-life-text">
                {lang === 'id' ? 'Pilih dari galeri / file' : 'Choose from gallery / files'}
              </span>
              <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
            </label>
            <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-life-border/70 bg-life-bg/70 hover:border-life-accent cursor-pointer text-center transition-colors">
              <Camera className="w-6 h-6 text-life-accent mb-1.5" />
              <span className="text-xs font-medium text-life-text">
                {lang === 'id' ? 'Foto dengan kamera' : 'Take a photo'}
              </span>
              <input type="file" accept="image/*" capture="environment" onChange={handleImageFileUpload} className="hidden" />
            </label>
          </div>
        )}

        {scanMode === 'text' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-life-muted">
              {lang === 'id' ? 'Tempel Teks Struk / Invoice' : 'Paste Receipt Text'}
            </label>
            <textarea
              rows={3}
              value={rawText}
              onChange={(e) => parseReceiptText(e.target.value)}
              placeholder={
                lang === 'id'
                  ? 'Contoh:\nKopi Kenangan Bandung\n2x Kopi Susu Gula Aren\nTOTAL: 48.000'
                  : 'Example:\nArtisan Coffee Roasters\n2x Flat White\nTOTAL: 14.50'
              }
              className="w-full rounded-xl bg-life-bg/90 border border-life-border/55 p-3 text-xs text-life-text focus:outline-none focus:border-life-accent"
            />
            {aiEnabled && rawText.trim().length > 10 && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={ocrBusy}
                onClick={async () => {
                  setOcrBusy(true);
                  const d = await aiParseReceipt({ text: rawText, categories: expenseCats });
                  setOcrBusy(false);
                  if (d) applyParsed(aiParsedToRows(d), 'ai');
                }}
              >
                {ocrBusy ? (lang === 'id' ? 'AI membaca...' : 'AI reading...') : (lang === 'id' ? 'Rapikan dengan AI' : 'Clean up with AI')}
              </Button>
            )}
          </div>
        )}

        {capturedPreview && scanMode !== 'text' && (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-life-bg/80 border border-life-border/40">
            <img
              src={capturedPreview}
              alt={lang === 'id' ? 'Pratinjau hasil pindai' : 'Scanned preview'}
              className="w-14 h-14 rounded-lg object-cover shrink-0"
            />
            <span className="text-xs text-life-muted">
              {lang === 'id'
                ? 'Gambar berhasil ditangkap. Periksa hasil deteksi di bawah sebelum menyimpan.'
                : 'Image captured. Review extracted details below before saving.'}
            </span>
          </div>
        )}

        {capturedPreview && scanMode !== 'text' && !detectedCode && !ocrBusy && (
          <details className="text-[11px] text-life-muted">
            <summary className="cursor-pointer select-none">
              {lang === 'id' ? 'Teks hasil baca' : 'Raw text read'} · {readBy === 'ai' ? 'AI ✓' : OCR_BUILD}
            </summary>
            <pre className="mt-1.5 p-2 rounded-lg bg-life-bg border border-life-border/40 whitespace-pre-wrap break-words max-h-48 overflow-auto">
              {rawText || (lang === 'id' ? '(tidak ada teks terbaca)' : '(no text read)')}
            </pre>
          </details>
        )}

        <Input
          label={lang === 'id' ? 'Nama Merchant / Produk' : 'Merchant / Item Name'}
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          required
        />

        {items.length > 0 && !detectedCode && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-life-muted">
                {lang === 'id' ? `Daftar Barang (${items.length})` : `Items (${items.length})`}
              </p>
              <button type="button" onClick={addItem} className="inline-flex items-center gap-1 text-xs font-semibold text-life-accent">
                <Plus className="w-3.5 h-3.5" /> {lang === 'id' ? 'Tambah' : 'Add'}
              </button>
            </div>
            {items.map((it) => (
              <div key={it.id} className="rounded-xl bg-life-bg/80 border border-life-border/50 p-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    value={it.name}
                    onChange={(e) => updateItem(it.id, { name: e.target.value })}
                    placeholder={lang === 'id' ? 'Nama barang' : 'Item name'}
                    className="flex-1 min-w-0 rounded-lg bg-life-bg/90 border border-life-border/55 px-3 py-2 text-sm text-life-text focus:outline-none focus:border-life-accent"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(it.id)}
                    aria-label={lang === 'id' ? 'Hapus barang' : 'Remove item'}
                    className="p-2 rounded-lg text-life-muted hover:text-life-text shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-life-muted">
                  <span>{lang === 'id' ? 'Jml' : 'Qty'}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={it.qty}
                    onChange={(e) => updateItem(it.id, { qty: e.target.value })}
                    className="w-14 rounded-lg bg-life-bg/90 border border-life-border/55 px-2 py-2 text-sm text-life-text text-center focus:outline-none focus:border-life-accent"
                  />
                  <span className="ml-1">{data.profile.currency}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={it.price}
                    onChange={(e) => updateItem(it.id, { price: e.target.value })}
                    className="flex-1 min-w-0 rounded-lg bg-life-bg/90 border border-life-border/55 px-3 py-2 text-sm text-life-text text-right focus:outline-none focus:border-life-accent"
                  />
                </div>
              </div>
            ))}
            {items.length >= 2 && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-life-bg border border-life-border/50">
                  {[
                    { id: 'items', label: lang === 'id' ? 'Per barang' : 'Per item' },
                    { id: 'single', label: lang === 'id' ? '1 transaksi' : 'Single' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSaveMode(m.id)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                        effectiveMode === m.id ? 'bg-life-accent text-life-bg' : 'text-life-muted'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-life-muted">
                  {hasNegative
                    ? lang === 'id'
                      ? 'Ada diskon, jadi disimpan sebagai 1 transaksi (total setelah diskon).'
                      : 'There is a discount, so it is saved as one transaction (total after discount).'
                    : effectiveMode === 'items'
                      ? lang === 'id'
                        ? 'Setiap barang dicatat sebagai transaksi sendiri.'
                        : 'Each item is saved as its own transaction.'
                      : lang === 'id'
                        ? 'Semua barang digabung jadi 1 transaksi; rinciannya masuk catatan.'
                        : 'All items are combined into one transaction; details go in the notes.'}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            id="scan-amount-input"
            inputMode="decimal"
            label={`${t('amount')} (${data.profile.currency})`}
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            readOnly={items.length > 0 && !detectedCode}
            required
          />
          <Select label={t('category')} value={category} onChange={(e) => setCategory(e.target.value)}>
            {[...new Set([...DEFAULT_EXPENSE_CATEGORIES, ...(data.customExpenseCategories || [])])].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <Select
          label={lang === 'id' ? 'Akun Pembayaran' : 'Wallet Account'}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          {data.accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
          >
            {t('cancel')}
          </Button>
          <Button type="submit">{lang === 'id' ? 'Selesai' : 'Done'}</Button>
        </div>
      </form>
    </Modal>
  );
};

const DailyBriefingModal = ({ open, onClose, data, derived, t, lang, onCopied }) => {
  const textareaRef = useRef(null);
  const { currency } = data.profile;

  const briefingText = useMemo(() => {
    const pendingTasks = data.tasks.filter((tk) => tk.status !== 'completed');
    const todayEvents = data.events.filter((e) => e.date === TODAY_STR);
    const unpaidSubs = (data.subscriptions || []).filter((s) => s.lastPaidMonth !== CURRENT_MONTH);

    if (lang === 'id') {
      return [
        `📊 *LIFE OS — RINGKASAN HARIAN (${formatDateReadable(TODAY_STR, 'id')})*`,
        `Halo ${data.profile.name}, berikut status terkini Anda:`,
        ``,
        `💰 *Keuangan & Brankas*`,
        `• Total Kekayaan Bersih: ${formatMoney(derived.totalNetWorth, currency)}`,
        `• Pemasukan Bulan Ini: ${formatMoney(derived.monthlyIncome, currency)}`,
        `• Pengeluaran Bulan Ini: ${formatMoney(derived.monthlyExpenses, currency)}`,
        `• Pemakaian Anggaran: ${derived.budgetUtilizationPct.toFixed(0)}%`,
        ``,
        `📅 *Agenda Hari Ini (${todayEvents.length})*`,
        ...(todayEvents.length
          ? todayEvents.map((e) => `• ${e.startTime} - ${e.title}`)
          : ['• Tidak ada agenda terjadwal']),
        ``,
        `✅ *Tugas Aktif (${pendingTasks.length})*`,
        ...(pendingTasks.length
          ? pendingTasks.slice(0, 4).map((tk) => `• [${tk.priority}] ${tk.title}`)
          : ['• Semua tugas selesai!']),
        ``,
        `🔔 *Tagihan Belum Dibayar Bulan Ini*: ${unpaidSubs.length} tagihan`,
      ].join('\n');
    }

    return [
      `📊 *LIFE OS — DAILY BRIEFING (${formatDateReadable(TODAY_STR, 'en')})*`,
      `Hello ${data.profile.name}, here is your telemetry:`,
      ``,
      `💰 *Wealth & Vault*`,
      `• Total Net Worth: ${formatMoney(derived.totalNetWorth, currency)}`,
      `• Monthly Income: ${formatMoney(derived.monthlyIncome, currency)}`,
      `• Monthly Expenses: ${formatMoney(derived.monthlyExpenses, currency)}`,
      `• Budget Utilization: ${derived.budgetUtilizationPct.toFixed(0)}%`,
      ``,
      `📅 *Today's Schedule (${todayEvents.length})*`,
      ...(todayEvents.length
        ? todayEvents.map((e) => `• ${e.startTime} - ${e.title}`)
        : ['• No events scheduled']),
      ``,
      `✅ *Active Tasks (${pendingTasks.length})*`,
      ...(pendingTasks.length
        ? pendingTasks.slice(0, 4).map((tk) => `• [${tk.priority}] ${tk.title}`)
        : ['• All tasks completed!']),
      ``,
      `🔔 *Unpaid Bills This Month*: ${unpaidSubs.length}`,
    ].join('\n');
  }, [data, derived, lang, currency]);

  const handleCopy = () => {
    if (textareaRef.current) {
      textareaRef.current.select();
      try {
        document.execCommand('copy');
        onCopied();
      } catch {
        onCopied();
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('daily_briefing')}>
      <div className="space-y-4">
        <textarea
          ref={textareaRef}
          readOnly
          rows={12}
          value={briefingText}
          className="w-full rounded-xl bg-life-bg border border-life-border/55 p-3.5 text-xs text-life-text font-mono leading-relaxed focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={handleCopy}>
            <Copy className="w-4 h-4" /> {t('copy_briefing')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const withItemIds = (list) => (list || []).map((it, i) => ({ ...it, id: it.id || `ti-${i}-${Math.random().toString(36).slice(2, 6)}` }));

const TransactionModal = ({ open, onClose, editingTx, data, t, lang, onSave, accountBalances = {} }) => {
  const tr = useMemo(() => makeTr(lang), [lang]);
  const [fundVaultId, setFundVaultId] = useState('');
  const [type, setType] = useState(editingTx?.type || 'expense');
  const [amount, setAmount] = useState(editingTx ? String(editingTx.amount) : '');
  const [date, setDate] = useState(editingTx?.date || TODAY_STR);
  const [category, setCategory] = useState(editingTx?.category || DEFAULT_EXPENSE_CATEGORIES[1]);
  const [description, setDescription] = useState(editingTx?.description || '');
  const [accountId, setAccountId] = useState(editingTx?.accountId || data.accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(
    editingTx?.toAccountId || data.accounts[1]?.id || data.accounts[0]?.id || ''
  );
  const [paymentMethod, setPaymentMethod] = useState(editingTx?.paymentMethod || 'Card / Digital');
  const [notes, setNotes] = useState(editingTx?.notes || '');
  const [txItems, setTxItems] = useState(withItemIds(editingTx?.items));
  const [favName, setFavName] = useState('');
  const [saveFav, setSaveFav] = useState(false);
  const [repeatMonthly, setRepeatMonthly] = useState(false);

  useEffect(() => {
    if (open) {
      setFavName('');
      setSaveFav(false);
      setRepeatMonthly(false);
      const nextType = editingTx?.type || 'expense';
      setTxItems(withItemIds(editingTx?.items));
      setType(nextType);
      setAmount(editingTx ? String(editingTx.amount) : '');
      setDate(editingTx?.date || TODAY_STR);
      setCategory(
        editingTx?.category ||
          (nextType === 'income'
            ? DEFAULT_INCOME_CATEGORIES[0]
            : nextType === 'transfer'
            ? 'Vault Allocation'
            : DEFAULT_EXPENSE_CATEGORIES[1])
      );
      setDescription(editingTx?.description || '');
      setAccountId(editingTx?.accountId || data.accounts[0]?.id || '');
      setToAccountId(
        editingTx?.toAccountId || data.accounts[1]?.id || data.accounts[0]?.id || ''
      );
      setPaymentMethod(editingTx?.paymentMethod || 'Card / Digital');
      setNotes(editingTx?.notes || '');
      setFundVaultId('');
    }
  }, [open, editingTx, data.accounts]);

  const categories = useMemo(() => {
    if (type === 'income') {
      return [...new Set([...DEFAULT_INCOME_CATEGORIES, ...data.customIncomeCategories])];
    }
    if (type === 'transfer') {
      return ['Vault Allocation', 'Account Rebalance', 'Credit Card Settlement'];
    }
    return [...new Set([...DEFAULT_EXPENSE_CATEGORIES, ...data.customExpenseCategories])];
  }, [type, data.customExpenseCategories, data.customIncomeCategories]);

  const handleTypeSwitch = (nextType) => {
    setType(nextType);
    if (nextType === 'income') setCategory(DEFAULT_INCOME_CATEGORIES[0]);
    else if (nextType === 'transfer') setCategory('Vault Allocation');
    else setCategory(DEFAULT_EXPENSE_CATEGORIES[1]);
  };

  const accBalance = Number(accountBalances[accountId] ?? data.accounts.find((a) => a.id === accountId)?.initialBalance) || 0;
  const shortfall = !editingTx && type === 'expense' ? Math.max(0, (parseFloat(amount) || 0) - accBalance) : 0;
  const vaultsWithFunds = (data.savingsGoals || [])
    .map((sg) => ({ sg, saved: sg.contributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) }))
    .filter((v) => v.saved > 0);

  const itemTotal = (it) => (Number(it.qty) || 1) * (Number(it.price) || 0);
  const itemsSum = txItems.reduce((a, it) => a + itemTotal(it), 0);
  const hasItems = type === 'expense' && txItems.length > 0;
  const syncItems = (list) => {
    setTxItems(list);
    setAmount(String(list.reduce((a, it) => a + itemTotal(it), 0) || ''));
  };
  const addTxItem = () => syncItems([...txItems, { id: `ti-${Date.now()}-${txItems.length}`, name: '', qty: 1, price: '' }]);
  const patchTxItem = (id, patch) => syncItems(txItems.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const removeTxItem = (id) => syncItems(txItems.filter((it) => it.id !== id));

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanItems = hasItems
      ? txItems
          .filter((it) => it.name.trim() && Number(it.price) > 0)
          .map((it) => ({ name: it.name.trim(), qty: Number(it.qty) || 1, price: Number(it.price) }))
      : [];
    const numAmount = hasItems ? cleanItems.reduce((a, it) => a + it.qty * it.price, 0) : parseFloat(amount);
    const title = description.trim() || (cleanItems[0]?.name ? `${cleanItems[0].name}${cleanItems.length > 1 ? ` +${cleanItems.length - 1}` : ''}` : '');
    if (!numAmount || numAmount <= 0 || !title) return;
    if (type === 'transfer' && accountId === toAccountId) return;

    onSave({
      items: cleanItems.length ? cleanItems : undefined,
      fundFromVaultId: !editingTx && type === 'expense' && shortfall > 0 ? fundVaultId || undefined : undefined,
      id: editingTx?.id,
      type,
      amount: numAmount,
      date,
      category,
      description: title,
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : undefined,
      paymentMethod: type === 'transfer' ? 'Internal Ledger Transfer' : paymentMethod,
      notes: notes.trim(),
      saveAsTemplate: saveFav && type !== 'transfer' ? favName.trim() || title : undefined,
      makeRecurring: repeatMonthly && !editingTx && type !== 'transfer',
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingTx ? `${t('edit')} ${t('btn_transaction')}` : t('new_transaction')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-life-bg border border-life-border/50">
          {[
            { id: 'expense', label: lang === 'id' ? 'Pengeluaran' : 'Expense' },
            { id: 'income', label: lang === 'id' ? 'Pemasukan' : 'Income' },
            { id: 'transfer', label: 'Transfer' },
          ].map((tp) => (
            <button
              key={tp.id}
              type="button"
              onClick={() => handleTypeSwitch(tp.id)}
              className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                type === tp.id ? 'bg-life-accent text-life-bg' : 'text-life-muted hover:text-life-text'
              }`}
            >
              {tp.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={`${t('amount')} (${data.profile.currency})`}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            readOnly={hasItems}
            required
          />
          <Input label={t('date')} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <Input
          label={t('description')}
          placeholder={type === 'expense' ? (lang === 'id' ? 'mis. Makan di Kafe Kopi' : 'e.g. Lunch at Cafe') : 'e.g. Kopi & Meeting Klien'}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required={!hasItems}
        />

        {type === 'expense' && (
          <div className="rounded-2xl border border-life-border/50 bg-life-bg/60 p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-life-text">
                {lang === 'id' ? 'Rincian menu / barang' : 'Items breakdown'}
              </p>
              {txItems.length === 0 && (
                <button type="button" onClick={addTxItem} className="text-xs font-semibold text-life-accent">
                  + {lang === 'id' ? 'Tambah banyak item' : 'Add multiple items'}
                </button>
              )}
            </div>
            {txItems.length === 0 ? (
              <p className="text-[11px] text-life-muted">
                {lang === 'id'
                  ? 'Makan di kafe pesan banyak menu? Catat semua menu & harganya sekaligus dalam satu transaksi.'
                  : 'Ordered several things? Log every item and price in a single transaction.'}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-[1fr_3.2rem_5.5rem_1.5rem] gap-1.5 px-0.5 text-[10px] uppercase tracking-wider text-life-muted">
                  <span>{lang === 'id' ? 'Menu' : 'Item'}</span>
                  <span className="text-center">{lang === 'id' ? 'Jml' : 'Qty'}</span>
                  <span>{lang === 'id' ? 'Harga' : 'Price'}</span>
                  <span />
                </div>
                {txItems.map((it, idx) => (
                  <div key={it.id} className="grid grid-cols-[1fr_3.2rem_5.5rem_1.5rem] gap-1.5 items-center">
                    <input
                      value={it.name}
                      onChange={(e) => patchTxItem(it.id, { name: e.target.value })}
                      placeholder={lang === 'id' ? 'mis. Latte' : 'e.g. Latte'}
                      autoFocus={idx === txItems.length - 1 && !it.name && txItems.length > 1}
                      className="min-w-0 rounded-lg bg-life-surface border border-life-border/60 px-2.5 py-2 text-sm text-life-text outline-none focus:border-life-accent"
                    />
                    <input
                      type="number"
                      min="1"
                      inputMode="numeric"
                      value={it.qty}
                      onChange={(e) => patchTxItem(it.id, { qty: e.target.value })}
                      className="min-w-0 rounded-lg bg-life-surface border border-life-border/60 px-1 py-2 text-sm text-center text-life-text outline-none focus:border-life-accent"
                    />
                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={it.price}
                      placeholder="0"
                      onChange={(e) => patchTxItem(it.id, { price: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && idx === txItems.length - 1) {
                          e.preventDefault();
                          addTxItem();
                        }
                      }}
                      className="min-w-0 rounded-lg bg-life-surface border border-life-border/60 px-2 py-2 text-sm text-life-text outline-none focus:border-life-accent"
                    />
                    <button type="button" onClick={() => removeTxItem(it.id)} className="text-life-muted hover:text-[#F29B87]" aria-label={lang === 'id' ? 'Hapus' : 'Delete'}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <button type="button" onClick={addTxItem} className="text-xs font-semibold text-life-accent">
                    + {lang === 'id' ? 'Tambah item' : 'Add item'}
                  </button>
                  <span className="text-xs text-life-soft">
                    Total <b className="text-life-text tabular-nums">{formatMoney(itemsSum, data.profile.currency)}</b>
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label={t('category')} value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {type === 'transfer' ? enumLabel('transferCategory', c, lang) : catName(c, lang)}
              </option>
            ))}
          </Select>

          <Select
            label={
              type === 'transfer'
                ? lang === 'id'
                  ? 'Dari Akun'
                  : 'From Account'
                : lang === 'id'
                ? 'Akun Dompet'
                : 'Wallet Account'
            }
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {data.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>

        {type === 'transfer' ? (
          <Select
            label={lang === 'id' ? 'Ke Akun Tujuan' : 'Destination Account'}
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
          >
            {data.accounts
              .filter((a) => a.id !== accountId)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </Select>
        ) : (
          <Input
            label={lang === 'id' ? 'Metode Pembayaran' : 'Payment Method'}
            placeholder={lang === 'id' ? 'mis. QRIS, Transfer Bank, Tunai' : 'e.g. Card, Bank Transfer, Cash'}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
        )}

        {shortfall > 0 && (
          <div className="p-3 rounded-xl border border-[#D96B52]/60 bg-[#D96B52]/10 space-y-2">
            <p className="text-xs text-life-text">
              {lang === 'id'
                ? `Saldo akun ini ${formatMoney(accBalance, data.profile.currency)}, kurang ${formatMoney(shortfall, data.profile.currency)} untuk pengeluaran ini.`
                : `This account holds ${formatMoney(accBalance, data.profile.currency)}, short by ${formatMoney(shortfall, data.profile.currency)} for this expense.`}
            </p>
            {vaultsWithFunds.length > 0 ? (
              <Select
                label={lang === 'id' ? 'Tarik kekurangan dari tabungan' : 'Cover the shortfall from savings'}
                value={fundVaultId}
                onChange={(e) => setFundVaultId(e.target.value)}
              >
                <option value="">{lang === 'id' ? 'Jangan tarik (saldo jadi minus)' : "Don't withdraw (balance goes negative)"}</option>
                {vaultsWithFunds.map(({ sg, saved }) => (
                  <option key={sg.id} value={sg.id}>
                    {sg.name} — {formatMoney(saved, data.profile.currency)}
                  </option>
                ))}
              </Select>
            ) : (
              <p className="text-[11px] text-life-muted">
                {lang === 'id' ? 'Tidak ada dana tabungan yang bisa ditarik.' : 'No savings available to withdraw.'}
              </p>
            )}
          </div>
        )}

        <Input label={t('notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />

        {type !== 'transfer' && (
          <div className="rounded-2xl border border-life-border/50 bg-life-bg/60 p-3 space-y-2.5">
            <label className="flex items-center gap-2.5 text-xs text-life-text">
              <input type="checkbox" checked={saveFav} onChange={(e) => setSaveFav(e.target.checked)} />
              {tr('fav_save_checkbox')}
            </label>
            {saveFav && (
              <Input
                placeholder={tr('fav_save_name_ph')}
                value={favName}
                onChange={(e) => setFavName(e.target.value)}
              />
            )}
            {!editingTx && (
              <label className="flex items-center gap-2.5 text-xs text-life-text">
                <input type="checkbox" checked={repeatMonthly} onChange={(e) => setRepeatMonthly(e.target.checked)} />
                {tr('tx_make_recurring')}
              </label>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit">{t('save')}</Button>
        </div>
      </form>
    </Modal>
  );
};

const TaskModal = ({ open, onClose, editingTask, defaultDate, t, lang, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState(defaultDate || TODAY_STR);
  const [category, setCategory] = useState('Work');
  const [status, setStatus] = useState('todo');
  const [isTopPriority, setIsTopPriority] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(editingTask?.title || '');
      setDescription(editingTask?.description || '');
      setPriority(editingTask?.priority || 'Medium');
      setDueDate(editingTask?.dueDate || defaultDate || TODAY_STR);
      setCategory(editingTask?.category || 'Work');
      setStatus(editingTask?.status || 'todo');
      setIsTopPriority(Boolean(editingTask?.isTopPriority));
    }
  }, [open, editingTask, defaultDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: editingTask?.id,
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate,
      category,
      status,
      isTopPriority,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={editingTask ? `${t('edit')} ${t('btn_task')}` : t('new_task')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={lang === 'id' ? 'Judul Tugas' : 'Task Title'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Input
          label={t('description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label={t('priority')} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="Urgent">{enumLabel('priority', 'Urgent', lang)}</option>
            <option value="High">{enumLabel('priority', 'High', lang)}</option>
            <option value="Medium">{enumLabel('priority', 'Medium', lang)}</option>
            <option value="Low">{enumLabel('priority', 'Low', lang)}</option>
          </Select>
          <Input label={t('date')} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label={t('category')} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Work">{enumLabel('taskCategory', 'Work', lang)}</option>
            <option value="Finance">{enumLabel('taskCategory', 'Finance', lang)}</option>
            <option value="Health">{enumLabel('taskCategory', 'Health', lang)}</option>
            <option value="Personal">{enumLabel('taskCategory', 'Personal', lang)}</option>
            <option value="Learning">{enumLabel('taskCategory', 'Learning', lang)}</option>
          </Select>
          <Select label={t('status')} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="todo">{t('todo')}</option>
            <option value="in_progress">{t('in_progress')}</option>
            <option value="completed">{t('completed')}</option>
          </Select>
        </div>
        <label className="flex items-center gap-2.5 text-xs text-life-soft cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={isTopPriority}
            onChange={(e) => setIsTopPriority(e.target.checked)}
            className="rounded accent-life-accent"
          />
          {t('top_3_priorities')}
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit">{t('save')}</Button>
        </div>
      </form>
    </Modal>
  );
};

const EventModal = ({ open, onClose, editingEvent, defaultDate, t, lang, onSave }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate || TODAY_STR);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [category, setCategory] = useState('Work');
  const [location, setLocation] = useState('');
  const [reminder, setReminder] = useState('15 min before');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(editingEvent?.title || '');
      setDate(editingEvent?.date || defaultDate || TODAY_STR);
      setStartTime(editingEvent?.startTime || '10:00');
      setEndTime(editingEvent?.endTime || '11:00');
      setCategory(editingEvent?.category || 'Work');
      setLocation(editingEvent?.location || '');
      setReminder(editingEvent?.reminder || '15 min before');
      setNotes(editingEvent?.notes || '');
    }
  }, [open, editingEvent, defaultDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      id: editingEvent?.id,
      title: title.trim(),
      date,
      startTime,
      endTime,
      category,
      location: location.trim(),
      reminder,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={editingEvent ? `${t('edit')} ${t('btn_event')}` : t('new_event')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={lang === 'id' ? 'Judul Agenda' : 'Event Title'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input label={t('date')} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Input
            label={lang === 'id' ? 'Mulai' : 'Start'}
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
          <Input
            label={lang === 'id' ? 'Selesai' : 'End'}
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label={t('category')} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Work">{enumLabel('taskCategory', 'Work', lang)}</option>
            <option value="Finance">{enumLabel('taskCategory', 'Finance', lang)}</option>
            <option value="Personal">{enumLabel('taskCategory', 'Personal', lang)}</option>
            <option value="Health">{enumLabel('taskCategory', 'Health', lang)}</option>
          </Select>
          <Select label={lang === 'id' ? 'Pengingat' : 'Reminder'} value={reminder} onChange={(e) => setReminder(e.target.value)}>
            <option value="None">{enumLabel('reminder', 'None', lang)}</option>
            <option value="15 min before">{enumLabel('reminder', '15 min before', lang)}</option>
            <option value="1 hour before">{enumLabel('reminder', '1 hour before', lang)}</option>
            <option value="1 day before">{enumLabel('reminder', '1 day before', lang)}</option>
          </Select>
        </div>
        <Input
          label={lang === 'id' ? 'Lokasi / Tautan' : 'Location / Link'}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <Input label={t('notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit">{t('save')}</Button>
        </div>
      </form>
    </Modal>
  );
};

// --- SYSTEM & DATA MANAGEMENT MODAL ---
const SettingsModal = ({
  open,
  onClose,
  data,
  currentUser,
  t,
  onUpdateProfile,
  onExportJson,
  onImportJson,
  onResetEmpty,
  onRestoreDemo,
  onLogout,
}) => {
  const [name, setName] = useState(data.profile.name);
  const [currency, setCurrency] = useState(data.profile.currency);
  const [language, setLanguage] = useState(data.profile.language || 'id');

  useEffect(() => {
    if (open) {
      setName(data.profile.name);
      setCurrency(data.profile.currency);
      setLanguage(data.profile.language || 'id');
    }
  }, [open, data.profile]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        onImportJson(parsed);
      } catch {
        // Handled in parent
      }
    };
    reader.readAsText(file);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('settings_title')}
      subtitle={t('settings_sub')}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        <ThemeSettings lang={data?.profile?.language || 'id'} />
        <DriveBackup lang={data?.profile?.language || 'id'} data={data} onRestore={onImportJson} />
        {currentUser && (
          <div className="p-3.5 rounded-xl bg-life-bg/90 border border-life-border/50 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-life-text truncate">{currentUser.email}</p>
              <p className="text-[11px] text-life-accent font-mono truncate">
                {(data.profile.language || 'id') === 'id' ? 'ID Brankas' : 'Vault ID'}: {currentUser.workspaceKey}
              </p>
            </div>
            <Button size="sm" variant="danger" onClick={onLogout}>
              <LogOut className="w-3.5 h-3.5" /> {t('logout')}
            </Button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onUpdateProfile({
              name: name.trim() || 'Workspace Owner',
              currency,
              language,
            });
            onClose();
          }}
          className="space-y-4"
        >
          <h4 className="text-xs uppercase tracking-wider text-life-accent font-semibold">
            {t('profile_display')}
          </h4>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-life-muted">
              {t('language_label')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { code: 'id', title: 'Bahasa Indonesia', desc: 'Antarmuka & tanggal Indonesia' },
                { code: 'en', title: 'English (US)', desc: 'International English UI' },
              ].map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setLanguage(opt.code)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    language === opt.code
                      ? 'bg-life-surface2 border-life-accent text-life-text'
                      : 'bg-life-bg/80 border-life-border/45 text-life-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-life-text">{opt.title}</span>
                    {language === opt.code && <CheckCircle2 className="w-4 h-4 text-life-accent" />}
                  </div>
                  <p className="text-[11px] text-life-muted mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label={t('display_name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Select
              label={t('currency_symbol')}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="Rp">IDR (Rp)</option>
              <option value="$">USD ($)</option>
              <option value="€">EUR (€)</option>
              <option value="£">GBP (£)</option>
              <option value="¥">JPY (¥)</option>
            </Select>
          </div>
          <Button type="submit" size="sm">
            {t('save_preferences')}
          </Button>
        </form>

        <div className="pt-4 border-t border-life-border/40 space-y-3">
          <h4 className="text-xs uppercase tracking-wider text-life-soft font-semibold">
            {t('data_portability')}
          </h4>
          <div className="flex flex-wrap gap-2.5">
            <Button size="sm" variant="secondary" onClick={onExportJson}>
              <Download className="w-4 h-4" /> {t('export_json')}
            </Button>
            <label className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs rounded-xl min-h-[38px] bg-life-surface2 text-life-text border border-life-border/60 hover:border-life-accent/70 cursor-pointer">
              <Upload className="w-4 h-4" /> {t('import_json')}
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-life-border/40 space-y-3">
          <h4 className="text-xs uppercase tracking-wider text-[#D96B52] font-semibold">
            {t('workspace_reset')}
          </h4>
          <div className="flex flex-wrap gap-2.5">
            <Button size="sm" variant="danger" onClick={onResetEmpty}>
              <Trash2 className="w-4 h-4" /> {t('start_fresh')}
            </Button>
            <Button size="sm" variant="ghost" onClick={onRestoreDemo}>
              <RefreshCw className="w-4 h-4" /> {t('restore_demo')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ============================================================================
// 9. MAIN APPLICATION SHELL
// ============================================================================

function LifeOsWorkspace() {
  const { scrollToTop } = useLenisAndParallax();

  const savedRef = useRef(undefined);
  if (savedRef.current === undefined) savedRef.current = loadSavedWorkspace();
  // Pengguna baru langsung melihat layar daftar/masuk (bukan akun demo)
  const [currentUser, setCurrentUser] = useState(() => {
    const u = savedRef.current && savedRef.current.user ? savedRef.current.user : null;
    if (!u) return null;
    const norm = { ...u, baseKey: u.baseKey || baseOf(u.workspaceKey), wsId: u.wsId || MAIN_WS };
    setActiveWs(norm.wsId);
    return norm;
  });
  // Daftar ruang kerja (akun Pribadi/Bisnis) milik akun yang sedang masuk
  const [wsList, setWsList] = useState(() => {
    const u = savedRef.current && savedRef.current.user ? savedRef.current.user : null;
    return u ? readRegistry(u.baseKey || baseOf(u.workspaceKey)) : [];
  });
  const [wsSheetOpen, setWsSheetOpen] = useState(false);
  const [wsBusy, setWsBusy] = useState(false);
  const [wsDeleteId, setWsDeleteId] = useState(null); // id akun yang langsung masuk mode hapus
  const [data, setData] = useState(() =>
    savedRef.current && savedRef.current.data ? savedRef.current.data : createInitialState()
  );

  // Simpan otomatis ke perangkat setiap ada perubahan
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: currentUser, data }));
      if (currentUser?.workspaceKey) {
        localStorage.setItem(wsStoreKey(currentUser.workspaceKey), JSON.stringify(data));
      }
    } catch (err) {
      console.error('Local save failed:', err);
    }
  }, [data, currentUser]);

  // Pastikan ruang kerja aktif tercatat di daftar (nama/tipe ikut berubah bila diedit)
  const curType = typeOf(data);
  const curName = entryFromData(currentUser?.wsId || MAIN_WS, data).name;
  useEffect(() => {
    if (!currentUser?.baseKey) return;
    const entry = { id: currentUser.wsId || MAIN_WS, type: curType, name: curName };
    setWsList((prev) => {
      const next = upsert(prev, entry);
      if (next !== prev) writeRegistry(currentUser.baseKey, next);
      return next;
    });
  }, [currentUser?.baseKey, currentUser?.wsId, curType, curName]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [maskBalances, setMaskBalances] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced');

  const [txModal, setTxModal] = useState({ open: false, tx: null });
  const [taskModal, setTaskModal] = useState({ open: false, task: null, defaultDate: TODAY_STR });
  const [eventModal, setEventModal] = useState({ open: false, event: null, defaultDate: TODAY_STR });
  const [paydayModalOpen, setPaydayModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [splitBillModalOpen, setSplitBillModalOpen] = useState(false);
  const [briefingModalOpen, setBriefingModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Delete',
    onConfirm: () => {},
  });
  const [toast, setToast] = useState(null);

  const lang = data.profile.language || 'id';
  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch {
      /* abaikan */
    }
  }, [lang]);
  const t = useCallback((key) => I18N[lang]?.[key] || I18N.en[key] || key, [lang]);

  const [legacyAuth, setLegacyAuth] = useState(false);
  const notify = useCallback((message, action) => {
    const entry = { message, action };
    setToast(entry);
    setTimeout(() => {
      setToast((prev) => (prev === entry ? null : prev));
    }, action ? 6000 : 3200);
  }, []);

  const navigateTab = useCallback(
    (tabId) => {
      setActiveTab(tabId);
      scrollToTop();
    },
    [scrollToTop]
  );

  // Sinkron ke Google Drive milik pengguna sendiri (hanya akun yang masuk dengan Google).
  // Kebijakan: perubahan lokal dikirim ~4 dtk setelah berhenti mengetik; bila di perangkat lain
  // ada versi yang lebih baru dan perangkat ini tidak punya perubahan tertunda, versi cloud dipakai.
  const cloudRef = useRef({ hash: '', modified: '', busy: false });
  const cloudDataRef = useRef(data);
  cloudDataRef.current = data;
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudNeedsAuth, setCloudNeedsAuth] = useState(false);
  const isGoogle = Boolean(currentUser?.google);
  const cloudMetaKey = currentUser?.workspaceKey ? `lifeos:cloud:${currentUser.workspaceKey}` : '';
  const wsIdRef = useRef(MAIN_WS);
  wsIdRef.current = currentUser?.wsId || MAIN_WS;
  const saveCloudMeta = useCallback((c = cloudRef.current) => {
    if (!cloudMetaKey) return;
    try {
      const { hash, modified } = c;
      localStorage.setItem(cloudMetaKey, JSON.stringify({ hash, modified }));
    } catch {
      /* abaikan */
    }
  }, [cloudMetaKey]);

  const cloudPush = useCallback(
    async (interactive = false) => {
      const c = cloudRef.current;
      const snapshot = cloudDataRef.current;
      const h = hashData(snapshot);
      if (c.busy || h === c.hash) return;
      c.busy = true;
      setSyncStatus('syncing');
      try {
        const when = await backupToDrive(snapshot, { interactive, wsId: wsIdRef.current });
        c.hash = h;
        c.modified = when;
        saveCloudMeta(c);
        setCloudNeedsAuth(false);
        setSyncStatus('synced');
      } catch (e) {
        const msg = String(e?.message || e);
        const offline = /Failed to fetch|NetworkError|network|drive_http_5|drive_http_429|drive_gis_load/i.test(msg);
        setSyncStatus(offline ? 'offline' : 'auth');
        setCloudNeedsAuth(!offline);
      } finally {
        c.busy = false;
      }
    },
    [saveCloudMeta]
  );

  const cloudPull = useCallback(async () => {
    const c = cloudRef.current;
    if (c.busy) return;
    try {
      const wsId = wsIdRef.current;
      const meta = await peekCloud(false, wsId);
      if (!meta || !c.modified || new Date(meta.modifiedTime) <= new Date(c.modified)) return;
      if (hashData(cloudDataRef.current) !== c.hash) return; // ada perubahan lokal belum terkirim: versi lokal dipakai
      const res = await loadCloud(false, wsId);
      if (!res?.data?.profile || wsIdRef.current !== wsId) return;
      c.hash = hashData(res.data);
      c.modified = res.modifiedTime;
      saveCloudMeta(c);
      setData(res.data);
      setSyncStatus('synced');
    } catch {
      /* tanpa jaringan / perlu masuk ulang: dicoba lagi nanti */
    }
  }, [saveCloudMeta]);

  useEffect(() => {
    if (!isGoogle) {
      setCloudReady(false);
      return undefined;
    }
    let alive = true;
    try {
      const m = JSON.parse(localStorage.getItem(cloudMetaKey) || 'null');
      if (m) {
        cloudRef.current.hash = m.hash || '';
        cloudRef.current.modified = m.modified || '';
      }
    } catch {
      /* abaikan */
    }
    (async () => {
      await cloudPull();
      if (alive) setCloudReady(true);
    })();
    const onVis = () => !document.hidden && cloudPull();
    document.addEventListener('visibilitychange', onVis);
    const id = setInterval(cloudPull, 2 * 60 * 1000);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(id);
    };
  }, [isGoogle, cloudMetaKey, cloudPull]);

  useEffect(() => {
    if (!isGoogle || !cloudReady) return undefined;
    const timer = setTimeout(() => cloudPush(false), 4000);
    return () => clearTimeout(timer);
  }, [data, isGoogle, cloudReady, cloudPush]);

  const handleLogout = useCallback(async () => {
    if (isGoogle) {
      await cloudPush(false);
      const synced = hashData(cloudDataRef.current) === cloudRef.current.hash;
      if (synced) {
        // Semua sudah aman di Drive pengguna: hapus salinan di perangkat ini (perangkat bersama).
        // Akun lain (mis. Pribadi saat sedang di Bisnis) hanya dihapus bila salinannya sama dengan yang di cloud.
        let allGone = true;
        try {
          wsList.forEach((w) => {
            const k = keyFor(currentUser.baseKey, w.id);
            const local = readStoredJson(wsStoreKey(k));
            const meta = readStoredJson(`lifeos:cloud:${k}`);
            const safe = k === currentUser.workspaceKey || !local || (meta && hashData(local) === meta.hash);
            if (safe) {
              localStorage.removeItem(wsStoreKey(k));
              localStorage.removeItem(`lifeos:cloud:${k}`);
            } else allGone = false;
          });
          if (allGone) {
            localStorage.removeItem(wsRegKey(currentUser.baseKey));
            localStorage.removeItem(lastWsKey(currentUser.baseKey));
          }
        } catch {
          /* abaikan */
        }
        forgetDriveToken();
        setData(createEmptyState(lang));
        setWsList([]);
      }
    }
    setSettingsOpen(false);
    setWsSheetOpen(false);
    setCurrentUser(null);
  }, [isGoogle, cloudPush, currentUser, wsList, lang]);
  const askConfirm = useCallback(
    (title, message, onConfirm, confirmLabel) => {
      setConfirmState({
        open: true,
        title,
        message,
        confirmLabel: confirmLabel || (lang === 'id' ? 'Hapus' : 'Delete'),
        onConfirm: () => {
          onConfirm();
          setConfirmState((prev) => ({ ...prev, open: false }));
        },
      });
    },
    [lang]
  );

  const toggleLanguageQuick = () => {
    const nextLang = lang === 'id' ? 'en' : 'id';
    setData((prev) => ({
      ...prev,
      profile: { ...prev.profile, language: nextLang },
    }));
    notify(nextLang === 'id' ? 'Bahasa diubah ke Bahasa Indonesia' : 'Language switched to English');
  };

  // --- DERIVED REAL-TIME METRICS ---
  const derived = useMemo(() => {
    const accountBalances = {};
    data.accounts.forEach((a) => {
      accountBalances[a.id] = Number(a.initialBalance) || 0;
    });
    data.transactions.forEach((tx) => {
      if (tx.type === 'income') {
        if (accountBalances[tx.accountId] !== undefined) accountBalances[tx.accountId] += tx.amount;
      } else if (tx.type === 'expense') {
        if (accountBalances[tx.accountId] !== undefined) accountBalances[tx.accountId] -= tx.amount;
      } else if (tx.type === 'transfer') {
        if (accountBalances[tx.accountId] !== undefined) accountBalances[tx.accountId] -= tx.amount;
        if (tx.toAccountId && accountBalances[tx.toAccountId] !== undefined) {
          accountBalances[tx.toAccountId] += tx.amount;
        }
      }
    });

    const walletNetWorth = Object.values(accountBalances).reduce((s, v) => s + v, 0);
    const totalInvestmentValue = (data.investments || []).reduce(
      (s, inv) => s + (Number(inv.currentValue) || 0),
      0
    );
    // Dana di brankas tabungan yang bersumber dari akun tetap bagian dari kekayaan bersih
    const totalVaultLinked = (data.savingsGoals || []).reduce(
      (sum, sg) => sum + sg.contributions.reduce((s, c) => s + (c.accountId ? Number(c.amount) || 0 : 0), 0),
      0
    );
    const totalNetWorth = walletNetWorth + totalInvestmentValue + totalVaultLinked;

    const monthTxs = data.transactions.filter((tx) => tx.date.startsWith(CURRENT_MONTH));
    const monthlyIncome = monthTxs
      .filter((tx) => tx.type === 'income')
      .reduce((s, tx) => s + tx.amount, 0);
    const monthlyExpenses = monthTxs
      .filter((tx) => tx.type === 'expense')
      .reduce((s, tx) => s + tx.amount, 0);

    const catMap = {};
    monthTxs
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
      });
    const categoryBreakdown = Object.entries(catMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    const currentBudgets = effectiveBudgets(data.budgets, CURRENT_MONTH);
    const totalBudgetLimit = currentBudgets.reduce((s, b) => s + b.limit, 0);
    const totalBudgetSpent = currentBudgets.reduce((s, b) => s + (catMap[b.category] || 0), 0);
    const totalBudgetRemaining = totalBudgetLimit - totalBudgetSpent;
    const budgetUtilizationPct =
      totalBudgetLimit > 0 ? (totalBudgetSpent / totalBudgetLimit) * 100 : 0;

    const monthKeys = [...new Set(data.transactions.map((tx) => tx.date.slice(0, 7)))].sort();
    const monthlySeries = (monthKeys.length ? monthKeys : [CURRENT_MONTH]).map((mk) => {
      const txs = data.transactions.filter((tx) => tx.date.startsWith(mk));
      const inc = txs.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
      const exp = txs.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);
      const [y, m] = mk.split('-').map(Number);
      const label = new Date(y, m - 1, 1).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
        month: 'short',
      });
      return { month: mk, label, income: inc, expenses: exp };
    });

    const totalMilestones = data.goals.reduce((s, g) => s + g.milestones.length, 0);
    const completedMilestones = data.goals.reduce(
      (s, g) => s + g.milestones.filter((m) => m.completed).length,
      0
    );
    const overallGoalPct = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    return {
      accountBalances,
      walletNetWorth,
      totalInvestmentValue,
      totalVaultLinked,
      totalNetWorth,
      monthlyIncome,
      monthlyExpenses,
      categoryBreakdown,
      totalBudgetLimit,
      totalBudgetSpent,
      totalBudgetRemaining,
      budgetUtilizationPct,
      monthlySeries,
      overallGoalPct,
    };
  }, [data, lang]);

  // --- CRUD HANDLERS ---
  const handleSaveTx = (rawPayload) => {
    const { saveAsTemplate, makeRecurring, ...txPayload } = rawPayload;
    if (saveAsTemplate && txPayload.type !== 'transfer') {
      setData((prev) => ({
        ...prev,
        templates: [
          ...(prev.templates || []),
          {
            id: newId('tpl'),
            name: saveAsTemplate,
            type: txPayload.type,
            category: txPayload.category,
            accountId: txPayload.accountId,
            paymentMethod: txPayload.paymentMethod,
            description: txPayload.description,
            amount: txPayload.amount,
            items: txPayload.items || [],
            notes: txPayload.notes || '',
            useCount: 0,
            lastUsed: '',
          },
        ],
      }));
    }
    if (makeRecurring && !txPayload.id && txPayload.type !== 'transfer') {
      const day = Number(String(txPayload.date).slice(8, 10)) || 1;
      setData((prev) => ({
        ...prev,
        recurring: [
          ...(prev.recurring || []),
          {
            id: newId('rec'),
            active: true,
            type: txPayload.type,
            name: txPayload.description,
            amount: txPayload.amount,
            category: txPayload.category,
            accountId: txPayload.accountId,
            frequency: 'monthly',
            dayOfMonth: day,
            startDate: txPayload.date,
            endDate: '',
            paymentMethod: 'Auto / Recurring',
            notes: txPayload.notes || '',
            // kejadian pada tanggal ini sudah dicatat manual; mulai dari bulan berikutnya
            lastRun: txPayload.date,
          },
        ],
      }));
    }
    setData((prev) => {
      if (txPayload.id) {
        const old = prev.transactions.find((tx) => tx.id === txPayload.id);
        // Transaksi tabungan/investasi tetap berupa potongan saldo; jumlah & akun disinkronkan ke brankas/aset
        if (old && (old.savingsContribId || old.investmentId)) {
          const merged = { ...old, amount: txPayload.amount, date: txPayload.date, accountId: txPayload.accountId, notes: txPayload.notes };
          return {
            ...prev,
            transactions: prev.transactions.map((tx) => (tx.id === old.id ? merged : tx)),
            savingsGoals: old.savingsContribId
              ? prev.savingsGoals.map((sg) =>
                  sg.id === old.savingsGoalId
                    ? {
                        ...sg,
                        contributions: sg.contributions.map((c) =>
                          c.id === old.savingsContribId
                            ? { ...c, amount: merged.amount, date: merged.date, accountId: merged.accountId }
                            : c
                        ),
                      }
                    : sg
                )
              : prev.savingsGoals,
            investments: old.investmentId
              ? (prev.investments || []).map((inv) =>
                  inv.id === old.investmentId
                    ? { ...inv, investedAmount: merged.amount, accountId: merged.accountId }
                    : inv
                )
              : prev.investments,
          };
        }
        return {
          ...prev,
          transactions: prev.transactions.map((tx) => (tx.id === txPayload.id ? txPayload : tx)),
        };
      }
      const { fundFromVaultId, ...cleanPayload } = txPayload;
      const newTx = { ...cleanPayload, id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` };
      const goal = fundFromVaultId ? prev.savingsGoals.find((sg) => sg.id === fundFromVaultId) : null;
      if (goal && newTx.type === 'expense') {
        // Hitung saldo akun saat ini, lalu tarik dari tabungan sebesar kekurangannya (maks. isi brankas)
        let bal = Number(prev.accounts.find((a) => a.id === newTx.accountId)?.initialBalance) || 0;
        prev.transactions.forEach((tx) => {
          if (tx.accountId === newTx.accountId) bal += tx.type === 'income' ? tx.amount : -tx.amount;
          if (tx.type === 'transfer' && tx.toAccountId === newTx.accountId) bal += tx.amount;
        });
        const saved = goal.contributions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
        const draw = Math.min(Math.max(0, newTx.amount - bal), saved);
        if (draw > 0) {
          const contribId = `sc-${Date.now()}-w`;
          const note = lang === 'id' ? 'Penarikan untuk pengeluaran' : 'Withdrawal for an expense';
          const withdrawTx = {
            ...buildVaultTx(goal.name, goal.id, contribId, -draw, note, newTx.accountId),
            description: `${lang === 'id' ? 'Tarik tabungan' : 'Savings withdrawal'}: ${goal.name}`,
          };
          return {
            ...prev,
            savingsGoals: prev.savingsGoals.map((sg) =>
              sg.id === goal.id
                ? { ...sg, contributions: [...sg.contributions, { id: contribId, amount: -draw, date: TODAY_STR, note, accountId: newTx.accountId }] }
                : sg
            ),
            transactions: [newTx, withdrawTx, ...prev.transactions],
          };
        }
      }
      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
      };
    });
    notify(lang === 'id' ? 'Transaksi berhasil dicatat' : 'Transaction saved');
  };

  const handleSaveWellnessLog = (entry) => {
    setData((prev) => {
      const logs = prev.wellnessLogs || [];
      const exists = logs.some((w) => w.date === entry.date);
      return {
        ...prev,
        wellnessLogs: exists
          ? logs.map((w) => (w.date === entry.date ? entry : w))
          : [...logs, entry],
      };
    });
    notify(
      lang === 'id'
        ? `Log kesehatan (${entry.date}) tersimpan`
        : `Wellness log (${entry.date}) saved`
    );
  };

  const handleAddContact = (contact) => {
    setData((prev) => ({
      ...prev,
      contacts: [{ ...contact, id: `cnt-${Date.now()}` }, ...(prev.contacts || [])],
    }));
    notify(lang === 'id' ? `Relasi ditambahkan: ${contact.name}` : `Contact added: ${contact.name}`);
  };

  const handleLogContactToday = (contactId) => {
    setData((prev) => ({
      ...prev,
      contacts: (prev.contacts || []).map((c) =>
        c.id === contactId ? { ...c, lastContacted: TODAY_STR } : c
      ),
    }));
    notify(
      lang === 'id'
        ? 'Silaturahmi hari ini tercatat'
        : 'Logged check-in for today'
    );
  };

  const handleDeleteContact = (contact) => {
    askConfirm(
      lang === 'id' ? 'Hapus Kontak Relasi' : 'Delete Contact',
      lang === 'id' ? `Hapus "${contact.name}" dari Personal CRM?` : `Remove "${contact.name}"?`,
      () => {
        setData((prev) => ({
          ...prev,
          contacts: (prev.contacts || []).filter((c) => c.id !== contact.id),
        }));
        notify(lang === 'id' ? 'Kontak dihapus' : 'Contact removed');
      }
    );
  };

  const handleExecutePaydaySplit = (splits) => {
    const newTxs = splits.map((sp, idx) => ({
      id: `tx-split-${Date.now()}-${idx}`,
      type: 'income',
      amount: sp.amount,
      date: TODAY_STR,
      category: 'Primary Salary',
      description: `${lang === 'id' ? 'Alokasi Gaji' : 'Payday Split'} (${sp.pct}%) — ${sp.accountName}`,
      accountId: sp.accountId,
      paymentMethod: 'Payday Splitter',
      notes: 'Auto-allocated payroll distribution',
    }));
    setData((prev) => ({
      ...prev,
      transactions: [...newTxs, ...prev.transactions],
    }));
    notify(
      lang === 'id'
        ? `Gaji dialokasikan ke ${splits.length} akun dompet`
        : `Payday allocated across ${splits.length} accounts`
    );
  };

  const handleExecuteSplitBill = ({ title, totalAmount, accountId, logTotalExpense, participants }) => {
    const newReceivables = participants.map((p, idx) => ({
      id: `dbt-split-${Date.now()}-${idx}`,
      title: `${lang === 'id' ? 'Bagi Tagihan' : 'Split Bill'}: ${title} (${p.name})`,
      counterparty: p.name,
      kind: 'receivable',
      totalAmount: p.amount,
      paidAmount: 0,
      monthlyAmount: p.amount,
      tenorMonths: 1,
      dueDate: TODAY_STR,
      accountId,
      notes: `${lang === 'id' ? 'Dibuat otomatis dari Bagi Tagihan' : 'Auto-generated from Split Bill'}: ${title}`,
    }));

    setData((prev) => ({
      ...prev,
      debts: [...newReceivables, ...(prev.debts || [])],
      transactions: logTotalExpense
        ? [
            {
              id: `tx-sb-${Date.now()}`,
              type: 'expense',
              amount: totalAmount,
              date: TODAY_STR,
              category: 'Dining & Coffee',
              description: `${lang === 'id' ? 'Bagi Tagihan' : 'Split Bill'}: ${title}`,
              accountId,
              paymentMethod: 'Split Bill / Card',
              notes: `${lang === 'id' ? 'Dibagi dengan' : 'Shared with'} ${participants.map((p) => p.name).join(', ')}`,
            },
            ...prev.transactions,
          ]
        : prev.transactions,
    }));

    notify(
      lang === 'id'
        ? `Bagi tagihan dicatat & ${participants.length} piutang teman dibuat`
        : `Split bill logged & ${participants.length} receivables created`
    );
  };

  const handleAddInvestment = (asset) => {
    const { accountId, ...rest } = asset;
    const id = `inv-${Date.now()}`;
    const linked = Boolean(accountId) && rest.investedAmount > 0;
    setData((prev) => ({
      ...prev,
      investments: [...(prev.investments || []), { ...rest, id, accountId: linked ? accountId : undefined }],
      // Pembelian aset memotong saldo akun sumber (transfer, bukan pengeluaran)
      transactions: linked
        ? [
            {
              id: `tx-inv-${id}`,
              type: 'transfer',
              amount: rest.investedAmount,
              date: TODAY_STR,
              category: 'Investments',
              description: `${lang === 'id' ? 'Beli aset' : 'Buy asset'}: ${rest.name}`,
              accountId,
              investmentId: id,
              paymentMethod: 'Internal Ledger Transfer',
              notes: '',
            },
            ...prev.transactions,
          ]
        : prev.transactions,
    }));
    notify(lang === 'id' ? `Aset investasi ditambahkan: ${asset.name}` : `Added asset: ${asset.name}`);
  };

  const handleUpdateInvestmentValue = (assetId, newVal) => {
    setData((prev) => ({
      ...prev,
      investments: (prev.investments || []).map((item) =>
        item.id === assetId ? { ...item, currentValue: newVal, updatedAt: TODAY_STR } : item
      ),
    }));
    notify(lang === 'id' ? 'Nilai pasar investasi diperbarui' : 'Market value updated');
  };

  const handleDeleteInvestment = (asset) => {
    askConfirm(
      lang === 'id' ? 'Hapus Aset Investasi' : 'Delete Investment Asset',
      lang === 'id'
        ? `Hapus "${asset.name}" dari portofolio?${asset.accountId ? ' Dana pembelian dikembalikan ke akun asal.' : ''}`
        : `Remove "${asset.name}"?${asset.accountId ? ' The purchase amount returns to the source account.' : ''}`,
      () => {
        setData((prev) => ({
          ...prev,
          investments: (prev.investments || []).filter((item) => item.id !== asset.id),
          transactions: prev.transactions.filter((tx) => tx.investmentId !== asset.id),
        }));
        notify(lang === 'id' ? 'Aset investasi dihapus' : 'Asset removed');
      }
    );
  };

  const handleDeleteTx = (tx) => {
    askConfirm(
      lang === 'id' ? 'Hapus Transaksi' : 'Delete Transaction',
      lang === 'id'
        ? `Hapus "${tx.description}" (${formatMoney(tx.amount, data.profile.currency)}) dari buku kas?`
        : `Remove "${tx.description}" (${formatMoney(tx.amount, data.profile.currency)}) from your ledger?`,
      () => {
        setData((prev) => ({
          ...prev,
          transactions: prev.transactions.filter((item) => item.id !== tx.id),
          savingsGoals: tx.savingsContribId
            ? prev.savingsGoals.map((sg) =>
                sg.id === tx.savingsGoalId
                  ? { ...sg, contributions: sg.contributions.filter((c) => c.id !== tx.savingsContribId) }
                  : sg
              )
            : prev.savingsGoals,
        }));
        notify(lang === 'id' ? 'Transaksi dihapus' : 'Transaction removed');
      }
    );
  };

  const handleAddAccount = (acc) => {
    setData((prev) => ({
      ...prev,
      accounts: [...prev.accounts, { ...acc, id: `acc-${Date.now()}` }],
    }));
    notify(lang === 'id' ? `Akun ditambahkan: ${acc.name}` : `Added account: ${acc.name}`);
  };

  const handleAddCustomCategory = (kind, catName) => {
    setData((prev) => {
      if (kind === 'income') {
        return {
          ...prev,
          customIncomeCategories: [...new Set([...prev.customIncomeCategories, catName])],
        };
      }
      return {
        ...prev,
        customExpenseCategories: [...new Set([...prev.customExpenseCategories, catName])],
      };
    });
    notify(lang === 'id' ? `Kategori ditambahkan: ${catName}` : `Added category: ${catName}`);
  };

  const handleDeleteCustomCategory = (kind, catName) => {
    const key = kind === 'income' ? 'customIncomeCategories' : 'customExpenseCategories';
    setData((prev) => ({ ...prev, [key]: (prev[key] || []).filter((c) => c !== catName) }));
    notify(lang === 'id' ? `Kategori dihapus: ${catName}` : `Deleted category: ${catName}`);
  };

  // Ganti nama kategori buatan sendiri; transaksi & anggaran lama ikut diperbarui
  const handleRenameCustomCategory = (kind, from, to) => {
    const key = kind === 'income' ? 'customIncomeCategories' : 'customExpenseCategories';
    setData((prev) => ({
      ...prev,
      [key]: (prev[key] || []).map((c) => (c === from ? to : c)),
      transactions: prev.transactions.map((tx) => (tx.category === from ? { ...tx, category: to } : tx)),
      budgets: (prev.budgets || []).map((b) => (b.category === from ? { ...b, category: to } : b)),
    }));
    notify(lang === 'id' ? `Kategori diubah: ${to}` : `Renamed category: ${to}`);
  };

  const handleUpdateProfileQuiet = (patch) => {
    setData((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
    if (patch.name || patch.currency) notify(lang === 'id' ? 'Profil disimpan' : 'Profile saved');
    else if (patch.avatar !== undefined) notify(lang === 'id' ? 'Foto profil diperbarui' : 'Profile photo updated');
  };

  const handleSaveBudget = (bud) => {
    setData((prev) => {
      const existing = prev.budgets.find(
        (b) => b.id === bud.id || (b.category === bud.category && b.month === bud.month)
      );
      if (existing && existing.month === bud.month) {
        return {
          ...prev,
          budgets: prev.budgets.map((b) =>
            b.id === existing.id ? { ...existing, category: bud.category, limit: bud.limit } : b
          ),
        };
      }
      return {
        ...prev,
        budgets: [...prev.budgets, { ...bud, id: `bud-${Date.now()}` }],
      };
    });
    notify(lang === 'id' ? `Anggaran disimpan: ${bud.category}` : `Budget saved: ${bud.category}`);
  };

  const handleDeleteBudget = (bud) => {
    askConfirm(
      lang === 'id' ? 'Hapus Anggaran' : 'Remove Budget',
      lang === 'id' ? `Hapus batas anggaran ${bud.category}?` : `Delete budget for ${bud.category}?`,
      () => {
        setData((prev) => ({
          ...prev,
          budgets: prev.budgets.filter((b) => b.id !== bud.id),
        }));
        notify(lang === 'id' ? 'Anggaran dihapus' : 'Budget removed');
      }
    );
  };

  // Setoran tabungan selalu memotong saldo akun sumber lewat transaksi transfer (tercatat di buku kas)
  const buildVaultTx = (goalName, goalId, contribId, amount, note, accountId) => ({
    id: `tx-sv-${contribId}`,
    type: 'transfer',
    amount,
    date: TODAY_STR,
    category: 'Vault Allocation',
    description: `${lang === 'id' ? 'Tabungan' : 'Savings'}: ${goalName}`,
    accountId,
    savingsGoalId: goalId,
    savingsContribId: contribId,
    paymentMethod: 'Internal Ledger Transfer',
    notes: note || '',
  });

  const handleCreateSavingsGoal = ({ name, targetAmount, targetDate, initialSaved, accountId }) => {
    const stamp = Date.now();
    const goalId = `sav-${stamp}`;
    const hasInitial = initialSaved > 0 && accountId;
    const contribId = `sc-${stamp}`;
    const note = lang === 'id' ? 'Setoran awal' : 'Opening deposit';
    const contributions = hasInitial
      ? [{ id: contribId, amount: initialSaved, date: TODAY_STR, note, accountId }]
      : [];
    setData((prev) => ({
      ...prev,
      savingsGoals: [...prev.savingsGoals, { id: goalId, name, targetAmount, targetDate, contributions }],
      transactions: hasInitial
        ? [buildVaultTx(name, goalId, contribId, initialSaved, note, accountId), ...prev.transactions]
        : prev.transactions,
    }));
    notify(lang === 'id' ? `Brankas dibuat: ${name}` : `Created savings vault: ${name}`);
  };

  const handleAddContribution = (goalId, amount, note, accountId) => {
    const contribId = `sc-${Date.now()}`;
    setData((prev) => {
      const goal = prev.savingsGoals.find((sg) => sg.id === goalId);
      if (!goal || !accountId) return prev;
      return {
        ...prev,
        savingsGoals: prev.savingsGoals.map((sg) =>
          sg.id === goalId
            ? {
                ...sg,
                contributions: [...sg.contributions, { id: contribId, amount, date: TODAY_STR, note, accountId }],
              }
            : sg
        ),
        transactions: [buildVaultTx(goal.name, goalId, contribId, amount, note, accountId), ...prev.transactions],
      };
    });
    notify(lang === 'id' ? 'Setoran tabungan dicatat & saldo akun dipotong' : 'Deposit logged and account debited');
  };

  const handleDeleteSavingsGoal = (sg) => {
    const linked = sg.contributions.filter((c) => c.accountId).reduce((sum, c) => sum + c.amount, 0);
    askConfirm(
      lang === 'id' ? 'Hapus Target Tabungan' : 'Delete Savings Vault',
      lang === 'id'
        ? `Hapus "${sg.name}"?${linked > 0 ? ` Dana ${formatMoney(linked, data.profile.currency)} dikembalikan ke akun asal.` : ''}`
        : `Remove "${sg.name}"?${linked > 0 ? ` ${formatMoney(linked, data.profile.currency)} returns to the source accounts.` : ''}`,
      () => {
        setData((prev) => ({
          ...prev,
          savingsGoals: prev.savingsGoals.filter((item) => item.id !== sg.id),
          transactions: prev.transactions.filter((tx) => tx.savingsGoalId !== sg.id),
        }));
        notify(lang === 'id' ? 'Target tabungan dihapus' : 'Savings vault deleted');
      }
    );
  };

  const handleAddSub = (sub) => {
    setData((prev) => ({
      ...prev,
      subscriptions: [...(prev.subscriptions || []), { ...sub, id: `sub-${Date.now()}` }],
    }));
    notify(lang === 'id' ? `Tagihan ditambahkan: ${sub.name}` : `Added recurring bill: ${sub.name}`);
  };

  const handlePaySub = (sub) => {
    setData((prev) => ({
      ...prev,
      subscriptions: (prev.subscriptions || []).map((item) =>
        item.id === sub.id ? { ...item, lastPaidMonth: CURRENT_MONTH } : item
      ),
      transactions: [
        {
          id: `tx-${Date.now()}`,
          type: 'expense',
          amount: sub.amount,
          date: TODAY_STR,
          category: sub.category,
          description: `${lang === 'id' ? 'Tagihan Rutin' : 'Recurring Bill'}: ${sub.name}`,
          accountId: sub.accountId || prev.accounts[0]?.id,
          paymentMethod: 'Auto / Recurring',
          notes: `Paid for ${CURRENT_MONTH}`,
        },
        ...prev.transactions,
      ],
    }));
    notify(
      lang === 'id'
        ? `Tagihan "${sub.name}" dibayar & tercatat di dompet`
        : `Paid & logged "${sub.name}" to wallet`
    );
  };

  const handleDeleteSub = (sub) => {
    askConfirm(
      lang === 'id' ? 'Hapus Tagihan Rutin' : 'Delete Recurring Bill',
      lang === 'id' ? `Hapus "${sub.name}" dari daftar tagihan?` : `Remove "${sub.name}"?`,
      () => {
        setData((prev) => ({
          ...prev,
          subscriptions: (prev.subscriptions || []).filter((item) => item.id !== sub.id),
        }));
        notify(lang === 'id' ? 'Tagihan dihapus' : 'Recurring bill removed');
      }
    );
  };

  const handleAddDebt = (debt) => {
    setData((prev) => ({
      ...prev,
      debts: [...(prev.debts || []), { ...debt, id: `dbt-${Date.now()}` }],
    }));
    notify(lang === 'id' ? `Catatan ditambahkan: ${debt.title}` : `Added: ${debt.title}`);
  };

  const handleSettleDebtInstallment = (debtItem, requestedAmount) => {
    const isDebt = debtItem.kind === 'debt';
    // Jangan bayar melebihi sisa utang (cicilan terakhir bisa lebih kecil dari cicilan bulanan)
    const stepAmount = Math.min(requestedAmount, debtItem.totalAmount - debtItem.paidAmount);
    if (!(stepAmount > 0)) return;
    setData((prev) => ({
      ...prev,
      debts: (prev.debts || []).map((d) =>
        d.id === debtItem.id
          ? {
              ...d,
              paidAmount: Math.min(d.totalAmount, d.paidAmount + stepAmount),
              dueDate:
                d.totalAmount - d.paidAmount - stepAmount > 0 && d.dueDate ? advanceMonth(d.dueDate) : d.dueDate,
            }
          : d
      ),
      transactions: [
        {
          id: `tx-dbt-${Date.now()}`,
          type: isDebt ? 'expense' : 'income',
          amount: stepAmount,
          date: TODAY_STR,
          category: isDebt ? 'Debt & Installments' : 'Other Income',
          description: `${isDebt ? (lang === 'id' ? 'Bayar Cicilan' : 'Installment Payment') : (lang === 'id' ? 'Terima Piutang' : 'Receivable Payment')}: ${debtItem.title}`,
          accountId: debtItem.accountId || prev.accounts[0]?.id,
          paymentMethod: 'Ledger Settlement',
          notes: debtItem.counterparty,
          ...(debtItem.saleId ? { biz: 'ar_collect', refId: debtItem.saleId } : {}),
        },
        ...prev.transactions,
      ],
    }));
    notify(
      isDebt
        ? lang === 'id'
          ? 'Cicilan dibayar & saldo dompet diperbarui'
          : 'Installment paid & wallet updated'
        : lang === 'id'
        ? 'Pembayaran piutang dicatat ke dompet'
        : 'Receivable payment recorded'
    );
  };

  const handleDeleteDebt = (debtItem) => {
    askConfirm(
      lang === 'id' ? 'Hapus Catatan' : 'Delete Record',
      lang === 'id' ? `Hapus "${debtItem.title}"?` : `Remove "${debtItem.title}"?`,
      () => {
        setData((prev) => ({
          ...prev,
          debts: (prev.debts || []).filter((d) => d.id !== debtItem.id),
        }));
        notify(lang === 'id' ? 'Catatan dihapus' : 'Record removed');
      }
    );
  };

  const handleSaveTask = (taskPayload) => {
    setData((prev) => {
      if (taskPayload.id) {
        return {
          ...prev,
          tasks: prev.tasks.map((tk) => (tk.id === taskPayload.id ? taskPayload : tk)),
        };
      }
      return {
        ...prev,
        tasks: [{ ...taskPayload, id: `tsk-${Date.now()}` }, ...prev.tasks],
      };
    });
    notify(lang === 'id' ? 'Tugas disimpan' : 'Task saved');
  };

  const handleToggleTask = (taskId) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((tk) =>
        tk.id === taskId
          ? { ...tk, status: tk.status === 'completed' ? 'todo' : 'completed' }
          : tk
      ),
    }));
  };

  const handleUpdateTaskStatus = (taskId, status) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((tk) => (tk.id === taskId ? { ...tk, status } : tk)),
    }));
  };

  const handleToggleTopPriority = (taskId) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((tk) =>
        tk.id === taskId ? { ...tk, isTopPriority: !tk.isTopPriority } : tk
      ),
    }));
  };

  const handleDeleteTask = (task) => {
    askConfirm(
      lang === 'id' ? 'Hapus Tugas' : 'Delete Task',
      lang === 'id' ? `Hapus "${task.title}"?` : `Delete "${task.title}"?`,
      () => {
        setData((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((tk) => tk.id !== task.id),
        }));
        notify(lang === 'id' ? 'Tugas dihapus' : 'Task deleted');
      }
    );
  };

  const handleSaveEvent = (evPayload) => {
    setData((prev) => {
      if (evPayload.id) {
        return {
          ...prev,
          events: prev.events.map((e) => (e.id === evPayload.id ? evPayload : e)),
        };
      }
      return {
        ...prev,
        events: [...prev.events, { ...evPayload, id: `evt-${Date.now()}` }],
      };
    });
    notify(lang === 'id' ? 'Agenda disimpan' : 'Event saved');
  };

  const handleDeleteEvent = (ev) => {
    askConfirm(
      lang === 'id' ? 'Hapus Agenda' : 'Delete Event',
      lang === 'id' ? `Hapus "${ev.title}" dari kalender?` : `Remove "${ev.title}"?`,
      () => {
        setData((prev) => ({
          ...prev,
          events: prev.events.filter((e) => e.id !== ev.id),
        }));
        notify(lang === 'id' ? 'Agenda dihapus' : 'Event deleted');
      }
    );
  };

  const handleToggleHabitDate = (habitId, dateStr) => {
    setData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== habitId) return h;
        const exists = h.completedDates.includes(dateStr);
        return {
          ...h,
          completedDates: exists
            ? h.completedDates.filter((d) => d !== dateStr)
            : [...h.completedDates, dateStr],
        };
      }),
    }));
  };

  const handleCreateHabit = (habit) => {
    setData((prev) => ({
      ...prev,
      habits: [...prev.habits, { ...habit, id: `hab-${Date.now()}`, completedDates: [] }],
    }));
    notify(lang === 'id' ? `Kebiasaan dibuat: ${habit.name}` : `Created habit: ${habit.name}`);
  };

  const handleDeleteHabit = (habit) => {
    askConfirm(
      lang === 'id' ? 'Hapus Kebiasaan' : 'Delete Habit',
      lang === 'id' ? `Hapus "${habit.name}"?` : `Remove "${habit.name}"?`,
      () => {
        setData((prev) => ({
          ...prev,
          habits: prev.habits.filter((h) => h.id !== habit.id),
        }));
        notify(lang === 'id' ? 'Kebiasaan dihapus' : 'Habit deleted');
      }
    );
  };

  const handleCreateGoal = (goal) => {
    setData((prev) => ({
      ...prev,
      goals: [...prev.goals, { ...goal, id: `gol-${Date.now()}`, status: 'Active' }],
    }));
    notify(lang === 'id' ? `Target dibuat: ${goal.title}` : `Created goal: ${goal.title}`);
  };

  const handleToggleMilestone = (goalId, msId) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: g.milestones.map((m) =>
                m.id === msId ? { ...m, completed: !m.completed } : m
              ),
            }
          : g
      ),
    }));
  };

  const handleAddMilestone = (goalId, title) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === goalId
          ? {
              ...g,
              milestones: [...g.milestones, { id: `ms-${Date.now()}`, title, completed: false }],
            }
          : g
      ),
    }));
    notify(lang === 'id' ? 'Milestone ditambahkan' : 'Milestone added');
  };

  const handleDeleteGoal = (goal) => {
    askConfirm(
      lang === 'id' ? 'Hapus Target' : 'Delete Goal',
      lang === 'id' ? `Hapus "${goal.title}"?` : `Delete "${goal.title}"?`,
      () => {
        setData((prev) => ({
          ...prev,
          goals: prev.goals.filter((g) => g.id !== goal.id),
        }));
        notify(lang === 'id' ? 'Target dihapus' : 'Goal deleted');
      }
    );
  };

  const handleSaveNote = (notePayload) => {
    const timestamp = new Date().toISOString();
    if (notePayload.id) {
      setData((prev) => ({
        ...prev,
        notes: prev.notes.map((n) =>
          n.id === notePayload.id ? { ...notePayload, updatedAt: timestamp } : n
        ),
      }));
      return notePayload;
    }
    const created = { ...notePayload, id: `not-${Date.now()}`, updatedAt: timestamp };
    setData((prev) => ({
      ...prev,
      notes: [created, ...prev.notes],
    }));
    notify(lang === 'id' ? 'Catatan dibuat' : 'Entry created');
    return created;
  };

  const handleTogglePinNote = (noteId) => {
    setData((prev) => ({
      ...prev,
      notes: prev.notes.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n)),
    }));
  };

  const handleDeleteNote = (note) => {
    askConfirm(
      lang === 'id' ? 'Hapus Catatan' : 'Delete Entry',
      lang === 'id' ? `Hapus "${note.title}" secara permanen?` : `Delete "${note.title}" permanently?`,
      () => {
        setData((prev) => ({
          ...prev,
          notes: prev.notes.filter((n) => n.id !== note.id),
        }));
        notify(lang === 'id' ? 'Catatan dihapus' : 'Entry deleted');
      }
    );
  };

  const handleCreateShoppingList = (name) => {
    const created = { id: `shp-${Date.now()}`, name, items: [] };
    setData((prev) => ({
      ...prev,
      shoppingLists: [...prev.shoppingLists, created],
    }));
    notify(lang === 'id' ? `Daftar dibuat: ${name}` : `Created list: ${name}`);
    return created;
  };

  const handleAddShoppingItem = (listId, item) => {
    setData((prev) => ({
      ...prev,
      shoppingLists: prev.shoppingLists.map((l) =>
        l.id === listId ? { ...l, items: [...l.items, { ...item, id: `si-${Date.now()}` }] } : l
      ),
    }));
  };

  const handleToggleShoppingItem = (listId, itemId) => {
    setData((prev) => ({
      ...prev,
      shoppingLists: prev.shoppingLists.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: l.items.map((i) => (i.id === itemId ? { ...i, purchased: !i.purchased } : i)),
            }
          : l
      ),
    }));
  };

  const handleDeleteShoppingItem = (listId, itemId) => {
    setData((prev) => ({
      ...prev,
      shoppingLists: prev.shoppingLists.map((l) =>
        l.id === listId ? { ...l, items: l.items.filter((i) => i.id !== itemId) } : l
      ),
    }));
  };

  const handleLogShoppingAsExpense = (listName, amount, accountId, listId, newLoggedTotal) => {
    const defaultAcc = accountId || data.accounts[0]?.id || '';
    if (!defaultAcc) {
      notify(lang === 'id' ? 'Buat akun dompet dulu' : 'Create a wallet account first');
      return;
    }
    // Tandai total yang sudah dicatat agar tidak tercatat dua kali
    setData((prev) => ({
      ...prev,
      shoppingLists: prev.shoppingLists.map((l) => (l.id === listId ? { ...l, loggedAmount: newLoggedTotal } : l)),
    }));
    handleSaveTx({
      type: 'expense',
      amount,
      date: TODAY_STR,
      category: 'Groceries',
      description: `${lang === 'id' ? 'Belanja' : 'Shopping'}: ${listName}`,
      accountId: defaultAcc,
      paymentMethod: 'Card / Wallet',
      notes: 'Synced from Shopping List',
    });
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-os-backup-${TODAY_STR}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify(lang === 'id' ? 'Cadangan JSON diekspor' : 'JSON backup exported');
  };

  const handleImportJson = (parsed) => {
    if (parsed && Array.isArray(parsed.accounts) && Array.isArray(parsed.transactions)) {
      const base = createEmptyState(lang, parsed.profile?.name || '');
      setData({ ...base, ...parsed, profile: { ...base.profile, ...(parsed.profile || {}) } });
      setSettingsOpen(false);
      notify(lang === 'id' ? 'Data berhasil dipulihkan dari JSON' : 'Workspace restored from JSON');
    } else {
      notify(lang === 'id' ? 'Format file JSON tidak valid' : 'Invalid JSON backup format');
    }
  };

  const handleExportCsv = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'PaymentMethod', 'Notes'];
    const rows = data.transactions.map((tx) =>
      [
        tx.date,
        tx.type,
        `"${tx.category.replace(/"/g, '""')}"`,
        `"${tx.description.replace(/"/g, '""')}"`,
        tx.amount,
        `"${(tx.paymentMethod || '').replace(/"/g, '""')}"`,
        `"${(tx.notes || '').replace(/"/g, '""')}"`,
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-os-ledger-${TODAY_STR}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify(lang === 'id' ? 'Buku kas diekspor ke CSV' : 'Ledger exported to CSV');
  };

  const handleResetEmpty = () => {
    askConfirm(
      t('start_fresh'),
      lang === 'id'
        ? 'Seluruh akun, transaksi, anggaran, tugas, kebiasaan, dan catatan akan dihapus untuk memulai dari nol.'
        : 'All accounts, transactions, budgets, tasks, habits, and notes will be cleared.',
      () => {
        setData(createWorkspaceFromSetup(lang, data.profile.name, { type: data.profile.ledgerType, name: data.profile.name }));
        setSettingsOpen(false);
        notify(lang === 'id' ? 'Ruang kerja dikosongkan' : 'Workspace cleared');
      },
      t('delete')
    );
  };

  const handleRestoreDemo = () => {
    const fresh = createInitialState();
    fresh.profile.language = lang;
    fresh.profile.name = data.profile.name;
    setData(fresh);
    setSettingsOpen(false);
    notify(lang === 'id' ? 'Data referensi dipulihkan' : 'Reference dataset restored');
  };

  // =========================================================================
  // FITUR BARU: berulang, anggaran, pengingat, kunci, cadangan otomatis, favorit
  // =========================================================================
  const tr = useMemo(() => makeTr(lang), [lang]);
  const dataRef = useRef(data);
  dataRef.current = data;

  const [searchOpen, setSearchOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [weeklyOpen, setWeeklyOpen] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(loadNotifPrefs);
  const [lockCfg, setLockCfg] = useState(loadLock);
  const [locked, setLocked] = useState(() => loadLock().enabled);
  const [covered, setCovered] = useState(false);
  const hiddenAtRef = useRef(0);

  const updateNotifPrefs = useCallback((next) => {
    setNotifPrefs(next);
    saveNotifPrefs(next);
    if (!next.enabled) cancelAllReminders();
  }, []);

  // 1) Transaksi berulang: catat semua yang jatuh tempo (saat dibuka, kembali aktif, dan tiap 30 menit)
  useEffect(() => {
    if (!currentUser) return undefined;
    const run = () => {
      const res = applyRecurring(dataRef.current, todayYmd());
      if (res.created.length) {
        setData(res.data);
        notify(makeTr(dataRef.current.profile.language || 'id')('rec_auto_logged', { n: res.created.length }));
      }
    };
    run();
    const id = setInterval(run, 30 * 60 * 1000);
    const onVis = () => !document.hidden && run();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [currentUser, data.recurring, notify]);

  // 2) Peringatan anggaran 80% / 100%
  useEffect(() => {
    if (!currentUser) return;
    const month = todayYmd().slice(0, 7);
    const budgets = effectiveBudgets(data.budgets, month);
    if (!budgets.length) return;
    const pruned = pruneAlertLog(data.alertLog || {}, month);
    const res = computeBudgetAlerts({ transactions: data.transactions, budgets, month, log: pruned });
    const prunedChanged = Object.keys(pruned).length !== Object.keys(data.alertLog || {}).length;
    if (!res.changed && !prunedChanged) return;
    setData((prev) => ({ ...prev, alertLog: res.log }));
    if (res.alerts.length) {
      const T = makeTr(data.profile.language || 'id');
      const first = res.alerts[0];
      notify(
        res.alerts.length > 1
          ? `${T('budget_alert_toast', { cat: catName(first.category, lang), pct: first.pct })} (+${res.alerts.length - 1})`
          : T('budget_alert_toast', { cat: catName(first.category, lang), pct: first.pct })
      );
      if (notifPrefs.enabled && notifPrefs.budget) {
        const money = (n) => formatMoney(n, data.profile.currency);
        res.alerts.slice(0, 3).forEach((a) => {
          notifyNow(
            {
              key: a.key,
              title: T(a.threshold >= 100 ? 'n_budget_title_100' : 'n_budget_title_80', { cat: catName(a.category, lang) }),
              body: T('n_budget_body', { spent: money(a.spent), limit: money(a.limit), pct: a.pct }),
              route: 'budgets',
            },
            { channelDesc: T('ns_channel_desc') }
          );
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, data.transactions, data.budgets]);

  // 3) Jadwal pengingat (diperbarui setelah data berhenti berubah)
  useEffect(() => {
    if (!currentUser || !notifPrefs.enabled) return undefined;
    const doSync = () => {
      const d = dataRef.current;
      const T = makeTr(d.profile.language || 'id');
      syncReminders(buildReminders({ data: d, prefs: notifPrefs, tr: T }), { channelDesc: T('ns_channel_desc') }).catch(() => {});
    };
    const timer = setTimeout(doSync, 1500);
    const onVis = () => !document.hidden && doSync();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [currentUser, notifPrefs, data, lang]);

  // Ketuk notifikasi -> buka layar terkait
  useEffect(() => onNotificationTap((route) => navigateTab(route)), [navigateTab]);

  // 4) Kunci aplikasi: kunci saat ditinggalkan, tutup tampilan di layar multitugas
  useEffect(() => {
    const onVis = () => {
      const cfg = loadLock();
      if (!cfg.enabled) return;
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
        setCovered(true);
        if (cfg.timeout === 0) setLocked(true);
      } else {
        const away = (Date.now() - (hiddenAtRef.current || Date.now())) / 1000;
        if (away >= cfg.timeout) setLocked(true);
        setCovered(false);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const verifyAccountPassword = useCallback(
    async (pw) => {
      if (!currentUser?.workspaceKey) return false;
      if (currentUser.google) {
        try {
          const { profile } = await signInWithGoogle();
          return `g_${profile.sub}` === currentUser.workspaceKey;
        } catch {
          return false;
        }
      }
      const stored = readStoredJson(acctStoreKey(currentUser.workspaceKey));
      return !!stored?.passwordHash && stored.passwordHash === hashPasswordClient(pw);
    },
    [currentUser]
  );

  // 5) Cadangan otomatis ke Google Drive (saat aplikasi aktif)
  useEffect(() => {
    if (!currentUser) return undefined;
    const run = async () => {
      const res = await runAutoBackup(dataRef.current);
      if (res.status === 'needs_auth') {
        const day = todayYmd();
        let seen = '';
        try {
          seen = localStorage.getItem('lifeos:backup:ping') || '';
        } catch {
          /* abaikan */
        }
        if (seen !== day) {
          try {
            localStorage.setItem('lifeos:backup:ping', day);
          } catch {
            /* abaikan */
          }
          const T = makeTr(dataRef.current.profile.language || 'id');
          notify(T('n_backup_title'));
          if (loadNotifPrefs().enabled) notifyNow({ key: 'backup-auth', title: T('n_backup_title'), body: T('n_backup_body'), route: 'profile' }, { channelDesc: T('ns_channel_desc') });
        }
      }
    };
    const first = setTimeout(run, 6000);
    const id = setInterval(run, 30 * 60 * 1000);
    const onVis = () => !document.hidden && run();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [currentUser, notify]);

  // --- Menu favorit (template) ---
  const handleUseTemplate = (tpl) => {
    const items = (tpl.items || []).map((it) => ({ name: it.name, qty: it.qty, price: it.price }));
    const amount = items.length ? items.reduce((s, it) => s + (Number(it.qty) || 1) * (Number(it.price) || 0), 0) : Number(tpl.amount) || 0;
    if (!(amount > 0)) return;
    const txId = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const accountId = data.accounts.find((a) => a.id === tpl.accountId)?.id || data.accounts[0]?.id;
    const tx = {
      id: txId,
      type: tpl.type === 'income' ? 'income' : 'expense',
      amount,
      date: todayYmd(),
      category: tpl.category,
      description: tpl.description || tpl.name,
      accountId,
      paymentMethod: tpl.paymentMethod || 'QRIS',
      notes: tpl.notes || '',
      templateId: tpl.id,
      ...(items.length ? { items } : {}),
    };
    setData((prev) => ({
      ...prev,
      transactions: [tx, ...prev.transactions],
      templates: (prev.templates || []).map((x) => (x.id === tpl.id ? { ...x, useCount: (x.useCount || 0) + 1, lastUsed: todayYmd() } : x)),
    }));
    notify(tr('fav_logged', { name: tpl.name, amount: formatMoney(amount, data.profile.currency) }), {
      label: tr('fav_undo'),
      run: () =>
        setData((prev) => ({
          ...prev,
          transactions: prev.transactions.filter((x) => x.id !== txId),
          templates: (prev.templates || []).map((x) => (x.id === tpl.id ? { ...x, useCount: Math.max(0, (x.useCount || 1) - 1) } : x)),
        })),
    });
  };
  const handleSaveTemplate = (tpl) => {
    setData((prev) => {
      const list = prev.templates || [];
      return {
        ...prev,
        templates: tpl.id ? list.map((x) => (x.id === tpl.id ? { ...x, ...tpl } : x)) : [...list, { ...tpl, id: newId('tpl'), useCount: 0, lastUsed: '' }],
      };
    });
    notify(tr('fav_saved'));
  };
  const handleDeleteTemplate = (tpl) =>
    askConfirm(tr('delete'), `${tpl.name}?`, () => {
      setData((prev) => ({ ...prev, templates: (prev.templates || []).filter((x) => x.id !== tpl.id) }));
      notify(tr('fav_deleted'));
    }, tr('delete'));

  // --- Transaksi berulang ---
  const handleSaveRecurring = (rule) => {
    setData((prev) => {
      const list = prev.recurring || [];
      return { ...prev, recurring: list.some((r) => r.id === rule.id) ? list.map((r) => (r.id === rule.id ? rule : r)) : [...list, rule] };
    });
    notify(tr('rec_saved'));
  };
  const handleDeleteRecurring = (rule) =>
    askConfirm(tr('delete'), `${rule.name}?`, () => {
      setData((prev) => ({ ...prev, recurring: (prev.recurring || []).filter((r) => r.id !== rule.id) }));
      notify(tr('rec_deleted'));
    }, tr('delete'));
  const handleToggleRecurring = (rule) =>
    setData((prev) => ({
      ...prev,
      recurring: (prev.recurring || []).map((r) => (r.id === rule.id ? { ...r, active: r.active === false } : r)),
    }));

  const handlePickSearch = (it) => {
    setSearchOpen(false);
    if (it.kind === 'transaction') setTxModal({ open: true, tx: it.tx });
    else if (it.kind === 'task') setTaskModal({ open: true, task: it.task, defaultDate: TODAY_STR });
    else if (it.kind === 'event') setEventModal({ open: true, event: it.event, defaultDate: TODAY_STR });
    else if (it.tab) navigateTab(it.tab);
  };

  const sendTestNotification = async () => {
    const T = makeTr(lang);
    const perm = await requestPermission();
    if (perm === 'granted') await notifyNow({ key: 'test', title: T('ns_test_title'), body: T('ns_test_body'), route: 'notifications' }, { channelDesc: T('ns_channel_desc') });
  };
  const reminderPreview = useMemo(
    () =>
      activeTab === 'notifications'
        ? buildReminders({ data, prefs: notifPrefs, tr: makeTr(lang) }).slice(0, 12)
        : [],
    [activeTab, data, notifPrefs, lang]
  );

  const expenseCategoryList = useMemo(() => [...new Set([...DEFAULT_EXPENSE_CATEGORIES, ...(data.customExpenseCategories || [])])], [data.customExpenseCategories]);
  const incomeCategoryList = useMemo(() => [...new Set([...DEFAULT_INCOME_CATEGORIES, ...(data.customIncomeCategories || [])])], [data.customIncomeCategories]);

  // Pintasan klaviatur: Ctrl/Cmd + K = cari
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleAuthSuccess = ({ email, name, workspaceKey, initialData, isCloud, google, picture, cloudMeta, returning = true, baseKey, wsId = MAIN_WS, registry }) => {
    const base = baseKey || baseOf(workspaceKey);
    if (google && cloudMeta) {
      try {
        localStorage.setItem(`lifeos:cloud:${workspaceKey}`, JSON.stringify(cloudMeta));
      } catch {
        /* abaikan */
      }
    }
    try {
      localStorage.setItem(lastWsKey(base), wsId);
    } catch {
      /* abaikan */
    }
    const list = upsert(registry || readRegistry(base), entryFromData(wsId, initialData));
    writeRegistry(base, list);
    setWsList(list);
    setActiveWs(wsId);
    cloudRef.current = { hash: cloudMeta?.hash || '', modified: cloudMeta?.modified || '', busy: false };
    setCurrentUser({ email, name, workspaceKey, baseKey: base, wsId, isCloud, google: Boolean(google), picture: picture || '' });
    setData(initialData);
    navigateTab('dashboard');
    notify(
      returning
        ? lang === 'id' ? `Selamat datang kembali, ${name}` : `Welcome back, ${name}`
        : lang === 'id' ? `Selamat datang, ${name}` : `Welcome, ${name}`
    );
  };

  // Registrasi: setup = { type, name } untuk pengguna baru, atau null bila hanya masuk.
  // Satu akun Google bisa punya beberapa akun (Pribadi, Bisnis). Memilih tipe membuka akun bertipe itu,
  // atau membuatnya bila belum ada — tidak lagi membuka data lama begitu saja.
  const handleOnboardGoogle = async (setup) => {
    const { profile } = await signInWithGoogle();
    const base = `g_${profile.sub}`;
    let cloudList = [];
    try {
      cloudList = await listCloudWorkspaces(false);
    } catch (e) {
      if (/drive_http_(401|403)/.test(String(e?.message))) throw new Error('google_drive_denied');
      throw e;
    }
    const cloudById = Object.fromEntries(cloudList.map((w) => [w.id, w]));
    const registry = mergeRegistry(readRegistry(base), cloudList);
    let last = '';
    try {
      last = localStorage.getItem(lastWsKey(base)) || '';
    } catch {
      /* abaikan */
    }
    const { target, create } = pickWorkspace(registry, setup, last);
    const key = keyFor(base, target.id);
    const fromCloud = !create ? cloudById[target.id] : null;
    let initialData;
    if (create) initialData = createWorkspaceFromSetup(lang, profile.name, setup || { type: 'personal', name: profile.name });
    else initialData = fromCloud?.data || readStoredJson(wsStoreKey(key)) || createWorkspaceFromSetup(lang, profile.name, { type: target.type, name: target.name });
    const displayName = create ? initialData.profile.name || profile.name : profile.name;
    handleAuthSuccess({
      email: profile.email,
      name: displayName,
      workspaceKey: key,
      baseKey: base,
      wsId: target.id,
      registry,
      initialData,
      isCloud: true,
      google: true,
      picture: profile.picture,
      cloudMeta: fromCloud ? { hash: hashData(fromCloud.data), modified: fromCloud.modifiedTime } : { hash: '', modified: '' },
      returning: !create,
    });
  };

  const waitCloudIdle = async () => {
    for (let i = 0; i < 60 && cloudRef.current.busy; i += 1) await new Promise((r) => setTimeout(r, 100));
  };

  // Beralih ke akun lain (Pribadi <-> Bisnis) tanpa keluar. Data akun lama dikirim ke Drive dulu.
  // opts.skipPush: jangan kirim data akun lama ke Drive (dipakai saat akun lama baru dihapus)
  // opts.force: abaikan penjaga wsBusy (dipanggil dari dalam operasi yang sudah menandai sibuk)
  const switchWorkspace = async (id, opts = {}) => {
    if (!currentUser || id === currentUser.wsId || (wsBusy && !opts.force)) return;
    setWsBusy(true);
    try {
      setCloudReady(false); // hentikan pengiriman otomatis selama peralihan
      await waitCloudIdle();
      if (isGoogle && !opts.skipPush) await cloudPush(false);
      const key = keyFor(currentUser.baseKey, id);
      const local = readStoredJson(wsStoreKey(key));
      const stored = readStoredJson(`lifeos:cloud:${key}`);
      const localDirty = local && (!stored || hashData(local) !== stored.hash);
      let next = null;
      let meta = stored || { hash: '', modified: '' };
      if (local && localDirty) next = local; // ada perubahan lokal yang belum terkirim: jangan ditimpa
      else if (isGoogle) {
        try {
          const res = await loadCloud(false, id);
          if (res?.data?.profile) {
            next = res.data;
            meta = { hash: hashData(res.data), modified: res.modifiedTime };
          }
        } catch {
          /* tanpa jaringan: pakai salinan lokal */
        }
      }
      if (!next && local) next = local;
      if (!next) {
        notify(lang === 'id' ? 'Data akun itu belum bisa dimuat. Periksa koneksi lalu coba lagi.' : "Couldn't load that account. Check your connection and try again.");
        if (isGoogle) setCloudReady(true);
        return;
      }
      try {
        localStorage.setItem(`lifeos:cloud:${key}`, JSON.stringify(meta));
        localStorage.setItem(lastWsKey(currentUser.baseKey), id);
      } catch {
        /* abaikan */
      }
      setActiveWs(id);
      cloudRef.current = { hash: meta.hash || '', modified: meta.modified || '', busy: false };
      setCurrentUser((u) => ({ ...u, workspaceKey: key, wsId: id }));
      setData(next);
      setWsSheetOpen(false);
      setMenuOpen(false);
      navigateTab('dashboard');
      const nm = entryFromData(id, next).name;
      notify(lang === 'id' ? `Beralih ke ${nm}` : `Switched to ${nm}`);
    } finally {
      setWsBusy(false);
    }
  };

  // Hapus satu akun: file Drive dulu (gagal → batal, tidak ada yang hilang), lalu salinan lokal & daftar.
  const deleteWorkspace = async (id) => {
    if (!currentUser || wsBusy) return { ok: false };
    const L = (a, b) => (lang === 'id' ? a : b);
    setWsBusy(true);
    try {
      setCloudReady(false);
      await waitCloudIdle();
      if (isGoogle) {
        try {
          await deleteCloudWorkspace(id, true);
        } catch (e) {
          if (isGoogle) setCloudReady(true);
          const expired = /drive_expired|drive_timeout|drive_cancelled|access_denied/.test(String(e?.message));
          return { ok: false, message: expired ? L('Masuk ulang ke Google lalu coba lagi. Akun belum dihapus.', 'Sign in to Google again and retry. The account was not deleted.') : L('Gagal menghapus di Google Drive. Periksa koneksi lalu coba lagi. Akun belum dihapus.', 'Could not delete from Google Drive. Check your connection and retry. The account was not deleted.') };
        }
      }
      const base = currentUser.baseKey;
      const key = keyFor(base, id);
      try {
        localStorage.removeItem(wsStoreKey(key));
        localStorage.removeItem(`lifeos:cloud:${key}`);
      } catch {
        /* abaikan */
      }
      const plan = planDelete(wsList, id, currentUser.wsId || MAIN_WS);
      writeRegistry(base, plan.list);
      setWsList(plan.list);
      const name = wsList.find((w) => w.id === id)?.name || '';
      if (plan.signOut) {
        try {
          localStorage.removeItem(wsRegKey(base));
          localStorage.removeItem(lastWsKey(base));
        } catch {
          /* abaikan */
        }
        forgetDriveToken();
        setData(createEmptyState(lang));
        setWsSheetOpen(false);
        setWsDeleteId(null);
        setSettingsOpen(false);
        setCurrentUser(null);
        return { ok: true };
      }
      if (id === (currentUser.wsId || MAIN_WS)) {
        await switchWorkspace(plan.open, { skipPush: true, force: true });
      } else if (isGoogle) setCloudReady(true);
      setWsDeleteId(null);
      notify(L(`Akun ${name} dihapus`, `Account ${name} deleted`));
      return { ok: true };
    } finally {
      setWsBusy(false);
    }
  };

  // Tambah akun baru (Pribadi atau Bisnis) di bawah login yang sama
  const createWorkspace = async ({ type, name }) => {
    if (!currentUser || wsBusy) return false;
    setWsBusy(true);
    try {
      setCloudReady(false);
      await waitCloudIdle();
      if (isGoogle) await cloudPush(false);
      const id = newWsId();
      const key = keyFor(currentUser.baseKey, id);
      const fresh = createWorkspaceFromSetup(lang, currentUser.name, { type, name });
      try {
        localStorage.setItem(wsStoreKey(key), JSON.stringify(fresh));
        localStorage.setItem(`lifeos:cloud:${key}`, JSON.stringify({ hash: '', modified: '' }));
        localStorage.setItem(lastWsKey(currentUser.baseKey), id);
      } catch {
        /* abaikan */
      }
      setActiveWs(id);
      cloudRef.current = { hash: '', modified: '', busy: false };
      setCurrentUser((u) => ({ ...u, workspaceKey: key, wsId: id }));
      setData(fresh);
      setWsSheetOpen(false);
      setMenuOpen(false);
      navigateTab('dashboard');
      notify(lang === 'id' ? `Akun ${name} dibuat` : `Account ${name} created`);
      return true;
    } finally {
      setWsBusy(false);
    }
  };

  if (!currentUser) {
    if (legacyAuth) {
      return (
        <div>
          <AuthPortalScreen lang={lang} onToggleLang={toggleLanguageQuick} t={t} onAuthenticateSuccess={handleAuthSuccess} />
          <button
            type="button"
            onClick={() => setLegacyAuth(false)}
            className="fixed top-3 left-3 z-20 px-3 py-2 rounded-xl bg-life-surface border border-life-border/60 text-xs font-semibold text-life-soft"
          >
            ← {lang === 'id' ? 'Kembali' : 'Back'}
          </button>
        </div>
      );
    }
    return (
      <OnboardingFlow
        lang={lang}
        onToggleLang={toggleLanguageQuick}
        tr={makeTr(lang)}
        onGoogle={handleOnboardGoogle}
        onLegacy={() => setLegacyAuth(true)}
      />
    );
  }

  const bizMode = data.profile.ledgerType === 'business';
  const currentWs = entryFromData(currentUser.wsId || MAIN_WS, data);
  const openSwitcher = () => setWsSheetOpen(true);
  const renderBiz = (section) => (
    <BusinessView
      currentWs={currentWs}
      onOpenSwitcher={openSwitcher}
      section={section}
      data={data}
      setData={setData}
      derived={derived}
      lang={lang}
      maskBalances={maskBalances}
      onToggleMask={() => setMaskBalances((prev) => !prev)}
      notify={notify}
      askConfirm={askConfirm}
      onNavigate={navigateTab}
      onOpenTx={(tx = null) => setTxModal({ open: true, tx })}
      onOpenReceipt={() => setReceiptModalOpen(true)}
    />
  );

  const renderModule = () => {
    switch (activeTab) {
      case 'biz_pos':
      case 'biz_stock':
      case 'biz_payroll':
      case 'biz_assets':
      case 'biz_reports':
        return renderBiz(activeTab);
      case 'dashboard':
        if (bizMode) return renderBiz('dashboard');
        return (
          <HomeView
            currentWs={currentWs}
            onOpenSwitcher={openSwitcher}
            data={data}
            derived={derived}
            lang={lang}
            maskBalances={maskBalances}
            onToggleMask={() => setMaskBalances((prev) => !prev)}
            onNavigate={navigateTab}
            onOpenTx={(tx = null) => setTxModal({ open: true, tx })}
            onOpenReceipt={() => setReceiptModalOpen(true)}
            onOpenSplit={() => setSplitBillModalOpen(true)}
            onOpenPayday={() => setPaydayModalOpen(true)}
            onOpenBriefing={() => setBriefingModalOpen(true)}
            onOpenMenu={() => setMenuOpen(true)}
            onOpenSearch={() => setSearchOpen(true)}
            onOpenWeekly={() => setWeeklyOpen(true)}
            onUseTemplate={handleUseTemplate}
          />
        );
      case 'recurring':
        return (
          <RecurringView
            data={data}
            lang={lang}
            maskBalances={maskBalances}
            expenseCategories={expenseCategoryList}
            incomeCategories={incomeCategoryList}
            onSave={handleSaveRecurring}
            onDelete={handleDeleteRecurring}
            onToggle={handleToggleRecurring}
            onBack={() => navigateTab('dashboard')}
          />
        );
      case 'templates':
        return (
          <TemplatesView
            data={data}
            lang={lang}
            maskBalances={maskBalances}
            expenseCategories={expenseCategoryList}
            incomeCategories={incomeCategoryList}
            onUse={handleUseTemplate}
            onSave={handleSaveTemplate}
            onDelete={handleDeleteTemplate}
            onBack={() => navigateTab('dashboard')}
          />
        );
      case 'notifications':
        return (
          <NotificationSettings
            lang={lang}
            prefs={notifPrefs}
            onChange={updateNotifPrefs}
            preview={reminderPreview}
            onTest={sendTestNotification}
            onBack={() => navigateTab('profile')}
          />
        );
      case 'security':
        return (
          <SecuritySettings
            lang={lang}
            cfg={lockCfg}
            onChange={setLockCfg}
            onLockNow={() => setLocked(true)}
            onBack={() => navigateTab('profile')}
          />
        );
      case 'activity':
        return (
          <ActivityView
            data={data}
            lang={lang}
            maskBalances={maskBalances}
            onOpenTx={(tx = null) => setTxModal({ open: true, tx })}
            onDeleteTx={handleDeleteTx}
            onOpenReceipt={() => setReceiptModalOpen(true)}
          />
        );
      case 'profile':
        return (
          <ProfileView
            currentWs={currentWs}
            wsCount={wsList.length}
            onOpenSwitcher={openSwitcher}
            onOpenDelete={() => { setWsDeleteId(currentUser.wsId || MAIN_WS); setWsSheetOpen(true); }}
            data={data}
            derived={derived}
            currentUser={currentUser}
            lang={lang}
            maskBalances={maskBalances}
            onToggleMask={() => setMaskBalances((prev) => !prev)}
            onUpdateProfile={handleUpdateProfileQuiet}
            onNavigate={navigateTab}
            onExportJson={handleExportJson}
            onExportCsv={handleExportCsv}
            onImportJson={handleImportJson}
            onResetEmpty={handleResetEmpty}
            onRestoreDemo={handleRestoreDemo}
            onLogout={handleLogout}
            onAddCategory={handleAddCustomCategory}
            onDeleteCategory={handleDeleteCustomCategory}
            onRenameCategory={handleRenameCustomCategory}
            lockEnabled={lockCfg.enabled}
            onExportReport={() => setExportOpen(true)}
          />
        );
      case 'overview':
        return (
          <DashboardView
            data={data}
            derived={derived}
            maskBalances={maskBalances}
            t={t}
            lang={lang}
            onNavigate={navigateTab}
            onOpenTxModal={(tx = null) => setTxModal({ open: true, tx })}
            onOpenTaskModal={(task = null) => setTaskModal({ open: true, task, defaultDate: TODAY_STR })}
            onOpenEventModal={(event = null) => setEventModal({ open: true, event, defaultDate: TODAY_STR })}
            onToggleTask={handleToggleTask}
            onToggleHabitToday={handleToggleHabitDate}
          />
        );
      case 'wallet':
        return (
          <WalletView
            data={data}
            derived={derived}
            maskBalances={maskBalances}
            t={t}
            lang={lang}
            onOpenTxModal={(tx = null) => setTxModal({ open: true, tx })}
            onDeleteTx={handleDeleteTx}
            onAddAccount={handleAddAccount}
            onAddCustomCategory={handleAddCustomCategory}
            onOpenPaydayModal={() => setPaydayModalOpen(true)}
            onOpenReceiptModal={() => setReceiptModalOpen(true)}
            onOpenSplitBillModal={() => setSplitBillModalOpen(true)}
          />
        );
      case 'budgets':
        return (
          <BudgetsView
            data={data}
            maskBalances={maskBalances}
            t={t}
            lang={lang}
            onSaveBudget={handleSaveBudget}
            onDeleteBudget={handleDeleteBudget}
          />
        );
      case 'savings':
        return (
          <SavingsView
            data={data}
            maskBalances={maskBalances}
            t={t}
            lang={lang}
            onCreateSavingsGoal={handleCreateSavingsGoal}
            onAddContribution={handleAddContribution}
            onDeleteSavingsGoal={handleDeleteSavingsGoal}
            accountBalances={derived.accountBalances}
          />
        );
      case 'investments':
        return (
          <InvestmentsView
            data={data}
            maskBalances={maskBalances}
            t={t}
            lang={lang}
            onAddInvestment={handleAddInvestment}
            onUpdateInvestmentValue={handleUpdateInvestmentValue}
            onDeleteInvestment={handleDeleteInvestment}
          />
        );
      case 'subscriptions':
        return (
          <SubscriptionsView
            data={data}
            maskBalances={maskBalances}
            t={t}
            lang={lang}
            onAddSub={handleAddSub}
            onPaySub={handlePaySub}
            onDeleteSub={handleDeleteSub}
          />
        );
      case 'debts':
        return (
          <DebtsView
            data={data}
            maskBalances={maskBalances}
            t={t}
            lang={lang}
            onAddDebt={handleAddDebt}
            onSettleDebtInstallment={handleSettleDebtInstallment}
            onDeleteDebt={handleDeleteDebt}
            onOpenSplitBillModal={() => setSplitBillModalOpen(true)}
          />
        );
      case 'planner':
        return (
          <PlannerView
            data={data}
            t={t}
            lang={lang}
            onToggleTask={handleToggleTask}
            onToggleTopPriority={handleToggleTopPriority}
            onOpenTaskModal={(task = null, d = TODAY_STR) =>
              setTaskModal({ open: true, task, defaultDate: d })
            }
            onOpenEventModal={(event = null, d = TODAY_STR) =>
              setEventModal({ open: true, event, defaultDate: d })
            }
            onSaveWellnessLog={handleSaveWellnessLog}
          />
        );
      case 'tasks':
        return (
          <TasksView
            data={data}
            t={t}
            lang={lang}
            onOpenTaskModal={(task = null) => setTaskModal({ open: true, task, defaultDate: TODAY_STR })}
            onToggleTask={handleToggleTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            data={data}
            t={t}
            lang={lang}
            onOpenEventModal={(event = null, d = TODAY_STR) =>
              setEventModal({ open: true, event, defaultDate: d })
            }
            onDeleteEvent={handleDeleteEvent}
            onNavigate={navigateTab}
            maskBalances={maskBalances}
          />
        );
      case 'habits':
        return (
          <HabitsView
            data={data}
            t={t}
            lang={lang}
            onToggleHabitDate={handleToggleHabitDate}
            onCreateHabit={handleCreateHabit}
            onDeleteHabit={handleDeleteHabit}
          />
        );
      case 'goals':
        return (
          <GoalsView
            data={data}
            t={t}
            lang={lang}
            onCreateGoal={handleCreateGoal}
            onToggleMilestone={handleToggleMilestone}
            onAddMilestone={handleAddMilestone}
            onDeleteGoal={handleDeleteGoal}
          />
        );
      case 'crm':
        return (
          <PersonalCrmView
            data={data}
            t={t}
            lang={lang}
            onAddContact={handleAddContact}
            onLogContactToday={handleLogContactToday}
            onDeleteContact={handleDeleteContact}
          />
        );
      case 'notes':
        return (
          <NotesView
            data={data}
            t={t}
            lang={lang}
            onSaveNote={handleSaveNote}
            onDeleteNote={handleDeleteNote}
            onTogglePinNote={handleTogglePinNote}
          />
        );
      case 'shopping':
        return (
          <ShoppingView
            data={data}
            maskBalances={maskBalances}
            t={t}
            lang={lang}
            onCreateShoppingList={handleCreateShoppingList}
            onAddShoppingItem={handleAddShoppingItem}
            onToggleShoppingItem={handleToggleShoppingItem}
            onDeleteShoppingItem={handleDeleteShoppingItem}
            onLogShoppingAsExpense={handleLogShoppingAsExpense}
          />
        );
      case 'reports':
        return (
          <ReportsView
            data={data}
            derived={derived}
            maskBalances={maskBalances}
            t={t}
            lang={lang}
            onExportCsv={handleExportCsv}
          />
        );
      default:
        return null;
    }
  };

  // Halaman dengan header sendiri (gaya e-wallet) & penanda tab aktif di navigasi bawah
  const PRIMARY_TABS = ['dashboard', 'activity', 'wallet', 'profile', 'biz_pos'];
  const ownHeader = ['dashboard', 'activity', 'profile', 'biz_pos', 'biz_stock', 'biz_payroll', 'biz_assets', 'biz_reports'].includes(activeTab);
  const navActive = PRIMARY_TABS.includes(activeTab) ? activeTab : 'dashboard';

  const allNavItems = NAV_GROUPS.flatMap((g) => g.items);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-life-bg text-life-text flex flex-col lg:flex-row selection:bg-life-accent selection:text-life-bg relative">
      <style>{MOTION_STYLES}</style>

      {/* Ambient Multi-Layer Parallax Background Orbs */}
      <ParallaxLayer
        speed={-0.16}
        pointerFactor={20}
        className="fixed top-20 left-1/3 pointer-events-none z-0"
      >
        <div className="w-[460px] h-[460px] rounded-full bg-life-accent/[0.06] blur-[110px]" />
      </ParallaxLayer>
      <ParallaxLayer
        speed={0.12}
        pointerFactor={-16}
        className="fixed bottom-10 right-10 pointer-events-none z-0"
      >
        <div className="w-[380px] h-[380px] rounded-full bg-life-border/[0.14] blur-[100px]" />
      </ParallaxLayer>

      {/* DESKTOP FIXED SIDEBAR */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-life-surface/95 backdrop-blur-xl border-r border-life-border/40 z-30">
        <div className="p-6 border-b border-life-border/35 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-life-accent to-life-border flex items-center justify-center text-life-bg font-bold shadow-lg">
              L
            </div>
            <div>
              <span className="text-base font-bold tracking-wider text-life-text block">LIFE OS</span>
              <span className="text-[10px] uppercase tracking-widest text-life-accent">
                {lang === 'id' ? 'Edisi Pribadi' : 'Private Edition'}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.labelKey} className="space-y-1">
              <div className="px-3 text-[10px] font-semibold uppercase tracking-widest text-life-muted/75">
                {t(group.labelKey)}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-gradient-to-r from-life-surface2 to-life-surface text-life-soft border border-life-accent/50 shadow translate-x-0.5'
                        : 'text-life-muted hover:text-life-text hover:bg-life-surface2/45'
                    }`}
                  >
                    <span className="flex items-center gap-3 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-life-accent' : ''}`} />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </span>
                    {item.id === 'tasks' && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-life-bg text-life-soft shrink-0">
                        {data.tasks.filter((tk) => tk.status !== 'completed').length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-life-border/35 space-y-2">
          <button
            onClick={() => navigateTab('profile')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-life-bg/80 border border-life-border/40 hover:border-life-accent/60 transition-colors"
          >
            <div className="text-left min-w-0">
              <p className="text-xs font-semibold text-life-text truncate">{data.profile.name}</p>
              <p className="text-[11px] text-life-muted truncate">
                {lang === 'id' ? 'Bahasa Indonesia' : 'English'} • {data.profile.currency}
              </p>
            </div>
            <Settings className="w-4 h-4 text-life-accent shrink-0" />
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE COLUMN */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0 pb-28 lg:pb-0 relative z-10">
        {/* STICKY RESPONSIVE HEADER */}
        <header
          className={`sticky top-0 z-20 bg-life-bg/90 backdrop-blur-md border-b border-life-border/35 px-3 sm:px-8 h-16 items-center justify-between gap-2 ${
            ownHeader ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => navigateTab('dashboard')}
              className="lg:hidden p-2 -ml-1 rounded-xl text-life-text shrink-0"
              aria-label={lang === 'id' ? 'Kembali ke Beranda' : 'Back to Home'}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-life-text truncate block sm:inline">
                {t(allNavItems.find((i) => i.id === activeTab)?.labelKey || 'nav_dashboard')}
              </span>
              <span className="hidden md:inline text-xs text-life-muted ml-3">
                {t('net_worth')}:{' '}
                <strong className="text-life-soft tabular-nums">
                  {formatMoney(derived.totalNetWorth, data.profile.currency, maskBalances)}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {cloudNeedsAuth && (
              <button
                type="button"
                onClick={() => cloudPush(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#D9A441]/15 border border-[#D9A441]/50 text-[11px] font-semibold text-life-text"
              >
                <Cloud className="w-3.5 h-3.5 text-[#D9A441]" />
                {makeTr(lang)('sync_reconnect')}
              </button>
            )}
            <WorkspaceChip current={currentWs} lang={lang} onClick={openSwitcher} className="hidden lg:inline-flex max-w-[200px]" />
            <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-life-surface border border-life-border/40 text-[11px] text-life-muted">
              <Cloud className={`w-3.5 h-3.5 ${isGoogle && syncStatus !== 'synced' ? 'text-[#D9A441]' : 'text-[#87B082]'}`} />
              {makeTr(lang)(!isGoogle ? 'sync_local' : syncStatus === 'syncing' ? 'sync_syncing' : syncStatus === 'offline' ? 'sync_offline' : syncStatus === 'auth' ? 'sync_auth' : 'sync_google')}
            </span>

            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl bg-life-surface border border-life-border/50 text-life-muted hover:text-life-soft"
              title={tr('search_title')}
              aria-label={tr('search_title')}
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => setBriefingModalOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl bg-life-surface border border-life-border/50 text-life-muted hover:text-life-soft"
              title={t('daily_briefing')}
            >
              <Send className="w-4 h-4" />
            </button>

            <button
              onClick={toggleLanguageQuick}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-life-surface border border-life-border/50 text-xs font-semibold text-life-soft hover:border-life-accent"
              title={lang === 'id' ? 'Ganti ke English' : 'Switch to Bahasa Indonesia'}
            >
              <Globe className="w-3.5 h-3.5 text-life-accent" />
              <span>{lang.toUpperCase()}</span>
            </button>

            <button
              onClick={() => setMaskBalances((prev) => !prev)}
              className="p-2 sm:p-2.5 rounded-xl bg-life-surface border border-life-border/50 text-life-muted hover:text-life-soft"
              aria-label={lang === 'id' ? 'Sembunyikan/tampilkan saldo' : 'Toggle balance privacy'}
            >
              {maskBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            <button
              onClick={() => navigateTab('profile')}
              className="p-2 sm:p-2.5 rounded-xl bg-life-surface border border-life-border/50 text-life-muted hover:text-life-soft"
              aria-label={lang === 'id' ? 'Profil saya' : 'My profile'}
            >
              <Settings className="w-4 h-4" />
            </button>

            <Button size="sm" variant="secondary" onClick={() => setReceiptModalOpen(true)}>
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'id' ? 'Scan Struk' : 'Scan'}</span>
            </Button>
            <Button size="sm" onClick={() => setTxModal({ open: true, tx: null })}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('quick_entry')}</span>
            </Button>
          </div>
        </header>

        {/* MODULE CONTENT WITH SMOOTH TRANSITION */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-8 py-5 sm:py-8 min-w-0 space-y-6">
          <div key={activeTab} className="life-motion-enter">
            {renderModule()}
          </div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION: tombol Menu di tengah = semua fitur */}
      <BottomNav
        active={navActive}
        onNavigate={navigateTab}
        onMenu={() => setMenuOpen(true)}
        menuOpen={menuOpen}
        lang={lang}
        bizMode={bizMode}
      />
      <MenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={navigateTab}
        lang={lang}
        bizMode={bizMode}
        currentWs={currentWs}
        onOpenSwitcher={openSwitcher}
        actions={{
          addTx: () => setTxModal({ open: true, tx: null }),
          scan: () => setReceiptModalOpen(true),
          split: () => setSplitBillModalOpen(true),
          payday: () => setPaydayModalOpen(true),
          briefing: () => setBriefingModalOpen(true),
          search: () => setSearchOpen(true),
          exportReport: () => setExportOpen(true),
          weekly: () => setWeeklyOpen(true),
        }}
      />

      <WorkspaceSheet
        open={wsSheetOpen}
        onClose={() => { setWsSheetOpen(false); setWsDeleteId(null); }}
        lang={lang}
        list={wsList}
        currentId={currentUser.wsId || MAIN_WS}
        email={currentUser.email}
        busy={wsBusy}
        onSwitch={switchWorkspace}
        onCreate={createWorkspace}
        onDelete={deleteWorkspace}
        deleteId={wsDeleteId}
      />

      {/* GLOBAL MODALS */}
      <TransactionModal
        open={txModal.open}
        onClose={() => setTxModal({ open: false, tx: null })}
        editingTx={txModal.tx}
        data={data}
        t={t}
        lang={lang}
        onSave={handleSaveTx}
        accountBalances={derived.accountBalances}
      />

      <PaydaySplitterModal
        open={paydayModalOpen}
        onClose={() => setPaydayModalOpen(false)}
        data={data}
        t={t}
        lang={lang}
        onExecuteSplit={handleExecutePaydaySplit}
      />

      <ReceiptScannerModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        data={data}
        t={t}
        lang={lang}
        onSaveExtractedTx={handleSaveTx}
      />

      <SplitBillModal
        open={splitBillModalOpen}
        onClose={() => setSplitBillModalOpen(false)}
        data={data}
        t={t}
        lang={lang}
        onExecuteSplitBill={handleExecuteSplitBill}
      />

      <DailyBriefingModal
        open={briefingModalOpen}
        onClose={() => setBriefingModalOpen(false)}
        data={data}
        derived={derived}
        t={t}
        lang={lang}
        onCopied={() => notify(t('briefing_copied'))}
      />

      <TaskModal
        open={taskModal.open}
        onClose={() => setTaskModal({ open: false, task: null, defaultDate: TODAY_STR })}
        editingTask={taskModal.task}
        defaultDate={taskModal.defaultDate}
        t={t}
        lang={lang}
        onSave={handleSaveTask}
      />

      <EventModal
        open={eventModal.open}
        onClose={() => setEventModal({ open: false, event: null, defaultDate: TODAY_STR })}
        editingEvent={eventModal.event}
        defaultDate={eventModal.defaultDate}
        t={t}
        lang={lang}
        onSave={handleSaveEvent}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        data={data}
        currentUser={currentUser}
        t={t}
        onUpdateProfile={(prof) => {
          setData((prev) => ({ ...prev, profile: { ...prev.profile, ...prof } }));
          notify(prof.language === 'id' ? 'Pengaturan bahasa & profil disimpan' : 'Preferences saved');
        }}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onResetEmpty={handleResetEmpty}
        onRestoreDemo={handleRestoreDemo}
        onLogout={handleLogout}
      />

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        data={data}
        lang={lang}
        maskBalances={maskBalances}
        onPick={handlePickSearch}
      />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} data={data} lang={lang} onDone={notify} />
      <WeeklyModal open={weeklyOpen} onClose={() => setWeeklyOpen(false)} data={data} lang={lang} maskBalances={maskBalances} />

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={t('cancel')}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
      />

      {/* KUNCI APLIKASI */}
      {lockCfg.enabled && covered && !locked && <div className="fixed inset-0 z-[99] bg-life-bg" aria-hidden="true" />}
      {lockCfg.enabled && locked && (
        <LockScreen
          lang={lang}
          cfg={lockCfg}
          userName={currentUser.name}
          verifyPassword={verifyAccountPassword}
          viaGoogle={Boolean(currentUser.google)}
          onUnlock={() => {
            setLockCfg(loadLock());
            setLocked(false);
          }}
          onReset={() => {
            const off = { ...DEFAULT_LOCK };
            saveLock(off);
            setLockCfg(off);
            setLocked(false);
          }}
        />
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-28 lg:bottom-6 right-4 sm:right-6 z-50 px-4 py-3 rounded-2xl bg-life-surface2 border border-life-accent/70 text-xs font-medium text-life-text shadow-2xl flex items-center gap-2.5 max-w-[90vw] life-motion-enter">
          <CheckCircle2 className="w-4 h-4 text-life-accent shrink-0" />
          <span className="truncate">{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => {
                toast.action.run();
                setToast(null);
              }}
              className="ml-1 shrink-0 font-bold text-life-accent underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <WorkspaceErrorBoundary>
      <LifeOsWorkspace />
    </WorkspaceErrorBoundary>
  );
}