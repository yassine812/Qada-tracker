import React from 'react';
import { UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AccountCard() {
  const { session } = useAuth();
  return <section className="rounded-3xl border border-[#C6A15B]/20 bg-white/80 p-5 dark:bg-[#1F2E24]">
    <h3 className="mb-3 flex items-center gap-2 font-bold"><UserRound size={18} /> الحساب</h3>
    <p className="mb-3 break-all text-sm text-[#7E8C7F] dark:text-[#A9B7A3]">{session?.user.email || 'تسجيل الدخول أو إنشاء حساب اختياري.'}</p>
    <p className="mb-4 text-xs leading-6 text-[#7E8C7F] dark:text-[#A9B7A3]">إعدادات البداية وتقدّم الصلوات والاستغفار تُستعاد لحسابك على أجهزتك الأخرى. تسجيل الخروج لا يحذف بيانات هذا الجهاز.</p>
    <a href="/account" className="inline-flex rounded-xl bg-[#26352A] px-4 py-2 text-sm font-bold text-[#F6F1E7] dark:bg-[#C6A15B] dark:text-[#18231C]">{session ? 'إدارة الحساب' : 'تسجيل الدخول / إنشاء حساب'}</a>
  </section>;
}
