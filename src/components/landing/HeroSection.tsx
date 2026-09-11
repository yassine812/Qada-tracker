import React, { useEffect, useRef, useState } from 'react';
import { StarEightPoint } from './IslamicOrnaments';
import { InstallButton } from '../InstallButton';

interface HeroSectionProps {
  onStartApp: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onStartApp }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    const handlePlaying = () => {
      setIsPlaying(true);
    };

    const attemptPlay = () => {
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            // Autoplay blocked by iOS (e.g. Low Power Mode).
            // The video stays opacity-0 so WebKit's native play button overlay is NEVER visible,
            // while the cinematic poster remains seamless in the background.
          });
      }
    };

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handlePlaying);
    video.addEventListener('loadedmetadata', attemptPlay);
    video.addEventListener('canplay', attemptPlay);
    document.addEventListener('visibilitychange', attemptPlay);
    window.addEventListener('pageshow', attemptPlay);

    // Seamlessly start playback on first touch/interaction (e.g. when in Low Power Mode)
    const onUserInteraction = () => {
      attemptPlay();
    };
    window.addEventListener('touchstart', onUserInteraction, { passive: true, once: true });
    window.addEventListener('touchend', onUserInteraction, { passive: true, once: true });
    window.addEventListener('click', onUserInteraction, { passive: true, once: true });
    window.addEventListener('scroll', onUserInteraction, { passive: true, once: true });

    attemptPlay();

    return () => {
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handlePlaying);
      video.removeEventListener('loadedmetadata', attemptPlay);
      video.removeEventListener('canplay', attemptPlay);
      document.removeEventListener('visibilitychange', attemptPlay);
      window.removeEventListener('pageshow', attemptPlay);
      window.removeEventListener('touchstart', onUserInteraction);
      window.removeEventListener('touchend', onUserInteraction);
      window.removeEventListener('click', onUserInteraction);
      window.removeEventListener('scroll', onUserInteraction);
    };
  }, []);

  const scrollToFeatures = () => {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      className="relative w-full min-h-screen h-[100svh] overflow-hidden flex items-center select-none"
    >
      {/* 1. CINEMATIC POSTER FALLBACK (Always behind video, exact same framing) */}
      <img
        src="/qada-garden-poster.jpg"
        alt=""
        aria-hidden="true"
        className="hero-video absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
      />

      {/* 2. CINEMATIC FULLSCREEN BACKGROUND VIDEO */}
      <video
        ref={videoRef}
        className={`hero-video absolute inset-0 w-full h-full object-cover pointer-events-none z-0 transition-opacity duration-700 ${
          isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src="/qada-garden.mp4" type="video/mp4" />
      </video>

      {/* 2. CINEMATIC GRADIENT OVERLAYS (Preserves garden & characters on right) */}
      <div className="absolute inset-0 z-10 pointer-events-none hero-cinematic-overlay" />
      <div className="absolute inset-0 z-10 pointer-events-none hero-vignette" />

      {/* 3. HERO CONTENT CONTAINER (VISUALLY ANCHORED ON THE LEFT) */}
      {/*
        CRITICAL RTL POSITIONING:
        The content block is physically anchored on the left side of the viewport
        (left-6 sm:left-10 lg:left-16 xl:left-24) so that the two Muslim characters
        in the garden on the right side remain completely uncovered and visible.
        Within the block, Arabic typography uses dir="rtl" and text-right.
      */}
      <div className="absolute left-6 sm:left-10 lg:left-16 xl:left-24 bottom-20 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 z-20 w-[calc(100%-3rem)] sm:w-auto max-w-[540px]">
        <div dir="rtl" className="text-right text-[#F6F1E7]">
          {/* Eyebrow */}
          <div className="anim-seq-1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#26352A]/70 border border-[#C6A15B]/30 backdrop-blur-md mb-5 sm:mb-6 shadow-sm">
            <span className="landing-star-float text-[#C6A15B] inline-flex">
              <StarEightPoint size={13} color="#C6A15B" />
            </span>
            <span className="text-xs sm:text-sm font-medium tracking-wide text-[#F6F1E7]/90 font-landing-display">
              رفيقك للعودة إلى الله
            </span>
          </div>

          {/* Main Display Heading */}
          <h1 className="anim-seq-2 font-landing-display font-extrabold tracking-tight text-[#F6F1E7] mb-4 sm:mb-6 leading-[1.08] text-[clamp(2.5rem,6.5vw,5.5rem)] drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
            <span className="block text-[#F6F1E7]">ابدأ من جديد.</span>
            <span className="block text-[#C6A15B] font-bold mt-1 sm:mt-2 text-[0.82em]">
              وخطوةً بخطوة، أكمل ما فاتك.
            </span>
          </h1>

          {/* Subtitle / Description */}
          <p className="anim-seq-3 text-sm sm:text-base lg:text-lg text-[#F6F1E7]/85 font-normal leading-relaxed mb-7 sm:mb-9 max-w-[480px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
            قضاء يساعدك على تنظيم الصلوات الفائتة، الصيام، الاستغفار، القرآن والذكر — في تجربة واحدة بسيطة تحفظ سجلات المتابعة على جهازك.
          </p>

          {/* Primary & Secondary Call to Actions */}
          <div className="anim-seq-4 flex flex-wrap items-center gap-4 mb-6 sm:mb-8">
            <div className="flex w-full items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onStartApp}
              className="group relative inline-flex items-center justify-center whitespace-nowrap gap-2 px-4 sm:px-8 py-3.5 sm:py-4 rounded-full bg-[#F6F1E7] text-[#26352A] font-bold text-sm sm:text-lg transition-all duration-300 hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(246,241,231,0.25)] active:translate-y-0 cursor-pointer"
            >
              <span>افتح التطبيق</span>
              <svg
                className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1.5 rotate-180"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 12l4-4-4-4" />
              </svg>
            </button>
            <InstallButton className="px-3 sm:px-6 py-3.5 sm:py-4 rounded-full bg-[#C6A15B] text-[#18231C] font-bold text-sm sm:text-lg hover:bg-[#D5B673] transition-colors" />
            </div>

            <button
              type="button"
              onClick={scrollToFeatures}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[#F6F1E7]/80 hover:text-[#F6F1E7] font-medium text-sm sm:text-base border border-transparent hover:border-white/20 transition-all duration-200 cursor-pointer"
            >
              <span>اكتشف كيف يعمل</span>
              <svg
                className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Small Trust Message: Local-First Philosophy */}
          <div className="anim-seq-5 flex flex-col gap-1.5 pt-2 border-t border-white/10 max-w-[420px]">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#A9B7A3]">
              <svg
                className="w-4 h-4 text-[#C6A15B] shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span>بياناتك تبقى على جهازك</span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#F6F1E7]/60 tracking-wider">
              مباشرة من المتصفح • بدون تثبيت • بدون حساب
            </p>
          </div>
        </div>
      </div>

      {/* 4. SCROLL INDICATOR */}
      <div className="anim-seq-6 absolute bottom-6 right-8 sm:right-16 z-20 hidden sm:flex items-center gap-2.5 text-[#F6F1E7]/70 hover:text-[#F6F1E7] transition-colors cursor-pointer"
           onClick={scrollToFeatures}
           role="button"
           tabIndex={0}
      >
        <span className="text-xs font-medium tracking-wide">اكتشف المزيد</span>
        <span className="scroll-cue-animated w-7 h-7 rounded-full border border-white/20 flex items-center justify-center">
          <svg
            className="w-3.5 h-3.5 text-[#C6A15B]"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </span>
      </div>
    </section>
  );
};
