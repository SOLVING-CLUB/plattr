import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { useCart } from "@/context/CartContex";
import FloatingNav from "@/pages/FloatingNav";
import { bulkMealOrderService, sixtyMinBulkOrderService, addressService, CouponValidationResult } from "@/lib/supabase-service";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import DeliveryTimePicker from "@/components/DeliveryTimePicker";
import DeliveryDatePicker from "@/components/DeliveryDatePicker";
import CouponInput from "@/components/CouponInput";

const SIXTY_MIN_ORDER_FLAG = "isSixtyMinOrder";

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
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discount: number;
    discountType: 'percentage' | 'fixed' | 'free_delivery';
    discountValue: number;
    isFreeDelivery?: boolean;
  } | null>(null);

  const handleCouponApply = (result: CouponValidationResult) => {
    if (result.valid && result.coupon && result.discount !== undefined) {
      setAppliedCoupon({
        id: result.coupon.id,
        code: result.coupon.code,
        discount: result.discount,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
        isFreeDelivery: result.isFreeDelivery,
      });
      toast({
        title: "Coupon Applied!",
        description: result.isFreeDelivery ? "Free delivery applied!" : `You saved ₹${result.discount}`,
      });
    }
  };

  const handleCouponRemove = () => {
    setAppliedCoupon(null);
  };

  // Calculate T+12 hours for default date/time
  const getMinDateTime = () => {
    const minTime = new Date(Date.now() + 12 * 60 * 60 * 1000);
    return {
      date: minTime.toISOString().split('T')[0],
      time: `${minTime.getHours().toString().padStart(2, '0')}:00`
    };
  };
  
  const minDateTime = getMinDateTime();
  const [eventDate, setEventDate] = useState(minDateTime.date);
  const [eventTime, setEventTime] = useState(minDateTime.time);

  // Helper function to reverse geocode coordinates
  const reverseGeocode = async (latitude: number, longitude: number) => {
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
      
      if (newAddressLine1) setAddressLine1(newAddressLine1);
      if (newAddressLine2) setAddressLine2(newAddressLine2);
      if (newCity) setCity(newCity);
      if (newState) setState(newState);
      if (newPincode) setPincode(newPincode);
      
      setSelectedAddressId("");
      return true;
    }
    return false;
  };

  // Function to get current location using IP-based fallback
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      // First try browser geolocation
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });

          const { latitude, longitude } = position.coords;
          const success = await reverseGeocode(latitude, longitude);
          if (success) {
            toast({ title: "Location Found", description: "Address filled from your current location" });
            return;
          }
        } catch (geoError) {
          console.log('Browser geolocation failed, trying IP-based fallback...');
        }
      }

      // Fallback: IP-based geolocation using free API
      const ipResponse = await fetch('https://ipapi.co/json/');
      const ipData = await ipResponse.json();
      
      if (ipData && !ipData.error) {
        // Use IP-based location data directly
        setAddressLine1(ipData.city ? `${ipData.city} Area` : "");
        setAddressLine2("");
        setCity(ipData.city || "");
        setState(ipData.region || "");
        setPincode(ipData.postal || "");
        setSelectedAddressId("");
        
        toast({ 
          title: "Approximate Location Found", 
          description: "Address filled based on your approximate location. Please verify and update if needed." 
        });
      } else {
        throw new Error("IP geolocation failed");
      }
    } catch (error: any) {
      console.error('Location error:', error);
      toast({ 
        title: "Location Error", 
        description: "Could not detect your location. Please enter your address manually.", 
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
  const packagingFee = Math.round(subtotal * 0.06);
  const baseDeliveryCharges = 500;
  const deliveryCharges = appliedCoupon?.isFreeDelivery ? 0 : baseDeliveryCharges;
  const gst = Math.round(subtotal * 0.05);
  const discount = appliedCoupon?.isFreeDelivery ? 0 : (appliedCoupon?.discount || 0);
  const grandTotal = subtotal + packagingFee + deliveryCharges + gst - discount;

  const handleSubmit = async () => {
    try {
      setIsCreatingOrder(true);
      
      // Check 12-hour minimum advance booking
      if (eventDate) {
        const selectedDateTime = new Date(`${eventDate}T${eventTime || '12:00'}`);
        const now = new Date();
        const hoursDiff = (selectedDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 12) {
          toast({
            title: "Invalid Date/Time",
            description: "Please select a date and time at least 12 hours from now.",
            variant: "destructive",
          });
          setIsCreatingOrder(false);
          return;
        }
      }
      
      // Handle address - use saved address ID or inline address text
      let validAddressId: string | undefined = undefined;
      let deliveryAddressText: string | undefined = undefined;
      
      if (selectedAddressId && selectedAddressId.trim() !== "" && selectedAddressId !== "home" && selectedAddressId !== "office") {
        // Check if it's a valid UUID format (existing saved address)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(selectedAddressId)) {
          validAddressId = selectedAddressId;
        }
      } else if (addressLine1 && city) {
        // No saved address selected but manual address fields are filled
        const fullAddress = [addressLine1, addressLine2, city, state, pincode].filter(Boolean).join(", ");
        
        if (saveAddressForFuture) {
          // Only save to addresses table when user opts in
          try {
            const newAddress = await addressService.create({
              label: "My Location",
              address: fullAddress,
              landmark: addressLine2 || undefined,
              isDefault: false,
            });
            validAddressId = newAddress.id;
          } catch (addressError: any) {
            console.error("Error creating address:", addressError);
            toast({
              variant: "destructive",
              title: "Address Error",
              description: "Failed to save address. Please try again.",
            });
            setIsCreatingOrder(false);
            return;
          }
        } else {
          // Don't save to addresses table - just pass the address text with the order
          deliveryAddressText = fullAddress;
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
      
      // Check if this is a 60-min order by checking cart items
      // All items must have isSixtyMin: true for it to be a 60-min order
      const isSixtyMinOrder = cart.length > 0 && cart.every(item => item.isSixtyMin === true);
      
      // Create order using the appropriate service
      const orderData = {
        items: items,
        selectedAddons: selectedAddons.length > 0 ? selectedAddons : undefined,
        subtotal: subtotal,
        gst: gst,
        platformFee: deliveryCharges,
        packagingFee: packagingFee,
        total: grandTotal,
        deliveryDate: eventDate || undefined,
        deliveryTime: eventTime || undefined,
        addressId: validAddressId,
        deliveryAddress: deliveryAddressText,
      };
      
      if (isSixtyMinOrder) {
        // Save to sixty_min_bulk_orders table
        await sixtyMinBulkOrderService.create(orderData);
      } else {
        // Save to bulk_meal_orders table
        await bulkMealOrderService.create(orderData);
      }
      
      // Clear the flag (no longer primary source of truth, but clean up anyway)
      localStorage.removeItem(SIXTY_MIN_ORDER_FLAG);
      
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
      <div className="bg-white px-4 pt-16 pb-4 border-b border-gray-100 sticky top-0 z-50">
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
          {/* When - Date Selection */}
          <DeliveryDatePicker
            value={eventDate}
            onChange={setEventDate}
            minDate={new Date(minDateTime.date)}
          />

          {/* Delivery Time Selection */}
          <DeliveryTimePicker
            mealType="all"
            value={eventTime}
            onChange={setEventTime}
            selectedDate={eventDate}
          />

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
                  checked={saveAddressForFuture}
                  onChange={(e) => setSaveAddressForFuture(e.target.checked)}
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

          {/* Coupon Input */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              Have a Coupon Code?
            </label>
            <CouponInput
              subtotal={subtotal}
              orderType="bulk_meal"
              deliveryFee={baseDeliveryCharges}
              onCouponApply={handleCouponApply}
              onCouponRemove={handleCouponRemove}
              appliedCoupon={appliedCoupon}
            />
          </div>

          {/* Order Summary */}
          {(appliedCoupon || discount > 0) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Subtotal</span>
                <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Packaging Fee</span>
                <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{packagingFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Delivery Charges</span>
                <span style={{ fontFamily: "Sweet Sans Pro", color: appliedCoupon?.isFreeDelivery ? "#1A9952" : "#06352A" }}>
                  {appliedCoupon?.isFreeDelivery ? (
                    <><s className="text-gray-400 mr-1">₹{baseDeliveryCharges}</s> FREE</>
                  ) : (
                    `₹${deliveryCharges.toLocaleString('en-IN')}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>GST</span>
                <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{gst.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span style={{ fontFamily: "Sweet Sans Pro" }}>Discount ({appliedCoupon?.code})</span>
                  <span style={{ fontFamily: "Sweet Sans Pro" }}>-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>Total</span>
                <span style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
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
