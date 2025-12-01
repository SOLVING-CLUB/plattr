import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { useCart } from "@/context/CartContex";
import FloatingNav from "@/pages/FloatingNav";
import chefHatIcon from "@assets/tabler_chef-hat-filled_1763917839168.png";
import servingStaffIcon from "@assets/ic_baseline-people_1763917839170.png";
import decorIcon from "@assets/streamline-ultimate_party-decoration-bold_1763917839170.png";
import tablewareIcon from "@assets/roentgen_fork-and-knife_1763917839169.png";
import musicIcon from "@assets/roentgen_fork-and-knife_1763917839169.png";
import cameraIcon from "@assets/mdi_camera3_1763917839155.png";

const BULK_MEALS_ADDONS_KEY = "bulkMealsAddons";

export default function BulkMealsAddons() {
  const [, setLocation] = useLocation();
  const { cart } = useCart();
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("menu");
  
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(() => {
    const stored = localStorage.getItem(BULK_MEALS_ADDONS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    if (cart.length === 0) {
      setLocation("/bulk-meals");
    }
  }, [cart.length, setLocation]);

  const handleTabChange = (tab: "home" | "menu" | "profile") => {
    if (tab === "home") {
      setLocation("/");
    } else if (tab === "menu") {
      setLocation("/bulk-meals");
    } else if (tab === "profile") {
      setLocation("/profile");
    }
  };

  const saveAddons = (addons: string[]) => {
    localStorage.setItem(BULK_MEALS_ADDONS_KEY, JSON.stringify(addons));
    setSelectedAddOns(addons);
  };

  const toggleAddon = (addonId: string) => {
    const newAddons = selectedAddOns.includes(addonId)
      ? selectedAddOns.filter(id => id !== addonId)
      : [...selectedAddOns, addonId];
    saveAddons(newAddons);
  };

  const totalServings = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 sticky top-0 z-50">
        <button 
          onClick={() => setLocation("/bulk-meals-cart")}
          className="flex items-center gap-2 text-gray-700"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold" style={{ fontFamily: "Sweet Sans Pro" }}>Back</span>
        </button>
      </div>

      <div className="px-4 py-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: "#1A9952" }} />
            <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: "#1A9952" }} />
          </div>
        </div>

        {/* Header with Skip Button */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              Select Add-Ons
            </h2>
            <p className="text-sm text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
              For {totalServings} serves from Bulk Meals
            </p>
          </div>
          <Button
            onClick={() => setLocation("/bulk-meals-delivery")}
            variant="ghost"
            className="text-sm font-semibold px-4 py-2"
            style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}
            data-testid="button-skip-addons"
          >
            SKIP →
          </Button>
        </div>

        {/* Add-Ons List */}
        <div className="space-y-4 mb-6">
          {/* Live Cooking Counters */}
          <div 
            className="flex items-start gap-4 p-4 border-2 rounded-lg"
            style={{ 
              borderColor: selectedAddOns.includes('cooking') ? "#1A9952" : "#E5E7EB",
              backgroundColor: selectedAddOns.includes('cooking') ? "#F0F9F4" : "white"
            }}
          >
            <img src={chefHatIcon} alt="Chef" className="w-12 h-12 object-contain flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                Live Cooking Counters
              </h3>
              <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                Professional chefs prepare food live at your event location, offering a unique culinary experience.
              </p>
            </div>
            <button
              onClick={() => toggleAddon('cooking')}
              className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
              style={{
                borderColor: "#1A9952",
                backgroundColor: selectedAddOns.includes('cooking') ? "#1A9952" : "white"
              }}
              data-testid="addon-cooking"
            >
              {selectedAddOns.includes('cooking') && <Check className="w-4 h-4 text-white" />}
            </button>
          </div>

          {/* Serving Staff */}
          <div 
            className="flex items-start gap-4 p-4 border-2 rounded-lg"
            style={{ 
              borderColor: selectedAddOns.includes('staff') ? "#1A9952" : "#E5E7EB",
              backgroundColor: selectedAddOns.includes('staff') ? "#F0F9F4" : "white"
            }}
          >
            <img src={servingStaffIcon} alt="Staff" className="w-12 h-12 object-contain flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                Serving Staff
              </h3>
              <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                Professional serving staff to help set up, serve, and manage your food during the event.
              </p>
            </div>
            <button
              onClick={() => toggleAddon('staff')}
              className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
              style={{
                borderColor: "#1A9952",
                backgroundColor: selectedAddOns.includes('staff') ? "#1A9952" : "white"
              }}
              data-testid="addon-staff"
            >
              {selectedAddOns.includes('staff') && <Check className="w-4 h-4 text-white" />}
            </button>
          </div>

          {/* Decor */}
          <div 
            className="flex items-start gap-4 p-4 border-2 rounded-lg"
            style={{ 
              borderColor: selectedAddOns.includes('decor') ? "#1A9952" : "#E5E7EB",
              backgroundColor: selectedAddOns.includes('decor') ? "#F0F9F4" : "white"
            }}
          >
            <img src={decorIcon} alt="Decor" className="w-12 h-12 object-contain flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                Decor
              </h3>
              <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                Transform your event space with professional theme-based decoration.
              </p>
            </div>
            <button
              onClick={() => toggleAddon('decor')}
              className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
              style={{
                borderColor: "#1A9952",
                backgroundColor: selectedAddOns.includes('decor') ? "#1A9952" : "white"
              }}
              data-testid="addon-decor"
            >
              {selectedAddOns.includes('decor') && <Check className="w-4 h-4 text-white" />}
            </button>
          </div>

          {/* Tableware & Crockery */}
          <div 
            className="flex items-start gap-4 p-4 border-2 rounded-lg"
            style={{ 
              borderColor: selectedAddOns.includes('tableware') ? "#1A9952" : "#E5E7EB",
              backgroundColor: selectedAddOns.includes('tableware') ? "#F0F9F4" : "white"
            }}
          >
            <img src={tablewareIcon} alt="Tableware" className="w-12 h-12 object-contain flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                Tableware & Crockery
              </h3>
              <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                Premium biodegradable tableware and cutlery for a sustainable event.
              </p>
            </div>
            <button
              onClick={() => toggleAddon('tableware')}
              className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
              style={{
                borderColor: "#1A9952",
                backgroundColor: selectedAddOns.includes('tableware') ? "#1A9952" : "white"
              }}
              data-testid="addon-tableware"
            >
              {selectedAddOns.includes('tableware') && <Check className="w-4 h-4 text-white" />}
            </button>
          </div>

          {/* Live Music */}
          <div 
            className="flex items-start gap-4 p-4 border-2 rounded-lg"
            style={{ 
              borderColor: selectedAddOns.includes('music') ? "#1A9952" : "#E5E7EB",
              backgroundColor: selectedAddOns.includes('music') ? "#F0F9F4" : "white"
            }}
          >
            <img src={musicIcon} alt="Music" className="w-12 h-12 object-contain flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                Live Music
              </h3>
              <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                Music performance that entertains your guests.
              </p>
            </div>
            <button
              onClick={() => toggleAddon('music')}
              className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
              style={{
                borderColor: "#1A9952",
                backgroundColor: selectedAddOns.includes('music') ? "#1A9952" : "white"
              }}
              data-testid="addon-music"
            >
              {selectedAddOns.includes('music') && <Check className="w-4 h-4 text-white" />}
            </button>
          </div>

          {/* Photography */}
          <div 
            className="flex items-start gap-4 p-4 border-2 rounded-lg"
            style={{ 
              borderColor: selectedAddOns.includes('photography') ? "#1A9952" : "#E5E7EB",
              backgroundColor: selectedAddOns.includes('photography') ? "#F0F9F4" : "white"
            }}
          >
            <img src={cameraIcon} alt="Photography" className="w-12 h-12 object-contain flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                Photography
              </h3>
              <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                Professional photography to capture memories.
              </p>
            </div>
            <button
              onClick={() => toggleAddon('photography')}
              className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
              style={{
                borderColor: "#1A9952",
                backgroundColor: selectedAddOns.includes('photography') ? "#1A9952" : "white"
              }}
              data-testid="addon-photography"
            >
              {selectedAddOns.includes('photography') && <Check className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>

        {/* Enter Delivery Details Button */}
        <Button
          onClick={() => setLocation("/bulk-meals-delivery")}
          className="w-full py-6 text-lg font-semibold border-0"
          style={{ 
            fontFamily: "Sweet Sans Pro",
            backgroundColor: "#1A9952",
            color: "white",
            borderRadius: "10px"
          }}
          data-testid="button-enter-delivery-details"
        >
          Enter Delivery Details →
        </Button>
      </div>

      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
