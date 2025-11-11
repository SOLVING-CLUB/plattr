import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Calendar, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import OrderSummaryCard from "@/components/OrderSummaryCard";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getSupabaseImageUrl } from "@/lib/supabase";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cartStorage } from "@/lib/cartStorage";
import { useGoBack } from "@/hooks/useGoBack";

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

// Delivery time slots
const TIME_SLOTS = [
  '9:00 AM - 11:00 AM',
  '11:00 AM - 1:00 PM',
  '1:00 PM - 3:00 PM',
  '3:00 PM - 5:00 PM',
  '5:00 PM - 7:00 PM',
  '7:00 PM - 9:00 PM',
];

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
  const { toast } = useToast();

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

  // Create address and place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      if (!deliveryAddress.trim()) {
        throw new Error('Please enter your delivery address');
      }

      if (!deliveryDate || !deliveryTime) {
        throw new Error('Please select delivery date and time');
      }

      // For guests, just return a success response without creating order
      if (!isAuthenticated) {
        return { 
          isGuest: true,
          message: 'Thank you for your order! Our team will contact you shortly.' 
        };
      }

      // For authenticated users, create the actual order
      // First, create the address
      const addressResponse = await apiRequest('POST', '/api/addresses', {
        label: addressLabel,
        address: deliveryAddress,
        landmark: landmark || null,
        isDefault: false,
      });
      
      if (!addressResponse.ok) {
        const errorData = await addressResponse.json();
        throw new Error(errorData.error || 'Failed to create address');
      }
      
      const addressData = await addressResponse.json();
      const newAddressId = addressData.id;

      // Then create the order with the new address
      const orderResponse = await apiRequest('POST', '/api/orders', {
        addressId: newAddressId,
        deliveryDate,
        deliveryTime,
      });
      
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }
      
      return await orderResponse.json();
    },
    onSuccess: (orderData) => {
      // Clear cart from localStorage
      cartStorage.clearCart();
      
      // Invalidate cart query to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      
      // Show success message
      toast({
        title: "Thank You!",
        description: orderData?.isGuest 
          ? "We've received your order. Our team will contact you shortly!" 
          : "Your order has been placed successfully!",
      });
      
      // Navigate to confirmation page
      if (orderData?.orderNumber) {
        setLocation(`/order-confirmation?orderNumber=${orderData.orderNumber}`);
      } else {
        setLocation('/order-confirmation');
      }
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to place order. Please try again.";
      
      toast({
        title: "Order Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

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
  const deliveryFee = 40;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + deliveryFee + tax;

  // Group items by category
  const groupedItems = cartItems.reduce((acc, item) => {
    const categoryLabel = item.dish.categoryName || 
      (item.dish.mealType?.[0]?.toUpperCase() || 'Other');
    
    if (!acc[categoryLabel]) acc[categoryLabel] = [];
    acc[categoryLabel].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  const deliveryDates = generateDeliveryDates();

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
            <div className="space-y-2">
              <Label htmlFor="delivery-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Delivery Date
              </Label>
              <Select value={deliveryDate} onValueChange={setDeliveryDate}>
                <SelectTrigger id="delivery-date" data-testid="select-delivery-date">
                  <SelectValue placeholder="Select delivery date" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryDates.map((date) => (
                    <SelectItem key={date.value} value={date.value} data-testid={`option-date-${date.value}`}>
                      {date.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery-time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Delivery Time
              </Label>
              <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                <SelectTrigger id="delivery-time" data-testid="select-delivery-time">
                  <SelectValue placeholder="Select delivery time slot" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot} data-testid={`option-time-${slot}`}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <OrderSummaryCard 
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          tax={tax}
        />

        <Button 
          size="lg" 
          className="w-full rounded-full sticky bottom-6 shadow-xl"
          onClick={() => placeOrderMutation.mutate()}
          disabled={!deliveryAddress.trim() || !deliveryDate || !deliveryTime || placeOrderMutation.isPending}
          data-testid="button-place-order"
        >
          {placeOrderMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Placing Order...
            </>
          ) : (
            `Place Order • ₹${total.toFixed(0)}`
          )}
        </Button>
      </main>
    </div>
  );
}
