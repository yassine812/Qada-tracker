import React from 'react';
import { StarEightPoint } from './landing/IslamicOrnaments';

export const PublicFooter: React.FC = () => (
  <footer className="border-t border-[#C6A15B]/20 bg-[#18231C] px-6 py-10 text-[#F6F1E7] sm:px-10" dir="rtl">
    <div className="mx-auto flex max-w-6xl flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
      <a href="/" className="inline-flex w-fit items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A15B]" aria-label="قضاء — الصفحة الرئيسية">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C6A15B]/25 bg-[#26352A]" aria-hidden="true">
          <StarEightPoint size={18} color="#C6A15B" />
        </span>
        <span>
          <span className="block text-lg font-bold font-landing-display">قضاء</span>
          <span className="block text-xs text-[#A9B7A3]">خطوة صغيرة، كل يوم.</span>
        </span>
      </a>
      <nav aria-label="معلومات قضاء" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#A9B7A3]">
        <a className="py-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A15B]" href="/about">عن قضاء</a>
        <a className="py-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A15B]" href="/guides">دليل الاستخدام</a>
        <a className="py-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A15B]" href="/privacy">الخصوصية والإعلانات</a>
      </nav>
    </div>
  </footer>
);
