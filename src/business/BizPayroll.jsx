import React, { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, UserPlus, Users, Share2, CheckCircle2, Pencil, Landmark } from 'lucide-react';
import { Btn, Empty, SelectField, Sheet, TextField, ToggleRow } from '../features/ui.jsx';
import { CAT, bizData, calcPayslip, n, newId, payslipText, rp, withBizCategories } from './bizLogic.js';
import { Stat, Row, notifyShare, shareText } from './bizUi.jsx';
import { addMonthsKey, todayYmd } from '../features/dates.js';

const blank = { name: '', role: '', type: 'monthly', baseSalary: '', allowance: '', deductPct: '', active: true };
const monthLabel = (key, lang) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' });
};

export default function BizPayroll({ data, setData, notify, askConfirm, lang, maskBalances }) {
  const b = bizData(data);
  const L = (a, e) => (lang === 'id' ? a : e);
  const shop = b.pos.shopName || data.profile.name;
  const [month, setMonth] = useState(todayYmd().slice(0, 7));
  const [accountId, setAccountId] = useState(data.accounts[0]?.id || '');
  const [emp, setEmp] = useState(null);
  const [pay, setPay] = useState(null); // { emp, days, overtime, bonus, otherDeduction }
  const [slip, setSlip] = useState(null);
  const [remit, setRemit] = useState(null);

  const txIds = new Set(data.transactions.map((t) => t.id));
  const livePay = b.payrolls.filter((p) => txIds.has(p.txId));
  const paidOf = (empId) => livePay.find((p) => p.employeeId === empId && p.month === month);
  const active = b.employees.filter((e) => e.active !== false);
  const monthPaid = livePay.filter((p) => p.month === month);
  const totalNet = monthPaid.reduce((s, p) => s + n(p.net), 0);
  const unpaid = active.filter((e) => !paidOf(e.id));
  const withheld = livePay.reduce((s, p) => s + n(p.deduction), 0);
  const remitted = data.transactions.filter((t) => t.type === 'expense' && t.category === CAT.remit).reduce((s, t) => s + n(t.amount), 0);
  const outstanding = Math.max(0, withheld - remitted);

  const saveEmp = () => {
    const f = emp;
    const rec = { name: f.name.trim(), role: f.role.trim(), type: f.type, baseSalary: n(f.baseSalary), allowance: n(f.allowance), deductPct: n(f.deductPct), active: f.active !== false };
    if (!rec.name) return;
    setData((prev) => {
      const list = bizData(prev).employees;
      return { ...prev, employees: f.id ? list.map((e) => (e.id === f.id ? { ...e, ...rec } : e)) : [...list, { id: newId('emp'), ...rec }] };
    });
    setEmp(null);
    notify(L('Karyawan disimpan', 'Employee saved'));
  };

  const removeEmp = (e) =>
    askConfirm(L('Hapus Karyawan', 'Delete Employee'), L(`Hapus ${e.name}? Slip yang sudah dibayar tetap tersimpan.`, `Delete ${e.name}?`), () => {
      setData((prev) => ({ ...prev, employees: bizData(prev).employees.filter((x) => x.id !== e.id) }));
      setEmp(null);
    });

  const preview = pay ? calcPayslip(pay.emp, pay) : null;

  const doPay = () => {
    const e = pay.emp;
    const s = calcPayslip(e, pay);
    if (s.net <= 0 || paidOf(e.id)) return;
    const date = todayYmd();
    const txId = newId('tx');
    const payId = newId('pay');
    const tx = {
      id: txId, type: 'expense', amount: s.net, date, category: CAT.payroll, description: `Gaji ${e.name} ${month}`,
      accountId, paymentMethod: 'Transfer', notes: '', biz: 'payroll', refId: payId,
    };
    const rec = { id: payId, employeeId: e.id, employeeName: e.name, role: e.role, month, date, ...s, txId, accountId };
    setData((prev) => withBizCategories({ ...prev, transactions: [tx, ...prev.transactions], payrolls: [rec, ...bizData(prev).payrolls] }));
    setPay(null);
    setSlip(rec);
    notify(L(`Gaji ${e.name} dibayar`, `${e.name} paid`));
  };

  const doRemit = () => {
    const amt = n(remit.amount);
    if (amt <= 0) return;
    const tx = { id: newId('tx'), type: 'expense', amount: amt, date: todayYmd(), category: CAT.remit, description: 'Setoran potongan gaji (BPJS/Pajak)', accountId: remit.accountId, paymentMethod: 'Transfer', notes: '', biz: 'remit' };
    setData((prev) => withBizCategories({ ...prev, transactions: [tx, ...prev.transactions] }));
    setRemit(null);
    notify(L('Setoran dicatat', 'Remittance recorded'));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl bg-life-surface border border-life-border/40 p-2">
        <button onClick={() => setMonth(addMonthsKey(month, -1))} className="p-2.5 rounded-xl text-life-soft" aria-label="Bulan sebelumnya"><ChevronLeft className="w-5 h-5" /></button>
        <span className="text-sm font-semibold text-life-text capitalize">{monthLabel(month, lang)}</span>
        <button onClick={() => setMonth(addMonthsKey(month, 1))} className="p-2.5 rounded-xl text-life-soft" aria-label="Bulan berikutnya"><ChevronRight className="w-5 h-5" /></button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <Stat label={L('Karyawan', 'Staff')} value={String(active.length)} />
        <Stat label={L('Gaji Dibayar', 'Paid out')} value={totalNet} masked={maskBalances} />
        <Stat label={L('Belum Dibayar', 'Unpaid')} value={String(unpaid.length)} tone={unpaid.length ? 'neg' : 'pos'} />
      </div>

      {outstanding > 0 && (
        <button onClick={() => setRemit({ amount: String(outstanding), accountId })} className="w-full flex items-center gap-3 rounded-2xl bg-[#D9A441]/10 border border-[#D9A441]/40 p-3.5 text-left">
          <Landmark className="w-5 h-5 text-[#D9A441] shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-life-text">{L('Potongan belum disetor', 'Withheld, not yet remitted')}: {maskBalances ? 'Rp ••••' : rp(outstanding)}</span>
            <span className="block text-[11px] text-life-muted">{L('Ketuk untuk mencatat setoran BPJS/pajak', 'Tap to record BPJS/tax remittance')}</span>
          </span>
        </button>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <SelectField label={L('Bayar gaji dari', 'Pay from')} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </SelectField>
        </div>
        <Btn onClick={() => setEmp({ ...blank })}><UserPlus className="w-4 h-4" /> {L('Karyawan', 'Staff')}</Btn>
      </div>

      {b.employees.length === 0 ? (
        <Empty icon={Users} title={L('Belum ada karyawan', 'No employees yet')} text={L('Tambah karyawan (bulanan atau harian), lalu bayar gaji sekali ketuk — otomatis masuk pembukuan.', 'Add employees (monthly or daily), then pay with one tap — it posts to your books.')}>
          <Btn onClick={() => setEmp({ ...blank })}><Plus className="w-4 h-4" /> {L('Tambah Karyawan', 'Add Employee')}</Btn>
        </Empty>
      ) : (
        <div className="space-y-2.5">
          {b.employees.map((e) => {
            const done = paidOf(e.id);
            return (
              <div key={e.id} className={`rounded-2xl bg-life-surface border border-life-border/40 p-3.5 ${e.active === false ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-life-text truncate">{e.name}{e.role ? <span className="text-life-muted font-normal"> · {e.role}</span> : null}</p>
                    <p className="text-[11px] text-life-muted tabular-nums">
                      {e.type === 'daily' ? `${rp(e.baseSalary)} / ${L('hari', 'day')}` : `${rp(e.baseSalary)} / ${L('bulan', 'month')}`}
                      {n(e.allowance) ? ` + ${L('tunj.', 'allow.')} ${rp(e.allowance)}` : ''}
                    </p>
                  </div>
                  <button onClick={() => setEmp({ ...e, baseSalary: String(e.baseSalary), allowance: String(e.allowance || ''), deductPct: String(e.deductPct || '') })} className="p-2 rounded-xl bg-life-bg text-life-soft" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
                </div>
                <div className="mt-2.5">
                  {done ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs text-[#87B082] font-semibold"><CheckCircle2 className="w-4 h-4" /> {L('Dibayar', 'Paid')} {maskBalances ? 'Rp ••••' : rp(done.net)}</span>
                      <Btn size="sm" variant="secondary" onClick={() => setSlip(done)}>{L('Slip Gaji', 'Payslip')}</Btn>
                    </div>
                  ) : (
                    e.active !== false && <Btn size="sm" className="w-full" onClick={() => setPay({ emp: e, days: e.type === 'daily' ? '26' : '', overtime: '', bonus: '', otherDeduction: '' })}>{L('Bayar Gaji', 'Pay Salary')}</Btn>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form karyawan */}
      <Sheet open={!!emp} onClose={() => setEmp(null)} title={emp?.id ? L('Ubah Karyawan', 'Edit Employee') : L('Karyawan Baru', 'New Employee')} closeLabel="Tutup">
        {emp && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <TextField label={L('Nama', 'Name')} value={emp.name} onChange={(e) => setEmp({ ...emp, name: e.target.value })} />
              <TextField label={L('Jabatan', 'Role')} value={emp.role} onChange={(e) => setEmp({ ...emp, role: e.target.value })} />
            </div>
            <SelectField label={L('Sistem gaji', 'Pay type')} value={emp.type} onChange={(e) => setEmp({ ...emp, type: e.target.value })}>
              <option value="monthly">{L('Bulanan', 'Monthly')}</option>
              <option value="daily">{L('Harian', 'Daily')}</option>
            </SelectField>
            <div className="grid grid-cols-2 gap-3">
              <TextField label={emp.type === 'daily' ? L('Upah per hari', 'Daily wage') : L('Gaji pokok / bulan', 'Monthly base')} type="number" inputMode="numeric" value={emp.baseSalary} onChange={(e) => setEmp({ ...emp, baseSalary: e.target.value })} />
              <TextField label={L('Tunjangan tetap', 'Allowance')} type="number" inputMode="numeric" value={emp.allowance} onChange={(e) => setEmp({ ...emp, allowance: e.target.value })} />
            </div>
            <TextField label={L('Potongan BPJS/Pajak (%)', 'Deduction (%)')} type="number" inputMode="decimal" value={emp.deductPct} onChange={(e) => setEmp({ ...emp, deductPct: e.target.value })} hint={L('Dihitung dari gaji pokok + tunjangan. Isi sesuai aturan Anda.', 'Of base + allowance. Set per your rules.')} />
            <ToggleRow label={L('Karyawan aktif', 'Active')} checked={emp.active !== false} onChange={(v) => setEmp({ ...emp, active: v })} />
            <Btn className="w-full" disabled={!emp.name.trim()} onClick={saveEmp}>{L('Simpan', 'Save')}</Btn>
            {emp.id && <Btn variant="danger" className="w-full" onClick={() => removeEmp(emp)}>{L('Hapus Karyawan', 'Delete')}</Btn>}
          </>
        )}
      </Sheet>

      {/* Bayar gaji */}
      <Sheet open={!!pay} onClose={() => setPay(null)} title={pay ? `${L('Gaji', 'Salary')} ${pay.emp.name}` : ''} subtitle={monthLabel(month, lang)} closeLabel="Tutup">
        {pay && preview && (
          <>
            {pay.emp.type === 'daily' && <TextField label={L('Hari masuk', 'Days worked')} type="number" inputMode="numeric" value={pay.days} onChange={(e) => setPay({ ...pay, days: e.target.value })} />}
            <div className="grid grid-cols-2 gap-3">
              <TextField label={L('Lembur', 'Overtime')} type="number" inputMode="numeric" value={pay.overtime} onChange={(e) => setPay({ ...pay, overtime: e.target.value })} />
              <TextField label="Bonus" type="number" inputMode="numeric" value={pay.bonus} onChange={(e) => setPay({ ...pay, bonus: e.target.value })} />
            </div>
            <TextField label={L('Potongan lain / kasbon', 'Other deduction')} type="number" inputMode="numeric" value={pay.otherDeduction} onChange={(e) => setPay({ ...pay, otherDeduction: e.target.value })} />
            <div className="rounded-2xl bg-life-bg border border-life-border/45 p-3.5">
              <Row label={L('Gaji pokok', 'Base')} value={rp(preview.base)} />
              <Row label={L('Tunjangan', 'Allowance')} value={rp(preview.allowance)} />
              {preview.overtime > 0 && <Row label={L('Lembur', 'Overtime')} value={rp(preview.overtime)} />}
              {preview.bonus > 0 && <Row label="Bonus" value={rp(preview.bonus)} />}
              <Row label={L('Gaji kotor', 'Gross')} value={rp(preview.gross)} bold />
              {preview.bpjs > 0 && <Row label={L('Potongan BPJS/Pajak', 'Deduction')} value={`-${rp(preview.bpjs)}`} tone="neg" />}
              {preview.other > 0 && <Row label={L('Potongan lain', 'Other')} value={`-${rp(preview.other)}`} tone="neg" />}
              <Row label={L('Diterima', 'Take-home')} value={rp(preview.net)} bold tone="pos" />
            </div>
            <Btn className="w-full" disabled={preview.net <= 0} onClick={doPay}>{L('Bayar & Catat', 'Pay & Record')} {rp(preview.net)}</Btn>
          </>
        )}
      </Sheet>

      {/* Slip */}
      <Sheet open={!!slip} onClose={() => setSlip(null)} title={L('Slip Gaji', 'Payslip')} closeLabel="Tutup">
        {slip && (
          <>
            <pre className="rounded-2xl bg-white text-[#1f1f1f] p-4 text-[12px] leading-relaxed whitespace-pre-wrap font-mono">{payslipText(slip, shop)}</pre>
            <Btn className="w-full" onClick={async () => notifyShare(notify, await shareText(`Slip gaji ${slip.employeeName}`, payslipText(slip, shop)), lang === 'id')}><Share2 className="w-4 h-4" /> {L('Bagikan ke Karyawan', 'Share')}</Btn>
          </>
        )}
      </Sheet>

      {/* Setor potongan */}
      <Sheet open={!!remit} onClose={() => setRemit(null)} title={L('Setor Potongan Gaji', 'Remit Withholdings')} closeLabel="Tutup">
        {remit && (
          <>
            <TextField label={L('Jumlah disetor', 'Amount')} type="number" inputMode="numeric" value={remit.amount} onChange={(e) => setRemit({ ...remit, amount: e.target.value })} />
            <SelectField label={L('Dari akun', 'From')} value={remit.accountId} onChange={(e) => setRemit({ ...remit, accountId: e.target.value })}>
              {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </SelectField>
            <Btn className="w-full" disabled={n(remit.amount) <= 0} onClick={doRemit}>{L('Catat Setoran', 'Record')}</Btn>
          </>
        )}
      </Sheet>
    </div>
  );
}
