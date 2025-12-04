import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContex";
import FloatingNav from "@/pages/FloatingNav";
import { bulkMealOrderService, addressService } from "@/lib/supabase-service";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export default function BulkMealsDelivery() {
  const [, setLocation] = useLocation();
  const { cart, clearCart } = useCart();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("menu");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Fetch saved addresses
  const { data: savedAddresses = [] } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => addressService.getAll(),
  });

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

  const handleSubmit = async () => {
    try {
      setIsCreatingOrder(true);
      
      // Get form values
      const deliveryDate = (document.querySelector('[data-testid="input-event-date"]') as HTMLInputElement)?.value || null;
      const deliveryTime = (document.querySelector('[data-testid="input-event-time"]') as HTMLInputElement)?.value || null;
      const selectedAddressId = (document.querySelector('[data-testid="select-saved-address"]') as HTMLSelectElement)?.value || "";
      
      // Validate addressId - only use if it's a valid UUID (not empty string or invalid value)
      let validAddressId: string | undefined = undefined;
      if (selectedAddressId && selectedAddressId.trim() !== "" && selectedAddressId !== "home" && selectedAddressId !== "office") {
        // Check if it's a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(selectedAddressId)) {
          validAddressId = selectedAddressId;
        }
      }
      
      // Get selected addons from localStorage
      const BULK_MEALS_ADDONS_KEY = "bulkMealsAddons";
      let selectedAddons: string[] = [];
      const storedAddons = localStorage.getItem(BULK_MEALS_ADDONS_KEY);
      if (storedAddons) {
        try {
          selectedAddons = JSON.parse(storedAddons);
        } catch {
          selectedAddons = [];
        }
      }
      
      // Convert cart items to order format
      const items = cart.map(item => ({
        dishId: item.id.toString(),
        quantity: item.quantity,
        price: item.price,
      }));
      
      // Create order
      await bulkMealOrderService.create({
        items: items,
        selectedAddons: selectedAddons.length > 0 ? selectedAddons : undefined,
        subtotal: subtotal,
        gst: gst,
        platformFee: platformFee,
        packagingFee: packagingFee,
        total: grandTotal,
        deliveryDate: deliveryDate || undefined,
        deliveryTime: deliveryTime || undefined,
        addressId: validAddressId,
      });
      
    localStorage.removeItem("bulkMealsAddons");
    clearCart();
      
      toast({
        title: "Order Created!",
        description: "Your bulk meal order has been placed successfully.",
      });
      
    setLocation("/bulk-meals-thank-you");
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: error.message || "Failed to create order. Please try again.",
      });
    } finally {
      setIsCreatingOrder(false);
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
          onClick={() => setLocation("/bulk-meals-addons")}
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
          Proceed to Payment
        </h2>

        {/* Total Amount Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
            Total Amount to be Paid
          </span>
          <span className="font-bold text-xl" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
            ₹{grandTotal.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          {/* Select Event Date & Time */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              Select Event Date & Time
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                defaultValue="2025-10-12"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ fontFamily: "Sweet Sans Pro" }}
                data-testid="input-event-date"
              />
              <input
                type="time"
                defaultValue="12:00"
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ fontFamily: "Sweet Sans Pro" }}
                data-testid="input-event-time"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              Enter Your Phone Number
            </label>
            <input
              type="tel"
              placeholder="+91 98552 12375"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="input-phone"
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              Enter Your Email Address
            </label>
            <input
              type="email"
              placeholder="test@gmail.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="input-email"
            />
          </div>

          {/* Choose Saved Address */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              Choose Saved Address (Optional)
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-500"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="select-saved-address"
            >
              <option value="">Select Address (Optional)</option>
              {savedAddresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label} {address.isDefault ? "(Default)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Address Line 1 */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              Address Line 1
            </label>
            <input
              type="text"
              placeholder="Door No. 32, Jaya Prakash Nagar"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="input-address-line1"
            />
          </div>

          {/* Address Line 2 */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              Address Line 2
            </label>
            <input
              type="text"
              placeholder="Near Metro Station, JP Nagar"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="input-address-line2"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              City
            </label>
            <input
              type="text"
              placeholder="Bengaluru"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="input-city"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              State
            </label>
            <input
              type="text"
              placeholder="Karnataka"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="input-state"
            />
          </div>

          {/* Pincode */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              Pincode
            </label>
            <input
              type="text"
              placeholder="450003"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="input-pincode"
            />
          </div>

          {/* Save Address Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-2 border-gray-300"
              style={{ accentColor: "#1A9952" }}
              data-testid="checkbox-save-address"
            />
            <span className="text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              Save Address for future use
            </span>
          </label>
        </div>

        {/* Select Payment Method Button */}
        <Button
          onClick={handleSubmit}
          disabled={isCreatingOrder}
          className="w-full py-6 text-lg font-semibold border-0 flex items-center justify-between"
          style={{ 
            fontFamily: "Sweet Sans Pro",
            backgroundColor: "#1A9952",
            color: "white",
            borderRadius: "10px"
          }}
          data-testid="button-submit"
        >
          <span>Submit</span>
          <span className="font-bold text-xl">
            ₹{grandTotal.toLocaleString('en-IN')}
          </span>
        </Button>
      </div>

      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
