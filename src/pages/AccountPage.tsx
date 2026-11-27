import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { QadaLogo } from '../components/QadaLogo';
import { authClient, accountRedirect } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage, passwordProblem } from '../services/authPolicy.mjs';

type Mode = 'login' | 'signup' | 'forgot' | 'recovery';
const titles: Record<Mode, string> = { login: 'مرحباً بعودتك', signup: 'أنشئ حسابك في قضاء', forgot: 'استعادة كلمة المرور', recovery: 'كلمة مرور جديدة' };

export function AccountPage() {
  const { session, loading, recovery, error: sessionError } = useAuth();
  const [mode, setMode] = useState<Mode>(() => new URLSearchParams(location.search).get('mode') === 'recovery' ? 'recovery' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => { if (recovery) setMode('recovery'); }, [recovery]);
  // A successful sign-in should open the app immediately instead of showing
  // the signed-in account summary on the login route.
  useEffect(() => {
    if (session && !recovery && mode !== 'recovery' && window.location.pathname === '/account') {
      window.location.replace('/app');
    }
  }, [session, recovery, mode]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  const changeMode = (next: Mode) => { setMode(next); setError(''); setMessage(''); setPassword(''); setConfirmation(''); };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!authClient || busy) return;
    setError(''); setMessage('');
    if (!online) { setError('تحتاج هذه العملية إلى الإنترنت. تظل أدوات قضاء المحلية متاحة.'); return; }
    if (mode === 'signup' || mode === 'recovery') {
      const problem = passwordProblem(password, confirmation);
      if (problem) { setError(problem); return; }
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await authClient.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: accountRedirect('login') } });
        if (error) throw error;
        setMessage(data.session ? 'تم إنشاء الحساب.' : 'إذا كان البريد مؤهلاً للتسجيل، ستصلك رسالة تأكيد. افتحها في المتصفح نفسه، وتحقّق من البريد غير المرغوب فيه.');
      } else if (mode === 'forgot') {
        const { error } = await authClient.auth.resetPasswordForEmail(email.trim(), { redirectTo: accountRedirect('recovery') });
        if (error) throw error;
        setMessage('إذا كان الحساب موجوداً، ستصلك رسالة لاستعادة كلمة المرور. افتح الرابط في المتصفح نفسه.');
      } else if (mode === 'recovery') {
        if (!session) { setError('افتح رابط الاستعادة من بريدك أولاً، أو اطلب رابطاً جديداً.'); return; }
        const { error } = await authClient.auth.updateUser({ password });
        if (error) throw error;
        setMode('login'); setMessage('تم تحديث كلمة المرور بنجاح.');
      } else {
        const { error } = await authClient.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setMessage('تم تسجيل الدخول بنجاح.');
      }
      setPassword(''); setConfirmation('');
    } catch (problem) { setError(authErrorMessage(problem)); }
    finally { setBusy(false); }
  };
  const signOut = async () => {
    if (!authClient || busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const { error } = await authClient.auth.signOut({ scope: 'local' });
      if (error) throw error;
      setMode('login'); setMessage('تم تسجيل الخروج من هذا المتصفح. سجلات الجهاز لم تُحذف.');
    } catch (problem) { setError(authErrorMessage(problem)); }
    finally { setBusy(false); }
  };
  const inputClass = 'w-full rounded-xl border border-[#C6A15B]/40 bg-white/5 px-4 py-3 text-base text-[#F6F1E7] outline-none focus:border-[#C6A15B] focus:ring-2 focus:ring-[#C6A15B]/40';
  const buttonClass = 'w-full rounded-xl bg-[#C6A15B] px-5 py-3 font-bold text-[#18231C] disabled:opacity-50 disabled:cursor-not-allowed';
  const signedIn = !!session && mode !== 'recovery';
  return <main dir="rtl" className="qada-account-page min-h-dvh bg-[#18231C] px-4 py-8 text-[#F6F1E7] sm:py-14">
    <div className="mx-auto max-w-md">
      <a href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[#A9B7A3]"><ArrowRight size={18} /> العودة إلى الصفحة الرئيسية</a>
      <section className="space-y-6 rounded-3xl border border-[#C6A15B]/25 bg-[#223128] p-6 shadow-xl sm:p-8">
        <QadaLogo width={118} className="text-[#D5B77A]" />
        <h1 className="text-2xl font-bold">{signedIn ? 'الملف الشخصي' : titles[mode]}</h1>
        {!signedIn && <p className="text-sm leading-7 text-[#A9B7A3]">أنشئ حسابك أو سجّل دخولك للمتابعة في قضاء. تُستعاد إعدادات البداية وتقدّم الصلوات والاستغفار بأمان على أجهزتك الأخرى عند استخدام الحساب نفسه.</p>}
        {!authClient && <p role="status" className="rounded-xl bg-amber-200/10 p-4 text-sm leading-7 text-amber-100">خدمة الحسابات لم تُفعّل بعد. يمكنك استخدام التطبيق دون حساب.</p>}
        {!online && <p role="status" className="text-sm text-amber-100">أنت غير متصل. التسجيل والدخول واستعادة كلمة المرور تحتاج إلى الإنترنت.</p>}
        {(error || sessionError) && <p role="alert" className="rounded-xl bg-red-300/10 p-3 text-sm leading-7 text-red-100">{error || sessionError}</p>}
        {message && <p role="status" className="rounded-xl bg-green-300/10 p-3 text-sm leading-7 text-green-100">{message}</p>}
        {loading ? <p role="status">جارٍ التحقق من الجلسة…</p> : signedIn ? <div role="status" className="flex min-h-[260px] flex-col items-center justify-center gap-4 text-center">
          <QadaLogo width={118} className="text-[#D5B77A]" />
          <div><p className="text-xl font-bold">مرحبًا بعودتك</p><p className="mt-1 text-sm text-[#A9B7A3]">جارٍ فتح التطبيق…</p></div>
        </div> : <>
          <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
            <fieldset disabled={!authClient || busy || !online} className="space-y-4 disabled:opacity-60">
              {mode !== 'recovery' && <label className="block space-y-2"><span>البريد الإلكتروني</span><input className={inputClass} name="email" type="email" dir="ltr" autoComplete="email" maxLength={254} required value={email} onChange={e => setEmail(e.target.value)} /></label>}
              {mode !== 'forgot' && <label className="block space-y-2"><span>{mode === 'recovery' ? 'كلمة المرور الجديدة' : 'كلمة المرور'}</span><input className={inputClass} name="password" type="password" dir="ltr" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? 1 : 10} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} /></label>}
              {(mode === 'signup' || mode === 'recovery') && <>
                <p className="text-xs leading-6 text-[#A9B7A3]">١٠ أحرف على الأقل. اختر كلمة مرور قوية وفريدة.</p>
                <label className="block space-y-2"><span>تأكيد كلمة المرور</span><input className={inputClass} name="confirmation" type="password" dir="ltr" autoComplete="new-password" minLength={10} maxLength={128} required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
              </>}
              {mode === 'signup' && <label className="flex items-start gap-2 text-sm leading-7"><input type="checkbox" required className="mt-2" /><span>اطلعت على <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">سياسة الخصوصية</a> وأوافق على إنشاء الحساب.</span></label>}
              <button type="submit" className={buttonClass}>{busy ? 'جارٍ المعالجة…' : mode === 'signup' ? 'إنشاء الحساب' : mode === 'forgot' ? 'إرسال رابط الاستعادة' : mode === 'recovery' ? 'حفظ كلمة المرور' : 'تسجيل الدخول'}</button>
            </fieldset>
          </form>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm text-[#C6A15B]">
            <button disabled={busy} onClick={() => changeMode(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'إنشاء حساب جديد' : 'العودة لتسجيل الدخول'}</button>
            {(mode === 'login' || mode === 'recovery') && <button disabled={busy} onClick={() => changeMode('forgot')}>نسيت كلمة المرور؟</button>}
          </div>
        </>}
      </section>
    </div>
  </main>;
}
