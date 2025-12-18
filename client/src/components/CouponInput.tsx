import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, X, Check, AlertCircle, Truck, ChevronRight, Ticket, Lock } from "lucide-react";
import { couponService, CouponValidationResult } from "@/lib/supabase-service";
import { useQuery } from "@tanstack/react-query";

interface CouponInputProps {
  subtotal: number;
  orderType?: 'regular' | 'bulk_meal' | 'mealbox' | 'catering' | 'corporate';
  mealTypes?: string[];
  deliveryFee?: number;
  onCouponApply: (result: CouponValidationResult) => void;
  onCouponRemove: () => void;
  appliedCoupon?: {
    code: string;
    name?: string;
    discount: number;
    discountType: 'percentage' | 'fixed' | 'free_delivery';
    discountValue: number;
    isFreeDelivery?: boolean;
  } | null;
}

export default function CouponInput({ 
  subtotal, 
  orderType = 'regular',
  mealTypes = [],
  deliveryFee = 40,
  onCouponApply, 
  onCouponRemove,
  appliedCoupon 
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showAllCoupons, setShowAllCoupons] = useState(false);

  const { data: couponsData, isLoading: isLoadingCoupons } = useQuery({
    queryKey: ['all-coupons-with-eligibility', orderType, subtotal],
    queryFn: () => couponService.getAllCouponsWithEligibility(orderType, subtotal),
    staleTime: 0, // No cache for debugging
  });

  const eligibleCoupons = couponsData?.eligible || [];
  const ineligibleCoupons = couponsData?.ineligible || [];
  const totalCoupons = eligibleCoupons.length + ineligibleCoupons.length;
  
  console.log('Coupon eligibility data:', { eligibleCoupons, ineligibleCoupons, orderType });

  const handleApplyCoupon = async (code?: string) => {
    const codeToApply = code || couponCode.trim();
    if (!codeToApply) {
      setError("Please enter a coupon code");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const result = await couponService.validate(codeToApply, {
        orderTotal: subtotal,
        orderType,
        mealTypes,
        deliveryFee,
      });
      
      if (result.valid && result.coupon && result.discount !== undefined) {
        onCouponApply(result);
        setCouponCode("");
        setShowManualEntry(false);
      } else {
        setError(result.error || "Invalid coupon code");
      }
    } catch (err) {
      setError("Failed to validate coupon. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    onCouponRemove();
    setCouponCode("");
    setError(null);
  };

  if (appliedCoupon) {
    const getDiscountLabel = () => {
      if (appliedCoupon.discountType === 'free_delivery' || appliedCoupon.isFreeDelivery) {
        return 'Free Delivery';
      }
      if (appliedCoupon.discountType === 'percentage') {
        return `${appliedCoupon.discountValue}% off`;
      }
      return `₹${appliedCoupon.discountValue} off`;
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            {appliedCoupon.isFreeDelivery ? (
              <Truck className="w-4 h-4 text-green-600" />
            ) : (
              <Check className="w-4 h-4 text-green-600" />
            )}
            <div>
              <span className="font-medium text-green-800">{appliedCoupon.code}</span>
              <p className="text-xs text-green-600">{getDiscountLabel()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {appliedCoupon.isFreeDelivery ? 'FREE' : `-₹${appliedCoupon.discount}`}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-700 hover:text-red-600 hover:bg-red-50"
              onClick={handleRemoveCoupon}
              data-testid="button-remove-coupon"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isLoadingCoupons ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading available coupons...</span>
        </div>
      ) : (eligibleCoupons.length > 0 || ineligibleCoupons.length > 0) && !showManualEntry ? (
        <div className="space-y-2">
          {(showAllCoupons ? eligibleCoupons : eligibleCoupons.slice(0, 2)).map((coupon) => (
            <div
              key={coupon.id}
              className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
              data-testid={`coupon-suggestion-${coupon.code}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm" style={{ fontFamily: "Sweet Sans Pro" }}>
                    {coupon.savingsText} with '{coupon.code}'
                  </p>
                  {coupon.description && (
                    <p className="text-xs text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                      {coupon.description}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleApplyCoupon(coupon.code)}
                disabled={isValidating || (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount)}
                className="text-amber-600 border-amber-300 hover:bg-amber-100 hover:text-amber-700 font-semibold"
                style={{ fontFamily: "Sweet Sans Pro" }}
                data-testid={`button-apply-${coupon.code}`}
              >
                {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : "APPLY"}
              </Button>
            </div>
          ))}
          
          {showAllCoupons && ineligibleCoupons.map((coupon) => (
            <div
              key={coupon.id}
              className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-60"
              data-testid={`coupon-ineligible-${coupon.code}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-500 text-sm" style={{ fontFamily: "Sweet Sans Pro" }}>
                    {coupon.savingsText} with '{coupon.code}'
                  </p>
                  <p className="text-xs text-red-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                    {coupon.reason}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="text-gray-400 border-gray-200 cursor-not-allowed font-semibold"
                style={{ fontFamily: "Sweet Sans Pro" }}
                data-testid={`button-apply-${coupon.code}-disabled`}
              >
                APPLY
              </Button>
            </div>
          ))}
          
          {totalCoupons > 2 && !showAllCoupons && (
            <button
              onClick={() => setShowAllCoupons(true)}
              className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium px-1"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="button-view-all-coupons"
            >
              View all {totalCoupons} coupons
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          
          {showAllCoupons && totalCoupons > 2 && (
            <button
              onClick={() => setShowAllCoupons(false)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-1"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="button-show-less"
            >
              ← Show less
            </button>
          )}
          
          <button
            onClick={() => setShowManualEntry(true)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-1"
            style={{ fontFamily: "Sweet Sans Pro" }}
            data-testid="button-enter-code"
          >
            Have a different code?
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                className="pl-10 uppercase"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyCoupon();
                  }
                }}
                data-testid="input-coupon-code"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => handleApplyCoupon()}
              disabled={isValidating || !couponCode.trim()}
              data-testid="button-apply-coupon"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Apply"
              )}
            </Button>
          </div>
          
          {(eligibleCoupons.length > 0 || ineligibleCoupons.length > 0) && showManualEntry && (
            <button
              onClick={() => setShowManualEntry(false)}
              className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="button-show-suggestions"
            >
              ← View available coupons
            </button>
          )}
          
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span data-testid="text-coupon-error">{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
