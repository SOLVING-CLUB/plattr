import { useState, useEffect } from "react";
import { MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import headerBg from "@assets/Hero_1763854193361.png";

interface AppHeaderProps {
  onLocationClick?: () => void;
}

const LOCATION_STORAGE_KEY = "activeLocation";

export default function AppHeader({ 
  onLocationClick
}: AppHeaderProps) {
  const [, setLocation] = useLocation();
  const [locationLabel, setLocationLabel] = useState("Select Address");

  useEffect(() => {
    const savedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        setLocationLabel(parsed.label || "Select Address");
      } catch (e) {
        console.error("Error parsing saved location:", e);
        setLocationLabel("Select Address");
      }
    } else {
      setLocationLabel("Select Address");
    }

    // Listen for storage changes (when location is updated from LocationPage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCATION_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setLocationLabel(parsed.label || "Select Address");
        } catch (error) {
          console.error("Error parsing location from storage event:", error);
        }
      } else if (e.key === LOCATION_STORAGE_KEY && !e.newValue) {
        setLocationLabel("Select Address");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  return (
    <header 
      className="h-40"
      style={{
        backgroundImage: `url(${headerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
      }}
    >
      <div className="h-full px-4 flex items-end justify-between pb-4">
        <Button 
          variant="ghost" 
          className="gap-2 font-medium text-foreground hover:bg-black/10"
          onClick={onLocationClick}
          data-testid="button-location"
        >
          <MapPin className="w-5 h-5" />
          <span
            className="ml-[0px] mr-[0px] pl-[0px] pr-[0px] text-left pt-[0px] pb-[0px] font-semibold text-[18px]"
            style={{ fontFamily: "Sweet Sans Pro" }}>{locationLabel}</span>
        </Button>

        <button
          onClick={() => setLocation("/concierge")}
          data-testid="button-smart-menu-concierge"
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-black/10 transition-colors"
          style={{
            background: "linear-gradient(135deg, #FFD700 0%, #FFFFFF 100%)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <Sparkles className="w-5 h-5 text-[#06352A]" />
        </button>
      </div>
    </header>
  );
}