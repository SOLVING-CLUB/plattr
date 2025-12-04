import CartDrawer from '../CartDrawer';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import dishImage from '@assets/stock_images/biryani_rice_dish_fo_000d5911.jpg';

export default function CartDrawerExample() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { id: '1', name: 'Masala Dosa', price: 80, quantity: 2, category: 'Tiffins', image: dishImage },
    { id: '2', name: 'Coconut Chutney', price: 20, quantity: 1, category: 'Sides', image: dishImage },
    { id: '3', name: 'Filter Coffee', price: 40, quantity: 2, category: 'Drinks', image: dishImage },
  ]);

  const handleUpdateQuantity = (id: string, change: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + change) } : item
    ));
    console.log(`Updated quantity for ${id} by ${change}`);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    console.log(`Removed item ${id}`);
  };

  return (
    <div className="p-4">
      <Button onClick={() => setOpen(true)} data-testid="button-open-cart">Open Cart</Button>
      <CartDrawer 
        open={open}
        onOpenChange={setOpen}
        items={items}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => console.log('Checkout clicked')}
      />
    </div>
  );
}
