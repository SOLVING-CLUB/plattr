import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { ChevronLeft, Search, MapPin, X, Crosshair } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const LOCATION_STORAGE_KEY = "activeLocation";
const RECENT_LOCATIONS_KEY = "recentLocations";

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64," + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="36" height="48">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#1A9952"/>
      <circle cx="12" cy="12" r="5" fill="white"/>
    </svg>
  `),
  iconSize: [36, 48],
  iconAnchor: [18, 48],
  popupAnchor: [0, -48],
});

// Component to handle map events and update position on pan/zoom
function MapEventHandler({ 
  onPositionChange,
  initialCenter
}: { 
  onPositionChange: (pos: [number, number]) => void;
  initialCenter: [number, number];
}) {
  const map = useMapEvents({
    moveend() {
      const center = map.getCenter();
      onPositionChange([center.lat, center.lng]);
    },
  });

  // Set initial view
  useEffect(() => {
    map.setView(initialCenter, 17);
  }, []);
  
  return null;
}

// Component to recenter map when needed
function MapRecenter({ center, shouldRecenter, onRecenterComplete }: { 
  center: [number, number]; 
  shouldRecenter: boolean;
  onRecenterComplete: () => void;
}) {
  const map = useMapEvents({});
  
  useEffect(() => {
    if (shouldRecenter) {
      map.setView(center, 17);
      onRecenterComplete();
    }
  }, [shouldRecenter, center, map, onRecenterComplete]);
  
  return null;
}

interface LocationData {
  label: string;
  addressLine: string;
  lat?: number;
  lng?: number;
  type: "detected" | "manual" | "saved";
}

export default function MapConfirmationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [position, setPosition] = useState<[number, number]>([12.9716, 77.5946]); // Default Bangalore
  const [initialCenter, setInitialCenter] = useState<[number, number]>([12.9716, 77.5946]);
  const [address, setAddress] = useState("");
  const [areaName, setAreaName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [shouldRecenter, setShouldRecenter] = useState(false);

  // Get current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
          setInitialCenter(newPos);
          reverseGeocode(newPos[0], newPos[1]);
          setIsLoading(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLoading(false);
          toast({
            title: "Location Error",
            description: "Could not get your location. Using default location.",
            variant: "destructive",
          });
          reverseGeocode(position[0], position[1]);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLoading(false);
      reverseGeocode(position[0], position[1]);
    }
  }, []);

  // Reverse geocode when position changes
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      // Broader fallback chain for area name to ensure it always updates
      const addr = data.address || {};
      const area = addr.suburb || 
                   addr.neighbourhood || 
                   addr.village ||
                   addr.hamlet ||
                   addr.town ||
                   addr.city_district ||
                   addr.city ||
                   addr.municipality ||
                   addr.county ||
                   addr.road ||
                   addr.state ||
                   // Fallback: use first part of display_name
                   (data.display_name ? data.display_name.split(',')[0].trim() : null) ||
                   "Selected Location";
      
      setAreaName(area);
      setAddress(data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } catch (error) {
      console.error("Geocoding error:", error);
      setAreaName("Selected Location");
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
    setIsGeocoding(false);
  };

  const handlePositionChange = (newPos: [number, number]) => {
    setPosition(newPos);
    reverseGeocode(newPos[0], newPos[1]);
  };

  const handleRecenterToCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
          setShouldRecenter(true);
          reverseGeocode(newPos[0], newPos[1]);
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Could not get your current location.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleConfirm = () => {
    const locationData: LocationData = {
      label: areaName,
      addressLine: address,
      lat: position[0],
      lng: position[1],
      type: "detected",
    };

    // Save to localStorage
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));

    // Add to recents
    const savedRecents = localStorage.getItem(RECENT_LOCATIONS_KEY);
    let recents: LocationData[] = [];
    if (savedRecents) {
      try {
        recents = JSON.parse(savedRecents);
      } catch (e) {
        console.error("Error parsing recents:", e);
      }
    }
    const newRecents = [locationData, ...recents.filter(r => r.addressLine !== address)].slice(0, 5);
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(newRecents));

    toast({
      title: "Location Updated",
      description: `Delivering to ${areaName}`,
      variant: "success",
    });

    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#1A9952] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600" style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}>
            Getting your location...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col">
      {/* Header with Search */}
      <div className="absolute top-0 left-0 right-0 z-[1000] pt-12 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/location")}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md"
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6 text-[#1C1C1C]" />
          </button>
          <div className="flex-1 relative">
            <Input
              placeholder="Search an area or address"
              className="w-full pl-4 pr-12 py-3 bg-white border-0 rounded-lg shadow-md text-[15px]"
              style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
              data-testid="input-search-map"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="absolute inset-0 bottom-[180px]">
        <MapContainer
          center={initialCenter}
          zoom={17}
          style={{ height: "100%", width: "100%", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEventHandler 
            onPositionChange={handlePositionChange} 
            initialCenter={initialCenter}
          />
          <MapRecenter 
            center={position} 
            shouldRecenter={shouldRecenter}
            onRecenterComplete={() => setShouldRecenter(false)}
          />
        </MapContainer>
        
        {/* Fixed Center Pin */}
        <div 
          className="absolute left-1/2 top-1/2 z-[500] pointer-events-none"
          style={{ transform: 'translate(-50%, -100%)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="36" height="48">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#1A9952"/>
            <circle cx="12" cy="12" r="5" fill="white"/>
          </svg>
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-32 z-[1000]">
            <div className="bg-[#333] text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
              <span className="text-sm" style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}>
                Move the pin to change location
              </span>
              <button onClick={() => setShowTooltip(false)} className="ml-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Current Location Button */}
        <button
          onClick={handleRecenterToCurrentLocation}
          className="absolute bottom-48 right-4 z-[1000] bg-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center border border-gray-200"
          data-testid="button-recenter"
        >
          <Crosshair className="w-5 h-5 text-[#1A9952]" />
        </button>

      </div>

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl px-5 py-6 pb-8 z-[1000]">
        <p 
          className="text-gray-500 text-sm mb-3"
          style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
        >
          Place the pin at exact delivery location
        </p>

        <div className="flex items-start gap-3 mb-5">
          <MapPin className="w-6 h-6 text-[#1A9952] mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 
              className="font-bold text-[#1C1C1C] text-lg"
              style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
            >
              {isGeocoding ? "Finding address..." : areaName}
            </h3>
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">
              {isGeocoding ? "Please wait..." : address}
            </p>
          </div>
        </div>

        <Button
          onClick={handleConfirm}
          disabled={isGeocoding}
          className="w-full bg-[#1A9952] hover:bg-[#158544] text-white py-6 rounded-xl font-semibold text-base disabled:opacity-60"
          style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
          data-testid="button-confirm-location"
        >
          Confirm & proceed
        </Button>
      </div>
    </div>
  );
}
