import React, { useState } from 'react';
import { PRESETS, DEFAULT_THEME, applyTheme, loadTheme, saveTheme, contrastRatio } from './theme.js';

const Picker = ({ label, value, onChange, onClear }) => (
  <label className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-life-bg/70 border border-life-border/50">
    <span className="text-xs font-medium text-life-text">{label}</span>
    <span className="flex items-center gap-2">
      {onClear && (
        <button type="button" onClick={onClear} className="text-[10px] text-life-muted underline">
          auto
        </button>
      )}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-8 rounded-lg border border-life-border bg-transparent cursor-pointer p-0"
      />
    </span>
  </label>
);

export default function ThemeSettings({ lang = 'id' }) {
  const id = lang === 'id';
  const [theme, setTheme] = useState(() => loadTheme());
  const [adv, setAdv] = useState(false);

  const update = (patch) => {
    const next = { ...theme, ...patch };
    Object.keys(next).forEach((k) => next[k] === undefined && delete next[k]);
    setTheme(next);
    applyTheme(next);
    saveTheme(next);
  };

  const reset = () => {
    setTheme({ ...DEFAULT_THEME });
    applyTheme(DEFAULT_THEME);
    saveTheme(DEFAULT_THEME);
  };

  const lowContrast = contrastRatio(theme.bg, theme.text) < 4.5;

  return (
    <div className="p-3.5 rounded-xl bg-life-bg/90 border border-life-border/50 space-y-3">
      <div>
        <p className="text-xs font-semibold text-life-text">{id ? 'Tema & Warna' : 'Theme & Colors'}</p>
        <p className="text-[11px] text-life-muted">
          {id ? 'Pilih tema siap pakai atau atur warna sendiri.' : 'Pick a preset or fine-tune your own colors.'}
        </p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {PRESETS.map((p) => {
          const active = p.bg === theme.bg && p.text === theme.text && p.accent === theme.accent;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => update({ bg: p.bg, text: p.text, accent: p.accent, surface: p.surface, border: p.border, muted: p.muted })}
              className={`rounded-xl p-1.5 border text-[9px] leading-tight ${active ? 'border-life-accent' : 'border-life-border/50'}`}
              style={{ background: p.bg, color: p.text }}
              aria-label={p.name[id ? 'id' : 'en']}
            >
              <span className="block h-4 rounded-md mb-1" style={{ background: p.accent }} />
              {p.name[id ? 'id' : 'en']}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <Picker label={id ? 'Latar belakang' : 'Background'} value={theme.bg} onChange={(v) => update({ bg: v })} />
        <Picker label={id ? 'Teks' : 'Text'} value={theme.text} onChange={(v) => update({ text: v })} />
        <Picker label={id ? 'Warna aksen' : 'Accent'} value={theme.accent} onChange={(v) => update({ accent: v })} />
      </div>

      {lowContrast && (
        <p className="text-[11px] text-[#F29B87]">
          {id ? 'Kontras teks dan latar terlalu rendah, teks bisa sulit dibaca.' : 'Text/background contrast is low; text may be hard to read.'}
        </p>
      )}

      <button type="button" onClick={() => setAdv((v) => !v)} className="text-[11px] text-life-soft underline">
        {adv ? (id ? 'Sembunyikan lanjutan' : 'Hide advanced') : id ? 'Pengaturan lanjutan' : 'Advanced'}
      </button>

      {adv && (
        <div className="space-y-2">
          <Picker label={id ? 'Kartu / panel' : 'Cards / panels'} value={theme.surface || '#241B17'} onChange={(v) => update({ surface: v })} onClear={() => update({ surface: undefined })} />
          <Picker label={id ? 'Garis / border' : 'Borders'} value={theme.border || '#624332'} onChange={(v) => update({ border: v })} onClear={() => update({ border: undefined })} />
          <Picker label={id ? 'Teks redup' : 'Muted text'} value={theme.muted || '#A99B90'} onChange={(v) => update({ muted: v })} onClear={() => update({ muted: undefined })} />
        </div>
      )}

      <button type="button" onClick={reset} className="text-[11px] text-life-muted underline">
        {id ? 'Kembalikan ke bawaan' : 'Reset to default'}
      </button>
    </div>
  );
}
