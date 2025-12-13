import { useState, useEffect } from "react";
import { MapPin, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import headerBg from "@assets/Hero_1763854193361.png";

interface AppHeaderProps {
  onLocationClick?: () => void;
}

const LOCATION_STORAGE_KEY = "activeLocation";
const SERVICE_CHECK_KEY = "serviceAvailabilityChecked";

// Bangalore service area bounds
const BANGALORE_BOUNDS = {
  minLat: 12.7,
  maxLat: 13.2,
  minLng: 77.35,
  maxLng: 77.85
};

const isWithinBangalore = (lat: number, lng: number) => {
  return lat >= BANGALORE_BOUNDS.minLat && 
         lat <= BANGALORE_BOUNDS.maxLat && 
         lng >= BANGALORE_BOUNDS.minLng && 
         lng <= BANGALORE_BOUNDS.maxLng;
};

export default function AppHeader({ 
  onLocationClick
}: AppHeaderProps) {
  const [, setLocation] = useLocation();
  const [locationLabel, setLocationLabel] = useState("Select Address");
  const [showServiceUnavailable, setShowServiceUnavailable] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);

  // Check location on app load
  useEffect(() => {
    const checkLocationServiceAvailability = async () => {
      // Only check once per session
      const alreadyChecked = sessionStorage.getItem(SERVICE_CHECK_KEY);
      if (alreadyChecked) {
        const wasOutside = alreadyChecked === "outside";
        setShowServiceUnavailable(wasOutside);
        return;
      }

      setIsCheckingLocation(true);

      try {
        // First try browser geolocation
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });

          const { latitude, longitude } = position.coords;
          const isInBangalore = isWithinBangalore(latitude, longitude);
          
          sessionStorage.setItem(SERVICE_CHECK_KEY, isInBangalore ? "inside" : "outside");
          setShowServiceUnavailable(!isInBangalore);
          setIsCheckingLocation(false);
          return;
        }
      } catch (geoError) {
        console.log('Browser geolocation failed, trying IP-based fallback...');
      }

      // Fallback: IP-based geolocation
      try {
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        
        if (ipData && !ipData.error && ipData.latitude && ipData.longitude) {
          const isInBangalore = isWithinBangalore(ipData.latitude, ipData.longitude);
          sessionStorage.setItem(SERVICE_CHECK_KEY, isInBangalore ? "inside" : "outside");
          setShowServiceUnavailable(!isInBangalore);
        } else if (ipData && !ipData.error && ipData.city) {
          // Check if city is Bangalore/Bengaluru
          const cityLower = ipData.city.toLowerCase();
          const isInBangalore = cityLower.includes('bangalore') || cityLower.includes('bengaluru');
          sessionStorage.setItem(SERVICE_CHECK_KEY, isInBangalore ? "inside" : "outside");
          setShowServiceUnavailable(!isInBangalore);
        }
      } catch (ipError) {
        console.error('IP geolocation failed:', ipError);
        // Don't show error banner if we can't detect location
        sessionStorage.setItem(SERVICE_CHECK_KEY, "unknown");
      }

      setIsCheckingLocation(false);
    };

    checkLocationServiceAvailability();
  }, []);

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
  const handleDismissBanner = () => {
    setShowServiceUnavailable(false);
    sessionStorage.setItem(SERVICE_CHECK_KEY, "dismissed");
  };

  return (
    <>
      {showServiceUnavailable && (
        <div 
          className="bg-[#FF5722] text-white px-4 py-3 flex items-center justify-between"
          style={{ 
            fontFamily: "Sweet Sans Pro",
            marginTop: 'env(safe-area-inset-top)'
          }}
          data-testid="banner-service-unavailable"
        >
          <div className="flex items-center gap-2 flex-1">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Service Not Available</p>
              <p className="text-xs opacity-90">We currently serve only in Bangalore. Please select a Bangalore address to order.</p>
            </div>
          </div>
          <button
            onClick={handleDismissBanner}
            className="p-1 hover:bg-white/20 rounded-full transition-colors ml-2"
            data-testid="button-dismiss-service-banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
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
            className="flex items-center justify-center px-3 py-2 rounded-[10px] shadow-md hover:opacity-90 transition-opacity self-end"
            style={{
              background: "linear-gradient(135deg, #06352A 0%, #1A9952 100%)",
              fontFamily: "Sweet Sans Pro",
              fontSize: "12px",
              fontWeight: 500,
              color: "#F5E9DB",
              height: "40px",
            }}
          >
            AI Menu Planner
          </button>
        </div>
      </header>
    </>
  );
}