import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, MapPin, Package, Calendar, IndianRupee, Info, Loader2, CheckCircle } from "lucide-react";
import { orderService, bulkMealOrderService, sixtyMinBulkOrderService, paymentService } from "@/lib/supabase-service";
import { getSupabaseImageUrl } from "@/lib/supabase";
import { useGoBack } from "@/hooks/useGoBack";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/config/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  dish: {
    id: string;
    name: string;
    description: string;
    price: string;
    imageUrl: string;
    dietaryType: string;
  };
}

interface OrderDetails {
  id: string;
  orderNumber: number;
  subtotal: string;
  deliveryFee: string;
  tax: string;
  total: string;
  deliveryDate: string;
  deliveryTime: string;
  status: string;
  createdAt: string;
  address: {
    id: string;
    label: string;
    address: string;
    landmark: string | null;
  };
  items: OrderItem[];
}

const STATUS_VARIANTS = {
  pending: { variant: 'secondary' as const, label: 'Pending', color: 'text-yellow-600' },
  confirmed: { variant: 'default' as const, label: 'Confirmed', color: 'text-blue-600' },
  preparing: { variant: 'secondary' as const, label: 'Preparing', color: 'text-orange-600' },
  delivering: { variant: 'default' as const, label: 'Out for Delivery', color: 'text-purple-600' },
  delivered: { variant: 'outline' as const, label: 'Delivered', color: 'text-green-600' },
  cancelled: { variant: 'destructive' as const, label: 'Cancelled', color: 'text-red-600' },
};

export default function OrderDetailsPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/orders/:orderId");
  const orderId = params?.orderId;
  const goBack = useGoBack('/orders');
  const { toast } = useToast();
  
  // Payment state
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [paidStages, setPaidStages] = useState<string[]>(['initial']);
  
  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = async () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => console.error('Failed to load Razorpay SDK');
      document.body.appendChild(script);
    };
    loadRazorpay();
  }, []);

  // Fetch Razorpay key
  useEffect(() => {
    const fetchKey = async () => {
      try {
        const response = await fetch(getApiUrl('/api/payments/key'));
        if (!response.ok) throw new Error('Failed to fetch key');
        const data = await response.json();
        if (data.key) setRazorpayKeyId(data.key);
      } catch (error) {
        console.error('Error fetching Razorpay key:', error);
      }
    };
    fetchKey();
  }, []);

  // Try to fetch from different order tables
  const { data: order, isLoading } = useQuery<OrderDetails | any>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      
      // First try regular orders table
      try {
        return await orderService.getById(orderId);
      } catch (error: any) {
        // If not found in orders, try bulk_meal_orders
        try {
          const bulkOrder = await bulkMealOrderService.getById(orderId);
          
          // Parse items JSON string
          let items = [];
          if (bulkOrder.items) {
            try {
              const parsedItems = typeof bulkOrder.items === 'string' 
                ? JSON.parse(bulkOrder.items) 
                : bulkOrder.items;
              
              // Transform items to match OrderDetails format
              items = parsedItems.map((item: any) => ({
                id: item.dishId || item.id || '',
                quantity: item.quantity || 0,
                price: (item.price || 0).toString(),
                dish: {
                  id: item.dishId || item.id || '',
                  name: item.name || `Dish ${item.dishId || ''}`,
                  description: item.description || '',
                  price: (item.price || 0).toString(),
                  imageUrl: item.image_url || item.imageUrl || '',
                  dietaryType: item.dietary_type || 'Regular',
                },
              }));
            } catch (parseError) {
              console.error('Error parsing bulk order items:', parseError);
            }
          }
          
          // Transform bulk order to match OrderDetails format
          return {
            id: bulkOrder.id,
            orderNumber: bulkOrder.order_number,
            subtotal: bulkOrder.subtotal?.toString() || '0',
            deliveryFee: bulkOrder.platform_fee?.toString() || '0',
            tax: bulkOrder.gst?.toString() || '0',
            total: bulkOrder.total?.toString() || '0',
            deliveryDate: bulkOrder.delivery_date || '',
            deliveryTime: bulkOrder.delivery_time || '',
            status: bulkOrder.status || 'pending',
            createdAt: bulkOrder.created_at || '',
            address: {
              id: bulkOrder.address_id || '',
              label: 'Delivery Address',
              address: bulkOrder.delivery_address || '',
              landmark: null,
            },
            items: items,
          };
        } catch (bulkError: any) {
          // If not found in bulk_meal_orders, try sixty_min_bulk_orders
          try {
            const sixtyMinOrder = await sixtyMinBulkOrderService.getById(orderId);
            
            // Parse items (could be JSON string or JSONB)
            let items = [];
            if (sixtyMinOrder.items) {
              try {
                const parsedItems = typeof sixtyMinOrder.items === 'string' 
                  ? JSON.parse(sixtyMinOrder.items) 
                  : sixtyMinOrder.items;
                
                // Transform items to match OrderDetails format
                items = Array.isArray(parsedItems) ? parsedItems.map((item: any) => ({
                  id: item.dishId || item.id || '',
                  quantity: item.quantity || 0,
                  price: (item.price || item.unit_price || 0).toString(),
                  dish: {
                    id: item.dishId || item.id || '',
                    name: item.dish_name || item.name || `Dish ${item.dishId || ''}`,
                    description: item.description || '',
                    price: (item.price || item.unit_price || 0).toString(),
                    imageUrl: item.image_url || item.imageUrl || '',
                    dietaryType: item.dietary_type || 'Regular',
                  },
                })) : [];
              } catch (parseError) {
                console.error('Error parsing 60-min order items:', parseError);
              }
            }
            
            // Transform 60-min order to match OrderDetails format
            return {
              id: sixtyMinOrder.id,
              orderNumber: sixtyMinOrder.order_number,
              subtotal: sixtyMinOrder.subtotal?.toString() || '0',
              deliveryFee: sixtyMinOrder.platform_fee?.toString() || '0',
              tax: sixtyMinOrder.gst?.toString() || '0',
              total: sixtyMinOrder.total?.toString() || '0',
              deliveryDate: sixtyMinOrder.delivery_date || '',
              deliveryTime: sixtyMinOrder.delivery_time || '',
              status: sixtyMinOrder.status || 'pending',
              createdAt: sixtyMinOrder.created_at || '',
              address: {
                id: '',
                label: 'Delivery Address',
                address: sixtyMinOrder.delivery_address || '',
                landmark: null,
              },
              items: items,
            };
          } catch (sixtyMinError: any) {
            // If not found in any table, throw the original error
            throw error;
          }
        }
      }
    },
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Order Not Found</h1>
          <p className="text-muted-foreground mb-4">
            We couldn't find this order. It may have been removed or doesn't exist.
          </p>
          <Button onClick={() => setLocation('/orders')}>
            Back to Orders
          </Button>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_VARIANTS[order.status as keyof typeof STATUS_VARIANTS] || STATUS_VARIANTS.pending;

  const calculatePaymentSchedule = () => {
    if (!order.deliveryDate || !order.total) return null;

    const totalAmount = parseFloat(order.total);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) return null;

    // Case 4: If total <= ₹700, full payment was made - no schedule needed
    if (totalAmount <= 700) {
      return {
        type: "full" as const,
        stages: [
          {
            key: "full",
            label: "Full Payment",
            description: "Complete payment made at order placement.",
            amount: totalAmount,
            when: "Paid at order placement",
            dueDate: new Date().toISOString(),
            status: "paid",
          },
        ],
      };
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const delivery = new Date(order.deliveryDate);
    const deliveryStart = new Date(
      delivery.getFullYear(),
      delivery.getMonth(),
      delivery.getDate()
    );

    const diffMs = deliveryStart.getTime() - todayStart.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Case 3: Same day delivery - full payment was made
    if (diffDays < 1) {
      return {
        type: "full" as const,
        stages: [
          {
            key: "full",
            label: "Full Payment",
            description: "Complete payment made at order placement.",
            amount: totalAmount,
            when: "Paid at order placement",
            dueDate: todayStart.toISOString(),
            status: "paid",
          },
        ],
      };
    }

    // Case 1: Gap >= 2 days - 10% now, 70% before 1 day, 20% before delivery
    if (diffDays >= 2) {
      const advance = Math.round(totalAmount * 0.1);
      const beforeDay = Math.round(totalAmount * 0.7);
      const remaining = Math.max(totalAmount - advance - beforeDay, 0);

      const oneDayBefore = new Date(deliveryStart);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);

      return {
        type: "long" as const,
        stages: [
          {
            key: "advance",
            label: "Booking Advance",
            description: "Pay 10% right away to confirm your slot.",
            amount: advance,
            when: "Now",
            dueDate: todayStart.toISOString(),
            status: "paid",
          },
          {
            key: "before-day",
            label: "Before Event Day",
            description: "Pay 70% one day before delivery.",
            amount: beforeDay,
            when: "1 day before delivery",
            dueDate: oneDayBefore.toISOString(),
            status: "pending",
          },
          {
            key: "on-delivery",
            label: "On Delivery",
            description: "Pay the remaining 20% on delivery.",
            amount: remaining,
            when: "On delivery day",
            dueDate: deliveryStart.toISOString(),
            status: "pending",
          },
        ],
      };
    }
    
    // Case 2: Gap < 2 days (but not same day) - 80% now, 20% before delivery
    const immediate = Math.round(totalAmount * 0.8);
    const remaining = Math.max(totalAmount - immediate, 0);

    return {
      type: "short" as const,
      stages: [
        {
          key: "immediate",
          label: "Booking Payment",
          description: "Pay 80% right away to confirm your slot.",
          amount: immediate,
          when: "Now",
          dueDate: todayStart.toISOString(),
          status: "paid",
        },
        {
          key: "on-delivery",
          label: "On Delivery",
          description: "Pay the remaining 20% on delivery.",
          amount: remaining,
          when: "On delivery day",
          dueDate: deliveryStart.toISOString(),
          status: "pending",
        },
      ],
    };
  };

  // Helper to determine if a stage is eligible for payment (today >= due date)
  const isStageEligible = (stage: any) => {
    if (!stage.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(stage.dueDate);
    due.setHours(0, 0, 0, 0);
    return today.getTime() >= due.getTime();
  };

  // Handle payment for a specific stage
  const handleStagePayment = async (stage: { key: string; amount: number; label: string }) => {
    if (!order || !razorpayLoaded || !razorpayKeyId) {
      toast({
        title: "Payment Error",
        description: "Payment gateway is not ready. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setProcessingPayment(stage.key);

    try {
      // Create Razorpay order
      const createOrderResponse = await fetch(getApiUrl('/api/payments/create-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: stage.amount,
          currency: 'INR',
          receipt: `${order.orderNumber}-${stage.key}-${Date.now()}`,
        }),
      });

      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const orderData = await createOrderResponse.json();
      const razorpayOrderId = orderData.orderId;
      const isTestPayment = razorpayKeyId?.includes('test') || razorpayKeyId?.includes('rzp_test');

      // Open Razorpay modal
      const razorpay = new window.Razorpay({
        key: razorpayKeyId,
        amount: stage.amount * 100,
        currency: 'INR',
        name: 'Plattr',
        description: `${stage.label} - Order #${order.orderNumber}`,
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch(getApiUrl('/api/payments/verify'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) throw new Error('Payment verification failed');

            const userId = localStorage.getItem('userId');
            if (!userId) throw new Error('User not authenticated');

            // Store payment details
            console.log(`[Payment] Storing ${stage.key} payment details...`);
            try {
              await paymentService.addPaymentStage({
                orderId: order.id,
                orderType: 'mealbox',
                orderNumber: order.orderNumber,
                userId: userId,
                paymentStage: stage.key as 'second' | 'final',
                amount: stage.amount,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                razorpayReceipt: razorpayOrderId,
                paymentStatus: 'success',
                isTestPayment: isTestPayment,
                metadata: {
                  payment_date: new Date().toISOString(),
                  payment_method: 'razorpay',
                  stage_label: stage.label,
                },
              });
              console.log(`[Payment] ✓ ${stage.key} payment stored successfully`);
            } catch (paymentError: any) {
              console.error(`[Payment] ✗ Error storing ${stage.key} payment:`, paymentError);
              toast({
                title: "Payment Record Warning",
                description: "Payment successful but record failed to save. Support will be notified.",
                variant: "destructive",
              });
            }

            setPaidStages(prev => [...prev, stage.key]);
            toast({
              title: "Payment Successful!",
              description: `${stage.label} of ₹${stage.amount} has been completed.`,
            });
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment Error",
              description: error.message || "Failed to verify payment. Please contact support.",
              variant: "destructive",
            });
          } finally {
            setProcessingPayment(null);
          }
        },
        prefill: {
          contact: localStorage.getItem('phone') || '',
          email: localStorage.getItem('email') || '',
        },
        theme: { color: '#1A9952' },
        modal: {
          ondismiss: function() { setProcessingPayment(null); },
        },
      });
      razorpay.open();
    } catch (error: any) {
      console.error("Error initiating payment:", error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
      });
      setProcessingPayment(null);
    }
  };

  const paymentSchedule = calculatePaymentSchedule();

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold" data-testid="text-page-title">
              Order #{order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Kolkata'
              })}
            </p>
          </div>
          <Badge variant={statusConfig.variant} data-testid="badge-order-status">
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Delivery Schedule */}
        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Delivery Schedule
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Delivery Date</p>
                <p className="font-medium" data-testid="text-delivery-date">
                  {new Date(order.deliveryDate).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'Asia/Kolkata'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Delivery Time</p>
                <p className="font-medium" data-testid="text-delivery-time">{order.deliveryTime}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Schedule */}
        {paymentSchedule && (
          <Card className="p-4 space-y-4" data-testid="card-payment-schedule">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg mb-1">Payment Schedule</h2>
                <p className="text-sm text-muted-foreground">
                  Your payment is split into stages based on the time remaining until delivery.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {paymentSchedule.stages.map((stage, index) => (
                <div
                  key={stage.key}
                  className="flex items-start gap-3"
                  data-testid={`payment-stage-${index}`}
                >
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    {index !== paymentSchedule.stages.length - 1 && (
                      <div className="w-px flex-1 bg-muted mt-1" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold">{stage.label}</p>
                          {stage.status === 'paid' && (
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
                              Paid
                            </Badge>
                          )}
                          {stage.status === 'pending' && (
                            <Badge variant="secondary" className="text-xs">Pending</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {stage.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {stage.when}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary flex items-center justify-end gap-1">
                          <IndianRupee className="w-3 h-3" />
                          {stage.amount.toFixed(0)}
                        </p>
                      </div>
                    </div>
                    {/* Pay button for eligible pending stages */}
                    {stage.status === 'pending' && !paidStages.includes(stage.key) && isStageEligible(stage) && (
                      <div className="mt-3">
                        <Button
                          variant="default"
                          size="sm"
                          className="text-xs w-full bg-[#1A9952] hover:bg-[#158844]"
                          onClick={() => handleStagePayment(stage)}
                          disabled={processingPayment !== null || !razorpayLoaded || !razorpayKeyId}
                          data-testid={`button-pay-stage-${stage.key}`}
                        >
                          {processingPayment === stage.key ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            `Pay ₹${stage.amount.toFixed(0)}`
                          )}
                        </Button>
                      </div>
                    )}
                    {paidStages.includes(stage.key) && stage.key !== 'initial' && (
                      <div className="mt-3 flex items-center justify-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Payment Complete</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="w-3 h-3 mt-0.5" />
              <p>
                This schedule is calculated from today to your delivery date. If your event date
                changes, your payment stages may also change.
              </p>
            </div>
          </Card>
        )}

        {/* Delivery Address */}
        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Delivery Address
          </h2>
          <div className="space-y-1">
            <p className="font-medium"  data-testid="text-address-label">{order.address.label}</p>
            <p className="text-sm text-muted-foreground" data-testid="text-address">
              {order.address.address}
            </p>
            {order.address.landmark && (
              <p className="text-sm text-muted-foreground" data-testid="text-landmark">
                Landmark: {order.address.landmark}
              </p>
            )}
          </div>
        </Card>

        {/* Order Items */}
        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Order Items
          </h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4" data-testid={`order-item-${item.dish.id}`}>
                <img
                  src={getSupabaseImageUrl((item.dish as any).image_url || item.dish.imageUrl) || '/placeholder.jpg'}
                  alt={item.dish.name}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  data-testid="img-dish"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold" data-testid="text-dish-name">{item.dish.name}</h3>
                    <Badge variant="outline" className="flex-shrink-0" data-testid="badge-dietary-type">
                      {item.dish.dietaryType}
                    </Badge>
                  </div>
                  {item.dish.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {item.dish.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground" data-testid="text-quantity">
                      Qty: {item.quantity}
                    </span>
                    <span className="font-semibold text-primary" data-testid="text-item-price">
                      ₹{parseFloat(item.price).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Bill Details */}
        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-4" data-testid="text-bill-details">Bill Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground" data-testid="text-subtotal-label">Item Total</span>
              <span data-testid="text-subtotal">₹{parseFloat(order.subtotal).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground" data-testid="text-delivery-label">Delivery Fee</span>
              <span data-testid="text-delivery-fee">₹{parseFloat(order.deliveryFee).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground" data-testid="text-tax-label">Taxes & Charges</span>
              <span data-testid="text-tax">₹{parseFloat(order.tax).toFixed(0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold pt-1">
              <span data-testid="text-total-label">Total Paid</span>
              <span className="text-primary font-serif" data-testid="text-total">
                ₹{parseFloat(order.total).toFixed(0)}
              </span>
            </div>
          </div>
        </Card>

        {/* Help Section */}
        <Card className="p-4 bg-muted/50">
          <p className="text-sm text-center text-muted-foreground">
            Need help with your order?{' '}
            <button
              onClick={() => setLocation('/help')}
              className="text-primary font-medium hover:underline"
              data-testid="button-help"
            >
              Contact Support
            </button>
          </p>
        </Card>
      </main>
    </div>
  );
}
