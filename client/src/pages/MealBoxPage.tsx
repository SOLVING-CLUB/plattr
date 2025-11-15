import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Plus,
  Minus,
  ShoppingCart,
  Package,
  Leaf,
  Drumstick,
  Info,
  MapPin,
  Search,
  Mic,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cartStorage } from "@/lib/cartStorage";
import { getSupabaseImageUrl } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";
import type { Dish } from "@shared/schema";

import masalaDosaImage from "@assets/stock_images/indian_masala_dosa_2cd2adc1.jpg";
import idliImage from "@assets/stock_images/indian_idli_sambar_s_c6bb3ca9.jpg";
import vadaImage from "@assets/stock_images/indian_vada_d82fc29e.jpg";
import biryaniImage from "@assets/stock_images/indian_biryani_dish__60e99e80.jpg";
import samosaImage from "@assets/stock_images/samosa_snacks_indian_0946aa28.jpg";
import thaliImage from "@assets/stock_images/indian_thali_meal_3a645a6d.jpg";
// Meal box images
import mealBoxYellow from "@assets/mealbox_yellow.png";
import mealBoxRed from "@assets/mealbox_red.png";

// Portion size options
interface PortionOption {
  id: string;
  label: string;
  servings: number;
  priceRange: string;
  imagePath: string;
}

const PORTION_OPTIONS: PortionOption[] = [
  {
    id: "3-portions",
    label: "3 portions",
    servings: 3,
    priceRange: "₹150-200",
    imagePath: mealBoxYellow,
  },
  {
    id: "5-portions",
    label: "5 portions",
    servings: 5,
    priceRange: "₹250-350",
    imagePath: mealBoxRed,
  },
  {
    id: "6-portions",
    label: "6 portions",
    servings: 6,
    priceRange: "₹300-400",
    imagePath: mealBoxYellow,
  },
  {
    id: "8-portions",
    label: "8 portions",
    servings: 8,
    priceRange: "₹400-550",
    imagePath: mealBoxRed,
  },
];

// Meal box template types
interface MealBoxTemplate {
  id: string;
  name: string;
  description: string;
  pricePerBox: number;
  slots: {
    category: string;
    label: string;
    quota: number;
    icon: string;
  }[];
  imageUrl: string;
}

// Available meal box templates
const MEAL_BOX_TEMPLATES: MealBoxTemplate[] = [
  {
    id: "breakfast-box",
    name: "Breakfast Box",
    description: "Start your day with a delicious South Indian breakfast",
    pricePerBox: 149,
    slots: [
      { category: "tiffins", label: "Main Item", quota: 2, icon: "🍚" },
      { category: "snacks", label: "Side", quota: 1, icon: "🥘" },
      { category: "lunch-dinner", label: "Beverage", quota: 1, icon: "☕" },
    ],
    imageUrl: masalaDosaImage,
  },
  {
    id: "lunch-box",
    name: "Lunch Box",
    description: "A complete meal with rice, curry, and more",
    pricePerBox: 189,
    slots: [
      { category: "lunch-dinner", label: "Main Course", quota: 2, icon: "🍛" },
      { category: "snacks", label: "Side Dish", quota: 2, icon: "🥗" },
      { category: "tiffins", label: "Bread", quota: 1, icon: "🫓" },
    ],
    imageUrl: thaliImage,
  },
  {
    id: "snack-box",
    name: "Snack Box",
    description: "Perfect for evening tea time or quick bites",
    pricePerBox: 129,
    slots: [
      { category: "snacks", label: "Snacks", quota: 3, icon: "🍪" },
      { category: "lunch-dinner", label: "Beverage", quota: 1, icon: "☕" },
    ],
    imageUrl: samosaImage,
  },
  {
    id: "dinner-box",
    name: "Dinner Box",
    description: "A hearty dinner to end your day right",
    pricePerBox: 199,
    slots: [
      { category: "lunch-dinner", label: "Main Course", quota: 2, icon: "🍛" },
      { category: "tiffins", label: "Bread/Rice", quota: 1, icon: "🍚" },
      { category: "snacks", label: "Starter", quota: 1, icon: "🥟" },
      { category: "lunch-dinner", label: "Dessert", quota: 1, icon: "🍮" },
    ],
    imageUrl: biryaniImage,
  },
  {
    id: "custom-box",
    name: "Custom Box",
    description: "Build your own meal box with your favorite items",
    pricePerBox: 0,
    slots: [{ category: "all", label: "Your Choice", quota: 5, icon: "🎯" }],
    imageUrl: idliImage,
  },
];

// Helper to get dish image
const getDishImage = (dish: Dish): string => {
  if (dish.imageUrl) {
    const supabaseUrl = getSupabaseImageUrl(dish.imageUrl);
    if (supabaseUrl && supabaseUrl.startsWith("http")) {
      return supabaseUrl;
    }
  }

  const name = dish.name.toLowerCase();
  if (name.includes("dosa")) return masalaDosaImage;
  if (name.includes("idli") || name.includes("idly")) return idliImage;
  if (name.includes("vada")) return vadaImage;
  if (name.includes("biryani")) return biryaniImage;
  if (name.includes("samosa")) return samosaImage;
  return thaliImage;
};

export default function MealBoxPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] =
    useState<MealBoxTemplate | null>(null);
  // Track items per slot: {[slotIndex]: {[dishId]: quantity}}
  const [selectedItems, setSelectedItems] = useState<
    Record<number, Record<string, number>>
  >({});
  const [dietaryFilter, setDietaryFilter] = useState<"all" | "veg" | "non-veg">(
    "all",
  );
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [boxQuantity, setBoxQuantity] = useState(1);
  const [activeBottomTab, setActiveBottomTab] = useState("home");
  const [selectedPortionSize, setSelectedPortionSize] = useState<string | null>(
    null,
  );

  // Fetch all dishes
  const { data: allDishes = [], isLoading } = useQuery<Dish[]>({
    queryKey: ["/api/dishes"],
  });

  // Filter dishes based on current slot and dietary preference
  const getFilteredDishes = () => {
    if (!selectedTemplate) return [];

    const currentSlot = selectedTemplate.slots[currentSlotIndex];
    let filtered = allDishes;

    // Filter by category
    if (currentSlot.category !== "all") {
      filtered = filtered.filter((dish) => {
        // Handle different category ID formats
        const dishCategory = dish.categoryId?.toLowerCase();
        const slotCategory = currentSlot.category.toLowerCase();

        // Map slot categories to actual category IDs
        if (slotCategory === "tiffins") {
          return (
            dishCategory?.includes("tiffin") ||
            dishCategory?.includes("breakfast")
          );
        } else if (slotCategory === "snacks") {
          return (
            dishCategory?.includes("snack") || dishCategory?.includes("chaat")
          );
        } else if (slotCategory === "lunch-dinner") {
          return (
            dishCategory?.includes("rice") ||
            dishCategory?.includes("bread") ||
            dishCategory?.includes("biryani") ||
            dishCategory?.includes("curry") ||
            dishCategory?.includes("lunch") ||
            dishCategory?.includes("dinner")
          );
        }
        return dishCategory === slotCategory;
      });
    }

    // Filter by dietary preference
    if (dietaryFilter !== "all") {
      filtered = filtered.filter((dish) => dish.dietaryType === dietaryFilter);
    }

    return filtered;
  };

  const filteredDishes = getFilteredDishes();

  // Calculate total selected items in current slot
  const getCurrentSlotCount = () => {
    const currentSlotItems = selectedItems[currentSlotIndex] || {};
    return Object.values(currentSlotItems).reduce(
      (sum, count) => sum + count,
      0,
    );
  };

  // Get count for a specific slot
  const getSlotCount = (slotIndex: number) => {
    const slotItems = selectedItems[slotIndex] || {};
    return Object.values(slotItems).reduce((sum, count) => sum + count, 0);
  };

  const currentSlotCount = getCurrentSlotCount();
  const currentSlot = selectedTemplate?.slots[currentSlotIndex];
  const isSlotFull = currentSlot
    ? currentSlotCount >= currentSlot.quota
    : false;

  // Handle adding item to meal box
  const handleAddItem = (dishId: string) => {
    if (isSlotFull) {
      toast({
        title: "Slot Full",
        description: `You can only add ${currentSlot?.quota} items to ${currentSlot?.label}`,
        variant: "destructive",
      });
      return;
    }

    setSelectedItems((prev) => {
      const currentSlotItems = prev[currentSlotIndex] || {};
      return {
        ...prev,
        [currentSlotIndex]: {
          ...currentSlotItems,
          [dishId]: (currentSlotItems[dishId] || 0) + 1,
        },
      };
    });
  };

  const handleRemoveItem = (dishId: string) => {
    setSelectedItems((prev) => {
      const currentSlotItems = prev[currentSlotIndex] || {};
      const newSlotItems = { ...currentSlotItems };

      if (newSlotItems[dishId] > 1) {
        newSlotItems[dishId]--;
      } else {
        delete newSlotItems[dishId];
      }

      return {
        ...prev,
        [currentSlotIndex]: newSlotItems,
      };
    });
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    // Sum all items across all slots
    const itemsPrice = Object.values(selectedItems).reduce(
      (total, slotItems) => {
        return (
          total +
          Object.entries(slotItems).reduce((sum, [dishId, quantity]) => {
            const dish = allDishes.find((d) => d.id === dishId);
            return sum + (dish ? parseFloat(dish.price) * quantity : 0);
          }, 0)
        );
      },
      0,
    );

    const basePrice =
      selectedTemplate?.id === "custom-box"
        ? 0
        : selectedTemplate?.pricePerBox || 0;
    return (basePrice + itemsPrice) * boxQuantity;
  };

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      // Flatten all items from all slots
      const itemsToAdd: Array<{
        dishId: string;
        quantity: number;
        dish: Dish | undefined;
      }> = [];

      Object.values(selectedItems).forEach((slotItems) => {
        Object.entries(slotItems).forEach(([dishId, quantity]) => {
          const dish = allDishes.find((d) => d.id === dishId);
          itemsToAdd.push({ dishId, quantity: quantity * boxQuantity, dish });
        });
      });

      const validItems = itemsToAdd.filter((item) => item.dish);

      for (const item of validItems) {
        if (item.dish) {
          await cartStorage.addItem(item.dishId, item.quantity, item.dish);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to Cart",
        description: `${boxQuantity} ${selectedTemplate?.name}(s) added to your cart`,
      });
      setLocation("/checkout");
    },
  });

  const handleAddToCart = () => {
    // Check if any items are selected across all slots
    const hasItems = Object.values(selectedItems).some(
      (slotItems) => Object.keys(slotItems).length > 0,
    );

    if (!hasItems) {
      toast({
        title: "Empty Box",
        description: "Please add at least one item to your meal box",
        variant: "destructive",
      });
      return;
    }

    addToCartMutation.mutate();
  };

  // Handle bottom nav tab changes
  const handleBottomNavChange = (tab: string) => {
    setActiveBottomTab(tab);
    if (tab === "home") {
      setLocation("/");
    } else if (tab === "categories") {
      setLocation("/categories/tiffins");
    } else if (tab === "profile") {
      setLocation("/profile");
    }
  };

  // Handle portion size selection
  const handlePortionSelect = (portionId: string) => {
    const portion = PORTION_OPTIONS.find((p) => p.id === portionId);
    if (portion) {
      setSelectedPortionSize(portionId);
      setBoxQuantity(portion.servings);
      // Navigate to builder page with portion info
      setLocation("/mealbox/builder");
    }
  };

  // Template selection view
  if (!selectedTemplate) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top Header with Location */}
        <div className="bg-background border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-foreground" />
              <span
                className="text-sm font-semibold"
                data-testid="text-location"
              >
                Bengaluru, KA
              </span>
            </div>
            <Button
              variant="default"
              size="icon"
              className="rounded-full w-10 h-10"
              onClick={() => setLocation("/checkout")}
              data-testid="button-cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Category Chips */}
        <div className="bg-background px-4 py-3 border-b overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 h-auto bg-card whitespace-nowrap"
              onClick={() => setLocation("/")}
              data-testid="button-category-bulk"
            >
              <Drumstick className="w-4 h-4" />
              <span className="text-xs font-semibold">Bulk Meals</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 h-auto whitespace-nowrap"
              data-testid="button-category-mealbox"
            >
              <Package className="w-4 h-4" />
              <span className="text-xs font-semibold">MealBox</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 h-auto bg-card whitespace-nowrap"
              onClick={() => setLocation("/")}
              data-testid="button-category-catering"
            >
              <Utensils className="w-4 h-4" />
              <span className="text-xs font-semibold">Catering</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 h-auto bg-card whitespace-nowrap"
              onClick={() => setLocation("/corporate")}
              data-testid="button-category-corporate"
            >
              <Leaf className="w-4 h-4" />
              <span className="text-xs font-semibold">Corporate</span>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-background px-4 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search"
              className="pl-10 pr-20 h-11"
              data-testid="input-search"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Mic className="w-5 h-5 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                VEG
              </Badge>
            </div>
          </div>
        </div>

        <main className="flex-1 px-4 py-6 pb-32 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            {/* Build Your MealBox Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4 mb-3 px-4">
                <div
                  style={{
                    width: '235px',
                    minHeight: '69px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <h2
                    className="text-2xl font-bold"
                    data-testid="text-build-title"
                  >
                    Build Your MealBox
                  </h2>
                  <p
                    className="text-sm text-muted-foreground leading-relaxed"
                    data-testid="text-build-subtitle"
                  >
                    Select your box size, set preferences, and fill it with the
                    dishes you love.
                  </p>
                </div>
                <img
                  src={mealBoxYellow}
                  alt="MealBox"
                  className="object-contain flex-shrink-0"
                  style={{
                    width: '145px',
                    height: '108.75px'
                  }}
                  data-testid="img-mealbox-icon"
                />
              </div>
              {/* Progress bar */}
              <div className="flex gap-1 mb-6">
                <div className="h-1 flex-1 bg-primary rounded-full" />
                <div className="h-1 flex-1 bg-muted rounded-full" />
                <div className="h-1 flex-1 bg-muted rounded-full" />
                <div className="h-1 flex-1 bg-muted rounded-full" />
              </div>
            </div>

            {/* Portion Size Selection */}
            <div className="mb-6">
              <div className="mb-4 px-4">
                <h3
                  className="text-lg font-bold mb-1"
                  data-testid="text-portion-question"
                >
                  How big should your meal box be?
                </h3>
                <p
                  className="text-sm text-muted-foreground"
                  data-testid="text-portion-description"
                >
                  Choose how many portions you'd like to include in each box.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 px-4">
                {PORTION_OPTIONS.map((portion) => (
                  <div
                    key={portion.id}
                    className={`relative cursor-pointer hover-elevate active-elevate-2 transition-all overflow-hidden ${
                      selectedPortionSize === portion.id
                        ? "bg-primary/5"
                        : "bg-background"
                    }`}
                    style={{
                      width: '100%',
                      height: '87px',
                      borderRadius: '15px',
                      border: selectedPortionSize === portion.id ? '2px solid hsl(var(--primary))' : '0.5px solid hsl(var(--border))'
                    }}
                    onClick={() => setSelectedPortionSize(portion.id)}
                    data-testid={`card-portion-${portion.id}`}
                  >
                    <div
                      className={`absolute top-2 left-2 w-6 h-6 rounded-full border flex items-center justify-center z-10 ${
                        selectedPortionSize === portion.id
                          ? "bg-primary border-primary"
                          : "border-muted-foreground bg-background"
                      }`}
                      data-testid={`radio-portion-${portion.id}`}
                    >
                      {selectedPortionSize === portion.id && (
                        <div className="w-3 h-3 bg-primary-foreground rounded-full" />
                      )}
                    </div>
                    <div className="flex items-center h-full relative pl-10">
                      <p
                        className="font-bold text-sm whitespace-nowrap z-10 relative"
                        style={{ maxWidth: 'calc(100% - 120px)' }}
                        data-testid={`text-portion-label-${portion.id}`}
                      >
                        {portion.label}
                      </p>
                      <img
                        src={portion.imagePath}
                        alt={`${portion.label} meal box`}
                        className="object-contain absolute pointer-events-none"
                        style={{
                          width: '145.67px',
                          height: '109.25px',
                          top: '-9px',
                          right: '-20px',
                          zIndex: 1
                        }}
                        data-testid={`img-portion-${portion.id}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Fixed Next Button */}
        <div className="sticky bottom-16 left-0 right-0 p-4 bg-background border-t">
          <div className="max-w-2xl mx-auto flex justify-end">
            <Button
              size="lg"
              onClick={() => {
                if (selectedPortionSize) {
                  handlePortionSelect(selectedPortionSize);
                } else {
                  toast({
                    title: "Select Portion Size",
                    description: "Please select how many portions you'd like",
                    variant: "destructive",
                  });
                }
              }}
              disabled={!selectedPortionSize}
              className="rounded-lg"
              data-testid="button-next-portion"
            >
              Next
            </Button>
          </div>
        </div>

        <BottomNav
          activeTab={activeBottomTab}
          onTabChange={handleBottomNavChange}
        />
      </div>
    );
  }

  // Meal box builder view
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedTemplate(null);
                setSelectedItems({});
                setCurrentSlotIndex(0);
              }}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-bold" data-testid="text-box-name">
                  {selectedTemplate.name}
                </h1>
                {selectedTemplate.id !== "custom-box" && (
                  <p
                    className="text-xs text-muted-foreground"
                    data-testid="text-box-price"
                  >
                    Base: ₹{selectedTemplate.pricePerBox}/box
                  </p>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInfoDialog(true)}
            data-testid="button-info"
          >
            <Info className="w-5 h-5" />
          </Button>
        </div>

        {/* Slot Tabs */}
        <div className="px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            {selectedTemplate.slots.map((slot, idx) => (
              <Button
                key={idx}
                variant={currentSlotIndex === idx ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentSlotIndex(idx)}
                className="flex-shrink-0"
                data-testid={`button-slot-${idx}`}
              >
                <span className="mr-1">{slot.icon}</span>
                {slot.label}
                <Badge
                  variant="secondary"
                  className="ml-2 bg-background/50"
                  data-testid={`badge-slot-count-${idx}`}
                >
                  {getSlotCount(idx)}/{slot.quota}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Dietary Filter */}
        <div className="flex items-center justify-center gap-2 px-4 pb-3 border-t pt-3">
          <Badge
            variant={dietaryFilter === "all" ? "default" : "outline"}
            className="cursor-pointer hover-elevate active-elevate-2"
            onClick={() => setDietaryFilter("all")}
            data-testid="badge-filter-all"
          >
            All
          </Badge>
          <Badge
            variant={dietaryFilter === "veg" ? "default" : "outline"}
            className="cursor-pointer hover-elevate active-elevate-2"
            onClick={() => setDietaryFilter("veg")}
            data-testid="badge-filter-veg"
          >
            <Leaf className="w-3 h-3 mr-1 text-green-600" />
            Veg
          </Badge>
          <Badge
            variant={dietaryFilter === "non-veg" ? "default" : "outline"}
            className="cursor-pointer hover-elevate active-elevate-2"
            onClick={() => setDietaryFilter("non-veg")}
            data-testid="badge-filter-nonveg"
          >
            <Drumstick className="w-3 h-3 mr-1 text-red-600" />
            Non-Veg
          </Badge>
        </div>
      </header>

      {/* Dishes Grid */}
      <main className="pb-32 pt-4 px-4">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading dishes...</p>
            </div>
          ) : filteredDishes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No dishes available in this category
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredDishes.map((dish) => {
                const currentSlotItems = selectedItems[currentSlotIndex] || {};
                const quantity = currentSlotItems[dish.id] || 0;

                return (
                  <Card
                    key={dish.id}
                    className="overflow-hidden"
                    data-testid={`card-dish-${dish.id}`}
                  >
                    <div className="relative aspect-[4/3]">
                      <img
                        src={getDishImage(dish)}
                        alt={dish.name}
                        className="w-full h-full object-cover"
                      />
                      {dish.dietaryType === "veg" ? (
                        <div className="absolute top-2 left-2 w-5 h-5 border-2 border-green-600 flex items-center justify-center bg-white rounded-sm">
                          <div className="w-2.5 h-2.5 bg-green-600 rounded-full" />
                        </div>
                      ) : (
                        <div className="absolute top-2 left-2 w-5 h-5 border-2 border-red-600 flex items-center justify-center bg-white rounded-sm">
                          <div className="w-2.5 h-2.5 bg-red-600 rounded-full" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3
                          className="font-semibold text-sm line-clamp-1"
                          data-testid={`text-dish-name-${dish.id}`}
                        >
                          {dish.name}
                        </h3>
                        <span
                          className="text-sm font-bold text-primary flex-shrink-0"
                          data-testid={`text-dish-price-${dish.id}`}
                        >
                          ₹{dish.price}
                        </span>
                      </div>
                      <p
                        className="text-xs text-muted-foreground line-clamp-2 mb-3"
                        data-testid={`text-dish-description-${dish.id}`}
                      >
                        {dish.description}
                      </p>

                      {quantity === 0 ? (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleAddItem(dish.id)}
                          disabled={isSlotFull}
                          data-testid={`button-add-${dish.id}`}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      ) : (
                        <div
                          className="flex items-center justify-between gap-2 bg-primary/10 rounded-full p-1"
                          data-testid={`control-quantity-${dish.id}`}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleRemoveItem(dish.id)}
                            data-testid={`button-decrease-${dish.id}`}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span
                            className="font-semibold text-sm px-2"
                            data-testid={`text-quantity-${dish.id}`}
                          >
                            {quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-full"
                            onClick={() => handleAddItem(dish.id)}
                            disabled={isSlotFull}
                            data-testid={`button-increase-${dish.id}`}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Number of Boxes:
              </span>
              <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full"
                  onClick={() => setBoxQuantity(Math.max(1, boxQuantity - 1))}
                  data-testid="button-decrease-box-quantity"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span
                  className="font-semibold px-2"
                  data-testid="text-box-quantity"
                >
                  {boxQuantity}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full"
                  onClick={() => setBoxQuantity(boxQuantity + 1)}
                  data-testid="button-increase-box-quantity"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total</p>
              <p
                className="text-xl font-bold text-primary"
                data-testid="text-total-price"
              >
                ₹{calculateTotalPrice()}
              </p>
            </div>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handleAddToCart}
            disabled={
              addToCartMutation.isPending ||
              Object.keys(selectedItems).length === 0
            }
            data-testid="button-add-to-cart"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTemplate.name}</DialogTitle>
            <DialogDescription>
              {selectedTemplate.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-2">Included Slots:</h4>
              <div className="space-y-2">
                {selectedTemplate.slots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {slot.icon} {slot.label}
                    </span>
                    <Badge variant="outline">{slot.quota} items</Badge>
                  </div>
                ))}
              </div>
            </div>
            {selectedTemplate.id !== "custom-box" && (
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Base Price per Box
                  </span>
                  <span className="font-bold">
                    ₹{selectedTemplate.pricePerBox}
                  </span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav
        activeTab={activeBottomTab}
        onTabChange={handleBottomNavChange}
      />
    </div>
  );
}

