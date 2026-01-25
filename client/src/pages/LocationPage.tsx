import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { 
  ChevronLeft, 
  MapPin, 
  Navigation, 
  Search, 
  Plus,
  ChevronDown,
  MoreVertical,
  Edit2,
  Trash2,
  Star
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addressService } from "@/lib/supabase-service";
import { useToast } from "@/hooks/use-toast";
import FloatingNav from "@/pages/FloatingNav";
import { validateBangaloreAddress, BANGALORE_VALIDATION_ERROR } from "@/lib/addressValidation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export default function LocationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [recentLocations, setRecentLocations] = useState<LocationData[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("home");
  const [showAllAddresses, setShowAllAddresses] = useState(false);

  // Load recents from localStorage
  useEffect(() => {
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

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => addressService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast({
        title: "Address Deleted",
        description: "The address has been removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not delete address",
        variant: "destructive",
      });
    },
  });

  // Set default address mutation
  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => addressService.update(id, { isDefault: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast({
        title: "Default Address Set",
        description: "This address is now your default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not set default address",
        variant: "destructive",
      });
    },
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
    // Validate Bangalore address
    if (!validateBangaloreAddress(location.addressLine)) {
      toast({
        title: BANGALORE_VALIDATION_ERROR.title,
        description: BANGALORE_VALIDATION_ERROR.description,
        variant: "destructive",
      });
      return;
    }

    // Save to localStorage
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    
    // Dispatch custom event for same-tab location updates
    window.dispatchEvent(new CustomEvent('locationchange', { detail: location }));
    
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

  const handleUseCurrentLocation = () => {
    // Navigate to map confirmation page
    setLocation("/location/map");
  };


  const handleSelectSavedAddress = (address: SavedAddress) => {
    const locationData: LocationData = {
      label: address.label,
      addressLine: address.landmark ? `${address.address}, ${address.landmark}` : address.address,
      type: "saved",
      id: address.id,
      lat: address.latitude || undefined,
      lng: address.longitude || undefined,
    };
    saveLocationAndNavigate(locationData);
  };

  const handleSelectRecent = (location: LocationData) => {
    saveLocationAndNavigate(location);
  };

  const handleAddNewAddress = () => {
    setLocation("/location/map");
  };

  // Filter addresses based on search
  const filteredAddresses = searchQuery
    ? savedAddresses.filter(
        (addr) =>
          addr.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          addr.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : savedAddresses;

  const displayedAddresses = showAllAddresses ? filteredAddresses : filteredAddresses.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-16 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setLocation("/")}
            className="p-1"
            data-testid="button-back-home"
          >
            <ChevronLeft className="w-6 h-6 text-[#1C1C1C]" />
          </button>
          <h1
            className="text-lg font-semibold text-[#1C1C1C]"
            style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
            data-testid="text-page-title"
          >
            Select your location
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search an area or address"
            className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-lg text-[15px]"
            style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
            data-testid="input-location-search"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-white px-4 py-4 mt-2">
        <div className="flex gap-3">
          {/* Use Current Location */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={isDetecting}
            className="flex-1 flex flex-col items-start p-3 border border-gray-200 rounded-lg hover:border-[#1A9952] transition-colors disabled:opacity-60"
            data-testid="button-use-current-location"
          >
            <div className="w-8 h-8 rounded-full bg-[#FFF3E0] flex items-center justify-center mb-2">
              <Navigation className="w-4 h-4 text-[#FF5722]" />
            </div>
            <span 
              className="text-[13px] font-medium text-[#1C1C1C] leading-tight"
              style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
            >
              {isDetecting ? "Detecting..." : "Use Current Location"}
            </span>
          </button>

          {/* Add New Address */}
          <button
            onClick={handleAddNewAddress}
            className="flex-1 flex flex-col items-start p-3 border border-gray-200 rounded-lg hover:border-[#1A9952] transition-colors"
            data-testid="button-add-new-address"
          >
            <div className="w-8 h-8 rounded-full bg-[#FFF3E0] flex items-center justify-center mb-2">
              <Plus className="w-4 h-4 text-[#FF5722]" />
            </div>
            <span 
              className="text-[13px] font-medium text-[#1C1C1C] leading-tight"
              style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
            >
              Add New Address
            </span>
          </button>
        </div>
      </div>

      {/* Saved Addresses */}
      <div className="bg-white px-4 py-4 mt-2">
        <h2 
          className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4"
          style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
        >
          Saved Addresses
        </h2>

        {isLoadingAddresses ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAddresses.length === 0 ? (
          <div className="py-6 text-center">
            <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No saved addresses yet</p>
            <button
              onClick={handleAddNewAddress}
              className="mt-3 text-[#1A9952] font-medium text-sm"
            >
              Add your first address
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {displayedAddresses.map((address) => (
                <div
                  key={address.id}
                  className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0"
                >
                  <button
                    onClick={() => handleSelectSavedAddress(address)}
                    className="flex-1 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors rounded-lg -ml-2 -my-2 p-2"
                    data-testid={`button-saved-${address.id}`}
                  >
                    <div className="flex flex-col items-center mt-1">
                      <Navigation className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 
                          className="font-semibold text-[#1C1C1C] text-[15px]"
                          style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
                        >
                          {address.label}
                        </h3>
                        {address.isDefault && (
                          <span className="text-[10px] bg-[#1A9952] text-white px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-[13px] mt-0.5 line-clamp-2">
                        {address.landmark ? `${address.address}, ${address.landmark}` : address.address}
                      </p>
                    </div>
                  </button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        data-testid={`button-options-${address.id}`}
                      >
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {!address.isDefault && (
                        <DropdownMenuItem 
                          onClick={() => setDefaultMutation.mutate(address.id)}
                          className="flex items-center gap-2"
                        >
                          <Star className="w-4 h-4" />
                          Set as default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => setLocation(`/saved-addresses?edit=${address.id}`)}
                        className="flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit address
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteAddressMutation.mutate(address.id)}
                        className="flex items-center gap-2 text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete address
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>

            {filteredAddresses.length > 3 && (
              <button
                onClick={() => setShowAllAddresses(!showAllAddresses)}
                className="w-full flex items-center justify-center gap-1 py-3 text-[#1A9952] font-medium text-sm"
                data-testid="button-view-all-addresses"
              >
                {showAllAddresses ? "Show less" : "View all"}
                <ChevronDown className={`w-4 h-4 transition-transform ${showAllAddresses ? "rotate-180" : ""}`} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Recently Searched */}
      {recentLocations.length > 0 && !searchQuery && (
        <div className="bg-white px-4 py-4 mt-2">
          <h2 
            className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4"
            style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
          >
            Recently Searched
          </h2>

          <div className="space-y-1">
            {recentLocations.slice(0, 3).map((location, index) => (
              <button
                key={index}
                onClick={() => handleSelectRecent(location)}
                className="w-full flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0 text-left hover:bg-gray-50 transition-colors"
                data-testid={`button-recent-${index}`}
              >
                <div className="flex flex-col items-center mt-1">
                  <MapPin className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 
                    className="font-semibold text-[#1C1C1C] text-[15px]"
                    style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
                  >
                    {location.label}
                  </h3>
                  <p className="text-gray-500 text-[13px] mt-0.5 line-clamp-2">
                    {location.addressLine}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Nav */}
      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
