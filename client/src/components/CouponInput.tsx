import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, X, Check, AlertCircle } from "lucide-react";
import { couponService, CouponValidationResult } from "@/lib/supabase-service";

interface CouponInputProps {
  subtotal: number;
  onCouponApply: (result: CouponValidationResult) => void;
  onCouponRemove: () => void;
  appliedCoupon?: {
    code: string;
    discount: number;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  } | null;
}

export default function CouponInput({ 
  subtotal, 
  onCouponApply, 
  onCouponRemove,
  appliedCoupon 
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const result = await couponService.validate(couponCode, subtotal);
      
      if (result.valid && result.coupon && result.discount !== undefined) {
        onCouponApply(result);
        setCouponCode("");
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
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600" />
            <div>
              <span className="font-medium text-green-800">{appliedCoupon.code}</span>
              <p className="text-xs text-green-600">
                {appliedCoupon.discountType === 'percentage' 
                  ? `${appliedCoupon.discountValue}% off` 
                  : `₹${appliedCoupon.discountValue} off`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              -₹{appliedCoupon.discount}
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
          onClick={handleApplyCoupon}
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
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span data-testid="text-coupon-error">{error}</span>
        </div>
      )}
    </div>
  );
}
