// Tagihan, cicilan, piutang & transaksi otomatis untuk ditampilkan di Kalender (dan dipakai pengingat).
import { addMonthsKey, dateInMonth, monthKey, parseYmd } from './dates.js';
import { occurrences } from './recurring.js';

// Mengembalikan peta tanggal -> daftar item untuk satu bulan ('YYYY-MM')
export function dueItemsForMonth(data, key) {
  const map = {};
  const add = (date, item) => {
    (map[date] = map[date] || []).push(item);
  };
  (data.subscriptions || []).forEach((s) => {
    const date = dateInMonth(key, Number(s.dueDay) || 1);
    add(date, {
      kind: 'bill',
      id: `bill-${s.id}-${key}`,
      refId: s.id,
      title: s.name,
      amount: Number(s.amount) || 0,
      paid: s.lastPaidMonth === key || (s.lastPaidMonth && s.lastPaidMonth > key),
      tab: 'subscriptions',
    });
  });
  (data.debts || []).forEach((d) => {
    const remaining = (Number(d.totalAmount) || 0) - (Number(d.paidAmount) || 0);
    if (!d.dueDate || monthKey(d.dueDate) !== key) return;
    add(d.dueDate, {
      kind: d.kind === 'receivable' ? 'receivable' : 'debt',
      id: `debt-${d.id}`,
      refId: d.id,
      title: d.title,
      amount: Math.min(Number(d.monthlyAmount) || remaining, Math.max(0, remaining)) || remaining,
      paid: remaining <= 0,
      tab: 'debts',
    });
  });
  (data.recurring || []).forEach((r) => {
    if (r.active === false) return;
    const first = `${key}-01`;
    const last = dateInMonth(key, 31);
    occurrences(r, '', last)
      .filter((d) => d >= first)
      .forEach((date) => {
        add(date, {
          kind: r.type === 'income' ? 'auto_in' : 'auto_out',
          id: `rec-${r.id}-${date}`,
          refId: r.id,
          title: r.name,
          amount: Number(r.amount) || 0,
          paid: date <= (r.lastRun || ''),
          tab: 'recurring',
        });
      });
  });
  return map;
}

// Daftar item jatuh tempo dalam rentang [from, to] (inklusif) yang belum lunas — untuk pengingat & kartu Beranda
export function upcomingDue(data, from, to) {
  const out = [];
  let key = monthKey(from);
  const lastKey = monthKey(to);
  let guard = 0;
  while (key <= lastKey && guard < 24) {
    const map = dueItemsForMonth(data, key);
    Object.entries(map).forEach(([date, items]) => {
      if (date < from || date > to) return;
      items.forEach((it) => {
        if (!it.paid && (it.kind === 'bill' || it.kind === 'debt' || it.kind === 'receivable')) out.push({ ...it, date });
      });
    });
    key = addMonthsKey(key, 1);
    guard += 1;
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export const KIND_TONE = {
  bill: 'bg-[#D96B52]',
  debt: 'bg-[#D9A441]',
  receivable: 'bg-[#87B082]',
  auto_out: 'bg-life-soft',
  auto_in: 'bg-[#87B082]',
};
export { parseYmd };
