import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { authClient, initializeAuth } from '../services/auth';
import { authErrorMessage } from '../services/authPolicy.mjs';

const Context = createContext({ session: null as Session | null, loading: true, recovery: false, error: '' });
export const useAuth = () => useContext(Context);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useState(initializeAuth);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!!authClient);
  const [recovery, setRecovery] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!authClient) return;
    let active = true;
    // Keep the account screen responsive while the authentication service loads.
    const timer = window.setTimeout(() => { if (active) setLoading(false); }, 8000);
    const { data: { subscription } } = authClient.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession(next); setLoading(false);
      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') setError('');
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT') setRecovery(false);
    });
    authClient.auth.getSession().then(({ data, error: problem }) => {
      if (!active) return;
      setSession(data.session); setLoading(false);
      if (problem) setError(authErrorMessage(problem));
      // Never leave callback credentials or error descriptions in the address bar.
      if (window.location.pathname === '/account') {
        const params = new URLSearchParams(window.location.search);
        const fragment = new URLSearchParams(window.location.hash.slice(1));
        if (params.has('error') || fragment.has('error')) setError('تعذّر استخدام الرابط. اطلب رابطاً جديداً وافتحه في المتصفح نفسه.');
        const mode = params.get('mode') === 'recovery' ? '?mode=recovery' : '';
        window.history.replaceState(null, '', `/account${mode}`);
      }
    }).catch(() => { if (active) { setLoading(false); setError('تعذّر الاتصال بخدمة الحسابات. حاول لاحقًا.'); } });
    return () => { active = false; window.clearTimeout(timer); subscription.unsubscribe(); };
  }, []);
  return <Context.Provider value={{ session, loading, recovery, error }}>{children}</Context.Provider>;
}
