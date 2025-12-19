import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

interface SwipeBackOptions {
  edgeWidth?: number;
  minSwipeDistance?: number;
  excludePaths?: string[];
}

export function useSwipeBack(options: SwipeBackOptions = {}) {
  const {
    edgeWidth = 30,
    minSwipeDistance = 80,
    excludePaths = ['/phone', '/verification', '/name', '/'],
  } = options;

  const [location, setLocation] = useLocation();
  const startX = useRef(0);
  const startY = useRef(0);
  const isEdgeSwipe = useRef(false);

  useEffect(() => {
    if (excludePaths.includes(location)) {
      return;
    }

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      isEdgeSwipe.current = touch.clientX <= edgeWidth;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isEdgeSwipe.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX.current;
      const deltaY = Math.abs(touch.clientY - startY.current);

      if (deltaX > minSwipeDistance && deltaX > deltaY * 2) {
        window.history.back();
      }

      isEdgeSwipe.current = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [location, edgeWidth, minSwipeDistance, excludePaths]);
}
