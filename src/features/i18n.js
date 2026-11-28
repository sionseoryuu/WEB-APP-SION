// Kamus fitur baru. Format: kunci: [Indonesia, English]. Tiap bahasa 100% satu bahasa.
const S = {
  // umum
  back: ['Kembali', 'Back'], close: ['Tutup', 'Close'], cancel: ['Batal', 'Cancel'], save: ['Simpan', 'Save'],
  edit: ['Ubah', 'Edit'], delete: ['Hapus', 'Delete'], none: ['Tidak ada', 'None'], total: ['Total', 'Total'],
  amount: ['Jumlah', 'Amount'], category: ['Kategori', 'Category'], account: ['Rekening', 'Account'], notes: ['Catatan', 'Notes'],
  income: ['Pemasukan', 'Income'], expense: ['Pengeluaran', 'Expense'], payment_method: ['Metode Pembayaran', 'Payment Method'],

  // transaksi berulang
  rec_title: ['Transaksi Berulang', 'Recurring Transactions'],
  rec_subtitle: ['Gaji, kos, cicilan, dan listrik tercatat sendiri sesuai jadwal.', 'Salary, rent, installments and utilities are logged automatically on schedule.'],
  rec_add: ['Tambah Aturan', 'Add Rule'], rec_edit: ['Ubah Aturan', 'Edit Rule'],
  rec_monthly_in: ['Pemasukan otomatis / bulan', 'Automatic income / month'], rec_monthly_out: ['Pengeluaran otomatis / bulan', 'Automatic spending / month'],
  rec_empty_title: ['Belum ada transaksi berulang', 'No recurring transactions yet'],
  rec_empty_text: ['Buat aturan sekali, lalu transaksi akan tercatat sendiri tiap periode.', 'Create a rule once and transactions are logged by themselves every period.'],
  rec_paused: ['Dijeda', 'Paused'], rec_finished: ['Selesai', 'Finished'], rec_next: ['Berikutnya: {date}', 'Next: {date}'], rec_until: ['sampai {date}', 'until {date}'],
  rec_pause: ['Jeda', 'Pause'], rec_resume: ['Lanjutkan', 'Resume'],
  rec_every_week: ['Tiap {day}', 'Every {day}'], rec_every_month: ['Tiap tanggal {day}', 'Monthly on day {day}'], rec_every_year: ['Tiap tahun, {date}', 'Yearly on {date}'],
  rec_quick: ['Pilih cepat', 'Quick pick'],
  rec_preset_salary: ['Gaji', 'Salary'], rec_preset_rent: ['Kos / Sewa', 'Rent'], rec_preset_installment: ['Cicilan', 'Installment'],
  rec_preset_electricity: ['Listrik', 'Electricity'], rec_preset_internet: ['Internet', 'Internet'],
  rec_name: ['Nama', 'Name'], rec_name_ph: ['mis. Gaji bulanan', 'e.g. Monthly salary'],
  rec_frequency: ['Pengulangan', 'Repeat'], rec_f_weekly: ['Mingguan', 'Weekly'], rec_f_monthly: ['Bulanan', 'Monthly'], rec_f_yearly: ['Tahunan', 'Yearly'],
  rec_weekday: ['Hari', 'Weekday'], rec_day: ['Tanggal', 'Day of month'], rec_day_hint: ['Bulan yang lebih pendek memakai tanggal terakhir bulan itu.', 'Shorter months use the last day of that month.'],
  rec_month: ['Bulan', 'Month'], rec_start: ['Mulai', 'Start'], rec_end: ['Berakhir (opsional)', 'Ends (optional)'], rec_end_hint: ['Kosongkan bila tanpa batas.', 'Leave empty for no end.'],
  rec_backfill: ['Tanggal mulai sudah lewat. Catat juga semua kejadian yang terlewat sejak tanggal itu.', 'The start date is in the past. Also log every occurrence missed since then.'],
  rec_link_debt: ['Kaitkan ke utang / piutang', 'Link to a debt / receivable'], rec_link_debt_hint: ['Tiap kejadian ikut mengurangi sisa utang.', 'Each occurrence also reduces the remaining balance.'],
  rec_auto_logged: ['{n} transaksi otomatis dicatat', '{n} automatic transactions logged'],
  rec_deleted: ['Aturan dihapus', 'Rule deleted'], rec_saved: ['Aturan disimpan', 'Rule saved'],

  // menu favorit
  fav_title: ['Menu Favorit', 'Favorite Orders'], fav_manage: ['Kelola', 'Manage'], fav_create: ['Buat', 'Create'],
  fav_hint: ['Simpan pesanan yang sering diulang, mis. "Kafe langganan: Latte + Croissant", lalu catat dengan satu ketukan.', 'Save orders you repeat often, e.g. "Usual cafe: Latte + Croissant", then log them with one tap.'],
  fav_one_tap: ['Satu ketukan', 'One tap'], fav_page_title: ['Menu Favorit', 'Favorite Orders'],
  fav_page_subtitle: ['Catat pesanan langganan dengan satu ketukan.', 'Log your usual orders with a single tap.'],
  fav_new: ['Favorit Baru', 'New Favorite'], fav_edit: ['Ubah Favorit', 'Edit Favorite'],
  fav_empty_title: ['Belum ada favorit', 'No favorites yet'],
  fav_empty_text: ['Buat favorit atau centang "Simpan sebagai favorit" saat mencatat transaksi.', 'Create a favorite or tick "Save as favorite" when logging a transaction.'],
  fav_used: ['dipakai {n}×', 'used {n}×'], fav_log_now: ['Catat sekarang', 'Log now'],
  fav_name: ['Nama favorit', 'Favorite name'], fav_name_ph: ['mis. Kafe langganan', 'e.g. Usual cafe'],
  fav_items: ['Rincian menu', 'Items'], fav_add_item: ['Tambah item', 'Add item'], fav_item_ph: ['mis. Latte', 'e.g. Latte'],
  fav_items_hint: ['Tambahkan menu dan harganya, atau isi jumlah total saja di bawah.', 'Add items and prices, or just enter a single total below.'],
  fav_save_checkbox: ['Simpan sebagai menu favorit', 'Save as favorite order'], fav_save_name_ph: ['Nama favorit', 'Favorite name'],
  fav_logged: ['Tercatat: {name} ({amount})', 'Logged: {name} ({amount})'], fav_undo: ['Urungkan', 'Undo'],
  fav_saved: ['Favorit disimpan', 'Favorite saved'], fav_deleted: ['Favorit dihapus', 'Favorite deleted'],

  // notifikasi (pengaturan)
  ns_title: ['Pengingat & Notifikasi', 'Reminders & Notifications'],
  ns_subtitle: ['Tagihan, tugas, agenda, dan kebiasaan dikirim sebagai notifikasi di HP.', 'Bills, tasks, events and habits are delivered as notifications on your phone.'],
  ns_master: ['Aktifkan pengingat', 'Enable reminders'],
  ns_perm_granted: ['Izin notifikasi diberikan', 'Notification permission granted'], ns_perm_denied: ['Izin notifikasi ditolak', 'Notification permission denied'],
  ns_perm_prompt: ['Izin akan diminta saat diaktifkan', 'Permission will be requested when enabled'], ns_perm_unsupported: ['Perangkat ini tidak mendukung notifikasi', 'This device does not support notifications'],
  ns_denied_help: ['Buka Pengaturan HP → Aplikasi → LIFE OS → Notifikasi, lalu izinkan.', 'Open phone Settings → Apps → LIFE OS → Notifications and allow them.'],
  ns_web_note: ['Di peramban, pengingat hanya muncul saat halaman terbuka. Pasang aplikasi Android agar tetap berbunyi saat tertutup.', 'In a browser, reminders only appear while the page is open. Install the Android app for reminders even when it is closed.'],
  ns_bills: ['Tagihan & cicilan jatuh tempo', 'Bills & installments due'], ns_bills_hint: ['Langganan, utang, dan piutang', 'Subscriptions, debts and receivables'],
  ns_days_before: ['Ingatkan lebih awal', 'Remind in advance'], ns_only_due_day: ['Hanya di hari jatuh tempo', 'Only on the due day'], ns_n_days_before: ['{n} hari sebelumnya', '{n} days before'],
  ns_time: ['Jam', 'Time'], ns_tasks: ['Tenggat tugas', 'Task deadlines'], ns_tasks_hint: ['Pada hari tenggat, dan sehari sebelumnya untuk tugas penting', 'On the due day, and the day before for important tasks'],
  ns_events: ['Agenda kalender', 'Calendar events'], ns_events_hint: ['Sesuai pengingat yang diatur pada tiap agenda', 'According to each event\'s reminder'],
  ns_habits: ['Kebiasaan harian', 'Daily habits'], ns_habits_hint: ['Pengingat bila masih ada kebiasaan yang belum selesai', 'A nudge while habits are still unfinished'],
  ns_birthdays: ['Ulang tahun relasi', 'Contact birthdays'], ns_birthdays_hint: ['Jam 09.00 pada hari ulang tahun', 'At 09:00 on the birthday'],
  ns_budget: ['Peringatan anggaran', 'Budget alerts'], ns_budget_hint: ['Saat pengeluaran kategori mencapai 80% dan 100%', 'When a category reaches 80% and 100% of its limit'],
  ns_weekly: ['Ringkasan mingguan', 'Weekly summary'], ns_weekly_hint: ['Tiap hari Minggu', 'Every Sunday'],
  ns_test: ['Kirim notifikasi uji', 'Send a test notification'], ns_upcoming: ['Pengingat terdekat', 'Upcoming reminders'],
  ns_none_upcoming: ['Belum ada pengingat terjadwal.', 'No reminders scheduled yet.'], ns_enable_to_see: ['Aktifkan pengingat untuk melihat jadwalnya.', 'Enable reminders to see the schedule.'],
  ns_every_sunday: ['Tiap Minggu', 'Every Sunday'], ns_test_title: ['Notifikasi uji', 'Test notification'], ns_test_body: ['Pengingat LIFE OS berfungsi dengan baik.', 'LIFE OS reminders are working.'],
  ns_channel_desc: ['Pengingat tagihan, tugas, dan kebiasaan', 'Reminders for bills, tasks and habits'],

  // isi notifikasi
  n_bill_title: ['Tagihan jatuh tempo: {name}', 'Bill due: {name}'], n_debt_title: ['Cicilan jatuh tempo: {name}', 'Installment due: {name}'],
  n_receivable_title: ['Piutang jatuh tempo: {name}', 'Receivable due: {name}'],
  n_due_today_body: ['{amount} jatuh tempo hari ini.', '{amount} is due today.'], n_due_soon_body: ['{amount} jatuh tempo {days} hari lagi ({date}).', '{amount} is due in {days} days ({date}).'],
  n_late_title: ['Terlambat: {name}', 'Overdue: {name}'], n_late_body: ['{amount} sudah lewat jatuh tempo ({date}).', '{amount} is past its due date ({date}).'],
  n_task_title: ['Tenggat tugas', 'Task deadline'], n_task_body: ['"{name}" jatuh tempo hari ini.', '"{name}" is due today.'], n_task_tomorrow: ['"{name}" jatuh tempo besok.', '"{name}" is due tomorrow.'],
  n_event_title: ['Agenda: {name}', 'Event: {name}'], n_event_body: ['Mulai {time} {place}', 'Starts {time} {place}'],
  n_habit_title: ['Kebiasaan hari ini', 'Today\'s habits'], n_habit_body: ['Jangan lupa: {names}', 'Don\'t forget: {names}'],
  n_birthday_title: ['Ulang tahun {name}', '{name}\'s birthday'], n_birthday_body: ['Hari ini {name} berulang tahun. Kirim ucapan!', 'It\'s {name}\'s birthday today. Send your wishes!'],
  n_weekly_title: ['Ringkasan mingguan siap', 'Your weekly summary is ready'], n_weekly_body: ['Lihat pengeluaran, kebiasaan, dan targetmu minggu ini.', 'See this week\'s spending, habits and goals.'],
  n_budget_title_80: ['Anggaran {cat} hampir habis', '{cat} budget almost used up'], n_budget_title_100: ['Anggaran {cat} terlampaui', '{cat} budget exceeded'],
  n_budget_body: ['{spent} dari {limit} ({pct}%).', '{spent} of {limit} ({pct}%).'],
  n_backup_title: ['Cadangan otomatis perlu masuk ulang', 'Auto backup needs you to sign in again'], n_backup_body: ['Ketuk untuk masuk ulang ke Google Drive.', 'Tap to sign in to Google Drive again.'],

  // kunci aplikasi
  sec_title: ['Kunci Aplikasi', 'App Lock'], sec_subtitle: ['Lindungi data keuangan dengan PIN atau sidik jari.', 'Protect your financial data with a PIN or fingerprint.'],
  sec_status_on: ['Kunci aktif', 'Lock is on'], sec_status_off: ['Kunci mati', 'Lock is off'],
  sec_status_on_hint: ['PIN {n} digit melindungi aplikasi', '{n}-digit PIN protects the app'], sec_status_off_hint: ['Siapa pun yang memegang HP dapat membuka data.', 'Anyone holding the phone can open your data.'],
  sec_pin_length: ['Panjang PIN', 'PIN length'], sec_digits: ['{n} digit', '{n} digits'], sec_enable: ['Aktifkan kunci PIN', 'Turn on PIN lock'],
  sec_setup: ['Buat PIN', 'Create PIN'], sec_change: ['Ubah PIN', 'Change PIN'], sec_disable: ['Matikan kunci', 'Turn off lock'],
  sec_enter_current: ['Masukkan PIN saat ini', 'Enter your current PIN'], sec_enter_new: ['Masukkan PIN baru ({n} digit)', 'Enter a new PIN ({n} digits)'], sec_confirm_new: ['Ulangi PIN untuk konfirmasi', 'Re-enter the PIN to confirm'],
  sec_mismatch: ['PIN tidak sama, ulangi dari awal.', 'PINs do not match, start again.'], sec_pin_hint: ['Hindari PIN yang mudah ditebak seperti 1234.', 'Avoid easy PINs such as 1234.'],
  sec_biometric: ['Buka dengan sidik jari / wajah', 'Unlock with fingerprint / face'], sec_biometric_hint: ['PIN tetap bisa dipakai sebagai cadangan', 'The PIN still works as a fallback'],
  sec_biometric_na: ['Tidak tersedia di perangkat ini (atau belum ada sidik jari terdaftar)', 'Not available on this device (or no fingerprint enrolled)'],
  sec_timeout: ['Kunci kembali setelah ditinggalkan', 'Lock again after leaving'], sec_t_immediately: ['Segera', 'Immediately'], sec_t_seconds: ['{n} detik', '{n} seconds'], sec_t_minutes: ['{n} menit', '{n} minutes'],
  sec_timeout_hint: ['Berlaku saat aplikasi dikecilkan atau berpindah ke aplikasi lain.', 'Applies when the app is minimized or you switch to another app.'],
  sec_lock_now: ['Kunci sekarang', 'Lock now'], sec_local_note: ['PIN hanya disimpan di perangkat ini (terenkripsi satu arah) dan tidak ikut cadangan.', 'The PIN is stored only on this device (one-way hashed) and is not included in backups.'],
  sec_enabled_notice: ['Kunci aplikasi diaktifkan.', 'App lock turned on.'], sec_disabled_notice: ['Kunci aplikasi dimatikan.', 'App lock turned off.'],
  lock_title: ['LIFE OS terkunci', 'LIFE OS is locked'], lock_subtitle: ['Masukkan PIN untuk membuka', 'Enter your PIN to unlock'], lock_hello: ['Halo, {name}. Masukkan PIN.', 'Hi, {name}. Enter your PIN.'],
  lock_wrong: ['PIN salah', 'Wrong PIN'], lock_wait: ['Terlalu banyak percobaan. Coba lagi dalam {s} detik.', 'Too many attempts. Try again in {s} seconds.'],
  lock_backspace: ['Hapus digit', 'Delete digit'], lock_use_bio: ['Pakai sidik jari', 'Use fingerprint'], lock_use_pin: ['Pakai PIN', 'Use PIN'],
  lock_bio_reason: ['Buka LIFE OS', 'Unlock LIFE OS'], lock_bio_title: ['Buka kunci', 'Unlock'], lock_bio_subtitle: ['Pindai sidik jari atau wajah', 'Scan your fingerprint or face'],
  auth_google: ['Masuk dengan Google', 'Continue with Google'],
  auth_google_note: ['Data tersimpan di Google Drive Anda sendiri dan sinkron antar perangkat. Tanpa server, tanpa kode admin.', 'Your data is saved in your own Google Drive and syncs across devices. No server, no admin code.'],
  auth_or_email: ['atau pakai email di perangkat ini', 'or use email on this device'],
  google_err_drive: ['Izin Google Drive belum diberikan. Ulangi dan centang akses Drive agar data bisa disimpan.', 'Google Drive access was not granted. Try again and allow Drive access so your data can be saved.'],
  google_err_cancel: ['Masuk dibatalkan.', 'Sign-in was cancelled.'],
  google_err_generic: ['Tidak bisa masuk dengan Google. Coba lagi.', 'Could not sign in with Google. Please try again.'],
  sync_google: ['Tersinkron ke Google Drive', 'Synced to Google Drive'],
  sync_syncing: ['Menyinkronkan...', 'Syncing...'],
  sync_offline: ['Offline, akan dikirim nanti', 'Offline, will sync later'],
  sync_auth: ['Perlu masuk ulang ke Google', 'Google sign-in needed'],
  sync_local: ['Tersimpan di perangkat ini', 'Saved on this device'],
  sync_reconnect: ['Sambungkan ulang Google', 'Reconnect Google'],
  lock_forgot_google: ['Verifikasi dengan akun Google Anda untuk mengatur ulang kunci.', 'Verify with your Google account to reset the lock.'],
  lock_forgot: ['Lupa PIN?', 'Forgot PIN?'], lock_forgot_help: ['Masukkan kata sandi akun untuk mengatur ulang kunci.', 'Enter your account password to reset the lock.'],
  lock_password: ['Kata sandi akun', 'Account password'], lock_password_wrong: ['Kata sandi salah.', 'Wrong password.'], lock_reset_pin: ['Atur ulang kunci', 'Reset lock'],

  // pencarian
  search_title: ['Pencarian', 'Search'], search_placeholder: ['Cari transaksi, catatan, tugas, kontak…', 'Search transactions, notes, tasks, contacts…'],
  search_clear: ['Hapus pencarian', 'Clear search'], search_hint: ['Ketik kata, nama, atau jumlah uang. Semua modul dicari sekaligus.', 'Type a word, name or amount. Every module is searched at once.'],
  search_none: ['Tidak ada hasil untuk "{q}"', 'No results for "{q}"'], search_count: ['{n} hasil', '{n} results'], search_show_more: ['Tampilkan {n} lagi', 'Show {n} more'],
  search_g_transactions: ['Transaksi', 'Transactions'], search_g_notes: ['Catatan', 'Notes'], search_g_tasks: ['Tugas', 'Tasks'], search_g_contacts: ['Kontak', 'Contacts'],
  search_g_events: ['Agenda', 'Events'], search_g_finance: ['Tagihan, Utang & Otomatis', 'Bills, Debts & Automatic'], search_g_growth: ['Tujuan, Kebiasaan & Tabungan', 'Goals, Habits & Savings'], search_g_shopping: ['Belanja', 'Shopping'],

  // ekspor
  exp_title: ['Ekspor Laporan Bulanan', 'Export Monthly Report'], exp_subtitle: ['Untuk arsip atau dibagikan.', 'For your records or to share.'], exp_month: ['Bulan', 'Month'],
  exp_pdf_desc: ['Ringkasan, kategori, anggaran, dan daftar transaksi', 'Summary, categories, budgets and transaction list'],
  exp_xlsx_desc: ['Tiga lembar: ringkasan, kategori, transaksi', 'Three sheets: summary, categories, transactions'], exp_csv_desc: ['Hanya daftar transaksi', 'Transaction list only'],
  exp_share_title: ['Bagikan laporan', 'Share report'], exp_done: ['Laporan siap', 'Report ready'], exp_failed: ['Gagal membuat laporan.', 'Could not create the report.'],
  rp_title: ['Laporan Keuangan Bulanan', 'Monthly Financial Report'], rp_income: ['Pemasukan', 'Income'], rp_expense: ['Pengeluaran', 'Expenses'], rp_transfer: ['Transfer', 'Transfer'],
  rp_net: ['Selisih bersih', 'Net result'], rp_savings_rate: ['Rasio tabungan', 'Savings rate'], rp_tx_count: ['Jumlah transaksi', 'Number of transactions'],
  rp_prev_month: ['Bulan lalu', 'Last month'], rp_item: ['Ringkasan', 'Item'], rp_amount: ['Jumlah', 'Amount'], rp_account: ['Rekening', 'Account'], rp_accounts: ['Saldo Rekening Akhir Bulan', 'Account Balances at Month End'],
  rp_end_balance: ['Saldo akhir bulan', 'Month-end balance'], rp_net_worth_end: ['Total kekayaan bersih', 'Total net worth'],
  rp_sheet_summary: ['Ringkasan', 'Summary'], rp_sheet_categories: ['Kategori', 'Categories'], rp_sheet_transactions: ['Transaksi', 'Transactions'],
  rp_category: ['Kategori', 'Category'], rp_spent: ['Terpakai', 'Spent'], rp_share: ['Porsi', 'Share'], rp_budget: ['Anggaran', 'Budget'], rp_used: ['Terpakai (%)', 'Used (%)'], rp_total: ['Total', 'Total'],
  rp_income_sources: ['Sumber pemasukan', 'Income sources'], rp_date: ['Tanggal', 'Date'], rp_type: ['Jenis', 'Type'], rp_description: ['Keterangan', 'Description'],
  rp_method: ['Metode', 'Method'], rp_notes: ['Catatan', 'Notes'], rp_page: ['Halaman', 'Page'], rp_none: ['Tidak ada data.', 'No data.'],
  rp_spend_by_category: ['Pengeluaran per Kategori', 'Spending by Category'], rp_budget_status: ['Status Anggaran', 'Budget Status'], rp_transactions: ['Daftar Transaksi', 'Transactions'],
  rp_cmp_more: ['Pengeluaran {pct}% lebih tinggi dari bulan lalu.', 'Spending is {pct}% higher than last month.'], rp_cmp_less: ['Pengeluaran {pct}% lebih rendah dari bulan lalu.', 'Spending is {pct}% lower than last month.'],
  rp_cmp_same: ['Pengeluaran sama dengan bulan lalu.', 'Spending is the same as last month.'],

  // ringkasan mingguan
  wk_title: ['Ringkasan Mingguan', 'Weekly Summary'], wk_subtitle: ['Pengeluaran, kebiasaan, dan target minggu ini', 'This week\'s spending, habits and goals'],
  wk_range: ['{from} – {to}', '{from} – {to}'], wk_spent: ['Pengeluaran minggu ini', 'Spent this week'], wk_income: ['Pemasukan', 'Income'],
  wk_last_week: ['Minggu lalu {amount}', 'Last week {amount}'], wk_no_prev: ['Belum ada data minggu lalu', 'No data for last week'], wk_same: ['Sama seperti minggu lalu', 'Same as last week'],
  wk_less: ['{pct}% lebih hemat', '{pct}% less'], wk_more: ['{pct}% lebih boros', '{pct}% more'],
  wk_no_spend: ['{n} dari {of} hari tanpa belanja', '{n} of {of} days with no spending'],
  wk_top_cat: ['Terbanyak: {cat} ({amount})', 'Top category: {cat} ({amount})'], wk_rise: ['Naik paling tinggi: {cat} (+{amount})', 'Biggest rise: {cat} (+{amount})'], wk_drop: ['Turun paling banyak: {cat} (-{amount})', 'Biggest drop: {cat} (-{amount})'],
  wk_habits: ['Kebiasaan', 'Habits'], wk_no_habits: ['Belum ada kebiasaan.', 'No habits yet.'], wk_consistent: ['{n} dari {total} kebiasaan konsisten', '{n} of {total} habits on track'],
  wk_habit_short: ['{n}/{total} kebiasaan konsisten', '{n}/{total} habits on track'],
  wk_targets: ['Target yang bergerak', 'Goals on the move'], wk_no_targets: ['Belum ada pergerakan target minggu ini.', 'No goal movement this week.'],
  wk_saving_moved: ['{name}: {amount} (kini {pct}%)', '{name}: {amount} (now {pct}%)'], wk_goal_progress: ['{name}: {done}/{total} tonggak', '{name}: {done}/{total} milestones'],
  wk_tasks_done: ['{n} tugas selesai minggu ini.', '{n} tasks completed this week.'], wk_see_detail: ['Lihat rincian', 'See details'], wk_dismiss: ['Sembunyikan', 'Dismiss'],

  // kalender
  cal_due_title: ['Tagihan, Cicilan & Otomatis', 'Bills, Installments & Automatic'], cal_due_none: ['Tidak ada jatuh tempo pada hari ini.', 'Nothing is due on this day.'],
  cal_kind_bill: ['Tagihan', 'Bill'], cal_kind_debt: ['Cicilan / utang', 'Installment / debt'], cal_kind_receivable: ['Piutang', 'Receivable'],
  cal_kind_auto_out: ['Pengeluaran otomatis', 'Automatic expense'], cal_kind_auto_in: ['Pemasukan otomatis', 'Automatic income'], cal_paid: ['lunas', 'paid'], cal_recorded: ['tercatat', 'recorded'],

  // cadangan
  bk_desc: ['Cadangkan seluruh data ke Google Drive pribadimu.', 'Back up all your data to your own Google Drive.'], bk_backup: ['Cadangkan sekarang', 'Back up now'], bk_restore: ['Pulihkan', 'Restore'],
  bk_last: ['Cadangan terakhir:', 'Last backup:'], bk_saved: ['Cadangan tersimpan di Google Drive.', 'Backup saved to Google Drive.'], bk_none: ['Belum ada cadangan di Drive.', 'No backup found on Drive.'],
  bk_confirm_restore: ['Pulihkan cadangan dari {when}? Data saat ini akan diganti.', 'Restore the backup from {when}? Current data will be replaced.'],
  bk_failed: ['Gagal:', 'Failed:'], bk_err_auth: ['Masuk ke Google dibatalkan atau kedaluwarsa. Coba lagi.', 'Google sign-in was cancelled or expired. Try again.'],
  bk_err_load: ['Gagal memuat Google Sign-In. Periksa koneksi.', 'Could not load Google Sign-In. Check your connection.'], bk_err_http: ['Drive menolak permintaan (kode {code}).', 'Drive rejected the request (code {code}).'],
  bk_err_network: ['Tidak ada koneksi internet.', 'No internet connection.'], bk_err_generic: ['Terjadi kesalahan tak terduga.', 'An unexpected error occurred.'],
  bk_auto: ['Cadangan otomatis', 'Automatic backup'], bk_auto_desc: ['Unggah cadangan terjadwal bila data berubah.', 'Upload a scheduled backup when data changes.'],
  bk_auto_on: ['Cadangan otomatis aktif.', 'Automatic backup is on.'], bk_daily: ['Harian', 'Daily'], bk_weekly: ['Mingguan', 'Weekly'],
  bk_needs_auth: ['Google meminta masuk ulang. Ketuk sekali agar cadangan otomatis berlanjut.', 'Google needs you to sign in again. Tap once so automatic backups can continue.'], bk_reauth: ['Masuk ulang & cadangkan', 'Sign in & back up'],
  bk_auto_note: ['Berjalan saat aplikasi dibuka atau aktif; Android tidak mengizinkan aplikasi web berjalan saat benar-benar tertutup.', 'Runs while the app is open or active; Android does not let a web app run when fully closed.'],

  // anggaran
  budget_alert_toast: ['Anggaran {cat}: {pct}% terpakai', '{cat} budget: {pct}% used'],

  // navigasi & menu
  nav_recurring: ['Transaksi Berulang', 'Recurring'], nav_templates: ['Menu Favorit', 'Favorites'], nav_notifications: ['Pengingat', 'Reminders'], nav_security: ['Kunci Aplikasi', 'App Lock'],
  menu_search: ['Cari', 'Search'], menu_export: ['Ekspor Laporan', 'Export Report'], menu_weekly: ['Ringkasan Mingguan', 'Weekly Summary'],
  svc_recurring: ['Berulang', 'Recurring'], svc_templates: ['Favorit', 'Favorites'], svc_notifications: ['Pengingat', 'Reminders'], svc_security: ['Kunci', 'Lock'],
  profile_lock_hint_on: ['Aktif', 'On'], profile_lock_hint_off: ['Mati', 'Off'],
  tx_make_recurring: ['Ulangi otomatis tiap bulan', 'Repeat automatically every month'],
};

export const makeTr = (lang) => {
  const i = lang === 'id' ? 0 : 1;
  return (key, vars) => {
    const entry = S[key];
    let out = entry ? entry[i] : key;
    if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : String(vars[k])));
    return out;
  };
};
export const hasKey = (k) => k in S;
export const ALL_KEYS = Object.keys(S);
