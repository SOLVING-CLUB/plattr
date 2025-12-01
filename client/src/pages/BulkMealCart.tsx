import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContex";
import FloatingNav from "@/pages/FloatingNav";

export default function BulkMealCart() {
  const [, setLocation] = useLocation();
  const { cart, removeFromCart, updateQuantity } = useCart();
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("menu");

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
      const newQuantity = Math.max(1, item.quantity + change);
      updateQuantity(itemId, newQuantity);
    }
  };

  if (cart.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 sticky top-0 z-50">
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
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-base mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                    ₹{item.price.toLocaleString('en-IN')} per serving
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  data-testid={`button-remove-${item.id}`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(item.id, -1)}
                    className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-green-500"
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
                <span className="font-bold text-lg" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>

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

