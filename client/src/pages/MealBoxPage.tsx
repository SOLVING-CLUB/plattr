// import { useState } from "react";
// import { useLocation } from "wouter";
// import {
//   ArrowLeft,
//   Plus,
//   Minus,
//   ShoppingCart,
//   Package,
//   Leaf,
//   Drumstick,
//   Info,
//   MapPin,
//   Search,
//   Mic,
//   Utensils,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { queryClient } from "@/lib/queryClient";
// import { useToast } from "@/hooks/use-toast";
// import { cartStorage } from "@/lib/cartStorage";
// import { getSupabaseImageUrl } from "@/lib/supabase";
// import BottomNav from "@/components/BottomNav";
// import type { Dish } from "@shared/schema";

// import masalaDosaImage from "@assets/stock_images/indian_masala_dosa_2cd2adc1.jpg";
// import idliImage from "@assets/stock_images/indian_idli_sambar_s_c6bb3ca9.jpg";
// import vadaImage from "@assets/stock_images/indian_vada_d82fc29e.jpg";
// import biryaniImage from "@assets/stock_images/indian_biryani_dish__60e99e80.jpg";
// import samosaImage from "@assets/stock_images/samosa_snacks_indian_0946aa28.jpg";
// import thaliImage from "@assets/stock_images/indian_thali_meal_3a645a6d.jpg";
// // Meal box images
// import mealBoxYellow from "@assets/mealbox_yellow.png";
// import mealBoxRed from "@assets/mealbox_red.png";

// // Portion size options
// interface PortionOption {
//   id: string;
//   label: string;
//   servings: number;
//   priceRange: string;
//   imagePath: string;
// }

// const PORTION_OPTIONS: PortionOption[] = [
//   {
//     id: "3-portions",
//     label: "3 portions",
//     servings: 3,
//     priceRange: "₹150-200",
//     imagePath: mealBoxYellow,
//   },
//   {
//     id: "5-portions",
//     label: "5 portions",
//     servings: 5,
//     priceRange: "₹250-350",
//     imagePath: mealBoxRed,
//   },
//   {
//     id: "6-portions",
//     label: "6 portions",
//     servings: 6,
//     priceRange: "₹300-400",
//     imagePath: mealBoxYellow,
//   },
//   {
//     id: "8-portions",
//     label: "8 portions",
//     servings: 8,
//     priceRange: "₹400-550",
//     imagePath: mealBoxRed,
//   },
// ];

// // Meal box template types
// interface MealBoxTemplate {
//   id: string;
//   name: string;
//   description: string;
//   pricePerBox: number;
//   slots: {
//     category: string;
//     label: string;
//     quota: number;
//     icon: string;
//   }[];
//   imageUrl: string;
// }

// // Available meal box templates
// const MEAL_BOX_TEMPLATES: MealBoxTemplate[] = [
//   {
//     id: "breakfast-box",
//     name: "Breakfast Box",
//     description: "Start your day with a delicious South Indian breakfast",
//     pricePerBox: 149,
//     slots: [
//       { category: "tiffins", label: "Main Item", quota: 2, icon: "🍚" },
//       { category: "snacks", label: "Side", quota: 1, icon: "🥘" },
//       { category: "lunch-dinner", label: "Beverage", quota: 1, icon: "☕" },
//     ],
//     imageUrl: masalaDosaImage,
//   },
//   {
//     id: "lunch-box",
//     name: "Lunch Box",
//     description: "A complete meal with rice, curry, and more",
//     pricePerBox: 189,
//     slots: [
//       { category: "lunch-dinner", label: "Main Course", quota: 2, icon: "🍛" },
//       { category: "snacks", label: "Side Dish", quota: 2, icon: "🥗" },
//       { category: "tiffins", label: "Bread", quota: 1, icon: "🫓" },
//     ],
//     imageUrl: thaliImage,
//   },
//   {
//     id: "snack-box",
//     name: "Snack Box",
//     description: "Perfect for evening tea time or quick bites",
//     pricePerBox: 129,
//     slots: [
//       { category: "snacks", label: "Snacks", quota: 3, icon: "🍪" },
//       { category: "lunch-dinner", label: "Beverage", quota: 1, icon: "☕" },
//     ],
//     imageUrl: samosaImage,
//   },
//   {
//     id: "dinner-box",
//     name: "Dinner Box",
//     description: "A hearty dinner to end your day right",
//     pricePerBox: 199,
//     slots: [
//       { category: "lunch-dinner", label: "Main Course", quota: 2, icon: "🍛" },
//       { category: "tiffins", label: "Bread/Rice", quota: 1, icon: "🍚" },
//       { category: "snacks", label: "Starter", quota: 1, icon: "🥟" },
//       { category: "lunch-dinner", label: "Dessert", quota: 1, icon: "🍮" },
//     ],
//     imageUrl: biryaniImage,
//   },
//   {
//     id: "custom-box",
//     name: "Custom Box",
//     description: "Build your own meal box with your favorite items",
//     pricePerBox: 0,
//     slots: [{ category: "all", label: "Your Choice", quota: 5, icon: "🎯" }],
//     imageUrl: idliImage,
//   },
// ];

// // Helper to get dish image
// const getDishImage = (dish: Dish): string => {
//   if (dish.imageUrl) {
//     const supabaseUrl = getSupabaseImageUrl(dish.imageUrl);
//     if (supabaseUrl && supabaseUrl.startsWith("http")) {
//       return supabaseUrl;
//     }
//   }

//   const name = dish.name.toLowerCase();
//   if (name.includes("dosa")) return masalaDosaImage;
//   if (name.includes("idli") || name.includes("idly")) return idliImage;
//   if (name.includes("vada")) return vadaImage;
//   if (name.includes("biryani")) return biryaniImage;
//   if (name.includes("samosa")) return samosaImage;
//   return thaliImage;
// };

// export default function MealBoxPage() {
//   const [, setLocation] = useLocation();
//   const { toast } = useToast();
//   const [selectedTemplate, setSelectedTemplate] =
//     useState<MealBoxTemplate | null>(null);
//   // Track items per slot: {[slotIndex]: {[dishId]: quantity}}
//   const [selectedItems, setSelectedItems] = useState<
//     Record<number, Record<string, number>>
//   >({});
//   const [dietaryFilter, setDietaryFilter] = useState<"all" | "veg" | "non-veg">(
//     "all",
//   );
//   const [showInfoDialog, setShowInfoDialog] = useState(false);
//   const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
//   const [boxQuantity, setBoxQuantity] = useState(1);
//   const [activeBottomTab, setActiveBottomTab] = useState("home");
//   const [selectedPortionSize, setSelectedPortionSize] = useState<string | null>(
//     null,
//   );

//   // Fetch all dishes
//   const { data: allDishes = [], isLoading } = useQuery<Dish[]>({
//     queryKey: ["/api/dishes"],
//   });

//   // Filter dishes based on current slot and dietary preference
//   const getFilteredDishes = () => {
//     if (!selectedTemplate) return [];

//     const currentSlot = selectedTemplate.slots[currentSlotIndex];
//     let filtered = allDishes;

//     // Filter by category
//     if (currentSlot.category !== "all") {
//       filtered = filtered.filter((dish) => {
//         // Handle different category ID formats
//         const dishCategory = dish.categoryId?.toLowerCase();
//         const slotCategory = currentSlot.category.toLowerCase();

//         // Map slot categories to actual category IDs
//         if (slotCategory === "tiffins") {
//           return (
//             dishCategory?.includes("tiffin") ||
//             dishCategory?.includes("breakfast")
//           );
//         } else if (slotCategory === "snacks") {
//           return (
//             dishCategory?.includes("snack") || dishCategory?.includes("chaat")
//           );
//         } else if (slotCategory === "lunch-dinner") {
//           return (
//             dishCategory?.includes("rice") ||
//             dishCategory?.includes("bread") ||
//             dishCategory?.includes("biryani") ||
//             dishCategory?.includes("curry") ||
//             dishCategory?.includes("lunch") ||
//             dishCategory?.includes("dinner")
//           );
//         }
//         return dishCategory === slotCategory;
//       });
//     }

//     // Filter by dietary preference
//     if (dietaryFilter !== "all") {
//       filtered = filtered.filter((dish) => dish.dietaryType === dietaryFilter);
//     }

//     return filtered;
//   };

//   const filteredDishes = getFilteredDishes();

//   // Calculate total selected items in current slot
//   const getCurrentSlotCount = () => {
//     const currentSlotItems = selectedItems[currentSlotIndex] || {};
//     return Object.values(currentSlotItems).reduce(
//       (sum, count) => sum + count,
//       0,
//     );
//   };

//   // Get count for a specific slot
//   const getSlotCount = (slotIndex: number) => {
//     const slotItems = selectedItems[slotIndex] || {};
//     return Object.values(slotItems).reduce((sum, count) => sum + count, 0);
//   };

//   const currentSlotCount = getCurrentSlotCount();
//   const currentSlot = selectedTemplate?.slots[currentSlotIndex];
//   const isSlotFull = currentSlot
//     ? currentSlotCount >= currentSlot.quota
//     : false;

//   // Handle adding item to meal box
//   const handleAddItem = (dishId: string) => {
//     if (isSlotFull) {
//       toast({
//         title: "Slot Full",
//         description: `You can only add ${currentSlot?.quota} items to ${currentSlot?.label}`,
//         variant: "destructive",
//       });
//       return;
//     }

//     setSelectedItems((prev) => {
//       const currentSlotItems = prev[currentSlotIndex] || {};
//       return {
//         ...prev,
//         [currentSlotIndex]: {
//           ...currentSlotItems,
//           [dishId]: (currentSlotItems[dishId] || 0) + 1,
//         },
//       };
//     });
//   };

//   const handleRemoveItem = (dishId: string) => {
//     setSelectedItems((prev) => {
//       const currentSlotItems = prev[currentSlotIndex] || {};
//       const newSlotItems = { ...currentSlotItems };

//       if (newSlotItems[dishId] > 1) {
//         newSlotItems[dishId]--;
//       } else {
//         delete newSlotItems[dishId];
//       }

//       return {
//         ...prev,
//         [currentSlotIndex]: newSlotItems,
//       };
//     });
//   };

//   // Calculate total price
//   const calculateTotalPrice = () => {
//     // Sum all items across all slots
//     const itemsPrice = Object.values(selectedItems).reduce(
//       (total, slotItems) => {
//         return (
//           total +
//           Object.entries(slotItems).reduce((sum, [dishId, quantity]) => {
//             const dish = allDishes.find((d) => d.id === dishId);
//             return sum + (dish ? parseFloat(dish.price) * quantity : 0);
//           }, 0)
//         );
//       },
//       0,
//     );

//     const basePrice =
//       selectedTemplate?.id === "custom-box"
//         ? 0
//         : selectedTemplate?.pricePerBox || 0;
//     return (basePrice + itemsPrice) * boxQuantity;
//   };

//   // Add to cart mutation
//   const addToCartMutation = useMutation({
//     mutationFn: async () => {
//       // Flatten all items from all slots
//       const itemsToAdd: Array<{
//         dishId: string;
//         quantity: number;
//         dish: Dish | undefined;
//       }> = [];

//       Object.values(selectedItems).forEach((slotItems) => {
//         Object.entries(slotItems).forEach(([dishId, quantity]) => {
//           const dish = allDishes.find((d) => d.id === dishId);
//           itemsToAdd.push({ dishId, quantity: quantity * boxQuantity, dish });
//         });
//       });

//       const validItems = itemsToAdd.filter((item) => item.dish);

//       for (const item of validItems) {
//         if (item.dish) {
//           await cartStorage.addItem(item.dishId, item.quantity, item.dish);
//         }
//       }
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
//       toast({
//         title: "Added to Cart",
//         description: `${boxQuantity} ${selectedTemplate?.name}(s) added to your cart`,
//       });
//       setLocation("/checkout");
//     },
//   });

//   const handleAddToCart = () => {
//     // Check if any items are selected across all slots
//     const hasItems = Object.values(selectedItems).some(
//       (slotItems) => Object.keys(slotItems).length > 0,
//     );

//     if (!hasItems) {
//       toast({
//         title: "Empty Box",
//         description: "Please add at least one item to your meal box",
//         variant: "destructive",
//       });
//       return;
//     }

//     addToCartMutation.mutate();
//   };

//   // Handle bottom nav tab changes
//   const handleBottomNavChange = (tab: string) => {
//     setActiveBottomTab(tab);
//     if (tab === "home") {
//       setLocation("/");
//     } else if (tab === "categories") {
//       setLocation("/categories/tiffins");
//     } else if (tab === "profile") {
//       setLocation("/profile");
//     }
//   };

//   // Handle portion size selection
//   const handlePortionSelect = (portionId: string) => {
//     const portion = PORTION_OPTIONS.find((p) => p.id === portionId);
//     if (portion) {
//       setSelectedPortionSize(portionId);
//       setBoxQuantity(portion.servings);
//       // Navigate to builder page with portion info
//       setLocation("/mealbox/builder");
//     }
//   };

//   // Template selection view
//   if (!selectedTemplate) {
//     return (
//       <div className="min-h-screen bg-background flex flex-col">
//         {/* Top Header with Location */}
//         <div className="bg-background border-b px-4 py-3">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <MapPin className="w-4 h-4 text-foreground" />
//               <span
//                 className="text-sm font-semibold"
//                 data-testid="text-location"
//               >
//                 Bengaluru, KA
//               </span>
//             </div>
//             <Button
//               variant="default"
//               size="icon"
//               className="rounded-full w-10 h-10"
//               onClick={() => setLocation("/checkout")}
//               data-testid="button-cart"
//             >
//               <ShoppingCart className="w-5 h-5" />
//             </Button>
//           </div>
//         </div>

//         {/* Category Chips */}
//         <div className="bg-background px-4 py-3 border-b overflow-x-auto scrollbar-hide">
//           <div className="flex gap-2 min-w-max">
//             <Button
//               variant="outline"
//               size="sm"
//               className="flex items-center gap-1.5 rounded-xl px-4 py-2 h-auto bg-card whitespace-nowrap"
//               onClick={() => setLocation("/")}
//               data-testid="button-category-bulk"
//             >
//               <Drumstick className="w-4 h-4" />
//               <span className="text-xs font-semibold">Bulk Meals</span>
//             </Button>
//             <Button
//               variant="default"
//               size="sm"
//               className="flex items-center gap-1.5 rounded-xl px-4 py-2 h-auto whitespace-nowrap"
//               data-testid="button-category-mealbox"
//             >
//               <Package className="w-4 h-4" />
//               <span className="text-xs font-semibold">MealBox</span>
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               className="flex items-center gap-1.5 rounded-xl px-4 py-2 h-auto bg-card whitespace-nowrap"
//               onClick={() => setLocation("/")}
//               data-testid="button-category-catering"
//             >
//               <Utensils className="w-4 h-4" />
//               <span className="text-xs font-semibold">Catering</span>
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               className="flex items-center gap-1.5 rounded-xl px-4 py-2 h-auto bg-card whitespace-nowrap"
//               onClick={() => setLocation("/corporate")}
//               data-testid="button-category-corporate"
//             >
//               <Leaf className="w-4 h-4" />
//               <span className="text-xs font-semibold">Corporate</span>
//             </Button>
//           </div>
//         </div>

//         {/* Search Bar */}
//         <div className="bg-background px-4 py-3 border-b">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
//             <Input
//               type="search"
//               placeholder="Search"
//               className="pl-10 pr-20 h-11"
//               data-testid="input-search"
//             />
//             <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
//               <Mic className="w-5 h-5 text-muted-foreground" />
//               <Badge variant="outline" className="text-xs">
//                 VEG
//               </Badge>
//             </div>
//           </div>
//         </div>

//         <main className="flex-1 px-4 py-6 pb-32 overflow-y-auto">
//           <div className="max-w-2xl mx-auto">
//             {/* Build Your MealBox Header */}
//             <div className="mb-6">
//               <div className="flex items-start justify-between gap-4 mb-3 px-4">
//                 <div
//                   style={{
//                     width: '235px',
//                     minHeight: '69px',
//                     display: 'flex',
//                     flexDirection: 'column',
//                     gap: '8px'
//                   }}
//                 >
//                   <h2
//                     className="text-2xl font-bold"
//                     data-testid="text-build-title"
//                   >
//                     Build Your MealBox
//                   </h2>
//                   <p
//                     className="text-sm text-muted-foreground leading-relaxed"
//                     data-testid="text-build-subtitle"
//                   >
//                     Select your box size, set preferences, and fill it with the
//                     dishes you love.
//                   </p>
//                 </div>
//                 <img
//                   src={mealBoxYellow}
//                   alt="MealBox"
//                   className="object-contain flex-shrink-0"
//                   style={{
//                     width: '145px',
//                     height: '108.75px'
//                   }}
//                   data-testid="img-mealbox-icon"
//                 />
//               </div>
//               {/* Progress bar */}
//               <div className="flex gap-1 mb-6">
//                 <div className="h-1 flex-1 bg-primary rounded-full" />
//                 <div className="h-1 flex-1 bg-muted rounded-full" />
//                 <div className="h-1 flex-1 bg-muted rounded-full" />
//                 <div className="h-1 flex-1 bg-muted rounded-full" />
//               </div>
//             </div>

//             {/* Portion Size Selection */}
//             <div className="mb-6">
//               <div className="mb-4 px-4">
//                 <h3
//                   className="text-lg font-bold mb-1"
//                   data-testid="text-portion-question"
//                 >
//                   How big should your meal box be?
//                 </h3>
//                 <p
//                   className="text-sm text-muted-foreground"
//                   data-testid="text-portion-description"
//                 >
//                   Choose how many portions you'd like to include in each box.
//                 </p>
//               </div>

//               <div className="grid grid-cols-2 gap-4 px-4">
//                 {PORTION_OPTIONS.map((portion) => (
//                   <div
//                     key={portion.id}
//                     className={`relative cursor-pointer hover-elevate active-elevate-2 transition-all overflow-hidden ${
//                       selectedPortionSize === portion.id
//                         ? "bg-primary/5"
//                         : "bg-background"
//                     }`}
//                     style={{
//                       width: '100%',
//                       height: '87px',
//                       borderRadius: '15px',
//                       border: selectedPortionSize === portion.id ? '2px solid hsl(var(--primary))' : '0.5px solid hsl(var(--border))'
//                     }}
//                     onClick={() => setSelectedPortionSize(portion.id)}
//                     data-testid={`card-portion-${portion.id}`}
//                   >
//                     <div
//                       className={`absolute top-2 left-2 w-6 h-6 rounded-full border flex items-center justify-center z-10 ${
//                         selectedPortionSize === portion.id
//                           ? "bg-primary border-primary"
//                           : "border-muted-foreground bg-background"
//                       }`}
//                       data-testid={`radio-portion-${portion.id}`}
//                     >
//                       {selectedPortionSize === portion.id && (
//                         <div className="w-3 h-3 bg-primary-foreground rounded-full" />
//                       )}
//                     </div>
//                     <div className="flex items-center h-full relative pl-10">
//                       <p
//                         className="font-bold text-sm whitespace-nowrap z-10 relative"
//                         style={{ maxWidth: 'calc(100% - 120px)' }}
//                         data-testid={`text-portion-label-${portion.id}`}
//                       >
//                         {portion.label}
//                       </p>
//                       <img
//                         src={portion.imagePath}
//                         alt={`${portion.label} meal box`}
//                         className="object-contain absolute pointer-events-none"
//                         style={{
//                           width: '145.67px',
//                           height: '109.25px',
//                           top: '-9px',
//                           right: '-20px',
//                           zIndex: 1
//                         }}
//                         data-testid={`img-portion-${portion.id}`}
//                       />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </main>

//         {/* Fixed Next Button */}
//         <div className="sticky bottom-16 left-0 right-0 p-4 bg-background border-t">
//           <div className="max-w-2xl mx-auto flex justify-end">
//             <Button
//               size="lg"
//               onClick={() => {
//                 if (selectedPortionSize) {
//                   handlePortionSelect(selectedPortionSize);
//                 } else {
//                   toast({
//                     title: "Select Portion Size",
//                     description: "Please select how many portions you'd like",
//                     variant: "destructive",
//                   });
//                 }
//               }}
//               disabled={!selectedPortionSize}
//               className="rounded-lg"
//               data-testid="button-next-portion"
//             >
//               Next
//             </Button>
//           </div>
//         </div>

//         <BottomNav
//           activeTab={activeBottomTab}
//           onTabChange={handleBottomNavChange}
//         />
//       </div>
//     );
//   }

//   // Meal box builder view
//   return (
//     <div className="min-h-screen bg-background">
//       {/* Header */}
//       <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
//         <div className="flex items-center justify-between p-4">
//           <div className="flex items-center gap-3">
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => {
//                 setSelectedTemplate(null);
//                 setSelectedItems({});
//                 setCurrentSlotIndex(0);
//               }}
//               data-testid="button-back"
//             >
//               <ArrowLeft className="w-5 h-5" />
//             </Button>
//             <div className="flex items-center gap-2">
//               <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
//                 <Package className="w-5 h-5 text-primary" />
//               </div>
//               <div>
//                 <h1 className="text-base font-bold" data-testid="text-box-name">
//                   {selectedTemplate.name}
//                 </h1>
//                 {selectedTemplate.id !== "custom-box" && (
//                   <p
//                     className="text-xs text-muted-foreground"
//                     data-testid="text-box-price"
//                   >
//                     Base: ₹{selectedTemplate.pricePerBox}/box
//                   </p>
//                 )}
//               </div>
//             </div>
//           </div>
//           <Button
//             variant="ghost"
//             size="icon"
//             onClick={() => setShowInfoDialog(true)}
//             data-testid="button-info"
//           >
//             <Info className="w-5 h-5" />
//           </Button>
//         </div>

//         {/* Slot Tabs */}
//         <div className="px-4 pb-3 overflow-x-auto">
//           <div className="flex gap-2">
//             {selectedTemplate.slots.map((slot, idx) => (
//               <Button
//                 key={idx}
//                 variant={currentSlotIndex === idx ? "default" : "outline"}
//                 size="sm"
//                 onClick={() => setCurrentSlotIndex(idx)}
//                 className="flex-shrink-0"
//                 data-testid={`button-slot-${idx}`}
//               >
//                 <span className="mr-1">{slot.icon}</span>
//                 {slot.label}
//                 <Badge
//                   variant="secondary"
//                   className="ml-2 bg-background/50"
//                   data-testid={`badge-slot-count-${idx}`}
//                 >
//                   {getSlotCount(idx)}/{slot.quota}
//                 </Badge>
//               </Button>
//             ))}
//           </div>
//         </div>

//         {/* Dietary Filter */}
//         <div className="flex items-center justify-center gap-2 px-4 pb-3 border-t pt-3">
//           <Badge
//             variant={dietaryFilter === "all" ? "default" : "outline"}
//             className="cursor-pointer hover-elevate active-elevate-2"
//             onClick={() => setDietaryFilter("all")}
//             data-testid="badge-filter-all"
//           >
//             All
//           </Badge>
//           <Badge
//             variant={dietaryFilter === "veg" ? "default" : "outline"}
//             className="cursor-pointer hover-elevate active-elevate-2"
//             onClick={() => setDietaryFilter("veg")}
//             data-testid="badge-filter-veg"
//           >
//             <Leaf className="w-3 h-3 mr-1 text-green-600" />
//             Veg
//           </Badge>
//           <Badge
//             variant={dietaryFilter === "non-veg" ? "default" : "outline"}
//             className="cursor-pointer hover-elevate active-elevate-2"
//             onClick={() => setDietaryFilter("non-veg")}
//             data-testid="badge-filter-nonveg"
//           >
//             <Drumstick className="w-3 h-3 mr-1 text-red-600" />
//             Non-Veg
//           </Badge>
//         </div>
//       </header>

//       {/* Dishes Grid */}
//       <main className="pb-32 pt-4 px-4">
//         <div className="max-w-4xl mx-auto">
//           {isLoading ? (
//             <div className="text-center py-12">
//               <p className="text-muted-foreground">Loading dishes...</p>
//             </div>
//           ) : filteredDishes.length === 0 ? (
//             <div className="text-center py-12">
//               <p className="text-muted-foreground">
//                 No dishes available in this category
//               </p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//               {filteredDishes.map((dish) => {
//                 const currentSlotItems = selectedItems[currentSlotIndex] || {};
//                 const quantity = currentSlotItems[dish.id] || 0;

//                 return (
//                   <Card
//                     key={dish.id}
//                     className="overflow-hidden"
//                     data-testid={`card-dish-${dish.id}`}
//                   >
//                     <div className="relative aspect-[4/3]">
//                       <img
//                         src={getDishImage(dish)}
//                         alt={dish.name}
//                         className="w-full h-full object-cover"
//                       />
//                       {dish.dietaryType === "veg" ? (
//                         <div className="absolute top-2 left-2 w-5 h-5 border-2 border-green-600 flex items-center justify-center bg-white rounded-sm">
//                           <div className="w-2.5 h-2.5 bg-green-600 rounded-full" />
//                         </div>
//                       ) : (
//                         <div className="absolute top-2 left-2 w-5 h-5 border-2 border-red-600 flex items-center justify-center bg-white rounded-sm">
//                           <div className="w-2.5 h-2.5 bg-red-600 rounded-full" />
//                         </div>
//                       )}
//                     </div>
//                     <CardContent className="p-3">
//                       <div className="flex items-start justify-between gap-2 mb-2">
//                         <h3
//                           className="font-semibold text-sm line-clamp-1"
//                           data-testid={`text-dish-name-${dish.id}`}
//                         >
//                           {dish.name}
//                         </h3>
//                         <span
//                           className="text-sm font-bold text-primary flex-shrink-0"
//                           data-testid={`text-dish-price-${dish.id}`}
//                         >
//                           ₹{dish.price}
//                         </span>
//                       </div>
//                       <p
//                         className="text-xs text-muted-foreground line-clamp-2 mb-3"
//                         data-testid={`text-dish-description-${dish.id}`}
//                       >
//                         {dish.description}
//                       </p>

//                       {quantity === 0 ? (
//                         <Button
//                           size="sm"
//                           className="w-full"
//                           onClick={() => handleAddItem(dish.id)}
//                           disabled={isSlotFull}
//                           data-testid={`button-add-${dish.id}`}
//                         >
//                           <Plus className="w-4 h-4 mr-1" />
//                           Add
//                         </Button>
//                       ) : (
//                         <div
//                           className="flex items-center justify-between gap-2 bg-primary/10 rounded-full p-1"
//                           data-testid={`control-quantity-${dish.id}`}
//                         >
//                           <Button
//                             size="icon"
//                             variant="ghost"
//                             className="h-7 w-7 rounded-full"
//                             onClick={() => handleRemoveItem(dish.id)}
//                             data-testid={`button-decrease-${dish.id}`}
//                           >
//                             <Minus className="w-3 h-3" />
//                           </Button>
//                           <span
//                             className="font-semibold text-sm px-2"
//                             data-testid={`text-quantity-${dish.id}`}
//                           >
//                             {quantity}
//                           </span>
//                           <Button
//                             size="icon"
//                             variant="ghost"
//                             className="h-7 w-7 rounded-full"
//                             onClick={() => handleAddItem(dish.id)}
//                             disabled={isSlotFull}
//                             data-testid={`button-increase-${dish.id}`}
//                           >
//                             <Plus className="w-3 h-3" />
//                           </Button>
//                         </div>
//                       )}
//                     </CardContent>
//                   </Card>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </main>

//       {/* Bottom Action Bar */}
//       <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40">
//         <div className="max-w-4xl mx-auto">
//           <div className="flex items-center justify-between mb-3">
//             <div className="flex items-center gap-2">
//               <span className="text-sm text-muted-foreground">
//                 Number of Boxes:
//               </span>
//               <div className="flex items-center gap-2 bg-muted rounded-full p-1">
//                 <Button
//                   size="icon"
//                   variant="ghost"
//                   className="h-7 w-7 rounded-full"
//                   onClick={() => setBoxQuantity(Math.max(1, boxQuantity - 1))}
//                   data-testid="button-decrease-box-quantity"
//                 >
//                   <Minus className="w-3 h-3" />
//                 </Button>
//                 <span
//                   className="font-semibold px-2"
//                   data-testid="text-box-quantity"
//                 >
//                   {boxQuantity}
//                 </span>
//                 <Button
//                   size="icon"
//                   variant="ghost"
//                   className="h-7 w-7 rounded-full"
//                   onClick={() => setBoxQuantity(boxQuantity + 1)}
//                   data-testid="button-increase-box-quantity"
//                 >
//                   <Plus className="w-3 h-3" />
//                 </Button>
//               </div>
//             </div>
//             <div className="text-right">
//               <p className="text-xs text-muted-foreground">Total</p>
//               <p
//                 className="text-xl font-bold text-primary"
//                 data-testid="text-total-price"
//               >
//                 ₹{calculateTotalPrice()}
//               </p>
//             </div>
//           </div>
//           <Button
//             className="w-full"
//             size="lg"
//             onClick={handleAddToCart}
//             disabled={
//               addToCartMutation.isPending ||
//               Object.keys(selectedItems).length === 0
//             }
//             data-testid="button-add-to-cart"
//           >
//             <ShoppingCart className="w-5 h-5 mr-2" />
//             Add to Cart
//           </Button>
//         </div>
//       </div>

//       {/* Info Dialog */}
//       <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>{selectedTemplate.name}</DialogTitle>
//             <DialogDescription>
//               {selectedTemplate.description}
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-3">
//             <div>
//               <h4 className="font-semibold text-sm mb-2">Included Slots:</h4>
//               <div className="space-y-2">
//                 {selectedTemplate.slots.map((slot, idx) => (
//                   <div
//                     key={idx}
//                     className="flex items-center justify-between text-sm"
//                   >
//                     <span className="text-muted-foreground">
//                       {slot.icon} {slot.label}
//                     </span>
//                     <Badge variant="outline">{slot.quota} items</Badge>
//                   </div>
//                 ))}
//               </div>
//             </div>
//             {selectedTemplate.id !== "custom-box" && (
//               <div className="pt-3 border-t">
//                 <div className="flex items-center justify-between text-sm">
//                   <span className="text-muted-foreground">
//                     Base Price per Box
//                   </span>
//                   <span className="font-bold">
//                     ₹{selectedTemplate.pricePerBox}
//                   </span>
//                 </div>
//               </div>
//             )}
//           </div>
//         </DialogContent>
//       </Dialog>

//       <BottomNav
//         activeTab={activeBottomTab}
//         onTabChange={handleBottomNavChange}
//       />
//     </div>
//   );
// }

import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContex";
import { mealboxOrderService, addressService } from "@/lib/supabase-service";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { Dish } from "@shared/schema";
import { getSupabaseImageUrl } from "@/lib/supabase"; 
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, MapPin, ShoppingCart, UtensilsCrossed, Package, Truck, Search, Check, ChevronRight, ChevronLeft, Star, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import FloatingNav from "@/pages/FloatingNav";
import ContinueOrderBanner from "@/pages/ContinueOrderBanner";
import mealBoxHeroPattern from "@assets/Hero Pattern - Meal Box_1763885298156.png";
import mealBoxImage from "@assets/mockup8_1763889604975.png";
import hiTeaIcon from "@assets/Image2322_1763882700309.png";
import breakfastIcon from "@assets/Image34344_1763882700312.png";
import lunchIcon from "@assets/9_1763882651330.png";
import dinnerIcon from "@assets/Rectangle 34625261_1763882651331.png";
import grilledIcon from "@assets/Image34_1763904331982.png";
import friedIcon from "@assets/Image65_1763904331981.png";
import stuffedIcon from "@assets/Image49_1763904331978.png";
import plate3Portions from "@assets/mockup82_1763911387450.png";
import plate5Portions from "@assets/mockup 84_1763911387448.png";
import plate6Portions from "@assets/mockup 83_1763911387449.png";
import plate8Portions from "@assets/01. Take Away Package22 1_1763911387446.png";
import chefHatIcon from "@assets/tabler_chef-hat-filled_1763917839168.png";
import servingStaffIcon from "@assets/ic_baseline-people_1763917839170.png";
import decorIcon from "@assets/streamline-ultimate_party-decoration-bold_1763917839170.png";
import tablewareIcon from "@assets/roentgen_fork-and-knife_1763917839169.png";
import musicIcon from "@assets/roentgen_fork-and-knife_1763917839169.png";
import cameraIcon from "@assets/mdi_camera3_1763917839155.png";

type ServiceType = "bulk-meals" | "mealbox" | "catering" | "corporate";
type PortionSize = 3 | 5 | 6 | 8;
type MealPreference = "veg" | "egg" | "non-veg";
type MealType = "hi-tea" | "breakfast" | "lunch" | "dinner";
type FoodCategory = "all" | "appetizers" | "rice" | "entree" | "roti" | "biryani" | "dessert";
type NavigateFn = (path: string, options?: { replace?: boolean }) => void;

interface FoodItem {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  category: FoodCategory;
  type: "veg" | "egg" | "non-veg";
  image: string;
}

interface PortionSelection {
  slot: number;
  itemId: string | null;
  item?: FoodItem;
}

interface MealBoxProps {
  onNavigate?: NavigateFn;
}

export default function MealBox({ onNavigate }: MealBoxProps = {}) {
  const [, setLocation] = useLocation();
  const navigate: NavigateFn = (path, options) => {
    if (onNavigate) {
      onNavigate(path, options);
    } else {
      setLocation(path, options);
    }
  };
  const { toast } = useToast();
  const { enterCategory, mealBoxProgress, saveMealBoxProgress, clearMealBoxProgress } = useCart();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const hasInteractedRef = useRef(false);
  const isRestoringRef = useRef(false);
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("home");
  const [selectedService, setSelectedService] = useState<ServiceType>("mealbox");

  const handleInteraction = () => {
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      enterCategory("mealbox");
    }
  };
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedPortions, setSelectedPortions] = useState<PortionSize>(3);
  const [mealPreference, setMealPreference] = useState<MealPreference>("veg");
  const [vegBoxes, setVegBoxes] = useState<string>("");
  const [eggBoxes, setEggBoxes] = useState<string>("");
  const [nonVegBoxes, setNonVegBoxes] = useState<string>("");
  const [selectedMealType, setSelectedMealType] = useState<MealType>("lunch");
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<"all" | "grilled" | "fried" | "stuffed">("all");
  const [currentDietaryTab, setCurrentDietaryTab] = useState<"veg" | "egg" | "non-veg">("veg");
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [selectedSort, setSelectedSort] = useState<string>("popular");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  
  // Separate selections for each dietary type
  const [vegPlateSelections, setVegPlateSelections] = useState<PortionSelection[]>([]);
  const [eggPlateSelections, setEggPlateSelections] = useState<PortionSelection[]>([]);
  const [nonVegPlateSelections, setNonVegPlateSelections] = useState<PortionSelection[]>([]);
  
  // Add-ons selection
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  // Restore MealBox progress on mount (only once)
  useEffect(() => {
    if (mealBoxProgress && !isRestoringRef.current && currentStep === 1) {
      isRestoringRef.current = true;
      // Only restore step if it's less than 7 (don't restore if already on payment step)
      const stepToRestore = mealBoxProgress.currentStep < 7 ? mealBoxProgress.currentStep : 6;
      console.log("Restoring mealbox progress, step:", stepToRestore);
      setCurrentStep(stepToRestore);
      setSelectedPortions(mealBoxProgress.selectedPortions);
      setMealPreference(mealBoxProgress.mealPreference);
      setSelectedMealType(mealBoxProgress.selectedMealType as MealType);
      setVegBoxes(mealBoxProgress.vegBoxes);
      setEggBoxes(mealBoxProgress.eggBoxes);
      setNonVegBoxes(mealBoxProgress.nonVegBoxes);
      
      // Restore selections, but resize to match selectedPortions if they don't match
      const restoredPortions = mealBoxProgress.selectedPortions;
      const resizeSelections = (selections: PortionSelection[]) => {
        if (selections.length === restoredPortions) {
          return selections;
        }
        // Resize to match restoredPortions
        return Array.from({ length: restoredPortions }, (_, i) => 
          i < selections.length 
            ? selections[i] 
            : { slot: i, itemId: null, item: undefined }
        ).slice(0, restoredPortions);
      };
      
      setVegPlateSelections(resizeSelections((mealBoxProgress.vegPlateSelections || []) as PortionSelection[]));
      setEggPlateSelections(resizeSelections((mealBoxProgress.eggPlateSelections || []) as PortionSelection[]));
      setNonVegPlateSelections(resizeSelections((mealBoxProgress.nonVegPlateSelections || []) as PortionSelection[]));
      setSelectedAddOns(mealBoxProgress.selectedAddons || []);
      setCurrentDietaryTab(mealBoxProgress.currentDietaryTab || "veg");
      hasInteractedRef.current = true;
    }
  }, [mealBoxProgress]);
  
  // Debug: Log step changes
  useEffect(() => {
    console.log("Current step changed to:", currentStep);
  }, [currentStep]);
  
  // Save MealBox progress when key state changes
  // Use JSON.stringify to create stable dependencies and prevent infinite loops
  const vegPlateSelectionsStr = JSON.stringify(vegPlateSelections);
  const eggPlateSelectionsStr = JSON.stringify(eggPlateSelections);
  const nonVegPlateSelectionsStr = JSON.stringify(nonVegPlateSelections);
  
  useEffect(() => {
    if (currentStep > 1 && !isRestoringRef.current) {
      saveMealBoxProgress({
        currentStep,
        selectedPortions,
        mealPreference,
        selectedMealType,
        vegBoxes,
        eggBoxes,
        nonVegBoxes,
        vegPlateSelections,
        eggPlateSelections,
        nonVegPlateSelections,
        selectedAddons: selectedAddOns,
        currentDietaryTab,
      });
    }
    if (isRestoringRef.current && currentStep > 1) {
      isRestoringRef.current = false;
    }
  }, [currentStep, selectedPortions, mealPreference, selectedMealType, vegBoxes, eggBoxes, nonVegBoxes, vegPlateSelectionsStr, eggPlateSelectionsStr, nonVegPlateSelectionsStr, selectedAddOns, currentDietaryTab]);
  
  // Track selected item IDs based on current dietary tab to prevent duplicates
  const getExcludedItemIds = useMemo(() => {
    return () => {
      const ids = new Set<string>();
      
      if (currentDietaryTab === "veg") {
        // VEG tab: exclude only VEG selections
        vegPlateSelections.forEach(sel => {
          if (sel.itemId) ids.add(sel.itemId);
        });
      } else if (currentDietaryTab === "egg") {
        // EGG tab: exclude VEG and EGG selections
        [...vegPlateSelections, ...eggPlateSelections].forEach(sel => {
          if (sel.itemId) ids.add(sel.itemId);
        });
      } else {
        // NON-VEG tab: exclude only VEG selections (not EGG)
        vegPlateSelections.forEach(sel => {
          if (sel.itemId) ids.add(sel.itemId);
        });
      }
      
      return ids;
    };
  }, [currentDietaryTab, vegPlateSelections, eggPlateSelections]);
  
  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (currentStep > 1) {
        event.preventDefault();
        handleBackStep();
        // Push state back to maintain URL
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    // Add a history entry when entering multi-step flow
    if (currentStep > 1) {
      window.history.pushState(null, '', window.location.pathname);
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentStep]);

  // Initialize and resize plate selections based on selectedPortions
  // The same template will be applied to all boxes of that dietary type
  useEffect(() => {
    if (currentStep === 4 && !isRestoringRef.current) {
      const vegCount = parseInt(vegBoxes) || 0;
      const eggCount = parseInt(eggBoxes) || 0;
      const nonVegCount = parseInt(nonVegBoxes) || 0;
      
      // Resize or initialize veg selections to match selectedPortions
      if (vegCount > 0) {
        if (vegPlateSelections.length !== selectedPortions) {
          // Resize existing selections or create new ones
          if (vegPlateSelections.length > 0) {
            // Resize: keep existing items up to new length, or pad with empty slots
            const resized = Array.from({ length: selectedPortions }, (_, i) => 
              i < vegPlateSelections.length 
                ? vegPlateSelections[i] 
                : { slot: i, itemId: null, item: undefined }
            );
            setVegPlateSelections(resized.slice(0, selectedPortions));
          } else {
            // Initialize new
            const vegSlots = Array.from({ length: selectedPortions }, (_, i) => ({
              slot: i,
              itemId: null,
              item: undefined
            }));
            setVegPlateSelections(vegSlots);
          }
        }
      }
      
      // Resize or initialize egg selections to match selectedPortions
      if (eggCount > 0) {
        if (eggPlateSelections.length !== selectedPortions) {
          if (eggPlateSelections.length > 0) {
            const resized = Array.from({ length: selectedPortions }, (_, i) => 
              i < eggPlateSelections.length 
                ? eggPlateSelections[i] 
                : { slot: i, itemId: null, item: undefined }
            );
            setEggPlateSelections(resized.slice(0, selectedPortions));
          } else {
            const eggSlots = Array.from({ length: selectedPortions }, (_, i) => ({
              slot: i,
              itemId: null,
              item: undefined
            }));
            setEggPlateSelections(eggSlots);
          }
        }
      }
      
      // Resize or initialize non-veg selections to match selectedPortions
      if (nonVegCount > 0) {
        if (nonVegPlateSelections.length !== selectedPortions) {
          if (nonVegPlateSelections.length > 0) {
            const resized = Array.from({ length: selectedPortions }, (_, i) => 
              i < nonVegPlateSelections.length 
                ? nonVegPlateSelections[i] 
                : { slot: i, itemId: null, item: undefined }
            );
            setNonVegPlateSelections(resized.slice(0, selectedPortions));
          } else {
            const nonVegSlots = Array.from({ length: selectedPortions }, (_, i) => ({
              slot: i,
              itemId: null,
              item: undefined
            }));
            setNonVegPlateSelections(nonVegSlots);
          }
        }
      }
      
      // Ensure selectedSlotIndex is within bounds
      if (selectedSlotIndex >= selectedPortions) {
        setSelectedSlotIndex(Math.max(0, selectedPortions - 1));
      }
    }
  }, [currentStep, vegBoxes, eggBoxes, nonVegBoxes, selectedPortions, vegPlateSelections.length, eggPlateSelections.length, nonVegPlateSelections.length, selectedSlotIndex]);
  
  // Also resize selections when selectedPortions changes (even if not on step 4)
  // This handles the case where user changes portion size after already being on step 4
  useEffect(() => {
    if (currentStep >= 4 && !isRestoringRef.current) {
      const vegCount = parseInt(vegBoxes) || 0;
      const eggCount = parseInt(eggBoxes) || 0;
      const nonVegCount = parseInt(nonVegBoxes) || 0;
      
      // Resize veg selections if they don't match selectedPortions
      if (vegCount > 0 && vegPlateSelections.length !== selectedPortions) {
        const resized = Array.from({ length: selectedPortions }, (_, i) => 
          i < vegPlateSelections.length 
            ? vegPlateSelections[i] 
            : { slot: i, itemId: null, item: undefined }
        );
        setVegPlateSelections(resized);
      }
      
      // Resize egg selections if they don't match selectedPortions
      if (eggCount > 0 && eggPlateSelections.length !== selectedPortions) {
        const resized = Array.from({ length: selectedPortions }, (_, i) => 
          i < eggPlateSelections.length 
            ? eggPlateSelections[i] 
            : { slot: i, itemId: null, item: undefined }
        );
        setEggPlateSelections(resized);
      }
      
      // Resize non-veg selections if they don't match selectedPortions
      if (nonVegCount > 0 && nonVegPlateSelections.length !== selectedPortions) {
        const resized = Array.from({ length: selectedPortions }, (_, i) => 
          i < nonVegPlateSelections.length 
            ? nonVegPlateSelections[i] 
            : { slot: i, itemId: null, item: undefined }
        );
        setNonVegPlateSelections(resized);
      }
      
      // Ensure selectedSlotIndex is within bounds
      if (selectedSlotIndex >= selectedPortions) {
        setSelectedSlotIndex(Math.max(0, selectedPortions - 1));
      }
    }
  }, [selectedPortions, currentStep]);
  
  // Calculate which dietary preferences are active (have non-zero member counts)
  const activeDietaryPreferences = useMemo(() => {
    const active: ("veg" | "egg" | "non-veg")[] = [];
    
    // Check if veg has a non-zero value
    const vegCount = parseInt(vegBoxes) || 0;
    if (vegCount > 0) {
      active.push("veg");
    }
    
    // Check if egg has a non-zero value
    const eggCount = parseInt(eggBoxes) || 0;
    if (eggCount > 0) {
      active.push("egg");
    }
    
    // Check if non-veg has a non-zero value
    const nonVegCount = parseInt(nonVegBoxes) || 0;
    if (nonVegCount > 0) {
      active.push("non-veg");
    }
    
    return active;
  }, [vegBoxes, eggBoxes, nonVegBoxes]);
  
  // Clear box counts for inactive preferences when meal preference changes
  useEffect(() => {
    if (mealPreference === "veg") {
      // If VEG selected, clear egg and non-veg boxes
      setEggBoxes("");
      setNonVegBoxes("");
    } else if (mealPreference === "egg") {
      // If EGG selected, clear non-veg boxes
      setNonVegBoxes("");
    }
    // If NON-VEG selected, keep all boxes (user can enter values for all three)
  }, [mealPreference]);
  
  // Set initial dietary tab when entering Step 4
  useEffect(() => {
    if (currentStep === 4 && activeDietaryPreferences.length > 0) {
      // Always set dietary tab to the first active dietary preference when entering Step 4
      setCurrentDietaryTab(activeDietaryPreferences[0]);
    }
  }, [currentStep, activeDietaryPreferences]);
  
  // Get current plate selections based on active dietary tab
  const getCurrentPlateSelections = (): PortionSelection[] => {
    if (currentDietaryTab === "veg") return vegPlateSelections;
    if (currentDietaryTab === "egg") return eggPlateSelections;
    return nonVegPlateSelections;
  };
  
  // Get allowed item types for current dietary tab
  const getAllowedItemTypes = (): ("veg" | "egg" | "non-veg")[] => {
    if (currentDietaryTab === "veg") return ["veg"];
    if (currentDietaryTab === "egg") return ["veg", "egg"];
    return ["veg", "egg", "non-veg"];
  };
  
  // Map meal type to meal_type filter for Supabase
  const getMealTypeFilter = (mealType: MealType): string => {
    const mapping: Record<MealType, string> = {
      "breakfast": "breakfast",
      "lunch": "lunch-dinner",
      "dinner": "lunch-dinner",
      "hi-tea": "snacks",
    };
    return mapping[mealType] || "lunch-dinner";
  };

  // Fetch dishes from Supabase based on selected meal type
  const { data: dishes = [], isLoading: isLoadingDishes } = useQuery<Dish[]>({
    queryKey: ['/api/dishes', getMealTypeFilter(selectedMealType), 'all'],
    queryFn: async ({ queryKey }) => {
      const queryFn = getQueryFn<Dish[]>({ on401: 'throw' });
      return queryFn({ queryKey });
    },
  });

  // Transform dishes to match the FoodItem format
  const foodItems: FoodItem[] = useMemo(() => {
    return dishes
      .filter(dish => dish.isAvailable !== false) // Only show available dishes
      .map((dish) => {
        // Map dietary type from database to FoodItem type
        const dietaryType = dish.dietaryType?.toLowerCase() || 'veg';
        let type: "veg" | "egg" | "non-veg" = "veg";
        if (dietaryType === 'egg' || dietaryType === 'egg-veg') {
          type = "egg";
        } else if (dietaryType === 'non-veg' || dietaryType === 'non-veg') {
          type = "non-veg";
        }

        // Map dish_type to category
        const dishType = dish.dishType?.toLowerCase() || '';
        let category: FoodCategory = "all";
        if (dishType.includes('appetizer') || dishType.includes('starter')) {
          category = "appetizers";
        } else if (dishType.includes('rice')) {
          category = "rice";
        } else if (dishType.includes('curry') || dishType.includes('sabzi') || dishType.includes('dal')) {
          category = "entree";
        } else if (dishType.includes('roti') || dishType.includes('naan') || dishType.includes('bread')) {
          category = "roti";
        } else if (dishType.includes('biryani')) {
          category = "biryani";
        } else if (dishType.includes('dessert') || dishType.includes('sweet')) {
          category = "dessert";
        }

        return {
          id: dish.id,
          name: dish.name,
          price: parseFloat(String(dish.price)),
          rating: 4.5, // Default rating
          reviewCount: 0, // Default review count
          category,
          type,
          image: dish.imageUrl ? getSupabaseImageUrl(dish.imageUrl) : "",
        };
      });
  }, [dishes]);
  
  // Filter items based on category, allowed types for current dietary tab, and exclude already selected items
  const filteredItems = foodItems.filter(item => {
    // Category filter
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    
    // Only show items allowed for current plate type
    const allowedTypes = getAllowedItemTypes();
    if (!allowedTypes.includes(item.type)) return false;
    
    // Exclude already selected items (no duplicates) based on current dietary tab
    const excludedIds = getExcludedItemIds();
    if (excludedIds.has(item.id)) return false;
    
    return true;
  });

  // Check if all slots for current dietary tab are filled
  const currentPlateSelections = getCurrentPlateSelections();
  const allSlotsFilled = currentPlateSelections.length > 0 && currentPlateSelections.every(sel => sel.itemId !== null);
  
  // Check if ALL slots across ALL dietary types are filled
  const allPlatesFilled = 
    vegPlateSelections.every(sel => sel.itemId !== null) &&
    eggPlateSelections.every(sel => sel.itemId !== null) &&
    nonVegPlateSelections.every(sel => sel.itemId !== null);

  const handleTabChange = (tab: "home" | "menu" | "profile") => {
    setActiveTab(tab);

    if (tab === "home") {
      navigate("/");
    } else if (tab === "menu") {
      navigate("/bulk-meals");
    } else if (tab === "profile") {
      navigate("/profile");
    }
  };

  // Handle number input changes with validation
  const handleVegBoxesChange = (value: string) => {
    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setVegBoxes(value);
    }
  };

  const handleEggBoxesChange = (value: string) => {
    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setEggBoxes(value);
    }
  };

  const handleNonVegBoxesChange = (value: string) => {
    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setNonVegBoxes(value);
    }
  };

  const handleNextStep = () => {
    // Validate that all slots are filled for current dietary tab on Step 4 before proceeding
    if (currentStep === 4) {
      const currentSelections = getCurrentPlateSelections();
      const allFilled = currentSelections.length > 0 && currentSelections.every(sel => sel.itemId !== null);
      if (!allFilled) {
        toast({
          title: "Complete Your Selection",
          description: `Please select all ${selectedPortions} items for your ${currentDietaryTab.toUpperCase()} box.`,
          variant: "destructive"
        });
        return;
      }
    }

    // Validate member counts on Step 2 before proceeding
    if (currentStep === 2) {
      const vegCount = parseInt(vegBoxes) || 0;
      const eggCount = parseInt(eggBoxes) || 0;
      const nonVegCount = parseInt(nonVegBoxes) || 0;

      // Check if any active dietary preference has less than 5 members
      if (mealPreference === "veg" && vegCount > 0 && vegCount < 5) {
        toast({
          title: "Minimum Order Required",
          description: "Minimum serve is 5 boxes per dietary preference.",
          variant: "destructive"
        });
        return;
      }

      if ((mealPreference === "egg" || mealPreference === "non-veg")) {
        if ((vegCount > 0 && vegCount < 5) || (eggCount > 0 && eggCount < 5)) {
          toast({
            title: "Minimum Order Required",
            description: "Minimum serve is 5 boxes per dietary preference.",
            variant: "destructive"
          });
          return;
        }
      }

      if (mealPreference === "non-veg" && nonVegCount > 0 && nonVegCount < 5) {
        toast({
          title: "Minimum Order Required",
          description: "Minimum serve is 5 boxes per dietary preference.",
          variant: "destructive"
        });
        return;
      }

      // Check if at least one dietary preference has a value >= 5
      const hasValidOrder = (vegCount >= 5) || (eggCount >= 5) || (nonVegCount >= 5);
      if (!hasValidOrder) {
        toast({
          title: "Minimum Order Required",
          description: "Please order at least 5 boxes for one dietary preference.",
          variant: "destructive"
        });
        return;
      }
    }

    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle food item selection - allow selecting any item, fill next available slot
  const handleItemSelection = (item: FoodItem) => {
    const currentSelections = getCurrentPlateSelections();
    
    // Check if item is already selected
    const existingIndex = currentSelections.findIndex(sel => sel.itemId === item.id);
    if (existingIndex !== -1) {
      // Item already selected, remove it
      const updatedSelections = currentSelections.map((sel, idx) => 
        idx === existingIndex ? { slot: idx, itemId: null, item: undefined } : sel
      );
      
      if (currentDietaryTab === "veg") {
        setVegPlateSelections(updatedSelections);
      } else if (currentDietaryTab === "egg") {
        setEggPlateSelections(updatedSelections);
      } else {
        setNonVegPlateSelections(updatedSelections);
      }
      
      // Update selected slot index to the removed slot
      setSelectedSlotIndex(existingIndex);
      return;
    }
    
    // Find the first empty slot
    const emptySlotIndex = currentSelections.findIndex(sel => sel.itemId === null);
    if (emptySlotIndex === -1) {
      // All slots filled, replace the currently selected slot
      const slotToReplace = selectedSlotIndex < currentSelections.length ? selectedSlotIndex : 0;
      const updatedSelections = [...currentSelections];
      updatedSelections[slotToReplace] = {
        slot: slotToReplace,
        itemId: item.id,
        item: item
      };
      
      if (currentDietaryTab === "veg") {
        setVegPlateSelections(updatedSelections);
      } else if (currentDietaryTab === "egg") {
        setEggPlateSelections(updatedSelections);
      } else {
        setNonVegPlateSelections(updatedSelections);
      }
      
      setSelectedSlotIndex(slotToReplace);
      return;
    }
    
    // Fill the first empty slot
    const updatedSelections = [...currentSelections];
    updatedSelections[emptySlotIndex] = {
      slot: emptySlotIndex,
      itemId: item.id,
      item: item
    };
    
    // Update the appropriate state based on current dietary tab
    if (currentDietaryTab === "veg") {
      setVegPlateSelections(updatedSelections);
    } else if (currentDietaryTab === "egg") {
      setEggPlateSelections(updatedSelections);
    } else {
      setNonVegPlateSelections(updatedSelections);
    }
    
    // Auto-advance to next empty slot if available
    const nextEmptySlot = updatedSelections.findIndex((sel, idx) => idx > emptySlotIndex && sel.itemId === null);
    if (nextEmptySlot !== -1) {
      setSelectedSlotIndex(nextEmptySlot);
    } else {
      // All slots filled
      setSelectedSlotIndex(emptySlotIndex);
      toast({
        title: "All portions filled!",
        description: `All ${selectedPortions} items have been selected for your ${currentDietaryTab.toUpperCase()} box.`
      });
    }
  };

  // Handle slot click to edit a specific slot
  const handleSlotClick = (slotIndex: number) => {
    setSelectedSlotIndex(slotIndex);
    // Clear only this specific slot, keep other slots intact
    const currentSelections = getCurrentPlateSelections();
    const updatedSelections = currentSelections.map((sel, idx) => {
      if (idx === slotIndex) {
        return { slot: idx, itemId: null, item: undefined };
      }
      return sel;
    });
    
    // Update the appropriate state based on current dietary tab
    if (currentDietaryTab === "veg") {
      setVegPlateSelections(updatedSelections);
    } else if (currentDietaryTab === "egg") {
      setEggPlateSelections(updatedSelections);
    } else {
      setNonVegPlateSelections(updatedSelections);
    }
  };

  return (
    <div className="min-h-screen pb-40 relative bg-gray-50">
      {/* Green Geometric Background Header */}
      <div
        className="absolute top-0 left-0 right-0 z-0"
        style={{
          backgroundImage: `url(${mealBoxHeroPattern})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          height: "300px",
        }}
      />
      {/* Header Section with Location and Cart */}
      <div className="relative z-10 px-4 pt-4 pb-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 text-white hover:text-white hover:bg-white/20"
          onClick={() => {
            if (currentStep > 1) {
              handleBackStep();
            } else {
              navigate("/");
            }
          }}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Location and Cart */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-base sm:text-lg" style={{ fontFamily: "Sweet Sans Pro" }}>
              Bengaluru, KA
            </span>
          </div>
          <button
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            onClick={() => toast({ title: "Cart", description: "Cart coming soon!" })}
            data-testid="button-cart"
          >
            <ShoppingCart className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Service Navigation Tabs */}
        <div className={onNavigate ? "grid grid-cols-2 gap-3 max-w-xs mx-auto" : "grid grid-cols-4 gap-2"}>
          <button
            onClick={() => {
              setSelectedService("bulk-meals");
              navigate("/bulk-meals");
            }}
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
              className="text-[9px] xs:text-[10px] sm:text-xs font-semibold text-center leading-tight"
              style={{ fontFamily: "Sweet Sans Pro" }}
            >
              Bulk Meals
            </span>
          </button>

          <button
            onClick={() => setSelectedService("mealbox")}
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
              className="text-[9px] xs:text-[10px] sm:text-xs font-semibold text-center leading-tight"
              style={{ fontFamily: "Sweet Sans Pro" }}
            >
              MealBox
            </span>
          </button>

          {!onNavigate && (
            <>
          <button
            onClick={() => {
              setSelectedService("catering");
                  navigate("/catering");
            }}
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
              className="text-[9px] xs:text-[10px] sm:text-xs font-semibold text-center leading-tight"
              style={{ fontFamily: "Sweet Sans Pro" }}
            >
              Catering
            </span>
          </button>

          <button
            onClick={() => {
              setSelectedService("corporate");
                  navigate("/corporate");
            }}
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
              className="text-[9px] xs:text-[10px] sm:text-xs font-semibold text-center leading-tight"
              style={{ fontFamily: "Sweet Sans Pro" }}
            >
              Corporate
            </span>
          </button>
            </>
          )}
        </div>
      </div>
      {/* Content below green background */}
      <div className="relative z-10 px-4" style={{ marginTop: "20px" }}>
        
        {/* Back Navigation - Consistent for all steps */}
        {currentStep > 1 && (
          <button
            onClick={handleBackStep}
            className="flex items-center gap-2 mb-4 text-gray-700 hover-elevate active-elevate-2 px-2 py-1 rounded-md"
            style={{ fontFamily: "Sweet Sans Pro" }}
            data-testid="button-back-step"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium text-xs sm:text-sm">
              {currentStep === 2 ? "Choose Portion Size" : 
               currentStep === 3 ? "Choose Meal Preference" :
               currentStep === 4 ? "Choose Meal Type" :
               currentStep === 5 ? "Build Your MealBox" :
               currentStep === 6 ? "Select Add-Ons" :
               currentStep === 7 ? "Proceed to Payment" :
               ""}
            </span>
          </button>
        )}

        {/* Header with Title and Box Image - Only show on step 1 */}
        {currentStep === 1 && (
          <div className="flex items-start justify-between mb-6 mt-16">
            <div>
              <h1 
                className="font-bold mb-2 text-lg sm:text-xl md:text-2xl"
                style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
              >
                Build Your MealBox
              </h1>
              <p 
                className="text-gray-600 text-xs sm:text-sm"
                style={{ fontFamily: "Sweet Sans Pro" }}
              >
                Select your box size, set preferences,<br />
                and fill it with the dishes you love.
              </p>
            </div>
            <div className="w-24 h-24 flex-shrink-0">
              <img 
                src={mealBoxImage} 
                alt="Meal Box" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        {/* Progress Bar - Show on steps 1-3 */}
        {currentStep <= 3 && (
          <div className="mb-8">
            <div className="flex gap-2">
              <div 
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: currentStep >= 1 ? "#1A9952" : "#E5E7EB" }}
              />
              <div 
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: currentStep >= 2 ? "#1A9952" : "#E5E7EB" }}
              />
              <div 
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: currentStep >= 3 ? "#1A9952" : "#E5E7EB" }}
              />
              <div 
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: currentStep >= 4 ? "#1A9952" : "#E5E7EB" }}
              />
              <div 
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: currentStep >= 5 ? "#1A9952" : "#E5E7EB" }}
              />
              <div 
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: currentStep >= 6 ? "#1A9952" : "#E5E7EB" }}
              />
              <div 
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: currentStep >= 7 ? "#1A9952" : "#E5E7EB" }}
              />
            </div>
          </div>
        )}

          {/* Step 1: Portion Selection */}
          {currentStep === 1 && (
          <div>
            <h2 
              className="font-bold mb-2 text-sm sm:text-base md:text-lg"
              style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
            >
              How big should your meal box be?
            </h2>
            <p 
              className="text-gray-600 mb-6 text-xs sm:text-sm"
              style={{ fontFamily: "Sweet Sans Pro" }}
            >
              Choose how many portions you'd like to include in each box.
            </p>

            {/* Portion Options Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* 3 Portions */}
              <button
                onClick={() => { handleInteraction(); setSelectedPortions(3); }}
                className="bg-white border-2 rounded-2xl p-4 transition-all hover-elevate active-elevate-2"
                style={{
                  borderColor: selectedPortions === 3 ? "#1A9952" : "#E5E7EB"
                }}
                data-testid="portion-option-3"
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-2">
                    <div 
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ 
                        borderColor: "#1A9952",
                        backgroundColor: selectedPortions === 3 ? "#1A9952" : "white"
                      }}
                    >
                      {selectedPortions === 3 && (
                        <Check className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <span 
                      className="font-bold text-sm sm:text-base text-left"
                      style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
                    >
                      3 portions
                    </span>
                  </div>
                  <img src={plate3Portions} alt="3 portions" className="h-auto w-28" />
                </div>
              </button>

              {/* 5 Portions */}
              <button
                onClick={() => { handleInteraction(); setSelectedPortions(5); }}
                className="bg-white border-2 rounded-2xl p-4 transition-all hover-elevate active-elevate-2"
                style={{
                  borderColor: selectedPortions === 5 ? "#1A9952" : "#E5E7EB"
                }}
                data-testid="portion-option-5"
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-2">
                    <div 
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ 
                        borderColor: "#1A9952",
                        backgroundColor: selectedPortions === 5 ? "#1A9952" : "white"
                      }}
                    >
                      {selectedPortions === 5 && (
                        <Check className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <span 
                      className="font-bold text-sm sm:text-base text-left"
                      style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
                    >
                      5 portions
                    </span>
                  </div>
                  <img src={plate5Portions} alt="5 portions" className="h-auto w-28" />
                </div>
              </button>

              {/* 6 Portions */}
              <button
                onClick={() => { handleInteraction(); setSelectedPortions(6); }}
                className="bg-white border-2 rounded-2xl p-4 transition-all hover-elevate active-elevate-2"
                style={{
                  borderColor: selectedPortions === 6 ? "#1A9952" : "#E5E7EB"
                }}
                data-testid="portion-option-6"
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-2">
                    <div 
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ 
                        borderColor: "#1A9952",
                        backgroundColor: selectedPortions === 6 ? "#1A9952" : "white"
                      }}
                    >
                      {selectedPortions === 6 && (
                        <Check className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <span 
                      className="font-bold text-sm sm:text-base text-left"
                      style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
                    >
                      6 portions
                    </span>
                  </div>
                  <img src={plate6Portions} alt="6 portions" className="h-auto w-28" />
                </div>
              </button>

              {/* 8 Portions */}
              <button
                onClick={() => { handleInteraction(); setSelectedPortions(8); }}
                className="bg-white border-2 rounded-2xl p-4 transition-all hover-elevate active-elevate-2"
                style={{
                  borderColor: selectedPortions === 8 ? "#1A9952" : "#E5E7EB"
                }}
                data-testid="portion-option-8"
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-2">
                    <div 
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ 
                        borderColor: "#1A9952",
                        backgroundColor: selectedPortions === 8 ? "#1A9952" : "white"
                      }}
                    >
                      {selectedPortions === 8 && (
                        <Check className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <span 
                      className="font-bold text-sm sm:text-base text-left"
                      style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
                    >
                      8 portions
                    </span>
                  </div>
                  <img src={plate8Portions} alt="8 portions" className="h-auto w-28" />
                </div>
              </button>
            </div>

            {/* Next Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleNextStep}
                className="px-4 py-2 text-base font-semibold border-0"
                style={{ 
                  fontFamily: "Sweet Sans Pro",
                  backgroundColor: "#1A9952",
                  borderRadius: "10px"
                }}
                data-testid="button-next"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
          )}

          {/* Step 2: Meal Preferences */}
          {currentStep === 2 && (
          <div>
            {/* What's your meal preference? */}
            <div className="mb-4">
              <h2 
                className="font-bold mb-1.5 text-sm sm:text-base"
                style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
              >
                What's your meal preference?
              </h2>
              <p 
                className="text-gray-600 mb-3 text-xs"
                style={{ fontFamily: "Sweet Sans Pro" }}
              >
                Tell us how you'd like your boxes prepared.
              </p>

              {/* Meal Preference Options */}
              <div className="grid grid-cols-3 gap-2 mb-1.5">
                <button
                  onClick={() => { handleInteraction(); setMealPreference("veg"); }}
                  className="flex items-center gap-1.5 px-2 py-2.5 rounded-lg border-2 hover-elevate active-elevate-2"
                  style={{
                    borderColor: mealPreference === "veg" ? "#1A9952" : "#E5E7EB",
                    backgroundColor: mealPreference === "veg" ? "#F0F9F4" : "white"
                  }}
                  data-testid="preference-veg"
                >
                  <div 
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ 
                      borderColor: "#1A9952",
                      backgroundColor: mealPreference === "veg" ? "#1A9952" : "white"
                    }}
                  >
                    {mealPreference === "veg" && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="font-semibold text-xs sm:text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    VEG
                  </span>
                </button>

                <button
                  onClick={() => { handleInteraction(); setMealPreference("egg"); }}
                  className="flex items-center gap-1.5 px-2 py-2.5 rounded-lg border-2 hover-elevate active-elevate-2"
                  style={{
                    borderColor: mealPreference === "egg" ? "#F97316" : "#E5E7EB",
                    backgroundColor: mealPreference === "egg" ? "#FFF7ED" : "white"
                  }}
                  data-testid="preference-egg"
                >
                  <div 
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ 
                      borderColor: "#F97316",
                      backgroundColor: mealPreference === "egg" ? "#F97316" : "white"
                    }}
                  >
                    {mealPreference === "egg" && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="font-semibold text-xs sm:text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    EGG
                  </span>
                </button>

                <button
                  onClick={() => { handleInteraction(); setMealPreference("non-veg"); }}
                  className="flex items-center gap-1.5 px-2 py-2.5 rounded-lg border-2 hover-elevate active-elevate-2"
                  style={{
                    borderColor: mealPreference === "non-veg" ? "#DC2626" : "#E5E7EB",
                    backgroundColor: mealPreference === "non-veg" ? "#FEF2F2" : "white"
                  }}
                  data-testid="preference-non-veg"
                >
                  <div 
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ 
                      borderColor: "#DC2626",
                      backgroundColor: mealPreference === "non-veg" ? "#DC2626" : "white"
                    }}
                  >
                    {mealPreference === "non-veg" && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="font-semibold text-xs sm:text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    NON-VEG
                  </span>
                </button>
              </div>

              <p 
                className="text-gray-500 text-[9px] sm:text-[10px]"
                style={{ fontFamily: "Sweet Sans Pro" }}
              >Choose Egg to create a mix of Veg and Egg if needed. Choose Non-Veg to create a mix of all three if needed.</p>
            </div>

            {/* How many people are you ordering for? */}
            <div className="mb-8">
              <h2 
                className="font-bold mb-2 text-sm sm:text-base md:text-lg"
                style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
              >
                How many people are you ordering for?
              </h2>
              <p 
                className="text-gray-600 mb-4 text-xs sm:text-sm"
                style={{ fontFamily: "Sweet Sans Pro" }}
              >
                Enter the number of boxes you'll need.
              </p>

              {/* Number Inputs - Conditional based on preference */}
              <div className="flex gap-2 mb-2">
                {/* VEG Box Input - Show for all preferences */}
                {(mealPreference === "veg" || mealPreference === "egg" || mealPreference === "non-veg") && (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div 
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: "#1A9952" }}
                    >
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: "#1A9952" }}></div>
                    </div>
                    <input
                      type="text"
                      value={vegBoxes}
                      onChange={(e) => handleVegBoxesChange(e.target.value)}
                      className="w-full px-2 py-2 border-2 rounded-lg text-center font-bold text-xs sm:text-sm"
                      style={{ 
                        fontFamily: "Sweet Sans Pro",
                        borderColor: "#1A9952",
                        color: "#1A9952"
                      }}
                      placeholder="0"
                      data-testid="input-veg-boxes"
                    />
                  </div>
                )}

                {/* EGG Box Input - Show for egg and non-veg */}
                {(mealPreference === "egg" || mealPreference === "non-veg") && (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div 
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: "#F97316" }}
                    >
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: "#F97316" }}></div>
                    </div>
                    <input
                      type="text"
                      value={eggBoxes}
                      onChange={(e) => handleEggBoxesChange(e.target.value)}
                      className="w-full px-2 py-2 border-2 rounded-lg text-center font-bold text-xs sm:text-sm"
                      style={{ 
                        fontFamily: "Sweet Sans Pro",
                        borderColor: "#F97316",
                        color: "#F97316"
                      }}
                      placeholder="0"
                      data-testid="input-egg-boxes"
                    />
                  </div>
                )}

                {/* NON-VEG Box Input - Show only for non-veg */}
                {mealPreference === "non-veg" && (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div 
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      style={{ borderColor: "#DC2626" }}
                    >
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: "#DC2626" }}></div>
                    </div>
                    <input
                      type="text"
                      value={nonVegBoxes}
                      onChange={(e) => handleNonVegBoxesChange(e.target.value)}
                      className="w-full px-2 py-2 border-2 rounded-lg text-center font-bold text-xs sm:text-sm"
                      style={{ 
                        fontFamily: "Sweet Sans Pro",
                        borderColor: "#DC2626",
                        color: "#DC2626"
                      }}
                      placeholder="0"
                      data-testid="input-non-veg-boxes"
                    />
                  </div>
                )}
              </div>
              
              <p 
                className="text-gray-500 text-[10px] sm:text-xs mt-2"
                style={{ fontFamily: "Sweet Sans Pro" }}
              >Enter "0" for any dietary options not required.</p>
            </div>

            {/* Next Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleNextStep}
                className="px-4 py-2 text-sm sm:text-base font-semibold border-0"
                style={{ 
                  fontFamily: "Sweet Sans Pro",
                  backgroundColor: "#1A9952",
                  borderRadius: "10px"
                }}
                data-testid="button-next"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
          )}

          {/* Step 3: Meal Type Selection */}
          {currentStep === 3 && (
          <div>
            {/* What kind of food are you serving? */}
            <div className="mb-8">
              <h2 
                className="font-bold mb-6 text-sm sm:text-base md:text-lg"
                style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
              >
                What kind of food are you serving for your event?
              </h2>

              {/* Meal Type Options Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Hi-Tea */}
                <button
                  onClick={() => setSelectedMealType("hi-tea")}
                  className="flex items-center gap-2 px-2 sm:px-3 md:px-4 py-3 sm:py-4 rounded-lg border-2 hover-elevate active-elevate-2"
                  style={{
                    borderColor: selectedMealType === "hi-tea" ? "#1A9952" : "#E5E7EB",
                    backgroundColor: "white"
                  }}
                  data-testid="meal-type-hi-tea"
                >
                  <div 
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ 
                      borderColor: "#1A9952",
                      backgroundColor: selectedMealType === "hi-tea" ? "#1A9952" : "white"
                    }}
                  >
                    {selectedMealType === "hi-tea" && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <img src={hiTeaIcon} alt="Hi-Tea" className="w-7 h-7 sm:w-8 sm:h-8 object-contain flex-shrink-0" />
                  <span className="font-semibold text-xs sm:text-sm whitespace-nowrap" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Hi-Tea
                  </span>
                </button>

                {/* Breakfast */}
                <button
                  onClick={() => setSelectedMealType("breakfast")}
                  className="flex items-center gap-2 px-2 sm:px-3 md:px-4 py-3 sm:py-4 rounded-lg border-2 hover-elevate active-elevate-2"
                  style={{
                    borderColor: selectedMealType === "breakfast" ? "#1A9952" : "#E5E7EB",
                    backgroundColor: "white"
                  }}
                  data-testid="meal-type-breakfast"
                >
                  <div 
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ 
                      borderColor: "#1A9952",
                      backgroundColor: selectedMealType === "breakfast" ? "#1A9952" : "white"
                    }}
                  >
                    {selectedMealType === "breakfast" && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <img src={breakfastIcon} alt="Breakfast" className="w-7 h-7 sm:w-8 sm:h-8 object-contain flex-shrink-0" />
                  <span className="font-semibold text-xs sm:text-sm whitespace-nowrap" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Breakfast
                  </span>
                </button>

                {/* Lunch */}
                <button
                  onClick={() => setSelectedMealType("lunch")}
                  className="flex items-center gap-2 px-2 sm:px-3 md:px-4 py-3 sm:py-4 rounded-lg border-2 hover-elevate active-elevate-2"
                  style={{
                    borderColor: selectedMealType === "lunch" ? "#1A9952" : "#E5E7EB",
                    backgroundColor: "white"
                  }}
                  data-testid="meal-type-lunch"
                >
                  <div 
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ 
                      borderColor: "#1A9952",
                      backgroundColor: selectedMealType === "lunch" ? "#1A9952" : "white"
                    }}
                  >
                    {selectedMealType === "lunch" && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <img src={lunchIcon} alt="Lunch" className="w-7 h-7 sm:w-8 sm:h-8 object-contain flex-shrink-0" />
                  <span className="font-semibold text-xs sm:text-sm whitespace-nowrap" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Lunch
                  </span>
                </button>

                {/* Dinner */}
                <button
                  onClick={() => setSelectedMealType("dinner")}
                  className="flex items-center gap-2 px-2 sm:px-3 md:px-4 py-3 sm:py-4 rounded-lg border-2 hover-elevate active-elevate-2"
                  style={{
                    borderColor: selectedMealType === "dinner" ? "#1A9952" : "#E5E7EB",
                    backgroundColor: "white"
                  }}
                  data-testid="meal-type-dinner"
                >
                  <div 
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{ 
                      borderColor: "#1A9952",
                      backgroundColor: selectedMealType === "dinner" ? "#1A9952" : "white"
                    }}
                  >
                    {selectedMealType === "dinner" && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <img src={dinnerIcon} alt="Dinner" className="w-7 h-7 sm:w-8 sm:h-8 object-contain flex-shrink-0" />
                  <span className="font-semibold text-xs sm:text-sm whitespace-nowrap" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Dinner
                  </span>
                </button>
              </div>
            </div>

            {/* Next Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleNextStep}
                className="px-4 py-2 text-base font-semibold border-0"
                style={{ 
                  fontFamily: "Sweet Sans Pro",
                  backgroundColor: "#1A9952",
                  borderRadius: "10px"
                }}
                data-testid="button-next"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
          )}

        {/* Step 4: Choose Food Category */}
        {currentStep === 4 && (
        <div className="space-y-6">
            {/* Sticky Proceed Card */}
            <div className="sticky top-0 z-50 -mx-4 px-4 pb-4" style={{ backgroundColor: "white", paddingTop: "0.5rem" }}>
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: "#1A9952" }}>
              <div className="flex items-center gap-3">
                <img src={mealBoxImage} alt="Meal Box" className="w-12 h-12 object-contain" />
                <div>
                  <p className="text-white font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro" }}>
                    Proceed By Creating
                  </p>
                  <p className="text-white font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro" }}>
                    Your Meal Box
                  </p>
                </div>
              </div>
                <Button
                  onClick={handleNextStep}
                  disabled={!allSlotsFilled}
                  className="px-4 py-2 text-sm font-semibold border-0"
                  style={{ 
                    fontFamily: "Sweet Sans Pro",
                    color: allSlotsFilled ? "#1A9952" : "#9CA3AF",
                    backgroundColor: allSlotsFilled ? "white" : "#E5E7EB",
                    borderRadius: "8px",
                    cursor: allSlotsFilled ? "pointer" : "not-allowed",
                    opacity: allSlotsFilled ? 1 : 0.6
                  }}
                  data-testid="button-proceed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Sticky Search Bar for Step 4 */}
            <div className="sticky z-40 bg-gray-50 pb-2 -mx-4 px-4" style={{ top: "100px", paddingTop: "0.25rem" }}>
              <div className="flex items-center gap-2 bg-white px-4 py-3 border border-gray-200" style={{ borderRadius: "10px" }}>
                <Search className="w-6 h-6 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search"
                  className="flex-1 outline-none text-base bg-transparent"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-search-step4"
                />
              </div>
            </div>

            {/* Header with Sort and Filter */}
            <div className="flex items-center justify-between mb-4">
              <h2 
                className="font-bold text-[14px]"
                style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
              >
                Choose Food Category
              </h2>
              <div className="flex items-center gap-2">
                {/* Sort Button with Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowSortDropdown(!showSortDropdown);
                      setShowFilterDropdown(false);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md hover-elevate active-elevate-2 bg-white"
                    data-testid="button-sort"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="text-sm font-medium" style={{ fontFamily: "Sweet Sans Pro" }}>Sort</span>
                  </button>
                  
                  {showSortDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSelectedSort("popular");
                            setShowSortDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover-elevate"
                          style={{ 
                            fontFamily: "Sweet Sans Pro",
                            backgroundColor: selectedSort === "popular" ? "#F0FDF4" : "white",
                            color: selectedSort === "popular" ? "#1A9952" : "#06352A"
                          }}
                        >
                          Popular
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSort("price-low-high");
                            setShowSortDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover-elevate"
                          style={{ 
                            fontFamily: "Sweet Sans Pro",
                            backgroundColor: selectedSort === "price-low-high" ? "#F0FDF4" : "white",
                            color: selectedSort === "price-low-high" ? "#1A9952" : "#06352A"
                          }}
                        >
                          Price: Low to High
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSort("price-high-low");
                            setShowSortDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover-elevate"
                          style={{ 
                            fontFamily: "Sweet Sans Pro",
                            backgroundColor: selectedSort === "price-high-low" ? "#F0FDF4" : "white",
                            color: selectedSort === "price-high-low" ? "#1A9952" : "#06352A"
                          }}
                        >
                          Price: High to Low
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSort("rating");
                            setShowSortDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover-elevate"
                          style={{ 
                            fontFamily: "Sweet Sans Pro",
                            backgroundColor: selectedSort === "rating" ? "#F0FDF4" : "white",
                            color: selectedSort === "rating" ? "#1A9952" : "#06352A"
                          }}
                        >
                          Rating
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Filter Button with Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setShowFilterDropdown(!showFilterDropdown);
                      setShowSortDropdown(false);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-md hover-elevate active-elevate-2 bg-white"
                    data-testid="button-filter"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="text-sm font-medium" style={{ fontFamily: "Sweet Sans Pro" }}>Filter</span>
                  </button>
                  
                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSelectedFilter("all");
                            setShowFilterDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover-elevate"
                          style={{ 
                            fontFamily: "Sweet Sans Pro",
                            backgroundColor: selectedFilter === "all" ? "#F0FDF4" : "white",
                            color: selectedFilter === "all" ? "#1A9952" : "#06352A"
                          }}
                        >
                          All Items
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFilter("veg-only");
                            setShowFilterDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover-elevate"
                          style={{ 
                            fontFamily: "Sweet Sans Pro",
                            backgroundColor: selectedFilter === "veg-only" ? "#F0FDF4" : "white",
                            color: selectedFilter === "veg-only" ? "#1A9952" : "#06352A"
                          }}
                        >
                          Veg Only
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFilter("non-veg-only");
                            setShowFilterDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover-elevate"
                          style={{ 
                            fontFamily: "Sweet Sans Pro",
                            backgroundColor: selectedFilter === "non-veg-only" ? "#F0FDF4" : "white",
                            color: selectedFilter === "non-veg-only" ? "#1A9952" : "#06352A"
                          }}
                        >
                          Non-Veg Only
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFilter("under-200");
                            setShowFilterDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover-elevate"
                          style={{ 
                            fontFamily: "Sweet Sans Pro",
                            backgroundColor: selectedFilter === "under-200" ? "#F0FDF4" : "white",
                            color: selectedFilter === "under-200" ? "#1A9952" : "#06352A"
                          }}
                        >
                          Under ₹200
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Helper text explaining template behavior */}
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-gray-700 text-[12px]" style={{ fontFamily: "Sweet Sans Pro" }}>
                {currentDietaryTab === "veg" && parseInt(vegBoxes) > 0 && (
                  <>Select {selectedPortions} items for your VEG box. This selection will apply to all {vegBoxes} VEG boxes.</>
                )}
                {currentDietaryTab === "egg" && parseInt(eggBoxes) > 0 && (
                  <>Select {selectedPortions} items for your EGG box. This selection will apply to all {eggBoxes} EGG boxes.</>
                )}
                {currentDietaryTab === "non-veg" && parseInt(nonVegBoxes) > 0 && (
                  <>Select {selectedPortions} items for your NON-VEG box. This selection will apply to all {nonVegBoxes} NON-VEG boxes.</>
                )}
              </p>
            </div>

            {/* Veg/Egg/Non-Veg Filter - Only show active dietary preferences */}
            <div className="flex gap-3 mb-4 px-4 py-3 bg-gray-50 rounded-full border-2 border-gray-200">
              {activeDietaryPreferences.includes("veg") && (
                <button
                  onClick={() => { setCurrentDietaryTab("veg"); setSelectedSlotIndex(0); }}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-full flex-1 transition-all text-[14px]"
                  style={{
                    backgroundColor: currentDietaryTab === "veg" ? "white" : "transparent",
                    boxShadow: currentDietaryTab === "veg" ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
                  }}
                  data-testid="filter-veg"
                >
                  <div 
                    className="w-4 h-4 border-2 flex items-center justify-center"
                    style={{ 
                      borderColor: "#1A9952",
                      backgroundColor: "white"
                    }}
                  >
                    <div 
                      className="w-2 h-2"
                      style={{ backgroundColor: "#1A9952" }}
                    />
                  </div>
                  <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Veg
                  </span>
                </button>
              )}
              {activeDietaryPreferences.includes("egg") && (
                <button
                  onClick={() => { setCurrentDietaryTab("egg"); setSelectedSlotIndex(0); }}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-full flex-1 transition-all"
                  style={{
                    backgroundColor: currentDietaryTab === "egg" ? "white" : "transparent",
                    boxShadow: currentDietaryTab === "egg" ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
                  }}
                  data-testid="filter-egg"
                >
                  <div 
                    className="w-4 h-4 border-2 flex items-center justify-center"
                    style={{ 
                      borderColor: "#F97316",
                      backgroundColor: "white"
                    }}
                  >
                    <div 
                      className="w-2 h-2"
                      style={{ backgroundColor: "#F97316" }}
                    />
                  </div>
                  <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Egg
                  </span>
                </button>
              )}
              {activeDietaryPreferences.includes("non-veg") && (
                <button
                  onClick={() => { setCurrentDietaryTab("non-veg"); setSelectedSlotIndex(0); }}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-full flex-1 transition-all"
                  style={{
                    backgroundColor: currentDietaryTab === "non-veg" ? "white" : "transparent",
                    boxShadow: currentDietaryTab === "non-veg" ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
                  }}
                  data-testid="filter-non-veg"
                >
                  <div 
                    className="w-4 h-4 border-2 flex items-center justify-center"
                    style={{ 
                      borderColor: "#DC2626",
                      backgroundColor: "white"
                    }}
                  >
                    <div 
                      className="w-2 h-2"
                      style={{ backgroundColor: "#DC2626" }}
                    />
                  </div>
                  <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Non Veg
                  </span>
                </button>
              )}
            </div>

            {/* Item Selection Slots - Dynamic based on current dietary tab */}
            <div className="flex flex-row gap-3 mb-6 overflow-x-auto pb-2">
              {currentPlateSelections.map((selection, idx) => {
                const isActive = idx === selectedSlotIndex;
                const isFilled = selection.itemId !== null;
                const foodType = selection.item?.type;
                const typeColor = foodType === "veg" ? "#1A9952" : foodType === "egg" ? "#F97316" : "#DC2626";
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleSlotClick(idx)}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover-elevate active-elevate-2 flex-shrink-0"
                    style={{
                      borderColor: isActive ? "#1A9952" : isFilled ? "#E5E7EB" : "#D1D5DB",
                      backgroundColor: isFilled ? "white" : isActive ? "#F0FDF4" : "white",
                      boxShadow: isActive ? "0 2px 8px rgba(26, 153, 82, 0.2)" : "none",
                      minWidth: "140px"
                    }}
                    data-testid={`slot-item-${idx + 1}`}
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: isFilled ? "#F3F4F6" : "#E5E7EB" }}
                    >
                      {isFilled ? (
                        <div 
                          className="w-4 h-4 border-2 flex items-center justify-center"
                          style={{ 
                            borderColor: typeColor,
                            backgroundColor: "white"
                          }}
                        >
                          <div 
                            className="w-2 h-2"
                            style={{ backgroundColor: typeColor }}
                          />
                        </div>
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <span className="text-xs font-semibold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        {isFilled ? selection.item?.name : `Item ${idx + 1}`}
                      </span>
                      {isFilled && selection.item && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-[9px] sm:text-[10px] text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                            {selection.item.rating}
                          </span>
                        </div>
                      )}
                      {!isFilled && isActive && (
                        <span className="text-[9px] sm:text-[10px] text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                          Select below
                        </span>
                      )}
                      {!isFilled && !isActive && (
                        <span className="text-[9px] sm:text-[10px] text-gray-400" style={{ fontFamily: "Sweet Sans Pro" }}>
                          0/1
                        </span>
                      )}
                    </div>
                    {isFilled && (
                      <Check className="w-4 h-4 flex-shrink-0 absolute top-2 right-2" style={{ color: "#1A9952" }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Category Sidebar + Food Grid Container */}
            <div className="flex gap-4">
              {/* Left Category Sidebar */}
              <div className="sticky flex flex-col gap-2 self-start" style={{ width: "90px", top: "200px" }}>
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all"
                  style={{ backgroundColor: selectedCategory === "all" ? "#1A9952" : "transparent" }}
                  data-testid="category-all"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                    <span className="text-2xl">🍽️</span>
                  </div>
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-center leading-tight" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "all" ? "white" : "#06352A" }}>
                    All
                  </span>
                </button>

                <button
                  onClick={() => setSelectedCategory("appetizers")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all"
                  style={{ backgroundColor: selectedCategory === "appetizers" ? "#1A9952" : "transparent" }}
                  data-testid="category-appetizers"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                    <span className="text-2xl">🥗</span>
                  </div>
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-center leading-tight" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "appetizers" ? "white" : "#06352A" }}>
                    Appetizers
                  </span>
                </button>

                <button
                  onClick={() => setSelectedCategory("rice")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all"
                  style={{ backgroundColor: selectedCategory === "rice" ? "#1A9952" : "transparent" }}
                  data-testid="category-rice"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                    <span className="text-2xl">🍚</span>
                  </div>
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-center leading-tight" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "rice" ? "white" : "#06352A" }}>
                    Rice
                  </span>
                </button>

                <button
                  onClick={() => setSelectedCategory("entree")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all"
                  style={{ backgroundColor: selectedCategory === "entree" ? "#1A9952" : "transparent" }}
                  data-testid="category-entree"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                    <span className="text-2xl">🍛</span>
                  </div>
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-center leading-tight" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "entree" ? "white" : "#06352A" }}>
                    Entree
                  </span>
                </button>

                <button
                  onClick={() => setSelectedCategory("roti")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all"
                  style={{ backgroundColor: selectedCategory === "roti" ? "#1A9952" : "transparent" }}
                  data-testid="category-roti"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                    <span className="text-2xl">🫓</span>
                  </div>
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-center leading-tight" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "roti" ? "white" : "#06352A" }}>
                    Roti
                  </span>
                </button>

                <button
                  onClick={() => setSelectedCategory("biryani")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all"
                  style={{ backgroundColor: selectedCategory === "biryani" ? "#1A9952" : "transparent" }}
                  data-testid="category-biryani"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                    <span className="text-2xl">🍛</span>
                  </div>
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-center leading-tight" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "biryani" ? "white" : "#06352A" }}>
                    Biryani
                  </span>
                </button>

                <button
                  onClick={() => setSelectedCategory("dessert")}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg transition-all"
                  style={{ backgroundColor: selectedCategory === "dessert" ? "#1A9952" : "transparent" }}
                  data-testid="category-dessert"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FFF3E0] flex items-center justify-center">
                    <span className="text-2xl">🍰</span>
                  </div>
                  <span className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-center leading-tight" style={{ fontFamily: "Sweet Sans Pro", color: selectedCategory === "dessert" ? "white" : "#06352A" }}>
                    Dessert
                  </span>
                </button>
              </div>

              {/* Right Content Area */}
              <div className="flex-1">
                {/* Subcategory Options */}
                <div className="sticky top-[120px] z-30 bg-white pt-3 pb-2 -mx-1 px-1 rounded-lg shadow-sm">
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

                {/* Food Items Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {filteredItems.map((item) => {
                    const currentSelections = getCurrentPlateSelections();
                    const isSelected = currentSelections.some(sel => sel.itemId === item.id);
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`bg-white rounded-lg border overflow-hidden relative ${
                          isSelected ? 'border-[#1A9952] border-2' : 'border-gray-200'
                        }`}
                      >
                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 z-10">
                            <div className="w-6 h-6 bg-[#1A9952] rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                        
                        {/* Food Image Placeholder */}
                        <div className="relative" style={{ paddingTop: "100%" }}>
                          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                            <UtensilsCrossed className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
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
                          
                          {/* Price and Add Button */}
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-xs sm:text-sm md:text-base font-bold flex-shrink-0" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                              ₹{item.price}
                            </span>
                            <Button
                              onClick={() => handleItemSelection(item)}
                              className="px-2 sm:px-3 md:px-4 py-1 text-[10px] sm:text-xs font-semibold border-0 min-h-0 h-auto"
                              style={{ 
                                fontFamily: "Sweet Sans Pro",
                                backgroundColor: isSelected ? "#D1D5DB" : "#1A9952",
                                color: isSelected ? "#6B7280" : "white",
                                borderRadius: "6px",
                                cursor: "pointer",
                              }}
                              data-testid={`button-add-${item.id}`}
                            >
                              {isSelected ? "SELECTED" : "ADD"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Cart Details */}
        {currentStep === 5 && (
          <div className="pb-24">
            {/* Sticky Cart Total Bar */}
            <div 
              className="sticky top-0 z-50 bg-white border-b border-gray-200 -mx-4 px-4 py-3 mb-4"
              style={{ 
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-base sm:text-lg" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Cart Details
                  </h2>
                  <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                    For a {selectedPortions} Portion MealBox
                  </p>
                </div>
                <button 
                  onClick={() => setCurrentStep(6)}
                  className="px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 hover-elevate active-elevate-2 transition-all"
                  style={{ backgroundColor: "#1A9952" }}
                  data-testid="button-proceed-cart"
                >
                  <span className="text-white font-bold text-sm sm:text-base" style={{ fontFamily: "Sweet Sans Pro" }}>
                    ₹{(() => {
                      const vegCount = parseInt(vegBoxes) || 0;
                      const eggCount = parseInt(eggBoxes) || 0;
                      const nonVegCount = parseInt(nonVegBoxes) || 0;
                      
                      // Calculate total for each dietary type separately
                      const vegTotal = vegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * vegCount;
                      const eggTotal = eggPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * eggCount;
                      const nonVegTotal = nonVegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * nonVegCount;
                      
                      const subtotal = vegTotal + eggTotal + nonVegTotal;
                      const gst = Math.round(subtotal * 0.18);
                      const platformFee = 499;
                      const packagingFee = 399;
                      const grandTotal = subtotal + gst + platformFee + packagingFee;
                      return grandTotal.toLocaleString('en-IN');
                    })()}
                  </span>
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Receipt Container */}
            <div 
              className="relative bg-white rounded-lg p-4 sm:p-6"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 20px,
                    rgba(0,0,0,0.03) 20px,
                    rgba(0,0,0,0.03) 21px
                  )
                `,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)"
              }}
            >
              {/* Receipt Header */}
              <div className="text-center mb-6 pb-4 border-b-2 border-dashed border-gray-300">
                <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  ORDER SUMMARY
                </h3>
                <p className="text-xs text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

            {/* Veg Section */}
            {parseInt(vegBoxes) > 0 && vegPlateSelections.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-4 h-4 border-2 flex items-center justify-center"
                    style={{ borderColor: "#1A9952", backgroundColor: "white" }}
                  >
                    <div className="w-2 h-2" style={{ backgroundColor: "#1A9952" }} />
                  </div>
                  <span className="font-semibold text-sm sm:text-base" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Veg
                  </span>
                  <span className="font-bold text-sm sm:text-base ml-auto" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    ×{vegBoxes}
                  </span>
                </div>

                {/* Veg Items */}
                <div className="space-y-3 mb-3">
                  {vegPlateSelections.map((selection, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs sm:text-sm truncate" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                          {selection.item?.name || "Item"}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                          Item {index + 1}
                        </p>
                      </div>
                      <span className="font-semibold text-xs sm:text-sm flex-shrink-0" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        ₹{selection.item?.price || 0}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total per MealBox */}
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg mb-2">
                  <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                      Total
                    </p>
                    <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                      per MealBox
                    </p>
                  </div>
                  <span className="font-bold text-base" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    ₹{vegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0)}
                  </span>
                </div>

                {/* Total for All Veg MealBoxes */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                      Total
                    </p>
                    <span className="font-bold text-lg" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                      ₹{(vegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * parseInt(vegBoxes)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                    For {vegBoxes} Veg MealBoxes
                  </p>
                </div>
              </div>
            )}

            {/* Egg Section */}
            {parseInt(eggBoxes) > 0 && eggPlateSelections.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-4 h-4 border-2 flex items-center justify-center"
                    style={{ borderColor: "#F97316", backgroundColor: "white" }}
                  >
                    <div className="w-2 h-2" style={{ backgroundColor: "#F97316" }} />
                  </div>
                  <span className="font-semibold text-sm sm:text-base" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Egg
                  </span>
                  <span className="font-bold text-sm sm:text-base ml-auto" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    ×{eggBoxes}
                  </span>
                </div>

                {/* Egg Items */}
                <div className="space-y-3 mb-3">
                  {eggPlateSelections.map((selection, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs sm:text-sm truncate" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                          {selection.item?.name || "Item"}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                          Item {index + 1}
                        </p>
                      </div>
                      <span className="font-semibold text-xs sm:text-sm flex-shrink-0" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        ₹{selection.item?.price || 0}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total per MealBox */}
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg mb-2">
                  <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                      Total
                    </p>
                    <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                      per MealBox
                    </p>
                  </div>
                  <span className="font-bold text-base" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    ₹{eggPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0)}
                  </span>
                </div>

                {/* Total for All Egg MealBoxes */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                      Total
                    </p>
                    <span className="font-bold text-lg" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                      ₹{(eggPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * parseInt(eggBoxes)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                    For {eggBoxes} Egg MealBoxes
                  </p>
                </div>
              </div>
            )}

            {/* Non-Veg Section */}
            {parseInt(nonVegBoxes) > 0 && nonVegPlateSelections.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-4 h-4 border-2 flex items-center justify-center"
                    style={{ borderColor: "#DC2626", backgroundColor: "white" }}
                  >
                    <div className="w-2 h-2" style={{ backgroundColor: "#DC2626" }} />
                  </div>
                  <span className="font-semibold text-sm sm:text-base" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Non-Veg
                  </span>
                  <span className="font-bold text-sm sm:text-base ml-auto" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    ×{nonVegBoxes}
                  </span>
                </div>

                {/* Non-Veg Items */}
                <div className="space-y-3 mb-3">
                  {nonVegPlateSelections.map((selection, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs sm:text-sm truncate" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                          {selection.item?.name || "Item"}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                          Item {index + 1}
                        </p>
                      </div>
                      <span className="font-semibold text-xs sm:text-sm flex-shrink-0" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        ₹{selection.item?.price || 0}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total per MealBox */}
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg mb-2">
                  <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
                    <Package className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                      Total
                    </p>
                    <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                      per MealBox
                    </p>
                  </div>
                  <span className="font-bold text-base" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    ₹{nonVegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0)}
                  </span>
                </div>

                {/* Total for All Non-Veg MealBoxes */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                      Total
                    </p>
                    <span className="font-bold text-lg" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                      ₹{(nonVegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * parseInt(nonVegBoxes)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                    For {nonVegBoxes} Non-Veg MealBoxes
                  </p>
                </div>
              </div>
            )}

            {/* Total Amount Section */}
            <div className="border-t-2 border-b-2 border-gray-200 py-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-base" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                  Total Amount
                </span>
                <span className="font-bold text-lg" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                  ₹{(() => {
                    const vegCount = parseInt(vegBoxes) || 0;
                    const eggCount = parseInt(eggBoxes) || 0;
                    const nonVegCount = parseInt(nonVegBoxes) || 0;
                    const vegTotal = vegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * vegCount;
                    const eggTotal = eggPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * eggCount;
                    const nonVegTotal = nonVegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * nonVegCount;
                    return (vegTotal + eggTotal + nonVegTotal).toLocaleString('en-IN');
                  })()}
                </span>
              </div>
            </div>

            {/* Fees Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700" style={{ fontFamily: "Sweet Sans Pro" }}>
                  GST
                </span>
                <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  ₹{(() => {
                    const vegCount = parseInt(vegBoxes) || 0;
                    const eggCount = parseInt(eggBoxes) || 0;
                    const nonVegCount = parseInt(nonVegBoxes) || 0;
                    const vegTotal = vegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * vegCount;
                    const eggTotal = eggPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * eggCount;
                    const nonVegTotal = nonVegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * nonVegCount;
                    const subtotal = vegTotal + eggTotal + nonVegTotal;
                    return Math.round(subtotal * 0.18).toLocaleString('en-IN');
                  })()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700" style={{ fontFamily: "Sweet Sans Pro" }}>
                  Platform Fee
                </span>
                <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  ₹499
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700" style={{ fontFamily: "Sweet Sans Pro" }}>
                  Packaging & Handling Fee
                </span>
                <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  ₹399
                </span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                  Grand Total
                </span>
                <span className="font-bold text-2xl" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                  ₹{(() => {
                    const vegCount = parseInt(vegBoxes) || 0;
                    const eggCount = parseInt(eggBoxes) || 0;
                    const nonVegCount = parseInt(nonVegBoxes) || 0;
                    const vegTotal = vegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * vegCount;
                    const eggTotal = eggPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * eggCount;
                    const nonVegTotal = nonVegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * nonVegCount;
                    const subtotal = vegTotal + eggTotal + nonVegTotal;
                    const gst = Math.round(subtotal * 0.18);
                    const platformFee = 499;
                    const packagingFee = 399;
                    return (subtotal + gst + platformFee + packagingFee).toLocaleString('en-IN');
                  })()}
                </span>
              </div>
            </div>
            </div>

            {/* Select Add-Ons Button */}
            <Button
              onClick={() => {
                console.log("Select Add-Ons clicked, setting step to 6");
                isRestoringRef.current = false; // Ensure we're not in restore mode
                setCurrentStep(6);
              }}
              className="w-full mt-4 py-6 text-lg font-semibold border-0 flex items-center justify-between"
              style={{ 
                fontFamily: "Sweet Sans Pro",
                backgroundColor: "#1A9952",
                color: "white",
                borderRadius: "10px"
              }}
              data-testid="button-select-addons"
            >
              <span>Select Add-Ons</span>
              <span className="flex items-center gap-2">
                ₹{(() => {
                  const vegCount = parseInt(vegBoxes) || 0;
                  const eggCount = parseInt(eggBoxes) || 0;
                  const nonVegCount = parseInt(nonVegBoxes) || 0;
                  const vegTotal = vegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * vegCount;
                  const eggTotal = eggPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * eggCount;
                  const nonVegTotal = nonVegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * nonVegCount;
                  const subtotal = vegTotal + eggTotal + nonVegTotal;
                  const gst = Math.round(subtotal * 0.18);
                  const platformFee = 499;
                  const packagingFee = 399;
                  return (subtotal + gst + platformFee + packagingFee).toLocaleString('en-IN');
                })()}
                <ChevronRight className="w-5 h-5" />
              </span>
            </Button>
          </div>
        )}

        {/* Step 6: Add-Ons */}
        {currentStep === 6 && (
          <div className="pb-24" data-testid="step-6-addons">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex gap-2">
                <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: "#1A9952" }} />
                <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: "#1A9952" }} />
              </div>
            </div>

            {/* Header with Skip Button */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Select Add-Ons
                </h2>
                <p className="text-sm text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                  For a {selectedPortions} Portion MealBox
                </p>
              </div>
              <Button
                onClick={() => setCurrentStep(7)}
                variant="ghost"
                className="text-sm font-semibold px-4 py-2"
                style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}
                data-testid="button-skip-addons"
              >
                SKIP →
              </Button>
            </div>

            {/* Add-Ons List */}
            <div className="space-y-4 mb-6">
              {/* Live Cooking Counters */}
              <div 
                className="flex items-start gap-4 p-4 border-2 rounded-lg"
                style={{ 
                  borderColor: selectedAddOns.includes('cooking') ? "#1A9952" : "#E5E7EB",
                  backgroundColor: selectedAddOns.includes('cooking') ? "#F0F9F4" : "white"
                }}
              >
                <img src={chefHatIcon} alt="Chef" className="w-12 h-12 object-contain flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-base mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Live Cooking Counters
                  </h3>
                  <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                    Professional chefs prepare food live at your event location, offering a unique culinary experience.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedAddOns(prev => 
                      prev.includes('cooking') 
                        ? prev.filter(id => id !== 'cooking')
                        : [...prev, 'cooking']
                    );
                  }}
                  className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: "#1A9952",
                    backgroundColor: selectedAddOns.includes('cooking') ? "#1A9952" : "white"
                  }}
                  data-testid="addon-cooking"
                >
                  {selectedAddOns.includes('cooking') && <Check className="w-4 h-4 text-white" />}
                </button>
              </div>

              {/* Serving Staff */}
              <div 
                className="flex items-start gap-4 p-4 border-2 rounded-lg"
                style={{ 
                  borderColor: selectedAddOns.includes('staff') ? "#1A9952" : "#E5E7EB",
                  backgroundColor: selectedAddOns.includes('staff') ? "#F0F9F4" : "white"
                }}
              >
                <img src={servingStaffIcon} alt="Staff" className="w-12 h-12 object-contain flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-base mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Serving Staff
                  </h3>
                  <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                    Professional serving staff to help set up, serve, and manage your food during the event.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedAddOns(prev => 
                      prev.includes('staff') 
                        ? prev.filter(id => id !== 'staff')
                        : [...prev, 'staff']
                    );
                  }}
                  className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: "#1A9952",
                    backgroundColor: selectedAddOns.includes('staff') ? "#1A9952" : "white"
                  }}
                  data-testid="addon-staff"
                >
                  {selectedAddOns.includes('staff') && <Check className="w-4 h-4 text-white" />}
                </button>
              </div>

              {/* Decor */}
              <div 
                className="flex items-start gap-4 p-4 border-2 rounded-lg"
                style={{ 
                  borderColor: selectedAddOns.includes('decor') ? "#1A9952" : "#E5E7EB",
                  backgroundColor: selectedAddOns.includes('decor') ? "#F0F9F4" : "white"
                }}
              >
                <img src={decorIcon} alt="Decor" className="w-12 h-12 object-contain flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-base mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Decor
                  </h3>
                  <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                    Transform your event space with professional theme-based decoration.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedAddOns(prev => 
                      prev.includes('decor') 
                        ? prev.filter(id => id !== 'decor')
                        : [...prev, 'decor']
                    );
                  }}
                  className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: "#1A9952",
                    backgroundColor: selectedAddOns.includes('decor') ? "#1A9952" : "white"
                  }}
                  data-testid="addon-decor"
                >
                  {selectedAddOns.includes('decor') && <Check className="w-4 h-4 text-white" />}
                </button>
              </div>

              {/* Tableware & Crockery */}
              <div 
                className="flex items-start gap-4 p-4 border-2 rounded-lg"
                style={{ 
                  borderColor: selectedAddOns.includes('tableware') ? "#1A9952" : "#E5E7EB",
                  backgroundColor: selectedAddOns.includes('tableware') ? "#F0F9F4" : "white"
                }}
              >
                <img src={tablewareIcon} alt="Tableware" className="w-12 h-12 object-contain flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-base mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Tableware & Crockery
                  </h3>
                  <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                    Premium biodegradable tableware and cutlery for a sustainable event.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedAddOns(prev => 
                      prev.includes('tableware') 
                        ? prev.filter(id => id !== 'tableware')
                        : [...prev, 'tableware']
                    );
                  }}
                  className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: "#1A9952",
                    backgroundColor: selectedAddOns.includes('tableware') ? "#1A9952" : "white"
                  }}
                  data-testid="addon-tableware"
                >
                  {selectedAddOns.includes('tableware') && <Check className="w-4 h-4 text-white" />}
                </button>
              </div>

              {/* Live Music */}
              <div 
                className="flex items-start gap-4 p-4 border-2 rounded-lg"
                style={{ 
                  borderColor: selectedAddOns.includes('music') ? "#1A9952" : "#E5E7EB",
                  backgroundColor: selectedAddOns.includes('music') ? "#F0F9F4" : "white"
                }}
              >
                <img src={musicIcon} alt="Music" className="w-12 h-12 object-contain flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-base mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Live Music
                  </h3>
                  <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                    Music performance that entertains your guests.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedAddOns(prev => 
                      prev.includes('music') 
                        ? prev.filter(id => id !== 'music')
                        : [...prev, 'music']
                    );
                  }}
                  className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: "#1A9952",
                    backgroundColor: selectedAddOns.includes('music') ? "#1A9952" : "white"
                  }}
                  data-testid="addon-music"
                >
                  {selectedAddOns.includes('music') && <Check className="w-4 h-4 text-white" />}
                </button>
              </div>

              {/* Photography */}
              <div 
                className="flex items-start gap-4 p-4 border-2 rounded-lg"
                style={{ 
                  borderColor: selectedAddOns.includes('photography') ? "#1A9952" : "#E5E7EB",
                  backgroundColor: selectedAddOns.includes('photography') ? "#F0F9F4" : "white"
                }}
              >
                <img src={cameraIcon} alt="Photography" className="w-12 h-12 object-contain flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-base mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Photography
                  </h3>
                  <p className="text-xs text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                    Professional photography to capture memories.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedAddOns(prev => 
                      prev.includes('photography') 
                        ? prev.filter(id => id !== 'photography')
                        : [...prev, 'photography']
                    );
                  }}
                  className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: "#1A9952",
                    backgroundColor: selectedAddOns.includes('photography') ? "#1A9952" : "white"
                  }}
                  data-testid="addon-photography"
                >
                  {selectedAddOns.includes('photography') && <Check className="w-4 h-4 text-white" />}
                </button>
              </div>
            </div>

            {/* Enter Delivery Details Button */}
            <Button
              onClick={() => setCurrentStep(7)}
              className="w-full py-6 text-lg font-semibold border-0"
              style={{ 
                fontFamily: "Sweet Sans Pro",
                backgroundColor: "#1A9952",
                color: "white",
                borderRadius: "10px"
              }}
              data-testid="button-enter-delivery-details"
            >
              Enter Delivery Details →
            </Button>
          </div>
        )}

        {/* Step 7: Proceed to Payment */}
        {currentStep === 7 && (
          <div className="pb-24">
            {/* Header */}
            <h2 className="text-xl sm:text-2xl font-bold mb-6" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              Proceed to Payment
            </h2>

            {/* Total Amount Card */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
              <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                Total Amount to be Paid
              </span>
              <span className="font-bold text-xl" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                ₹{(() => {
                  const vegCount = parseInt(vegBoxes) || 0;
                  const eggCount = parseInt(eggBoxes) || 0;
                  const nonVegCount = parseInt(nonVegBoxes) || 0;
                  const vegTotal = vegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * vegCount;
                  const eggTotal = eggPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * eggCount;
                  const nonVegTotal = nonVegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * nonVegCount;
                  const subtotal = vegTotal + eggTotal + nonVegTotal;
                  const gst = Math.round(subtotal * 0.18);
                  const platformFee = 499;
                  const packagingFee = 399;
                  return (subtotal + gst + platformFee + packagingFee).toLocaleString('en-IN');
                })()}
              </span>
            </div>

            {/* Form */}
            <div className="space-y-4 mb-6">
              {/* Select Event Date & Time */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Select Event Date & Time
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    defaultValue="2025-10-12"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                    data-testid="input-event-date"
                  />
                  <input
                    type="time"
                    defaultValue="12:00"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                    data-testid="input-event-time"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Enter Your Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98552 12375"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-phone"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Enter Your Email Address
                </label>
                <input
                  type="email"
                  placeholder="test@gmail.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-email"
                />
              </div>

              {/* Choose Saved Address */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Choose Saved Address
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="select-saved-address"
                >
                  <option value="">Select Address</option>
                  <option value="home">Home Address</option>
                  <option value="office">Office Address</option>
                </select>
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Address Line 1
                </label>
                <input
                  type="text"
                  placeholder="Door No. 32, Jaya Prakash Nagar"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-address-line1"
                />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Address Line 2
                </label>
                <input
                  type="text"
                  placeholder="Near Metro Station, JP Nagar"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-address-line2"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  City
                </label>
                <input
                  type="text"
                  placeholder="Bengaluru"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-city"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  State
                </label>
                <input
                  type="text"
                  placeholder="Karnataka"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-state"
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Pincode
                </label>
                <input
                  type="text"
                  placeholder="450003"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-pincode"
                />
              </div>

              {/* Save Address Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-2 border-gray-300"
                  style={{ accentColor: "#1A9952" }}
                  data-testid="checkbox-save-address"
                />
                <span className="text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Save Address for future use
                </span>
              </label>
            </div>

            {/* Select Payment Method Button */}
            <Button
              onClick={async () => {
                try {
                  setIsCreatingOrder(true);
                  
                  // Calculate totals
                  const vegCount = parseInt(vegBoxes) || 0;
                  const eggCount = parseInt(eggBoxes) || 0;
                  const nonVegCount = parseInt(nonVegBoxes) || 0;
                  const vegTotal = vegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * vegCount;
                  const eggTotal = eggPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * eggCount;
                  const nonVegTotal = nonVegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * nonVegCount;
                  const subtotal = vegTotal + eggTotal + nonVegTotal;
                  const gst = Math.round(subtotal * 0.18);
                  const platformFee = 499;
                  const packagingFee = 399;
                  const total = subtotal + gst + platformFee + packagingFee;
                  
                  // Get form values
                  const deliveryDate = (document.querySelector('[data-testid="input-event-date"]') as HTMLInputElement)?.value || null;
                  const deliveryTime = (document.querySelector('[data-testid="input-event-time"]') as HTMLInputElement)?.value || null;
                  const selectedAddressId = (document.querySelector('[data-testid="select-saved-address"]') as HTMLSelectElement)?.value || null;
                  
                  // Create order
                  await mealboxOrderService.create({
                    portions: `${selectedPortions}-portions`,
                    mealPreference: mealPreference,
                    selectedMealType: selectedMealType,
                    vegBoxes: vegCount,
                    eggBoxes: eggCount,
                    nonVegBoxes: nonVegCount,
                    vegPlateSelections: vegPlateSelections,
                    eggPlateSelections: eggPlateSelections,
                    nonVegPlateSelections: nonVegPlateSelections,
                    selectedAddons: selectedAddOns,
                    subtotal: subtotal,
                    deliveryFee: 0,
                    tax: gst,
                    total: total,
                    deliveryDate: deliveryDate,
                    deliveryTime: deliveryTime,
                    addressId: selectedAddressId || undefined,
                  });
                  
                  // Clear mealbox progress when order is placed
                  clearMealBoxProgress();
                  
                  toast({
                    title: "Order Created!",
                    description: "Your MealBox order has been placed successfully.",
                  });
                  
                  navigate("/mealbox-thank-you");
                } catch (error: any) {
                  console.error("Error creating order:", error);
                  toast({
                    variant: "destructive",
                    title: "Order Failed",
                    description: error.message || "Failed to create order. Please try again.",
                  });
                } finally {
                  setIsCreatingOrder(false);
                }
              }}
              disabled={isCreatingOrder}
              className="w-full py-6 text-lg font-semibold border-0 flex items-center justify-between"
              style={{ 
                fontFamily: "Sweet Sans Pro",
                backgroundColor: "#1A9952",
                color: "white",
                borderRadius: "10px"
              }}
              data-testid="button-select-payment"
            >
              <span>Select Payment Method</span>
              <span className="font-bold text-xl">
                ₹{(() => {
                  const vegCount = parseInt(vegBoxes) || 0;
                  const eggCount = parseInt(eggBoxes) || 0;
                  const nonVegCount = parseInt(nonVegBoxes) || 0;
                  const vegTotal = vegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * vegCount;
                  const eggTotal = eggPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * eggCount;
                  const nonVegTotal = nonVegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * nonVegCount;
                  const subtotal = vegTotal + eggTotal + nonVegTotal;
                  const gst = Math.round(subtotal * 0.18);
                  const platformFee = 499;
                  const packagingFee = 399;
                  return (subtotal + gst + platformFee + packagingFee).toLocaleString('en-IN');
                })()}
              </span>
            </Button>
          </div>
        )}
      </div>
      {/* Continue Order Banner */}
      <ContinueOrderBanner />
      {/* Floating Bottom Navigation */}
      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

