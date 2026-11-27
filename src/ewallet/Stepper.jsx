import React from 'react';
import { Check } from 'lucide-react';

// Indikator alur setelah beli produk: Lisensi -> Buat Akun -> Dashboard
export default function Stepper({ current, withLicense = true, lang = 'id' }) {
  const id = lang === 'id';
  const all = [
    { key: 'license', label: id ? 'Lisensi' : 'License' },
    { key: 'account', label: id ? 'Buat Akun' : 'Account' },
    { key: 'dashboard', label: 'Dashboard' },
  ];
  const steps = withLicense ? all : all.slice(1);
  const idx = Math.max(0, steps.findIndex((s) => s.key === current));
  return (
    <div className="flex items-center justify-center gap-2 mb-5" aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={s.key}>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center border ${
                  done ? 'bg-life-accent text-life-bg border-life-accent' : active ? 'border-life-accent text-life-accent bg-life-accent/15' : 'border-life-border/60 text-life-muted'
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className={`text-[11px] font-semibold ${active ? 'text-life-text' : 'text-life-muted'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && <span className={`w-6 h-px ${done ? 'bg-life-accent' : 'bg-life-border/60'}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
