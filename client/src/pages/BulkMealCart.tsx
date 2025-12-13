import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContex";
import FloatingNav from "@/pages/FloatingNav";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { getSupabaseImageUrl } from "@/lib/supabase";
import dishFallbackImage from "@assets/stock_images/biryani_rice_dish_fo_8445bdd6.jpg";

interface SuggestedDish {
  id: string;
  name: string;
  price: string | number;
  image_url?: string | null;
  category_id?: string;
  dietary_type?: string;
}

export default function BulkMealCart() {
  const [, setLocation] = useLocation();
  const { cart, removeFromCart, updateQuantity, addToCart } = useCart();
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("menu");

  const isSixtyMinOrder = cart.length > 0 && cart.every(item => item.isSixtyMin === true);

  // Fetch dishes from lunch-dinner (main meal type) to get related suggestions
  // Use 'sixtymin' filter for 60-min orders, 'bulkmeal' filter for regular bulk orders
  const { data: allDishes = [] } = useQuery<SuggestedDish[]>({
    queryKey: isSixtyMinOrder 
      ? ['/api/dishes', 'lunch-dinner', 'all', 'all', 'sixtymin']
      : ['/api/dishes', 'lunch-dinner', 'all', 'all', 'bulkmeal'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: cart.length > 0,
  });

  const cartItemIds = new Set(cart.map(item => item.id));
  const cartItemNames = cart.map(item => item.name.toLowerCase());
  
  // Dynamic suggestions: prioritize dishes from similar categories or dietary types
  const filteredSuggestions = useMemo(() => {
    if (allDishes.length === 0) return [];
    
    // Filter out items already in cart
    const availableDishes = allDishes.filter(dish => !cartItemIds.has(Number(dish.id.toString().replace('D-', ''))));
    
    // Shuffle and pick 6 random dishes for variety
    const shuffled = [...availableDishes].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 6);
  }, [allDishes, cartItemIds]);

  const handleAddSuggestion = (dish: SuggestedDish) => {
    const imageUrl = dish.image_url ? getSupabaseImageUrl(dish.image_url) : dishFallbackImage;
    const dishId = parseInt(dish.id.toString().replace('D-', '')) || 0;
    addToCart("bulk-meals", {
      id: dishId,
      name: dish.name,
      price: typeof dish.price === 'string' ? parseFloat(dish.price) : dish.price,
      quantity: 5,
      isSixtyMin: isSixtyMinOrder,
      image: imageUrl,
    });
  };

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

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = Math.round(subtotal * 0.18);
  const platformFee = 499;
  const packagingFee = 399;
  const grandTotal = subtotal + gst + platformFee + packagingFee;

  const handleQuantityChange = (itemId: number, change: number) => {
    const item = cart.find(i => i.id === itemId);
    if (item) {
      const newQuantity = Math.max(5, item.quantity + change);
      updateQuantity(itemId, newQuantity);
    }
  };

  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="bg-white px-4 pt-16 pb-4 border-b border-gray-100 sticky top-0 z-50">
        <button 
          onClick={() => setLocation("/bulk-meals")}
          className="flex items-center gap-2 text-gray-700"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold" style={{ fontFamily: "Sweet Sans Pro" }}>Back</span>
        </button>
      </div>

      <div className="px-4 py-6">
        {/* Header */}
        <h2 className="text-xl sm:text-2xl font-bold mb-6" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
          Your Cart
        </h2>

        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {cart.map((item) => (
            <div
              key={item.id}
              className="bg-white border-2 border-gray-200 rounded-lg p-4"
              data-testid={`cart-item-${item.id}`}
            >
              <div className="flex gap-4">
                {/* Item Image - Larger */}
                <img 
                  src={item.image || dishFallbackImage} 
                  alt={item.name}
                  className="w-28 h-28 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  {/* Top: Name, Price per serving, Delete */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1 truncate" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                        ₹{item.price.toLocaleString('en-IN')} per serving
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                      data-testid={`button-remove-${item.id}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Bottom: Total Price and Quantity Controls */}
                  <div className="mt-2">
                    <span className="font-bold text-lg block mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQuantityChange(item.id, -1)}
                        disabled={item.quantity <= 5}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                          item.quantity <= 5 
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                        data-testid={`button-decrease-${item.id}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-semibold text-base w-8 text-center" style={{ fontFamily: "Sweet Sans Pro" }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-green-500"
                        data-testid={`button-increase-${item.id}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Suggested Items */}
        {filteredSuggestions.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-base mb-3" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              You might also like
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {filteredSuggestions.map((dish) => (
                <div
                  key={dish.id}
                  className="flex-shrink-0 w-36 bg-white border border-gray-200 rounded-lg p-3"
                  data-testid={`suggestion-${dish.id}`}
                >
                  <img 
                    src={dish.image_url ? getSupabaseImageUrl(dish.image_url) : dishFallbackImage} 
                    alt={dish.name}
                    className="w-full h-20 object-cover rounded-md mb-2"
                  />
                  <h4 className="font-medium text-sm mb-1 line-clamp-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    {dish.name}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                      ₹{typeof dish.price === 'string' ? parseFloat(dish.price).toLocaleString('en-IN') : dish.price.toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => handleAddSuggestion(dish)}
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#1A9952" }}
                      data-testid={`button-add-suggestion-${dish.id}`}
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700" style={{ fontFamily: "Sweet Sans Pro" }}>
              Subtotal
            </span>
            <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              ₹{subtotal.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700" style={{ fontFamily: "Sweet Sans Pro" }}>
              GST (18%)
            </span>
            <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              ₹{gst.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700" style={{ fontFamily: "Sweet Sans Pro" }}>
              Platform Fee
            </span>
            <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              ₹{platformFee.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700" style={{ fontFamily: "Sweet Sans Pro" }}>
              Packaging & Handling
            </span>
            <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              ₹{packagingFee.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="border-t border-gray-300 pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                Grand Total
              </span>
              <span className="font-bold text-xl" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Proceed to Add-Ons Button */}
        <Button
          onClick={() => setLocation("/bulk-meals-addons")}
          className="w-full py-6 text-lg font-semibold border-0"
          style={{ 
            fontFamily: "Sweet Sans Pro",
            backgroundColor: "#1A9952",
            color: "white",
            borderRadius: "10px"
          }}
          data-testid="button-proceed-to-addons"
        >
          Proceed to Add-Ons →
        </Button>
      </div>

      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

