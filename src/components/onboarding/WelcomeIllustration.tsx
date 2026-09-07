import React from 'react';
import { motion } from 'motion/react';
import { StarEightPoint } from '../landing/IslamicOrnaments';

interface WelcomeIllustrationProps {
  type?: string;
}

export const WelcomeIllustration: React.FC<WelcomeIllustrationProps> = ({ type = 'general' }) => {
  return (
    <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto flex items-center justify-center">
      {/* Soft Ambient Glow Halo */}
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 rounded-full bg-radial from-[#C6A15B]/30 via-[#C6A15B]/10 to-transparent blur-xl pointer-events-none"
      />

      {/* Decorative Floating Geometric Accents */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="absolute -top-1 right-3 text-[#C6A15B]/40">
          <StarEightPoint size={12} color="#C6A15B" />
        </div>
        <div className="absolute -bottom-1 left-3 text-[#C6A15B]/40">
          <StarEightPoint size={10} color="#C6A15B" />
        </div>
      </motion.div>

      {/* Main Symbolic Islamic Artwork (Mihrab & Glowing Lantern) */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_8px_24px_rgba(198,161,91,0.25)]"
        >
          {/* Subtle Outer Arch Frame */}
          <path
            d="M24 105V52C24 32 39 16 60 16C81 16 96 32 96 52V105"
            stroke="currentColor"
            className="text-[#C6A15B]/25"
            strokeWidth="1.5"
            strokeDasharray="2 3"
          />

          {/* Inner Sharp Pointed Arch (Mihrab) */}
          <path
            d="M32 105V55C32 40 44 26 60 22C76 26 88 40 88 55V105"
            stroke="url(#archGoldGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Mihrab Base Line */}
          <path
            d="M18 105H102"
            stroke="url(#archGoldGrad)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Hanging Chain for Lantern */}
          <line
            x1="60"
            y1="22"
            x2="60"
            y2="46"
            stroke="#C6A15B"
            strokeWidth="1.2"
            strokeDasharray="1.5 1.5"
          />

          {/* Glowing Lantern (Qandil) */}
          <g>
            {/* Top Cap */}
            <path
              d="M54 47C54 45.5 56.5 44 60 44C63.5 44 66 45.5 66 47L64 50H56L54 47Z"
              fill="#C6A15B"
            />
            {/* Glass Body */}
            <path
              d="M56 50H64L67 62C67 66 63.8 70 60 70C56.2 70 53 66 53 62L56 50Z"
              fill="url(#lanternGlassGrad)"
              stroke="#C6A15B"
              strokeWidth="1.2"
            />
            {/* Inner Light Flame */}
            <circle cx="60" cy="60" r="3.5" fill="#FFEAA7" className="animate-pulse" />
            <circle cx="60" cy="60" r="7" fill="#C6A15B" fillOpacity="0.3" className="animate-ping" />
            {/* Bottom Finial */}
            <path
              d="M58 70H62L60 75L58 70Z"
              fill="#C6A15B"
            />
          </g>

          {/* Radiating Light Beams */}
          <path
            d="M48 60L42 60M78 60L72 60M49 68L44 71M71 68L76 71M49 52L44 49M71 52L76 49"
            stroke="#C6A15B"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="archGoldGrad" x1="32" y1="22" x2="88" y2="105" gradientUnits="userSpaceOnUse">
              <stop stopColor="#C6A15B" />
              <stop offset="0.5" stopColor="#E2CA89" />
              <stop offset="1" stopColor="#C6A15B" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="lanternGlassGrad" x1="53" y1="50" x2="67" y2="70" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFF2D6" stopOpacity="0.8" />
              <stop offset="1" stopColor="#C6A15B" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
};
