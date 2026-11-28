// Komponen dasar kecil untuk fitur-fitur baru (selaras dengan tema life-*).
import React from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft } from 'lucide-react';
import { makeTr } from './i18n.js';

export const useTr = (lang) => React.useMemo(() => makeTr(lang), [lang]);

export const Card = ({ children, className = '', ...rest }) => (
  <div {...rest} className={`rounded-2xl bg-life-surface border border-life-border/40 ${className}`}>
    {children}
  </div>
);

export const Btn = ({ children, variant = 'primary', size = 'md', className = '', type = 'button', ...rest }) => {
  const v = {
    primary: 'bg-gradient-to-r from-life-accent to-life-accent-dark text-life-bg font-semibold',
    secondary: 'bg-life-surface2 text-life-text border border-life-border/60',
    ghost: 'text-life-muted hover:text-life-text',
    danger: 'bg-[#D96B52]/20 text-[#F29B87] border border-[#D96B52]/40',
  }[variant];
  const s = { sm: 'px-3 py-1.5 text-xs min-h-[36px]', md: 'px-4 py-2.5 text-sm min-h-[44px]' }[size];
  return (
    <button
      type={type}
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl active:scale-[0.98] transition disabled:opacity-45 disabled:pointer-events-none ${v} ${s} ${className}`}
    >
      {children}
    </button>
  );
};

export const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5 min-w-0">
    {label && <label className="block text-xs font-medium uppercase tracking-wider text-life-muted">{label}</label>}
    {children}
    {hint && <p className="text-[11px] text-life-muted">{hint}</p>}
  </div>
);
const fieldCls =
  'w-full rounded-xl bg-life-bg/90 border border-life-border/55 px-3.5 py-2.5 text-sm text-life-text placeholder-life-muted/50 focus:outline-none focus:border-life-accent transition-colors min-h-[44px]';
export const TextField = ({ label, hint, className = '', ...p }) => (
  <Field label={label} hint={hint}>
    <input {...p} className={`${fieldCls} ${className}`} />
  </Field>
);
export const SelectField = ({ label, hint, children, ...p }) => (
  <Field label={label} hint={hint}>
    <select {...p} className={fieldCls}>
      {children}
    </select>
  </Field>
);

export const Sheet = ({ open, onClose, title, subtitle, children, closeLabel, wide }) => {
  if (!open) return null;
  // Portal ke <body>: induk beranimasi (transform) akan membuat `fixed` salah posisi
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div
        className={`w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} rounded-t-3xl sm:rounded-2xl bg-life-surface border border-life-border/70 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col life-motion-enter`}
      >
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-life-border/40 bg-life-bg/50">
          <div className="min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-semibold text-life-text truncate">{title}</h3>
            {subtitle && <p className="text-xs text-life-muted mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-life-muted hover:text-life-text shrink-0" aria-label={closeLabel}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export const PageHeader = ({ title, subtitle, action, onBack, backLabel }) => (
  <div className="flex items-start gap-3 justify-between">
    <div className="flex items-start gap-2 min-w-0">
      {onBack && (
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl text-life-text" aria-label={backLabel}>
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-life-text">{title}</h1>
        {subtitle && <p className="text-xs text-life-muted mt-1">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

export const Empty = ({ icon: Icon, title, text, children }) => (
  <div className="flex flex-col items-center text-center py-10 px-4 rounded-2xl border border-dashed border-life-border/50 bg-life-bg/40">
    <div className="w-12 h-12 rounded-2xl bg-life-surface2 border border-life-border/60 flex items-center justify-center text-life-accent mb-3">
      <Icon className="w-6 h-6" />
    </div>
    <h4 className="text-base font-medium text-life-text">{title}</h4>
    <p className="text-xs text-life-muted max-w-sm mt-1">{text}</p>
    {children && <div className="mt-4">{children}</div>}
  </div>
);

export const Chip = ({ active, children, ...p }) => (
  <button
    type="button"
    {...p}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
      active ? 'bg-life-accent text-life-bg border-life-accent' : 'bg-life-bg text-life-muted border-life-border/60'
    }`}
  >
    {children}
  </button>
);

export const ToggleRow = ({ label, hint, checked, onChange, disabled }) => (
  <div className={`flex items-center justify-between gap-3 py-2.5 ${disabled ? 'opacity-50' : ''}`}>
    <span className="min-w-0">
      <span className="block text-sm text-life-text">{label}</span>
      {hint && <span className="block text-[11px] text-life-muted">{hint}</span>}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-life-accent' : 'bg-life-border/60'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-life-bg transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  </div>
);
