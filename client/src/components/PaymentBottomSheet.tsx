"use client"

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreditCard, Smartphone, Building2, Wallet, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface PaymentBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  orderId?: string;
  description?: string;
  orderType?: 'regular' | 'bulk_meal' | 'snack_box' | 'meal_box' | 'catering' | 'corporate';
  orderData?: any;
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentError?: (error: string) => void;
}

type PaymentMethod = "upi" | "card" | "netbanking" | "wallet";

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: "upi",
    name: "UPI",
    icon: <Smartphone className="h-6 w-6" />,
    description: "Pay using UPI apps like PhonePe, Google Pay, Paytm",
    available: true,
  },
  {
    id: "card",
    name: "Cards",
    icon: <CreditCard className="h-6 w-6" />,
    description: "Credit, Debit & Prepaid Cards",
    available: true,
  },
  {
    id: "netbanking",
    name: "Net Banking",
    icon: <Building2 className="h-6 w-6" />,
    description: "Pay directly from your bank account",
    available: true,
  },
  {
    id: "wallet",
    name: "Wallets",
    icon: <Wallet className="h-6 w-6" />,
    description: "Paytm, Amazon Pay, and more",
    available: true,
  },
];

export default function PaymentBottomSheet({
  open,
  onOpenChange,
  amount,
  orderId,
  description = "Order Payment",
  orderType = 'regular',
  orderData,
  onPaymentSuccess,
  onPaymentError,
}: PaymentBottomSheetProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const { toast } = useToast();

  // Use environment variables with fallback to hardcoded values (same as other files)
  // Define these outside the component to ensure they're always available
  const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://leltckltotobsibixhqo.supabase.co').trim();
  const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbHRja2x0b3RvYnNpYml4aHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzc5ODEsImV4cCI6MjA3NTk1Mzk4MX0._IrMgGQDJB7OvKEoT7pwWG9AjN6aeN1ejnj8IViDLyE').trim();
  
  // Debug log to verify values
  if (typeof window !== 'undefined') {
    console.log('[PaymentBottomSheet] Supabase config:', {
      url: SUPABASE_URL,
      hasKey: !!SUPABASE_ANON_KEY,
      keyLength: SUPABASE_ANON_KEY?.length,
    });
  }

  // Load Razorpay script if not already loaded
  useEffect(() => {
    if (typeof window.Razorpay !== "undefined") {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        console.log('[PaymentBottomSheet] Razorpay script loaded');
      }
    };
    script.onerror = () => {
      toast({
        title: "Payment Error",
        description: "Failed to load payment gateway. Please refresh the page.",
        variant: "destructive",
      });
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount - let it persist
    };
  }, [toast]);

  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    if (isProcessing) return;
    
    setSelectedMethod(method);
    setIsProcessing(true);

    try {
      // Validate Supabase config
      if (!SUPABASE_URL || SUPABASE_URL === 'undefined' || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'undefined') {
        throw new Error("Payment service configuration error. Please refresh the page.");
      }

      console.log("[PaymentBottomSheet] Initiating payment with method:", method, {
        endpoint: `${SUPABASE_URL}/functions/v1/razorpay/key`,
        hasSupabaseUrl: !!SUPABASE_URL && SUPABASE_URL !== 'undefined',
        hasAnonKey: !!SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'undefined',
      });

      // First, get Razorpay key ID
      const keyResponse = await fetch(`${SUPABASE_URL}/functions/v1/razorpay/key`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (!keyResponse.ok) {
        throw new Error("Failed to get Razorpay key");
      }

      const { keyId } = await keyResponse.json();

      // Create Razorpay order (not payment link - we'll use Checkout.js modal)
      const createOrderResponse = await fetch(`${SUPABASE_URL}/functions/v1/razorpay/create-order`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to paise
          currency: "INR",
          receipt: orderId || `receipt_${Date.now()}`,
        }),
      });

      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json();
        throw new Error(errorData.error || "Failed to create payment order");
      }

      const { orderId: razorpayOrderId } = await createOrderResponse.json();

      // Store order data in sessionStorage for order creation after payment
      if (orderData && razorpayOrderId) {
        const orderDataKey = `pending_order_${razorpayOrderId}`;
        sessionStorage.setItem(orderDataKey, JSON.stringify({
          orderData,
          orderType,
          orderId: razorpayOrderId,
          timestamp: Date.now(),
        }));
      }

      // Check if Razorpay is loaded
      if (!razorpayLoaded || typeof window.Razorpay === "undefined") {
        throw new Error("Payment gateway is loading. Please wait a moment and try again.");
      }

      // Close the bottom sheet before opening Razorpay modal
      onOpenChange(false);

      // Open Razorpay Checkout modal with safe area support
      const razorpay = new window.Razorpay({
        key: keyId,
        amount: Math.round(amount * 100), // Amount in paise
        currency: "INR",
        name: "Plattr",
        description: description || "Order Payment",
        order_id: razorpayOrderId,
        handler: function (response: any) {
          // Payment successful - redirect to callback page
          const params = new URLSearchParams({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
          window.location.href = `/payment-callback?${params.toString()}`;
        },
        prefill: {
          // You can add user details here if available
        },
        theme: {
          color: "#1A9952", // Your brand color
        },
        modal: {
          ondismiss: function() {
            // User closed the modal
            setIsProcessing(false);
            setSelectedMethod(null);
            onPaymentError?.("Payment cancelled");
          },
        },
        // Ensure modal respects safe areas
        config: {
          display: {
            blocks: {
              [method]: {
                name: method === "upi" ? "UPI" : method === "card" ? "Cards" : method === "netbanking" ? "Net Banking" : "Wallets",
                instruments: [
                  {
                    method: method,
                  },
                ],
              },
            },
            sequence: [method],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
      });

      // Apply safe area styles to Razorpay modal
      razorpay.on("ready", function() {
        // Add safe area padding to Razorpay modal container
        const style = document.createElement("style");
        style.textContent = `
          .razorpay-container,
          [id*="razorpay"],
          [class*="razorpay"] {
            padding-top: env(safe-area-inset-top, 0px) !important;
            padding-bottom: env(safe-area-inset-bottom, 0px) !important;
            padding-left: env(safe-area-inset-left, 0px) !important;
            padding-right: env(safe-area-inset-right, 0px) !important;
          }
          iframe[src*="razorpay"] {
            margin-top: 0 !important;
          }
        `;
        document.head.appendChild(style);
      });

      razorpay.open();
      
      // Reset processing state after a delay (modal is now open)
      setTimeout(() => {
        setIsProcessing(false);
        setSelectedMethod(null);
      }, 500);

    } catch (error: any) {
      console.error("[PaymentBottomSheet] Error:", error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      onPaymentError?.(error.message);
      setIsProcessing(false);
      setSelectedMethod(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] p-0 max-h-[85vh] payment-bottom-sheet"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
          bottom: 'env(safe-area-inset-bottom, 0px)',
          top: 'auto',
          maxHeight: 'calc(85vh - env(safe-area-inset-bottom, 0px))',
        }}
      >
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="text-2xl font-semibold">Select Payment Method</SheetTitle>
          <SheetDescription>
            Pay ₹{amount.toFixed(2)} securely
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => handlePaymentMethodSelect(method.id)}
                disabled={!method.available || isProcessing}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all text-left",
                  "hover:border-primary hover:bg-primary/5",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  selectedMethod === method.id && "border-primary bg-primary/10",
                  !method.available && "opacity-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-lg",
                    selectedMethod === method.id ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{method.name}</div>
                    <div className="text-sm text-muted-foreground">{method.description}</div>
                  </div>
                  {isProcessing && selectedMethod === method.id && (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-6 border-t bg-muted/50">
          <div className="text-xs text-muted-foreground text-center">
            Your payment is secured by Razorpay. We never store your card details.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
