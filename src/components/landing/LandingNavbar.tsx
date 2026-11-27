import React, { useState, useEffect } from 'react';
import { StarEightPoint } from './IslamicOrnaments';
import { QadaLogo } from '../QadaLogo';
import { useAuth } from '../../context/AuthContext';

interface LandingNavbarProps {
  onStartApp: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onStartApp }) => {
  const { session } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
        isScrolled
          ? 'bg-[#18231C]/90 backdrop-blur-md py-3 shadow-lg shadow-black/20 border-b border-[#A9B7A3]/10'
          : 'bg-gradient-to-b from-[#18231C]/70 via-[#18231C]/30 to-transparent py-5'
      }`}
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 flex items-center justify-between">
        {/* Left Side: Brand Identity (in visual layout, rendered according to RTL/LTR) */}
        <div className="flex items-center gap-3">
          <a
            href="#hero"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('hero');
            }}
            className="group flex items-center gap-3 select-none"
          >
            <QadaLogo width={88} className="text-[#D5B77A]" />
          </a>
        </div>

        {/* Right Side Desktop Navigation & CTA */}
        <nav className="hidden lg:flex items-center gap-6 text-sm">
          <button
            type="button"
            onClick={() => scrollToSection('hero')}
            className="text-[#F6F1E7]/80 hover:text-[#F6F1E7] transition-colors duration-200 py-1"
          >
            الرئيسية
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('features')}
            className="text-[#F6F1E7]/80 hover:text-[#F6F1E7] transition-colors duration-200 py-1"
          >
            المميزات
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('how-it-works')}
            className="text-[#F6F1E7]/80 hover:text-[#F6F1E7] transition-colors duration-200 py-1"
          >
            كيف يعمل
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('faq')}
            className="text-[#F6F1E7]/80 hover:text-[#F6F1E7] transition-colors duration-200 py-1"
          >
            الأسئلة
          </button>

          {/* Primary Navbar CTA */}
          {!session && <a href="/account" className="text-[#F6F1E7] font-medium underline-offset-4 hover:underline">تسجيل الدخول</a>}
          <button
            type="button"
            onClick={onStartApp}
            className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F6F1E7] text-[#26352A] font-semibold text-sm transition-all duration-300 hover:bg-[#FAF7F2] hover:shadow-[0_6px_20px_rgba(246,241,231,0.22)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <span>ابدأ الآن</span>
            <svg
              className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1 rotate-180"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 12l4-4-4-4" />
            </svg>
          </button>
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-1 sm:gap-3 lg:hidden">
          <button type="button" onClick={onStartApp}
            className="px-4 py-1.5 rounded-full bg-[#F6F1E7] text-[#26352A] font-medium text-xs shadow-sm hover:bg-white">
            ابدأ الآن
          </button>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-[#F6F1E7] hover:bg-white/10 transition-colors"
            aria-label="القائمة"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#18231C]/95 backdrop-blur-xl border-b border-[#C6A15B]/15 px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
          <button
            type="button"
            onClick={() => scrollToSection('hero')}
            className="block w-full text-right text-[#F6F1E7] font-medium py-2 border-b border-white/5"
          >
            الرئيسية
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('features')}
            className="block w-full text-right text-[#F6F1E7] font-medium py-2 border-b border-white/5"
          >
            المميزات
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('how-it-works')}
            className="block w-full text-right text-[#F6F1E7] font-medium py-2 border-b border-white/5"
          >
            كيف يعمل
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('faq')}
            className="block w-full text-right text-[#F6F1E7] font-medium py-2 border-b border-white/5"
          >
            الأسئلة
          </button>
          <div className="pt-2">
            {!session && <a href="/account" className="mb-4 block py-3 text-center font-semibold text-[#F6F1E7]">تسجيل الدخول / إنشاء حساب</a>}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onStartApp();
              }}
              className="w-full py-3 rounded-full bg-[#F6F1E7] text-[#26352A] font-semibold text-center shadow-md flex items-center justify-center gap-2"
            >
              <span>ابدأ الآن مع قضاء</span>
              <StarEightPoint size={14} color="#C6A15B" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
