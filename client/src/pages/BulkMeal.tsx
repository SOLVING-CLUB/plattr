import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
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
import { useQuery } from "@tanstack/react-query";
import type { Dish } from "@shared/schema";
import { ArrowLeft, Building2, Users, Calendar, Mail, Phone, MapPin, ShoppingCart, UtensilsCrossed, Package, Truck, Clock, X, ChevronDown, Search, Mic, ArrowUpDown, SlidersHorizontal, Star, Utensils } from "lucide-react";
import FloatingNav from "@/pages/FloatingNav";
    import { useCart } from "@/context/CartContex";
    import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import bulkMealsHeroPattern from "@assets/Hero Pattern - Bulk Meals_1763923537679.png";
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

type ServiceType = "bulk-meals" | "mealbox" | "catering" | "corporate";
type NavigateFn = (path: string, options?: { replace?: boolean }) => void;

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
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [selectedMealCategory, setSelectedMealCategory] = useState<string>("hi-tea");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("grilled");
  const [isStuck, setIsStuck] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const hasInteractedRef = useRef(false);
  
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleInteraction = () => {
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      enterCategory("bulk-meals");
    }
  };

  const handleAddToCart = (item: typeof mockFoodItems[0]) => {
    handleInteraction();
    const quantity = quantities[item.id] !== undefined ? quantities[item.id] : 5;
    
    if (quantity < 5) {
      toast({
        title: "Minimum Order Required",
        description: "Minimum 5 serves per dish required.",
        variant: "destructive",
      });
      return;
    }

    addToCart("bulk-meals", {
      id: item.id,
      name: item.name,
      price: item.price,
      quantity
    });

    setQuantities(prev => ({ ...prev, [item.id]: 5 }));
  };

  const handleRemoveFromCart = (itemId: number) => {
    removeFromCart(itemId);
  };
  
  // Detect when sticky element becomes stuck
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is not visible, sticky element is stuck
        setIsStuck(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);
  
  // Map meal category to meal_type filter for Supabase
  const getMealTypeFilter = (category: string): string => {
    const mapping: Record<string, string> = {
      "hi-tea": "snacks",
      "breakfast": "breakfast",
      "lunch": "lunch-dinner",
      "dinner": "lunch-dinner",
    };
    return mapping[category] || "snacks";
  };

  // Fetch dishes from Supabase based on selected meal category
  // Use the same query approach as CategoryPage for consistency
  const { data: dishes = [], isLoading: isLoadingDishes, error: dishesError } = useQuery<Dish[]>({
    queryKey: ['/api/dishes', getMealTypeFilter(selectedMealCategory), 'all'],
    queryFn: async ({ queryKey }) => {
      // Use the queryClient's getQueryFn which handles Supabase mapping
      const { getQueryFn } = await import('@/lib/queryClient');
      const queryFn = getQueryFn<Dish[]>({ on401: 'throw' });
      return queryFn({ queryKey });
    },
  });

  // Log for debugging
  useEffect(() => {
    if (dishesError) {
      console.error('Error fetching dishes:', dishesError);
    }
    if (dishes && dishes.length > 0) {
      console.log('✅ Fetched dishes:', dishes.length, 'items');
    } else if (!isLoadingDishes) {
      console.warn('⚠️ No dishes found for meal category:', selectedMealCategory);
    }
  }, [dishes, dishesError, isLoadingDishes, selectedMealCategory]);

  // Transform dishes to match the expected format
  const foodItems = dishes.map((dish) => ({
    id: parseInt(dish.id) || 0, // Convert to number for compatibility
    name: dish.name,
    price: parseFloat(dish.price),
    rating: 4.5, // Default rating (can be added to schema later)
    reviewCount: 0, // Default review count (can be added to schema later)
    category: dish.dishType?.toLowerCase() || 'all',
    type: (dish.dietaryType?.toLowerCase() || 'veg') as 'veg' | 'non-veg' | 'egg',
    image: dish.imageUrl,
  }));

  // Filter food items based on selected category and subcategory
  const filteredFoodItems = foodItems.filter((item) => {
    // Category filter
    if (selectedCategory !== 'all') {
      const categoryMap: Record<string, string> = {
        'appetizers': 'appetizers',
        'rice': 'rice',
        'entree': 'entree',
        'roti': 'roti',
        'biryani': 'biryani',
        'dessert': 'dessert',
      };
      if (item.category !== categoryMap[selectedCategory]) {
        return false;
      }
    }

    // Subcategory filter (grilled, fried, stuffed) - this would need to be in dish metadata
    // For now, we'll skip this filter or implement it based on dish_type
    
    return true;
  });
  
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

    // Navigate to thank you page
    navigate("/bulk-meals-thank-you");
  };

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Blue Geometric Background Header */}
      <div
        className="absolute top-0 left-0 right-0 z-0"
        style={{
          backgroundImage: `url(${bulkMealsHeroPattern})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          height: "350px",
        }}
      />
      {/* Header Section with Location and Cart */}
      <div className="relative z-10 px-4 pt-4 pb-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-white hover:text-white hover:bg-white/20"
          onClick={() => navigate("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Location and Cart */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-lg" style={{ fontFamily: "Sweet Sans Pro" }}>
              Bengaluru, KA
            </span>
          </div>
          <button
            className="p-2 rounded-full hover:bg-white/20 transition-colors relative"
            onClick={() => toast({ title: "Cart", description: "Cart coming soon!" })}
            data-testid="button-cart"
          >
            <ShoppingCart className="w-6 h-6 text-white" />
            {cart.length > 0 && (
              <div 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  backgroundColor: "#1A9952",
                  color: "white",
                  fontFamily: "Sweet Sans Pro"
                }}
              >
                {cart.length}
              </div>
            )}
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
      {/* Sentinel element for sticky detection */}
      <div ref={sentinelRef} style={{ height: "1px" }} />
      {/* Sticky Search Bar and Meal Category Container - Outside header for proper sticky behavior */}
      <div 
        className="sticky top-0 z-40 px-4 pb-2 pt-4 transition-all duration-200" 
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
              onChange={(e) => { handleInteraction(); setSearchQuery(e.target.value); }}
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
      </div>
      {/* Content below green background */}
      <div className="relative z-10 px-4" style={{ marginTop: "16px", paddingTop: "0px" }}>

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
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="font-medium text-[12px]" style={{ fontFamily: "Sweet Sans Pro" }}>Sort</span>
              </button>

              <button 
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md hover-elevate active-elevate-2 bg-white"
                data-testid="button-filter"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="font-medium text-[12px]" style={{ fontFamily: "Sweet Sans Pro" }}>Filter</span>
              </button>
            </div>
          </div>

          {/* Category Sidebar + Food Grid Container */}
          <div className="flex gap-4">
            {/* Left Category Sidebar */}
            <div className="sticky flex flex-col gap-2 self-start" style={{ width: "80px", top: "145px" }}>
              <button
                onClick={() => { handleInteraction(); setSelectedCategory("all"); }}
                className="flex flex-col items-center py-1.5 px-1 rounded-lg transition-all"
                style={{ backgroundColor: selectedCategory === "all" ? "#1A9952" : "transparent" }}
                data-testid="category-all"
              >
                <div className="w-9 h-9 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                  <span className="text-base">🍽️</span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-medium text-center leading-tight mt-0.5" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "all" ? "white" : "#06352A" }}>
                  All
                </span>
              </button>

              <button
                onClick={() => { handleInteraction(); setSelectedCategory("appetizers"); }}
                className="flex flex-col items-center py-1.5 px-1 rounded-lg transition-all"
                style={{ backgroundColor: selectedCategory === "appetizers" ? "#1A9952" : "transparent" }}
                data-testid="category-appetizers"
              >
                <div className="w-9 h-9 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                  <span className="text-base">🥗</span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-medium text-center leading-tight mt-0.5" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "appetizers" ? "white" : "#06352A" }}>
                  Appetizers
                </span>
              </button>

              <button
                onClick={() => { handleInteraction(); setSelectedCategory("rice"); }}
                className="flex flex-col items-center py-1.5 px-1 rounded-lg transition-all"
                style={{ backgroundColor: selectedCategory === "rice" ? "#1A9952" : "transparent" }}
                data-testid="category-rice"
              >
                <div className="w-9 h-9 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                  <span className="text-base">🍚</span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-medium text-center leading-tight mt-0.5" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "rice" ? "white" : "#06352A" }}>
                  Rice
                </span>
              </button>

              <button
                onClick={() => { handleInteraction(); setSelectedCategory("entree"); }}
                className="flex flex-col items-center py-1.5 px-1 rounded-lg transition-all"
                style={{ backgroundColor: selectedCategory === "entree" ? "#1A9952" : "transparent" }}
                data-testid="category-entree"
              >
                <div className="w-9 h-9 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                  <span className="text-base">🍛</span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-medium text-center leading-tight mt-0.5" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "entree" ? "white" : "#06352A" }}>
                  Entree
                </span>
              </button>

              <button
                onClick={() => { handleInteraction(); setSelectedCategory("roti"); }}
                className="flex flex-col items-center py-1.5 px-1 rounded-lg transition-all"
                style={{ backgroundColor: selectedCategory === "roti" ? "#1A9952" : "transparent" }}
                data-testid="category-roti"
              >
                <div className="w-9 h-9 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                  <span className="text-base">🫓</span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-medium text-center leading-tight mt-0.5" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "roti" ? "white" : "#06352A" }}>
                  Roti
                </span>
              </button>

              <button
                onClick={() => { handleInteraction(); setSelectedCategory("biryani"); }}
                className="flex flex-col items-center py-1.5 px-1 rounded-lg transition-all"
                style={{ backgroundColor: selectedCategory === "biryani" ? "#1A9952" : "transparent" }}
                data-testid="category-biryani"
              >
                <div className="w-9 h-9 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                  <span className="text-base">🍛</span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-medium text-center leading-tight mt-0.5" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "biryani" ? "white" : "#06352A" }}>
                  Biryani
                </span>
              </button>

              <button
                onClick={() => { handleInteraction(); setSelectedCategory("dessert"); }}
                className="flex flex-col items-center py-1.5 px-1 rounded-lg transition-all"
                style={{ backgroundColor: selectedCategory === "dessert" ? "#1A9952" : "transparent" }}
                data-testid="category-dessert"
              >
                <div className="w-9 h-9 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                  <span className="text-base">🍰</span>
                </div>
                <span className="text-[8px] sm:text-[9px] font-medium text-center leading-tight mt-0.5" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "dessert" ? "white" : "#06352A" }}>
                  Dessert
                </span>
              </button>
            </div>

            {/* Right Content Area */}
            <div className="flex-1">
              {/* Subcategory Options */}
              <div className="sticky top-[130px] z-30 bg-white pt-4 pb-2 mt-2 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => { handleInteraction(); setSelectedSubcategory("grilled"); }}
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all whitespace-nowrap flex-shrink-0"
                  style={{ 
                    backgroundColor: selectedSubcategory === "grilled" ? "#1A9952" : "white",
                    border: "1px solid #E5E7EB"
                  }}
                  data-testid="subcategory-grilled"
                >
                  <img src={grilledIcon} alt="Grilled" className="w-6 h-6 sm:w-7 sm:h-7 object-cover rounded-full flex-shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-medium" style={{ 
                    fontFamily: "Sweet Sans Pro",
                    color: selectedSubcategory === "grilled" ? "white" : "#06352A"
                  }}>
                    Grilled
                  </span>
                </button>

                <button
                  onClick={() => { handleInteraction(); setSelectedSubcategory("fried"); }}
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all whitespace-nowrap flex-shrink-0"
                  style={{ 
                    backgroundColor: selectedSubcategory === "fried" ? "#1A9952" : "white",
                    border: "1px solid #E5E7EB"
                  }}
                  data-testid="subcategory-fried"
                >
                  <img src={friedIcon} alt="Fried" className="w-6 h-6 sm:w-7 sm:h-7 object-cover rounded-full flex-shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-medium" style={{ 
                    fontFamily: "Sweet Sans Pro",
                    color: selectedSubcategory === "fried" ? "white" : "#06352A"
                  }}>
                    Fried
                  </span>
                </button>

                <button
                  onClick={() => { handleInteraction(); setSelectedSubcategory("stuffed"); }}
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all whitespace-nowrap flex-shrink-0"
                  style={{ 
                    backgroundColor: selectedSubcategory === "stuffed" ? "#1A9952" : "white",
                    border: "1px solid #E5E7EB"
                  }}
                  data-testid="subcategory-stuffed"
                >
                  <img src={stuffedIcon} alt="Stuffed" className="w-6 h-6 sm:w-7 sm:h-7 object-cover rounded-full flex-shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-medium" style={{ 
                    fontFamily: "Sweet Sans Pro",
                    color: selectedSubcategory === "stuffed" ? "white" : "#06352A"
                  }}>
                    Stuffed
                  </span>
                </button>
              </div>
              </div>

              {/* Food Items Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pb-20">
                {isLoadingDishes ? (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>Loading dishes...</p>
                  </div>
                ) : filteredFoodItems.length === 0 ? (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>No dishes available for this category.</p>
                  </div>
                ) : (
                  filteredFoodItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Food Image Placeholder */}
                    <div className="relative" style={{ paddingTop: "100%" }}>
                      <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                        <Utensils className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                      </div>
                    </div>
                    
                    {/* Food Details */}
                    <div className="p-2 sm:p-3">
                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-[#1A9952] text-[#1A9952]" />
                        <span className="text-[10px] sm:text-xs font-semibold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                          {item.rating}({item.reviewCount})
                        </span>
                      </div>
                      
                      {/* Name */}
                      <h3 className="font-semibold mb-1.5 sm:mb-2 text-[10px] sm:text-[11px] md:text-xs line-clamp-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        {item.name}
                      </h3>
                      
                      {/* Price and Quantity */}
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm md:text-base font-bold flex-shrink-0" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                            ₹{item.price}
                          </span>
                          <span className="text-[8px] sm:text-[9px] text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                            / person
                          </span>
                        </div>
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            list={`quantity-options-${item.id}`}
                            value={quantities[item.id] !== undefined ? quantities[item.id] : 5}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "") {
                                setQuantities(prev => ({ ...prev, [item.id]: 0 }));
                              } else {
                                const numValue = parseInt(value);
                                if (!isNaN(numValue)) {
                                  setQuantities(prev => ({ ...prev, [item.id]: numValue }));
                                }
                              }
                            }}
                            className="w-[60px] sm:w-[70px] h-7 text-[10px] sm:text-xs border-gray-300 text-center px-2"
                            style={{ fontFamily: "Sweet Sans Pro" }}
                            data-testid={`input-quantity-${item.id}`}
                            min="5"
                          />
                          <datalist id={`quantity-options-${item.id}`}>
                            {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((qty) => (
                              <option key={qty} value={qty} />
                            ))}
                          </datalist>
                        </div>
                      </div>
                      
                      {/* Add Button - Full Width */}
                      <Button
                        onClick={() => {
                          if (addedItems.has(item.id)) {
                            handleRemoveFromCart(item.id);
                          } else {
                            handleAddToCart(item);
                          }
                        }}
                        className="w-full px-2 sm:px-3 md:px-4 py-1 text-[10px] sm:text-xs font-semibold min-h-0 h-auto"
                        style={{ 
                          fontFamily: "Sweet Sans Pro",
                          backgroundColor: addedItems.has(item.id) ? "white" : "#1A9952",
                          color: addedItems.has(item.id) ? "#1A9952" : "white",
                          border: addedItems.has(item.id) ? "1px solid #1A9952" : "none",
                          borderRadius: "6px"
                        }}
                        data-testid={`button-add-${item.id}`}
                      >
                        {addedItems.has(item.id) ? "ADDED" : "ADD"}
                      </Button>
                    </div>
                  </div>
            ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Floating Cart Button - Shows when items are in cart and input is not focused */}
      {cart.length > 0 && !isInputFocused && createPortal(
        <div 
          className="fixed left-4 right-4 flex items-center justify-between px-4 py-3 shadow-lg"
          style={{ 
            bottom: "80px",
            backgroundColor: "#1A9952",
            borderRadius: "10px",
            zIndex: 9999
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-sm font-bold" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                {cart.length}
              </span>
            </div>
            <span className="text-white text-sm font-medium" style={{ fontFamily: "Sweet Sans Pro" }}>
              Item added to cart
            </span>
          </div>
          <Button
            onClick={() => navigate("/bulk-meals-cart")}
            className="px-4 py-1.5 text-sm font-semibold border-0 min-h-0 h-auto"
            style={{
              fontFamily: "Sweet Sans Pro",
              backgroundColor: "white",
              color: "#1A9952",
              borderRadius: "6px"
            }}
            data-testid="button-view-cart"
          >
            View Cart →
          </Button>
        </div>,
        document.body
      )}
      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
