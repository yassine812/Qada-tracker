import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Reusable Page Transition Primitive (400-600ms, smooth vertical ease)
export const PageTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

import { formatNumber } from '../../utils/formatters';

// Reusable Animated Number (Smoothly transitions between values like 12,045 -> 12,044 in Western numerals)
export const AnimatedNumber: React.FC<{
  value: number;
  className?: string;
  formatCommas?: boolean;
}> = ({ value, className = '', formatCommas = true }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [direction, setDirection] = useState<'up' | 'down'>('down');
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      setDirection(value < prevValueRef.current ? 'down' : 'up');
      prevValueRef.current = value;
      setDisplayValue(value);
    }
  }, [value]);

  const formatted = formatNumber(displayValue, { commas: formatCommas });

  return (
    <div className={`inline-block overflow-hidden relative ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{
            y: direction === 'down' ? -12 : 12,
            opacity: 0.3,
            filter: 'blur(2px)',
          }}
          animate={{
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
          }}
          exit={{
            y: direction === 'down' ? 12 : -12,
            opacity: 0,
            filter: 'blur(2px)',
          }}
          transition={{
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
        >
          {formatted}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

// Tactile Spring Button with Press Feedback
export const TactileButton: React.FC<{
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}> = ({
  children,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  ariaLabel,
}) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileHover={disabled ? undefined : { y: -1.5 }}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      className={`cursor-pointer select-none transition-colors ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {children}
    </motion.button>
  );
};

// Reusable Circular Progress Ring for Istighfar and Overview
export const CircularProgressRing: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  circleColor?: string;
  progressColor?: string;
  children?: React.ReactNode;
  className?: string;
}> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  circleColor = 'rgba(198, 161, 91, 0.15)',
  progressColor = '#C6A15B',
  children,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 origin-center overflow-visible"
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={circleColor}
          strokeWidth={strokeWidth}
        />
        {/* Animated Progress Track */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {children}
      </div>
    </div>
  );
};

// Smooth Horizontal Progress Bar
export const AnimatedProgressBar: React.FC<{
  percentage: number;
  className?: string;
  barColor?: string;
  height?: string;
}> = ({
  percentage,
  className = '',
  barColor = 'bg-gradient-to-l from-[#C6A15B] to-[#A9B7A3]',
  height = 'h-2',
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-[#26352A]/10 dark:bg-white/10 ${height} ${className}`}
    >
      <motion.div
        className={`h-full rounded-full ${barColor}`}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
};
