import React from 'react';

export const StarEightPoint: React.FC<{
  className?: string;
  size?: number;
  color?: string;
}> = ({ className = '', size = 16, color = 'currentColor' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* 8-point Islamic Star (Rub el Hizb) formed by two interlaced squares */}
      <rect
        x="4.2"
        y="4.2"
        width="15.6"
        height="15.6"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="4.2"
        y="4.2"
        width="15.6"
        height="15.6"
        transform="rotate(45 12 12)"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="1.8" fill={color} />
    </svg>
  );
};

export const SubtleArch: React.FC<{
  className?: string;
  color?: string;
}> = ({ className = '', color = 'currentColor' }) => {
  return (
    <svg
      viewBox="0 0 120 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 160V65C10 32 32 10 60 10C88 10 110 32 110 65V160"
        stroke={color}
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.2"
      />
      <path
        d="M20 160V68C20 40 38 20 60 20C82 20 100 40 100 68V160"
        stroke={color}
        strokeWidth="1.2"
      />
      <circle cx="60" cy="20" r="2.5" fill={color} />
    </svg>
  );
};

export const OrnamentalDivider: React.FC<{
  className?: string;
  accentColor?: string;
}> = ({ className = '', accentColor = '#C6A15B' }) => {
  return (
    <div className={`flex items-center justify-center gap-3 my-8 ${className}`}>
      <span
        className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-current to-transparent opacity-25"
      />
      <StarEightPoint size={14} color={accentColor} />
      <span
        className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-current to-transparent opacity-25"
      />
    </div>
  );
};

export const IslamicPatternBackground: React.FC<{
  className?: string;
  opacity?: number;
}> = ({ className = '', opacity = 0.04 }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="islamic-geom-star"
            width="56"
            height="56"
            patternUnits="userSpaceOnUse"
          >
            {/* Elegant 8-point geometric tile */}
            <path
              d="M28 4 L34 18 L48 18 L38 28 L44 42 L28 34 L12 42 L18 28 L8 18 L22 18 Z"
              fill="none"
              stroke="#C6A15B"
              strokeWidth="0.8"
            />
            <circle cx="28" cy="28" r="2" fill="#C6A15B" />
            <path
              d="M0 28 H56 M28 0 V56"
              stroke="#A9B7A3"
              strokeWidth="0.4"
              strokeDasharray="2 4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-geom-star)" />
      </svg>
    </div>
  );
};
