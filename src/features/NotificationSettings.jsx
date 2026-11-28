import React, { useEffect, useState } from 'react';
import { Bell, BellRing, Send, Smartphone } from 'lucide-react';
import { Card, Btn, PageHeader, ToggleRow, SelectField, TextField, useTr } from './ui.jsx';
import { isNative, permissionState, requestPermission } from './notify.js';
import { fmtDate } from './dates.js';

export default function NotificationSettings({ lang, prefs, onChange, preview, onTest, onBack }) {
  const tr = useTr(lang);
  const [perm, setPerm] = useState('prompt');
  const [busy, setBusy] = useState(false);
  const native = isNative();

  useEffect(() => {
    permissionState().then(setPerm);
  }, []);

  const set = (p) => onChange({ ...prefs, ...p });

  const toggleMaster = async (on) => {
    if (!on) return set({ enabled: false });
    setBusy(true);
    const res = await requestPermission();
    setPerm(res);
    setBusy(false);
    set({ enabled: res === 'granted' });
  };

  const permText =
    perm === 'granted' ? tr('ns_perm_granted') : perm === 'denied' ? tr('ns_perm_denied') : perm === 'unsupported' ? tr('ns_perm_unsupported') : tr('ns_perm_prompt');

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <PageHeader title={tr('ns_title')} subtitle={tr('ns_subtitle')} onBack={onBack} backLabel={tr('back')} />

      <Card className="p-4">
        <ToggleRow label={tr('ns_master')} hint={permText} checked={prefs.enabled} disabled={busy || perm === 'unsupported'} onChange={toggleMaster} />
        {perm === 'denied' && <p className="text-[11px] text-[#F29B87] mt-1">{tr('ns_denied_help')}</p>}
        {!native && <p className="text-[11px] text-life-muted mt-2 flex items-start gap-1.5"><Smartphone className="w-3.5 h-3.5 shrink-0 mt-0.5" />{tr('ns_web_note')}</p>}
      </Card>

      <Card className={`p-4 divide-y divide-life-border/25 ${prefs.enabled ? '' : 'opacity-60 pointer-events-none'}`}>
        <div className="pb-3">
          <ToggleRow label={tr('ns_bills')} hint={tr('ns_bills_hint')} checked={prefs.bills} onChange={(v) => set({ bills: v })} />
          {prefs.bills && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <SelectField label={tr('ns_days_before')} value={String(prefs.billDaysBefore)} onChange={(e) => set({ billDaysBefore: Number(e.target.value) })}>
                {[0, 1, 2, 3, 7].map((d) => <option key={d} value={d}>{d === 0 ? tr('ns_only_due_day') : tr('ns_n_days_before', { n: d })}</option>)}
              </SelectField>
              <TextField label={tr('ns_time')} type="time" value={prefs.billTime} onChange={(e) => set({ billTime: e.target.value })} />
            </div>
          )}
        </div>
        <div className="py-3">
          <ToggleRow label={tr('ns_tasks')} hint={tr('ns_tasks_hint')} checked={prefs.tasks} onChange={(v) => set({ tasks: v })} />
          {prefs.tasks && <div className="pt-1"><TextField label={tr('ns_time')} type="time" value={prefs.taskTime} onChange={(e) => set({ taskTime: e.target.value })} /></div>}
        </div>
        <div className="py-3">
          <ToggleRow label={tr('ns_events')} hint={tr('ns_events_hint')} checked={prefs.events} onChange={(v) => set({ events: v })} />
        </div>
        <div className="py-3">
          <ToggleRow label={tr('ns_habits')} hint={tr('ns_habits_hint')} checked={prefs.habits} onChange={(v) => set({ habits: v })} />
          {prefs.habits && <div className="pt-1"><TextField label={tr('ns_time')} type="time" value={prefs.habitTime} onChange={(e) => set({ habitTime: e.target.value })} /></div>}
        </div>
        <div className="py-3">
          <ToggleRow label={tr('ns_birthdays')} hint={tr('ns_birthdays_hint')} checked={prefs.birthdays} onChange={(v) => set({ birthdays: v })} />
        </div>
        <div className="py-3">
          <ToggleRow label={tr('ns_budget')} hint={tr('ns_budget_hint')} checked={prefs.budget} onChange={(v) => set({ budget: v })} />
        </div>
        <div className="pt-3">
          <ToggleRow label={tr('ns_weekly')} hint={tr('ns_weekly_hint')} checked={prefs.weekly} onChange={(v) => set({ weekly: v })} />
          {prefs.weekly && <div className="pt-1"><TextField label={tr('ns_time')} type="time" value={prefs.weeklyTime} onChange={(e) => set({ weeklyTime: e.target.value })} /></div>}
        </div>
      </Card>

      <div className="flex">
        <Btn variant="secondary" size="sm" onClick={onTest} disabled={!prefs.enabled}><Send className="w-3.5 h-3.5" /> {tr('ns_test')}</Btn>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-life-muted px-1 mb-2 flex items-center gap-1.5"><BellRing className="w-3.5 h-3.5" />{tr('ns_upcoming')}</p>
        <Card className="divide-y divide-life-border/25">
          {preview.length === 0 ? (
            <p className="p-4 text-xs text-life-muted">{prefs.enabled ? tr('ns_none_upcoming') : tr('ns_enable_to_see')}</p>
          ) : (
            preview.map((it) => (
              <div key={it.key} className="px-3.5 py-2.5 flex items-start gap-3">
                <Bell className="w-4 h-4 text-life-accent shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-life-text truncate">{it.title}</p>
                  <p className="text-[11px] text-life-muted truncate">{it.body}</p>
                </div>
                <p className="text-[11px] text-life-soft tabular-nums shrink-0 text-right">
                  {it.at ? `${fmtDate(`${it.at.getFullYear()}-${String(it.at.getMonth() + 1).padStart(2, '0')}-${String(it.at.getDate()).padStart(2, '0')}`, lang, { day: 'numeric', month: 'short' })}` : tr('ns_every_sunday')}
                  {it.at ? <><br />{String(it.at.getHours()).padStart(2, '0')}:{String(it.at.getMinutes()).padStart(2, '0')}</> : null}
                </p>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
