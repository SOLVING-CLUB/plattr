import OrderSummaryCard from '../OrderSummaryCard';

export default function OrderSummaryCardExample() {
  return (
    <div className="p-4 max-w-md">
      <OrderSummaryCard 
        subtotal={340}
        deliveryFee={40}
        tax={34}
        discount={50}
      />
    </div>
  );
}
