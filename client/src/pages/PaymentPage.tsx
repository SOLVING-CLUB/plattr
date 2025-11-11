import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useGoBack } from "@/hooks/useGoBack";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface PaymentFormProps {
  amount: number;
}

const PaymentForm = ({ amount }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
        <PaymentElement />
      </Card>

      <div className="bg-card border rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total Amount</span>
          <span className="text-2xl font-bold text-primary">₹{amount.toFixed(2)}</span>
        </div>
      </div>

      <Button 
        type="submit" 
        size="lg" 
        className="w-full"
        disabled={!stripe || isProcessing}
        data-testid="button-pay-now"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ₹${amount.toFixed(2)}`
        )}
      </Button>
    </form>
  );
};

export default function PaymentPage() {
  const [, setLocation] = useLocation();
  const goBack = useGoBack('/checkout');
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!stripePublicKey) {
      setError("Payment system is not configured. Please contact support.");
      return;
    }

    // Create PaymentIntent - server will calculate amount from cart using session userId
    apiRequest("POST", "/api/create-payment-intent", {})
      .then(async (response) => {
        const data = await response.json();
        if (data.clientSecret && data.amount) {
          setClientSecret(data.clientSecret);
          setAmount(data.amount);
        } else {
          throw new Error(data.error || "Failed to get payment client secret");
        }
      })
      .catch((error) => {
        console.error("Payment intent error:", error);
        setError("Unable to initialize payment. Please log in and try again.");
        toast({
          title: "Payment Setup Failed",
          description: "Unable to initialize payment. Please try again.",
          variant: "destructive",
        });
      });
  }, [toast]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <h1 className="text-xl font-bold mb-4">Payment Setup Error</h1>
          <p className="text-muted-foreground mb-4">
            {error}
          </p>
          <div className="space-y-2">
            <Button onClick={() => setLocation('/checkout')} data-testid="button-back-to-checkout" className="w-full">
              Back to Checkout
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full" data-testid="button-retry">
              Try Again
            </Button>
            <Button onClick={() => setLocation('/auth')} variant="outline" className="w-full" data-testid="button-login">
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up payment...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold font-serif" data-testid="text-page-title">Payment</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Elements stripe={stripePromise!} options={{ clientSecret }}>
          <PaymentForm amount={amount} />
        </Elements>
      </main>
    </div>
  );
}
