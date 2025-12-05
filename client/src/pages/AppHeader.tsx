import { useState, useEffect } from "react";
import { MapPin, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import headerBg from "@assets/Hero_1763854193361.png";

interface AppHeaderProps {
  cartCount?: number;
  onLocationClick?: () => void;
  onCartClick?: () => void;
}

const LOCATION_STORAGE_KEY = "activeLocation";

export default function AppHeader({ 
  cartCount = 0,
  onLocationClick,
  onCartClick 
}: AppHeaderProps) {
  const [locationLabel, setLocationLabel] = useState("Bengaluru, KA");

  useEffect(() => {
    const savedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        setLocationLabel(parsed.label || "Bengaluru, KA");
      } catch (e) {
        console.error("Error parsing saved location:", e);
      }
    }

    // Listen for storage changes (when location is updated from LocationPage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCATION_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setLocationLabel(parsed.label || "Bengaluru, KA");
        } catch (error) {
          console.error("Error parsing location from storage event:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
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

        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-black/10"
          onClick={onCartClick}
          data-testid="button-cart"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="text-cart-count"
            >
              {cartCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
}