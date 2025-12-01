import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, MapPin, ShoppingCart, Search, Mic, ArrowUpDown, SlidersHorizontal, Star, Utensils, ChevronRight, UtensilsCrossed, Package, Truck, Building2 } from "lucide-react";
import FloatingNav from "@/pages/FloatingNav";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { Dish } from "@shared/schema";
import { getSupabaseImageUrl } from "@/lib/supabase";

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

export default function Menu() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("menu");
  const [selectedMealCategory, setSelectedMealCategory] = useState<string>("hi-tea");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("grilled");
  const [isStuck, setIsStuck] = useState(false);
  
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Map meal category to meal_type filter for Supabase
  const getMealTypeFilter = (category: string): string => {
    const mapping: Record<string, string> = {
      "hi-tea": "snacks",
      "tiffins": "breakfast",
      "lunch-dinner": "lunch-dinner",
    };
    return mapping[category] || "snacks";
  };

  // Fetch dishes from Supabase based on selected meal category
  const { data: dishes = [], isLoading: isLoadingDishes, error: dishesError } = useQuery<Dish[]>({
    queryKey: ['/api/dishes', getMealTypeFilter(selectedMealCategory), 'all'],
    queryFn: async ({ queryKey }) => {
      const queryFn = getQueryFn<Dish[]>({ on401: 'throw' });
      return queryFn({ queryKey });
    },
  });

  // Transform dishes to match the expected format
  const foodItems = dishes
    .filter(dish => dish.isAvailable !== false) // Only show available dishes
    .map((dish) => ({
      id: parseInt(dish.id.replace('D-', '')) || 0, // Convert to number for compatibility
      name: dish.name,
      price: parseFloat(String(dish.price)),
      rating: 4.5, // Default rating (can be added to schema later)
      reviewCount: 0, // Default review count (can be added to schema later)
      category: dish.dishType?.toLowerCase() || 'all',
      type: (dish.dietaryType?.toLowerCase() || 'veg') as 'veg' | 'non-veg' | 'egg',
      image: dish.imageUrl ? getSupabaseImageUrl(dish.imageUrl) : undefined,
    }));

  // Filter food items based on selected category
  const filteredFoodItems = foodItems.filter((item) => {
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
    return true;
  });

  // Apply search filter
  const searchFilteredItems = searchQuery
    ? filteredFoodItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredFoodItems;
  
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
                onClick={() => setSelectedCategory("all")}
                className="flex flex-col items-center py-1.5 px-1 rounded-lg transition-all"
                style={{ backgroundColor: selectedCategory === "all" ? "#1A9952" : "transparent" }}
                data-testid="category-all"
              >
                <div className="w-9 h-9 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-orange-400" />
                </div>
                <span className="text-[8px] sm:text-[9px] font-medium text-center leading-tight mt-0.5" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "all" ? "white" : "#06352A" }}>
                  All
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory("appetizers")}
                className="flex flex-col items-center py-1.5 px-1 rounded-lg transition-all"
                style={{ backgroundColor: selectedCategory === "appetizers" ? "#1A9952" : "transparent" }}
                data-testid="category-appetizers"
              >
                <div className="w-9 h-9 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-[8px] sm:text-[9px] font-medium text-center leading-tight mt-0.5" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "appetizers" ? "white" : "#06352A" }}>
                  Appetizers
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory("rice")}
                className="flex flex-col items-center py-1.5 px-1 rounded-lg transition-all"
                style={{ backgroundColor: selectedCategory === "rice" ? "#1A9952" : "transparent" }}
                data-testid="category-rice"
              >
                <div className="w-9 h-9 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-yellow-500" />
                </div>
                <span className="text-[8px] sm:text-[9px] font-medium text-center leading-tight mt-0.5" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "rice" ? "white" : "#06352A" }}>
                  Rice
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory("entree")}
                className="flex flex-col items-center py-1.5 px-1 rounded-lg transition-all"
                style={{ backgroundColor: selectedCategory === "entree" ? "#1A9952" : "transparent" }}
                data-testid="category-entree"
              >
                <div className="w-9 h-9 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-[8px] sm:text-[9px] font-medium text-center leading-tight mt-0.5" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "entree" ? "white" : "#06352A" }}>
                  Entree
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory("roti")}
                className="flex flex-col items-center py-1.5 px-1 rounded-lg transition-all"
                style={{ backgroundColor: selectedCategory === "roti" ? "#1A9952" : "transparent" }}
                data-testid="category-roti"
              >
                <div className="w-9 h-9 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-[8px] sm:text-[9px] font-medium text-center leading-tight mt-0.5" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "roti" ? "white" : "#06352A" }}>
                  Roti
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory("biryani")}
                className="flex flex-col items-center py-1.5 px-1 rounded-lg transition-all"
                style={{ backgroundColor: selectedCategory === "biryani" ? "#1A9952" : "transparent" }}
                data-testid="category-biryani"
              >
                <div className="w-9 h-9 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-[8px] sm:text-[9px] font-medium text-center leading-tight mt-0.5" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "biryani" ? "white" : "#06352A" }}>
                  Biryani
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory("dessert")}
                className="flex flex-col items-center py-1.5 px-1 rounded-lg transition-all"
                style={{ backgroundColor: selectedCategory === "dessert" ? "#1A9952" : "transparent" }}
                data-testid="category-dessert"
              >
                <div className="w-9 h-9 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                  <Utensils className="w-4 h-4 text-pink-400" />
                </div>
                <span className="text-[8px] sm:text-[9px] font-medium text-center leading-tight mt-0.5" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "dessert" ? "white" : "#06352A" }}>
                  Dessert
                </span>
              </button>
            </div>

            {/* Right Content Area */}
            <div className="flex-1">
              {/* Subcategory Options */}
              <div className="sticky top-[120px] z-30 bg-[#FDF8F3] pt-3 pb-2 -mx-1 px-1">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedSubcategory("grilled")}
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
                  onClick={() => setSelectedSubcategory("fried")}
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
                  onClick={() => setSelectedSubcategory("stuffed")}
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

              {/* Food Items Grid - View Only (No Add Button, No Quantity) */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pb-20">
                {isLoadingDishes ? (
                  <div className="col-span-2 text-center py-8">
                    <span className="text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>Loading dishes...</span>
                  </div>
                ) : searchFilteredItems.length === 0 ? (
                  <div className="col-span-2 text-center py-8">
                    <span className="text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>No dishes found</span>
                  </div>
                ) : (
                  searchFilteredItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden" data-testid={`card-food-${item.id}`}>
                      {/* Food Image */}
                    <div className="relative" style={{ paddingTop: "100%" }}>
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                      <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                        <Utensils className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                      </div>
                        )}
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
                      
                      {/* Price Only - No Quantity, No Add Button */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm md:text-base font-bold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                            ₹{item.price}
                          </span>
                          <span className="text-[8px] sm:text-[9px] text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                            / person
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
