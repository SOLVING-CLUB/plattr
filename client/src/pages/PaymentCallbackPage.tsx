import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  bulkMealOrderService, 
  sixtyMinBulkOrderService, 
  mealboxOrderService, 
  sixtyMinMealboxOrderService,
  addressService, 
  paymentService 
} from "@/lib/supabase-service";

// Use environment variables with fallback to hardcoded values (same as other files)
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://leltckltotobsibixhqo.supabase.co').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbHRja2x0b3RvYnNpYml4aHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzc5ODEsImV4cCI6MjA3NTk1Mzk4MX0._IrMgGQDJB7OvKEoT7pwWG9AjN6aeN1ejnj8IViDLyE').trim();

export default function PaymentCallbackPage() {
  const [location, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      console.log('[PaymentCallback] Starting payment verification...');
      try {
        // Parse search params from URL
        const url = new URL(window.location.href);
        const searchParams = url.searchParams;
        
        // Get payment details from URL params (Razorpay sends these)
        const razorpayPaymentId = searchParams.get("razorpay_payment_id");
        const razorpayOrderId = searchParams.get("razorpay_order_id");
        const razorpaySignature = searchParams.get("razorpay_signature");
        const paymentLinkId = searchParams.get("razorpay_payment_link_id");
        const paymentLinkReferenceId = searchParams.get("razorpay_payment_link_reference_id");

        if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
          // Check if payment link was used
          if (paymentLinkId) {
            // Fetch payment status from payment link
            const linkStatusResponse = await fetch(
              `${SUPABASE_URL}/functions/v1/razorpay/payment-link-status?payment_link_id=${paymentLinkId}`,
              {
                headers: {
                  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                },
              }
            );

            if (linkStatusResponse.ok) {
              const linkData = await linkStatusResponse.json();
              if (linkData.status === "paid") {
                // Try to get order ID from stored data
                let redirectOrderId: string | null = null;
                try {
                  const orderDataKey = `pending_order_${razorpayOrderId}`;
                  const storedOrderData = sessionStorage.getItem(orderDataKey);
                  if (storedOrderData) {
                    const { orderData } = JSON.parse(storedOrderData);
                    redirectOrderId = orderData?.orderId || orderData?.id || null;
                  }
                } catch (e) {
                  console.error('[PaymentCallback] Error getting order ID from stored data:', e);
                }
                
                // Redirect immediately (no delay) - use replace to prevent back button issues
                if (redirectOrderId) {
                  console.log('[PaymentCallback] ✅ Payment link - redirecting to order status:', `/orders/${redirectOrderId}`);
                  window.location.replace(`/orders/${redirectOrderId}`);
                } else {
                  console.log('[PaymentCallback] ⚠️ Payment link - no order ID, redirecting to orders list');
                  window.location.replace("/orders");
                }
                return;
              }
            }
          }

          setStatus("error");
          setMessage("Payment verification failed. Please contact support if payment was deducted.");
          return;
        }

        // Verify payment signature
        const verifyResponse = await fetch(`${SUPABASE_URL}/functions/v1/razorpay/verify`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
          }),
        });

        // Check if response is OK and is JSON
        if (!verifyResponse.ok) {
          let errorText = '';
          try {
            errorText = await verifyResponse.text();
          } catch (e) {
            errorText = 'Could not read error response';
          }
          
          console.error("[PaymentCallback] Verify response error:", {
            status: verifyResponse.status,
            statusText: verifyResponse.statusText,
            url: `${SUPABASE_URL}/functions/v1/razorpay/verify`,
            body: errorText.substring(0, 500),
          });
          
          // If it's an HTML response, it's likely a 404 or server error page
          if (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html')) {
            setStatus("error");
            setMessage("Payment verification service is not available. Please contact support if payment was deducted.");
            return;
          }
          
          throw new Error(`Payment verification failed: ${verifyResponse.status} ${verifyResponse.statusText}`);
        }

        // Check content type
        const contentType = verifyResponse.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          let errorText = '';
          try {
            errorText = await verifyResponse.text();
          } catch (e) {
            errorText = 'Could not read response';
          }
          
          console.error("[PaymentCallback] Non-JSON response:", {
            contentType,
            body: errorText.substring(0, 500),
          });
          
          // If it's HTML, it's likely an error page
          if (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html')) {
            setStatus("error");
            setMessage("Payment verification service returned an error page. Please contact support if payment was deducted.");
            return;
          }
          
          throw new Error("Payment verification service returned invalid response format");
        }

        const verifyData = await verifyResponse.json();

        if (verifyData.verified) {
          // Try to handle order from stored order data
          try {
            const orderDataKey = `pending_order_${razorpayOrderId}`;
            const storedOrderData = sessionStorage.getItem(orderDataKey);
            
            if (storedOrderData) {
              const { orderData, orderType } = JSON.parse(storedOrderData);
              
              console.log('[PaymentCallback] Stored order data found:', {
                orderType,
                hasOrderData: !!orderData,
                orderDataKeys: orderData ? Object.keys(orderData) : [],
                orderId: orderData?.orderId || orderData?.id,
              });
              
              // Check if this is a payment stage for an existing order
              if (orderData.orderId && orderData.paymentStage) {
                // This is a payment stage for an existing order
                const userId = localStorage.getItem('userId');
                if (!userId) {
                  throw new Error('User not authenticated');
                }

                // Determine order type for payment service
                let paymentOrderType: 'bulk_meal' | 'mealbox' | 'sixty_min_bulk' | 'sixty_min_mealbox' | 'snack_box' = 'bulk_meal';
                if (orderType === 'bulk_meal' || orderType === 'sixty_min_bulk') {
                  paymentOrderType = orderType === 'sixty_min_bulk' ? 'sixty_min_bulk' : 'bulk_meal';
                } else if (orderType === 'mealbox' || orderType === 'sixty_min_mealbox') {
                  paymentOrderType = orderType === 'sixty_min_mealbox' ? 'sixty_min_mealbox' : 'mealbox';
                } else if (orderType === 'snack_box') {
                  paymentOrderType = 'snack_box';
                }

                // Determine if test payment (check from environment or stored key)
                const storedRazorpayKeyId = localStorage.getItem('razorpayKeyId') || '';
                const isTestPayment = storedRazorpayKeyId?.includes('test') || storedRazorpayKeyId?.includes('rzp_test');

                // Add payment stage to existing order
                await paymentService.addPaymentStage({
                  orderId: orderData.orderId,
                  orderType: paymentOrderType,
                  orderNumber: orderData.orderNumber,
                  userId: userId,
                  paymentStage: orderData.paymentStage as 'second' | 'final',
                  amount: orderData.amount,
                  razorpayOrderId: razorpayOrderId,
                  razorpayPaymentId: razorpayPaymentId,
                  razorpaySignature: razorpaySignature,
                  razorpayReceipt: razorpayOrderId,
                  paymentStatus: 'success',
                  isTestPayment: isTestPayment,
                  metadata: {
                    payment_date: new Date().toISOString(),
                    payment_method: 'razorpay',
                    stage_label: orderData.stageLabel || orderData.paymentStage,
                  },
                });

                // Clear stored data
                sessionStorage.removeItem(orderDataKey);
                
                // Redirect to order details page immediately - use replace to prevent back button issues
                console.log('[PaymentCallback] ✅ Payment stage completed, redirecting...');
                
                if (orderType === 'bulk_meal' || orderType === 'sixty_min_bulk') {
                  console.log('[PaymentCallback] Executing payment stage redirect to:', `/bulk-orders/${orderData.orderId}`);
                  window.location.replace(`/bulk-orders/${orderData.orderId}`);
                } else {
                  console.log('[PaymentCallback] Executing payment stage redirect to:', `/orders/${orderData.orderId}`);
                  window.location.replace(`/orders/${orderData.orderId}`);
                }
                return;
              }
              
              // Create new order based on type
              if (orderType === 'bulk-meal' || orderType === 'sixty-min-bulk' || orderType === 'bulk_meal' || orderType === 'sixty_min_bulk') {
                // Handle bulk meal order
                const isSixtyMin = orderType === 'sixty-min-bulk';
                const service = isSixtyMin ? sixtyMinBulkOrderService : bulkMealOrderService;
                
                // Handle address if needed
                let finalAddressId = orderData.addressId;
                if (!finalAddressId && orderData.deliveryAddress && orderData.saveAddressForFuture) {
                  try {
                    const newAddress = await addressService.create({
                      label: "My Location",
                      address: orderData.deliveryAddress,
                      landmark: orderData.addressLine2 || undefined,
                      isDefault: false,
                    });
                    finalAddressId = newAddress.id;
                  } catch (addressError: any) {
                    console.error("Error creating address:", addressError);
                  }
                }
                
                const finalOrderData = {
                  items: orderData.items,
                  selectedAddons: orderData.selectedAddons,
                  subtotal: orderData.subtotal,
                  gst: orderData.gst,
                  platformFee: orderData.platformFee,
                  packagingFee: orderData.packagingFee,
                  total: orderData.total,
                  deliveryDate: orderData.deliveryDate,
                  deliveryTime: orderData.deliveryTime,
                  addressId: finalAddressId,
                  deliveryAddress: orderData.deliveryAddress,
                  couponId: orderData.couponId,
                  couponCode: orderData.couponCode,
                  discountApplied: orderData.discountApplied,
                };
                
                const createdOrder = await service.create(finalOrderData);
                
                console.log('[PaymentCallback] Bulk meal order created:', {
                  orderId: createdOrder?.id,
                  orderNumber: createdOrder?.order_number,
                  isSixtyMin,
                  fullOrder: createdOrder,
                });
                
                // Update order status to 'paid' and add payment record
                if (createdOrder?.id) {
                  const orderId = createdOrder.id;
                  
                  try {
                    await service.update(orderId, { status: 'paid' });
                    
                    // Create payment record
                    await paymentService.create({
                      order_id: orderId,
                      order_type: isSixtyMin ? 'sixty_min_bulk_orders' : 'bulk_meal_orders',
                      razorpay_order_id: razorpayOrderId,
                      razorpay_payment_id: razorpayPaymentId,
                      razorpay_signature: razorpaySignature,
                      amount: orderData.total,
                      status: 'verified',
                    });
                  } catch (paymentError) {
                    console.error('[PaymentCallback] Error updating order/payment record:', paymentError);
                    // Continue with redirect even if payment record fails
                  }
                  
                  // Clear stored data
                  sessionStorage.removeItem(orderDataKey);
                  
                  // Redirect to order details page immediately
                  console.log('[PaymentCallback] ✅ Order created successfully, redirecting to:', `/bulk-orders/${orderId}`);
                  
                  // Use window.location.replace for immediate redirect (no delay)
                  window.location.replace(`/bulk-orders/${orderId}`);
                  return;
                } else {
                  console.error('[PaymentCallback] ❌ Order created but ID is missing:', createdOrder);
                  throw new Error('Order created but ID is missing');
                }
                
                // Clear stored data
                sessionStorage.removeItem(orderDataKey);
              } else if (orderType === 'mealbox' || orderType === 'sixty-min-mealbox' || orderType === 'sixty_min_mealbox') {
                // Handle mealbox order
                const isSixtyMin = orderType === 'sixty-min-mealbox';
                const service = isSixtyMin ? sixtyMinMealboxOrderService : mealboxOrderService;
                
                // Handle address if needed
                let finalAddressId = orderData.addressId;
                if (!finalAddressId && orderData.deliveryAddress && orderData.saveAddressForFuture) {
                  try {
                    const newAddress = await addressService.create({
                      label: "My Location",
                      address: orderData.deliveryAddress,
                      landmark: orderData.addressLine2 || undefined,
                      isDefault: false,
                    });
                    finalAddressId = newAddress.id;
                  } catch (addressError: any) {
                    console.error("Error creating address:", addressError);
                  }
                }
                
                const createdOrder = await service.create(orderData);
                
                console.log('[PaymentCallback] Mealbox order created:', {
                  orderId: createdOrder?.id,
                  orderNumber: createdOrder?.order_number,
                  isSixtyMin,
                  fullOrder: createdOrder,
                });
                
                // Update order status to 'paid' and add payment record
                if (createdOrder?.id) {
                  const orderId = createdOrder.id;
                  
                  try {
                    await service.update(orderId, { status: 'paid' });
                    
                    // Create payment record
                    await paymentService.create({
                      order_id: orderId,
                      order_type: isSixtyMin ? 'sixty_min_mealbox_orders' : 'mealbox_orders',
                      razorpay_order_id: razorpayOrderId,
                      razorpay_payment_id: razorpayPaymentId,
                      razorpay_signature: razorpaySignature,
                      amount: orderData.total,
                      status: 'verified',
                    });
                  } catch (paymentError) {
                    console.error('[PaymentCallback] Error updating order/payment record:', paymentError);
                    // Continue with redirect even if payment record fails
                  }
                  
                  // Clear stored data
                  sessionStorage.removeItem(orderDataKey);
                  
                  // Redirect to order details page immediately
                  console.log('[PaymentCallback] ✅ Mealbox order created successfully, redirecting to:', `/orders/${orderId}`);
                  
                  // Use window.location.replace for immediate redirect (no delay)
                  window.location.replace(`/orders/${orderId}`);
                  return;
                } else {
                  console.error('[PaymentCallback] ❌ Mealbox order created but ID is missing:', createdOrder);
                  throw new Error('Mealbox order created but ID is missing');
                }
                
                // Clear stored data
                sessionStorage.removeItem(orderDataKey);
              } else if (orderType === 'snack_box' || orderType === 'regular') {
                // Handle snack box or regular order (already created, just verify payment)
                // Payment record should already be created in the order creation flow
                // Get order ID from stored data if available
                const orderId = orderData.orderId || orderData.id;
                
                // Clear stored data
                sessionStorage.removeItem(orderDataKey);
                
                // Redirect to order details page if we have the order ID
                if (orderId) {
                  setStatus("success");
                  setMessage("Payment successful! Your order is being processed.");
                  
                  // Send payment success notification
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
                        body: `Payment verified. Your order is being processed.`,
                        event_name: 'payment_success',
                        category: 'transactional',
                      }),
                    }).catch(err => console.log('[Notification] Failed to send payment notification:', err));
                  }
                  
                  // Redirect to order details page immediately
                  console.log('[PaymentCallback] ✅ Regular/Snack box order found, redirecting to:', `/orders/${orderId}`);
                  
                  // Use window.location.replace for immediate redirect (no delay)
                  window.location.replace(`/orders/${orderId}`);
                  return;
                }
              }
            }
          } catch (orderError: any) {
            console.error('[PaymentCallback] ❌ Error creating/processing order:', orderError);
            console.error('[PaymentCallback] Order error details:', {
              message: orderError.message,
              stack: orderError.stack,
              orderType,
              razorpayOrderId,
            });
            
            // Try to get order ID from stored data as fallback
            let redirectOrderId: string | null = null;
            try {
              const orderDataKey = `pending_order_${razorpayOrderId}`;
              const storedOrderData = sessionStorage.getItem(orderDataKey);
              if (storedOrderData) {
                const { orderData } = JSON.parse(storedOrderData);
                redirectOrderId = orderData?.orderId || orderData?.id || null;
                console.log('[PaymentCallback] Found order ID in stored data:', redirectOrderId);
              }
            } catch (e) {
              console.error('[PaymentCallback] Error getting order ID from stored data:', e);
            }
            
            // If we have an order ID, redirect to it, otherwise show error
            if (redirectOrderId) {
              console.log('[PaymentCallback] ⚠️ Order creation failed but found order ID, redirecting to:', `/orders/${redirectOrderId}`);
              window.location.replace(`/orders/${redirectOrderId}`);
              return;
            }
            
            // If no order ID, show error but don't fail payment verification
            setStatus("error");
            setMessage("Payment verified but order creation failed. Please contact support with payment ID: " + razorpayPaymentId);
            return;
          }
          
          // This should not be reached if order creation was successful (all paths return early)
          console.warn('[PaymentCallback] ⚠️ Reached end of order processing without redirect - this should not happen');
          setStatus("error");
          setMessage("Payment verified but order processing incomplete. Please contact support.");
        } else {
          setStatus("error");
          setMessage(verifyData.error || "Payment verification failed. Please contact support.");
        }
      } catch (error: any) {
        console.error("[PaymentCallback] Error:", error);
        setStatus("error");
        setMessage("An error occurred while verifying payment. Please contact support.");
      }
    };

    verifyPayment();
  }, [location, setLocation]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-background"
      style={{
        paddingTop: '0',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Payment Status</CardTitle>
          <CardDescription className="text-center">
            {status === "loading" && "Verifying your payment..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Please wait...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-sm text-center text-green-600 font-medium">{message}</p>
              <p className="text-xs text-muted-foreground text-center">
                Redirecting to orders page...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-sm text-center text-red-600 font-medium">{message}</p>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/")}
                >
                  Go Home
                </Button>
                <Button
                  onClick={() => setLocation("/orders")}
                >
                  View Orders
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
