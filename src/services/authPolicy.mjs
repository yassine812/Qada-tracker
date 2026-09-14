// Only public browser credentials are accepted. Never bundle an admin/service key.
export function publicAuthConfig(url, key) {
  try {
    const parsed = new URL(url || '');
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) return null;
    const value = (key || '').trim();
    let publicKey = value.startsWith('sb_publishable_');
    if (!publicKey && value.split('.').length === 3) {
      const payload = JSON.parse(atob(value.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      publicKey = payload.role === 'anon';
    }
    return publicKey ? { url: parsed.origin, key: value } : null;
  } catch { return null; }
}

export function passwordProblem(password, confirmation) {
  if (password.length < 10) return 'استخدم كلمة مرور من ١٠ أحرف على الأقل.';
  if (password.length > 128) return 'الحد الأقصى لكلمة المرور ١٢٨ حرفاً.';
  if (password !== confirmation) return 'كلمتا المرور غير متطابقتين.';
  return '';
}

export function authErrorMessage(error) {
  const code = error?.code;
  if (code === 'invalid_credentials') return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
  if (code === 'email_not_confirmed') return 'أكّد بريدك الإلكتروني من رسالة التسجيل أولاً.';
  if (code === 'weak_password') return 'اختر كلمة مرور أقوى لا تستخدمها في موقع آخر.';
  if (error?.status === 429 || code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') return 'طلبات كثيرة. انتظر قليلاً ثم حاول مجدداً.';
  if (code === 'otp_expired' || code === 'flow_state_expired' || code === 'flow_state_not_found') return 'انتهت صلاحية الرابط. اطلب رابطاً جديداً وافتحه في المتصفح نفسه.';
  return 'تعذّر إكمال العملية. تحقّق من اتصال الإنترنت وحاول مجدداً.';
}
