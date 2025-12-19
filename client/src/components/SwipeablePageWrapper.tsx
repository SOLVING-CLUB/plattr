import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'wouter';

interface SwipeablePageWrapperProps {
  children: ReactNode;
  excludePaths?: string[];
}

export function SwipeablePageWrapper({ 
  children, 
  excludePaths = ['/phone', '/verification', '/name', '/'] 
}: SwipeablePageWrapperProps) {
  const [location] = useLocation();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isEdgeSwipe = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const edgeWidth = 50;
  const minSwipeDistance = 80;
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 375;

  const isExcluded = excludePaths.includes(location);

  useEffect(() => {
    if (isExcluded) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      isEdgeSwipe.current = touch.clientX <= edgeWidth;
      
      if (isEdgeSwipe.current) {
        setIsSwiping(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isEdgeSwipe.current) return;
      
      const touch = e.touches[0];
      const deltaX = Math.max(0, touch.clientX - startX.current);
      const deltaY = Math.abs(touch.clientY - startY.current);
      
      if (deltaY > deltaX) {
        isEdgeSwipe.current = false;
        setIsSwiping(false);
        setSwipeOffset(0);
        return;
      }
      
      setSwipeOffset(deltaX);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isEdgeSwipe.current) {
        setIsSwiping(false);
        setSwipeOffset(0);
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX.current;
      const velocity = deltaX / 200;

      if (deltaX > minSwipeDistance || velocity > 1.5) {
        setSwipeOffset(screenWidth);
        setTimeout(() => {
          window.history.back();
          setSwipeOffset(0);
          setIsSwiping(false);
        }, 200);
      } else {
        setSwipeOffset(0);
        setTimeout(() => setIsSwiping(false), 200);
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
    };
  }, [location, isExcluded, screenWidth]);

  const progress = Math.min(swipeOffset / screenWidth, 1);
  const behindOffset = -100 + (progress * 100);

  return (
    <div ref={containerRef} className="relative w-full min-h-screen overflow-hidden">
      {isSwiping && (
        <div 
          className="absolute inset-0 bg-gray-100"
          style={{
            transform: `translateX(${behindOffset}px)`,
            transition: swipeOffset === 0 || swipeOffset === screenWidth ? 'transform 0.2s ease-out' : 'none',
          }}
        >
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Release to go back</span>
            </div>
          </div>
        </div>
      )}
      
      <div 
        className="relative w-full min-h-screen bg-white"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 || swipeOffset === screenWidth ? 'transform 0.2s ease-out' : 'none',
          boxShadow: isSwiping ? '-4px 0 20px rgba(0,0,0,0.15)' : 'none',
        }}
      >
        {children}
      </div>
      
      {isSwiping && swipeOffset > 0 && (
        <div 
          className="absolute left-0 top-0 w-1 h-full bg-gradient-to-r from-black/10 to-transparent"
          style={{
            transform: `translateX(${swipeOffset}px)`,
          }}
        />
      )}
    </div>
  );
}
