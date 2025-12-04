import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import type { Dish, Category } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseImageUrl } from "@/lib/supabase";
import { cartStorage } from "@/lib/cartStorage";
import { useLocation } from "wouter";
import PlatterVisualization from "@/components/PlatterVisualization";

import biryaniImage1 from '@assets/stock_images/indian_biryani_dish__60e99e80.jpg';
import idliImage1 from '@assets/stock_images/indian_idli_sambar_s_c6bb3ca9.jpg';
import vadaImage1 from '@assets/stock_images/indian_vada_d82fc29e.jpg';
import thaliImage from '@assets/stock_images/indian_thali_meal_3a645a6d.jpg';
import samosaImage from '@assets/stock_images/samosa_snacks_indian_0946aa28.jpg';
import platterImage from '@assets/stock_images/indian_food_platter__b34d03e7.jpg';

// User-provided images - South Indian
import masalaDosaImage from '@assets/image_1760599491069.png';
import pongalImage from '@assets/image_1760599583321.png';
import uttapamImage from '@assets/image_1760599632589.png';
import ravaDosaImage from '@assets/image_1760599659726.png';

// User-provided images - North Indian
import alooParathaImage from '@assets/image_1760599701468.png';
import choleBhatureImage from '@assets/image_1760599722844.png';
import pohaImage from '@assets/image_1760599744216.png';
import upmaImage from '@assets/image_1760599771826.png';
import breadToastImage from '@assets/image_1760599797811.png';

const getDishImage = (dishName: string, dishImageUrl?: string): string => {
  if (dishImageUrl && !dishImageUrl.startsWith('/images/')) {
    return dishImageUrl;
  }
  
  const name = dishName.toLowerCase();
  
  // South Indian Tiffins
  if (name.includes('masala dosa')) return masalaDosaImage;
  if (name.includes('rava dosa')) return ravaDosaImage;
  if (name.includes('dosa')) return masalaDosaImage;
  if (name.includes('idli')) return idliImage1;
  if (name.includes('vada') || name.includes('medu')) return vadaImage1;
  if (name.includes('uttapam')) return uttapamImage;
  if (name.includes('pongal')) return pongalImage;
  
  // North Indian Tiffins
  if (name.includes('aloo paratha') || name.includes('paratha')) return alooParathaImage;
  if (name.includes('chole bhature') || name.includes('bhature')) return choleBhatureImage;
  if (name.includes('poha')) return pohaImage;
  if (name.includes('upma')) return upmaImage;
  if (name.includes('bread toast') || name.includes('toast')) return breadToastImage;
  
  // Snacks
  if (name.includes('samosa')) return samosaImage;
  if (name.includes('pakora') || name.includes('bajji')) return vadaImage1;
  
  // Lunch/Dinner
  if (name.includes('biryani')) return biryaniImage1;
  if (name.includes('thali') || name.includes('meal')) return thaliImage;
  
  return platterImage;
};

interface CartItem {
  id: string;
  quantity: number;
  dish: Dish;
  category: Category;
}

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CartDrawer({ 
  open, 
  onOpenChange
}: CartDrawerProps) {
  const { data: apiCartItems, isLoading } = useQuery<CartItem[] | null>({
    queryKey: ['/api/cart'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const [paxCount, setPaxCount] = useState<number>(10);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [showPlatter, setShowPlatter] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Use server cart for authenticated users, localStorage for guests only
  const cartItems = apiCartItems !== null && apiCartItems !== undefined
    ? apiCartItems // Authenticated: use server cart only (even if empty)
    : apiCartItems === null // Guest: use localStorage
      ? cartStorage.getCart().map(item => ({
          id: `local-${item.dishId}`,
          quantity: item.quantity,
          dish: item.dish,
          category: { id: item.dish.categoryId, name: item.dish.categoryId } as Category,
        }))
      : []; // Loading: empty array

  const toggleDescription = (itemId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const updateCartMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const response = await apiRequest('PUT', `/api/cart/${id}`, { quantity });
      const data = await response.json();
      
      // If this is a localStorage item, update it
      if (id.startsWith('local-')) {
        const dishId = id.replace('local-', '');
        cartStorage.updateItem(dishId, quantity);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const deleteCartMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/cart/${id}`, undefined);
      const data = await response.json();
      
      // If this is a localStorage item, remove it
      if (id.startsWith('local-')) {
        const dishId = id.replace('local-', '');
        cartStorage.removeItem(dishId);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const handleIncrease = (item: CartItem) => {
    updateCartMutation.mutate({ id: item.id, quantity: item.quantity + 1 });
  };

  const handleDecrease = (item: CartItem) => {
    if (item.quantity <= 1) {
      deleteCartMutation.mutate(item.id);
    } else {
      updateCartMutation.mutate({ id: item.id, quantity: item.quantity - 1 });
    }
  };

  const handleRemove = (item: CartItem) => {
    deleteCartMutation.mutate(item.id);
  };

  const groupedItems = cartItems.reduce((acc, item) => {
    const categoryName = item.category?.name || 'Other';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  const itemsTotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.dish.price as string) * item.quantity), 0);
  const subtotal = itemsTotal * paxCount;
  const deliveryFee = subtotal > 0 ? 40 : 0;
  const total = subtotal + deliveryFee;

  const handleProceedToCheckout = () => {
    // Close cart drawer and open platter visualization
    onOpenChange(false);
    setShowPlatter(true);
  };

  const handlePlatterProceedToCheckout = () => {
    // Close platter and navigate to checkout
    setShowPlatter(false);
    setLocation('/checkout');
  };

  return (
    <>
      <PlatterVisualization
        open={showPlatter}
        onOpenChange={setShowPlatter}
        cartItems={cartItems}
        paxCount={paxCount}
        onProceedToCheckout={handlePlatterProceedToCheckout}
      />
      
      <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] p-0" data-testid="drawer-cart">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="text-2xl font-serif" data-testid="text-cart-title">Your Order</SheetTitle>
          <SheetDescription data-testid="text-cart-item-count">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in platter
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-280px)] px-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading platter...
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Your platter is empty
            </div>
          ) : (
            <>
              {Object.entries(groupedItems).map(([category, categoryItems]) => (
                <div key={category} className="mb-6">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3" data-testid={`text-category-${category.toLowerCase()}`}>
                    {category}
                  </h3>
                  <div className="space-y-3">
                    {categoryItems.map((item) => (
                      <div key={item.id} className="space-y-3" data-testid={`cart-item-${item.dish.id}`}>
                      
                      <div className="bg-card border rounded-xl p-4 hover-elevate">
                        <div className="flex gap-4">
                          <img 
                            src={getSupabaseImageUrl((item.dish as any).image_url || item.dish.imageUrl) || getDishImage(item.dish.name, item.dish.imageUrl || undefined)} 
                            alt={item.dish.name}
                            className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                            data-testid="img-item"
                            onError={(e) => {
                              e.currentTarget.src = getDishImage(item.dish.name, undefined, item.dish as any);
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1" data-testid="text-item-name">{item.dish.name}</h4>
                            {item.dish.description && (
                              <div className="mb-2">
                                <p 
                                  className={`text-xs text-muted-foreground ${!expandedDescriptions.has(item.id) ? 'line-clamp-2' : ''}`}
                                  data-testid="text-item-description"
                                >
                                  {item.dish.description}
                                </p>
                                {item.dish.description.length > 80 && (
                                  <button
                                    onClick={() => toggleDescription(item.id)}
                                    className="text-xs text-primary hover:underline font-semibold"
                                    data-testid="button-toggle-description"
                                  >
                                    {expandedDescriptions.has(item.id) ? 'Show less' : '...more'}
                                  </button>
                                )}
                              </div>
                            )}
                            <p className="text-sm text-primary font-bold" data-testid="text-item-price">₹{parseFloat(item.dish.price as string).toFixed(0)}</p>
                          </div>
                          <div className="text-right flex-shrink-0 flex flex-col justify-between items-end">
                            <p className="font-bold text-lg text-primary" data-testid="text-item-total">₹{(parseFloat(item.dish.price as string) * item.quantity * paxCount).toFixed(0)}</p>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full"
                              onClick={() => handleRemove(item)}
                              data-testid="button-remove-item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
          )
        }
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-card border-t shadow-2xl">
          <div className="space-y-3 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground" data-testid="text-subtotal-label">Subtotal ({paxCount} pax)</span>
              <span className="font-semibold" data-testid="text-subtotal">₹{subtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground" data-testid="text-delivery-label">Delivery Fee</span>
              <span className="font-semibold" data-testid="text-delivery-fee">₹{deliveryFee}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span data-testid="text-total-label">Total</span>
              <span className="text-primary" data-testid="text-total">₹{total.toFixed(0)}</span>
            </div>
          </div>
          <Button 
            size="lg" 
            className="w-full rounded-full h-12 text-base font-semibold shadow-lg" 
            disabled={cartItems.length === 0}
            onClick={handleProceedToCheckout}
            data-testid="button-checkout"
          >
            Proceed to Checkout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
    </>
  );
}
