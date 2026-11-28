// Model laporan bulanan + penulis PDF (tanpa dependensi) dan Excel.
import { catName } from '../ewallet/helpers.js';
import { fmtMonth, fmtDate, addMonthsKey, dateInMonth } from './dates.js';
import { createXlsx } from './xlsx.js';

// Anggaran berlaku berkelanjutan (sama dengan App.jsx: pakai anggaran terbaru ≤ bulan terpilih)
export function effectiveBudgetsFor(budgets = [], month) {
  const byCat = {};
  budgets.forEach((b) => {
    if (!b.month || b.month > month) return;
    if (!byCat[b.category] || b.month > byCat[b.category].month) byCat[b.category] = b;
  });
  return Object.values(byCat);
}

export function buildMonthlyReport(data, month, lang) {
  const txs = data.transactions || [];
  const inMonth = txs.filter((t) => String(t.date).startsWith(month)).sort((a, b) => a.date.localeCompare(b.date));
  const sum = (list, type) => list.filter((t) => t.type === type).reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const prevKey = addMonthsKey(month, -1);
  const prevTx = txs.filter((t) => String(t.date).startsWith(prevKey));
  const income = sum(inMonth, 'income');
  const expense = sum(inMonth, 'expense');
  const catMap = {};
  inMonth.filter((t) => t.type === 'expense').forEach((t) => {
    catMap[t.category] = (catMap[t.category] || 0) + (Number(t.amount) || 0);
  });
  const budgets = effectiveBudgetsFor(data.budgets, month);
  const budgetOf = Object.fromEntries(budgets.map((b) => [b.category, Number(b.limit) || 0]));
  const categories = Object.entries(catMap)
    .map(([category, amount]) => ({
      category,
      label: catName(category, lang),
      amount,
      pct: expense > 0 ? (amount / expense) * 100 : 0,
      budget: budgetOf[category] || 0,
      usedPct: budgetOf[category] ? (amount / budgetOf[category]) * 100 : null,
    }))
    .sort((a, b) => b.amount - a.amount);
  const incomeMap = {};
  inMonth.filter((t) => t.type === 'income').forEach((t) => {
    incomeMap[t.category] = (incomeMap[t.category] || 0) + (Number(t.amount) || 0);
  });
  const incomeCats = Object.entries(incomeMap)
    .map(([category, amount]) => ({ category, label: catName(category, lang), amount }))
    .sort((a, b) => b.amount - a.amount);

  // Saldo akhir bulan per akun
  const endDate = dateInMonth(month, 31);
  const accounts = (data.accounts || []).map((a) => {
    let bal = Number(a.initialBalance) || 0;
    txs.forEach((t) => {
      if (t.date > endDate) return;
      if (t.type === 'income' && t.accountId === a.id) bal += t.amount;
      else if (t.type === 'expense' && t.accountId === a.id) bal -= t.amount;
      else if (t.type === 'transfer') {
        if (t.accountId === a.id) bal -= t.amount;
        if (t.toAccountId === a.id) bal += t.amount;
      }
    });
    return { name: a.name, balance: bal };
  });
  const accName = Object.fromEntries((data.accounts || []).map((a) => [a.id, a.name]));

  return {
    month,
    monthLabel: fmtMonth(month, lang),
    currency: data.profile?.currency || 'Rp',
    owner: data.profile?.name || '',
    totals: {
      income,
      expense,
      net: income - expense,
      savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : null,
      count: inMonth.length,
      prevIncome: sum(prevTx, 'income'),
      prevExpense: sum(prevTx, 'expense'),
    },
    categories,
    incomeCats,
    accounts,
    netWorthEnd: accounts.reduce((s, a) => s + a.balance, 0),
    budgets: budgets.map((b) => {
      const spent = catMap[b.category] || 0;
      return { category: b.category, label: catName(b.category, lang), limit: Number(b.limit) || 0, spent, pct: b.limit > 0 ? (spent / b.limit) * 100 : 0 };
    }),
    transactions: inMonth.map((t) => ({
      date: t.date,
      type: t.type,
      category: catName(t.category, lang),
      description: t.description || '',
      account: accName[t.accountId] || '',
      method: t.paymentMethod || '',
      amount: Number(t.amount) || 0,
      notes: t.notes || '',
    })),
    debts: (data.debts || [])
      .filter((d) => (d.totalAmount || 0) - (d.paidAmount || 0) > 0)
      .map((d) => ({ title: d.title, kind: d.kind, remaining: d.totalAmount - d.paidAmount, due: d.dueDate })),
  };
}

// ---------------- Excel ----------------
export function reportToXlsx(rep, tr, lang) {
  const H = (v) => ({ v, s: 2 });
  const N = (v) => ({ v, s: 3 });
  const B = (v) => ({ v, s: 6 });
  const NB = (v) => ({ v, s: 5 });
  const typeLabel = (t) => (t === 'income' ? tr('rp_income') : t === 'expense' ? tr('rp_expense') : tr('rp_transfer'));
  const summary = {
    name: tr('rp_sheet_summary'),
    widths: [34, 20, 20],
    rows: [
      [{ v: `${tr('rp_title')} — ${rep.monthLabel}`, s: 1 }],
      [rep.owner],
      [],
      [H(tr('rp_item')), H(tr('rp_amount')), H(tr('rp_prev_month'))],
      [tr('rp_income'), N(rep.totals.income), N(rep.totals.prevIncome)],
      [tr('rp_expense'), N(rep.totals.expense), N(rep.totals.prevExpense)],
      [B(tr('rp_net')), NB(rep.totals.net), NB(rep.totals.prevIncome - rep.totals.prevExpense)],
      [tr('rp_savings_rate'), rep.totals.savingsRate === null ? '-' : { v: rep.totals.savingsRate / 100, s: 4 }],
      [tr('rp_tx_count'), rep.totals.count],
      [],
      [H(tr('rp_account')), H(tr('rp_end_balance'))],
      ...rep.accounts.map((a) => [a.name, N(a.balance)]),
      [B(tr('rp_net_worth_end')), NB(rep.netWorthEnd)],
    ],
  };
  const cats = {
    name: tr('rp_sheet_categories'),
    widths: [32, 18, 12, 18, 14],
    rows: [
      [H(tr('rp_category')), H(tr('rp_spent')), H(tr('rp_share')), H(tr('rp_budget')), H(tr('rp_used'))],
      ...rep.categories.map((c) => [c.label, N(c.amount), { v: c.pct / 100, s: 4 }, c.budget ? N(c.budget) : '', c.usedPct === null ? '' : { v: c.usedPct / 100, s: 4 }]),
      [B(tr('rp_total')), NB(rep.totals.expense)],
      [],
      [H(tr('rp_income_sources')), H(tr('rp_amount'))],
      ...rep.incomeCats.map((c) => [c.label, N(c.amount)]),
    ],
  };
  const txs = {
    name: tr('rp_sheet_transactions'),
    widths: [12, 12, 24, 36, 22, 22, 16, 30],
    rows: [
      [H(tr('rp_date')), H(tr('rp_type')), H(tr('rp_category')), H(tr('rp_description')), H(tr('rp_account')), H(tr('rp_method')), H(tr('rp_amount')), H(tr('rp_notes'))],
      ...rep.transactions.map((t) => [t.date, typeLabel(t.type), t.category, t.description, t.account, t.method, N(t.type === 'expense' ? -t.amount : t.amount), t.notes]),
    ],
  };
  return createXlsx([summary, cats, txs]);
}

// ---------------- PDF ----------------
const W = {
  ' ': 278, '!': 278, '"': 355, '#': 556, $: 556, '%': 889, '&': 667, "'": 191, '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278,
  0: 556, 1: 556, 2: 556, 3: 556, 4: 556, 5: 556, 6: 556, 7: 556, 8: 556, 9: 556, ':': 278, ';': 278, '<': 584, '=': 584, '>': 584, '?': 556, '@': 1015,
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556, M: 833, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  '[': 278, '\\': 278, ']': 278, '^': 469, _: 556, '`': 333,
  a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222, m: 833, n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500,
  '{': 334, '|': 260, '}': 334, '~': 584,
};
const WIN = { '€': 0x80, '…': 0x85, '•': 0x95, '–': 0x96, '—': 0x97, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '·': 0xb7 };
const byteOf = (ch) => {
  const c = ch.charCodeAt(0);
  if (c >= 32 && c < 127) return c;
  if (WIN[ch]) return WIN[ch];
  if (c >= 160 && c <= 255) return c; // Latin-1 (£ ¥ é ...)
  return 63; // '?'
};
const widthOf = (str, size, bold) => {
  let w = 0;
  for (const ch of str) w += (W[ch] || (byteOf(ch) >= 128 ? 556 : 556)) ;
  return (w * size * (bold ? 1.06 : 1)) / 1000;
};
const fit = (str, maxW, size, bold) => {
  const s = String(str == null ? '' : str).replace(/\s+/g, ' ');
  if (widthOf(s, size, bold) <= maxW) return s;
  let out = s;
  while (out.length > 1 && widthOf(`${out}...`, size, bold) > maxW) out = out.slice(0, -1);
  return `${out}...`;
};
const hex = (str) =>
  [...String(str)]
    .map((ch) => byteOf(ch).toString(16).padStart(2, '0'))
    .join('');
const rgb = (c) => c.map((v) => (v / 255).toFixed(3)).join(' ');

export function createPdf({ title, author, build }) {
  const PW = 595.28;
  const PH = 841.89;
  const pages = [];
  let ops = null;
  const api = {
    PW,
    PH,
    page() {
      ops = [];
      pages.push(ops);
    },
    text(x, y, str, { size = 10, bold = false, color = [40, 30, 25], align = 'left' } = {}) {
      const s = String(str == null ? '' : str);
      const w = widthOf(s, size, bold);
      const px = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
      ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${rgb(color)} rg ${px.toFixed(2)} ${(PH - y).toFixed(2)} Td <${hex(s)}> Tj ET`);
    },
    rect(x, y, w, h, color) {
      ops.push(`${rgb(color)} rg ${x.toFixed(2)} ${(PH - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
    },
    line(x1, y1, x2, y2, color = [220, 210, 200], width = 0.5) {
      ops.push(`${rgb(color)} RG ${width} w ${x1.toFixed(2)} ${(PH - y1).toFixed(2)} m ${x2.toFixed(2)} ${(PH - y2).toFixed(2)} l S`);
    },
    fit,
    widthOf,
  };
  build(api);
  const objs = [];
  const add = (s) => {
    objs.push(s);
    return objs.length;
  };
  add('<< /Type /Catalog /Pages 2 0 R >>'); // 1
  add(''); // 2 (diisi setelah halaman diketahui)
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'); // 3
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'); // 4
  const pageIds = [];
  pages.forEach((p) => {
    const stream = p.join('\n');
    const contentId = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pageId = add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });
  objs[1] = `<< /Type /Pages /Kids [${pageIds.map((i) => `${i} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  const infoId = add(`<< /Title <${hex(title || '')}> /Producer (LIFE OS) /Author <${hex(author || '')}> >>`);
  let out = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => {
    out += `${String(o).padStart(10, '0')} 00000 n \n`;
  });
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  // Semua karakter ASCII (teks di-hex), jadi panjang string = panjang byte
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i += 1) bytes[i] = out.charCodeAt(i) & 0xff;
  return bytes;
}

export function reportToPdf(rep, tr, lang) {
  const cur = rep.currency;
  const m = (n) => {
    const v = Number(n) || 0;
    const sign = v < 0 ? '-' : '';
    if (cur === 'Rp') return `${sign}Rp ${Math.round(Math.abs(v)).toLocaleString('id-ID')}`;
    return `${sign}${cur}${Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  const BROWN = [107, 79, 58];
  const MUTED = [125, 110, 100];
  const GREEN = [76, 128, 72];
  const RED = [185, 77, 53];
  const margin = 40;
  const right = 595.28 - margin;
  return createPdf({
    title: `${tr('rp_title')} ${rep.monthLabel}`,
    author: rep.owner,
    build(p) {
      let y = 0;
      let pageNo = 0;
      const footer = () => {
        p.line(margin, 812, right, 812);
        p.text(margin, 826, `LIFE OS • ${rep.owner}`, { size: 8, color: MUTED });
        p.text(right, 826, `${tr('rp_page')} ${pageNo}`, { size: 8, color: MUTED, align: 'right' });
      };
      const newPage = (withHeader = false) => {
        p.page();
        pageNo += 1;
        footer();
        y = 50;
        if (withHeader) {
          p.rect(0, 0, 595.28, 92, BROWN);
          p.text(margin, 42, tr('rp_title'), { size: 20, bold: true, color: [255, 255, 255] });
          p.text(margin, 62, rep.monthLabel, { size: 12, color: [245, 235, 225] });
          p.text(right, 42, 'LIFE OS', { size: 12, bold: true, color: [255, 255, 255], align: 'right' });
          p.text(right, 62, rep.owner, { size: 10, color: [245, 235, 225], align: 'right' });
          y = 116;
        }
      };
      const ensure = (h) => {
        if (y + h > 800) newPage();
      };
      const heading = (s) => {
        ensure(40);
        p.text(margin, y, s, { size: 12, bold: true, color: BROWN });
        p.line(margin, y + 6, right, y + 6, BROWN, 0.8);
        y += 22;
      };

      newPage(true);

      // Kartu ringkasan
      const cards = [
        [tr('rp_income'), m(rep.totals.income), GREEN],
        [tr('rp_expense'), m(rep.totals.expense), RED],
        [tr('rp_net'), m(rep.totals.net), rep.totals.net >= 0 ? GREEN : RED],
        [tr('rp_savings_rate'), rep.totals.savingsRate === null ? '-' : `${rep.totals.savingsRate}%`, BROWN],
      ];
      const cw = (right - margin - 3 * 10) / 4;
      cards.forEach(([label, value, color], i) => {
        const x = margin + i * (cw + 10);
        p.rect(x, y, cw, 52, [247, 241, 235]);
        p.text(x + 10, y + 18, label, { size: 8.5, color: MUTED });
        p.text(x + 10, y + 38, fit(value, cw - 16, 12, true), { size: 12, bold: true, color });
      });
      y += 70;

      // Perbandingan bulan lalu
      const dExp = rep.totals.expense - rep.totals.prevExpense;
      if (rep.totals.prevExpense > 0) {
        const pct = Math.round((Math.abs(dExp) / rep.totals.prevExpense) * 100);
        p.text(margin, y, dExp > 0 ? tr('rp_cmp_more', { pct }) : dExp < 0 ? tr('rp_cmp_less', { pct }) : tr('rp_cmp_same'), { size: 9, color: MUTED });
        y += 18;
      }

      // Kategori pengeluaran
      heading(tr('rp_spend_by_category'));
      if (!rep.categories.length) {
        p.text(margin, y, tr('rp_none'), { size: 9, color: MUTED });
        y += 18;
      }
      rep.categories.forEach((c) => {
        ensure(24);
        p.text(margin, y, fit(c.label, 170, 9), { size: 9 });
        const barX = margin + 180;
        const barW = 170;
        p.rect(barX, y - 8, barW, 8, [236, 228, 220]);
        p.rect(barX, y - 8, Math.max(2, (barW * Math.min(100, c.pct)) / 100), 8, c.usedPct !== null && c.usedPct >= 100 ? RED : BROWN);
        p.text(right - 62, y, m(c.amount), { size: 9, align: 'right' });
        p.text(right, y, `${Math.round(c.pct)}%`, { size: 9, color: MUTED, align: 'right' });
        y += 17;
      });
      y += 8;

      // Anggaran
      if (rep.budgets.length) {
        heading(tr('rp_budget_status'));
        rep.budgets.forEach((b) => {
          ensure(20);
          p.text(margin, y, fit(b.label, 190, 9), { size: 9 });
          p.text(margin + 300, y, `${m(b.spent)} / ${m(b.limit)}`, { size: 9, align: 'right' });
          p.text(right, y, `${Math.round(b.pct)}%`, { size: 9, bold: true, color: b.pct >= 100 ? RED : b.pct >= 80 ? [196, 140, 40] : GREEN, align: 'right' });
          y += 16;
        });
        y += 8;
      }

      // Saldo akun
      heading(tr('rp_accounts'));
      rep.accounts.forEach((a) => {
        ensure(18);
        p.text(margin, y, fit(a.name, 300, 9), { size: 9 });
        p.text(right, y, m(a.balance), { size: 9, align: 'right', color: a.balance < 0 ? RED : [40, 30, 25] });
        y += 16;
      });
      ensure(22);
      p.line(margin, y - 8, right, y - 8);
      p.text(margin, y + 2, tr('rp_net_worth_end'), { size: 9.5, bold: true });
      p.text(right, y + 2, m(rep.netWorthEnd), { size: 9.5, bold: true, align: 'right' });
      y += 28;

      // Daftar transaksi
      heading(`${tr('rp_transactions')} (${rep.transactions.length})`);
      const head = () => {
        p.rect(margin, y - 11, right - margin, 16, BROWN);
        p.text(margin + 6, y, tr('rp_date'), { size: 8.5, bold: true, color: [255, 255, 255] });
        p.text(margin + 70, y, tr('rp_description'), { size: 8.5, bold: true, color: [255, 255, 255] });
        p.text(margin + 270, y, tr('rp_category'), { size: 8.5, bold: true, color: [255, 255, 255] });
        p.text(right - 6, y, tr('rp_amount'), { size: 8.5, bold: true, color: [255, 255, 255], align: 'right' });
        y += 18;
      };
      if (!rep.transactions.length) p.text(margin, y, tr('rp_none'), { size: 9, color: MUTED });
      else head();
      rep.transactions.forEach((t, i) => {
        if (y > 796) {
          newPage();
          head();
        }
        if (i % 2 === 0) p.rect(margin, y - 10, right - margin, 15, [250, 246, 242]);
        p.text(margin + 6, y, fmtDate(t.date, lang, { day: '2-digit', month: 'short' }), { size: 8.5 });
        p.text(margin + 70, y, fit(t.description, 190, 8.5), { size: 8.5 });
        p.text(margin + 270, y, fit(t.category, 120, 8.5), { size: 8.5, color: MUTED });
        p.text(right - 6, y, `${t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}${m(t.amount)}`, {
          size: 8.5,
          bold: true,
          color: t.type === 'income' ? GREEN : t.type === 'expense' ? [40, 30, 25] : MUTED,
          align: 'right',
        });
        y += 15;
      });
    },
  });
}
