import type { CSSProperties } from 'react';

/** Shaped Arabic lettering stored as vector outlines, with no font dependency. */
export function QadaLogo({ width = 82, className = '' }: { width?: number; className?: string }) {
  const mask = 'url("/images/qada-wordmark.svg") center / contain no-repeat';
  return <span role="img" aria-label="قضاء" className={`inline-block shrink-0 align-middle ${className}`} style={{
    width, height: width * 146.758 / 243.652, backgroundColor: 'currentColor',
    mask, WebkitMask: mask,
  } as CSSProperties} />;
}
