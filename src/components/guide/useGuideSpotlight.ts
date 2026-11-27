import { useLayoutEffect, useState, type RefObject } from 'react';

interface SpotlightRect { left: number; top: number; width: number; height: number }

/** Follow actual rendered targets, including delayed tab transitions and resizing. */
export function useGuideSpotlight(selector: string | undefined, step: number, panel: RefObject<HTMLDivElement | null>, targetElement?: HTMLElement | null) {
  const [spotlight, setSpotlight] = useState<{ width: number; height: number; rect: SpotlightRect | null }>({ width: window.innerWidth, height: window.innerHeight, rect: null });
  useLayoutEffect(() => {
    let frame = 0;
    let target: HTMLElement | null = null;
    let alignTarget = true;
    let settleUntil = performance.now() + 1100;
    const measure = () => {
      frame = 0;
      const width = document.documentElement.clientWidth;
      const height = window.innerHeight;
      const card = panel.current?.getBoundingClientRect();
      const next = (selector ? document.querySelector<HTMLElement>(selector) : null) || (targetElement?.isConnected ? targetElement : null);
      if (next !== target) {
        if (target) observer.unobserve(target);
        target = next;
        if (target) observer.observe(target);
        alignTarget = true;
        settleUntil = performance.now() + 700;
      }
      if (target && alignTarget) {
        alignTarget = false;
        window.scrollTo({ top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - 94), behavior: 'instant' });
      }
      let rect: SpotlightRect | null = null;
      if (target && card) {
        const bounds = target.getBoundingClientRect();
        // The panel owns a separate lane; oversized targets cannot spill into it.
        const left = Math.max(8, bounds.left - 8);
        const top = Math.max(76, bounds.top - 8);
        const right = Math.min(width >= 1024 ? card.left - 20 : width - 8, bounds.right + 8);
        const bottom = Math.min(width >= 1024 ? height - 16 : card.top - 16, bounds.bottom + 8);
        if (right > left && bottom > top) rect = { left, top, width: right - left, height: bottom - top };
      }
      setSpotlight(previous => JSON.stringify(previous) === JSON.stringify({ width, height, rect }) ? previous : { width, height, rect });
      if (performance.now() < settleUntil) frame = requestAnimationFrame(measure);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const resize = () => { alignTarget = true; settleUntil = performance.now() + 400; schedule(); };
    const observer = new ResizeObserver(schedule);
    if (panel.current) observer.observe(panel.current);
    const mutation = new MutationObserver(schedule);
    const main = document.querySelector('.qada-experience > main, .qada-help-content');
    if (main) mutation.observe(main, { childList: true, subtree: true });
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', schedule, true);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect(); mutation.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', schedule, true);
    };
  }, [selector, step, panel, targetElement]);
  return spotlight;
}
