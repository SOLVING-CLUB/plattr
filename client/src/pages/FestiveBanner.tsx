import { ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import sankranthiVideo from "@assets/stock_images/IMG_9929.MP4";

interface FestiveBannerProps {
  onAction?: () => void;
}

export default function FestiveBanner({ onAction }: FestiveBannerProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    if (onAction) {
      onAction();
    } else {
      // Set a flag in localStorage to filter by Sankranthi tag
      localStorage.setItem('festiveFilter', 'Sankranthi');
      // Redirect to bulk-meals page
      setLocation("/bulk-meals");
    }
  };

  return (
    <section className="w-full overflow-hidden">
      <div
        className="relative w-full cursor-pointer overflow-hidden"
        style={{ aspectRatio: "430 / 215.89" }}
        onClick={handleClick}
      >
        <video
          src={sankranthiVideo}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <button
            className="group flex items-center gap-1.5 px-4 py-2 text-[#F5E9DB] shadow-xl hover-elevate active-elevate-2 transition-all duration-300"
            style={{
              backgroundColor: "#06352A",
              fontFamily: "Sweet Sans Pro",
              fontSize: "12px",
              fontWeight: 700,
              borderRadius: "16px",
            }}
          >
            Sankranthi Special
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
}
