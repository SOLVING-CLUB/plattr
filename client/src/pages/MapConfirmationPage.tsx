import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import { ChevronLeft, Search, MapPin, X, Crosshair, Home, Briefcase, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { addressService } from "@/lib/supabase-service";
import { useQueryClient } from "@tanstack/react-query";
import { supabaseAuth } from "@/lib/supabase-auth";

const LOCATION_STORAGE_KEY = "activeLocation";
const RECENT_LOCATIONS_KEY = "recentLocations";

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

  useEffect(() => {
    map.setView(initialCenter, 17);
  }, []);

  return null;
}

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

type LabelOption = "Home" | "Work" | "Other";

export default function MapConfirmationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [position, setPosition] = useState<[number, number]>([12.9716, 77.5946]);
  const [initialCenter, setInitialCenter] = useState<[number, number]>([12.9716, 77.5946]);
  const [address, setAddress] = useState("");
  const [areaName, setAreaName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [shouldRecenter, setShouldRecenter] = useState(false);

  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customLabel, setCustomLabel] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    place_id: string;
    display_name: string;
    lat: string;
    lon: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

          let errorMessage = "Could not get your location. Using default location.";
          if (error.code === 1) {
            errorMessage = "Location permission denied. Please enable location access in your browser settings.";
          } else if (error.code === 2) {
            errorMessage = "Location unavailable. Please check your device settings.";
          } else if (error.code === 3) {
            errorMessage = "Location request timed out. Please try again.";
          }

          toast({
            title: "Location Error",
            description: errorMessage,
            variant: "destructive",
          });
          reverseGeocode(position[0], position[1]);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsLoading(false);
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      reverseGeocode(position[0], position[1]);
    }
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();

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

  // Search for locations using Nominatim API
  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowSearchResults(data.length > 0);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocations(value);
      }, 500);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle selecting a search result
  const handleSelectSearchResult = (result: { lat: string; lon: string; display_name: string }) => {
    const newPos: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)];
    setPosition(newPos);
    setShouldRecenter(true);
    reverseGeocode(newPos[0], newPos[1]);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setShowTooltip(false);
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
          console.error("Geolocation error:", error);

          let errorMessage = "Could not get your current location.";
          if (error.code === 1) {
            errorMessage = "Location permission denied. Please enable location access in your browser settings.";
          } else if (error.code === 2) {
            errorMessage = "Location unavailable. Please check your device settings.";
          } else if (error.code === 3) {
            errorMessage = "Location request timed out. Please try again.";
          }

          toast({
            title: "Location Error",
            description: errorMessage,
            variant: "destructive",
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmClick = () => {
    setShowLabelModal(true);
  };

  const handleSaveWithLabel = async (label: string) => {
    setIsSaving(true);

    try {
      // Check if user is authenticated - refresh session to get latest state
      const { data: { session }, error: sessionError } = await supabaseAuth.auth.refreshSession();

      // If refresh fails, try getting current session
      if (sessionError || !session) {
        const { data: { session: currentSession } } = await supabaseAuth.auth.getSession();
        const { data: { user } } = await supabaseAuth.auth.getUser();

        console.log('Auth check - Session:', !!currentSession, 'User:', !!user, 'User ID:', user?.id);

        if (!currentSession || !user) {
          setIsSaving(false);
          setShowLabelModal(false);
          toast({
            title: "Login Required",
            description: "Please log in to save addresses",
            variant: "destructive",
          });
          // Redirect to auth page
          setLocation("/auth");
          return;
        }
      } else {
        console.log('Auth check - Refreshed session:', !!session, 'User ID:', session.user?.id);
        // Small delay to ensure Supabase client updates its internal state
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await addressService.create({
        label: label,
        address: address,
        landmark: areaName,
        isDefault: false,
      });

      const locationData: LocationData = {
        label: areaName,
        addressLine: address,
        lat: position[0],
        lng: position[1],
        type: "saved",
      };

      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));

      // Dispatch custom event for same-tab location updates
      window.dispatchEvent(new CustomEvent('locationchange', { detail: locationData }));

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

      // Invalidate addresses cache so LocationPage refreshes
      queryClient.invalidateQueries({ queryKey: ["addresses"] });

      toast({
        title: "Address Saved",
        description: `"${label}" has been added to your address book`,
        variant: "success",
      });

      setShowLabelModal(false);
      setLocation("/location");
    } catch (error: any) {
      console.error("Save address error:", error);
      toast({
        title: "Error",
        description: error.message || "Could not save address. Please try again.",
        variant: "destructive",
      });
    }

    setIsSaving(false);
  };

  const handleLabelSelect = (label: LabelOption) => {
    if (label === "Other") {
      setShowCustomInput(true);
    } else {
      handleSaveWithLabel(label);
    }
  };

  const handleCustomLabelSubmit = () => {
    if (customLabel.trim()) {
      handleSaveWithLabel(customLabel.trim());
    }
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
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
              placeholder="Search an area or address"
              className="w-full pl-4 pr-12 py-3 bg-white border-0 rounded-lg shadow-md text-[15px]"
              style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
              data-testid="input-search-map"
            />
            {isSearching ? (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-[#1A9952] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            )}

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.place_id}
                    onClick={() => handleSelectSearchResult(result)}
                    className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                    data-testid={`search-result-${result.place_id}`}
                  >
                    <MapPin className="w-5 h-5 text-[#1A9952] mt-0.5 flex-shrink-0" />
                    <span
                      className="text-sm text-[#1C1C1C] line-clamp-2"
                      style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
                    >
                      {result.display_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop to close search results */}
      {showSearchResults && (
        <div
          className="absolute inset-0 z-[999]"
          onClick={() => setShowSearchResults(false)}
        />
      )}

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
            <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#1A9952" />
            <circle cx="12" cy="12" r="5" fill="white" />
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
          onClick={handleConfirmClick}
          disabled={isGeocoding}
          className="w-full bg-[#1A9952] hover:bg-[#158544] text-white py-6 rounded-xl font-semibold text-base disabled:opacity-60"
          style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
          data-testid="button-confirm-location"
        >
          Confirm & proceed
        </Button>
      </div>

      {/* Label Selection Modal */}
      {showLabelModal && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!isSaving) {
                setShowLabelModal(false);
                setShowCustomInput(false);
                setCustomLabel("");
              }
            }}
          />

          {/* Modal Content */}
          <div className="relative bg-white w-full rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-xl font-bold text-[#1C1C1C]"
                style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
              >
                Save address as
              </h2>
              <button
                onClick={() => {
                  if (!isSaving) {
                    setShowLabelModal(false);
                    setShowCustomInput(false);
                    setCustomLabel("");
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
                disabled={isSaving}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Address Preview */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="font-semibold text-[#1C1C1C]" style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}>
                {areaName}
              </p>
              <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                {address}
              </p>
            </div>

            {/* Label Options */}
            {!showCustomInput ? (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  onClick={() => handleLabelSelect("Home")}
                  disabled={isSaving}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all border-gray-200 hover:border-gray-300 ${isSaving ? "opacity-50" : ""}`}
                  data-testid="button-label-home"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100">
                    <Home className="w-6 h-6 text-gray-600" />
                  </div>
                  <span
                    className="font-medium text-sm text-gray-700"
                    style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
                  >
                    Home
                  </span>
                </button>

                <button
                  onClick={() => handleLabelSelect("Work")}
                  disabled={isSaving}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all border-gray-200 hover:border-gray-300 ${isSaving ? "opacity-50" : ""}`}
                  data-testid="button-label-work"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100">
                    <Briefcase className="w-6 h-6 text-gray-600" />
                  </div>
                  <span
                    className="font-medium text-sm text-gray-700"
                    style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
                  >
                    Work
                  </span>
                </button>

                <button
                  onClick={() => handleLabelSelect("Other")}
                  disabled={isSaving}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all border-gray-200 hover:border-gray-300 ${isSaving ? "opacity-50" : ""}`}
                  data-testid="button-label-other"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100">
                    <MoreHorizontal className="w-6 h-6 text-gray-600" />
                  </div>
                  <span
                    className="font-medium text-sm text-gray-700"
                    style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
                  >
                    Other
                  </span>
                </button>
              </div>
            ) : (
              /* Custom Label Input */
              <div className="mb-6">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
                >
                  Enter a custom name
                </label>
                <Input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g., Mom's House, Gym, Office"
                  className="w-full py-3 px-4 border-2 border-gray-200 rounded-xl focus:border-[#1A9952]"
                  style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
                  autoFocus
                  disabled={isSaving}
                  data-testid="input-custom-label"
                />
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={() => setShowCustomInput(false)}
                    variant="outline"
                    className="flex-1 py-3 rounded-xl"
                    disabled={isSaving}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleCustomLabelSubmit}
                    disabled={!customLabel.trim() || isSaving}
                    className="flex-1 bg-[#1A9952] hover:bg-[#158544] text-white py-3 rounded-xl"
                    data-testid="button-save-custom-label"
                  >
                    {isSaving ? "Saving..." : "Save Address"}
                  </Button>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isSaving && !showCustomInput && (
              <div className="flex items-center justify-center gap-3 py-4">
                <div className="w-5 h-5 border-2 border-[#1A9952] border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-600" style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}>
                  Saving address...
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
