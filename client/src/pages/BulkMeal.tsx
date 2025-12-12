import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { PageWithLoader } from "@/components/PageWithLoader";
import Fuse from "fuse.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useInputFocus } from "@/hooks/useInputFocus";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
// Define interfaces locally to resolve missing exports
export interface Category {
  id: string;
  name: string;
  image_url: string;
  imageUrl?: string;
  displayOrder?: number;
  meal_type?: string;
  mealType?: string;
  active?: boolean;
}

// Renaming to CategoryType to match existing usage code
export type CategoryType = Category;

export interface Dish {
  id: any; // Using any to handle potential string/number mismatch in component
  name: string;
  description: string | null;
  price: number | string;
  image_url: string | null;
  imageUrl?: string;
  category_id: string;
  categoryId?: string;
  dish_type?: string | null;
  dishType?: string;
  is_available?: boolean;
  isAvailable?: boolean;
  rating?: number;
  dietary_tag?: string | null;
  dietaryType?: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
}
import { getSupabaseImageUrl, getDishTypeImage } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { LazyImage } from "@/components/ui/lazy-image";
import { ArrowLeft, Building2, Users, Calendar, Mail, Phone, MapPin, ShoppingCart, UtensilsCrossed, Package, Truck, Clock, X, ChevronDown, Search, Mic, ArrowUpDown, SlidersHorizontal, Star, Utensils, LayoutGrid, Leaf, Drumstick, Egg, Sparkles } from "lucide-react";
import biryaniImage1 from '@assets/stock_images/indian_biryani_dish__60e99e80.jpg';
import idliImage1 from '@assets/stock_images/indian_idli_sambar_s_c6bb3ca9.jpg';
import vadaImage1 from '@assets/stock_images/indian_vada_d82fc29e.jpg';
import thaliImage from '@assets/stock_images/indian_thali_meal_3a645a6d.jpg';
import samosaImage from '@assets/stock_images/samosa_snacks_indian_0946aa28.jpg';
import platterImage from '@assets/stock_images/indian_food_platter__b34d03e7.jpg';
import FloatingNav from "@/pages/FloatingNav";
import { SearchOverlay } from "@/components/SearchOverlay";
import { useCart } from "@/context/CartContex";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import bulkMealsHeroPattern from "@assets/Hero_BulkMeals.png";
import customizedMenuImg from "@assets/Menu_1763877123353.png";
import photographyImg from "@assets/Photography_1763877123366.png";
import eventDecorImg from "@assets/Event Decor_1763877123367.png";
import bulkOrderImg from "@assets/Bulk Order_1763877123367.png";
import deliveryImg from "@assets/Delivery_1763877123368.png";
import priorityServiceImg from "@assets/Priority Service_1763877123368.png";
import hiTeaIcon from "@assets/Image34344_1763882700312.png";
import breakfastIcon from "@assets/Image2322_1763882700309.png";
import lunchIcon from "@assets/9_1763882651330.png";
import dinnerIcon from "@assets/Rectangle 34625261_1763882651331.png";
import lunchDinnerIcon from "@assets/game-icons_hot-meal_1763923901438.png";
import tiffinsIcon from "@assets/fi_8174371_1763923901431.png";
import hiTeaCategoryIcon from "@assets/fi_2673562_1763923892186.png";
import lunchDinnerIconWhite from "@assets/game-icons_hot-meal_1763924074418.png";
import tiffinsIconWhite from "@assets/fi_81743711_1763924083923.png";
import hiTeaCategoryIconWhite from "@assets/fi_26735624_1763924083929.png";
import grilledIcon from "@assets/Image34_1763904331982.png";
import friedIcon from "@assets/Image65_1763904331981.png";
import stuffedIcon from "@assets/Image49_1763904331978.png";

// Helper function to filter categories by meal_type from database
// The database meal_type column contains comma-separated values like "tiffins, snacks, lunch-dinner"
const filterCategoriesByMealType = (categories: any[], mealTypeFilter: string): any[] => {
  return categories.filter(cat => {
    const mealType = (cat as any).meal_type || cat.mealType || '';
    // Check if the category's meal_type contains the selected filter
    return mealType.toLowerCase().includes(mealTypeFilter.toLowerCase());
  });
};

// Fallback images for categories
const CATEGORY_IMAGES: Record<string, string> = {
  'all': idliImage1,
  'south-indian-tiffins': thaliImage,
  'north-indian-tiffins': thaliImage,
  'quick-bites': vadaImage1,
  'fried-snacks': vadaImage1,
  'baked-snacks': idliImage1,
  'chaats': vadaImage1,
  'rice-items': biryaniImage1,
  'breads-curries': thaliImage,
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
  'Bread': thaliImage,
  'EggPlate': idliImage1,
  'GrainBowl': thaliImage,
  'Handheld': thaliImage,
  'HotFry': vadaImage1,
  'PanFry': idliImage1,
  'SavoryBakery': samosaImage,
  'Steamed': idliImage1,
  'SweetGriddle': idliImage1,

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
  'BreadMithai': thaliImage,
  'ColostrumMithai': thaliImage,
  'FriedMithai': vadaImage1,
  'GrainMithai': thaliImage,

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

// Helper function to get subcategory (dish type) image URL from Supabase with local fallback
const getSubcategoryImage = (dishType: string): string => {
  const fallbackImage = DISH_TYPE_IMAGES[dishType] || DISH_TYPE_IMAGES['default'];
  return getDishTypeImage(dishType, fallbackImage);
};

type ServiceType = "bulk-meals" | "mealbox" | "catering" | "corporate";
type NavigateFn = (path: string, options?: { replace?: boolean }) => void;

const LOCATION_STORAGE_KEY = "activeLocation";

interface BulkMealsProps {
  onNavigate?: NavigateFn;
}

export default function BulkMeals({ onNavigate }: BulkMealsProps = {}) {
  const [, setLocation] = useLocation();
  const navigate: NavigateFn = (path, options) => {
    if (onNavigate) {
      onNavigate(path, options);
    } else {
      setLocation(path, options);
    }
  };
  const { toast } = useToast();
  const isInputFocused = useInputFocus();
  const { cart, addedItems, addToCart, removeFromCart, enterCategory } = useCart();
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("home");
  const [selectedService, setSelectedService] = useState<ServiceType>("bulk-meals");
  const [locationLabel, setLocationLabel] = useState("Select Address");

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Location sync from localStorage
  useEffect(() => {
    const readLocationFromStorage = () => {
      const savedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (savedLocation) {
        try {
          const parsed = JSON.parse(savedLocation);
          setLocationLabel(parsed.label || "Select Address");
        } catch (e) {
          setLocationLabel("Select Address");
        }
      } else {
        setLocationLabel("Select Address");
      }
    };

    readLocationFromStorage();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCATION_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setLocationLabel(parsed.label || "Select Address");
        } catch (error) {
          console.error("Error parsing location from storage event:", error);
        }
      } else if (e.key === LOCATION_STORAGE_KEY && !e.newValue) {
        setLocationLabel("Select Address");
      }
    };

    const handleLocationChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.label) {
        setLocationLabel(customEvent.detail.label);
      } else {
        readLocationFromStorage();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("locationchange", handleLocationChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("locationchange", handleLocationChange);
    };
  }, []);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [selectedMealCategory, setSelectedMealCategory] = useState<string>("lunch-dinner");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDishType, setSelectedDishType] = useState<string>("all");
  const [dietaryMode, setDietaryMode] = useState<'all' | 'veg' | 'egg' | 'non-veg'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortOption, setSortOption] = useState<'price-low' | 'price-high' | 'name-az' | 'name-za'>('price-low');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [platterPlannerOpen, setPlatterPlannerOpen] = useState(false);
  const [dishDetailOpen, setDishDetailOpen] = useState(false);
  const [detailDish, setDetailDish] = useState<Dish | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [quantityErrors, setQuantityErrors] = useState<Record<number, string>>({});
  const hasInteractedRef = useRef(false);

  // Track scroll position for sticky header styling (matches CateringPage)
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openDishDetail = (dish: Dish) => {
    setDetailDish(dish);
    setDishDetailOpen(true);
  };

  const handleInteraction = () => {
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      enterCategory("bulk-meals");
    }
  };

  const handleAddToCart = (item: { id: number; name: string; price: number; quantity?: number }) => {
    handleInteraction();
    const quantityStr = quantities[item.id] !== undefined ? quantities[item.id] : '';
    const quantity = quantityStr ? parseInt(quantityStr, 10) : 0;

    console.log('handleAddToCart:', { itemId: item.id, quantityStr, quantity });

    // Strict validation: quantity must be at least 5
    if (quantity < 5) {
      setQuantityErrors(prev => ({ ...prev, [item.id]: "accepts only from 5" }));
      toast({
        title: "Minimum Order Required",
        description: "accepts only from 5",
        variant: "destructive",
      });
      return;
    }

    // Clear any existing error
    setQuantityErrors(prev => ({ ...prev, [item.id]: '' }));

    addToCart("bulk-meals", {
      id: item.id,
      name: item.name,
      price: item.price,
      quantity
    });

    // Keep the quantity value after adding
  };

  const handleRemoveFromCart = (itemId: number) => {
    removeFromCart(itemId);
  };


  // Debounce search query for better performance (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Map UI tab selection to database meal_type filter value
  // Database meal_type column contains: "tiffins", "snacks", "lunch-dinner" (comma-separated)
  const getMealTypeFilter = (category: string): string => {
    const mapping: Record<string, string> = {
      "hi-tea": "snacks",           // Hi-Tea tab → filter by "snacks" in meal_type
      "tiffins": "tiffins",         // Tiffins tab → filter by "tiffins" in meal_type
      "lunch-dinner": "lunch-dinner", // Lunch/Dinner tab → filter by "lunch-dinner" in meal_type
    };
    return mapping[category] || "snacks";
  };

  const mealType = getMealTypeFilter(selectedMealCategory);

  // Fetch ALL categories from database
  const { data: allCategoriesFromDb = [], isLoading: isLoadingCategories } = useQuery<CategoryType[]>({
    queryKey: ['/api/categories', 'all'],
  });

  // Check if initial data is still loading (categories and first dishes query)
  const isInitialLoading = isLoadingCategories;

  // Get priority category ID based on meal type
  const getPriorityCategoryId = (mealTypeFilter: string): string => {
    const priorityMap: Record<string, string> = {
      "lunch-dinner": "main-course",
      "tiffins": "breakfast",
      "snacks": "snacks",
    };
    return priorityMap[mealTypeFilter] || "";
  };

  const priorityCategoryId = getPriorityCategoryId(mealType);

  // Custom sidebar category order for Lunch/Dinner
  const LUNCH_DINNER_CATEGORY_ORDER = [
    'soup',
    'starters',
    'salads',
    'main-course',
    'beverages',
    'snacks',
    'bakery',
    'chaats',
    'sweets',
    'desserts',
    'sides-and-accompaniments',
    'after-meal',
  ];

  // Custom sidebar category order for Breakfast/Tiffins
  const BREAKFAST_CATEGORY_ORDER = [
    'breakfast',
    'salads',
    'sides-and-accompaniments',
    'beverages',
    'snacks',
    'bakery',
    'sweets',
    'desserts',
  ];

  // Get the appropriate category order based on meal type
  const getCategoryOrder = (mealTypeFilter: string): string[] => {
    if (mealTypeFilter === 'tiffins') {
      return BREAKFAST_CATEGORY_ORDER;
    }
    return LUNCH_DINNER_CATEGORY_ORDER;
  };

  // Filter categories dynamically from database meal_type column
  // Categories are sorted by the custom category order based on meal type
  const categories = useMemo(() => {
    if (!mealType || allCategoriesFromDb.length === 0) return [];
    const filtered = filterCategoriesByMealType(allCategoriesFromDb, mealType);
    const categoryOrder = getCategoryOrder(mealType);
    return filtered.sort((a, b) => {
      const aIndex = categoryOrder.indexOf(a.id);
      const bIndex = categoryOrder.indexOf(b.id);
      // If both are in the custom order, sort by that order
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      // If only one is in the custom order, it comes first
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      // Otherwise sort by displayOrder
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    }) as CategoryType[];
  }, [allCategoriesFromDb, mealType]);

  // Set first category as selected when categories load or when meal type changes
  // Keep 'all' as valid selection - only reset if it's an invalid category ID
  useEffect(() => {
    if (categories.length > 0) {
      // Don't reset if 'all' is selected - it's a valid filter option
      if (selectedCategory === 'all') return;
      // Only reset if the current selection is not found in available categories
      if (!selectedCategory || !categories.find(c => c.id === selectedCategory)) {
        setSelectedCategory('all');
      }
    }
  }, [categories, selectedCategory, mealType]);

  // OPTIMIZATION: Lazy-load category counts in background after page renders
  // This query fetches all dishes for the meal type but is non-blocking (loads after initial render)
  const { data: allDishesForCounts = [] } = useQuery<Dish[]>({
    queryKey: ['/api/dishes', mealType, 'all', 'all'],
    enabled: !!mealType,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes - counts don't change often
    refetchOnWindowFocus: false,
  });

  // Filter to available dishes only
  const allDishes = useMemo(() => {
    return allDishesForCounts.filter(dish => {
      const isAvailable = (dish as any).is_available !== false && dish.isAvailable !== false;
      return isAvailable;
    });
  }, [allDishesForCounts]);

  // Fetch dishes for selected category (for display)
  const { data: dishes = [], isLoading: isLoadingDishes } = useQuery<Dish[]>({
    queryKey: ['/api/dishes', mealType, selectedCategory, dietaryMode],
    enabled: !!selectedCategory,
  });

  // Fetch dish types for selected category
  const { data: fetchedDishTypes = [] } = useQuery<string[]>({
    queryKey: ['/api/dish-types', selectedCategory],
    enabled: !!selectedCategory && selectedCategory !== 'all',
  });

  // Fetch subcategories for images on BulkMeal page
  const { data: subcategories = [] } = useQuery<any[]>({
    queryKey: ['/api/subcategories'],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Get visible category IDs for the current meal type
  const visibleCategoryIds = useMemo(() => {
    return new Set(categories.map(c => c.id));
  }, [categories]);

  // When "All" is selected, compute unique dish types ONLY from dishes in visible categories
  // This ensures subcategories like "Biryani" (main-course) don't appear in Hi-Tea
  const allUniqueDishTypes = useMemo(() => {
    if (selectedCategory !== 'all') return [];
    const types = new Set<string>();
    dishes.forEach(dish => {
      // Only include dish types from dishes in visible categories
      const dishCategoryId = (dish as any).category_id || dish.categoryId;
      if (!visibleCategoryIds.has(dishCategoryId)) return;

      const dishType = (dish as any).dish_type || dish.dishType;
      if (dishType && dishType.trim() !== '') {
        types.add(dishType);
      }
    });
    return Array.from(types).sort();
  }, [dishes, selectedCategory, visibleCategoryIds]);

  // Use allUniqueDishTypes when "All" is selected, otherwise use fetched dish types
  // Filter out empty strings from fetched dish types (API may return [""] for categories with no dish types)
  const dishTypes = selectedCategory === 'all'
    ? allUniqueDishTypes
    : fetchedDishTypes.filter(dt => dt && dt.trim() !== '');

  // Reset dish type filter when category changes
  useEffect(() => {
    setSelectedDishType('all');
  }, [selectedCategory]);

  // Pre-compute category counts for performance (memoized)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allDishes.forEach(d => {
      const dishCategoryId = (d as any).category_id || d.categoryId;
      if (!dishCategoryId) return;

      // Apply dietary filter (egg is client-side)
      if (dietaryMode === 'egg' && !d.name.toLowerCase().includes('egg')) return;

      counts[dishCategoryId] = (counts[dishCategoryId] || 0) + 1;
    });
    return counts;
  }, [allDishes, dietaryMode]);

  // Get total dish count for a category (uses memoized counts)
  const getDishCountForCategory = useCallback((categoryId: string): number => {
    return categoryCounts[categoryId] || 0;
  }, [categoryCounts]);

  // Pre-compute dish type counts for performance (memoized)
  const dishTypeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: dishes.length };
    dishes.forEach(d => {
      const dishDishType = (d as any).dish_type || d.dishType;
      if (dishDishType) {
        counts[dishDishType] = (counts[dishDishType] || 0) + 1;
      }
    });
    return counts;
  }, [dishes]);

  // Get dish count for a specific dish type (uses memoized counts)
  const getDishCountForDishType = useCallback((dishType: string): number => {
    return dishTypeCounts[dishType] || 0;
  }, [dishTypeCounts]);

  // Fuse.js instance for fuzzy search (memoized)
  // Includes category_id so searching for "sweets" finds dishes in the sweets category
  const fuse = useMemo(() => {
    return new Fuse(dishes, {
      keys: [
        { name: 'name', weight: 2 },
        { name: 'description', weight: 1 },
        { name: 'category_id', weight: 1.5 },
        { name: 'categoryId', weight: 1.5 }
      ],
      threshold: 0.4,
      ignoreLocation: true,
      includeScore: true,
    });
  }, [dishes]);

  // Filter and sort dishes (uses debounced search for better performance)
  // When "All" is selected, priority category dishes appear first
  // When searching, name matches are prioritized over description matches
  // Fuzzy search handles minor spelling mistakes
  const filteredAndSortedDishes = useMemo(() => {
    let searchResults: typeof dishes = [];
    let searchScores: Map<string, number> = new Map();

    // If searching, use Fuse.js for fuzzy matching
    if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
      const fuseResults = fuse.search(debouncedSearchQuery);
      searchResults = fuseResults.map(r => r.item);
      fuseResults.forEach(r => {
        searchScores.set(r.item.id, r.score || 1);
      });
    } else {
      searchResults = dishes;
    }

    return searchResults
      .filter(dish => {
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
        // When searching, sort by search relevance (lower score = better match)
        if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
          const scoreA = searchScores.get(a.id) ?? 1;
          const scoreB = searchScores.get(b.id) ?? 1;
          if (scoreA !== scoreB) return scoreA - scoreB;
        }

        // When viewing "All", priority category dishes come first
        if (selectedCategory === 'all' && priorityCategoryId) {
          const aCategoryId = (a as any).category_id || a.categoryId;
          const bCategoryId = (b as any).category_id || b.categoryId;
          const aIsPriority = aCategoryId === priorityCategoryId;
          const bIsPriority = bCategoryId === priorityCategoryId;

          if (aIsPriority && !bIsPriority) return -1;
          if (!aIsPriority && bIsPriority) return 1;
        }

        // Then apply the selected sort option
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
  }, [dishes, debouncedSearchQuery, fuse, selectedDishType, dietaryMode, priceRange, sortOption, selectedCategory, priorityCategoryId]);

  const hasActiveFilters = priceRange[0] !== 0 || priceRange[1] !== 500;

  const resetFilters = () => {
    setPriceRange([0, 500]);
  };

  // Helper function to get dish image
  // Added helper for category images utilizing DB url
  const getCategoryImageUrl = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return CATEGORY_IMAGES[categoryId] || idliImage1;

    // Check for DB image_url (snake_case) or imageUrl (camelCase)
    const dbImage = (category as any).image_url || category.imageUrl;

    if (dbImage && !dbImage.startsWith('/images/')) {
      return getSupabaseImageUrl(dbImage);
    }
    return CATEGORY_IMAGES[categoryId] || idliImage1;
  };

  // Shadowing outer getSubcategoryImage to use fetched subcategories
  const getSubcategoryImage = (dishType: string): string => {
    const subcat = subcategories.find((s: any) => s.name === dishType);
    if (subcat?.image_url) {
      return getSupabaseImageUrl(subcat.image_url);
    }
    const fallbackImage = DISH_TYPE_IMAGES[dishType] || DISH_TYPE_IMAGES['default'];
    return getDishTypeImage(dishType, fallbackImage);
  };

  const getDishImage = (dishName: string, dishImageUrl?: string, dishData?: any): string => {
    const imageUrlFromDb = dishImageUrl || dishData?.image_url || dishData?.imageUrl;

    if (imageUrlFromDb && imageUrlFromDb.trim() !== '') {
      const supabaseUrl = getSupabaseImageUrl(imageUrlFromDb);
      if (supabaseUrl && !supabaseUrl.includes('placeholder') && supabaseUrl.startsWith('http')) {
        return supabaseUrl;
      }
    }

    const name = dishName.toLowerCase();

    if (name === 'achari paneer tikka') {
      return 'https://leltckltotobsibixhqo.supabase.co/storage/v1/object/public/dish_images/dishes/D-0002/main.png';
    }

    if (name.includes('paneer tikka') || name.includes('achari paneer')) return platterImage;
    if (name.includes('paneer')) return platterImage;
    if (name.includes('tikka')) return platterImage;
    if (name.includes('dosa') && !name.includes('paneer')) return thaliImage;
    if ((name.includes('idli') || name.includes('idly')) && !name.includes('paneer') && !name.includes('tikka')) return idliImage1;
    if (name.includes('vada') || name.includes('medu')) return vadaImage1;
    if (name.includes('aloo paratha') || name.includes('paratha')) return thaliImage;
    if (name.includes('chole bhature') || name.includes('bhature')) return thaliImage;
    if (name.includes('poha')) return thaliImage;
    if (name.includes('upma')) return thaliImage;
    if (name.includes('bread toast') || name.includes('toast')) return thaliImage;
    if (name.includes('samosa')) return samosaImage;
    if (name.includes('pakora') || name.includes('bajji')) return vadaImage1;
    if (name.includes('biryani')) return biryaniImage1;
    if (name.includes('thali') || name.includes('meal')) return thaliImage;
    if (name.includes('curry') || name.includes('masala')) return platterImage;

    return platterImage;
  };

  const [formData, setFormData] = useState({
    eventType: "",
    numberOfPeople: "",
    veg: "",
    nonVeg: "",
    egg: "",
    cuisinePreferences: [] as string[],
    budgetMin: "",
    budgetMax: "",
    mealTimes: [] as string[],
    eventDate: "",
    eventTime: "",
    phone: "",
    email: "",
  });

  const [cuisineDropdownOpen, setCuisineDropdownOpen] = useState(false);
  const cuisineDropdownRef = useRef<HTMLDivElement>(null);

  // Calculate total people from dietary preferences
  const totalPeople = (parseInt(formData.veg) || 0) + (parseInt(formData.nonVeg) || 0) + (parseInt(formData.egg) || 0);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    setSlideCount(carouselApi.scrollSnapList().length);
    setCurrentSlide(carouselApi.selectedScrollSnap());

    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cuisineDropdownRef.current && !cuisineDropdownRef.current.contains(event.target as Node)) {
        setCuisineDropdownOpen(false);
      }
    };

    if (cuisineDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [cuisineDropdownOpen]);

  const handleTabChange = (tab: "home" | "menu" | "profile") => {
    setActiveTab(tab);
    if (tab === "home") {
      navigate("/");
    } else if (tab === "menu") {
      navigate("/menu");
    } else if (tab === "profile") {
      navigate("/profile");
    }
  };

  const handleMealTimeToggle = (mealTime: string) => {
    setFormData(prev => ({
      ...prev,
      mealTimes: prev.mealTimes.includes(mealTime)
        ? prev.mealTimes.filter(m => m !== mealTime)
        : [...prev.mealTimes, mealTime]
    }));
  };

  const handleCuisineToggle = (cuisine: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => ({
      ...prev,
      cuisinePreferences: prev.cuisinePreferences.includes(cuisine)
        ? prev.cuisinePreferences.filter(c => c !== cuisine)
        : [...prev.cuisinePreferences, cuisine]
    }));
  };

  const removeCuisine = (cuisine: string) => {
    setFormData(prev => ({
      ...prev,
      cuisinePreferences: prev.cuisinePreferences.filter(c => c !== cuisine)
    }));
  };

  const cuisineOptions = [
    { value: "north-indian", label: "North Indian" },
    { value: "south-indian", label: "South Indian" },
    { value: "chinese", label: "Chinese" },
    { value: "continental", label: "Continental" },
    { value: "italian", label: "Italian" },
    { value: "mexican", label: "Mexican" },
    { value: "multi-cuisine", label: "Multi-Cuisine" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.eventType || !formData.phone || !formData.eventDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Check 12-hour minimum advance booking
    const selectedDateTime = new Date(`${formData.eventDate}T${formData.eventTime || '12:00'}`);
    const now = new Date();
    const hoursDiff = (selectedDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff < 12) {
      toast({
        title: "Invalid Date/Time",
        description: "Please select a date and time at least 12 hours from now.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to thank you page
    navigate("/bulk-meals-thank-you");
  };

  // Show loading skeleton while initial data loads
  if (isInitialLoading) {
    return (
      <div className="min-h-screen pb-24 relative">
        {/* Blue Geometric Background Header */}
        <div
          className="absolute top-0 left-0 right-0 z-0 overflow-hidden"
          style={{
            height: "350px",
            borderBottomLeftRadius: "40px",
            borderBottomRightRadius: "40px",
          }}
        >
          <div
            style={{
              backgroundImage: `url(${bulkMealsHeroPattern})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
              backgroundRepeat: "no-repeat",
              width: "100%",
              height: "100%",
            }}
          />
        </div>
        {/* Header with Back Button */}
        <div className="sticky top-0 z-50">
          <div className="px-4 pt-12 pb-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-white hover:bg-white/20"
              onClick={() => navigate("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
        {/* Loading Skeleton Content */}
        <div className="relative z-10 px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-6">
            <button className="flex items-center gap-2" onClick={() => navigate("/location")}>
              <MapPin className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-[18px]" style={{ fontFamily: "Sweet Sans Pro" }}>
                {locationLabel}
              </span>
            </button>
          </div>
          {/* Service Tabs Skeleton */}
          <div className="grid grid-cols-4 gap-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-[10px] bg-white/80 animate-pulse"
              />
            ))}
          </div>
        </div>
        {/* Main Content Skeleton */}
        <div className="relative z-10 px-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {/* Search Bar Skeleton */}
            <div className="h-12 bg-gray-200 rounded-full animate-pulse mb-6" />
            {/* Category Pills Skeleton */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-10 w-24 bg-gray-200 rounded-full animate-pulse flex-shrink-0"
                />
              ))}
            </div>
            {/* Dish Grid Skeleton */}
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-gray-100 animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageWithLoader>
    <div className="min-h-screen pb-24 relative">
      {/* Blue Geometric Background Header */}
      <div
        className="absolute top-0 left-0 right-0 z-0 overflow-hidden"
        style={{
          height: "350px",
          borderBottomLeftRadius: "40px",
          borderBottomRightRadius: "40px",
        }}
      >
        <div
          style={{
            backgroundImage: `url(${bulkMealsHeroPattern})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            width: "100%",
            height: "100%",
          }}
        />
      </div>
      {/* Sticky Back Button Header - Matches CateringPage exactly */}
      <div 
        className="sticky top-0 z-50 transition-all duration-200"
        style={{
          backgroundColor: scrollY > 50 ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
          backdropFilter: scrollY > 50 ? 'blur(8px)' : 'none',
          boxShadow: scrollY > 50 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        <div className="px-4 pt-12 pb-3">
          <Button
            variant="ghost"
            size="sm"
            className={scrollY > 50 ? "text-[#06352A] hover:text-[#06352A] hover:bg-gray-100" : "text-white hover:text-white hover:bg-white/20"}
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Header Section with Location */}
      <div className="relative z-10 px-4 pt-4 pb-6">
        {/* Location and AI Menu Planner */}
        <div className="flex items-center justify-between mb-6">
          <button className="flex items-center gap-2" onClick={() => navigate("/location")}>
            <MapPin className="w-5 h-5 text-white" />
            <span className="text-white font-semibold text-[18px]" style={{ fontFamily: "Sweet Sans Pro" }}>
              {locationLabel}
            </span>
          </button>
          <button
            onClick={() => navigate("/concierge")}
            data-testid="button-ai-menu-planner"
            className="flex items-center justify-center px-3 py-2 rounded-[10px] shadow-md hover:opacity-90 transition-opacity"
            style={{
              background: "linear-gradient(135deg, #06352A 0%, #1A9952 100%)",
              fontFamily: "Sweet Sans Pro",
              fontSize: "12px",
              fontWeight: 500,
              color: "#F5E9DB",
              height: "40px",
            }}
          >
            AI Menu Planner
          </button>
        </div>

        {/* Service Navigation Tabs */}
        <div className={onNavigate ? "grid grid-cols-2 gap-3 max-w-xs mx-auto" : "grid grid-cols-4 gap-2"}>
          <button
            onClick={() => navigate("/bulk-meals")}
            data-testid="service-tab-bulk-meals"
            className="flex flex-col items-center justify-center p-3 transition-all hover-elevate active-elevate-2 aspect-square"
            style={{
              borderRadius: "10px",
              backgroundColor: selectedService === "bulk-meals" ? "#06352A" : "#FFFFFF",
              color: selectedService === "bulk-meals" ? "#F5E9DB" : "#06352A",
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
            onClick={() => navigate("/mealbox")}
            data-testid="service-tab-mealbox"
            className="flex flex-col items-center justify-center p-3 transition-all hover-elevate active-elevate-2 aspect-square"
            style={{
              borderRadius: "10px",
              backgroundColor: selectedService === "mealbox" ? "#06352A" : "#FFFFFF",
              color: selectedService === "mealbox" ? "#F5E9DB" : "#06352A",
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

          {!onNavigate && (
            <>
              <button
                onClick={() => navigate("/catering")}
                data-testid="service-tab-catering"
                className="flex flex-col items-center justify-center p-3 transition-all hover-elevate active-elevate-2 aspect-square"
                style={{
                  borderRadius: "10px",
                  backgroundColor: selectedService === "catering" ? "#06352A" : "#FFFFFF",
                  color: selectedService === "catering" ? "#F5E9DB" : "#06352A",
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
                onClick={() => navigate("/corporate")}
                data-testid="service-tab-corporate"
                className="flex flex-col items-center justify-center p-3 transition-all hover-elevate active-elevate-2 aspect-square"
                style={{
                  borderRadius: "10px",
                  backgroundColor: selectedService === "corporate" ? "#06352A" : "#FFFFFF",
                  color: selectedService === "corporate" ? "#F5E9DB" : "#06352A",
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
            </>
          )}
        </div>
      </div>
      {/* Sticky Search Bar and Meal Category Container - Stacks below back button */}
      <div
        className="sticky z-40 px-4 pb-2 pt-3 transition-all duration-200"
        style={{
          top: '76px',
          backgroundColor: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
      >
        {/* Search Bar - Clickable trigger for overlay */}
        <div className="mb-3">
          <div 
            className="relative cursor-pointer"
            onClick={() => { handleInteraction(); setSearchOverlayOpen(true); }}
            data-testid="button-open-search"
          >
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <div
              className={`w-full pl-12 pr-10 py-3 bg-white text-base border border-gray-200 ${searchQuery ? 'text-gray-800' : 'text-gray-400'}`}
              style={{ fontFamily: "Sweet Sans Pro", borderRadius: "10px" }}
            >
              {searchQuery || "Search for dishes..."}
            </div>
            {searchQuery && (
              <button 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                onClick={(e) => { e.stopPropagation(); setSearchQuery(""); }}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
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
            onClick={() => { handleInteraction(); setSelectedMealCategory("lunch-dinner"); }}
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
            onClick={() => { handleInteraction(); setSelectedMealCategory("tiffins"); }}
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
            onClick={() => { handleInteraction(); setSelectedMealCategory("hi-tea"); }}
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

        {/* Filters & Sort - Single Row - Inside sticky container */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pt-3 pb-2">
          <button
            onClick={() => { handleInteraction(); setDietaryMode('all'); }}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all flex-shrink-0",
              dietaryMode === 'all'
                ? "bg-[#06352A] text-white"
                : "bg-gray-100 text-gray-600"
            )}
            style={{ fontFamily: "Sweet Sans Pro" }}
            data-testid="filter-dietary-all"
          >
            <Sparkles className="w-2.5 h-2.5" />
            All
          </button>
          <button
            onClick={() => { handleInteraction(); setDietaryMode('veg'); }}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all flex-shrink-0",
              dietaryMode === 'veg'
                ? "bg-[#1A9952] text-white"
                : "bg-gray-100 text-gray-600"
            )}
            style={{ fontFamily: "Sweet Sans Pro" }}
            data-testid="filter-dietary-veg"
          >
            <Leaf className="w-2.5 h-2.5" />
            Veg
          </button>
          <button
            onClick={() => { handleInteraction(); setDietaryMode('egg'); }}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all flex-shrink-0",
              dietaryMode === 'egg'
                ? "bg-[#F59E0B] text-white"
                : "bg-gray-100 text-gray-600"
            )}
            style={{ fontFamily: "Sweet Sans Pro" }}
            data-testid="filter-dietary-egg"
          >
            <Egg className="w-2.5 h-2.5" />
            Egg
          </button>
          <button
            onClick={() => { handleInteraction(); setDietaryMode('non-veg'); }}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all flex-shrink-0",
              dietaryMode === 'non-veg'
                ? "bg-[#DC2626] text-white"
                : "bg-gray-100 text-gray-600"
            )}
            style={{ fontFamily: "Sweet Sans Pro" }}
            data-testid="filter-dietary-nonveg"
          >
            <Drumstick className="w-2.5 h-2.5" />
            Non-Veg
          </button>

          {/* Sort Dropdown */}
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as typeof sortOption)}>
            <SelectTrigger
              className="w-auto h-6 px-2 text-[10px] bg-white border-gray-200 rounded-full gap-0.5 flex-shrink-0"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="select-sort"
            >
              <ArrowUpDown className="w-2.5 h-2.5" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-low">Price: Low → High</SelectItem>
              <SelectItem value="price-high">Price: High → Low</SelectItem>
              <SelectItem value="name-az">Name: A → Z</SelectItem>
              <SelectItem value="name-za">Name: Z → A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dish Type Categories (65's, Biryani, Breads, etc.) - Inside sticky container */}
        {dishTypes.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pt-2">
            {dishTypes.map((dishType) => (
              <button
                key={dishType}
                onClick={() => { handleInteraction(); setSelectedDishType(dishType); }}
                className={cn(
                  "flex items-center px-3 py-1.5 border transition-all flex-shrink-0",
                  selectedDishType === dishType
                    ? "border-[#1A9952] bg-white shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
                style={{ borderRadius: '10px' }}
                data-testid={`tab-dishtype-${dishType.toLowerCase()}`}
              >
                <span className={cn(
                  "text-xs font-semibold whitespace-nowrap",
                  selectedDishType === dishType ? "text-primary" : "text-foreground"
                )}>
                  {dishType}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Content below sticky header */}
      <div className="relative z-10 px-4" style={{ marginTop: "0px", paddingTop: "0px" }}>

        {/* Dish Selection Section */}
        <div className="space-y-2">
          {/* CategoryPage-style Layout */}
          <div className="flex gap-0 flex-1 w-full max-w-full">
            {/* Left Sidebar - Category Filters (Starters, Sides, Mains, etc.) - Sticky with internal scroll */}
            <aside className="w-20 md:w-24 border-r bg-card/50 backdrop-blur-sm flex-shrink-0 sticky self-start" style={{ top: '284px', maxHeight: 'calc(100vh - 284px)', overflowY: 'auto' }}>
              <div className="flex flex-col py-3 pb-32">
                {/* Always show "All" option */}
                <button
                  onClick={() => { handleInteraction(); setSelectedCategory('all'); setSelectedDishType('all'); }}
                  className={cn(
                    "flex flex-col items-center gap-2 py-4 px-2 transition-all relative",
                    selectedCategory === 'all'
                      ? "bg-primary/10 before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1.5 before:bg-primary before:rounded-r"
                      : "hover-elevate"
                  )}
                  data-testid="filter-category-all"
                >
                  <div className={cn(
                    "relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center",
                    selectedCategory === 'all'
                      ? "border-primary shadow-lg scale-105 bg-primary/20"
                      : "border-border bg-card"
                  )}>
                    <LayoutGrid className={cn(
                      "w-8 h-8 md:w-10 md:h-10",
                      selectedCategory === 'all' ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="text-center w-full px-1">
                    <span className={cn(
                      "text-xs md:text-sm font-semibold block line-clamp-1 leading-tight",
                      selectedCategory === 'all' ? "text-primary" : "text-foreground"
                    )}>
                      All
                    </span>
                  </div>
                </button>

                {/* Show category options (Starters, Sides, Mains, etc.) based on meal_type */}
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { handleInteraction(); setSelectedCategory(cat.id); setSelectedDishType('all'); }}
                    className={cn(
                      "flex flex-col items-center gap-2 py-4 px-2 transition-all relative",
                      selectedCategory === cat.id
                        ? "bg-primary/10 before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1.5 before:bg-primary before:rounded-r"
                        : "hover-elevate"
                    )}
                    data-testid={`filter-category-${cat.id}`}
                  >
                    <div className={cn(
                      "relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 transition-all",
                      selectedCategory === cat.id
                        ? "border-primary shadow-lg scale-105"
                        : "border-border"
                    )}>
                      <img
                        src={getCategoryImageUrl(cat.id)}
                        alt={cat.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      {selectedCategory === cat.id && (
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent pointer-events-none" />
                      )}
                    </div>
                    <div className="text-center w-full px-1">
                      <span className={cn(
                        "text-xs md:text-sm font-semibold block line-clamp-2 leading-tight",
                        selectedCategory === cat.id ? "text-primary" : "text-foreground"
                      )}>
                        {cat.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            {/* Right Content - Dishes Grid */}
            <div className="flex-1 px-3 md:px-4 py-4 md:py-6 min-w-0 overflow-y-auto overflow-x-hidden pb-20 md:pb-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold font-serif" data-testid="text-section-title">
                  {categories.find(c => c.id === selectedCategory)?.name || 'All Categories'}
                </h2>
              </div>

              {isLoadingDishes ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="overflow-hidden rounded-xl bg-white shadow-sm animate-pulse">
                      <div className="h-40 md:h-48 bg-gray-200" />
                      <div className="p-3 md:p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="flex items-center justify-between pt-2">
                          <div className="h-5 bg-gray-200 rounded w-16" />
                          <div className="h-8 bg-gray-200 rounded w-20" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAndSortedDishes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No dishes match the selected filters</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredAndSortedDishes.map((dish) => {
                    const dishId = parseInt(dish.id.replace('D-', '')) || 0;
                    const dishItem = {
                      id: dishId,
                      name: dish.name,
                      price: parseFloat(dish.price as string),
                      rating: 4.5,
                      reviewCount: 0,
                      category: dish.dishType?.toLowerCase() || 'all',
                      type: (dish.dietaryType?.toLowerCase() || 'veg') as 'veg' | 'non-veg' | 'egg',
                      image: dish.imageUrl ? getSupabaseImageUrl(dish.imageUrl) : undefined,
                    };

                    return (
                      <Card
                        key={dish.id}
                        className="overflow-hidden hover-elevate group"
                        data-testid={`card-dish-${dish.id}`}
                      >
                        <div
                          className="relative h-40 md:h-48 overflow-hidden cursor-pointer"
                          onClick={() => { handleInteraction(); openDishDetail(dish); }}
                          data-testid={`image-dish-${dish.id}`}
                        >
                          <LazyImage
                            src={getDishImage(dish.name, dish.imageUrl || undefined, dish)}
                            alt={dish.name}
                            containerClassName="w-full h-full"
                            className="transition-transform duration-500 group-hover:scale-110"
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
                          <h3 className="font-bold text-sm md:text-base mb-3" data-testid={`text-dish-name-${dish.id}`}>
                            {dish.name}
                          </h3>
                          <div className="flex flex-col gap-1 mb-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-primary font-bold text-lg" data-testid={`text-dish-price-${dish.id}`}>
                                ₹{parseFloat(dish.price as string).toFixed(0)}
                              </span>
                              <Input
                                type="number"
                                min="5"
                                placeholder=""
                                value={quantities[dishId] || ''}
                                onChange={(e) => {
                                  handleInteraction();
                                  const val = e.target.value;
                                  const numVal = parseInt(val) || 0;
                                  setQuantities(prev => ({ ...prev, [dishId]: val }));
                                  
                                  // If item is in cart and quantity goes below 5, show error and remove from cart
                                  if (val && numVal < 5) {
                                    setQuantityErrors(prev => ({ ...prev, [dishId]: "accepts only from 5" }));
                                    if (addedItems.has(dishId)) {
                                      handleRemoveFromCart(dishId);
                                      toast({
                                        title: "Item Removed",
                                        description: "accepts only from 5",
                                        variant: "destructive",
                                      });
                                    }
                                  } else if (numVal >= 5) {
                                    // Clear error when valid quantity
                                    setQuantityErrors(prev => ({ ...prev, [dishId]: '' }));
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className={`w-[60px] h-7 text-center text-xs px-2 ${quantityErrors[dishId] ? 'border-red-500' : 'border-gray-300'}`}
                                style={{ fontFamily: "Sweet Sans Pro" }}
                                data-testid={`input-quantity-${dishId}`}
                              />
                            </div>
                            {quantityErrors[dishId] && (
                              <span className="text-[10px] text-red-500 text-right" style={{ fontFamily: "Sweet Sans Pro" }}>
                                {quantityErrors[dishId]}
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInteraction();
                              if (addedItems.has(dishId)) {
                                handleRemoveFromCart(dishId);
                              } else {
                                handleAddToCart(dishItem);
                              }
                            }}
                            variant={addedItems.has(dishId) ? "secondary" : "default"}
                            className="w-full rounded-full px-4"
                            data-testid={`button-add-${dishId}`}
                          >
                            {addedItems.has(dishId) ? "Added" : "Add"}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
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
        <DrawerContent className="max-h-[85vh] pt-safe">
          <div className="mx-auto w-full max-w-2xl pt-6">
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
                  <LazyImage
                    src={getDishImage(detailDish.name, detailDish.imageUrl || undefined, detailDish)}
                    alt={detailDish.name}
                    containerClassName="w-full h-full"
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

              {/* Price, Quantity & Add Button */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Price</p>
                  <p className="text-3xl font-bold text-primary">
                    ₹{detailDish ? parseFloat(detailDish.price as string).toFixed(0) : '0'}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder=""
                        value={detailDish ? (quantities[parseInt(detailDish.id.replace('D-', '')) || 0] || '') : ''}
                        onChange={(e) => {
                          if (!detailDish) return;
                          const value = e.target.value;
                          const numVal = parseInt(value) || 0;
                          const dishId = parseInt(detailDish.id.replace('D-', '')) || 0;
                          setQuantities(prev => ({ ...prev, [dishId]: value }));
                          
                          // If item is in cart and quantity goes below 5, show error and remove from cart
                          if (value && numVal < 5) {
                            setQuantityErrors(prev => ({ ...prev, [dishId]: "accepts only from 5" }));
                            if (addedItems.has(dishId)) {
                              handleRemoveFromCart(dishId);
                              toast({
                                title: "Item Removed",
                                description: "accepts only from 5",
                                variant: "destructive",
                              });
                            }
                          } else if (numVal >= 5) {
                            // Clear error when valid quantity
                            setQuantityErrors(prev => ({ ...prev, [dishId]: '' }));
                          }
                        }}
                        className={`w-20 h-10 text-center ${detailDish && quantityErrors[parseInt(detailDish.id.replace('D-', '')) || 0] ? 'border-red-500' : ''}`}
                        min="5"
                      />
                    </div>
                    <Button
                      size="lg"
                      onClick={() => {
                        if (!detailDish) return;
                        handleInteraction();
                        const dishId = parseInt(detailDish.id.replace('D-', '')) || 0;
                        const dishItem = {
                          id: dishId,
                          name: detailDish.name,
                          price: parseFloat(detailDish.price as string),
                          rating: 4.5,
                          reviewCount: 0,
                          category: detailDish.dishType?.toLowerCase() || 'all',
                          type: (detailDish.dietaryType?.toLowerCase() || 'veg') as 'veg' | 'non-veg' | 'egg',
                          image: detailDish.imageUrl ? getSupabaseImageUrl(detailDish.imageUrl) : undefined,
                        };
                        if (addedItems.has(dishId)) {
                          handleRemoveFromCart(dishId);
                        } else {
                          handleAddToCart(dishItem);
                        }
                        setDishDetailOpen(false);
                      }}
                      variant={detailDish && addedItems.has(parseInt(detailDish.id.replace('D-', '')) || 0) ? "secondary" : "default"}
                      className="rounded-full px-8 min-w-[140px]"
                      data-testid="button-add-from-detail"
                    >
                      {detailDish && addedItems.has(parseInt(detailDish.id.replace('D-', '')) || 0) ? "Added ✓" : "Add to Cart"}
                    </Button>
                  </div>
                  {detailDish && quantityErrors[parseInt(detailDish.id.replace('D-', '')) || 0] && (
                    <span className="text-xs text-red-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                      {quantityErrors[parseInt(detailDish.id.replace('D-', '')) || 0]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Floating Cart Bar - Green bar above bottom nav */}
      {cart.length > 0 && (
        <div
          className="fixed bottom-[90px] left-0 right-0 z-40 px-4"
        >
          <button
            onClick={() => navigate("/bulk-meals-cart")}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
            style={{
              backgroundColor: '#1A9952',
              boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.15)'
            }}
            data-testid="button-floating-cart"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: '#F5E9DB', color: '#1A9952' }}
              >
                {cart.length}
              </div>
              <span className="text-white font-semibold" style={{ fontFamily: "Sweet Sans Pro" }}>
                Item added to cart
              </span>
            </div>
            <div className="flex items-center gap-1 text-white font-semibold" style={{ fontFamily: "Sweet Sans Pro" }}>
              <span>View Cart</span>
              <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
            </div>
          </button>
        </div>
      )}

      {/* Floating Call Button */}
      <a
        href="tel:+917026644556"
        className={`fixed right-4 z-50 w-14 h-14 bg-[#1A9952] rounded-full flex items-center justify-center shadow-lg hover:bg-[#158043] transition-colors ${
          cart.length > 0 ? 'bottom-40' : 'bottom-24'
        }`}
        data-testid="button-call"
        aria-label="Call us"
      >
        <Phone className="w-6 h-6 text-white" />
      </a>
      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
      
      {/* Search Overlay */}
      <SearchOverlay
        isOpen={searchOverlayOpen}
        onClose={() => setSearchOverlayOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={(query) => {
          setSearchQuery(query);
          setSearchOverlayOpen(false);
        }}
        placeholder="Search for dishes..."
      />
    </div>
    </PageWithLoader>
  );
}
