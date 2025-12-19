import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

interface SwipeBackOptions {
  edgeWidth?: number;
  minSwipeDistance?: number;
  excludePaths?: string[];
}

export function useSwipeBack(options: SwipeBackOptions = {}) {
  const {
    edgeWidth = 50,
    minSwipeDistance = 60,
    excludePaths = ['/phone', '/verification', '/name', '/'],
  } = options;

  const [location] = useLocation();
  const startX = useRef(0);
  const startY = useRef(0);
  const isEdgeSwipe = useRef(false);
  const swipeIndicator = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (excludePaths.includes(location)) {
      return;
    }

    const createIndicator = () => {
      if (!swipeIndicator.current) {
        const div = document.createElement('div');
        div.style.cssText = `
          position: fixed;
          left: 0;
          top: 0;
          width: 8px;
          height: 100vh;
          background: linear-gradient(to right, rgba(255,107,0,0.4), transparent);
          pointer-events: none;
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.15s, width 0.15s;
        `;
        document.body.appendChild(div);
        swipeIndicator.current = div;
      }
      return swipeIndicator.current;
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      isEdgeSwipe.current = touch.clientX <= edgeWidth;
      
      if (isEdgeSwipe.current) {
        const indicator = createIndicator();
        indicator.style.opacity = '1';
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isEdgeSwipe.current) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - startX.current;
      const indicator = swipeIndicator.current;
      
      if (indicator && deltaX > 0) {
        const progress = Math.min(deltaX / minSwipeDistance, 1);
        indicator.style.width = `${8 + (progress * 40)}px`;
        indicator.style.background = `linear-gradient(to right, rgba(255,107,0,${0.4 + progress * 0.3}), transparent)`;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const indicator = swipeIndicator.current;
      if (indicator) {
        indicator.style.opacity = '0';
        indicator.style.width = '8px';
      }
      
      if (!isEdgeSwipe.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX.current;
      const deltaY = Math.abs(touch.clientY - startY.current);

      if (deltaX > minSwipeDistance && deltaX > deltaY * 1.5) {
        window.history.back();
      }

      isEdgeSwipe.current = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      if (swipeIndicator.current) {
        swipeIndicator.current.remove();
        swipeIndicator.current = null;
      }
    };
  }, [location, edgeWidth, minSwipeDistance, excludePaths]);
}
