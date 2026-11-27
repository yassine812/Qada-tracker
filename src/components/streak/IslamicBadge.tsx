import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { STREAK_BADGES } from '../../services/streakModel';

const star = '60,35 67,43 78,42 77,53 85,60 77,67 78,78 67,77 60,85 53,77 42,78 43,67 35,60 43,53 42,42 53,43';
const crescent = <path d="M68 34a27 27 0 1 0 15 42A24 24 0 0 1 68 34Z" />;
export function IslamicBadge({ badgeId, size = 100, unlocked = true, animated = false }: { badgeId: string; size?: number; unlocked?: boolean; animated?: boolean }) {
  const reduced = useReducedMotion();
  const index = Math.max(0, STREAK_BADGES.findIndex(b => b.id === badgeId));
  const day = STREAK_BADGES[index].requirement;
  const motif = (() => {
    switch (day) {
      case 3: return <><path d="M57 28a3 3 0 1 1 6 0v6M47 44l13-10 13 10M44 47h32l-5 32H49ZM49 82h22M54 87h12M51 47l9 31 9-31M44 57h32" /><path d="m60 52 5 9-5 9-5-9Z" fill="currentColor" opacity=".55" /></>;
      case 7: return <><path d="M38 86V57Q39 44 60 33Q81 44 82 57V86ZM46 86V60Q46 51 60 43Q74 51 74 60V86M34 88h52" /><path d="M64 22a7 7 0 1 0 5 10 7 7 0 0 1-5-10Z" fill="currentColor" /></>;
      case 14: return <>{Array.from({ length: 18 }, (_, i) => <circle key={i} cx={60 + Math.cos(i * Math.PI / 10 - Math.PI / 2) * 25} cy={55 + Math.sin(i * Math.PI / 10 - Math.PI / 2) * 25} r="3.6" fill="currentColor" />)}<path d="m48 78-3 11 6 5 5-5-5-12M50 94v6" /><polygon points={star} transform="translate(26 21) scale(.57)" /></>;
      case 30: return <><path d="m36 46 26-11 24 11v34L60 91 36 80ZM36 46l24 11 26-11M60 57v34" fill="#18231C" /><path d="m37 54 23 10 25-10M37 60l23 10 25-10" strokeWidth="3" /><path d="M68 72v11l9-4V68Z" /></>;
      case 60: return <><path d="M41 86Q61 66 75 34M47 79Q37 69 41 58Q52 62 51 73M56 66Q48 55 51 46Q63 49 61 57M64 51Q59 39 67 31Q75 40 70 43M53 75Q63 77 74 68Q62 62 58 68M62 59Q75 60 82 49Q71 46 67 52" /><circle cx="46" cy="85" r="3" fill="currentColor" /><path d="m32 43 4-5 4 5-4 5Z" /></>;
      case 100: return <><polygon points={star} fill="currentColor" opacity=".35" /><polygon points={star} transform="translate(18 18) scale(.7)" /><circle cx="60" cy="60" r="8" fill="currentColor" /></>;
      default: return <>{crescent}<polygon points={star} transform={`translate(${day === 1 ? '57 24' : '52 23'}) scale(.28)`} fill="currentColor" />{day === 365 && <polygon points={star} transform="translate(32 37) scale(.43)" />}</>;
    }
  })();
  return <motion.svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={`${STREAK_BADGES[index].title}${unlocked ? '' : ' — لم تُكتسب بعد'}`}
    className={`islamic-badge ${unlocked ? 'is-unlocked' : 'is-locked'}`}
    initial={animated && !reduced ? { scale: .82, rotate: -5 } : false}
    animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 130, damping: 15 }}>
    <circle cx="60" cy="60" r="57" fill={unlocked ? '#26352A' : 'var(--qada-surface-2)'} stroke="currentColor" strokeWidth="1.3" />
    <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" opacity=".45" />
    {Array.from({ length: 8 + index * 4 }, (_, i) => <path key={i} d="m59 8 1-3 1 3-1 3Z" transform={`rotate(${i * 360 / (8 + index * 4)} 60 60)`} fill="currentColor" opacity=".75" />)}
    <g fill="none" stroke="currentColor" opacity=".13" strokeWidth=".7"><rect x="29" y="29" width="62" height="62" /><rect x="29" y="29" width="62" height="62" transform="rotate(45 60 60)" />{index > 3 && <circle cx="60" cy="60" r="41" />}</g>
    {index >= 6 && <g stroke="currentColor" opacity=".55">{Array.from({ length: 16 }, (_, i) => <path key={i} d="M60 15v5" transform={`rotate(${i * 22.5} 60 60)`} />)}</g>}
    <g stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" fill="none">{motif}</g>
    {!unlocked && <g stroke="var(--qada-text-secondary)" strokeWidth="2"><circle cx="93" cy="94" r="13" fill="var(--qada-surface-1)" strokeWidth="1" /><rect x="88" y="93" width="10" height="8" rx="2" fill="none" /><path d="M90 93v-3a3 3 0 0 1 6 0v3" fill="none" /></g>}
  </motion.svg>;
}
