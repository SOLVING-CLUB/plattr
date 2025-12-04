import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, MapPin, ShoppingCart, Search, Mic, ArrowUpDown, SlidersHorizontal, Star, Utensils, ChevronRight, UtensilsCrossed, Package, Truck, Building2, LayoutGrid, Leaf, Drumstick, Egg, Sparkles } from "lucide-react";
import FloatingNav from "@/pages/FloatingNav";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { Dish, Category as CategoryType } from "@shared/schema";
import { getSupabaseImageUrl } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import biryaniImage1 from '@assets/stock_images/indian_biryani_dish__60e99e80.jpg';
import idliImage1 from '@assets/stock_images/indian_idli_sambar_s_c6bb3ca9.jpg';
import vadaImage1 from '@assets/stock_images/indian_vada_d82fc29e.jpg';
import thaliImage from '@assets/stock_images/indian_thali_meal_3a645a6d.jpg';
import samosaImage from '@assets/stock_images/samosa_snacks_indian_0946aa28.jpg';
import platterImage from '@assets/stock_images/indian_food_platter__b34d03e7.jpg';

// User-provided images - South Indian
import masalaDosaImage from '@assets/image_1760599491069.png';
import pongalImage from '@assets/image_1760599583321.png';
import uttapamImage from '@assets/image_1760599632589.png';
import ravaDosaImage from '@assets/image_1760599659726.png';

// User-provided images - North Indian
import alooParathaImage from '@assets/image_1760599701468.png';
import choleBhatureImage from '@assets/image_1760599722844.png';
import pohaImage from '@assets/image_1760599744216.png';
import upmaImage from '@assets/image_1760599771826.png';
import breadToastImage from '@assets/image_1760599797811.png';

// Category images
import southIndianPlatterImage from '@assets/image_1760599912464.png';

import menuBanner from "@assets/Banner_1764067296661.png";
import lunchDinnerIcon from "@assets/game-icons_hot-meal_1763923901438.png";
import tiffinsIcon from "@assets/fi_8174371_1763923901431.png";
import hiTeaCategoryIcon from "@assets/fi_2673562_1763923892186.png";
import lunchDinnerIconWhite from "@assets/game-icons_hot-meal_1763924074418.png";
import tiffinsIconWhite from "@assets/fi_81743711_1763924083923.png";
import hiTeaCategoryIconWhite from "@assets/fi_26735624_1763924083929.png";
import grilledIcon from "@assets/Image34_1763904331982.png";
import friedIcon from "@assets/Image65_1763904331981.png";
import stuffedIcon from "@assets/Image49_1763904331978.png";

// Map meal_type to category_ids based on user's specification
const MEAL_TYPE_CATEGORIES: Record<string, string[]> = {
  // Breakfast (meal_type) - used when "tiffins" tab is selected
  'breakfast': [
    'sides-and-accompaniments',
    'bakery',
    'sweets',
    'beverages',
    'desserts',
    'salads',
    'breakfast',
    'snacks'
  ],
  // Snacks (meal_type) - used when "hi-tea" tab is selected
  'snacks': [
    'sides-and-accompaniments',
    'chaats',
    'snacks',
    'bakery',
    'sweets',
    'beverages',
    'desserts',
    'salads',
    'breakfast'
  ],
  // Lunch & Dinner (meal_type) - used when "lunch-dinner" tab is selected
  'lunch-dinner': [
    'starters',
    'sides-and-accompaniments',
    'main-course',
    'chaats',
    'snacks',
    'sweets',
    'beverages',
    'desserts',
    'salads',
    'soup',
    'after-meal'
  ]
};

// Fallback images for categories
const CATEGORY_IMAGES: Record<string, string> = {
  'all': idliImage1,
  'south-indian-tiffins': southIndianPlatterImage,
  'north-indian-tiffins': masalaDosaImage,
  'quick-bites': vadaImage1,
  'fried-snacks': vadaImage1,
  'baked-snacks': idliImage1,
  'chaats': vadaImage1,
  'rice-items': biryaniImage1,
  'breads-curries': masalaDosaImage,
  'biryani': biryaniImage1,
  'sides-and-accompaniments': idliImage1,
  'bakery': idliImage1,
  'sweets': idliImage1,
  'beverages': idliImage1,
  'desserts': idliImage1,
  'salads': idliImage1,
  'breakfast': idliImage1,
  'snacks': idliImage1,
  'starters': idliImage1,
  'main-course': idliImage1,
  'soup': idliImage1,
  'after-meal': idliImage1,
};

// Dish type images for sidebar
const DISH_TYPE_IMAGES: Record<string, string> = {
  // Beverages
  'Juice': idliImage1,
  'Beverage': idliImage1,
  'ColdDrink': idliImage1,
  'HotDrink': idliImage1,
  'Alcoholic': idliImage1,
  'Milkshake': idliImage1,
  'Smoothie': idliImage1,
  
  // Breakfast items
  'Bread': breadToastImage,
  'EggPlate': idliImage1,
  'GrainBowl': pongalImage,
  'Handheld': masalaDosaImage,
  'HotFry': vadaImage1,
  'PanFry': uttapamImage,
  'SavoryBakery': samosaImage,
  'Steamed': idliImage1,
  'SweetGriddle': uttapamImage,
  
  // Snacks
  'Chips': samosaImage,
  'Namkeen': samosaImage,
  'Pizza': samosaImage,
  
  // Chaats
  'CurdChaat': vadaImage1,
  'DryChaat': vadaImage1,
  'FusionChaat': vadaImage1,
  'StuffedDough': samosaImage,
  'WetChaat': vadaImage1,
  
  // Desserts & Sweets
  'Cake': samosaImage,
  'Pastry': samosaImage,
  'BreadMithai': masalaDosaImage,
  'ColostrumMithai': masalaDosaImage,
  'FriedMithai': vadaImage1,
  'GrainMithai': pongalImage,
  
  // Salads
  'FruitSalad': platterImage,
  'LeafySalad': platterImage,
  'LegumeSalad': platterImage,
  
  // Lunch/Dinner
  'Soup': thaliImage,
  'ClearSoup': thaliImage,
  'CreamySoup': thaliImage,
  'ClearBroth': thaliImage,
  'Starters': vadaImage1,
  'ColdBite': platterImage,
  'DryFry': vadaImage1,
  'Grill': vadaImage1,
  
  // Default fallback
  'default': idliImage1,
};

export default function Menu() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("menu");
  const [selectedMealCategory, setSelectedMealCategory] = useState<string>("hi-tea");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDishType, setSelectedDishType] = useState<string>("all");
  const [dietaryMode, setDietaryMode] = useState<'all' | 'veg' | 'egg' | 'non-veg'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortOption, setSortOption] = useState<'price-low' | 'price-high' | 'name-az' | 'name-za'>('price-low');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [platterPlannerOpen, setPlatterPlannerOpen] = useState(false);
  const [dishDetailOpen, setDishDetailOpen] = useState(false);
  const [detailDish, setDetailDish] = useState<Dish | null>(null);
  const [isStuck, setIsStuck] = useState(false);
  
  const sentinelRef = useRef<HTMLDivElement>(null);

  const openDishDetail = (dish: Dish) => {
    setDetailDish(dish);
    setDishDetailOpen(true);
  };

  // Map meal category to meal_type filter for Supabase
  const getMealTypeFilter = (category: string): string => {
    const mapping: Record<string, string> = {
      "hi-tea": "snacks",        // Hi-Tea → Snacks
      "tiffins": "breakfast",    // Tiffins → Breakfast
      "lunch-dinner": "lunch-dinner", // Lunch/Dinner → Lunch & Dinner
    };
    return mapping[category] || "snacks";
  };

  const mealType = getMealTypeFilter(selectedMealCategory);

  // Fetch ALL categories from database
  const { data: allCategoriesFromDb = [] } = useQuery<CategoryType[]>({
    queryKey: ['/api/categories', 'all'],
  });

  // Get category IDs for the current meal type - with safety check
  const categoryIdsForMealType = useMemo(() => {
    if (!mealType) return [];
    const ids = MEAL_TYPE_CATEGORIES[mealType];
    if (Array.isArray(ids) && ids.length > 0) {
      return ids;
    }
    // Fallback: return empty array if meal type not found
    console.warn(`[Menu] No categories found for mealType: ${mealType}`);
    return [];
  }, [mealType]);

  // Filter and order categories based on frontend mapping
  // Use the mapped mealType (snacks/breakfast/lunch-dinner) to get correct categories
  const categories = useMemo(() => {
    // Map category IDs to actual category objects
    return categoryIdsForMealType
      .map(id => allCategoriesFromDb.find(cat => cat.id === id))
      .filter(Boolean) as CategoryType[];
  }, [allCategoriesFromDb, categoryIdsForMealType]);

  // Set first category as selected when categories load or when meal type changes
  useEffect(() => {
    if (categories.length > 0) {
      // Reset to first category when meal type changes or if no category is selected
      const firstCategoryId = categories[0].id;
      if (!selectedCategory || !categories.find(c => c.id === selectedCategory)) {
        setSelectedCategory(firstCategoryId);
      }
    }
  }, [categories, selectedCategory, mealType]);

  // Fetch ALL dishes for the current meal type's categories (for accurate category counts)
  // Use the frontend-defined category IDs - fetch dishes for each category separately and merge
  // Include dietary filter (except 'egg' which is client-side name matching)
  const dietaryForAllDishes = dietaryMode === 'egg' ? 'all' : dietaryMode;
  
  // Get all unique category IDs across all meal types (for fixed hooks)
  const allPossibleCategoryIds = useMemo(() => {
    const allIds = new Set<string>();
    Object.values(MEAL_TYPE_CATEGORIES).forEach(ids => {
      ids.forEach(id => allIds.add(id));
    });
    return Array.from(allIds);
  }, []);
  
  // Create fixed queries for all possible categories (to avoid hooks violation)
  // Only enable queries for categories in the current meal type
  const allDishesQueries = allPossibleCategoryIds.map(catId => {
    const isEnabled = categoryIdsForMealType.includes(catId);
    return useQuery<Dish[]>({
      queryKey: ['/api/dishes', mealType, catId, dietaryForAllDishes],
      enabled: isEnabled && !!mealType,
    });
  });
  
  // Merge all dishes from all categories (only from enabled queries)
  const allDishes = useMemo(() => {
    const merged: Dish[] = [];
    const seenIds = new Set<string>();
    
    allPossibleCategoryIds.forEach((catId, index) => {
      if (categoryIdsForMealType.includes(catId)) {
        const query = allDishesQueries[index];
        const dishes = query.data || [];
        dishes.forEach(dish => {
          // Filter by isAvailable
          const isAvailable = (dish as any).is_available !== false && dish.isAvailable !== false;
          if (isAvailable && !seenIds.has(dish.id)) {
            seenIds.add(dish.id);
            merged.push(dish);
          }
        });
      }
    });
    
    return merged;
  }, [allDishesQueries.map((q, i) => categoryIdsForMealType.includes(allPossibleCategoryIds[i]) ? q.data : null).join(','), categoryIdsForMealType.join(',')]);

  // Fetch dishes for selected category (for display)
  const { data: dishes = [], isLoading: isLoadingDishes } = useQuery<Dish[]>({
    queryKey: ['/api/dishes', mealType, selectedCategory, dietaryMode],
    enabled: !!selectedCategory,
  });

  // Fetch dish types for selected category
  const { data: dishTypes = [] } = useQuery<string[]>({
    queryKey: ['/api/dish-types', selectedCategory],
    enabled: !!selectedCategory,
  });

  // Reset dish type filter when category changes
  useEffect(() => {
    setSelectedDishType('all');
  }, [selectedCategory]);

  // Get total dish count for a category
  const getDishCountForCategory = (categoryId: string): number => {
    const count = allDishes.filter(d => {
      // Handle both camelCase and snake_case from database
      const dishCategoryId = (d as any).category_id || d.categoryId;
      
      // Filter by category
      if (dishCategoryId !== categoryId) return false;
      
      // Apply dietary filter (egg is client-side)
      if (dietaryMode === 'egg') {
        if (!d.name.toLowerCase().includes('egg')) return false;
      }
      
      return true;
    }).length;
    
    return count;
  };
  
  // Get dish count for a specific dish type
  const getDishCountForDishType = (dishType: string): number => {
    if (dishType === 'all') return dishes.length;
    const count = dishes.filter(d => {
      const dishDishType = (d as any).dish_type || d.dishType;
      return dishDishType === dishType;
    }).length;
    return count;
  };

  // Filter and sort dishes
  const filteredAndSortedDishes = useMemo(() => {
    return dishes
      .filter(dish => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const nameMatch = dish.name.toLowerCase().includes(query);
          const descMatch = dish.description?.toLowerCase().includes(query);
          if (!nameMatch && !descMatch) {
            return false;
          }
        }
        
        // Dish type filter
        if (selectedDishType !== 'all') {
          const dishDishType = (dish as any).dish_type || dish.dishType;
          if (dishDishType !== selectedDishType) {
            return false;
          }
        }
        
        // Dietary filter (egg is client-side)
        if (dietaryMode === 'egg') {
          if (!dish.name.toLowerCase().includes('egg')) {
            return false;
          }
        }
        
        // Price range filter
        const price = parseFloat(dish.price as string);
        if (price < priceRange[0] || price > priceRange[1]) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        const priceA = parseFloat(a.price as string);
        const priceB = parseFloat(b.price as string);
        
        switch (sortOption) {
          case 'price-low':
            return priceA - priceB;
          case 'price-high':
            return priceB - priceA;
          case 'name-az':
            return a.name.localeCompare(b.name);
          case 'name-za':
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
  }, [dishes, searchQuery, selectedDishType, dietaryMode, priceRange, sortOption]);

  const hasActiveFilters = priceRange[0] !== 0 || priceRange[1] !== 500;

  const resetFilters = () => {
    setPriceRange([0, 500]);
  };

  // Helper function to get dish image - now using Supabase storage
  const getDishImage = (dishName: string, dishImageUrl?: string, dishData?: any): string => {
    // Handle both camelCase (imageUrl) and snake_case (image_url) from Supabase
    const imageUrlFromDb = dishImageUrl || dishData?.image_url || dishData?.imageUrl;
    
    // First, ALWAYS try to use the Supabase image URL from the database if it exists
    // Only use fallback if imageUrl is null/undefined/empty
    if (imageUrlFromDb && imageUrlFromDb.trim() !== '') {
      const supabaseUrl = getSupabaseImageUrl(imageUrlFromDb);
      // If it's a valid Supabase URL (not a placeholder), use it
      if (supabaseUrl && !supabaseUrl.includes('placeholder') && supabaseUrl.startsWith('http')) {
        return supabaseUrl;
      }
    }
    
    // Otherwise, fall back to local assets based on dish name
    const name = dishName.toLowerCase();
    
    // Specific dish mappings - exact matches first
    if (name === 'achari paneer tikka') {
      return 'https://leltckltotobsibixhqo.supabase.co/storage/v1/object/public/dish_images/dishes/D-0002/main.png';
    }
    
    // Paneer dishes - check before other patterns
    if (name.includes('paneer tikka') || name.includes('achari paneer')) return platterImage;
    if (name.includes('paneer')) return platterImage;
    if (name.includes('tikka')) return platterImage;
    
    // General patterns - be more specific to avoid false matches
    if (name.includes('dosa') && !name.includes('paneer')) return masalaDosaImage;
    if ((name.includes('idli') || name.includes('idly')) && !name.includes('paneer') && !name.includes('tikka')) return idliImage1;
    if (name.includes('vada') || name.includes('medu')) return vadaImage1;
    
    // North Indian Tiffins
    if (name.includes('aloo paratha') || name.includes('paratha')) return alooParathaImage;
    if (name.includes('chole bhature') || name.includes('bhature')) return choleBhatureImage;
    if (name.includes('poha')) return pohaImage;
    if (name.includes('upma')) return upmaImage;
    if (name.includes('bread toast') || name.includes('toast')) return breadToastImage;
    
    // Snacks
    if (name.includes('samosa')) return samosaImage;
    if (name.includes('pakora') || name.includes('bajji')) return vadaImage1;
    
    // Lunch/Dinner
    if (name.includes('biryani')) return biryaniImage1;
    if (name.includes('thali') || name.includes('meal')) return thaliImage;
    if (name.includes('curry') || name.includes('masala')) return platterImage;
    
    // Default - use a more generic food image instead of idli
    return platterImage;
  };
  
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStuck(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleTabChange = (tab: "home" | "menu" | "profile") => {
    setActiveTab(tab);
    if (tab === "home") {
      setLocation("/");
    } else if (tab === "menu") {
      setLocation("/menu");
    } else if (tab === "profile") {
      setLocation("/profile");
    }
  };

  return (
    <div className="min-h-screen pb-24 relative bg-[#FDF8F3]">
      {/* Header Section */}
      <div className="relative z-10 px-4 pt-4 pb-4">
        {/* Back Button */}
        <button
          className="mb-4 flex items-center gap-2 text-[#06352A] font-medium"
          onClick={() => setLocation("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Location and Cart */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#06352A]" />
            <span className="text-[#06352A] font-bold text-lg" style={{ fontFamily: "Sweet Sans Pro" }}>
              Bengaluru, KA
            </span>
          </div>
          <button
            className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
            data-testid="button-cart"
          >
            <ShoppingCart className="w-6 h-6 text-[#06352A]" />
          </button>
        </div>

        {/* Banner */}
        <div className="rounded-xl overflow-hidden mb-2">
          <img 
            src={menuBanner} 
            alt="Special 26 Offers" 
            className="w-full h-auto object-cover"
            data-testid="img-menu-banner"
          />
        </div>

        {/* Service Navigation Tabs */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => setLocation("/bulk-meals")}
            data-testid="service-tab-bulk-meals"
            className="flex flex-col items-center justify-center p-3 transition-all hover-elevate active-elevate-2 aspect-square"
            style={{
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              color: "#06352A",
            }}
          >
            <UtensilsCrossed className="w-6 h-6 mb-1" />
            <span 
              className="text-[10px] font-semibold text-center leading-tight"
              style={{ fontFamily: "Sweet Sans Pro" }}
            >
              Bulk Meals
            </span>
          </button>

          <button
            onClick={() => setLocation("/mealbox")}
            data-testid="service-tab-mealbox"
            className="flex flex-col items-center justify-center p-3 transition-all hover-elevate active-elevate-2 aspect-square"
            style={{
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              color: "#06352A",
            }}
          >
            <Package className="w-6 h-6 mb-1" />
            <span 
              className="text-[10px] font-semibold text-center leading-tight"
              style={{ fontFamily: "Sweet Sans Pro" }}
            >
              MealBox
            </span>
          </button>

          <button
            onClick={() => setLocation("/catering")}
            data-testid="service-tab-catering"
            className="flex flex-col items-center justify-center p-3 transition-all hover-elevate active-elevate-2 aspect-square"
            style={{
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              color: "#06352A",
            }}
          >
            <Truck className="w-6 h-6 mb-1" />
            <span 
              className="text-[10px] font-semibold text-center leading-tight"
              style={{ fontFamily: "Sweet Sans Pro" }}
            >
              Catering
            </span>
          </button>

          <button
            onClick={() => setLocation("/corporate")}
            data-testid="service-tab-corporate"
            className="flex flex-col items-center justify-center p-3 transition-all hover-elevate active-elevate-2 aspect-square"
            style={{
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              color: "#06352A",
            }}
          >
            <Building2 className="w-6 h-6 mb-1" />
            <span 
              className="text-[10px] font-semibold text-center leading-tight"
              style={{ fontFamily: "Sweet Sans Pro" }}
            >
              Corporate
            </span>
          </button>
        </div>
      </div>

      {/* Sentinel element for sticky detection */}
      <div ref={sentinelRef} style={{ height: "1px" }} />

      {/* Sticky Search Bar and Meal Category Container */}
      <div 
        className="sticky top-0 z-40 px-4 pb-2 pt-2 transition-all duration-200" 
        style={{ 
          backgroundColor: isStuck ? "white" : "transparent",
          boxShadow: isStuck ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
        }}
      >
        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-white text-base"
              style={{ fontFamily: "Sweet Sans Pro", borderRadius: "10px" }}
              data-testid="input-search"
            />
            <button className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <Mic className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Meal Category Buttons */}
        <div 
          className="flex items-center justify-between gap-1 sm:gap-3 p-1.5 sm:p-2 bg-white rounded-full"
          style={{
            border: "1px solid #E5E7EB"
          }}
        >
          <button
            onClick={() => setSelectedMealCategory("lunch-dinner")}
            className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-full transition-all hover-elevate active-elevate-2 whitespace-nowrap"
            style={{
              backgroundColor: selectedMealCategory === "lunch-dinner" ? "#06352A" : "#FFFFFF",
              color: selectedMealCategory === "lunch-dinner" ? "#F5E9DB" : "#06352A",
              fontFamily: "Sweet Sans Pro",
              fontWeight: 500,
            }}
            data-testid="button-category-lunch-dinner"
          >
            <img 
              src={selectedMealCategory === "lunch-dinner" ? lunchDinnerIconWhite : lunchDinnerIcon} 
              alt="Lunch/Dinner" 
              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" 
            />
            <span className="text-[10px] sm:text-[12px] leading-none">Lunch / Dinner</span>
          </button>

          <button
            onClick={() => setSelectedMealCategory("tiffins")}
            className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-full transition-all hover-elevate active-elevate-2 whitespace-nowrap"
            style={{
              backgroundColor: selectedMealCategory === "tiffins" ? "#06352A" : "#FFFFFF",
              color: selectedMealCategory === "tiffins" ? "#F5E9DB" : "#06352A",
              fontFamily: "Sweet Sans Pro",
              fontWeight: 500,
            }}
            data-testid="button-category-tiffins"
          >
            <img 
              src={selectedMealCategory === "tiffins" ? tiffinsIconWhite : tiffinsIcon} 
              alt="Tiffins" 
              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" 
            />
            <span className="text-[10px] sm:text-[12px] leading-none">Tiffins</span>
          </button>

          <button
            onClick={() => setSelectedMealCategory("hi-tea")}
            className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-full transition-all hover-elevate active-elevate-2 whitespace-nowrap"
            style={{
              backgroundColor: selectedMealCategory === "hi-tea" ? "#06352A" : "#FFFFFF",
              color: selectedMealCategory === "hi-tea" ? "#F5E9DB" : "#06352A",
              fontFamily: "Sweet Sans Pro",
              fontWeight: 500,
            }}
            data-testid="button-category-hi-tea"
          >
            <img 
              src={selectedMealCategory === "hi-tea" ? hiTeaCategoryIconWhite : hiTeaCategoryIcon} 
              alt="Hi-Tea" 
              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" 
            />
            <span className="text-[10px] sm:text-[12px] leading-none">Hi-Tea</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-4" style={{ marginTop: "16px" }}>
        {/* Dish Selection Section */}
        <div className="space-y-2">
          {/* Header with Sort and Filter */}
          <div className="flex items-center justify-between mb-6">
            <h2 
              className="font-bold text-[14px]"
              style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
            >
              Choose Food Category
            </h2>
            <div className="flex items-center gap-2">
              <button 
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md hover-elevate active-elevate-2 bg-white"
                data-testid="button-sort"
                onClick={() => setSortDialogOpen(true)}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="font-medium text-[12px]" style={{ fontFamily: "Sweet Sans Pro" }}>Sort</span>
              </button>

              <button 
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md hover-elevate active-elevate-2 bg-white"
                data-testid="button-filter"
                onClick={() => setFilterDialogOpen(true)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="font-medium text-[12px]" style={{ fontFamily: "Sweet Sans Pro" }}>Filter</span>
              </button>
            </div>
          </div>

          {/* CategoryPage-style Layout */}
          <div className="flex gap-0 flex-1 w-full max-w-full">
            {/* Left Sidebar - Dish Type Filters */}
            <aside className="w-24 md:w-32 border-r bg-card/50 backdrop-blur-sm flex-shrink-0 overflow-y-auto pb-36 md:pb-6">
              <div className="flex flex-col py-3">
                {/* Always show "All" option */}
              <button
                  onClick={() => setSelectedDishType('all')}
                  className={cn(
                    "flex flex-col items-center gap-2 py-4 px-2 transition-all relative",
                    selectedDishType === 'all'
                      ? "bg-primary/10 before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1.5 before:bg-primary before:rounded-r" 
                      : "hover-elevate"
                  )}
                  data-testid="filter-dishtype-all"
              >
                  <div className={cn(
                    "relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center",
                    selectedDishType === 'all'
                      ? "border-primary shadow-lg scale-105 bg-primary/20" 
                      : "border-border bg-card"
                  )}>
                    <LayoutGrid className={cn(
                      "w-8 h-8 md:w-10 md:h-10",
                      selectedDishType === 'all' ? "text-primary" : "text-muted-foreground"
                    )} />
                </div>
                  <div className="text-center w-full px-1">
                    <span className={cn(
                      "text-xs md:text-sm font-semibold block line-clamp-1 leading-tight mb-1",
                      selectedDishType === 'all' ? "text-primary" : "text-foreground"
                    )}>
                  All
                </span>
                    <Badge 
                      variant={selectedDishType === 'all' ? "default" : "secondary"}
                      className="text-[10px] h-5 px-2 font-medium"
                    >
                      {dishes.length}
                    </Badge>
                  </div>
              </button>

                {/* Show dish type options if available */}
                {dishTypes.map((dishType) => {
                  const count = getDishCountForDishType(dishType);
                  const dishTypeImage = DISH_TYPE_IMAGES[dishType] || DISH_TYPE_IMAGES['default'];
                  
                  return (
              <button
                      key={dishType}
                      onClick={() => setSelectedDishType(dishType)}
                      className={cn(
                        "flex flex-col items-center gap-2 py-4 px-2 transition-all relative",
                        selectedDishType === dishType
                          ? "bg-primary/10 before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1.5 before:bg-primary before:rounded-r" 
                          : "hover-elevate"
                      )}
                      data-testid={`filter-dishtype-${dishType.toLowerCase()}`}
              >
                      <div className={cn(
                        "relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition-all",
                        selectedDishType === dishType
                          ? "border-primary shadow-lg scale-105" 
                          : "border-border"
                      )}>
                        <img 
                          src={dishTypeImage}
                          alt={dishType}
                          className="w-full h-full object-cover"
                        />
                        {selectedDishType === dishType && (
                          <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent pointer-events-none" />
                        )}
                </div>
                      <div className="text-center w-full px-1">
                        <span className={cn(
                          "text-xs md:text-sm font-semibold block line-clamp-2 leading-tight mb-1",
                          selectedDishType === dishType ? "text-primary" : "text-foreground"
                        )}>
                          {dishType}
                </span>
                        <Badge 
                          variant={selectedDishType === dishType ? "default" : "secondary"}
                          className="text-[10px] h-5 px-2 font-medium"
                        >
                          {count}
                        </Badge>
                      </div>
              </button>
                  );
                })}
              </div>
            </aside>

            {/* Right Content - Dishes Grid */}
            <div className="flex-1 px-3 md:px-4 py-4 md:py-6 min-w-0 overflow-y-auto overflow-x-hidden pb-20 md:pb-6">
              {/* Horizontal Category Tabs - Sticky */}
              <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm pb-4 mb-2 border-b shadow-md -mx-3 md:-mx-4 px-3 md:px-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1 pt-3">
                  {categories.map((cat) => {
                    const totalInCategory = getDishCountForCategory(cat.id);
                    
                    return (
              <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setSelectedDishType('all'); // Reset dish type filter when changing category
                        }}
                        className="flex flex-col items-center gap-1.5 transition-all flex-shrink-0"
                        data-testid={`tab-category-${cat.id}`}
                      >
                        <div className={cn(
                          "relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-3 transition-all",
                          selectedCategory === cat.id 
                            ? "border-primary shadow-[0_8px_16px_rgba(255,107,53,0.4)] scale-105 ring-2 ring-primary/20" 
                            : "border-border/50 hover:scale-102"
                        )}>
                          <img 
                            src={(cat.imageUrl && !cat.imageUrl.startsWith('/images/')) ? cat.imageUrl : (CATEGORY_IMAGES[cat.id] || idliImage1)}
                            alt={cat.name}
                            className="w-full h-full object-cover"
                          />
                          {selectedCategory === cat.id && (
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none" />
                          )}
                </div>
                        <div className="text-center">
                          <span className={cn(
                            "text-xs md:text-sm font-bold block whitespace-nowrap mb-0.5",
                            selectedCategory === cat.id ? "text-primary" : "text-muted-foreground"
                          )}>
                            {cat.name}
                </span>
                          <Badge 
                            variant={selectedCategory === cat.id ? "default" : "secondary"}
                            className="text-[10px] h-5 px-2 font-medium"
                          >
                            {totalInCategory}
                          </Badge>
                        </div>
              </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4 flex justify-between items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold font-serif" data-testid="text-section-title">
                  {categories.find(c => c.id === selectedCategory)?.name || 'All Categories'}
                </h2>
                
                {/* Dietary Mode Segmented Control */}
                <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-full" data-testid="dietary-filter">
              <button
                    onClick={() => setDietaryMode('all')}
                    className={cn(
                      "h-7 px-3 rounded-full text-xs font-medium transition-all duration-200",
                      dietaryMode === 'all'
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    data-testid="filter-dietary-all"
                  >
                    All
              </button>
              <button
                    onClick={() => setDietaryMode('veg')}
                    className={cn(
                      "h-7 px-3 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1",
                      dietaryMode === 'veg'
                        ? "bg-green-100 shadow-sm text-green-700"
                        : "text-muted-foreground hover:text-green-600"
                    )}
                    data-testid="filter-dietary-veg"
              >
                    <Leaf className={cn("w-3 h-3", dietaryMode === 'veg' ? "" : "text-green-600")} />
                    <span className="hidden sm:inline">Veg</span>
              </button>
              <button
                    onClick={() => setDietaryMode('egg')}
                    className={cn(
                      "h-7 px-3 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1",
                      dietaryMode === 'egg'
                        ? "bg-yellow-100 shadow-sm text-yellow-700"
                        : "text-muted-foreground hover:text-yellow-600"
                    )}
                    data-testid="filter-dietary-egg"
              >
                    <Egg className={cn("w-3 h-3", dietaryMode === 'egg' ? "" : "text-yellow-600")} />
                    <span className="hidden sm:inline">Egg</span>
              </button>
              <button
                    onClick={() => setDietaryMode('non-veg')}
                    className={cn(
                      "h-7 px-3 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1",
                      dietaryMode === 'non-veg'
                        ? "bg-red-100 shadow-sm text-red-700"
                        : "text-muted-foreground hover:text-red-600"
                    )}
                    data-testid="filter-dietary-nonveg"
              >
                    <Drumstick className={cn("w-3 h-3", dietaryMode === 'non-veg' ? "" : "text-red-600")} />
                    <span className="hidden sm:inline">Non-Veg</span>
              </button>
                </div>
            </div>

              <div className="mb-6 flex items-center gap-2 flex-wrap">
                {/* Filter Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("h-9 gap-1.5", hasActiveFilters && "border-primary text-primary")}
                  onClick={() => setFilterDialogOpen(true)}
                  data-testid="button-filter"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  {hasActiveFilters && (
                    <Badge variant="default" className="h-4 w-4 p-0 flex items-center justify-center rounded-full text-[10px]">
                      1
                    </Badge>
                  )}
                </Button>

                {/* Sort Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5"
                  onClick={() => setSortDialogOpen(true)}
                  data-testid="button-sort"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="hidden sm:inline">Sort</span>
                </Button>

                {/* Platter Planner Button */}
                <Button
                  variant="default"
                  size="lg"
                  className="gap-1.5 bg-primary hover:bg-primary/90 animate-pulse hover:animate-none ml-auto"
                  onClick={() => setPlatterPlannerOpen(true)}
                  data-testid="button-platter-planner"
                >
                  <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                  Platter Planner
                </Button>
              </div>

              {isLoadingDishes ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading dishes...</p>
                </div>
              ) : filteredAndSortedDishes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No dishes match the selected filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredAndSortedDishes.map((dish) => (
                    <Card 
                      key={dish.id} 
                      className="overflow-hidden hover-elevate group"
                      data-testid={`card-dish-${dish.id}`}
                    >
                      <div 
                        className="relative h-40 md:h-48 overflow-hidden cursor-pointer"
                        onClick={() => openDishDetail(dish)}
                        data-testid={`image-dish-${dish.id}`}
                      >
                        <img 
                          src={getDishImage(dish.name, dish.imageUrl || undefined, dish)}
                          alt={dish.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        {dish.categoryId && dish.categoryId.includes('veg') && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <Leaf className="w-3 h-3 text-white" />
                      </div>
                        )}
                        {dish.categoryId && dish.categoryId.includes('non-veg') && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                            <Drumstick className="w-3 h-3 text-white" />
                    </div>
                        )}
                      </div>
                      <div className="p-3 md:p-4">
                        <h3 className="font-bold text-sm md:text-base mb-1 line-clamp-1" data-testid={`text-dish-name-${dish.id}`}>
                          {dish.name}
                      </h3>
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground line-clamp-2" data-testid={`text-dish-description-${dish.id}`}>
                            {dish.description}
                          </p>
                          {dish.description && dish.description.length > 80 && (
                <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDishDetail(dish);
                              }}
                              className="text-xs text-primary hover:underline font-semibold mt-1"
                              data-testid={`button-toggle-description-${dish.id}`}
                            >
                              ...more
                </button>
                          )}
              </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-primary font-bold text-lg" data-testid={`text-dish-price-${dish.id}`}>
                            ₹{parseFloat(dish.price as string).toFixed(0)}
                          </span>
              </div>
                      </div>
                    </Card>
                ))}
              </div>
              )}
            </div>
          </div>
                      </div>
                    </div>
                    
      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
            <DialogDescription>
              Refine your search with filters
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Price Range Filter */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Price Range</Label>
                <span className="text-sm font-medium">
                  ₹{priceRange[0]} - ₹{priceRange[1]}
                        </span>
                      </div>
                      
              <Slider
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                min={0}
                max={500}
                step={10}
                className="w-full"
                data-testid="slider-price-range"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹0</span>
                <span>₹500+</span>
                        </div>
                      </div>
                    </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={resetFilters}
              data-testid="button-reset-filters"
            >
              Reset
            </Button>
            <Button 
              className="flex-1"
              onClick={() => setFilterDialogOpen(false)}
              data-testid="button-apply-filters"
            >
              Apply Filters
            </Button>
                  </div>
        </DialogContent>
      </Dialog>

      {/* Sort Dialog */}
      <Dialog open={sortDialogOpen} onOpenChange={setSortDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sort By</DialogTitle>
            <DialogDescription>
              Choose how to sort the dishes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <RadioGroup value={sortOption} onValueChange={(value) => setSortOption(value as typeof sortOption)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price-low" id="price-low" />
                <Label htmlFor="price-low" className="cursor-pointer">Price: Low to High</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="price-high" id="price-high" />
                <Label htmlFor="price-high" className="cursor-pointer">Price: High to Low</Label>
            </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="name-az" id="name-az" />
                <Label htmlFor="name-az" className="cursor-pointer">Name: A to Z</Label>
          </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="name-za" id="name-za" />
                <Label htmlFor="name-za" className="cursor-pointer">Name: Z to A</Label>
        </div>
            </RadioGroup>
      </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setSortDialogOpen(false)}
              data-testid="button-cancel-sort"
            >
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={() => setSortDialogOpen(false)}
              data-testid="button-apply-sort"
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Platter Planner Dialog */}
      <Dialog open={platterPlannerOpen} onOpenChange={setPlatterPlannerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif">Platter Planner</DialogTitle>
            <DialogDescription>
              Coming soon! This feature will help you plan your perfect platter.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              The Platter Planner feature is under development. Stay tuned for updates!
            </p>
          </div>
          
          <Button 
            className="w-full"
            onClick={() => setPlatterPlannerOpen(false)}
            data-testid="button-close-planner"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Dish Detail Drawer */}
      <Drawer open={dishDetailOpen} onOpenChange={setDishDetailOpen}>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader className="text-left">
              <DrawerTitle className="text-2xl font-bold">{detailDish?.name}</DrawerTitle>
            </DrawerHeader>
            <div className="flex items-center gap-2 px-6 -mt-2 mb-4">
              {detailDish?.dietaryType === 'Veg' && (
                <Badge variant="secondary" className="gap-1">
                  <Leaf className="w-3 h-3 text-green-600" />
                  Vegetarian
                </Badge>
              )}
              {detailDish?.dietaryType === 'Non-Veg' && (
                <Badge variant="secondary" className="gap-1">
                  <Drumstick className="w-3 h-3 text-red-500" />
                  Non-Vegetarian
                </Badge>
              )}
              {detailDish?.dishType && (
                <Badge variant="outline">{detailDish.dishType}</Badge>
              )}
            </div>
            
            <div className="p-4 pb-8 space-y-4 overflow-y-auto max-h-[calc(85vh-8rem)]">
              {/* Image */}
              {detailDish && (
                <div className="relative h-64 rounded-lg overflow-hidden">
                  <img 
                    src={getDishImage(detailDish.name, detailDish.imageUrl || undefined, detailDish)}
                    alt={detailDish.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="font-bold text-lg mb-2">Description</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {detailDish?.description || 'No description available.'}
                </p>
              </div>

              {/* Price & Add Button */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Price</p>
                  <p className="text-3xl font-bold text-primary">
                    ₹{detailDish ? parseFloat(detailDish.price as string).toFixed(0) : '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
