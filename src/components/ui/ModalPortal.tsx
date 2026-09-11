import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Escape page stacking contexts and animated ancestors. The visual viewport
// keeps the scrollable dialog above an on-screen mobile keyboard as well.
export function ModalPortal({ active, children }: { active: boolean; children: ReactNode }) {
  const [viewport, setViewport] = useState({ top: 0, height: 0 });

  useEffect(() => {
    if (!active) return;
    const visualViewport = window.visualViewport;
    const update = () => setViewport({
      top: visualViewport?.offsetTop ?? 0,
      height: visualViewport?.height ?? window.innerHeight,
    });
    update();
    visualViewport?.addEventListener('resize', update);
    visualViewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      visualViewport?.removeEventListener('resize', update);
      visualViewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [active]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      data-modal-portal="true"
      style={{
        '--qada-modal-top': `${viewport.top}px`,
        ...(viewport.height > 0 ? { '--qada-modal-height': `${viewport.height}px` } : {}),
      } as CSSProperties}
    >
      {children}
    </div>,
    document.body,
  );
}
