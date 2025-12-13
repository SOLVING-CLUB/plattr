import { ChevronRight } from "lucide-react";
import heroGif from "@assets/Untitled_design_(1)_1765646935669.gif";

interface HeroSectionProps {
  onExploreMenu?: () => void;
}

export default function HeroSection({ onExploreMenu }: HeroSectionProps) {
  return (
    <section className="relative w-full bg-white">
      {/* Hero Banner - GIF starting from top */}
      <div className="relative w-full">
        <img 
          src={heroGif}
          alt="60-minute delivery"
          className="w-full h-auto"
          data-testid="image-hero-banner"
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