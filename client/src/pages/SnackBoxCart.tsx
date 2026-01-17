import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContex";

import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { getSupabaseImageUrl } from "@/lib/supabase";
import dishFallbackImage from "@assets/stock_images/biryani_rice_dish_fo_8445bdd6.jpg";
import CouponInput from "@/components/CouponInput";
import { CouponValidationResult } from "@/lib/supabase-service";
import { useToast } from "@/hooks/use-toast";
import { analytics } from "@/lib/analytics";
import { facebookEvents } from "@/lib/facebook-capi";
import SuccessPopper from "@/components/SuccessPopper";

interface SuggestedDish {
    id: string;
    name: string;
    price: string | number;
    image_url?: string | null;
    category_id?: string;
    dietary_type?: string;
}

export default function SnackBoxCart() {
    const [, setLocation] = useLocation();
    const { cart, removeFromCart, updateQuantity, addToCart } = useCart();
    const { toast } = useToast();

    const [appliedCoupon, setAppliedCoupon] = useState<{
        id: string;
        code: string;
        discount: number;
        discountType: 'percentage' | 'fixed' | 'free_delivery';
        discountValue: number;
        maxDiscount?: number;
        isFreeDelivery?: boolean;
    } | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('snackBoxCoupon');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error('Failed to parse applied coupon', e);
                }
            }
        }
        return null;
    });
    const [isBusinessOrder, setIsBusinessOrder] = useState(false);
    const [gstNumber, setGstNumber] = useState("");
    const [showPopper, setShowPopper] = useState(false);
    const [popperSubtext, setPopperSubtext] = useState("");

    const handleCouponApply = (result: CouponValidationResult) => {
        if (result.valid && result.coupon && result.discount !== undefined) {
            const couponData = {
                id: result.coupon.id,
                code: result.coupon.code,
                discount: result.discount,
                discountType: result.coupon.discountType,
                discountValue: result.coupon.discountValue,
                maxDiscount: result.coupon.maxDiscount,
                isFreeDelivery: result.isFreeDelivery,
            };
            // Calculate dynamic discount for popper message
            let displayDiscount = result.discount;
            if (result.coupon.discountType === 'percentage') {
                const calculated = Math.floor(totalForCoupon * result.coupon.discountValue / 10) / 10;
                displayDiscount = result.coupon.maxDiscount ? Math.min(calculated, result.coupon.maxDiscount) : calculated;
            }

            // Show premium popper
            setPopperSubtext(result.isFreeDelivery ? "Free delivery applied!" : `You saved ₹${displayDiscount} with '${result.coupon.code}'`);
            setShowPopper(true);
            setAppliedCoupon(couponData);
            localStorage.setItem('snackBoxCoupon', JSON.stringify(couponData));

            toast({
                title: "✓ Coupon Applied!",
                description: result.isFreeDelivery ? "Free delivery applied!" : `You saved ₹${displayDiscount}`,
                variant: "success",
                duration: 2000,
            });
        }
    };

    const handleCouponRemove = () => {
        setAppliedCoupon(null);
        localStorage.removeItem('snackBoxCoupon');
    };

    // Fetch dishes from snacks category for recommendations
    const { data: allDishes = [] } = useQuery<SuggestedDish[]>({
        queryKey: ['/api/dishes', 'snacks', 'all', 'all'],
        queryFn: getQueryFn({ on401: "returnNull" }),
        enabled: cart.length > 0,
    });

    const cartItemIds = new Set(cart.map(item => item.id));

    const filteredSuggestions = useMemo(() => {
        if (allDishes.length === 0) return [];
        const excludedNames = ["Grab & Go Box", "Anytime Snack Box", "Snackiee Pack", "Office Much Pack", "Office Munch Pack"].map(n => n.toLowerCase());
        const availableDishes = allDishes.filter(dish =>
            !cartItemIds.has(Number(dish.id.toString().replace('D-', ''))) &&
            !excludedNames.includes(dish.name.toLowerCase())
        );
        const shuffled = [...availableDishes].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 6);
    }, [allDishes, cartItemIds]);

    const handleAddSuggestion = (dish: SuggestedDish) => {
        const imageUrl = (() => {
            if (!dish.image_url) return dishFallbackImage;
            const raw = dish.image_url.trim();
            if (raw.startsWith('http')) return raw;
            const cleanRaw = raw.startsWith('/') ? raw.slice(1) : raw;
            const folder = dish.category_id === 'snack-box' ? 'snack-box/' : '';
            return `https://leltckltotobsibixhqo.supabase.co/storage/v1/object/public/dish_images/${folder}${cleanRaw}`;
        })();
        const dishId = parseInt(dish.id.toString().replace('D-', '')) || 0;
        addToCart("snack-box", {
            id: dishId,
            name: dish.name,
            price: typeof dish.price === 'string' ? parseFloat(dish.price) : dish.price,
            quantity: 5,
            image: imageUrl,
        });
    };

    useEffect(() => {
        if (cart.length === 0) {
            setLocation("/snack-box");
        }
    }, [cart.length, setLocation]);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const packagingFee = Math.round(subtotal * 0.06);
    const baseDeliveryCharges = Math.min(2000, Math.max(199, Math.round(subtotal * 0.06)));
    const deliveryCharges = appliedCoupon?.isFreeDelivery ? 0 : baseDeliveryCharges;
    const gst = Math.round(subtotal * 0.05);

    // Use sum of all charges for coupon eligibility (total bill amount)
    const totalForCoupon = subtotal + packagingFee + baseDeliveryCharges + gst;

    const discount = useMemo(() => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.isFreeDelivery) return 0; // Handled by deliveryCharges
        if (appliedCoupon.discountType === 'percentage') {
            const calculated = Math.floor(totalForCoupon * appliedCoupon.discountValue / 10) / 10;
            return appliedCoupon.maxDiscount ? Math.min(calculated, appliedCoupon.maxDiscount) : calculated;
        }
        if (appliedCoupon.discountType === 'fixed') {
            return appliedCoupon.discountValue;
        }
        return appliedCoupon.discount || 0;
    }, [appliedCoupon, totalForCoupon]);

    const grandTotal = totalForCoupon - (appliedCoupon?.isFreeDelivery ? baseDeliveryCharges : 0) - (appliedCoupon?.isFreeDelivery ? 0 : discount);

    const handleQuantityChange = (itemId: string | number, change: number) => {
        const item = cart.find(i => i.id === itemId);
        if (item) {
            const newQuantity = Math.max(5, item.quantity + change);
            updateQuantity(Number(itemId), newQuantity);
        }
    };

    if (cart.length === 0) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white pb-32">
            <SuccessPopper
                isVisible={showPopper}
                onComplete={() => setShowPopper(false)}
                text="COUPON APPLIED!"
                subtext={popperSubtext}
            />
            <div className="bg-white px-4 pt-16 pb-4 border-b border-gray-100 sticky top-0 z-50">
                <button
                    onClick={() => setLocation("/snack-box")}
                    className="flex items-center gap-2 text-gray-700"
                    data-testid="button-back"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-semibold" style={{ fontFamily: "Sweet Sans Pro" }}>Back</span>
                </button>
            </div>

            <div className="px-4 py-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-6" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Your Snack Box Cart
                </h2>

                <div
                    className="relative bg-white rounded-xl p-4 sm:p-6 mb-6 border border-gray-200"
                    style={{
                        backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 20px,
                rgba(0,0,0,0.02) 20px,
                rgba(0,0,0,0.02) 21px
              )
            `,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                    }}
                >
                    <div className="text-center mb-6 pb-4 border-b-2 border-dashed border-gray-300">
                        <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                            ORDER SUMMARY
                        </h3>
                        <p className="text-xs text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {cart.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
                            >
                                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                                    <img
                                        src={item.image || dishFallbackImage}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                                        ₹{item.price.toLocaleString('en-IN')} per serving
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            onClick={() => handleQuantityChange(item.id, -1)}
                                            disabled={item.quantity <= 5}
                                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${item.quantity <= 5
                                                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                                : 'border-gray-300 hover:border-green-500 text-gray-600'
                                                }`}
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="font-bold text-sm w-8 text-center" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => handleQuantityChange(item.id, 1)}
                                            className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-green-500 text-gray-600"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                    <span className="font-bold text-base" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                                    </span>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-dashed border-gray-300">
                        <span className="font-bold text-base" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                            Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'})
                        </span>
                        <span className="font-bold text-xl" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                            ₹{subtotal.toLocaleString('en-IN')}
                        </span>
                    </div>
                </div>

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
                                >
                                    <img
                                        src={(() => {
                                            if (!dish.image_url) return dishFallbackImage;
                                            const raw = dish.image_url.trim();
                                            if (raw.startsWith('http')) return raw;
                                            const cleanRaw = raw.startsWith('/') ? raw.slice(1) : raw;
                                            const folder = dish.category_id === 'snack-box' ? 'snack-box/' : '';
                                            return `https://leltckltotobsibixhqo.supabase.co/storage/v1/object/public/dish_images/${folder}${cleanRaw}`;
                                        })()}
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
                                        >
                                            <Plus className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div
                    className="mb-6 rounded-xl p-4 border-2 transition-all cursor-pointer"
                    style={{
                        backgroundColor: isBusinessOrder ? "#E8F5EE" : "#FAFAFA",
                        borderColor: isBusinessOrder ? "#1A9952" : "#E5E7EB"
                    }}
                    onClick={() => setIsBusinessOrder(!isBusinessOrder)}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all"
                            style={{
                                borderColor: isBusinessOrder ? "#1A9952" : "#D1D5DB",
                                backgroundColor: isBusinessOrder ? "#1A9952" : "white"
                            }}
                        >
                            {isBusinessOrder && (
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <span
                                className="font-semibold text-sm"
                                style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
                            >
                                Business Order
                            </span>
                            <p className="text-xs text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                                Get GST invoice for your order
                            </p>
                        </div>
                    </div>
                    {isBusinessOrder && (
                        <div className="mt-4 pt-4 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                            <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                Enter GST Number
                            </label>
                            <input
                                type="text"
                                value={gstNumber}
                                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                                placeholder="e.g., 29ABCDE1234F1Z5"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1A9952] bg-white"
                                style={{ fontFamily: "Sweet Sans Pro" }}
                            />
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        Coupons & Offers
                    </label>
                    <CouponInput
                        subtotal={totalForCoupon}
                        orderType="snack_box"
                        deliveryFee={baseDeliveryCharges}
                        onCouponApply={handleCouponApply}
                        onCouponRemove={handleCouponRemove}
                        appliedCoupon={appliedCoupon}
                    />
                </div>

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
                            Packaging (6%)
                        </span>
                        <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                            ₹{packagingFee.toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700" style={{ fontFamily: "Sweet Sans Pro" }}>
                            Delivery Charges (6%)
                        </span>
                        <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: appliedCoupon?.isFreeDelivery ? "#1A9952" : "#06352A" }}>
                            {appliedCoupon?.isFreeDelivery ? (
                                <><s className="text-gray-400 mr-1">₹{baseDeliveryCharges}</s> FREE</>
                            ) : (
                                `₹${deliveryCharges.toLocaleString('en-IN')}`
                            )}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700" style={{ fontFamily: "Sweet Sans Pro" }}>
                            GST (5%)
                        </span>
                        <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                            ₹{gst.toLocaleString('en-IN')}
                        </span>
                    </div>
                    {discount > 0 && (
                        <div className="flex items-center justify-between text-green-600">
                            <span className="text-sm" style={{ fontFamily: "Sweet Sans Pro" }}>
                                Discount ({appliedCoupon?.code})
                            </span>
                            <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro" }}>
                                -₹{discount.toLocaleString('en-IN')}
                            </span>
                        </div>
                    )}
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

                <Button
                    onClick={() => {
                        analytics.trackCheckoutStarted(grandTotal, cart.length, 'snack_box').catch(() => { });
                        facebookEvents.trackInitiateCheckout(grandTotal, cart.length, cart.map(item => item.id.toString()), 'INR');
                        setLocation("/snack-box-addons");
                    }}
                    className="w-full py-6 text-lg font-semibold border-0"
                    style={{
                        fontFamily: "Sweet Sans Pro",
                        backgroundColor: "#1A9952",
                        color: "white",
                        borderRadius: "10px"
                    }}
                >
                    Proceed to Add-Ons →
                </Button>
            </div>


        </div>
    );
}
