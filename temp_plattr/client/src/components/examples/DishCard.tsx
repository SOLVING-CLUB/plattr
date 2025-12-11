import DishCard from '../DishCard';
import dishImage from '@assets/stock_images/biryani_rice_dish_fo_000d5911.jpg';
import { useState } from 'react';

export default function DishCardExample() {
  const [quantities, setQuantities] = useState<Record<string, number>>({ 
    'biryani': 0,
    'dosa': 1 
  });

  const handleAdd = (id: string) => {
    setQuantities(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    console.log(`Added ${id}`);
  };

  const handleRemove = (id: string) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
    console.log(`Removed ${id}`);
  };

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
      <DishCard 
        id="biryani"
        name="Hyderabadi Biryani"
        description="Aromatic basmati rice with tender chicken and authentic spices"
        price={180}
        image={dishImage}
        onAdd={handleAdd}
        onRemove={handleRemove}
        quantity={quantities['biryani']}
      />
      <DishCard 
        id="dosa"
        name="Masala Dosa"
        description="Crispy rice crepe with spiced potato filling, served with sambar and chutney"
        price={80}
        image={dishImage}
        onAdd={handleAdd}
        onRemove={handleRemove}
        quantity={quantities['dosa']}
      />
    </div>
  );
}
