import { useRoute, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DishCard from "@/components/DishCard";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import FloatingCartButton from "@/components/FloatingCartButton";
import { useState } from "react";
import { useGoBack } from "@/hooks/useGoBack";

import dishImage from '@assets/stock_images/biryani_rice_dish_fo_8445bdd6.jpg';
import dishImage2 from '@assets/stock_images/indian_food_platter__fb1fa3f3.jpg';

// todo: remove mock functionality
const MOCK_DISHES = [
  { id: '1', name: 'Masala Dosa', description: 'Crispy rice crepe with spiced potato filling', price: 80, image: dishImage },
  { id: '2', name: 'Idli Sambar', description: 'Steamed rice cakes with lentil stew', price: 60, image: dishImage2 },
  { id: '3', name: 'Vada', description: 'Crispy lentil fritters', price: 40, image: dishImage },
  { id: '4', name: 'Pongal', description: 'Rice and lentil khichdi with ghee', price: 70, image: dishImage2 },
  { id: '5', name: 'Uttapam', description: 'Thick rice pancake with toppings', price: 90, image: dishImage },
  { id: '6', name: 'Rava Dosa', description: 'Crispy semolina crepe', price: 85, image: dishImage2 },
];

export default function DishesPage() {
  const [, params] = useRoute("/dishes/:mealType/:category");
  const [, setLocation] = useLocation();
  const mealType = params?.mealType || 'tiffins';
  const goBack = useGoBack(`/categories/${mealType}`);
  const [activeTab, setActiveTab] = useState('categories');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  // todo: remove mock functionality
  const [cartItems, setCartItems] = useState([
    { id: '1', name: 'Masala Dosa', price: 80, quantity: 1, category: 'Tiffins', image: dishImage }
  ]);

  const category = params?.category || 'south-indian-tiffins';

  const handleAdd = (id: string) => {
    setQuantities(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleRemove = (id: string) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setLocation('/');
    } else if (tab === 'cart') {
      setLocation('/categories/tiffins');
    } else if (tab === 'orders') {
      setLocation('/orders');
    } else if (tab === 'profile') {
      setLocation('/profile');
    }
  };

  const handleUpdateQuantity = (id: string, change: number) => {
    setCartItems(items => 
      items.map(item => 
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + change) } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const totalItems = Object.values(quantities).reduce((sum, q) => sum + q, 0) + cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = Object.entries(quantities).reduce((sum, [id, q]) => {
    const dish = MOCK_DISHES.find(d => d.id === id);
    return sum + (dish ? dish.price * q : 0);
  }, 0) + cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const categoryName = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      <AppHeader 
        cartItemCount={totalItems}
        onCartClick={() => setLocation('/categories/tiffins')}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 -ml-2"
          onClick={goBack}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold font-serif mb-2" data-testid="text-page-title">
            {categoryName}
          </h2>
          <p className="text-muted-foreground" data-testid="text-page-subtitle">
            Add items to your plate
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_DISHES.map((dish) => (
            <DishCard
              key={dish.id}
              id={dish.id}
              name={dish.name}
              description={dish.description}
              price={dish.price}
              image={dish.image}
              quantity={quantities[dish.id] || 0}
              onAdd={handleAdd}
              onRemove={handleRemove}
            />
          ))}
        </div>
      </main>

      <FloatingCartButton 
        itemCount={totalItems}
        totalPrice={totalPrice}
        onClick={() => setLocation('/categories/tiffins')}
      />

      <BottomNav 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        cartItemCount={totalItems}
      />
    </div>
  );
}
