import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface AppHeaderProps {
  onBackClick?: () => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export default function AppHeader({ onBackClick, onSearch, searchQuery }: AppHeaderProps) {
  const [, setLocation] = useLocation();
  
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

        <button
          onClick={() => setLocation("/concierge")}
          data-testid="button-smart-menu-concierge"
          className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 transition-colors"
          style={{
            background: "linear-gradient(135deg, #FFD700 0%, #FFFFFF 100%)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          <Sparkles className="w-5 h-5 text-[#06352A]" />
        </button>
      </div>
    </header>
  );
}
