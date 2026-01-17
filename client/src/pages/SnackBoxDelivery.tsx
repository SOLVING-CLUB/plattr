import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import { useCart } from "@/context/CartContex";

import { snackBoxOrderService, addressService } from "@/lib/supabase-service";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import DeliveryTimePicker from "@/components/DeliveryTimePicker";
import DeliveryDatePicker from "@/components/DeliveryDatePicker";
import { validateBangalorePincode, BANGALORE_VALIDATION_ERROR } from "@/lib/addressValidation";
import { analytics } from "@/lib/analytics";
import { facebookEvents } from "@/lib/facebook-capi";
import { getCurrentPosition, getLocationPermissionInstructions } from "@/lib/locationPermission";

export default function SnackBoxDelivery() {
    const [, setLocation] = useLocation();
    const { cart, clearCart } = useCart();
    const { toast } = useToast();

    const [isCreatingOrder, setIsCreatingOrder] = useState(false);

    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [pincode, setPincode] = useState("");

    const [phone, setPhone] = useState(() => {
        const savedPhone = localStorage.getItem('phone');
        return savedPhone ? `+91 ${savedPhone}` : "";
    });
    const [email, setEmail] = useState(() => {
        const savedEmail = localStorage.getItem('email') || "";
        return savedEmail.includes('@phone.plattr.app') ? "" : savedEmail;
    });
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [saveAddressForFuture, setSaveAddressForFuture] = useState(false);

    const [appliedCoupon, setAppliedCoupon] = useState<{
        id: string;
        code: string;
        discount: number;
        discountType: 'percentage' | 'fixed' | 'free_delivery';
        discountValue: number;
        isFreeDelivery?: boolean;
    } | null>(() => {
        const saved = localStorage.getItem('snackBoxCoupon');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return null;
            }
        }
        return null;
    });

    const getMinDateTime = () => {
        const minTime = new Date(Date.now() + 6 * 60 * 60 * 1000);
        return {
            date: minTime.toISOString().split('T')[0],
            time: `${minTime.getHours().toString().padStart(2, '0')}:00`
        };
    };

    const minDateTime = getMinDateTime();
    const [eventDate, setEventDate] = useState(minDateTime.date);
    const [eventTime, setEventTime] = useState(minDateTime.time);

    const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
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
    }, []);

    const getCurrentLocation = () => {
        setLocation("/location/map?redirect=/snack-box-delivery");
    };

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
            setLocation("/snack-box");
            return;
        }

        const savedLocation = localStorage.getItem('activeLocation');
        if (savedLocation) {
            try {
                const { lat, lng } = JSON.parse(savedLocation);
                if (lat && lng) {
                    reverseGeocode(lat, lng);
                }
            } catch (e) {
                console.error("Error parsing saved location:", e);
            }
        }
    }, [cart.length, setLocation, reverseGeocode]);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const packagingFee = Math.round(subtotal * 0.06);
    const baseDeliveryCharges = Math.min(2000, Math.max(199, Math.round(subtotal * 0.06)));
    const deliveryCharges = appliedCoupon?.isFreeDelivery ? 0 : baseDeliveryCharges;
    const gst = Math.round(subtotal * 0.05);

    // Use sum of all charges for coupon eligibility (total bill amount)
    const totalForCoupon = subtotal + packagingFee + baseDeliveryCharges + gst;

    const discount = (() => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.isFreeDelivery) return 0; // Handled by deliveryCharges
        if (appliedCoupon.discountType === 'percentage') {
            return Math.floor(totalForCoupon * appliedCoupon.discountValue / 10) / 10;
        }
        if (appliedCoupon.discountType === 'fixed') {
            return appliedCoupon.discountValue;
        }
        return appliedCoupon.discount || 0;
    })();

    const grandTotal = totalForCoupon - (appliedCoupon?.isFreeDelivery ? baseDeliveryCharges : 0) - (appliedCoupon?.isFreeDelivery ? 0 : discount);

    const handleSubmit = async () => {
        try {
            setIsCreatingOrder(true);

            // Check 6-hour minimum advance booking
            if (eventDate) {
                // Support "1:00 PM - 2:00 PM" format from DeliveryTimePicker
                const timeToParse = eventTime?.includes(" - ")
                    ? eventTime.split(" - ")[0]
                    : (eventTime || "12:00");

                // Normalize format for Date constructor if it's like "1:00 PM"
                let ISOtime = timeToParse;
                if (timeToParse.includes("AM") || timeToParse.includes("PM")) {
                    const [time, modifier] = timeToParse.split(" ");
                    let [hours, minutes] = time.split(":");
                    if (hours === "12") hours = "00";
                    if (modifier === "PM") hours = (parseInt(hours, 10) + 12).toString();
                    ISOtime = `${hours.padStart(2, "0")}:${minutes}`;
                }

                const selectedDateTime = new Date(`${eventDate}T${ISOtime}`);
                const now = new Date();
                const hoursDiff = (selectedDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

                if (hoursDiff < 6) {
                    toast({
                        title: "Invalid Date/Time",
                        description: "Please select a date and time at least 6 hours from now.",
                        variant: "destructive",
                    });
                    setIsCreatingOrder(false);
                    return;
                }
            }

            let validAddressId: string | undefined = undefined;
            let deliveryAddressText: string | undefined = undefined;

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const hasSavedAddress = selectedAddressId && uuidRegex.test(selectedAddressId);

            if (hasSavedAddress) {
                validAddressId = selectedAddressId;
            } else {
                if (!addressLine1 || !addressLine1.trim()) {
                    toast({ title: "Address Required", description: "Please enter Address Line 1.", variant: "destructive" });
                    setIsCreatingOrder(false);
                    return;
                }
                if (!city || !city.trim()) {
                    toast({ title: "City Required", description: "Please enter the city.", variant: "destructive" });
                    setIsCreatingOrder(false);
                    return;
                }
                if (!pincode || !pincode.trim()) {
                    toast({ title: "Pincode Required", description: "Please enter the pincode.", variant: "destructive" });
                    setIsCreatingOrder(false);
                    return;
                }
                if (!validateBangalorePincode(pincode)) {
                    toast({ title: BANGALORE_VALIDATION_ERROR.title, description: "Please enter a valid Bangalore pincode (starting with 560).", variant: "destructive" });
                    setIsCreatingOrder(false);
                    return;
                }

                const fullAddress = [addressLine1, addressLine2, city, state, pincode].filter(Boolean).join(", ");
                if (saveAddressForFuture) {
                    const newAddress = await addressService.create({
                        label: "My Location",
                        address: fullAddress,
                        landmark: addressLine2 || undefined,
                        isDefault: false,
                    });
                    validAddressId = newAddress.id;
                } else {
                    deliveryAddressText = fullAddress;
                }
            }

            const SNACK_BOX_ADDONS_KEY = "snackBoxAddons";
            let selectedAddons: string[] = [];
            const storedAddons = localStorage.getItem(SNACK_BOX_ADDONS_KEY);
            if (storedAddons) {
                try {
                    selectedAddons = JSON.parse(storedAddons);
                } catch {
                    selectedAddons = [];
                }
            }

            const items = cart.map(item => ({
                dishId: item.id.toString(),
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                metadata: item.metadata
            }));

            await snackBoxOrderService.create({
                items: items,
                selectedAddons: selectedAddons,
                subtotal: subtotal,
                gst: gst,
                platformFee: deliveryCharges,
                packagingFee: packagingFee,
                total: grandTotal,
                deliveryDate: eventDate,
                deliveryTime: eventTime,
                addressId: validAddressId,
                deliveryAddress: deliveryAddressText,
                couponId: appliedCoupon?.id || undefined,
                discountApplied: discount,
            });

            localStorage.removeItem("snackBoxAddons");
            localStorage.removeItem("snackBoxCoupon");
            clearCart();

            const orderId = `snack-box-${Date.now()}`;
            analytics.trackOrderCompleted(orderId, grandTotal, cart.length, 'pending').catch(() => { });
            facebookEvents.trackPurchase(orderId, grandTotal, cart.length, cart.map(item => String(item.id)));

            toast({
                title: "Order Created!",
                description: "Your snack box order has been placed successfully.",
            });

            setLocation("/snack-box-thank-you");
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
            <div className="bg-white px-4 pt-16 pb-4 border-b border-gray-100 sticky top-0 z-50">
                <button
                    onClick={() => setLocation("/snack-box-addons")}
                    className="flex items-center gap-2 text-gray-700"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-semibold" style={{ fontFamily: "Sweet Sans Pro" }}>Back</span>
                </button>
            </div>

            <div className="px-4 py-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-6" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Proceed to Payment
                </h2>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                    <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                        Total Amount to be Paid
                    </span>
                    <span className="font-bold text-xl" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                        ₹{grandTotal.toLocaleString('en-IN')}
                    </span>
                </div>

                <div className="space-y-4 mb-6">
                    <DeliveryDatePicker
                        value={eventDate}
                        onChange={setEventDate}
                        minDate={new Date(minDateTime.date)}
                    />

                    <DeliveryTimePicker
                        mealType="all"
                        value={eventTime}
                        onChange={setEventTime}
                        selectedDate={eventDate}
                    />

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                            Enter Your Phone Number
                        </label>
                        <input
                            type="tel"
                            placeholder="+91 98552 12375"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            style={{ fontFamily: "Sweet Sans Pro" }}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                            Enter Your Email Address
                        </label>
                        <input
                            type="email"
                            placeholder="example@gmail.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            style={{ fontFamily: "Sweet Sans Pro" }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                            Choose Saved Address (Optional)
                        </label>
                        <select
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            style={{ fontFamily: "Sweet Sans Pro", color: selectedAddressId ? "#06352A" : "#9CA3AF" }}
                            value={selectedAddressId}
                            onChange={(e) => handleSavedAddressChange(e.target.value)}
                        >
                            <option value="">Select Address (Optional)</option>
                            {savedAddresses.map((address: any) => (
                                <option key={address.id} value={address.id}>
                                    {address.label} {address.isDefault ? "(Default)" : ""}
                                </option>
                            ))}
                        </select>

                        {selectedAddress && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
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

                    <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-50 border-2 border-dashed border-green-500 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                        style={{ fontFamily: "Sweet Sans Pro" }}
                    >
                        <MapPin className="w-5 h-5 text-green-600" />
                        <span className="text-green-700 font-medium">
                            {isGettingLocation ? "Getting Location..." : "Use Current Location"}
                        </span>
                    </button>

                    {!isAddressFieldsDisabled && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    Address Line 1
                                </label>
                                <input
                                    type="text"
                                    placeholder="Door No. 32, Jaya Prakash Nagar"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    style={{ fontFamily: "Sweet Sans Pro" }}
                                    value={addressLine1}
                                    onChange={(e) => setAddressLine1(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    Address Line 2
                                </label>
                                <input
                                    type="text"
                                    placeholder="Near Metro Station, JP Nagar"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    style={{ fontFamily: "Sweet Sans Pro" }}
                                    value={addressLine2}
                                    onChange={(e) => setAddressLine2(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Bengaluru"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        style={{ fontFamily: "Sweet Sans Pro" }}
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                        Pincode
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="560001"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        style={{ fontFamily: "Sweet Sans Pro" }}
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value)}
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={saveAddressForFuture}
                                    onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                                    className="w-5 h-5 rounded border-2 border-gray-300"
                                    style={{ accentColor: "#1A9952" }}
                                />
                                <span className="text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    Save Address for future use
                                </span>
                            </label>
                        </>
                    )}

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
                                    {appliedCoupon?.isFreeDelivery ? "FREE" : `₹${deliveryCharges.toLocaleString('en-IN')}`}
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
                >
                    <span>Submit</span>
                    <span className="font-bold text-xl">
                        ₹{grandTotal.toLocaleString('en-IN')}
                    </span>
                </Button>
            </div>


        </div>
    );
}
