import { ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { LazyImage } from "@/components/ui/lazy-image";
import heroBanner from "@assets/Banner - 60 mins_1763877285748.png";
import heroVideo from "@assets/Untitled_design_(4)_1765414387896.mov";

interface HeroSectionProps {
  onExploreMenu?: () => void;
}

export default function HeroSection({ onExploreMenu }: HeroSectionProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const attemptPlay = async () => {
      try {
        await video.play();
      } catch (error) {
        console.log("Video autoplay failed, showing fallback image");
        setVideoFailed(true);
      }
    };

    attemptPlay();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !videoFailed) {
        video.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [videoFailed]);

  return (
    <section className="relative w-full" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Hero Banner - Video with image fallback */}
      <div className="relative w-full" style={{ backgroundColor: '#FFFFFF' }}>
        {!videoFailed ? (
          <video
            ref={videoRef}
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoFailed(true)}
            data-testid="video-hero-banner"
            className="w-full h-auto"
            style={{
              WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)'
            }}
          />
        ) : (
          <LazyImage 
            src={heroBanner}
            alt="60-minute delivery"
            containerClassName="w-full"
            className="w-full h-auto"
            data-testid="image-hero-banner"
            showSkeleton={true}
            style={{
              WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)'
            }}
          />
        )}
        
        {/* Explore Menu Button */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={onExploreMenu}
            data-testid="button-explore-menu"
            className="flex items-center gap-2 px-3 py-1.5 bg-[#06352A] text-white hover-elevate active-elevate-2"
            style={{
              fontFamily: "Sweet Sans Pro",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "10px",
            }}
          >
            Explore Menu
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>    
    </section>
  );
}