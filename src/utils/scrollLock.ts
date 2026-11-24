import { useEffect } from 'react';

let activeLocks = 0;
let savedStyles: {
  htmlOverflow: string;
  bodyOverflow: string;
  htmlOverscroll: string;
  bodyOverscroll: string;
  bodyPaddingRight: string;
} | null = null;

function applyLock() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (activeLocks === 0) {
    const html = document.documentElement;
    const body = document.body;
    const scrollbarWidth = window.innerWidth - html.clientWidth;

    savedStyles = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverscroll: body.style.overscrollBehavior,
      bodyPaddingRight: body.style.paddingRight
    };

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';

    if (scrollbarWidth > 0) {
      const currentPadding = parseFloat(window.getComputedStyle(body).paddingRight || '0') || 0;
      body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }
  }
  activeLocks += 1;
}

function releaseLock() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (activeLocks <= 0) return;
  activeLocks -= 1;

  if (activeLocks === 0 && savedStyles) {
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = savedStyles.htmlOverflow;
    body.style.overflow = savedStyles.bodyOverflow;
    html.style.overscrollBehavior = savedStyles.htmlOverscroll;
    body.style.overscrollBehavior = savedStyles.bodyOverscroll;
    body.style.paddingRight = savedStyles.bodyPaddingRight;
    savedStyles = null;
  }
}

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    applyLock();
    return () => {
      releaseLock();
    };
  }, [locked]);
}
