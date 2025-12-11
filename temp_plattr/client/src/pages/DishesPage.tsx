import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DishCard from "@/components/DishCard";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import FloatingCartButton from "@/components/FloatingCartButton";
import { useGoBack } from "@/hooks/useGoBack";
import type { Dish } from "@shared/schema";
import { getSupabaseImageUrl } from "@/lib/supabase";

import dishFallbackImage from "@assets/stock_images/biryani_rice_dish_fo_8445bdd6.jpg";

export default function DishesPage() {
  const [, params] = useRoute("/dishes/:mealType/:category");
  const [, setLocation] = useLocation();
  const mealType = (params?.mealType as string) || "tiffins";
  const categoryId = (params?.category as string) || "all";
  const goBack = useGoBack(`/categories/${mealType}`);
  const [activeTab, setActiveTab] = useState("categories");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  // Fetch dishes for this meal type + category from Supabase
  const {
    data: dishes = [],
    isLoading,
  } = useQuery<Dish[]>({
    queryKey: ["/api/dishes", mealType, categoryId, "all"],
  });

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

  const uiDishes = dishes
    .filter(dish => dish.isAvailable !== false)
    .map(dish => ({
      id: dish.id,
      name: dish.name,
      description: dish.description || "",
      price: Number(dish.price),
      image: dish.imageUrl ? getSupabaseImageUrl(dish.imageUrl) : dishFallbackImage,
    }));

  const totalItems = Object.values(quantities).reduce((sum, q) => sum + q, 0);
  const totalPrice = Object.entries(quantities).reduce((sum, [id, q]) => {
    const dish = uiDishes.find(d => d.id === id);
    return sum + (dish ? dish.price * q : 0);
  }, 0);

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

        {isLoading ? (
          <p className="text-muted-foreground">Loading dishes...</p>
        ) : uiDishes.length === 0 ? (
          <p className="text-muted-foreground">No dishes available for this category yet.</p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uiDishes.map((dish) => (
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
        )}
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
