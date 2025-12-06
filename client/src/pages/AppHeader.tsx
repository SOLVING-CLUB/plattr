import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
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
    const readLocationFromStorage = () => {
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
    };

    readLocationFromStorage();

    // Listen for storage changes (when location is updated from LocationPage in another tab)
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

    // Listen for custom locationchange event (same-tab SPA navigation)
    const handleLocationChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.label) {
        setLocationLabel(customEvent.detail.label);
      } else {
        readLocationFromStorage();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("locationchange", handleLocationChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("locationchange", handleLocationChange);
    };
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
          className="flex items-center justify-center px-3 py-1.5 rounded-[10px] shadow-md hover:opacity-90 transition-opacity"
          style={{
            background: "linear-gradient(135deg, #06352A 0%, #1A9952 100%)",
            fontFamily: "Sweet Sans Pro",
            fontSize: "12px",
            fontWeight: 500,
            color: "#F5E9DB",
          }}
        >
          AI Menu Planner
        </button>
      </div>
    </header>
  );
}