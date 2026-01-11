import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Calendar, MapPin, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import OrderSummaryCard from "@/components/OrderSummaryCard";
import DeliveryTimePicker from "@/components/DeliveryTimePicker";
import DeliveryDatePicker from "@/components/DeliveryDatePicker";
import CouponInput from "@/components/CouponInput";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getSupabaseImageUrl } from "@/lib/supabase";
import { addressService, couponService, CouponValidationResult, orderService } from "@/lib/supabase-service";
import { getQueryFn } from "@/lib/queryClient";
import { supabaseAuth } from "@/lib/supabase-auth";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cartStorage } from "@/lib/cartStorage";
import { useGoBack } from "@/hooks/useGoBack";
import { validateBangaloreAddress, BANGALORE_VALIDATION_ERROR } from "@/lib/addressValidation";
import { getApiUrl } from "@/config/api";

// Supabase configuration for Edge Functions
const SUPABASE_URL = 'https://leltckltotobsibixhqo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbHRja2x0b3RvYnNpYml4aHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzc5ODEsImV4cCI6MjA3NTk1Mzk4MX0._IrMgGQDJB7OvKEoT7pwWG9AjN6aeN1ejnj8IViDLyE';

// Generate next 7 days for delivery date selection
const generateDeliveryDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push({
      value: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    });
  }
  return dates;
};


interface CartItem {
  id: string;
  quantity: number;
  dish: {
    id: string;
    name: string;
    price: string;
    imageUrl: string;
    mealType: string[];
    categoryId: string | null;
    categoryName: string | null;
  };
}

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const goBack = useGoBack();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addressLabel, setAddressLabel] = useState('Home');
  const [landmark, setLandmark] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discount: number;
    discountType: 'percentage' | 'fixed' | 'free_delivery';
    discountValue: number;
    isFreeDelivery?: boolean;
  } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [orderDataToSubmit, setOrderDataToSubmit] = useState<{
    addressLabel: string;
    deliveryAddress: string;
    landmark: string;
    deliveryDate: string;
    deliveryTime: string;
  } | null>(null);
  const { toast } = useToast();

  // Load Razorpay script and get key ID
  useEffect(() => {
    // Fetch Razorpay key ID from Supabase Edge Function
    fetch(`${SUPABASE_URL}/functions/v1/razorpay`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(errorData.error || `Failed to fetch payment key: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.keyId) {
          setRazorpayKeyId(data.keyId);
          console.log('[CheckoutPage] Razorpay key loaded successfully');
        } else if (data.error) {
          console.error('Failed to get Razorpay key ID:', data.error);
          // Don't show toast on initial load - only show if user tries to pay
          console.warn('[CheckoutPage] Payment gateway not configured:', data.error);
        } else {
          console.error('Invalid response format from payment key endpoint');
          console.warn('[CheckoutPage] Payment gateway not configured');
        }
      })
      .catch(error => {
        console.error('Error fetching Razorpay key:', error);
        // Don't show toast on initial load - only show if user tries to pay
        console.warn('[CheckoutPage] Payment gateway initialization failed:', error.message);
      });

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      toast({
        title: "Payment Error",
        description: "Failed to load payment gateway. Please refresh the page.",
        variant: "destructive",
      });
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [toast]);

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

  // Fetch cart items using session authentication (merge with localStorage for guests)
  const { data: apiCartItems, isLoading } = useQuery<CartItem[] | null>({
    queryKey: ['/api/cart'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Use server cart for authenticated users, localStorage for guests only
  const cartItems: CartItem[] = apiCartItems !== null && apiCartItems !== undefined
    ? apiCartItems // Authenticated: server cart only
    : apiCartItems === null // Guest: localStorage only
      ? cartStorage.getCart().map((item) => ({
          id: `local-${item.dishId}`,
          quantity: item.quantity,
          dish: {
            ...item.dish,
            categoryName: null
          }
        }))
      : []; // Loading: empty array

  // Check if user is authenticated (apiCartItems: undefined = loading, null = guest, array = authenticated)
  const isAuthenticated = Array.isArray(apiCartItems);

  // Calculate initial payment amount based on payment schedule
  const calculateInitialPayment = () => {
    // Case 4: If total <= ₹700, pay full amount
    if (total <= 700) {
      return total;
    }

    if (!deliveryDate) return total;

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const delivery = new Date(deliveryDate);
    const deliveryStart = new Date(
      delivery.getFullYear(),
      delivery.getMonth(),
      delivery.getDate()
    );

    const diffMs = deliveryStart.getTime() - todayStart.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Case 3: Same day delivery - pay full amount
    if (diffDays < 1) {
      return total;
    }

    // Case 1: Gap >= 2 days - pay 10% initially
    if (diffDays >= 2) {
      return Math.round(total * 0.1);
    }
    
    // Case 2: Gap < 2 days (but not same day) - pay 80% initially
    return Math.round(total * 0.8);
  };

  const getPaymentButtonText = () => {
    // Case 4: If total <= ₹700, show "Pay Now"
    if (total <= 700) {
      return "Pay Now";
    }

    if (!deliveryDate) return "Pay Now";

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const delivery = new Date(deliveryDate);
    const deliveryStart = new Date(
      delivery.getFullYear(),
      delivery.getMonth(),
      delivery.getDate()
    );

    const diffMs = deliveryStart.getTime() - todayStart.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Case 3: Same day delivery - show "Pay Now"
    if (diffDays < 1) {
      return "Pay Now";
    }

    // Case 1 & 2: Show "Pay Initial Amount & Place Order"
    return "Pay Initial Amount & Place Order";
  };

  // Create Razorpay order and process payment
  // Handle payment only
  const handlePayment = async () => {
    // Validation
      if (!deliveryAddress.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your delivery address",
        variant: "destructive",
      });
      return;
      }

      if (!deliveryDate || !deliveryTime) {
      toast({
        title: "Validation Error",
        description: "Please select delivery date and time",
        variant: "destructive",
      });
      return;
      }

      // Validate Bangalore address
      if (!validateBangaloreAddress(deliveryAddress)) {
      toast({
          title: BANGALORE_VALIDATION_ERROR.title,
        description: BANGALORE_VALIDATION_ERROR.description,
        variant: "destructive",
      });
      return;
      }

    // For guests, skip payment and show message
    if (!isAuthenticated) {
      toast({
        title: "Thank You!",
        description: "We've received your order. Our team will contact you shortly!",
      });
      setTimeout(() => {
        setLocation('/order-confirmation', { replace: true });
      }, 100);
      return;
    }

    if (!razorpayLoaded) {
      toast({
        title: "Payment Error",
        description: "Payment gateway is loading. Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    // Store order data for later use
    setOrderDataToSubmit({
      addressLabel,
      deliveryAddress,
      landmark,
      deliveryDate,
      deliveryTime,
    });

    setIsProcessingPayment(true);

    try {
      const initialPaymentAmount = calculateInitialPayment();

      // Step 1: Create Razorpay order via Supabase Edge Function
      const createOrderResponse = await fetch(`${SUPABASE_URL}/functions/v1/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: initialPaymentAmount,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
        }),
      });

      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const { orderId, amount } = await createOrderResponse.json();

      // Step 2: Check if Razorpay key is available
      if (!razorpayKeyId) {
        throw new Error('Payment gateway key not available. Please refresh the page.');
      }

      // Step 3: Open Razorpay checkout
      const razorpay = (window as any).Razorpay({
        key: razorpayKeyId,
        amount: amount,
        currency: 'INR',
        name: 'Plattr',
        description: 'Order Payment',
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // Step 4: Verify payment via Supabase Edge Function
            const verifyResponse = await fetch(`${SUPABASE_URL}/functions/v1/razorpay/verify`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyData.verified) {
              throw new Error('Payment verification failed');
            }

            // Payment verified successfully
            setPaymentVerified(true);
            
            // Send REAL push notification via FCM (not a toast!)
            const userId = localStorage.getItem('userId');
            if (userId) {
              fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: userId,
                  title: '💳 Payment Successful!',
                  body: `₹${(amount / 100).toFixed(0)} payment verified. Tap to complete your order.`,
                  event_name: 'payment_success',
                  category: 'transactional',
                  deep_link: 'plattr://checkout',
                }),
              }).catch(err => console.log('[Notification] Failed to send payment notification:', err));
            }
          } catch (error: any) {
            console.error('Payment verification error:', error);
            // Send error notification via FCM
            const userId = localStorage.getItem('userId');
            if (userId) {
              fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  user_id: userId,
                  title: '❌ Payment Failed',
                  body: error.message || 'Failed to verify payment. Please try again or contact support.',
                  event_name: 'payment_failed',
                  category: 'transactional',
                }),
              }).catch(err => console.log('[Notification] Failed to send error notification:', err));
            }
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          // You can prefill customer details if available
        },
        theme: {
          color: '#1A9952', // Match your app's primary color
        },
        modal: {
          ondismiss: function() {
            console.log('[CheckoutPage] Razorpay modal dismissed');
            setIsProcessingPayment(false);
          },
        },
      });

      razorpay.open();
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  };

  // Handle order submission (after payment is verified)
  const handleSubmitOrder = async () => {
    if (!paymentVerified || !orderDataToSubmit) {
      toast({
        title: "Payment Required",
        description: "Please complete payment first before submitting the order.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingOrder(true);

      // Create address
      const address = await addressService.create({
        label: orderDataToSubmit.addressLabel,
        address: orderDataToSubmit.deliveryAddress,
        landmark: orderDataToSubmit.landmark || undefined,
        isDefault: false,
      });

      // Create order
      const order = await orderService.create(
        address.id,
        orderDataToSubmit.deliveryDate,
        orderDataToSubmit.deliveryTime
      );

      // Clear cart
      cartStorage.clearCart();
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      
      // Show success toast for immediate feedback
      toast({
        title: "Order Placed!",
        description: "Your order has been placed successfully!",
      });
      
      // Send PUSH NOTIFICATION for order status (FCM)
      const userId = localStorage.getItem('userId');
      if (userId) {
        fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            title: '🎉 Order Confirmed!',
            body: `Order #${order?.orderNumber || ''} placed successfully. We'll start preparing your food soon!`,
            event_name: 'order_placed',
            category: 'order_status',
            deep_link: order?.id ? `plattr://orders/${order.id}` : 'plattr://orders',
            metadata: { order_id: order?.id, order_number: order?.orderNumber },
          }),
        }).catch(err => console.log('[Notification] Failed to send order notification:', err));
      }
      
      // Use setTimeout to ensure navigation happens after state updates
      setTimeout(() => {
        const targetPath = order?.orderNumber && order?.id
          ? `/order-confirmation?orderNumber=${order.orderNumber}&orderId=${order.id}`
          : order?.orderNumber
          ? `/order-confirmation?orderNumber=${order.orderNumber}`
          : '/order-confirmation';
        
        console.log('[CheckoutPage] Navigating to order confirmation:', targetPath);
        setLocation(targetPath, { replace: true });
      }, 100);
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast({
        title: "Order Error",
        description: error.message || "Failed to create order. Please contact support.",
        variant: "destructive",
      });
      
      // Send PUSH NOTIFICATION for order failure (FCM)
      const userId = localStorage.getItem('userId');
      if (userId) {
        fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            title: '❌ Order Failed',
            body: error.message || 'Failed to create your order. Please try again or contact support.',
            event_name: 'order_failed',
            category: 'order_status',
          }),
        }).catch(err => console.log('[Notification] Failed to send order error notification:', err));
      }
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Show loading state first (before auth check)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your cart...</p>
        </div>
      </div>
    );
  }

  // Check if cart is empty (for both guests and authenticated users)
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <h1 className="text-xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-4">
            Add some delicious items to your cart to get started!
          </p>
          <Button onClick={() => setLocation('/')} data-testid="button-browse">
            Browse Menu
          </Button>
        </Card>
      </div>
    );
  }

  // Calculate totals from real cart data
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (parseFloat(item.dish.price) * item.quantity);
  }, 0);
  const baseDeliveryFee = 40;
  const deliveryFee = appliedCoupon?.isFreeDelivery ? 0 : baseDeliveryFee;
  const tax = Math.round(subtotal * 0.05);
  const discount = appliedCoupon?.isFreeDelivery ? 0 : (appliedCoupon?.discount || 0);
  const total = subtotal + deliveryFee + tax - discount;

  // Group items by category
  const groupedItems = cartItems.reduce((acc, item) => {
    const categoryLabel = item.dish.categoryName || 
      (item.dish.mealType?.[0]?.toUpperCase() || 'Other');
    
    if (!acc[categoryLabel]) acc[categoryLabel] = [];
    acc[categoryLabel].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  const deliveryDates = generateDeliveryDates();

  // Calculate payment schedule based on delivery date gap
  const calculatePaymentSchedule = () => {
    if (!deliveryDate) return null;

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const delivery = new Date(deliveryDate);
    const deliveryStart = new Date(
      delivery.getFullYear(),
      delivery.getMonth(),
      delivery.getDate()
    );

    const diffMs = deliveryStart.getTime() - todayStart.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Treat 2 or more days as the long-gap case
    const isLongGap = diffDays >= 2;

    const totalAmount = total;

    if (totalAmount <= 0) return null;

    if (isLongGap) {
      const advance = Math.round(totalAmount * 0.1);
      const beforeDay = Math.round(totalAmount * 0.7);
      const remaining = Math.max(totalAmount - advance - beforeDay, 0);

      return {
        type: "long" as const,
        stages: [
          {
            label: "Booking Advance",
            description: "Pay 10% right away to confirm your slot.",
            amount: advance,
            when: "Now",
          },
          {
            label: "Before Event Day",
            description: "Pay 70% one day before delivery.",
            amount: beforeDay,
            when: "1 day before delivery",
          },
          {
            label: "On Delivery",
            description: "Pay the remaining 20% on delivery.",
            amount: remaining,
            when: "On delivery day",
          },
        ],
      };
    } else {
      const immediate = Math.round(totalAmount * 0.8);
      const remaining = Math.max(totalAmount - immediate, 0);

      return {
        type: "short" as const,
        stages: [
          {
            label: "Booking Payment",
            description: "Pay 80% right away to confirm your slot.",
            amount: immediate,
            when: "Now",
          },
          {
            label: "On Delivery",
            description: "Pay the remaining 20% on delivery.",
            amount: remaining,
            when: "On delivery day",
          },
        ],
      };
    }
  };

  const paymentSchedule = calculatePaymentSchedule();

  return (
    <div className="min-h-screen bg-background pb-6">
      <header className="sticky top-0 z-50 bg-background border-b p-3" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={goBack}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold font-serif" data-testid="text-page-title">Checkout</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6" data-testid="card-order-review">
          <h2 className="text-lg font-semibold mb-4" data-testid="text-order-items">Order Items</h2>
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3" data-testid={`text-category-${category.toLowerCase()}`}>
                  {category}
                </h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3" data-testid={`order-item-${item.id}`}>
                      <img 
                        src={getSupabaseImageUrl((item.dish as any).image_url || item.dish.imageUrl)} 
                        alt={item.dish.name}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate" data-testid="text-item-name">{item.dish.name}</h4>
                        <p className="text-xs text-muted-foreground" data-testid="text-item-quantity">Qty: {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-sm flex-shrink-0" data-testid="text-item-total">
                        ₹{(parseFloat(item.dish.price) * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6" data-testid="card-delivery-address">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Delivery Address
          </h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address-label">Address Label</Label>
              <Select value={addressLabel} onValueChange={setAddressLabel}>
                <SelectTrigger id="address-label" data-testid="select-address-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery-address">Full Address *</Label>
              <Textarea
                id="delivery-address"
                placeholder="Enter your complete delivery address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={3}
                data-testid="input-delivery-address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="landmark">Landmark (Optional)</Label>
              <Input
                id="landmark"
                placeholder="e.g., Near Sigma Mall"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                data-testid="input-landmark"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6" data-testid="card-delivery-schedule">
          <h2 className="text-lg font-semibold mb-4">Delivery Schedule</h2>
          <div className="space-y-4">
            <DeliveryDatePicker
              value={deliveryDate}
              onChange={setDeliveryDate}
            />

            <DeliveryTimePicker
              mealType="all"
              value={deliveryTime}
              onChange={setDeliveryTime}
              selectedDate={deliveryDate}
            />
          </div>
        </Card>

        {/* Payment Explanation for orders ≤ ₹700 or same-day delivery */}
        {deliveryDate && deliveryTime && !paymentSchedule && (
          <Card className="p-6 space-y-4" data-testid="card-payment-explanation-simple">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1 flex-1">
                <h2 className="text-lg font-semibold">Payment Information</h2>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-blue-900">How Payment Works:</h3>
              {(() => {
                const today = new Date();
                const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const delivery = new Date(deliveryDate);
                const deliveryStart = new Date(delivery.getFullYear(), delivery.getMonth(), delivery.getDate());
                const diffMs = deliveryStart.getTime() - todayStart.getTime();
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                
                if (total <= 700) {
                  return (
                    <div className="space-y-1 text-xs text-blue-800">
                      <p>• Your order total is ₹{total.toFixed(0)} (≤ ₹700)</p>
                      <p>• <strong>Pay full amount (100%) now</strong> to confirm your order</p>
                      <p>• No remaining payments required</p>
                      <p className="mt-2 text-blue-700">💡 Small orders are paid in full for quick processing!</p>
                    </div>
                  );
                } else if (diffDays < 1) {
                  return (
                    <div className="space-y-1 text-xs text-blue-800">
                      <p>• Your delivery is <strong>today (same day)</strong></p>
                      <p>• <strong>Pay full amount (100%) now</strong> to confirm your order</p>
                      <p>• No remaining payments required</p>
                      <p className="mt-2 text-blue-700">💡 Same-day orders require full payment upfront!</p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-sm font-semibold text-primary">
                Pay ₹{calculateInitialPayment().toFixed(0)} now to confirm your order
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Complete your payment to place the order.
              </p>
            </div>
          </Card>
        )}

        {paymentSchedule && (
          <Card className="p-6 space-y-4" data-testid="card-payment-schedule">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1 flex-1">
                <h2 className="text-lg font-semibold">Payment Schedule</h2>
                <p className="text-sm text-muted-foreground">
                  Your payment plan is based on the gap between today and your selected delivery date.
                </p>
              </div>
            </div>

            {/* Payment Structure Explanation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-blue-900">How Payment Works:</h3>
              {(() => {
                const today = new Date();
                const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const delivery = new Date(deliveryDate);
                const deliveryStart = new Date(delivery.getFullYear(), delivery.getMonth(), delivery.getDate());
                const diffMs = deliveryStart.getTime() - todayStart.getTime();
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                
                if (total <= 700) {
                  return (
                    <div className="space-y-1 text-xs text-blue-800">
                      <p>• Your order total is ₹{total.toFixed(0)} (≤ ₹700)</p>
                      <p>• <strong>Pay full amount (100%) now</strong> to confirm your order</p>
                      <p>• No remaining payments required</p>
                      <p className="mt-2 text-blue-700">💡 Small orders are paid in full for quick processing!</p>
                    </div>
                  );
                } else if (diffDays < 1) {
                  return (
                    <div className="space-y-1 text-xs text-blue-800">
                      <p>• Your delivery is <strong>today (same day)</strong></p>
                      <p>• <strong>Pay full amount (100%) now</strong> to confirm your order</p>
                      <p>• No remaining payments required</p>
                      <p className="mt-2 text-blue-700">💡 Same-day orders require full payment upfront!</p>
                    </div>
                  );
                } else if (paymentSchedule.type === "long") {
                  return (
                    <div className="space-y-1 text-xs text-blue-800">
                      <p>• Your delivery is <strong>{diffDays} days away</strong> (more than 2 days)</p>
                      <p>• <strong>Pay 10% now</strong> to secure your booking slot</p>
                      <p>• <strong>Pay 70% one day before delivery</strong> (you'll get a reminder)</p>
                      <p>• <strong>Pay remaining 20% on delivery day</strong></p>
                      <p className="mt-2 text-blue-700">💡 This flexible payment plan helps you manage your budget better!</p>
                    </div>
                  );
                } else {
                  return (
                    <div className="space-y-1 text-xs text-blue-800">
                      <p>• Your delivery is <strong>{diffDays} day(s) away</strong> (within 2 days)</p>
                      <p>• <strong>Pay 80% now</strong> to confirm your order</p>
                      <p>• <strong>Pay remaining 20% on delivery day</strong></p>
                      <p className="mt-2 text-blue-700">💡 Quick confirmation for near-term deliveries!</p>
                    </div>
                  );
                }
              })()}
            </div>

            <div className="space-y-3">
              {paymentSchedule.stages.map((stage, index) => {
                const isInitialPayment = stage.when === "Now";
                return (
                  <div
                    key={stage.label}
                    className={`flex items-start gap-3 ${isInitialPayment ? 'bg-primary/5 p-3 rounded-lg border border-primary/20' : ''}`}
                    data-testid={`payment-stage-${index}`}
                  >
                    <div className="mt-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${isInitialPayment ? 'bg-primary' : 'bg-primary/40'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className={`text-sm font-semibold ${isInitialPayment ? 'text-primary' : ''}`}>
                            {stage.label}
                            {isInitialPayment && <span className="ml-2 text-xs">(Pay Now)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{stage.description}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${isInitialPayment ? 'text-primary text-lg' : 'text-primary'}`}>
                            ₹{stage.amount.toFixed(0)}
                          </p>
                          <p className="text-xs text-muted-foreground">{stage.when}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
              <p className="text-sm font-semibold text-primary">
                Pay ₹{calculateInitialPayment().toFixed(0)} now to confirm your order
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Remaining payments can be completed from your order status page after placing the order.
              </p>
            </div>
          </Card>
        )}

        <Card className="p-6" data-testid="card-coupon">
          <h2 className="text-lg font-semibold mb-4">Have a Coupon?</h2>
          <CouponInput
            subtotal={subtotal}
            onCouponApply={handleCouponApply}
            onCouponRemove={handleCouponRemove}
            appliedCoupon={appliedCoupon}
          />
        </Card>

        <OrderSummaryCard 
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          tax={tax}
          discount={discount}
        />

        <div className="space-y-3 sticky bottom-6">
          {/* Pay Now Button */}
          <Button 
            size="lg" 
            className="w-full rounded-full shadow-xl"
            onClick={handlePayment}
            disabled={!deliveryAddress.trim() || !deliveryDate || !deliveryTime || isProcessingPayment || paymentVerified || !razorpayLoaded || !razorpayKeyId}
            data-testid="button-pay"
            style={{
              backgroundColor: paymentVerified ? "#10b981" : undefined,
            }}
          >
            {isProcessingPayment ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : paymentVerified ? (
              <>
                <span className="mr-2">✓</span>
                Payment Verified
              </>
            ) : !razorpayLoaded || !razorpayKeyId ? (
              "Initializing Payment..."
            ) : (
              `${getPaymentButtonText()}${total <= 700 || (deliveryDate && (new Date(deliveryDate).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) < 86400000) ? '' : ` ₹${calculateInitialPayment().toFixed(0)}`}`
            )}
          </Button>

          {/* Submit Order Button */}
        <Button 
          size="lg" 
            className="w-full rounded-full shadow-xl"
            onClick={handleSubmitOrder}
            disabled={!paymentVerified || isCreatingOrder}
            data-testid="button-submit-order"
            style={{
              backgroundColor: paymentVerified ? undefined : "#f3f4f6",
              color: paymentVerified ? undefined : "#9ca3af",
            }}
          >
            {isCreatingOrder ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting Order...
            </>
          ) : (
              "Submit Order"
          )}
        </Button>
        </div>
        {paymentVerified && (
          <p className="text-xs text-center text-green-600 mt-2">
            Payment verified! Please click "Submit Order" to complete your order.
          </p>
        )}
      </main>
    </div>
  );
}
