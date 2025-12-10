import { ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import heroBanner from "@assets/Banner - 60 mins_1763877285748.png";
import heroVideo from "@assets/hero_video.mp4";

interface HeroSectionProps {
  onExploreMenu?: () => void;
}

export default function HeroSection({ onExploreMenu }: HeroSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  return (
    <section className="relative w-full bg-white">
      {/* Hero Banner - Video with image fallback */}
      <div className="relative w-full overflow-hidden">
        {/* Poster/Fallback Image - Shows while video loads or on error */}
        {(!videoLoaded || videoError) && (
          <img 
            src={heroBanner}
            alt="60-minute delivery"
            className="w-full h-auto"
            data-testid="image-hero-banner"
            style={{
              WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)'
            }}
          />
        )}
        
        {/* Hero Video - MP4 with autoplay, loop, muted */}
        {!videoError && (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            poster={heroBanner}
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
            className={`w-full h-auto ${videoLoaded ? 'block' : 'hidden'}`}
            data-testid="video-hero"
            style={{
              WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)'
            }}
          >
            <source src={heroVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
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