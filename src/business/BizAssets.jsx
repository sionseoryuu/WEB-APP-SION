import React, { useMemo, useState } from 'react';
import { Plus, Landmark, Trash2, Pencil } from 'lucide-react';
import { Btn, Sheet, TextField, SelectField, Chip } from '../features/ui.jsx';
import { CAT, assetSummary, bizData, n, newId, rp, withBizCategories } from './bizLogic.js';
import { Row, SectionLabel, Stat } from './bizUi.jsx';
import { todayYmd } from '../features/dates.js';

const PRESETS = [
  { id: 'equip', id_: 'Peralatan', en: 'Equipment', life: 48 },
  { id: 'vehicle', id_: 'Kendaraan', en: 'Vehicle', life: 96 },
  { id: 'building', id_: 'Bangunan', en: 'Building', life: 240 },
  { id: 'land', id_: 'Tanah (tidak disusutkan)', en: 'Land (no depreciation)', life: 0 },
];

// Aset tetap & penyusutan garis lurus. Penyusutan masuk otomatis ke Laba Rugi (Beban Penyusutan)
// dan ke Neraca (Aset Tetap dikurangi Akumulasi Penyusutan).
export default function BizAssets({ data, setData, notify, askConfirm, lang, maskBalances }) {
  const L = (a, e) => (lang === 'id' ? a : e);
  const b = bizData(data);
  const [sheet, setSheet] = useState(null); // null | { asset?: existing }
  const m = (v) => (maskBalances ? 'Rp ••••' : rp(v));

  const rows = useMemo(() => b.assets.map((a) => ({ a, s: assetSummary(a) })), [b.assets]);
  const totals = rows.reduce(
    (t, r) => ({ cost: t.cost + n(r.a.cost), acc: t.acc + r.s.accumulated, book: t.book + r.s.bookValue, monthly: t.monthly + (r.s.fullyDepreciated ? 0 : r.s.monthly) }),
    { cost: 0, acc: 0, book: 0, monthly: 0 }
  );

  const remove = (a) =>
    askConfirm(L('Hapus Aset', 'Delete Asset'), L(`Hapus "${a.name}"? Penyusutannya ikut hilang dari laporan. Transaksi pembelian kas (jika ada) tidak dihapus.`, `Delete "${a.name}"?`), () => {
      setData((prev) => ({ ...prev, assets: (prev.assets || []).filter((x) => x.id !== a.id) }));
      notify(L('Aset dihapus', 'Asset deleted'));
    });

  return (
    <div className="space-y-3 pb-6">
      <div className="grid grid-cols-2 gap-2.5">
        <Stat label={L('Nilai buku', 'Book value')} value={totals.book} masked={maskBalances} sub={`${L('perolehan', 'cost')} ${m(totals.cost)}`} />
        <Stat label={L('Penyusutan / bulan', 'Depreciation / month')} value={totals.monthly} masked={maskBalances} sub={`${L('akumulasi', 'accumulated')} ${m(totals.acc)}`} />
      </div>

      <Btn className="w-full" onClick={() => setSheet({})}><Plus className="w-4 h-4" /> {L('Tambah Aset Tetap', 'Add Fixed Asset')}</Btn>

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-life-surface border border-life-border/40 p-6 text-center">
          <Landmark className="w-8 h-8 mx-auto text-life-accent" />
          <p className="text-sm font-semibold text-life-text mt-2">{L('Belum ada aset tetap', 'No fixed assets yet')}</p>
          <p className="text-xs text-life-muted mt-1">{L('Catat mesin, kendaraan, etalase, atau komputer usaha agar penyusutannya masuk laporan.', 'Record machines, vehicles, fixtures or computers so depreciation shows in reports.')}</p>
        </div>
      ) : (
        rows.map(({ a, s }) => (
          <div key={a.id} className="rounded-2xl bg-life-surface border border-life-border/40 p-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-life-text truncate">{a.name}</p>
                <p className="text-[11px] text-life-muted">
                  {a.date} · {n(a.lifeMonths) > 0 ? `${a.lifeMonths} ${L('bulan', 'months')}` : L('tidak disusutkan', 'not depreciated')}
                  {s.fullyDepreciated ? ` · ${L('habis disusutkan', 'fully depreciated')}` : ''}
                </p>
              </div>
              <button onClick={() => setSheet({ asset: a })} className="p-2 rounded-xl text-life-muted" aria-label={L('Ubah', 'Edit')}><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(a)} className="p-2 rounded-xl text-[#F29B87]" aria-label={L('Hapus', 'Delete')}><Trash2 className="w-4 h-4" /></button>
            </div>
            <div className="mt-1">
              <Row label={L('Harga perolehan', 'Cost')} value={m(a.cost)} />
              <Row label={L('Akumulasi penyusutan', 'Accumulated depreciation')} value={m(s.accumulated)} />
              <Row label={L('Nilai buku', 'Book value')} value={m(s.bookValue)} bold />
              {s.monthly > 0 && !s.fullyDepreciated && <Row label={L('Penyusutan per bulan', 'Per month')} value={m(s.monthly)} />}
            </div>
          </div>
        ))
      )}

      <p className="text-[11px] text-life-muted leading-relaxed">
        {L('Metode garis lurus: (harga perolehan − nilai sisa) ÷ umur manfaat. Bulan pembelian dihitung penuh. Bila aset dibeli dari kas, pembelian dicatat sebagai pengeluaran investasi (bukan beban) sehingga laba tidak terpotong sekaligus.', 'Straight-line: (cost − salvage) ÷ useful life, full month of purchase. Purchases from cash are booked as investing outflows, not expenses.')}
      </p>

      <AssetSheet key={sheet?.asset?.id || 'new'} sheet={sheet} onClose={() => setSheet(null)} data={data} setData={setData} lang={lang} notify={notify} />
    </div>
  );
}

function AssetSheet({ sheet, onClose, data, setData, lang, notify }) {
  const L = (a, e) => (lang === 'id' ? a : e);
  const ex = sheet?.asset;
  const [name, setName] = useState(ex?.name || '');
  const [cost, setCost] = useState(ex ? String(ex.cost) : '');
  const [date, setDate] = useState(ex?.date || todayYmd());
  const [life, setLife] = useState(ex ? String(ex.lifeMonths ?? 48) : '48');
  const [salvage, setSalvage] = useState(ex ? String(ex.salvage || 0) : '0');
  const [source, setSource] = useState(ex ? 'keep' : 'owner'); // owner = modal/aset lama, atau id akun kas
  if (!sheet) return null;

  const valid = name.trim() && n(cost) > 0 && date && n(life) >= 0;

  const save = () => {
    if (!valid) return;
    const id = ex?.id || newId('fa');
    let txId = ex?.txId || null;
    const asset = { id, name: name.trim(), cost: n(cost), date, lifeMonths: Math.floor(n(life)), salvage: Math.min(n(salvage), n(cost)) };
    setData((prev) => {
      let transactions = prev.transactions;
      if (!ex && source !== 'owner' && source !== 'keep') {
        txId = newId('tx');
        transactions = [
          { id: txId, type: 'expense', amount: asset.cost, date, category: CAT.asset, description: `Beli aset: ${asset.name}`, accountId: source, paymentMethod: 'Transfer', notes: '', biz: 'asset_buy', refId: id },
          ...transactions,
        ];
      }
      const assets = ex ? (prev.assets || []).map((x) => (x.id === id ? { ...x, ...asset } : x)) : [...(prev.assets || []), { ...asset, txId }];
      return withBizCategories({ ...prev, transactions, assets });
    });
    notify(ex ? L('Aset diperbarui', 'Asset updated') : L('Aset ditambahkan', 'Asset added'));
    onClose();
  };

  return (
    <Sheet open onClose={onClose} title={ex ? L('Ubah Aset', 'Edit Asset') : L('Tambah Aset Tetap', 'Add Fixed Asset')} closeLabel={L('Tutup', 'Close')}>
      <TextField label={L('Nama aset', 'Asset name')} value={name} onChange={(e) => setName(e.target.value)} placeholder={L('mis. Mesin espresso', 'e.g. Espresso machine')} />
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Chip key={p.id} active={String(p.life) === life} onClick={() => setLife(String(p.life))}>{L(p.id_, p.en)}</Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <TextField label={L('Harga perolehan (Rp)', 'Cost')} type="number" inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} />
        <TextField label={L('Tanggal perolehan', 'Acquired')} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <TextField label={L('Umur manfaat (bulan)', 'Useful life (months)')} type="number" inputMode="numeric" value={life} onChange={(e) => setLife(e.target.value)} hint={L('0 = tidak disusutkan', '0 = no depreciation')} />
        <TextField label={L('Nilai sisa (Rp)', 'Salvage (Rp)')} type="number" inputMode="numeric" value={salvage} onChange={(e) => setSalvage(e.target.value)} />
      </div>
      {!ex && (
        <SelectField label={L('Sumber dana', 'Paid from')} value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="owner">{L('Sudah dimiliki / modal pemilik (tanpa potong kas)', 'Already owned / owner capital (no cash movement)')}</option>
          {data.accounts.map((a) => (
            <option key={a.id} value={a.id}>{L('Beli dari', 'Buy from')} {a.name}</option>
          ))}
        </SelectField>
      )}
      <Btn className="w-full" disabled={!valid} onClick={save}>{L('Simpan', 'Save')}</Btn>
    </Sheet>
  );
}
