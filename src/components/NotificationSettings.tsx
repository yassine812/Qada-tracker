import { FeatureHelp } from './guide/FeatureHelp';
import React, { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { getPushClient, savePushPreferences } from '../services/notificationService';
import { defaultPushPreferences, prayerIds, reminderLabels, type PushPreferences } from '../services/pushPreferences';
import { getPrayerSettings } from '../utils/prayerTimes';

const prayerNames = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };
const weekdayNames = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
const automaticDhikrKinds = new Set(['morning', 'evening', 'sleep']);
const button = 'px-4 py-3 rounded-xl border border-[#C6A15B]/30 disabled:opacity-50 disabled:cursor-not-allowed';
const input = 'rounded-lg p-2 bg-black/5 dark:bg-white/10 border border-[#C6A15B]/30';
export function NotificationSettings() {
  const [preferences, setPreferences] = useState<PushPreferences>(() => defaultPushPreferences(getPrayerSettings()));
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    let mounted = true;
    getPushClient().then(client => {
      if (!mounted) return;
      setPreferences(client.preferences);
      setLoaded(true);
    }).catch(() => { if (mounted) setMessage('تعذّر تحميل التذكيرات المحفوظة. أعد فتح هذه الصفحة للمحاولة.'); });
    return () => { mounted = false; };
  }, []);
  const change = (p: PushPreferences) => { setPreferences(p); setDirty(true); setMessage(''); };
  const save = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true); setMessage('');
    try {
      if (Capacitor.getPlatform() === 'android') {
        const { saveAndroidReminderPreferences } = await import('../services/androidReminders');
        await saveAndroidReminderPreferences(preferences);
      } else {
        await savePushPreferences(preferences);
      }
      setDirty(false);
      setMessage('حُفظت مواعيد التذكيرات.');
    } catch {
      setMessage('تعذّر تحديث التذكيرات. حاول مرة أخرى.');
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  const daysControl = (selected: number[], update: (days: number[]) => void) => <div className="flex flex-wrap gap-2">{weekdayNames.map((name, i) => <label key={name} className="text-xs flex gap-1 items-center"><input type="checkbox" checked={selected.includes(i + 1)} onChange={e => update(e.target.checked ? [...selected, i + 1] : selected.filter(n => n !== i + 1))} />{name}</label>)}</div>;
  return <section id="notifications" dir="rtl" className="qada-surface-card lg:col-span-2 p-5 rounded-3xl bg-white/80 dark:bg-[#1F2E24] border border-[#C6A15B]/20 shadow-sm space-y-5 text-[#1D211E] dark:text-[#F6F1E7]">
    <h2 className="text-xl font-bold flex gap-2 items-center"><Bell className="text-[#C6A15B]" /> التذكيرات</h2>
    <fieldset disabled={busy || !loaded} className="space-y-3"><legend className="font-bold mb-2 flex items-center gap-2">أوقات الصلاة <FeatureHelp topic="reminders" /></legend>
      <p className="text-xs opacity-75">تُحسب تلقائيًا حسب موقع وطريقة حساب الصلاة في التطبيق، وليست ساعات ثابتة.</p>
      <div className="flex flex-wrap gap-4">{prayerIds.map(id => <label key={id} className="flex gap-2"><input type="checkbox" checked={preferences.prayers[id]} onChange={e => change({ ...preferences, prayers: { ...preferences.prayers, [id]: e.target.checked } })} />{prayerNames[id]}</label>)}</div>
    </fieldset>
    <fieldset disabled={busy || !loaded} className="space-y-3"><legend className="font-bold mb-2">الأذكار والعبادة اليومية</legend>
      <div className="rounded-xl border border-[#209DA3]/30 bg-[#209DA3]/5 p-3 space-y-1.5">
        <p className="text-xs font-bold">أذكار مرتبطة بأوقات الصلاة — تلقائية</p>
        <p className="text-[11px] opacity-75">أذكار الصباح بعد الفجر، أذكار المساء بعد العصر، وأذكار النوم بعد العشاء. تصل بعد الصلاة بـ 15 دقيقة ولا يمكن تعديل أوقاتها من الإعدادات.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">{Object.entries(reminderLabels).filter(([id]) => !automaticDhikrKinds.has(id)).map(([id, label]) => <div key={id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-black/5 dark:bg-white/5"><label className="flex gap-2 items-center"><input type="checkbox" checked={preferences.reminders[id].enabled} onChange={e => change({ ...preferences, reminders: { ...preferences.reminders, [id]: { ...preferences.reminders[id], enabled: e.target.checked } } })} />{label}</label><input aria-label={`وقت ${label}`} className={input} dir="ltr" type="time" value={preferences.reminders[id].time} onChange={e => change({ ...preferences, reminders: { ...preferences.reminders, [id]: { ...preferences.reminders[id], time: e.target.value } } })} /></div>)}</div>
      <p className="text-xs">أيام تذكير الصيام الشخصي (ليس حكمًا بوجوبه):</p>{daysControl(preferences.fastingDays, fastingDays => change({ ...preferences, fastingDays }))}
      <div className="rounded-xl border border-[#C6A15B]/25 p-3 space-y-2">
        <p className="text-xs font-bold">تذكير أيام البيض في الشهر الهجري</p>
        <p className="text-[11px] opacity-75">تُرسل تلقائيًا عند تفعيل إشعارات الجهاز: تذكير يوم 12، ثم دعاء ونصيحة وتذكير قبل المغرب وتهنئة في أيام 13 و14 و15. لا تحتاج هذه الرسائل إلى إعداد منفصل.</p>
      </div>
    </fieldset>
    <fieldset disabled={busy || !loaded} className="space-y-3"><legend className="font-bold mb-2">تذكيرات شخصية</legend>
      {preferences.custom.map((c, index) => <div key={c.id} className="space-y-2 p-3 rounded-xl border border-[#C6A15B]/20"><div className="flex justify-between items-center gap-2"><label className="flex gap-2"><input type="checkbox" checked={c.enabled} onChange={e => change({ ...preferences, custom: preferences.custom.map(x => x.id === c.id ? { ...x, enabled: e.target.checked } : x) })} />تذكير {index + 1}</label><input type="time" aria-label={`وقت التذكير ${index + 1}`} dir="ltr" className={input} value={c.time} onChange={e => change({ ...preferences, custom: preferences.custom.map(x => x.id === c.id ? { ...x, time: e.target.value } : x) })} /><button aria-label={`حذف التذكير ${index + 1}`} onClick={() => change({ ...preferences, custom: preferences.custom.filter(x => x.id !== c.id) })}><Trash2 size={18} /></button></div>{daysControl(c.days, days => change({ ...preferences, custom: preferences.custom.map(x => x.id === c.id ? { ...x, days } : x) }))}</div>)}
      <button className={`${button} flex items-center gap-1`} disabled={preferences.custom.length >= 10} onClick={() => change({ ...preferences, custom: [...preferences.custom, { id: crypto.randomUUID(), enabled: true, time: '12:00', days: [1, 2, 3, 4, 5, 6, 7] }] })}><Plus size={16} />إضافة تذكير</button>
    </fieldset>
    <button type="button" className={`${button} bg-[#C6A15B] text-[#18231C] font-bold`} disabled={busy || !loaded || !dirty} onClick={save}>{busy ? 'جارٍ الحفظ…' : 'حفظ المواعيد'}</button>
    {message && <p className="text-sm p-3 rounded-xl bg-[#C6A15B]/15" role="status">{message}</p>}
  </section>;
}
