import { MapPin, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import headerBg from "@assets/Hero_1763854193361.png";

interface AppHeaderProps {
  location?: string;
  cartCount?: number;
  onLocationClick?: () => void;
  onCartClick?: () => void;
}

export default function AppHeader({ 
  location = "Bengaluru, KA", 
  cartCount = 0,
  onLocationClick,
  onCartClick 
}: AppHeaderProps) {
  return (
    <header 
      className="h-24"
      style={{
        backgroundImage: `url(${headerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="h-full px-4 flex items-end justify-between pb-3">
        <Button 
          variant="ghost" 
          className="gap-2 font-medium text-foreground hover:bg-black/10"
          onClick={onLocationClick}
          data-testid="button-location"
        >
          <MapPin className="w-5 h-5" />
          <span
            className="ml-[0px] mr-[0px] pl-[0px] pr-[0px] text-left pt-[0px] pb-[0px] font-semibold text-[18px]">{location}</span>
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