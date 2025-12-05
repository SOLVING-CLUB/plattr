import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, 
  MapPin, 
  Navigation, 
  Search, 
  Clock,
  Loader2,
  ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { addressService } from "@/lib/supabase-service";
import { useToast } from "@/hooks/use-toast";
import FloatingNav from "@/pages/FloatingNav";

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  landmark: string | null;
  isDefault: boolean;
}

interface LocationData {
  label: string;
  addressLine: string;
  lat?: number;
  lng?: number;
  type: "detected" | "manual" | "saved";
  id?: string;
}

const LOCATION_STORAGE_KEY = "activeLocation";
const RECENT_LOCATIONS_KEY = "recentLocations";

// Popular areas in Bangalore for quick selection
const popularAreas = [
  { label: "Koramangala", addressLine: "Koramangala, Bengaluru, Karnataka" },
  { label: "Indiranagar", addressLine: "Indiranagar, Bengaluru, Karnataka" },
  { label: "HSR Layout", addressLine: "HSR Layout, Bengaluru, Karnataka" },
  { label: "Whitefield", addressLine: "Whitefield, Bengaluru, Karnataka" },
  { label: "Marathahalli", addressLine: "Marathahalli, Bengaluru, Karnataka" },
  { label: "JP Nagar", addressLine: "JP Nagar, Bengaluru, Karnataka" },
  { label: "Electronic City", addressLine: "Electronic City, Bengaluru, Karnataka" },
  { label: "BTM Layout", addressLine: "BTM Layout, Bengaluru, Karnataka" },
];

export default function LocationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [recentLocations, setRecentLocations] = useState<LocationData[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("home");

  // Load saved location and recents from localStorage
  useEffect(() => {
    const savedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (savedLocation) {
      try {
        setSelectedLocation(JSON.parse(savedLocation));
      } catch (e) {
        console.error("Error parsing saved location:", e);
      }
    }

    const savedRecents = localStorage.getItem(RECENT_LOCATIONS_KEY);
    if (savedRecents) {
      try {
        setRecentLocations(JSON.parse(savedRecents));
      } catch (e) {
        console.error("Error parsing recent locations:", e);
      }
    }
  }, []);

  // Fetch saved addresses
  const { data: savedAddresses = [], isLoading: isLoadingAddresses } = useQuery<SavedAddress[]>({
    queryKey: ["addresses"],
    queryFn: () => addressService.getAll(),
  });

  const handleTabChange = (tab: "home" | "menu" | "profile") => {
    setActiveTab(tab);
    if (tab === "home") {
      setLocation("/");
    } else if (tab === "menu") {
      setLocation("/menu");
    } else if (tab === "profile") {
      setLocation("/profile");
    }
  };

  const saveLocationAndNavigate = (location: LocationData) => {
    // Save to localStorage
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    
    // Add to recents (keep max 5, avoid duplicates)
    const newRecents = [
      location,
      ...recentLocations.filter(
        (r) => r.addressLine !== location.addressLine
      ),
    ].slice(0, 5);
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(newRecents));
    
    toast({
      title: "Location Updated",
      description: `Delivering to ${location.label}`,
      variant: "success",
    });
    
    // Navigate back
    setLocation("/");
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    setIsDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Try to reverse geocode using a free API
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          const locationData: LocationData = {
            label: data.address?.suburb || data.address?.neighbourhood || data.address?.city || "Current Location",
            addressLine: data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            lat: latitude,
            lng: longitude,
            type: "detected",
          };
          
          setSelectedLocation(locationData);
          saveLocationAndNavigate(locationData);
        } catch (error) {
          // Fallback if geocoding fails
          const locationData: LocationData = {
            label: "Current Location",
            addressLine: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
            lat: latitude,
            lng: longitude,
            type: "detected",
          };
          setSelectedLocation(locationData);
          saveLocationAndNavigate(locationData);
        }
        
        setIsDetecting(false);
      },
      (error) => {
        setIsDetecting(false);
        let message = "Unable to get your location.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Please enable location permissions in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out.";
        }
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSelectSavedAddress = (address: SavedAddress) => {
    const locationData: LocationData = {
      label: address.label,
      addressLine: address.landmark ? `${address.address}, ${address.landmark}` : address.address,
      type: "saved",
      id: address.id,
    };
    saveLocationAndNavigate(locationData);
  };

  const handleSelectPopularArea = (area: { label: string; addressLine: string }) => {
    const locationData: LocationData = {
      label: area.label,
      addressLine: area.addressLine,
      type: "manual",
    };
    saveLocationAndNavigate(locationData);
  };

  const handleSelectRecent = (location: LocationData) => {
    saveLocationAndNavigate(location);
  };

  // Filter popular areas based on search
  const filteredAreas = searchQuery
    ? popularAreas.filter(
        (area) =>
          area.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          area.addressLine.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : popularAreas;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-16 pb-4 shadow-sm">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-1 text-[#1A9952] mb-4"
          data-testid="button-back-home"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        <h1
          className="text-2xl font-bold text-[#1C1C1C] mb-1"
          style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
          data-testid="text-page-title"
        >
          Choose your location
        </h1>
        <p className="text-gray-500 text-sm">
          Select a delivery location to see available options
        </p>
      </div>

      {/* Current Location Button */}
      <div className="px-4 mt-4">
        <button
          onClick={handleUseCurrentLocation}
          disabled={isDetecting}
          className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 border border-gray-100 hover:border-[#1A9952] transition-colors disabled:opacity-70"
          data-testid="button-use-current-location"
        >
          <div className="w-12 h-12 bg-[#1A9952]/10 rounded-full flex items-center justify-center flex-shrink-0">
            {isDetecting ? (
              <Loader2 className="w-6 h-6 text-[#1A9952] animate-spin" />
            ) : (
              <Navigation className="w-6 h-6 text-[#1A9952]" />
            )}
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-[#1C1C1C]" style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}>
              {isDetecting ? "Detecting location..." : "Use current location"}
            </h3>
            <p className="text-gray-500 text-sm">Using GPS</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 mt-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for area, street name..."
            className="w-full pl-12 pr-4 py-4 bg-white border-gray-200 rounded-xl shadow-sm"
            style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
            data-testid="input-location-search"
          />
        </div>
      </div>

      {/* Recent Locations */}
      {recentLocations.length > 0 && !searchQuery && (
        <div className="px-4 mt-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent
          </h2>
          <div className="space-y-2">
            {recentLocations.slice(0, 3).map((location, index) => (
              <button
                key={index}
                onClick={() => handleSelectRecent(location)}
                className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 border border-gray-100 hover:border-[#1A9952] transition-colors text-left"
                data-testid={`button-recent-${index}`}
              >
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[#1C1C1C] truncate">{location.label}</h3>
                  <p className="text-gray-500 text-sm truncate">{location.addressLine}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Saved Addresses */}
      {savedAddresses.length > 0 && !searchQuery && (
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Saved Addresses
            </h2>
            <button
              onClick={() => setLocation("/saved-addresses")}
              className="text-[#1A9952] text-sm font-medium"
              data-testid="button-manage-addresses"
            >
              Manage
            </button>
          </div>
          <div className="space-y-2">
            {savedAddresses.slice(0, 3).map((address) => (
              <button
                key={address.id}
                onClick={() => handleSelectSavedAddress(address)}
                className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 border border-gray-100 hover:border-[#1A9952] transition-colors text-left"
                data-testid={`button-saved-${address.id}`}
              >
                <MapPin className="w-5 h-5 text-[#1A9952] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[#1C1C1C]">{address.label}</h3>
                    {address.isDefault && (
                      <span className="text-xs bg-[#1A9952] text-white px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm truncate">
                    {address.landmark ? `${address.address}, ${address.landmark}` : address.address}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Areas / Search Results */}
      <div className="px-4 mt-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          {searchQuery ? "Search Results" : "Popular Areas in Bangalore"}
        </h2>
        {filteredAreas.length > 0 ? (
          <div className="space-y-2">
            {filteredAreas.map((area, index) => (
              <button
                key={index}
                onClick={() => handleSelectPopularArea(area)}
                className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 border border-gray-100 hover:border-[#1A9952] transition-colors text-left"
                data-testid={`button-area-${index}`}
              >
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[#1C1C1C]">{area.label}</h3>
                  <p className="text-gray-500 text-sm truncate">{area.addressLine}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No areas found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Floating Nav */}
      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
