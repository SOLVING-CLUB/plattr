import { ChevronRight } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import heroBanner from "@assets/Banner - 60 mins_1763877285748.png";
import heroVideo from "@assets/Untitled_design_(4)_1765414387896.mov";
import { useState, useRef, useEffect } from "react";

interface SixtyMinSectionProps {
  onExplore?: () => void;
}

export default function SixtyMinSection({ onExplore }: SixtyMinSectionProps) {
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
    <section className="w-full overflow-hidden">
      <div
        className="relative w-full cursor-pointer overflow-hidden"
        style={{ aspectRatio: "430 / 215.89" }}
        onClick={onExplore}
      >
        {!videoFailed ? (
          <video
            ref={videoRef}
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <LazyImage 
            src={heroBanner}
            alt="60-minute delivery"
            containerClassName="w-full h-full"
            className="absolute inset-0 w-full h-full object-cover"
            showSkeleton={true}
          />
        )}
        
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
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
            60-minute Delivery
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
}
