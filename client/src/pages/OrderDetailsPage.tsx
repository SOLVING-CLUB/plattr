import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, MapPin, Package, Calendar } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";
import { getSupabaseImageUrl } from "@/lib/supabase";
import { useGoBack } from "@/hooks/useGoBack";

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

  const { data: order, isLoading } = useQuery<OrderDetails>({
    queryKey: ['/api/orders', orderId],
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
                minute: '2-digit'
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
                    year: 'numeric'
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
