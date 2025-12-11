import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
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
  
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  
  // Contact info - prefilled from localStorage (logged in user)
  const [phone, setPhone] = useState(() => {
    const savedPhone = localStorage.getItem('phone');
    return savedPhone ? `+91 ${savedPhone}` : "";
  });
  const [email, setEmail] = useState(() => localStorage.getItem('email') || "");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Function to get current location and reverse geocode
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "Geolocation is not supported by your browser", variant: "destructive" });
      return;
    }

    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocode using Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        const newAddressLine1 = data.display_name?.split(',').slice(0, 2).join(', ') || "";
        const newAddressLine2 = addr.suburb || addr.neighbourhood || addr.road || addr.residential || "";
        const newCity = addr.city || addr.town || addr.village || addr.county || addr.state_district || "";
        const newState = addr.state || addr.region || "";
        const newPincode = addr.postcode || "";
        
        // Only update fields that have valid data, keep previous values otherwise
        if (newAddressLine1) setAddressLine1(newAddressLine1);
        if (newAddressLine2) setAddressLine2(newAddressLine2);
        if (newCity) setCity(newCity);
        if (newState) setState(newState);
        if (newPincode) setPincode(newPincode);
        
        // Clear saved address selection to enable manual editing
        setSelectedAddressId("");
        toast({ title: "Location Found", description: "Address filled from your current location" });
      } else {
        toast({ title: "Location Error", description: "Could not get address details", variant: "destructive" });
      }
    } catch (error: any) {
      console.error('Location error:', error);
      toast({ 
        title: "Location Error", 
        description: error.code === 1 ? "Please allow location access" : "Could not get your location", 
        variant: "destructive" 
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Fetch saved addresses
  const { data: savedAddresses = [] } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => addressService.getAll(),
  });
  
  const handleSavedAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setState("");
    setPincode("");
  };
  
  const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
  const isAddressFieldsDisabled = !!selectedAddressId;

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
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Choose Saved Address */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              Choose Saved Address (Optional)
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ fontFamily: "Sweet Sans Pro", color: selectedAddressId ? "#06352A" : "#9CA3AF" }}
              data-testid="select-saved-address"
              value={selectedAddressId}
              onChange={(e) => handleSavedAddressChange(e.target.value)}
            >
              <option value="">Select Address (Optional)</option>
              {savedAddresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label} {address.isDefault ? "(Default)" : ""}
                </option>
              ))}
            </select>
            
            {/* Show selected address details */}
            {selectedAddress && (
              <div 
                className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                data-testid="selected-address-display"
              >
                <p className="text-sm font-semibold mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  {selectedAddress.label}
                </p>
                <p className="text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                  {selectedAddress.address}
                  {selectedAddress.landmark && `, ${selectedAddress.landmark}`}
                </p>
              </div>
            )}
          </div>

          {/* Use Current Location Button */}
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-50 border-2 border-dashed border-green-500 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
            style={{ fontFamily: "Sweet Sans Pro" }}
            data-testid="button-use-location"
          >
            <MapPin className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">
              {isGettingLocation ? "Getting Location..." : "Use Current Location"}
            </span>
          </button>

          {/* Manual Address Entry - Only show when no saved address selected */}
          {!isAddressFieldsDisabled && (
            <>
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
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
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
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
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
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
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
                  value={state}
                  onChange={(e) => setState(e.target.value)}
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
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
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
            </>
          )}
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
