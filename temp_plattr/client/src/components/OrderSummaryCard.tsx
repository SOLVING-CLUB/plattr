import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface OrderSummaryCardProps {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount?: number;
}

export default function OrderSummaryCard({ subtotal, deliveryFee, tax, discount = 0 }: OrderSummaryCardProps) {
  const total = subtotal + deliveryFee + tax - discount;

  return (
    <Card className="p-4" data-testid="card-order-summary">
      <h3 className="font-semibold text-lg mb-4" data-testid="text-bill-details">Bill Details</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground" data-testid="text-subtotal-label">Item Total</span>
          <span data-testid="text-subtotal">₹{subtotal}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground" data-testid="text-delivery-label">Delivery Fee</span>
          <span data-testid="text-delivery-fee">₹{deliveryFee}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground" data-testid="text-tax-label">Taxes & Charges</span>
          <span data-testid="text-tax">₹{tax}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span data-testid="text-discount-label">Discount</span>
            <span data-testid="text-discount">-₹{discount}</span>
          </div>
        )}
        
        <Separator />
        
        <div className="flex justify-between text-lg font-bold pt-1">
          <span data-testid="text-total-label">To Pay</span>
          <span className="text-primary font-serif" data-testid="text-total">₹{total}</span>
        </div>
      </div>
    </Card>
  );
}
