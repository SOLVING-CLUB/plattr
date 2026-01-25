import { Button } from "@/components/ui/button";
import { ShoppingBag, ChevronRight } from "lucide-react";

interface FloatingCartButtonProps {
  itemCount: number;
  totalPrice: number;
  onClick: () => void;
}

export default function FloatingCartButton({ itemCount, totalPrice, onClick }: FloatingCartButtonProps) {
  if (itemCount === 0) return null;

  return (
    <div 
      className="fixed left-4 right-4 z-30 floating-cart-button"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 102px)',
        top: 'auto',
      }}
    >
      <Button 
        size="lg"
        className="w-full relative py-6 rounded-lg bg-gray-100 no-default-hover-elevate no-default-active-elevate"
        style={{
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.25), 0 -2px 10px rgba(0, 0, 0, 0.15)'
        }}
        onClick={onClick}
        data-testid="button-view-cart"
      >
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-md">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary" data-testid="text-cart-items">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} added
              </span>
              <span className="text-primary/60">|</span>
              <span className="font-bold text-lg font-serif text-primary" data-testid="text-cart-total">₹{totalPrice}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-primary">View platter</span>
            <ChevronRight className="w-5 h-5 text-primary" />
          </div>
        </div>
      </Button>
    </div>
  );
}
