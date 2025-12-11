import { ChevronRight } from "lucide-react";
import heroVideo from "@assets/Untitled_design_(4)_1765346896540.mov";

interface HeroSectionProps {
  onExploreMenu?: () => void;
}

export default function HeroSection({ onExploreMenu }: HeroSectionProps) {
  return (
    <section className="relative w-full bg-white">
      {/* Hero Banner - Video with fade at bottom */}
      <div className="relative w-full">
        {/* Background Video - Full video with fade effect */}
        <video
          src={heroVideo}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto"
          data-testid="video-hero-banner"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)',
            maskImage: 'linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)'
          }}
        />
        
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