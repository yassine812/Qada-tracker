import React from 'react';

/**
 * Premium Islamic geometric background pattern.
 * Uses SVG 8-pointed star (octagram) tessellation at very low opacity.
 * Creates the feel of premium Islamic stationery.
 */
export const IslamicGeometricBg: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Main geometric pattern: 8-pointed star tessellation */}
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 'var(--qada-pattern-opacity)' }}
      >
        <defs>
          <pattern
            id="islamic-octagram"
            x="0"
            y="0"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            {/* Outer 8-pointed star */}
            <polygon
              points="40,6 45,22 60,10 50,26 66,26 50,34 60,50 45,38 40,54 35,38 20,50 30,34 14,26 30,26 20,10 35,22"
              fill="none"
              stroke="var(--qada-pattern-color)"
              strokeWidth="0.4"
              strokeLinejoin="round"
            />
            {/* Inner octagon */}
            <polygon
              points="40,18 50,22 54,32 50,42 40,46 30,42 26,32 30,22"
              fill="none"
              stroke="var(--qada-pattern-color)"
              strokeWidth="0.3"
              strokeLinejoin="round"
            />
            {/* Center diamond */}
            <polygon
              points="40,26 46,32 40,38 34,32"
              fill="none"
              stroke="var(--qada-pattern-color)"
              strokeWidth="0.25"
            />
            {/* Connecting diagonals */}
            <line x1="0" y1="0" x2="20" y2="10" stroke="var(--qada-pattern-color)" strokeWidth="0.15" />
            <line x1="80" y1="0" x2="60" y2="10" stroke="var(--qada-pattern-color)" strokeWidth="0.15" />
            <line x1="0" y1="80" x2="20" y2="70" stroke="var(--qada-pattern-color)" strokeWidth="0.15" />
            <line x1="80" y1="80" x2="60" y2="70" stroke="var(--qada-pattern-color)" strokeWidth="0.15" />
            <line x1="0" y1="40" x2="14" y2="26" stroke="var(--qada-pattern-color)" strokeWidth="0.1" />
            <line x1="80" y1="40" x2="66" y2="26" stroke="var(--qada-pattern-color)" strokeWidth="0.1" />
            {/* Subtle corner dots */}
            <circle cx="0" cy="0" r="1" fill="var(--qada-pattern-color)" opacity="0.15" />
            <circle cx="80" cy="0" r="1" fill="var(--qada-pattern-color)" opacity="0.15" />
            <circle cx="0" cy="80" r="1" fill="var(--qada-pattern-color)" opacity="0.15" />
            <circle cx="80" cy="80" r="1" fill="var(--qada-pattern-color)" opacity="0.15" />
            <circle cx="40" cy="0" r="0.8" fill="var(--qada-pattern-color)" opacity="0.1" />
            <circle cx="40" cy="80" r="0.8" fill="var(--qada-pattern-color)" opacity="0.1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-octagram)" />
      </svg>

      {/* Radial gradient overlay for depth - creates focus area */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 15%, var(--qada-primary-soft), transparent 65%)',
        }}
      />

      {/* Subtle top ambient glow */}
      <div
        className="absolute -top-24 right-1/4 w-72 h-72 rounded-full"
        style={{
          background: 'radial-gradient(circle, var(--qada-accent-soft), transparent 70%)',
          opacity: 0.35,
        }}
      />

      {/* Bottom-left subtle warmth */}
      <div
        className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle, var(--qada-primary-soft), transparent 70%)',
          opacity: 0.2,
        }}
      />
    </div>
  );
};
