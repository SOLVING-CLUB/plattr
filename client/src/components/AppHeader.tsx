import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AppHeaderProps {
  cartItemCount?: number;
  onCartClick: () => void;
  onBackClick?: () => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export default function AppHeader({ cartItemCount = 0, onCartClick, onBackClick, onSearch, searchQuery }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background border-b" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center gap-2 p-3 max-w-7xl mx-auto">
        {onBackClick && (
          <Button 
            size="icon" 
            variant="ghost" 
            className="flex-shrink-0"
            onClick={onBackClick}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}

        <div className="flex-1 min-w-0">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search for dishes..." 
              className="pl-10"
              value={searchQuery || ''}
              onChange={(e) => onSearch?.(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>

        <Button 
          size="icon" 
          variant="ghost" 
          className="relative flex-shrink-0"
          onClick={onCartClick}
          data-testid="button-cart"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartItemCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full"
              data-testid="badge-cart-count"
            >
              {cartItemCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
}
