import { useCart } from "@/context/CartContex";
import { useLocation } from "wouter";
import { Package, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

const categoryLabels = {
  "bulk-meals": "Bulk Meal",
  "mealbox": "MealBox",
  "catering": "Catering",
  "corporate": "Corporate Catering"
};

const categoryRoutes = {
  "bulk-meals": "/bulk-meals",
  "mealbox": "/mealbox",
  "catering": "/catering",
  "corporate": "/corporate"
};

export default function ContinueOrderBanner() {
  const { activeCategory, cart, mealBoxProgress } = useCart();
  const [location, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Only show banner on home page, not on any order pages
    const isOnHomePage = location === "/";
    const isOnOrderPage = 
      location.startsWith("/mealbox") || 
      location.startsWith("/catering") || 
      location.startsWith("/corporate") || 
      location.startsWith("/categories") ||
      location.startsWith("/checkout") ||
      location.startsWith("/payment");
    
    // Don't show if on any order-related pages
    if (isOnOrderPage || !isOnHomePage) {
      setIsVisible(false);
      return;
    }

    // Show banner if there's mealbox progress OR active category with cart items
    const hasMealBoxProgress = mealBoxProgress !== null;
    const hasActiveCart = activeCategory && cart.length > 0;
    const hasActiveOrder = hasMealBoxProgress || hasActiveCart;
    
    if (hasActiveOrder && !isDismissed) {
      setTimeout(() => setIsVisible(true), 100);
    } else {
      setIsVisible(false);
    }
  }, [activeCategory, cart.length, mealBoxProgress, isDismissed, location]);

  // Determine which category to use for navigation
  const displayCategory = activeCategory || (mealBoxProgress ? "mealbox" : null);

  const handleContinue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (displayCategory) {
      setLocation(categoryRoutes[displayCategory]);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    setIsVisible(false);
  };

  // Don't show if dismissed or no active order
  if (isDismissed || (!mealBoxProgress && (!activeCategory || cart.length === 0))) {
    return null;
  }

  return (
    <div 
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 max-w-sm w-[calc(100%-2rem)] flex items-center justify-between px-4 py-3 rounded-[10px] shadow-lg transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
      style={{ 
        backgroundColor: "#1A9952",
        zIndex: 100
      }}
      data-testid="banner-continue-order"
    >
      {/* Left Icon - White circle with green box outline */}
      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
        <Package className="w-5 h-5" style={{ color: "#1A9952" }} strokeWidth={2.5} />
      </div>

      {/* Text Content - Two lines */}
      <div 
        className="flex-1 mx-3 cursor-pointer"
        onClick={handleContinue}
        style={{ fontFamily: "Sweet Sans Pro" }}
      >
        <div className="text-white text-sm font-medium leading-tight">
          Continue with your {categoryLabels[displayCategory || "mealbox"]}
        </div>
        <div className="text-white text-sm font-medium leading-tight">
          order
        </div>
      </div>

      {/* Right Arrow Icon - White circle with green arrow */}
      <div 
        className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={handleContinue}
      >
        <ChevronRight className="w-5 h-5" style={{ color: "#1A9952" }} strokeWidth={2.5} />
      </div>

      {/* Close Button - X icon */}
      <button
        onClick={handleClose}
        className="w-6 h-6 flex items-center justify-center flex-shrink-0 ml-2 hover:bg-white/20 rounded-full transition-colors"
        style={{ color: "white" }}
        data-testid="button-close-banner"
      >
        <X className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

