import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useGoBack } from "@/hooks/useGoBack";
import { ArrowLeft, Edit2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseImageUrl } from "@/lib/supabase";

// Dish type
interface Dish {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  dietaryType: 'veg' | 'non-veg';
  categoryId: string;
}

// Planner configuration type
interface PlannerConfig {
  id: 'basic' | 'gold' | 'platinum';
  name: string;
  title: string;
  pricePerGuest: number;
  totalItems: number;
  categories: {
    id: string;
    name: string;
    quota: number;
    icon: string;
  }[];
  availableDishes: string[]; // dish IDs that are available in this plan
}

// Category icon image imports
import platterImage from "@assets/stock_images/indian_food_platter__04e21eaf.jpg";

// Planner configurations
const PLANNER_CONFIGS: Record<string, PlannerConfig> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    title: 'South Indian Breakfast (Basic)',
    pricePerGuest: 249,
    totalItems: 8,
    categories: [
      { id: 'mains', name: 'Mains', quota: 2, icon: platterImage },
      { id: 'sides', name: 'Sides & Bevera...', quota: 2, icon: platterImage },
      { id: 'accompaniments', name: 'Accompanimen...', quota: 4, icon: platterImage }
    ],
    availableDishes: ['plain-idly', 'kesari-bath', 'pongal', 'upma', 'vada', 'sambar', 'coconut-chutney', 'filter-coffee']
  },
  gold: {
    id: 'gold',
    name: 'Gold',
    title: 'South Indian Breakfast (Gold)',
    pricePerGuest: 329,
    totalItems: 11,
    categories: [
      { id: 'mains', name: 'Mains', quota: 2, icon: platterImage },
      { id: 'sweets', name: 'Sweets & Fruits', quota: 1, icon: platterImage },
      { id: 'beverages', name: 'Beverages', quota: 1, icon: platterImage },
      { id: 'sides', name: 'Sides', quota: 3, icon: platterImage },
      { id: 'others', name: '1+', quota: 4, icon: platterImage }
    ],
    availableDishes: ['mysore-bonda', 'pongal', 'poori', 'pulihora', 'upma', 'vada', 'sambar', 'coconut-chutney', 'filter-coffee', 'kesari-bath', 'banana']
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum',
    title: 'South Indian Breakfast (Platinum)',
    pricePerGuest: 429,
    totalItems: 14,
    categories: [
      { id: 'mains', name: 'Mains', quota: 3, icon: platterImage },
      { id: 'sweets', name: 'Sweets', quota: 1, icon: platterImage },
      { id: 'fruits', name: 'Fruits', quota: 1, icon: platterImage },
      { id: 'beverages', name: 'Beverages', quota: 1, icon: platterImage },
      { id: 'sides', name: 'Sides', quota: 3, icon: platterImage },
      { id: 'others', name: '1+', quota: 5, icon: platterImage }
    ],
    availableDishes: ['bhatura', 'bisi-bela-bath', 'chapathi', 'chitti-gare', 'plain-idly', 'medu-vada', 'sambar', 'coconut-chutney', 'tomato-chutney', 'filter-coffee', 'kesari-bath', 'banana', 'mango', 'watermelon']
  }
};

// Meal type display titles
const MEAL_TYPE_TITLES: Record<string, string> = {
  'tiffins': 'South Indian Breakfast',
  'snacks': 'Snacks & Appetizers',
  'lunch-dinner': 'Lunch & Dinner'
};

export default function PlannerDetailPage() {
  const [, params] = useRoute("/planner/:mealType/:planType");
  const [, setLocation] = useLocation();
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  const mealType = params?.mealType || 'tiffins';
  const goBack = useGoBack(`/categories/${mealType}`);
  const planType = (params?.planType || 'basic') as 'basic' | 'gold' | 'platinum';
  const config = PLANNER_CONFIGS[planType];
  
  // Get meal type title for display
  const mealTypeTitle = MEAL_TYPE_TITLES[mealType] || 'Menu';
  
  // Update config title with meal type
  const plannerTitle = `${mealTypeTitle} (${config.name})`;

  // Fetch dishes for the specific meal type and plan type
  const { data: allDishes = [], isLoading } = useQuery<Dish[]>({
    queryKey: ['/api/dishes', mealType, planType],
  });

  // Apply dietary filter
  const filteredDishes = dietaryFilter === 'all' 
    ? allDishes
    : allDishes.filter(dish => dish.dietaryType === dietaryFilter);

  // Calculate category quotas filled
  const getCategoryCount = (categoryId: string) => {
    // This would be calculated based on dish categories in real implementation
    return Object.keys(selectedItems).length; // Simplified
  };

  const handleAddDish = (dishId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [dishId]: (prev[dishId] || 0) + 1
    }));
  };

  const totalSelected = Object.values(selectedItems).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              data-testid="button-back"
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📦</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900" data-testid="text-planner-title">
                {plannerTitle}
              </h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            data-testid="button-edit-planner"
            className="rounded-full"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Dietary Filter */}
        <div className="flex items-center justify-center gap-2 px-4 pb-3">
          <Badge
            variant={dietaryFilter === 'veg' || dietaryFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer hover-elevate active-elevate-2"
            onClick={() => setDietaryFilter(dietaryFilter === 'veg' ? 'all' : 'veg')}
            data-testid="badge-filter-veg"
          >
            <span className="text-green-600">🌱</span>
            <span className="ml-1">Pure Veg</span>
          </Badge>
          <Badge
            variant={dietaryFilter === 'non-veg' ? 'default' : 'outline'}
            className="cursor-pointer hover-elevate active-elevate-2"
            onClick={() => setDietaryFilter(dietaryFilter === 'non-veg' ? 'all' : 'non-veg')}
            data-testid="badge-filter-nonveg"
          >
            <span className="text-red-600">🍗</span>
            <span className="ml-1">Non Veg</span>
          </Badge>
        </div>
      </header>

      {/* Category Pills - Horizontal at top on mobile, sidebar on desktop */}
      <div className="sm:hidden px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex justify-around gap-2">
          {config.categories.map(category => (
            <div
              key={category.id}
              className="flex flex-col items-center cursor-pointer hover-elevate rounded-lg p-2 flex-1 max-w-[120px]"
              data-testid={`badge-category-${category.id}`}
            >
              <div className="w-14 h-14 rounded-full overflow-hidden mb-1.5 ring-2 ring-gray-200">
                <img 
                  src={category.icon} 
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[10px] font-semibold text-gray-900 leading-tight mb-1 text-center">
                {category.name}
              </p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                getCategoryCount(category.id) >= category.quota 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {getCategoryCount(category.id)}/{category.quota}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Left Sidebar - Categories (Desktop only) */}
        <aside className="hidden sm:block w-24 border-r border-gray-200 bg-white/50 backdrop-blur-sm min-h-[calc(100vh-140px)] p-3">
          <div className="space-y-3">
            {config.categories.map(category => (
              <div
                key={category.id}
                className="flex flex-col items-center text-center cursor-pointer hover-elevate rounded-lg p-2"
                data-testid={`card-category-${category.id}`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden mb-1.5 ring-2 ring-gray-200">
                  <img 
                    src={category.icon} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-[10px] font-semibold text-gray-900 leading-tight mb-1">
                  {category.name}
                </p>
                <div className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                  getCategoryCount(category.id) >= category.quota 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {getCategoryCount(category.id)}/{category.quota}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content - Dishes Grid */}
        <main className="flex-1 p-4 sm:p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading dishes...</p>
            </div>
          ) : filteredDishes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No dishes available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {filteredDishes.map(dish => (
                <div
                  key={dish.id}
                  className="bg-white rounded-xl overflow-hidden hover-elevate"
                  data-testid={`card-dish-${dish.id}`}
                >
                  <div className="aspect-square relative">
                    <img
                      src={getSupabaseImageUrl((dish as any).image_url || dish.imageUrl)}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                    />
                    <Badge
                      variant="secondary"
                      className="absolute top-2 left-2 text-xs bg-white/90"
                    >
                      {dish.dietaryType === 'veg' ? '🌱' : '🍗'}
                    </Badge>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-1">
                      {dish.name}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-primary border-primary hover:bg-primary hover:text-white"
                      onClick={() => handleAddDish(dish.id)}
                      data-testid={`button-add-${dish.id}`}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <div>
            <p className="text-xs text-gray-600">Price per guest</p>
            <p className="text-xl font-bold text-primary" data-testid="text-price-per-guest">
              ₹{config.pricePerGuest}/Guest
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900" data-testid="text-items-count">
              Items ({totalSelected}/{config.totalItems})
            </p>
          </div>
        </div>
      </div>

      {/* Floating Add Ons Button */}
      <Button
        size="lg"
        className="fixed bottom-24 right-6 rounded-full shadow-xl bg-gray-900 hover:bg-gray-800 text-white px-6 py-6"
        data-testid="button-add-ons"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Ons
      </Button>
    </div>
  );
}
