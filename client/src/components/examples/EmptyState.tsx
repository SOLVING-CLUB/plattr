import EmptyState from '../EmptyState';
import { ShoppingCart } from 'lucide-react';

export default function EmptyStateExample() {
  return (
    <div className="max-w-md mx-auto">
      <EmptyState 
        icon={ShoppingCart}
        title="Your platter is empty"
        description="Add some delicious items to get started with your order"
        actionLabel="Browse Menu"
        onAction={() => console.log('Browse menu clicked')}
      />
    </div>
  );
}
