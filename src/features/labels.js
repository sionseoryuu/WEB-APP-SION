// Label tampilan untuk nilai enum yang disimpan dalam bahasa Inggris di data (agar UI konsisten satu bahasa).
const L = {
  priority: { Urgent: ['Mendesak', 'Urgent'], High: ['Tinggi', 'High'], Medium: ['Sedang', 'Medium'], Low: ['Rendah', 'Low'] },
  taskCategory: { Work: ['Pekerjaan', 'Work'], Finance: ['Keuangan', 'Finance'], Health: ['Kesehatan', 'Health'], Personal: ['Pribadi', 'Personal'], Learning: ['Belajar', 'Learning'], Productivity: ['Produktivitas', 'Productivity'], Mindset: ['Pola Pikir', 'Mindset'] },
  taskStatus: { todo: ['Akan Dikerjakan', 'To Do'], in_progress: ['Sedang Dikerjakan', 'In Progress'], completed: ['Selesai', 'Completed'] },
  reminder: { None: ['Tanpa pengingat', 'None'], '15 min before': ['15 menit sebelumnya', '15 min before'], '1 hour before': ['1 jam sebelumnya', '1 hour before'], '1 day before': ['1 hari sebelumnya', '1 day before'] },
  timeOfDay: { Morning: ['Pagi', 'Morning'], Afternoon: ['Siang', 'Afternoon'], Evening: ['Malam', 'Evening'], Anytime: ['Kapan Saja', 'Anytime'] },
  horizon: { 'Short-Term': ['Jangka Pendek', 'Short-Term'], 'Long-Term': ['Jangka Panjang', 'Long-Term'] },
  goalCategory: { Career: ['Karier', 'Career'], Financial: ['Keuangan', 'Financial'], Health: ['Kesehatan', 'Health'], Personal: ['Pribadi', 'Personal'] },
  contact: { Family: ['Keluarga', 'Family'], Client: ['Klien', 'Client'], Mentor: ['Mentor', 'Mentor'], Friend: ['Teman', 'Friend'] },
  noteType: { Note: ['Catatan', 'Note'], Journal: ['Jurnal', 'Journal'] },
  noteCategory: { 'Daily Journal': ['Jurnal Harian', 'Daily Journal'], Finance: ['Keuangan', 'Finance'], Personal: ['Pribadi', 'Personal'], Work: ['Pekerjaan', 'Work'], Learning: ['Belajar', 'Learning'], Health: ['Kesehatan', 'Health'] },
  shopCategory: { Pantry: ['Bahan Pokok', 'Pantry'], Produce: ['Sayur & Buah', 'Produce'], Household: ['Rumah Tangga', 'Household'], Electronics: ['Elektronik', 'Electronics'], Personal: ['Pribadi', 'Personal'] },
  accountType: { Checking: ['Giro', 'Checking'], Savings: ['Tabungan', 'Savings'], Credit: ['Kartu Kredit', 'Credit Card'], Cash: ['Tunai', 'Cash'], Investment: ['Investasi', 'Investment'] },
  assetClass: { Gold: ['Emas', 'Gold'], 'Mutual Fund': ['Reksadana', 'Mutual Fund'], Stocks: ['Saham', 'Stocks'], Bonds: ['Obligasi & SBN', 'Bonds'], Other: ['Lainnya', 'Other'] },
  billingCycle: { Monthly: ['Bulanan', 'Monthly'], Yearly: ['Tahunan', 'Yearly'], Weekly: ['Mingguan', 'Weekly'] },
  debtKind: { debt: ['Utang / Cicilan', 'Debt / Installment'], receivable: ['Piutang', 'Receivable'] },
  payment: {
    'Card / Digital': ['Kartu / Digital', 'Card / Digital'],
    'Auto / Recurring': ['Otomatis / Berulang', 'Auto / Recurring'],
    'Ledger Settlement': ['Pelunasan Buku Kas', 'Ledger Settlement'],
    'Internal Ledger Transfer': ['Transfer Internal', 'Internal Transfer'],
    'Split Bill / Card': ['Bagi Tagihan / Kartu', 'Split Bill / Card'],
    'Card / Wallet': ['Kartu / Dompet', 'Card / Wallet'],
    'Cash': ['Tunai', 'Cash'],
  },
  transferCategory: { 'Vault Allocation': ['Alokasi Brankas', 'Vault Allocation'], 'Account Rebalance': ['Penyeimbangan Akun', 'Account Rebalance'], 'Credit Card Settlement': ['Pelunasan Kartu Kredit', 'Credit Card Settlement'] },
};

export const enumLabel = (group, value, lang) => {
  const hit = L[group]?.[value];
  if (!hit) return value == null ? '' : String(value);
  return hit[lang === 'id' ? 0 : 1];
};
export const accountTypeLabel = (v, lang) => enumLabel('accountType', v, lang);
export const paymentLabel = (v, lang) => enumLabel('payment', v, lang);
export const priorityLabel = (v, lang) => enumLabel('priority', v, lang);
export const reminderLabel = (v, lang) => enumLabel('reminder', v, lang);
export const transferCategoryLabel = (v, lang) => enumLabel('transferCategory', v, lang);

// Cari label di semua grup (untuk nilai yang asal-grupnya tidak diketahui, mis. hasil pencarian)
export const anyEnumLabel = (value, lang) => {
  for (const g of Object.keys(L)) if (L[g][value]) return L[g][value][lang === 'id' ? 0 : 1];
  return value == null ? '' : String(value);
};
