import { useRoute, useLocation } from "wouter";
import { ChevronDown, Plus, Minus, Leaf, Drumstick, SlidersHorizontal, ArrowUpDown, X, Sparkles, ArrowLeft, LayoutGrid, Circle, Egg } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import PlatterVisualization from "@/components/PlatterVisualization";
import FloatingCartButton from "@/components/FloatingCartButton";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getSupabaseImageUrl, getCategoryImageUrl } from "@/lib/supabase";
import { cartStorage } from "@/lib/cartStorage";
import type { Category as CategoryType, Dish } from "@shared/schema";

import biryaniImage1 from '@assets/stock_images/indian_biryani_dish__60e99e80.jpg';
import idliImage1 from '@assets/stock_images/indian_idli_sambar_s_c6bb3ca9.jpg';
import vadaImage1 from '@assets/stock_images/indian_vada_d82fc29e.jpg';
import thaliImage from '@assets/stock_images/indian_thali_meal_3a645a6d.jpg';
import samosaImage from '@assets/stock_images/samosa_snacks_indian_0946aa28.jpg';
import platterImage from '@assets/stock_images/indian_food_platter__b34d03e7.jpg';

// Platter Planner meal type images
import breakfastTiffinImage from '@assets/stock_images/indian_breakfast_tif_612332f8.jpg';
import snacksVarietiesImage from '@assets/stock_images/indian_snacks_samosa_7d45cad7.jpg';
import lunchDinnerImage from '@assets/stock_images/indian_lunch_dinner__c3e92f73.jpg';

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

// Non-veg South Indian Tiffins images
import eggDosaImage from '@assets/image_1760605456545.png';
import eggAppamImage from '@assets/image_1760605582314.png';
import idlyWithChickenImage from '@assets/image_1760605623134.png';
import vadaWithChickenImage from '@assets/image_1760605650137.png';
import dosaWithChickenImage from '@assets/image_1760605699650.png';
import appamWithChickenImage from '@assets/image_1760605766767.png';
import puriWithChickenImage from '@assets/image_1760605834972.png';
import idlyWithNatukodiImage from '@assets/image_1760605964617.png';
import dosaWithMuttonImage from '@assets/image_1760606063772.png';
import vadaWithMuttonImage from '@assets/image_1760606109904.png';
import idlyWithMuttonImage from '@assets/image_1760606146257.png';
import puriWithMuttonImage from '@assets/image_1760606197813.png';

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
};

// Dish type images for sidebar
const DISH_TYPE_IMAGES: Record<string, string> = {
  // Beverages
  'Juice': breakfastTiffinImage,
  'Beverage': breakfastTiffinImage,
  'ColdDrink': breakfastTiffinImage,
  'HotDrink': breakfastTiffinImage,
  'Alcoholic': breakfastTiffinImage,
  'Milkshake': breakfastTiffinImage,
  'Smoothie': breakfastTiffinImage,
  
  // Breakfast items
  'Bread': breadToastImage,
  'EggPlate': eggDosaImage,
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

// Helper function to get dish image - now using Supabase storage
const getDishImage = (dishName: string, dishImageUrl?: string, dishData?: any): string => {
  // Handle both camelCase (imageUrl) and snake_case (image_url) from Supabase
  const imageUrlFromDb = dishImageUrl || dishData?.image_url || dishData?.imageUrl;
  
  // Debug: log the image URL from database
  console.log(`[getDishImage] Dish: "${dishName}", DB imageUrl: "${imageUrlFromDb}"`, dishData);
  
  // First, ALWAYS try to use the Supabase image URL from the database if it exists
  // Only use fallback if imageUrl is null/undefined/empty
  if (imageUrlFromDb && imageUrlFromDb.trim() !== '') {
    const supabaseUrl = getSupabaseImageUrl(imageUrlFromDb);
    console.log(`[getDishImage] Constructed URL: "${supabaseUrl}"`);
    // If it's a valid Supabase URL (not a placeholder), use it
    if (supabaseUrl && !supabaseUrl.includes('placeholder') && supabaseUrl.startsWith('http')) {
      console.log(`[getDishImage] Using Supabase URL for "${dishName}"`);
      return supabaseUrl;
    }
  }
  console.log(`[getDishImage] Using fallback image for "${dishName}"`);
  
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
  
  // Non-veg South Indian Tiffins - exact matches first
  if (name === 'egg dosa') return eggDosaImage;
  if (name === 'egg appam') return eggAppamImage;
  if (name === 'idly with chicken') return idlyWithChickenImage;
  if (name === 'vada with chicken') return vadaWithChickenImage;
  if (name === 'dosa with chicken') return dosaWithChickenImage;
  if (name === 'appam with chicken') return appamWithChickenImage;
  if (name === 'puri with chicken') return puriWithChickenImage;
  if (name === 'vada with natukodi') return vadaWithChickenImage;
  if (name === 'idly with natukodi') return idlyWithNatukodiImage;
  if (name === 'dosa with mutton') return dosaWithMuttonImage;
  if (name === 'vada with mutton') return vadaWithMuttonImage;
  if (name === 'idly with mutton') return idlyWithMuttonImage;
  if (name === 'puri with mutton') return puriWithMuttonImage;
  
  // Veg South Indian Tiffins
  if (name.includes('masala dosa')) return masalaDosaImage;
  if (name.includes('rava dosa')) return ravaDosaImage;
  if (name.includes('plain dosa')) return masalaDosaImage;
  if (name.includes('plain idly') || name.includes('plain idli')) return idliImage1;
  if (name.includes('plain vada')) return vadaImage1;
  if (name.includes('plain appam')) return masalaDosaImage;
  if (name.includes('plain puri')) return idliImage1;
  if (name.includes('uttapam')) return uttapamImage;
  if (name.includes('pongal')) return pongalImage;
  
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

const MEAL_TYPE_TITLES: Record<string, string> = {
  'tiffins': 'Tiffins',
  'snacks': 'Snacks',
  'lunch-dinner': 'Lunch & Dinner'
};

// Frontend-defined category structure for each meal type
const MEAL_TYPE_CATEGORIES: Record<string, string[]> = {
  'tiffins': [
    'sides-and-accompaniments',
    'bakery',
    'sweets',
    'beverages',
    'desserts',
    'salads',
    'breakfast',
    'snacks'
  ],
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

// Cart now uses session-based authentication - no need for guest user ID

export default function CategoryPage() {
  const [, params] = useRoute("/categories/:mealType");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cartItemMap, setCartItemMap] = useState<Record<string, { id: string; quantity: number; price: string }>>({});
  const [showPlatter, setShowPlatter] = useState(false);
  const [paxCount, setPaxCount] = useState<number>(10);
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [memberCount, setMemberCount] = useState<number>(10);
  const [dietaryMode, setDietaryMode] = useState<'all' | 'veg' | 'egg' | 'non-veg'>('all');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [platterPlannerOpen, setPlatterPlannerOpen] = useState(false);
  const [planDetailsOpen, setPlanDetailsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'gold' | 'platinum' | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortOption, setSortOption] = useState<'price-low' | 'price-high' | 'name-az' | 'name-za'>('price-low');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [selectedDishType, setSelectedDishType] = useState<string>('all');
  const [dishDetailOpen, setDishDetailOpen] = useState(false);
  const [detailDish, setDetailDish] = useState<Dish | null>(null);

  const toggleDescription = (dishId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dishId)) {
        newSet.delete(dishId);
      } else {
        newSet.add(dishId);
      }
      return newSet;
    });
  };

  const openDishDetail = (dish: Dish) => {
    setDetailDish(dish);
    setDishDetailOpen(true);
  };

  const mealType = params?.mealType || 'tiffins';
  const pageTitle = MEAL_TYPE_TITLES[mealType] || 'Categories';

  // Fetch ALL categories from database
  const { data: allCategoriesFromDb = [] } = useQuery<CategoryType[]>({
    queryKey: ['/api/categories', 'all'],
  });

  // Filter and order categories based on frontend mapping
  const categories = useMemo(() => {
    const categoryIds = MEAL_TYPE_CATEGORIES[mealType] || [];
    
    // Map category IDs to actual category objects
    return categoryIds
      .map(id => allCategoriesFromDb.find(cat => cat.id === id))
      .filter(Boolean) as CategoryType[];
  }, [allCategoriesFromDb, mealType]);

  // Fetch ALL dishes for the current meal type's categories (for accurate category counts)
  // Use the frontend-defined category IDs instead of querying the database
  const categoryIdsForMealType = MEAL_TYPE_CATEGORIES[mealType] || [];
  
  // Fetch dishes for each category and merge them
  // Include dietary filter (except 'egg' which is client-side name matching)
  const dietaryForAllDishes = dietaryMode === 'egg' ? 'all' : dietaryMode;
  
  // Fetch dishes for all categories in this meal type
  const allDishesQueries = categoryIdsForMealType.map(catId =>
    useQuery<Dish[]>({
      queryKey: ['/api/dishes', mealType, catId, dietaryForAllDishes],
      enabled: !!catId,
    })
  );
  
  // Merge all dishes from all categories
  const allDishes = useMemo(() => {
    const merged: Dish[] = [];
    const seenIds = new Set<string>();
    
    allDishesQueries.forEach(query => {
      const dishes = query.data || [];
      dishes.forEach(dish => {
        if (!seenIds.has(dish.id)) {
          seenIds.add(dish.id);
          merged.push(dish);
        }
      });
    });
    
    return merged;
  }, [allDishesQueries.map(q => q.data).join(',')]);

  // Fetch dishes for selected category (for display)
  // Include dietary filter in query key so it refetches when filter changes
  const { data: dishes = [], isLoading } = useQuery<Dish[]>({
    queryKey: ['/api/dishes', mealType, selectedCategory, dietaryMode],
  });

  // Fetch cart items (session-based authentication)
  const { data: apiCartItems } = useQuery<Array<{ id: string; quantity: number; dish: Dish; category: CategoryType }> | null>({
    queryKey: ['/api/cart'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Use server cart for authenticated users, localStorage for guests only
  const cartItems = apiCartItems !== null && apiCartItems !== undefined
    ? apiCartItems // Authenticated: use server cart only (even if empty)
    : apiCartItems === null // Guest: use localStorage
      ? cartStorage.getCart().map(item => ({
          id: `local-${item.dishId}`,
          quantity: item.quantity,
          dish: item.dish,
          category: { id: item.dish.categoryId, name: item.dish.categoryId } as CategoryType,
        }))
      : []; // Loading: empty array

  // Fetch dish types for selected category
  const { data: dishTypes = [] } = useQuery<string[]>({
    queryKey: ['/api/dish-types', selectedCategory],
    enabled: !!selectedCategory,
  });

  // Reset dish type filter when category changes
  useEffect(() => {
    setSelectedDishType('all');
  }, [selectedCategory]);

  // Hydrate cart from API and localStorage
  useEffect(() => {
    // Skip if cart data is still loading (undefined)
    if (apiCartItems === undefined) return;
    
    const newCartMap: Record<string, { id: string; quantity: number; price: string }> = {};
    
    // Add items from API (authenticated users)
    if (apiCartItems !== null && Array.isArray(apiCartItems)) {
      apiCartItems.forEach(item => {
        newCartMap[item.dish.id] = {
          id: item.id,
          quantity: item.quantity,
          price: item.dish.price as string,
        };
      });
    }
    
    // Add items from localStorage (guest users) if API cart is null or empty
    if (apiCartItems === null || (Array.isArray(apiCartItems) && apiCartItems.length === 0)) {
      const localCart = cartStorage.getCart();
      localCart.forEach(item => {
        newCartMap[item.dishId] = {
          id: `local-${item.dishId}`,
          quantity: item.quantity,
          price: item.dish.price as string,
        };
      });
    }
    
    // Only update if the cart has actually changed
    const hasChanged = JSON.stringify(newCartMap) !== JSON.stringify(cartItemMap);
    if (hasChanged) {
      setCartItemMap(newCartMap);
    }
  }, [apiCartItems, cartItemMap]);

  // Set first category as selected when categories load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setLocation('/');
    } else if (tab === 'profile') {
      setLocation('/profile');
    }
  };


  // Cart mutations with optimistic updates and localStorage support
  const addToCartMutation = useMutation({
    mutationFn: async ({ dishId, quantity }: { dishId: string; quantity: number }) => {
      const response = await apiRequest('POST', '/api/cart', { dishId, quantity });
      const data = await response.json();
      
      console.log('[Cart Mutation] Response data:', data);
      
      // If response indicates guest mode (success message), store in localStorage
      if (data && typeof data === 'object' && 'success' in data) {
        console.log('[Cart Mutation] Guest mode detected, saving to localStorage');
        const dish = dishes.find(d => d.id === dishId);
        console.log('[Cart Mutation] Found dish:', dish?.name);
        if (dish) {
          cartStorage.addItem(dishId, quantity, dish);
          console.log('[Cart Mutation] Saved to localStorage');
        }
      }
      
      return data;
    },
    onMutate: async ({ dishId, quantity }) => {
      // Optimistically update the UI
      const dish = dishes.find(d => d.id === dishId);
      if (dish) {
        setCartItemMap(prev => {
          const existing = prev[dishId];
          return {
            ...prev,
            [dishId]: { 
              id: existing?.id || `local-${dishId}`, 
              quantity: existing ? existing.quantity + quantity : quantity, 
              price: dish.price as string 
            }
          };
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateCartMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const response = await apiRequest('PUT', `/api/cart/${id}`, { quantity });
      const data = await response.json();
      
      // If this is a localStorage item, update it
      if (id.startsWith('local-')) {
        const dishId = id.replace('local-', '');
        cartStorage.updateItem(dishId, quantity);
      }
      
      return data;
    },
    onMutate: async ({ id, quantity }) => {
      // Optimistically update the UI
      setCartItemMap(prev => {
        const dishId = Object.keys(prev).find(key => prev[key].id === id);
        if (dishId) {
          return {
            ...prev,
            [dishId]: { ...prev[dishId], quantity }
          };
        }
        return prev;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const deleteCartMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/cart/${id}`, undefined);
      const data = await response.json();
      
      // If this is a localStorage item, remove it
      if (id.startsWith('local-')) {
        const dishId = id.replace('local-', '');
        cartStorage.removeItem(dishId);
      }
      
      return data;
    },
    onMutate: async (id) => {
      // Optimistically remove from UI
      setCartItemMap(prev => {
        const dishId = Object.keys(prev).find(key => prev[key].id === id);
        if (dishId) {
          const newMap = { ...prev };
          delete newMap[dishId];
          return newMap;
        }
        return prev;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const handleAdd = (dishId: string) => {
    const dish = dishes.find(d => d.id === dishId);
    if (!dish) return;

    const cartItem = cartItemMap[dishId];
    const defaultQuantity = 1;

    if (cartItem) {
      // If item exists in cart, remove it
      deleteCartMutation.mutate(cartItem.id);
    } else {
      // Add new item with quantity of 1
      addToCartMutation.mutate({ dishId, quantity: defaultQuantity });
    }
  };

  const handleMemberCountChange = (value: string) => {
    // Allow empty string or any number while typing
    if (value === '') {
      setMemberCount(10);
      return;
    }
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setMemberCount(numValue);
    }
  };

  const handleInputBlur = () => {
    // Ensure minimum of 10 when user leaves the input
    if (memberCount < 10) {
      setMemberCount(10);
    }
  };

  const handleConfirmAdd = () => {
    if (!selectedDish) return;
    
    // Ensure minimum of 10 before adding
    const finalQuantity = Math.max(10, memberCount);
    
    const cartItem = cartItemMap[selectedDish.id];
    if (cartItem) {
      // Update existing cart item
      updateCartMutation.mutate({ id: cartItem.id, quantity: finalQuantity });
    } else {
      // Add new cart item
      addToCartMutation.mutate({ dishId: selectedDish.id, quantity: finalQuantity });
    }
    
    setQuantityDialogOpen(false);
    setSelectedDish(null);
  };

  const handleRemove = (dishId: string) => {
    const cartItem = cartItemMap[dishId];
    if (!cartItem) return;

    if (cartItem.quantity <= 1) {
      // Remove item from cart
      deleteCartMutation.mutate(cartItem.id);
    } else {
      // Decrease quantity
      updateCartMutation.mutate({ id: cartItem.id, quantity: cartItem.quantity - 1 });
    }
  };

  const totalCartItems = Object.keys(cartItemMap).length;
  const totalPrice = Object.values(cartItemMap).reduce((sum, item) => {
    return sum + (parseFloat(item.price) * item.quantity);
  }, 0);

  // Helper function to interleave dishes by dish_type
  // This creates a mixed variety view when no specific dish type is selected
  const interleaveDishTypes = (dishList: typeof dishes): typeof dishes => {
    // Group dishes by dish_type
    const groupedByType: Record<string, typeof dishes> = {};
    dishList.forEach(dish => {
      const dishType = (dish as any).dish_type || dish.dishType || 'other';
      if (!groupedByType[dishType]) {
        groupedByType[dishType] = [];
      }
      groupedByType[dishType].push(dish);
    });
    
    // Get all dish type keys
    const dishTypeKeys = Object.keys(groupedByType);
    if (dishTypeKeys.length === 0) return dishList;
    
    // Interleave: take 2-3 items from each dish type in rotation
    const interleaved: typeof dishes = [];
    const itemsPerBatch = 2; // Take 2 items from each type per round
    let hasMore = true;
    let roundIndex = 0;
    
    while (hasMore) {
      hasMore = false;
      dishTypeKeys.forEach(dishType => {
        const group = groupedByType[dishType];
        const startIdx = roundIndex * itemsPerBatch;
        const batch = group.slice(startIdx, startIdx + itemsPerBatch);
        
        if (batch.length > 0) {
          interleaved.push(...batch);
          hasMore = true;
        }
      });
      roundIndex++;
    }
    
    return interleaved;
  };

  // Filter and sort dishes
  const filteredAndSortedDishes = (() => {
    // First, apply all filters
    const filtered = dishes.filter(dish => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = dish.name.toLowerCase().includes(query);
        const descMatch = dish.description?.toLowerCase().includes(query);
        if (!nameMatch && !descMatch) {
          return false;
        }
      }
      
      // Dish type filter - handle both camelCase and snake_case
      if (selectedDishType !== 'all') {
        const dishDishType = (dish as any).dish_type || dish.dishType;
        if (dishDishType !== selectedDishType) {
          return false;
        }
      }
      
      // Dietary filter
      // Note: 'veg' and 'non-veg' are filtered at Supabase level
      // Only 'egg' filter is done client-side (based on name matching)
      if (dietaryMode === 'egg') {
        if (!dish.name.toLowerCase().includes('egg')) {
          return false;
        }
      }
      // veg and non-veg are already filtered by Supabase query
      
      // Price range filter
      const price = parseFloat(dish.price as string);
      if (price < priceRange[0] || price > priceRange[1]) {
        return false;
      }
      
      return true;
    });
    
    // Then, sort the filtered dishes
    const sorted = filtered.sort((a, b) => {
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
    
    // Finally, if no specific dish type is selected, interleave by dish_type
    // This shows variety - 2 items from each type in rotation
    if (selectedDishType === 'all' && !searchQuery) {
      return interleaveDishTypes(sorted);
    }
    
    return sorted;
  })();


  const resetFilters = () => {
    setPriceRange([0, 500]);
  };

  const hasActiveFilters = priceRange[0] !== 0 || priceRange[1] !== 500;

  // Get total dish count for a category (from all dishes, respecting filters)
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
    
    // Debug logging - show unique category IDs in the dataset
    const categoryIdSet = new Set(allDishes.map(d => (d as any).category_id || d.categoryId));
    const uniqueCategoryIds = Array.from(categoryIdSet);
    console.log(`[getDishCountForCategory] Looking for: "${categoryId}", Found: ${count}`, {
      allDishesTotal: allDishes.length,
      uniqueCategoryIds,
      sampleDishes: allDishes.slice(0, 5).map(d => ({ 
        name: d.name, 
        categoryId: (d as any).category_id || d.categoryId 
      }))
    });
    
    return count;
  };
  
  // Get dish count for a specific dish type
  const getDishCountForDishType = (dishType: string): number => {
    const count = dishes.filter(d => {
      // Handle both camelCase and snake_case from database
      const dishDishType = (d as any).dish_type || d.dishType;
      return dishDishType === dishType;
    }).length;
    
    // Debug logging - show unique dish types
    const dishTypeSet = new Set(dishes.map(d => (d as any).dish_type || d.dishType).filter(Boolean));
    const uniqueDishTypes = Array.from(dishTypeSet);
    console.log(`[getDishCountForDishType] Looking for: "${dishType}", Found: ${count}`, {
      dishesTotal: dishes.length,
      uniqueDishTypes,
      sampleDishes: dishes.slice(0, 5).map(d => ({ 
        name: d.name, 
        dishType: (d as any).dish_type || d.dishType 
      }))
    });
    
    return count;
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <AppHeader 
        cartItemCount={totalCartItems}
        onCartClick={() => setShowPlatter(true)}
        onBackClick={() => setLocation('/')}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
      />

      <main className="flex gap-0 flex-1 w-full max-w-full overflow-hidden">
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
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm pb-4 mb-2 border-b shadow-md -mx-3 md:-mx-4 px-3 md:px-4">
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
            {categories.find(c => c.id === selectedCategory)?.name}
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
                  ? "bg-green-100 dark:bg-green-900/30 shadow-sm text-green-700 dark:text-green-400"
                  : "text-muted-foreground hover:text-green-600"
              )}
              data-testid="filter-dietary-veg"
            >
              <Leaf className={cn("w-3 h-3", dietaryMode === 'veg' ? "" : "text-green-600 dark:text-green-500")} />
              <span className="hidden sm:inline">Veg</span>
            </button>
            <button
              onClick={() => setDietaryMode('egg')}
              className={cn(
                "h-7 px-3 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1",
                dietaryMode === 'egg'
                  ? "bg-yellow-100 dark:bg-yellow-900/30 shadow-sm text-yellow-700 dark:text-yellow-400"
                  : "text-muted-foreground hover:text-yellow-600"
              )}
              data-testid="filter-dietary-egg"
            >
              <Egg className={cn("w-3 h-3", dietaryMode === 'egg' ? "" : "text-yellow-600 dark:text-yellow-500")} />
              <span className="hidden sm:inline">Egg</span>
            </button>
            <button
              onClick={() => setDietaryMode('non-veg')}
              className={cn(
                "h-7 px-3 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1",
                dietaryMode === 'non-veg'
                  ? "bg-red-100 dark:bg-red-900/30 shadow-sm text-red-700 dark:text-red-400"
                  : "text-muted-foreground hover:text-red-600"
              )}
              data-testid="filter-dietary-nonveg"
            >
              <Drumstick className={cn("w-3 h-3", dietaryMode === 'non-veg' ? "" : "text-red-600 dark:text-red-500")} />
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

        {isLoading ? (
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
                        className="text-xs text-primary hover:underline font-semibold"
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
                    
                    <Button
                      size="sm"
                      onClick={() => handleAdd(dish.id)}
                      variant={cartItemMap[dish.id] ? "secondary" : "default"}
                      className="rounded-full px-4"
                      data-testid={`button-add-${dish.id}`}
                    >
                      {cartItemMap[dish.id] ? "Added" : "Add"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        </div>
      </main>

      <FloatingCartButton 
        itemCount={totalCartItems}
        totalPrice={totalPrice}
        onClick={() => setShowPlatter(true)}
      />

      <BottomNav 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        cartItemCount={totalCartItems}
      />

      <Dialog open={quantityDialogOpen} onOpenChange={setQuantityDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Quantity</DialogTitle>
            <DialogDescription>
              How many members are you ordering for?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-muted-foreground">Members</span>
                <Input
                  type="number"
                  value={memberCount}
                  onChange={(e) => handleMemberCountChange(e.target.value)}
                  onBlur={handleInputBlur}
                  min={10}
                  className="w-24 text-right text-xl font-bold"
                  data-testid="input-member-count"
                />
              </div>
              
              <Slider
                value={[Math.min(memberCount, 1000)]}
                onValueChange={(value) => setMemberCount(value[0])}
                min={10}
                max={1000}
                step={10}
                className="w-full"
                data-testid="slider-members"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10 members</span>
                <span>1000+ members</span>
              </div>
            </div>
            
            {selectedDish && (
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex gap-3 items-start">
                  <img
                    src={getDishImage(selectedDish.name, selectedDish.imageUrl || undefined, selectedDish)}
                    alt={selectedDish.name}
                    className="w-20 h-20 rounded-md object-cover"
                  />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">{selectedDish.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{parseFloat(selectedDish.price as string).toFixed(0)} per serving
                    </p>
                    <p className="text-lg font-bold text-primary">
                      Total: ₹{(parseFloat(selectedDish.price as string) * memberCount).toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setQuantityDialogOpen(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={handleConfirmAdd}
              data-testid="button-confirm-add"
            >
              Add to Platter
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                <span>₹200+</span>
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
          
          <RadioGroup value={sortOption} onValueChange={(value) => setSortOption(value as any)} className="py-4">
            <div className="flex items-center space-x-2 py-2">
              <RadioGroupItem value="price-low" id="price-low" data-testid="radio-price-low" />
              <Label htmlFor="price-low" className="flex-1 cursor-pointer">
                Price: Low to High
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 py-2">
              <RadioGroupItem value="price-high" id="price-high" data-testid="radio-price-high" />
              <Label htmlFor="price-high" className="flex-1 cursor-pointer">
                Price: High to Low
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 py-2">
              <RadioGroupItem value="name-az" id="name-az" data-testid="radio-name-az" />
              <Label htmlFor="name-az" className="flex-1 cursor-pointer">
                Name: A to Z
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 py-2">
              <RadioGroupItem value="name-za" id="name-za" data-testid="radio-name-za" />
              <Label htmlFor="name-za" className="flex-1 cursor-pointer">
                Name: Z to A
              </Label>
            </div>
          </RadioGroup>
          
          <Button 
            className="w-full"
            onClick={() => setSortDialogOpen(false)}
            data-testid="button-apply-sort"
          >
            Apply
          </Button>
        </DialogContent>
      </Dialog>

      {/* Platter Planner Dialog */}
      <Dialog open={platterPlannerOpen} onOpenChange={setPlatterPlannerOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif">Platter Planner</DialogTitle>
            <DialogDescription>
              Choose the perfect plan for all your {pageTitle.toLowerCase()} catering needs
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Basic Plan */}
            <Card className="p-4 border-2 hover-elevate active-elevate-2 cursor-pointer transition-all" data-testid="card-plan-basic">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold">Basic Plan</h3>
                  <p className="text-sm text-muted-foreground">Perfect for small gatherings</p>
                </div>
                <Badge variant="secondary" className="text-xs">Popular</Badge>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="pl-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <img src={mealType === 'tiffins' ? breakfastTiffinImage : mealType === 'snacks' ? snacksVarietiesImage : lunchDinnerImage} alt={pageTitle} className="w-12 h-12 rounded-md object-cover" />
                    <div>
                      <p className="font-medium text-foreground">{pageTitle}</p>
                      <p className="text-xs">2-3 items</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Standard packaging</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Free delivery above ₹500</span>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                variant="outline" 
                data-testid="button-select-basic"
                onClick={() => {
                  setPlatterPlannerOpen(false);
                  setLocation(`/planner/${mealType}/basic`);
                }}
              >
                Select Basic Plan
              </Button>
            </Card>

            {/* Gold Plan */}
            <Card className="p-4 border-2 border-primary hover-elevate active-elevate-2 cursor-pointer transition-all bg-primary/5" data-testid="card-plan-gold">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    Gold Plan
                    <Sparkles className="w-4 h-4 text-primary" />
                  </h3>
                  <p className="text-sm text-muted-foreground">Most chosen for events</p>
                </div>
                <Badge variant="default" className="text-xs">Recommended</Badge>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="pl-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <img src={mealType === 'tiffins' ? breakfastTiffinImage : mealType === 'snacks' ? snacksVarietiesImage : lunchDinnerImage} alt={pageTitle} className="w-12 h-12 rounded-md object-cover" />
                    <div>
                      <p className="font-medium text-foreground">{pageTitle}</p>
                      <p className="text-xs">4-5 items</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Premium packaging</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Free delivery + Setup assistance</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>10% discount on total bill</span>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                data-testid="button-select-gold"
                onClick={() => {
                  setPlatterPlannerOpen(false);
                  setLocation(`/planner/${mealType}/gold`);
                }}
              >
                Select Gold Plan
              </Button>
            </Card>

            {/* Premium Plan */}
            <Card className="p-4 border-2 hover-elevate active-elevate-2 cursor-pointer transition-all" data-testid="card-plan-premium">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold">Premium Plan</h3>
                  <p className="text-sm text-muted-foreground">Ultimate luxury experience</p>
                </div>
                <Badge variant="secondary" className="text-xs">Premium</Badge>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="pl-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <img src={mealType === 'tiffins' ? breakfastTiffinImage : mealType === 'snacks' ? snacksVarietiesImage : lunchDinnerImage} alt={pageTitle} className="w-12 h-12 rounded-md object-cover" />
                    <div>
                      <p className="font-medium text-foreground">{pageTitle}</p>
                      <p className="text-xs">6+ items</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Deluxe packaging + Serving staff</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Free delivery + Complete setup</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>15% discount on total bill</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <span>Customizable menu options</span>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                variant="outline" 
                data-testid="button-select-platinum"
                onClick={() => {
                  setPlatterPlannerOpen(false);
                  setLocation(`/planner/${mealType}/platinum`);
                }}
              >
                Select Premium Plan
              </Button>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Details Dialog */}
      <Dialog open={planDetailsOpen} onOpenChange={setPlanDetailsOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif capitalize">
              {selectedPlan} Plan - Meal Details
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown of dishes included in your selected plan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Breakfast Section */}
            <div>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span>Breakfast Tiffins</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedPlan === 'basic' ? '2-3 items' : selectedPlan === 'gold' ? '4-5 items' : '6+ items'}
                </Badge>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Card className="p-3">
                  <img src={idliImage1} alt="Idli with Sambar" className="w-full h-24 object-cover rounded-md mb-2" />
                  <p className="text-sm font-medium">Idli with Sambar</p>
                  <p className="text-xs text-muted-foreground">Steamed rice cakes</p>
                </Card>
                <Card className="p-3">
                  <img src={masalaDosaImage} alt="Masala Dosa" className="w-full h-24 object-cover rounded-md mb-2" />
                  <p className="text-sm font-medium">Masala Dosa</p>
                  <p className="text-xs text-muted-foreground">Crispy crepe with filling</p>
                </Card>
                <Card className="p-3">
                  <img src={pongalImage} alt="Pongal" className="w-full h-24 object-cover rounded-md mb-2" />
                  <p className="text-sm font-medium">Pongal</p>
                  <p className="text-xs text-muted-foreground">Rice & lentil dish</p>
                </Card>
                {(selectedPlan === 'gold' || selectedPlan === 'platinum') && (
                  <>
                    <Card className="p-3">
                      <img src={uttapamImage} alt="Uttapam" className="w-full h-24 object-cover rounded-md mb-2" />
                      <p className="text-sm font-medium">Uttapam</p>
                      <p className="text-xs text-muted-foreground">Thick savory pancake</p>
                    </Card>
                    <Card className="p-3">
                      <img src={vadaImage1} alt="Medu Vada" className="w-full h-24 object-cover rounded-md mb-2" />
                      <p className="text-sm font-medium">Medu Vada</p>
                      <p className="text-xs text-muted-foreground">Crispy lentil donuts</p>
                    </Card>
                  </>
                )}
                {selectedPlan === 'platinum' && (
                  <>
                    <Card className="p-3">
                      <img src={upmaImage} alt="Upma" className="w-full h-24 object-cover rounded-md mb-2" />
                      <p className="text-sm font-medium">Upma</p>
                      <p className="text-xs text-muted-foreground">Semolina breakfast</p>
                    </Card>
                    <Card className="p-3">
                      <img src={pohaImage} alt="Poha" className="w-full h-24 object-cover rounded-md mb-2" />
                      <p className="text-sm font-medium">Poha</p>
                      <p className="text-xs text-muted-foreground">Flattened rice dish</p>
                    </Card>
                  </>
                )}
              </div>
            </div>

            {/* Snacks Section */}
            <div>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span>Snacks & Appetizers</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedPlan === 'basic' ? '2-3 varieties' : selectedPlan === 'gold' ? '4-5 varieties' : '6+ varieties'}
                </Badge>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Card className="p-3">
                  <img src={samosaImage} alt="Samosa" className="w-full h-24 object-cover rounded-md mb-2" />
                  <p className="text-sm font-medium">Samosa</p>
                  <p className="text-xs text-muted-foreground">Crispy pastry</p>
                </Card>
                <Card className="p-3">
                  <img src={vadaImage1} alt="Vada" className="w-full h-24 object-cover rounded-md mb-2" />
                  <p className="text-sm font-medium">Vada</p>
                  <p className="text-xs text-muted-foreground">Fried fritters</p>
                </Card>
                <Card className="p-3">
                  <img src={vadaImage1} alt="Pakora" className="w-full h-24 object-cover rounded-md mb-2" />
                  <p className="text-sm font-medium">Pakora</p>
                  <p className="text-xs text-muted-foreground">Vegetable fritters</p>
                </Card>
                {(selectedPlan === 'gold' || selectedPlan === 'platinum') && (
                  <>
                    <Card className="p-3">
                      <img src={vadaImage1} alt="Bajji" className="w-full h-24 object-cover rounded-md mb-2" />
                      <p className="text-sm font-medium">Bajji</p>
                      <p className="text-xs text-muted-foreground">Batter fried snacks</p>
                    </Card>
                    <Card className="p-3">
                      <img src={samosaImage} alt="Kachori" className="w-full h-24 object-cover rounded-md mb-2" />
                      <p className="text-sm font-medium">Kachori</p>
                      <p className="text-xs text-muted-foreground">Stuffed pastry</p>
                    </Card>
                  </>
                )}
                {selectedPlan === 'platinum' && (
                  <>
                    <Card className="p-3">
                      <img src={vadaImage1} alt="Bonda" className="w-full h-24 object-cover rounded-md mb-2" />
                      <p className="text-sm font-medium">Bonda</p>
                      <p className="text-xs text-muted-foreground">Potato fritters</p>
                    </Card>
                    <Card className="p-3">
                      <img src={samosaImage} alt="Spring Rolls" className="w-full h-24 object-cover rounded-md mb-2" />
                      <p className="text-sm font-medium">Spring Rolls</p>
                      <p className="text-xs text-muted-foreground">Crispy rolls</p>
                    </Card>
                  </>
                )}
              </div>
            </div>

            {/* Lunch/Dinner Section */}
            <div>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span>Lunch & Dinner</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedPlan === 'basic' ? '2-3 main dishes' : selectedPlan === 'gold' ? '4-5 main dishes' : '6+ main dishes'}
                </Badge>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Card className="p-3">
                  <img src={biryaniImage1} alt="Biryani" className="w-full h-24 object-cover rounded-md mb-2" />
                  <p className="text-sm font-medium">Biryani</p>
                  <p className="text-xs text-muted-foreground">Fragrant rice dish</p>
                </Card>
                <Card className="p-3">
                  <img src={thaliImage} alt="Veg Curry" className="w-full h-24 object-cover rounded-md mb-2" />
                  <p className="text-sm font-medium">Veg Curry</p>
                  <p className="text-xs text-muted-foreground">Mixed vegetables</p>
                </Card>
                <Card className="p-3">
                  <img src={platterImage} alt="Dal" className="w-full h-24 object-cover rounded-md mb-2" />
                  <p className="text-sm font-medium">Dal Tadka</p>
                  <p className="text-xs text-muted-foreground">Tempered lentils</p>
                </Card>
                {(selectedPlan === 'gold' || selectedPlan === 'platinum') && (
                  <>
                    <Card className="p-3">
                      <img src={thaliImage} alt="Paneer Butter Masala" className="w-full h-24 object-cover rounded-md mb-2" />
                      <p className="text-sm font-medium">Paneer Butter Masala</p>
                      <p className="text-xs text-muted-foreground">Cottage cheese curry</p>
                    </Card>
                    <Card className="p-3">
                      <img src={platterImage} alt="Chole" className="w-full h-24 object-cover rounded-md mb-2" />
                      <p className="text-sm font-medium">Chole</p>
                      <p className="text-xs text-muted-foreground">Chickpea curry</p>
                    </Card>
                  </>
                )}
                {selectedPlan === 'platinum' && (
                  <>
                    <Card className="p-3">
                      <img src={biryaniImage1} alt="Pulao" className="w-full h-24 object-cover rounded-md mb-2" />
                      <p className="text-sm font-medium">Pulao</p>
                      <p className="text-xs text-muted-foreground">Spiced rice</p>
                    </Card>
                    <Card className="p-3">
                      <img src={thaliImage} alt="Kadai Veg" className="w-full h-24 object-cover rounded-md mb-2" />
                      <p className="text-sm font-medium">Kadai Veg</p>
                      <p className="text-xs text-muted-foreground">Wok-tossed veggies</p>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setPlanDetailsOpen(false)}
              data-testid="button-back-to-plans"
            >
              Back to Plans
            </Button>
            <Button 
              className="flex-1"
              onClick={() => {
                setPlanDetailsOpen(false);
                setPlatterPlannerOpen(false);
              }}
              data-testid="button-confirm-plan"
            >
              Confirm & Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PlatterVisualization
        open={showPlatter}
        onOpenChange={setShowPlatter}
        cartItems={cartItems}
        paxCount={paxCount}
        onPaxCountChange={setPaxCount}
        onProceedToCheckout={() => {
          setShowPlatter(false);
          setLocation('/checkout');
        }}
      />

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
                  {detailDish?.description}
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
                
                <Button
                  size="lg"
                  onClick={() => {
                    if (detailDish) {
                      handleAdd(detailDish.id);
                      setDishDetailOpen(false);
                    }
                  }}
                  variant={detailDish && cartItemMap[detailDish.id] ? "secondary" : "default"}
                  className="rounded-full px-8 min-w-[140px]"
                  data-testid="button-add-from-detail"
                >
                  {detailDish && cartItemMap[detailDish.id] ? "Added ✓" : "Add to Cart"}
                </Button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
