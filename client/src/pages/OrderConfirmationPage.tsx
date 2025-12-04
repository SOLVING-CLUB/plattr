import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Clock, Phone, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function OrderConfirmationPage() {
  const [, setLocation] = useLocation();
  
  // Get order number from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const orderNumber = urlParams.get('orderNumber');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6" data-testid="card-order-confirmation">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
            <CheckCircle className="w-20 h-20 text-green-500 relative" data-testid="icon-success" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-serif text-foreground" data-testid="text-thank-you">
            Thank You!
          </h1>
          <p className="text-muted-foreground" data-testid="text-order-placed">
            Your order has been placed successfully
          </p>
          {orderNumber && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Package className="w-5 h-5 text-primary" />
              <div className="text-sm">
                <span className="text-muted-foreground">Order ID: </span>
                <span className="font-bold text-primary text-lg" data-testid="text-order-number-value">
                  #{orderNumber}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Clock className="w-5 h-5" />
            <span className="font-semibold" data-testid="text-contact-time">Within 5 Minutes</span>
          </div>
          <p className="text-sm text-muted-foreground" data-testid="text-contact-message">
            Our team will contact you shortly to confirm your order details and delivery schedule
          </p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Phone className="w-4 h-4" />
            <span data-testid="text-contact-info">We'll call you soon</span>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <Button 
            onClick={() => setLocation('/orders')} 
            className="w-full"
            data-testid="button-view-orders"
          >
            View My Orders
          </Button>
          <Button 
            onClick={() => setLocation('/')} 
            variant="outline"
            className="w-full"
            data-testid="button-continue-browsing"
          >
            Continue Browsing
          </Button>
        </div>

        <p className="text-xs text-muted-foreground" data-testid="text-track-order">
          {orderNumber 
            ? `Track your order #${orderNumber} in the Orders section`
            : 'You can track your order status in the Orders section'
          }
        </p>
      </Card>
    </div>
  );
}
