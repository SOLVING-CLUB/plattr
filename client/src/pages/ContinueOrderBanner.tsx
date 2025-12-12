import { useCart } from "@/context/CartContex";
import { useLocation } from "wouter";
import { ChevronRight, Truck, UtensilsCrossed, X } from "lucide-react";
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

type CategoryType = keyof typeof categoryLabels;

interface BannerConfig {
  type: "warning" | "continue";
  category: CategoryType;
}

export default function ContinueOrderBanner() {
  const { activeCategory, cart, mealBoxProgress } = useCart();
  const [location, setLocation] = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [bannerConfig, setBannerConfig] = useState<BannerConfig | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Don't show if dismissed
    if (isDismissed) {
      setIsVisible(false);
      return;
    }

    // Don't show on order-related pages
    const isOnOrderPage = 
      location.startsWith("/mealbox") || 
      location.startsWith("/catering") || 
      location.startsWith("/corporate") || 
      location.startsWith("/bulk-meals") ||
      location.startsWith("/categories") ||
      location.startsWith("/checkout") ||
      location.startsWith("/payment") ||
      location.startsWith("/profile") ||
      location.startsWith("/orders") ||
      location.startsWith("/cart");
    
    if (isOnOrderPage) {
      setIsVisible(false);
      return;
    }

    // Determine which category has an active order
    const hasMealBoxProgress = mealBoxProgress !== null;
    const hasActiveCart = activeCategory && cart.length > 0;
    
    if (hasMealBoxProgress || hasActiveCart) {
      const displayCategory = activeCategory || (hasMealBoxProgress ? "mealbox" : null);
      
      if (displayCategory) {
        // Check if we're on home page - show "continue" style
        // In future, could show "warning" style if user tries different category
        setBannerConfig({
          type: "continue",
          category: displayCategory as CategoryType
        });
        setTimeout(() => setIsVisible(true), 100);
      }
    } else {
      setIsVisible(false);
      setBannerConfig(null);
    }
  }, [activeCategory, cart.length, mealBoxProgress, location, isDismissed]);

  const handleContinue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bannerConfig) {
      setLocation(categoryRoutes[bannerConfig.category]);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!bannerConfig || !isVisible) {
    return null;
  }

  const isWarning = bannerConfig.type === "warning";
  const backgroundColor = isWarning ? "#D97706" : "#1A9952";
  const iconColor = isWarning ? "#D97706" : "#1A9952";
  
  // Choose icon based on category
  const getIcon = () => {
    switch (bannerConfig.category) {
      case "bulk-meals":
        return <Truck className="w-5 h-5" style={{ color: iconColor }} strokeWidth={2} />;
      case "mealbox":
      case "catering":
      case "corporate":
      default:
        return <UtensilsCrossed className="w-5 h-5" style={{ color: iconColor }} strokeWidth={2} />;
    }
  };

  const getMessage = () => {
    if (isWarning) {
      return `Please complete your ${categoryLabels[bannerConfig.category]} order first`;
    }
    return `Continue with your ${categoryLabels[bannerConfig.category]} order`;
  };

  return (
    <div 
      onClick={handleContinue}
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 max-w-sm w-[calc(100%-2rem)] flex items-center gap-3 px-3 py-2.5 rounded-full shadow-lg cursor-pointer transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
      style={{ 
        backgroundColor: backgroundColor,
        zIndex: 45
      }}
      data-testid="banner-continue-order"
    >
      {/* Left Icon - White circle with colored icon */}
      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
        {getIcon()}
      </div>

      {/* Text Content */}
      <div 
        className="flex-1"
        style={{ fontFamily: "Sweet Sans Pro" }}
      >
        <span className="text-white text-sm font-medium">
          {getMessage()}
        </span>
      </div>

      {/* Right Chevron */}
      <ChevronRight className="w-5 h-5 text-white flex-shrink-0" strokeWidth={2} />

      {/* Close Button */}
      <button
        onClick={handleDismiss}
        className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 hover:bg-white/30 transition-colors"
        data-testid="button-dismiss-banner"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4 text-white" strokeWidth={2} />
      </button>
    </div>
  );
}
