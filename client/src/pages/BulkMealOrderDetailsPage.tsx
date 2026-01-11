import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, MapPin, Package, Calendar, IndianRupee, Info, Loader2, CheckCircle } from "lucide-react";
import { bulkMealOrderService, sixtyMinBulkOrderService, paymentService } from "@/lib/supabase-service";
import { useGoBack } from "@/hooks/useGoBack";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/config/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface BulkOrderItem {
  dishId: string;
  quantity: number;
  price: number;
  name?: string;
  description?: string;
  image_url?: string;
  dietary_type?: string;
}

interface BulkOrderDetails {
  id: string;
  order_number: number;
  subtotal: string | number;
  gst: string | number;
  platform_fee: string | number;
  packaging_fee: string | number;
  total: string | number;
  delivery_date?: string;
  delivery_time?: string;
  delivery_address?: string;
  address_id?: string;
  status: string;
  created_at: string;
  items: string | BulkOrderItem[];
  selected_addons?: string;
}

const STATUS_VARIANTS = {
  pending: { variant: 'secondary' as const, label: 'Pending', color: 'text-yellow-600' },
  confirmed: { variant: 'default' as const, label: 'Confirmed', color: 'text-blue-600' },
  preparing: { variant: 'secondary' as const, label: 'Preparing', color: 'text-orange-600' },
  delivering: { variant: 'default' as const, label: 'Out for Delivery', color: 'text-purple-600' },
  delivered: { variant: 'outline' as const, label: 'Delivered', color: 'text-green-600' },
  cancelled: { variant: 'destructive' as const, label: 'Cancelled', color: 'text-red-600' },
};

export default function BulkMealOrderDetailsPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/bulk-orders/:orderId");
  const orderId = params?.orderId;
  const goBack = useGoBack('/orders');
  const { toast } = useToast();
  
  // Payment state
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null); // Stores the stage key being paid
  const [paidStages, setPaidStages] = useState<string[]>(['initial']); // Track which stages are paid
  
  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = async () => {
      // Check if already loaded
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setRazorpayLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay SDK');
      };
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
        if (data.key) {
          setRazorpayKeyId(data.key);
        }
      } catch (error) {
        console.error('Error fetching Razorpay key:', error);
      }
    };
    fetchKey();
  }, []);

  // Try to fetch from bulk_meal_orders first, then sixty_min_bulk_orders
  const { data: order, isLoading } = useQuery<BulkOrderDetails | null>({
    queryKey: ['bulk-order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      
      try {
        return await bulkMealOrderService.getById(orderId);
      } catch (error: any) {
        // If not found in bulk_meal_orders, try sixty_min_bulk_orders
        try {
          return await sixtyMinBulkOrderService.getById(orderId);
        } catch (sixtyMinError: any) {
          throw error;
        }
      }
    },
    enabled: !!orderId,
  });

  // Calculate payment schedule
  const calculatePaymentSchedule = () => {
    if (!order) return [];

    const total = parseFloat(order.total?.toString() || '0');
    
    // Case 4: If total <= ₹700, full payment was made - no schedule needed
    if (total <= 700) {
      return [
        {
          key: 'full',
          label: 'Full Payment',
          amount: total,
          status: 'paid',
          when: 'Paid at order placement',
          dueDate: new Date().toISOString(),
        },
      ];
    }

    if (!order.delivery_date) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deliveryDate = new Date(order.delivery_date);
    deliveryDate.setHours(0, 0, 0, 0);
    
    const diffMs = deliveryDate.getTime() - today.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    // Case 3: Same day delivery - full payment was made
    if (diffDays < 1) {
      return [
        {
          key: 'full',
          label: 'Full Payment',
          amount: total,
          status: 'paid',
          when: 'Paid at order placement',
          dueDate: today.toISOString(),
        },
      ];
    }
    
    // Case 1: Gap >= 2 days - 10% now, 70% before 1 day, 20% before delivery
    if (diffDays >= 2) {
      const initial = Math.round(total * 0.1);
      const second = Math.round(total * 0.7);
      const final = Math.round(total * 0.2);
      
      const oneDayBefore = new Date(deliveryDate);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);
      
      return [
        {
          key: 'initial',
          label: 'Initial Payment',
          amount: initial,
          status: 'paid', // Assuming initial payment is done
          when: 'Paid at order placement',
          dueDate: today.toISOString(),
        },
        {
          key: 'second',
          label: 'Second Payment',
          amount: second,
          status: 'pending',
          when: `Before ${oneDayBefore.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
          dueDate: oneDayBefore.toISOString(),
        },
        {
          key: 'final',
          label: 'Final Payment',
          amount: final,
          status: 'pending',
          when: `Before ${deliveryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
          dueDate: deliveryDate.toISOString(),
        },
      ];
    }
    
    // Case 2: Gap < 2 days (but not same day) - 80% now, 20% before delivery
    const initial = Math.round(total * 0.8);
    const final = Math.round(total * 0.2);
    
    return [
      {
        key: 'initial',
        label: 'Initial Payment',
        amount: initial,
        status: 'paid',
        when: 'Paid at order placement',
        dueDate: today.toISOString(),
      },
      {
        key: 'final',
        label: 'Final Payment',
        amount: final,
        status: 'pending',
        when: `Before ${deliveryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
        dueDate: deliveryDate.toISOString(),
      },
    ];
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
          receipt: `${order.order_number}-${stage.key}-${Date.now()}`,
        }),
      });

      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const orderData = await createOrderResponse.json();
      const razorpayOrderId = orderData.orderId;

      // Determine if test payment
      const isTestPayment = razorpayKeyId?.includes('test') || razorpayKeyId?.includes('rzp_test');

      // Open Razorpay modal
      const razorpay = new window.Razorpay({
        key: razorpayKeyId,
        amount: stage.amount * 100,
        currency: 'INR',
        name: 'Plattr',
        description: `${stage.label} - Order #${order.order_number}`,
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

            if (!verifyResponse.ok) {
              throw new Error('Payment verification failed');
            }

            // Get user ID
            const userId = localStorage.getItem('userId');
            if (!userId) {
              throw new Error('User not authenticated');
            }

            // Store payment details
            console.log(`[Payment] Storing ${stage.key} payment details...`);
            
            try {
              await paymentService.addPaymentStage({
                orderId: order.id,
                orderType: 'bulk_meal', // TODO: detect if sixty_min_bulk
                orderNumber: order.order_number,
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
              // Don't throw - payment was successful, just storage failed
              toast({
                title: "Payment Record Warning",
                description: "Payment successful but record failed to save. Support will be notified.",
                variant: "destructive",
              });
            }

            // Update local state
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
        theme: {
          color: '#1A9952',
        },
        modal: {
          ondismiss: function() {
            setProcessingPayment(null);
          },
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

  // Parse items
  const parseItems = (): BulkOrderItem[] => {
    if (!order || !order.items) return [];
    
    try {
      const parsed = typeof order.items === 'string' 
        ? JSON.parse(order.items) 
        : order.items;
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error parsing items:', error);
      return [];
    }
  };

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
            We couldn't find this bulk meal order.
          </p>
          <Button onClick={() => setLocation('/orders')}>
            Back to Orders
          </Button>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_VARIANTS[order.status as keyof typeof STATUS_VARIANTS] || STATUS_VARIANTS.pending;
  const items = parseItems();
  const paymentSchedule = calculatePaymentSchedule();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">Bulk Meal Order</h1>
            <p className="text-sm text-muted-foreground">
              Order #{order.order_number}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Order Status */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={statusConfig.variant} className="mt-1">
                {statusConfig.label}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-primary">
                ₹{parseFloat(order.total?.toString() || '0').toFixed(0)}
              </p>
            </div>
          </div>
        </Card>

        {/* Payment Schedule */}
        {paymentSchedule.length > 0 && (
          <Card className="p-4">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-primary" />
              Payment Schedule
            </h2>
            <div className="space-y-4">
              {paymentSchedule.map((stage) => (
                <div
                  key={stage.key}
                  className={`p-3 rounded-lg border-2 ${
                    stage.status === 'paid'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{stage.label}</h3>
                        {stage.status === 'paid' && (
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            Paid
                          </Badge>
                        )}
                        {stage.status === 'pending' && (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>
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
                  {stage.status === 'pending' && !paidStages.includes(stage.key) && isStageEligible(stage) && (
                    <div className="mt-3">
                      <Button
                        variant="default"
                        size="sm"
                        className="text-xs w-full bg-[#1A9952] hover:bg-[#158844]"
                        onClick={() => handleStagePayment(stage)}
                        disabled={processingPayment !== null || !razorpayLoaded || !razorpayKeyId}
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
              ))}
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground mt-4">
              <Info className="w-3 h-3 mt-0.5" />
              <p>
                This schedule is calculated from today to your delivery date. If your event date
                changes, your payment stages may also change.
              </p>
            </div>
          </Card>
        )}

        {/* Delivery Information */}
        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Delivery Information
          </h2>
          <div className="space-y-3">
            {order.delivery_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Date</p>
                  <p className="font-medium">
                    {new Date(order.delivery_date).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
            {order.delivery_time && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Time</p>
                  <p className="font-medium">{order.delivery_time}</p>
                </div>
              </div>
            )}
            {order.delivery_address && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
                <p className="font-medium">{order.delivery_address}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Order Items */}
        {items.length > 0 && (
          <Card className="p-4">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Order Items
            </h2>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.dishId || index} className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">
                        {item.name || `Dish ${item.dishId}`}
                      </h3>
                      {item.dietary_type && (
                        <Badge variant="outline" className="flex-shrink-0">
                          {item.dietary_type}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </span>
                      <span className="font-semibold text-primary">
                        ₹{item.price.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Bill Details */}
        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-4">Bill Details</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{parseFloat(order.subtotal?.toString() || '0').toFixed(2)}</span>
            </div>
            {parseFloat(order.packaging_fee?.toString() || '0') > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Packaging Fee</span>
                <span>₹{parseFloat(order.packaging_fee?.toString() || '0').toFixed(2)}</span>
              </div>
            )}
            {parseFloat(order.platform_fee?.toString() || '0') > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee</span>
                <span>₹{parseFloat(order.platform_fee?.toString() || '0').toFixed(2)}</span>
              </div>
            )}
            {parseFloat(order.gst?.toString() || '0') > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST</span>
                <span>₹{parseFloat(order.gst?.toString() || '0').toFixed(2)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary">
                ₹{parseFloat(order.total?.toString() || '0').toFixed(2)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

