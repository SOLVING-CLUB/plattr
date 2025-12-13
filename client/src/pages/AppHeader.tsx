import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import headerBg from "@assets/Hero_1763854193361.png";

interface AppHeaderProps {
  onLocationClick?: () => void;
  onServiceAvailabilityChange?: (isUnavailable: boolean, locationLabel: string) => void;
}

const LOCATION_STORAGE_KEY = "activeLocation";

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
  onLocationClick,
  onServiceAvailabilityChange
}: AppHeaderProps) {
  const [, setLocation] = useLocation();
  const [locationLabel, setLocationLabel] = useState("Select Address");
  const [showServiceUnavailable, setShowServiceUnavailable] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);

  useEffect(() => {
    if (onServiceAvailabilityChange) {
      onServiceAvailabilityChange(showServiceUnavailable, locationLabel);
    }
  }, [showServiceUnavailable, locationLabel, onServiceAvailabilityChange]);

  // Check if the selected/saved address is in Bangalore
  const checkSavedLocationServiceAvailability = (savedData: any) => {
    // If saved location has coordinates, check them
    if (savedData.lat && savedData.lng) {
      const isInBangalore = isWithinBangalore(savedData.lat, savedData.lng);
      console.log('Saved location coordinates check:', { lat: savedData.lat, lng: savedData.lng, isInBangalore });
      setShowServiceUnavailable(!isInBangalore);
      return;
    }
    
    // If no coordinates, check the address text for Bangalore/Bengaluru
    const addressText = (savedData.addressLine || savedData.label || '').toLowerCase();
    const isInBangalore = addressText.includes('bangalore') || 
                          addressText.includes('bengaluru') ||
                          addressText.includes('karnataka') ||
                          addressText.includes('btm') ||
                          addressText.includes('koramangala') ||
                          addressText.includes('whitefield') ||
                          addressText.includes('indiranagar') ||
                          addressText.includes('jayanagar') ||
                          addressText.includes('hsr') ||
                          addressText.includes('electronic city') ||
                          addressText.includes('marathahalli');
    
    console.log('Saved location text check:', { address: savedData.addressLine, label: savedData.label, isInBangalore });
    setShowServiceUnavailable(!isInBangalore);
  };

  // Check CURRENT location on app load (always fetch live GPS location first)
  useEffect(() => {
    const checkLocationServiceAvailability = async () => {
      setIsCheckingLocation(true);

      // Always try to get CURRENT location first (not saved address)
      try {
        // First try browser geolocation for accurate current location
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 8000,
              maximumAge: 0
            });
          });

          const { latitude, longitude } = position.coords;
          const isInBangalore = isWithinBangalore(latitude, longitude);
          
          console.log('Current location detected:', { latitude, longitude, isInBangalore });
          setShowServiceUnavailable(!isInBangalore);
          setIsCheckingLocation(false);
          return;
        }
      } catch (geoError) {
        console.log('Browser geolocation failed, trying IP-based fallback...', geoError);
      }

      // Fallback: IP-based geolocation
      try {
        const ipResponse = await fetch('https://ipapi.co/json/');
        const ipData = await ipResponse.json();
        
        console.log('IP location data:', ipData);
        
        if (ipData && !ipData.error && ipData.latitude && ipData.longitude) {
          const isInBangalore = isWithinBangalore(ipData.latitude, ipData.longitude);
          console.log('IP-based location check:', { lat: ipData.latitude, lng: ipData.longitude, isInBangalore });
          setShowServiceUnavailable(!isInBangalore);
        } else if (ipData && !ipData.error && ipData.city) {
          // Check if city is Bangalore/Bengaluru
          const cityLower = ipData.city.toLowerCase();
          const isInBangalore = cityLower.includes('bangalore') || cityLower.includes('bengaluru');
          console.log('IP city check:', { city: ipData.city, isInBangalore });
          setShowServiceUnavailable(!isInBangalore);
        } else {
          // Can't determine location - don't show banner
          console.log('Could not determine location from IP');
        }
      } catch (ipError) {
        console.error('IP geolocation failed:', ipError);
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
        // Re-check service availability for the new location
        checkSavedLocationServiceAvailability(customEvent.detail);
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
    <>
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