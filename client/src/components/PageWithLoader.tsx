import { useState, useEffect, useRef, ReactNode } from "react";
import { PageLoader } from "@/components/PageLoader";

interface PageWithLoaderProps {
  children: ReactNode;
  minLoadTime?: number;
}

export function PageWithLoader({ children, minLoadTime = 500 }: PageWithLoaderProps) {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minLoadTime);

    return () => clearTimeout(timer);
  }, [minLoadTime]);

  useEffect(() => {
    const checkAllImagesLoaded = () => {
      if (!containerRef.current) return false;
      
      const images = containerRef.current.querySelectorAll('img');
      if (images.length === 0) return true;
      
      let loadedCount = 0;
      images.forEach((img) => {
        if (img.complete && img.naturalHeight !== 0) {
          loadedCount++;
        }
      });
      
      return loadedCount >= Math.min(images.length, 5);
    };

    const startChecking = () => {
      if (checkAllImagesLoaded()) {
        setImagesLoaded(true);
        return;
      }

      checkIntervalRef.current = setInterval(() => {
        if (checkAllImagesLoaded()) {
          setImagesLoaded(true);
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
          }
        }
      }, 100);
    };

    const timeoutId = setTimeout(startChecking, 50);

    const maxWaitTimeout = setTimeout(() => {
      setImagesLoaded(true);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    }, 4000);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(maxWaitTimeout);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  const showLoader = !imagesLoaded || !minTimeElapsed;

  return (
    <>
      {showLoader && <PageLoader />}
      <div 
        ref={containerRef} 
        style={{ 
          visibility: showLoader ? 'hidden' : 'visible',
          opacity: showLoader ? 0 : 1,
          transition: 'opacity 0.2s ease-in-out',
          padding: 0,
          margin: 0,
          paddingTop: 0,
          marginTop: 0,
        }}
      >
        {children}
      </div>
    </>
  );
}
