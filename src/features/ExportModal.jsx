import React, { useEffect, useMemo, useState } from 'react';
import { FileText, FileSpreadsheet, Table, Loader2 } from 'lucide-react';
import { Sheet, Btn, SelectField, useTr } from './ui.jsx';
import { buildMonthlyReport, reportToPdf, reportToXlsx } from './report.js';
import { saveAndShare, MIME } from './files.js';
import { fmtMonth, todayYmd, addMonthsKey } from './dates.js';

const csvCell = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;

export default function ExportModal({ open, onClose, data, lang, onDone }) {
  const tr = useTr(lang);
  const nowKey = todayYmd().slice(0, 7);
  const months = useMemo(() => {
    const set = new Set([nowKey, ...data.transactions.map((t) => String(t.date).slice(0, 7))]);
    return [...set].sort().reverse();
  }, [data.transactions, nowKey]);
  const [month, setMonth] = useState(nowKey);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setMonth(nowKey);
      setErr('');
      setBusy('');
    }
  }, [open, nowKey]);

  const run = async (kind) => {
    setBusy(kind);
    setErr('');
    try {
      const rep = buildMonthlyReport(data, month, lang);
      const base = `life-os-${lang === 'id' ? 'laporan' : 'report'}-${month}`;
      if (kind === 'pdf') await saveAndShare({ filename: `${base}.pdf`, content: reportToPdf(rep, tr, lang), mime: MIME.pdf, dialogTitle: tr('exp_share_title') });
      else if (kind === 'xlsx') await saveAndShare({ filename: `${base}.xlsx`, content: reportToXlsx(rep, tr, lang), mime: MIME.xlsx, dialogTitle: tr('exp_share_title') });
      else {
        const head = [tr('rp_date'), tr('rp_type'), tr('rp_category'), tr('rp_description'), tr('rp_account'), tr('rp_method'), tr('rp_amount'), tr('rp_notes')];
        const typeLabel = (t) => (t === 'income' ? tr('rp_income') : t === 'expense' ? tr('rp_expense') : tr('rp_transfer'));
        const rows = rep.transactions.map((t) => [t.date, typeLabel(t.type), t.category, t.description, t.account, t.method, t.amount, t.notes].map(csvCell).join(','));
        // BOM agar Excel membaca UTF-8 dengan benar
        await saveAndShare({ filename: `${base}.csv`, content: `﻿${[head.map(csvCell).join(','), ...rows].join('\n')}`, mime: MIME.csv, dialogTitle: tr('exp_share_title') });
      }
      onDone?.(tr('exp_done'));
      onClose();
    } catch (e) {
      if (!/cancel/i.test(String(e?.message || e))) setErr(`${tr('exp_failed')} ${e?.message || ''}`.trim());
      else onClose();
    } finally {
      setBusy('');
    }
  };

  const opts = [
    { id: 'pdf', icon: FileText, title: 'PDF', desc: tr('exp_pdf_desc') },
    { id: 'xlsx', icon: FileSpreadsheet, title: 'Excel (.xlsx)', desc: tr('exp_xlsx_desc') },
    { id: 'csv', icon: Table, title: 'CSV', desc: tr('exp_csv_desc') },
  ];

  return (
    <Sheet open={open} onClose={onClose} title={tr('exp_title')} subtitle={tr('exp_subtitle')} closeLabel={tr('close')}>
      <SelectField label={tr('exp_month')} value={month} onChange={(e) => setMonth(e.target.value)}>
        {months.map((m) => <option key={m} value={m}>{fmtMonth(m, lang)}</option>)}
      </SelectField>
      <div className="space-y-2">
        {opts.map((o) => (
          <button key={o.id} disabled={!!busy} onClick={() => run(o.id)} className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-life-bg border border-life-border/50 text-left active:bg-life-surface2 disabled:opacity-60">
            <span className="w-10 h-10 rounded-xl bg-life-accent/15 text-life-accent flex items-center justify-center shrink-0">
              {busy === o.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <o.icon className="w-5 h-5" />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-life-text">{o.title}</span>
              <span className="block text-[11px] text-life-muted">{o.desc}</span>
            </span>
          </button>
        ))}
      </div>
      {err && <p className="text-xs text-[#F29B87]" role="alert">{err}</p>}
      <div className="flex justify-end"><Btn variant="secondary" size="sm" onClick={onClose}>{tr('close')}</Btn></div>
    </Sheet>
  );
}
export { addMonthsKey };
