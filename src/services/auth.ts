import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { publicAuthConfig } from './authPolicy.mjs';

const config = publicAuthConfig(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
export let authClient: SupabaseClient | null = null;

// Do not initialize or refresh an account session on public advertising pages.
export function initializeAuth() {
  if (authClient || !config) return authClient;
  authClient = createClient(config.url, config.key, {
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  global: {
    fetch: async (input, init) => {
      // AbortController also works on older iPhones without AbortSignal.any/timeout.
      const controller = new AbortController();
      const abort = () => controller.abort();
      const signal = init?.signal;
      if (signal?.aborted) abort();
      else signal?.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(abort, 15000);
      try { return await fetch(input, { ...init, signal: controller.signal, cache: 'no-store' }); }
      finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
    },
  },
  });
  return authClient;
}

export function accountRedirect(mode: 'login' | 'recovery') {
  return `${window.location.origin}/account?mode=${mode}`;
}
