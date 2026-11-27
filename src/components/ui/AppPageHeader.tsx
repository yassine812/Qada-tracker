import React from 'react';
import { Sunrise, MoonStar, Leaf, SlidersHorizontal } from 'lucide-react';
import './appPageHeader.css';

export function AppPageHeader({ eyebrow, title, description, date, symbol = 'leaf', guide }: { eyebrow: string; title: React.ReactNode; description?: string; date?: string; symbol?: 'sunrise' | 'moon' | 'leaf' | 'settings'; guide?: string }) {
  const Icon = { sunrise: Sunrise, moon: MoonStar, leaf: Leaf, settings: SlidersHorizontal }[symbol];
  return <header className="qada-page-heading qada-page-banner" data-guide={guide}>
    <svg className="qada-page-arch" viewBox="0 0 180 180" fill="none" aria-hidden="true">
      <path d="M20 180V94Q20 62 48 50Q74 38 90 12Q106 38 132 50Q160 62 160 94V180M34 180V98Q34 74 57 64Q78 54 90 34Q102 54 123 64Q146 74 146 98V180" stroke="currentColor" />
      <path d="m90 77 8 20 20 8-20 8-8 20-8-20-20-8 20-8Z" stroke="currentColor" /><circle cx="90" cy="105" r="5" fill="currentColor" />
    </svg>
    <div className="qada-page-banner-content">
      <div className="qada-page-meta"><span className="qada-page-emblem" aria-hidden="true"><Icon size={19} strokeWidth={1.6} /></span><span className="qada-section-kicker">{eyebrow}</span>{date && <span className="qada-page-date">{date}</span>}</div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      <span className="qada-page-flourish" aria-hidden="true"><i /><span>✦</span><i /></span>
    </div>
  </header>;
}
