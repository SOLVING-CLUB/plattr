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
import { PageWithLoader } from "@/components/PageWithLoader";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContex";
import { mealboxOrderService, sixtyMinMealboxOrderService, addressService, paymentService, CouponValidationResult } from "@/lib/supabase-service";
import { openRazorpayModal } from "@/lib/payment-utils";
import { analytics } from "@/lib/analytics";
import CouponInput from "@/components/CouponInput";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
// import { getQueryFn } from "@/lib/queryClient"; // Duplicate removed
// import type { Dish, Category as CategoryType } from "@shared/schema";
import { getSupabaseImageUrl, getDishTypeImage } from "@/lib/supabase";
// import { getSupabaseImageUrl, getDishTypeImage } from "@/lib/supabase";÷ // Duplicate with typo removed
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LazyImage } from "@/components/ui/lazy-image";
import { ArrowLeft, Building2, MapPin, ShoppingCart, UtensilsCrossed, Package, Truck, Search, Check, ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Star, ArrowUpDown, SlidersHorizontal, LayoutGrid, Leaf, Drumstick, Egg, Sparkles, Phone, X, Calendar, Utensils, Info, Plus, Minus } from "lucide-react";
import DeliveryTimePicker from "@/components/DeliveryTimePicker";
import DeliveryDatePicker from "@/components/DeliveryDatePicker";
import { Sheet, SheetContent } from "@/components/ui/sheet";

// Supabase configuration for Edge Functions
const SUPABASE_URL = 'https://leltckltotobsibixhqo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbHRja2x0b3RvYnNpYml4aHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzc5ODEsImV4cCI6MjA3NTk1Mzk4MX0._IrMgGQDJB7OvKEoT7pwWG9AjN6aeN1ejnj8IViDLyE';

// Define missing types locally to resolve import errors
export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  dietary_type: string;
  is_available: boolean;
  rating?: number;
  preparation_time?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  tags?: string[];
  allergens?: string[];
  type: "veg" | "non-veg" | "egg";
  // CamelCase properties for compatibility
  imageUrl?: string;
  categoryId?: string;
  isAvailable?: boolean;
  dietaryType?: string;
  dishType?: string;
  quantity?: string | null; // Quantity field from database
}

export interface Category {
  id: string;
  name: string;
  image_url: string;
  description?: string;
  display_order?: number;
  imageUrl?: string;
}

export type CategoryType = Category;
import ContinueOrderBanner from "@/pages/ContinueOrderBanner";
import { SearchOverlay } from "@/components/SearchOverlay";
import { validateBangaloreAddress, validateBangalorePincode, BANGALORE_VALIDATION_ERROR } from "@/lib/addressValidation";
import { getCurrentPosition, getLocationPermissionInstructions } from "@/lib/locationPermission";
import mealBoxHeroPattern from "@assets/Hero_MealBox.png";
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

// Service category icons (cream/beige for active, dark green for inactive)
import bulkMealsIconActive from "@assets/bulk_meals_active.png";
import bulkMealsIconInactive from "@assets/BulkBox.png";
import mealBoxIconActive from "@assets/BulkBox1.png";
import mealBoxIconInactive from "@assets/BulkBox3.png";
import cateringIconActive from "@assets/BulkBox7.png";
import cateringIconInactive from "@assets/BulkBox6.png";
import corporateIconActive from "@assets/fi_12471703678_1765649076915.png";
import corporateIconInactive from "@assets/Vector34567_1765649076929.png";
import snackBoxIconActive from "@assets/BulkBox5.png";
import snackBoxIconInactive from "@assets/BulkBox4.png";
import decorIcon from "@assets/streamline-ultimate_party-decoration-bold_1763917839170.png";
import tablewareIcon from "@assets/roentgen_fork-and-knife_1763917839169.png";
import musicIcon from "@assets/roentgen_fork-and-knife_1763917839169.png";
import cameraIcon from "@assets/mdi_camera3_1763917839155.png";
// Cutlery addon images
import servingSpoonIcon from "@assets/serving spoons.PNG?url";
import spoonForkIcon from "@assets/fork and spoon wooden.PNG?url";
import plateIcon from "@assets/wooden_plate.PNG?url";
import waterBottleIcon from "@assets/water bottle.PNG?url";
import tissueIcon from "@assets/tissues.PNG?url";
import biryaniImage1 from '@assets/stock_images/indian_biryani_dish__60e99e80.jpg';
import idliImage1 from '@assets/stock_images/indian_idli_sambar_s_c6bb3ca9.jpg';
import vadaImage1 from '@assets/stock_images/indian_vada_d82fc29e.jpg';
import thaliImage from '@assets/stock_images/indian_thali_meal_3a645a6d.jpg';
import samosaImage from '@assets/stock_images/samosa_snacks_indian_0946aa28.jpg';
import platterImage from '@assets/stock_images/indian_food_platter__b34d03e7.jpg';

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
  // Try to find image in manually fetched subcategories
  // Using global subcategories if available (will be captured from component scope once moved)
  // Since this function is defined outside component, it can't access component state 'subcategories'.
  // We need to move this function INSIDE component or pass subcategories map to it.

  // WAIT: This function is currently defined outside the component (lines 1195).
  // I must move it inside the component or pass data to it.
  // It uses DISH_TYPE_IMAGES which is global.

  const fallbackImage = DISH_TYPE_IMAGES[dishType] || DISH_TYPE_IMAGES['default'];
  return getDishTypeImage(dishType, fallbackImage);
};

// Helper to get dish image - handles both camelCase and snake_case from Supabase
const getDishImage = (dish: Dish): string => {
  // Handle both camelCase (imageUrl) and snake_case (image_url) from Supabase
  const imageUrlFromDb = dish.imageUrl || (dish as any).image_url;

  // First, try to use the Supabase image URL from the database if it exists
  if (imageUrlFromDb && imageUrlFromDb.trim() !== '') {
    const supabaseUrl = getSupabaseImageUrl(imageUrlFromDb);
    // If it's a valid Supabase URL (not a placeholder), use it
    if (supabaseUrl && !supabaseUrl.includes('placeholder') && supabaseUrl.startsWith('http')) {
      return supabaseUrl;
    }
  }

  // Otherwise, fall back to local assets based on dish name
  const name = dish.name.toLowerCase();

  // Paneer dishes
  if (name.includes('paneer tikka') || name.includes('achari paneer')) return platterImage;
  if (name.includes('paneer')) return platterImage;
  if (name.includes('tikka')) return platterImage;

  // South Indian
  if (name.includes('dosa')) return thaliImage;
  if (name.includes('idli') || name.includes('idly')) return idliImage1;
  if (name.includes('vada') || name.includes('medu')) return vadaImage1;
  if (name.includes('uttapam')) return idliImage1;
  if (name.includes('pongal')) return thaliImage;

  // North Indian Tiffins
  if (name.includes('aloo paratha') || name.includes('paratha')) return thaliImage;
  if (name.includes('chole bhature') || name.includes('bhature')) return thaliImage;
  if (name.includes('poha')) return thaliImage;
  if (name.includes('upma')) return thaliImage;
  if (name.includes('bread toast') || name.includes('toast')) return thaliImage;

  // Snacks
  if (name.includes('samosa')) return samosaImage;
  if (name.includes('pakora') || name.includes('bajji')) return vadaImage1;

  // Lunch/Dinner
  if (name.includes('biryani')) return biryaniImage1;
  if (name.includes('thali') || name.includes('meal')) return thaliImage;
  if (name.includes('curry') || name.includes('masala')) return platterImage;

  // Default fallback
  return platterImage;
};

// Map meal category to meal_type filter for Supabase
const getMealTypeFilter = (mealType: MealType): string => {
  switch (mealType) {
    case "hi-tea":
      return "snacks";
    case "breakfast":
      return "breakfast";
    case "lunch":
    case "dinner":
      return "lunch-dinner";
    default:
      return "lunch-dinner";
  }
};

type ServiceType = "bulk-meals" | "mealbox" | "catering" | "snack-box";
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

const LOCATION_STORAGE_KEY = "activeLocation";

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
  const completedTabsRef = useRef<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("home");
  const [selectedService, setSelectedService] = useState<ServiceType>("mealbox");
  const [scrollY, setScrollY] = useState(0);
  const [locationLabel, setLocationLabel] = useState("Select Address");

  // Read location from localStorage on mount and when page regains focus
  useEffect(() => {
    const readLocationFromStorage = () => {
      const savedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (savedLocation) {
        try {
          const parsed = JSON.parse(savedLocation);
          setLocationLabel(parsed.label || "Select Address");
        } catch (e) {
          console.error("Error parsing saved location:", e);
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

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        readLocationFromStorage();
      }
    };

    const handleFocus = () => {
      readLocationFromStorage();
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
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("locationchange", handleLocationChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("locationchange", handleLocationChange);
    };
  }, []);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Clear mealbox progress when entering from 60-min flow (onNavigate is truthy)
  // This ensures a fresh start when coming from ExploreMenuPage
  useEffect(() => {
    if (onNavigate) {
      clearMealBoxProgress();
    }
  }, [onNavigate, clearMealBoxProgress]);

  // Track scroll position for sticky header
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDishType, setSelectedDishType] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<"all" | "grilled" | "fried" | "stuffed">("all");
  const [currentDietaryTab, setCurrentDietaryTab] = useState<"veg" | "egg" | "non-veg">("veg");
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [selectedSort, setSelectedSort] = useState<string>("popular");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [dietaryMode, setDietaryMode] = useState<'all' | 'veg' | 'egg' | 'non-veg'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [sortOption, setSortOption] = useState<'price-low' | 'price-high' | 'name-az' | 'name-za'>('price-low');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [platterPlannerOpen, setPlatterPlannerOpen] = useState(false);
  const [dishDetailOpen, setDishDetailOpen] = useState(false);
  const [detailDish, setDetailDish] = useState<Dish | null>(null);
  const [upgradePortionDialogOpen, setUpgradePortionDialogOpen] = useState(false);
  const [pendingDishForUpgrade, setPendingDishForUpgrade] = useState<FoodItem | null>(null);

  // Fetch subcategories for images
  const { data: subcategories = [] } = useQuery<any[]>({
    queryKey: ['/api/subcategories'],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // Separate selections for each dietary type
  const [vegPlateSelections, setVegPlateSelections] = useState<PortionSelection[]>([]);
  const [eggPlateSelections, setEggPlateSelections] = useState<PortionSelection[]>([]);
  const [nonVegPlateSelections, setNonVegPlateSelections] = useState<PortionSelection[]>([]);

  // Add-ons selection
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  // Quantity state for Serving Spoons (per piece pricing)
  const [servingSpoonQuantity, setServingSpoonQuantity] = useState<number>(0);

  // Quantity state for Plates (per piece pricing)
  const [plateQuantity, setPlateQuantity] = useState<number>(0);

  // Quantity state for Water Bottles (per piece pricing)
  const [waterBottleQuantity, setWaterBottleQuantity] = useState<number>(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);

  // Address form state
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [pincode, setPincode] = useState("");
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(false);
  const [doorstepDelivery, setDoorstepDelivery] = useState(false);

  // Calculate T+12 hours for default date/time
  const getMinDateTime = () => {
    const minTime = new Date(Date.now() + 12 * 60 * 60 * 1000);
    return {
      date: minTime.toISOString().split('T')[0],
      time: `${minTime.getHours().toString().padStart(2, '0')}:00`
    };
  };

  const minDateTime = getMinDateTime();

  // Event date/time state with T+12 default
  const [eventDate, setEventDate] = useState(minDateTime.date);
  const [eventTime, setEventTime] = useState(minDateTime.time);

  // Contact info - prefilled from localStorage (logged in user)
  const [phone, setPhone] = useState(() => {
    const savedPhone = localStorage.getItem('phone');
    return savedPhone ? `+91 ${savedPhone}` : "";
  });
  const [email, setEmail] = useState(() => localStorage.getItem('email') || "");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discount: number;
    discountType: 'percentage' | 'fixed' | 'free_delivery';
    discountValue: number;
    isFreeDelivery?: boolean;
  } | null>(null);

  // Business order state
  const [isBusinessOrder, setIsBusinessOrder] = useState(false);
  const [gstNumber, setGstNumber] = useState("");

  // Payment state
  const [hasSelectedDateTime, setHasSelectedDateTime] = useState(false);

  // Razorpay payment state
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);

  const [isPaymentPlanOpen, setIsPaymentPlanOpen] = useState(false);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<"full" | "split">("full");
  const [isSplitPaymentExpanded, setIsSplitPaymentExpanded] = useState(false);
  const [isTotalBreakdownExpanded, setIsTotalBreakdownExpanded] = useState(false);
  const [paymentResponseData, setPaymentResponseData] = useState<{
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    razorpayReceipt: string;
  } | null>(null);
  const orderDataRef = useRef<any>(null);

  const handleCouponApply = (result: CouponValidationResult) => {
    if (result.valid && result.coupon && result.discount !== undefined) {
      setAppliedCoupon({
        id: result.coupon.id,
        code: result.coupon.code,
        discount: result.discount,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
        isFreeDelivery: result.isFreeDelivery,
      });
      toast({
        title: "Coupon Applied!",
        description: result.isFreeDelivery ? "Free delivery applied!" : `You saved ₹${result.discount}`,
      });
    }
  };

  const handleCouponRemove = () => {
    setAppliedCoupon(null);
  };

  // Function to get current location and reverse geocode
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      const result = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      if (!result.success || !result.position) {
        const errorMessage = result.error?.userFriendlyMessage ||
          "Could not get your location. Please enter your address manually.";

        if (result.error?.code === 1) {
          toast({
            title: "Location Permission Denied",
            description: `${errorMessage}\n\n${getLocationPermissionInstructions()}`,
            variant: "destructive",
            duration: 8000,
          });
        } else {
          toast({
            title: "Location Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
        setIsGettingLocation(false);
        return;
      }

      const { latitude, longitude } = result.position.coords;

      // Reverse geocode using Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;
        const newAddressLine1 = data.display_name?.split(',').slice(0, 2).join(', ') || "";
        const newAddressLine2 = addr.suburb || addr.neighbourhood || addr.road || addr.residential || "";
        const newCity = addr.city || addr.town || addr.village || addr.county || addr.state_district || "";
        const newState = addr.state || addr.region || "";
        const newPincode = addr.postcode || "";

        // Only update fields that have valid data, keep previous values otherwise
        if (newAddressLine1) setAddressLine1(newAddressLine1);
        if (newAddressLine2) setAddressLine2(newAddressLine2);
        if (newCity) setCity(newCity);
        if (newState) setAddressState(newState);
        if (newPincode) setPincode(newPincode);

        // Clear saved address selection to enable manual editing
        setSelectedAddressId("");
        toast({ title: "Location Found", description: "Address filled from your current location" });
      } else {
        toast({ title: "Location Error", description: "Could not get address details", variant: "destructive" });
      }
    } catch (error: any) {
      console.error('Location error:', error);
      toast({
        title: "Location Error",
        description: error.code === 1 ? "Please allow location access" : "Could not get your location",
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Fetch saved addresses
  const { data: savedAddresses = [] } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => addressService.getAll(),
  });

  const handleSavedAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setAddressState("");
    setPincode("");
  };

  const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
  const isAddressFieldsDisabled = !!selectedAddressId;

  // Calculate grand total for payment logic
  const doorstepDeliveryFee = doorstepDelivery ? 300 : 0;

  // Calculate addons total
  const calculateAddonsTotal = () => {
    const servingSpoonPrice = servingSpoonQuantity * 20; // ₹20 per piece
    const platePrice = plateQuantity * 10; // ₹10 per piece
    const waterBottlePrice = waterBottleQuantity * 10; // ₹10 per piece
    return servingSpoonPrice + platePrice + waterBottlePrice;
  };

  const calculateGrandTotal = () => {
    const vegCount = parseInt(vegBoxes) || 0;
    const eggCount = parseInt(eggBoxes) || 0;
    const nonVegCount = parseInt(nonVegBoxes) || 0;
    const vegTotal = vegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * vegCount;
    const eggTotal = eggPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * eggCount;
    const nonVegTotal = nonVegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * nonVegCount;
    const subtotal = vegTotal + eggTotal + nonVegTotal;
    const packagingFee = Math.round(subtotal * 0.06);
    const baseDeliveryCharges = Math.max(Math.round(subtotal * 0.06), 199);
    const deliveryCharges = appliedCoupon?.isFreeDelivery ? 0 : baseDeliveryCharges;
    const gst = Math.round(subtotal * 0.05);
    const discount = appliedCoupon?.isFreeDelivery ? 0 : (appliedCoupon?.discount || 0);
    const addonsTotal = calculateAddonsTotal();
    return subtotal + packagingFee + deliveryCharges + gst + addonsTotal + doorstepDeliveryFee - discount;
  };

  const grandTotal = calculateGrandTotal();

  // Load Razorpay script and get key ID
  useEffect(() => {
    fetch(`${SUPABASE_URL}/functions/v1/razorpay`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(errorData.error || `Failed to fetch payment key: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.keyId) {
          setRazorpayKeyId(data.keyId);
        } else if (data.error) {
          console.warn('[MealBox] Payment gateway not configured:', data.error);
        }
      })
      .catch(error => {
        console.warn('[MealBox] Payment gateway initialization failed:', error.message);
      });

    // Load Razorpay script - check if already exists first
    const loadRazorpayScript = () => {
      // Check if Razorpay is already available
      if (window.Razorpay) {
        console.log('[MealBox] Razorpay already loaded');
        setRazorpayLoaded(true);
        return;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        console.log('[MealBox] Razorpay script tag already exists, waiting for load...');
        // Wait a bit for it to load
        const checkInterval = setInterval(() => {
          if (window.Razorpay) {
            setRazorpayLoaded(true);
            clearInterval(checkInterval);
          }
        }, 100);

        // Clear interval after 5 seconds
        setTimeout(() => clearInterval(checkInterval), 5000);
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        console.log('[MealBox] Razorpay script loaded successfully');
        if (window.Razorpay) {
          setRazorpayLoaded(true);
        } else {
          console.warn('[MealBox] Script loaded but window.Razorpay not available');
          // Retry after a short delay
          setTimeout(() => {
            if (window.Razorpay) {
              setRazorpayLoaded(true);
            }
          }, 500);
        }
      };
      script.onerror = (error) => {
        console.error('[MealBox] Failed to load Razorpay script:', error);
        toast({
          title: "Payment Error",
          description: "Failed to load payment gateway. Please check your internet connection and try again.",
          variant: "destructive",
        });
      };
      document.body.appendChild(script);
    };

    loadRazorpayScript();

    // Don't cleanup script on unmount - let it persist for better iOS compatibility
  }, [toast]);

  // Track date/time selection
  useEffect(() => {
    if (eventDate && eventTime) {
      setHasSelectedDateTime(true);
    }
  }, [eventDate, eventTime]);

  // Helper function to determine payment case
  const getPaymentCase = () => {
    // Case 4: If total <= ₹1000, highest priority
    if (grandTotal <= 1000) {
      return { case: 4, diffDays: null };
    }

    if (!eventDate) {
      return { case: null, diffDays: null };
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const delivery = new Date(eventDate);
    const deliveryStart = new Date(
      delivery.getFullYear(),
      delivery.getMonth(),
      delivery.getDate()
    );

    const diffMs = deliveryStart.getTime() - todayStart.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Case 3: Same day delivery
    if (diffDays < 1) {
      return { case: 3, diffDays };
    }

    // Case 1: Gap >= 2 days
    if (diffDays >= 2) {
      return { case: 1, diffDays };
    }

    // Case 2: Gap < 2 days (but not same day)
    return { case: 2, diffDays };
  };

  // Calculate initial payment amount
  const calculateInitialPayment = () => {
    const { case: paymentCase } = getPaymentCase();
    if (paymentCase === 4) return grandTotal;
    if (!paymentCase) return grandTotal;
    if (paymentCase === 3) return grandTotal;
    if (paymentCase === 1) return Math.round(grandTotal * 0.1);
    return Math.round(grandTotal * 0.8);
  };

  const getPaymentButtonText = () => {
    const { case: paymentCase } = getPaymentCase();
    if (paymentCase === 4) return "Pay";
    if (!paymentCase) return "Pay Now";
    if (paymentCase === 3) return "Pay Now";
    return "Pay Initial Amount";
  };

  const shouldShowPaymentStructure = () => {
    const { case: paymentCase } = getPaymentCase();
    return hasSelectedDateTime && eventDate && eventTime && (paymentCase === 1 || paymentCase === 2);
  };

  const calculatePaymentSchedule = () => {
    if (!shouldShowPaymentStructure()) return null;
    const { case: paymentCase, diffDays } = getPaymentCase();
    if (!paymentCase || paymentCase !== 1 && paymentCase !== 2) return null;

    const totalAmount = grandTotal;
    if (totalAmount <= 0) return null;

    if (paymentCase === 1) {
      const advance = Math.round(totalAmount * 0.1);
      const beforeDay = Math.round(totalAmount * 0.7);
      const remaining = Math.max(totalAmount - advance - beforeDay, 0);
      const delivery = new Date(eventDate);
      const oneDayBefore = new Date(delivery);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);

      return {
        type: "10-70-20" as const,
        stages: [
          { label: "Initial Payment (10%)", description: "Pay 10% right away to book your slot.", amount: advance, when: "Now" },
          { label: "Second Payment (70%)", description: "Pay 70% one day before delivery.", amount: beforeDay, when: `Before ${oneDayBefore.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` },
          { label: "Final Payment (20%)", description: "Pay the remaining 20% on delivery.", amount: remaining, when: `Before ${delivery.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` },
        ],
      };
    }

    const immediate = Math.round(totalAmount * 0.8);
    const remaining = Math.max(totalAmount - immediate, 0);
    const delivery = new Date(eventDate);

    return {
      type: "80-20" as const,
      stages: [
        { label: "Initial Payment (80%)", description: "Pay 80% right away to confirm your slot.", amount: immediate, when: "Now" },
        { label: "Final Payment (20%)", description: "Pay the remaining 20% on delivery.", amount: remaining, when: `Before ${delivery.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` },
      ],
    };
  };

  const paymentSchedule = calculatePaymentSchedule();

  // Restore MealBox progress on mount (only once)
  // Skip restoration when entering from 60-min flow (onNavigate is truthy) to start fresh
  useEffect(() => {
    if (onNavigate) {
      // In 60-min flow, don't restore - start fresh
      return;
    }
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
  }, [mealBoxProgress, onNavigate]);

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
  // Skip during restoration to preserve saved non-veg selections
  useEffect(() => {
    // Don't clear boxes during restoration - we're loading saved state
    if (isRestoringRef.current) {
      return;
    }

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
    // Reset completedTabs when leaving step 4 (going back)
    if (currentStep < 4) {
      completedTabsRef.current.clear();
    }
  }, [currentStep, activeDietaryPreferences]);

  // Auto-progression: switch to next dietary tab when current tab's slots are all filled
  useEffect(() => {
    if (currentStep !== 4) return;

    // Skip if this tab has already been completed (prevent infinite loop)
    if (completedTabsRef.current.has(currentDietaryTab)) return;

    // Get current selections based on dietary tab
    const currentSelections =
      currentDietaryTab === "veg" ? vegPlateSelections :
        currentDietaryTab === "egg" ? eggPlateSelections :
          nonVegPlateSelections;

    // Check if all slots for current tab are filled
    const allSlotsFilled = currentSelections.length > 0 &&
      currentSelections.every(sel => sel.itemId !== null);

    if (!allSlotsFilled) return;

    // Mark this tab as completed to prevent re-triggering
    completedTabsRef.current.add(currentDietaryTab);

    // Find the next dietary preference in the sequence
    const currentIndex = activeDietaryPreferences.indexOf(currentDietaryTab);
    const nextIndex = currentIndex + 1;

    // If there's a next dietary preference, switch to it
    if (nextIndex < activeDietaryPreferences.length) {
      const nextTab = activeDietaryPreferences[nextIndex];
      setCurrentDietaryTab(nextTab);
      setSelectedSlotIndex(0); // Reset to first slot of new tab
      toast({
        title: `${currentDietaryTab.toUpperCase()} box complete!`,
        description: `Now select items for your ${nextTab.toUpperCase()} box.`,
      });
    }
  }, [currentStep, currentDietaryTab, vegPlateSelections, eggPlateSelections, nonVegPlateSelections, activeDietaryPreferences]);

  // Get current plate selections based on active dietary tab
  const getCurrentPlateSelections = (): PortionSelection[] => {
    if (currentDietaryTab === "veg") return vegPlateSelections;
    if (currentDietaryTab === "egg") return eggPlateSelections;
    return nonVegPlateSelections;
  };

  // Get allowed item types for current dietary tab
  // This logic applies regardless of how many box types are selected (veg, egg, or non-veg)
  // The filtering is based on the CURRENT TAB being viewed, not on what boxes are selected
  // 
  // Rules:
  // - Veg plate tab: show ONLY veg dishes
  // - Egg plate tab: show veg AND egg dishes (exclude non-veg)
  // - Non-veg plate tab: show ALL dishes (veg, egg, AND non-veg)
  const getAllowedItemTypes = (): ("veg" | "egg" | "non-veg")[] => {
    if (currentDietaryTab === "veg") {
      // Veg plate: show only veg dishes
      return ["veg"];
    }
    if (currentDietaryTab === "egg") {
      // Egg plate: show veg and egg dishes (not non-veg)
      return ["veg", "egg"];
    }
    if (currentDietaryTab === "non-veg") {
      // Non-veg plate: show all dishes (veg, egg, and non-veg)
      return ["veg", "egg", "non-veg"];
    }
    // Default fallback (should not happen)
    return ["veg"];
  };

  // Map UI meal type selection to database meal_type filter value
  // Database meal_type column contains: "tiffins", "snacks", "lunch-dinner" (comma-separated)
  // Note: "breakfast" tab maps to "tiffins" in database, "lunch" and "dinner" both map to "lunch-dinner"
  const getMealTypeFilter = (mealType: MealType): string => {
    const mapping: Record<MealType, string> = {
      "hi-tea": "snacks",        // Hi-Tea tab → filter by "snacks" in meal_type
      "breakfast": "tiffins",    // Breakfast tab → filter by "tiffins" in meal_type
      "lunch": "lunch-dinner",   // Lunch tab → filter by "lunch-dinner" in meal_type
      "dinner": "lunch-dinner",  // Dinner tab → filter by "lunch-dinner" in meal_type
    };
    return mapping[mealType] || "lunch-dinner";
  };

  const mealType = getMealTypeFilter(selectedMealType);

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

  // Fetch ALL categories from database
  const { data: allCategoriesFromDb = [] } = useQuery<CategoryType[]>({
    queryKey: ['/api/categories', 'all'],
  });

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

  // OPTIMIZATION: Lazy-load category counts in background after page renders
  // This query fetches all dishes for the meal type but is non-blocking
  // Add 'sixtymin' filter when accessed from 60-min delivery flow (onNavigate present)
  const { data: allDishesForCounts = [] } = useQuery<Dish[]>({
    queryKey: onNavigate
      ? ['/api/dishes', mealType, 'all', 'all', 'sixtymin']
      : ['/api/dishes', mealType, 'all', 'all'],
    enabled: !!mealType && currentStep === 4,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Filter categories dynamically from database meal_type column
  // Categories are sorted by the custom category order based on meal type
  // Also filter out categories that have no dishes (e.g., when 60-min filter is active)
  const categories = useMemo(() => {
    if (!mealType || allCategoriesFromDb.length === 0) return [];
    const filtered = filterCategoriesByMealType(allCategoriesFromDb, mealType);
    const categoryOrder = getCategoryOrder(mealType);

    // Build a set of category IDs that have at least one available dish
    const categoriesWithDishes = new Set<string>();
    allDishesForCounts.forEach(dish => {
      const categoryId = (dish as any).category_id || dish.categoryId;
      const isAvailable = (dish as any).is_available !== false && dish.isAvailable !== false;
      if (categoryId && isAvailable) {
        categoriesWithDishes.add(categoryId);
      }
    });

    // Filter to only categories that have at least one dish
    // (skip this filter if allDishesForCounts hasn't loaded yet to prevent flickering)
    const withDishes = allDishesForCounts.length > 0
      ? filtered.filter(cat => categoriesWithDishes.has(cat.id))
      : filtered;

    return withDishes.sort((a, b) => {
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
  }, [allCategoriesFromDb, mealType, allDishesForCounts]);

  // Set first category as selected when categories load or when meal type changes
  // Keep 'all' as valid selection - only reset if it's an invalid category ID
  useEffect(() => {
    if (categories.length > 0 && currentStep === 4) {
      // Don't reset if 'all' is selected - it's a valid filter option
      if (selectedCategory === 'all') return;
      // Only reset if the current selection is not found in available categories
      if (!selectedCategory || !categories.find(c => c.id === selectedCategory)) {
        setSelectedCategory('all');
      }
    }
  }, [categories, selectedCategory, mealType, currentStep]);

  // Filter to available dishes only
  const allDishes = useMemo(() => {
    return allDishesForCounts.filter(dish => {
      const isAvailable = (dish as any).is_available !== false && dish.isAvailable !== false;
      return isAvailable;
    });
  }, [allDishesForCounts]);

  // Fetch dishes for selected category (for display)
  // Add 'sixtymin' filter when accessed from 60-min delivery flow (onNavigate present)
  const { data: dishes = [], isLoading: isLoadingDishes } = useQuery<Dish[]>({
    queryKey: onNavigate
      ? ['/api/dishes', mealType, selectedCategory, currentDietaryTab, 'sixtymin']
      : ['/api/dishes', mealType, selectedCategory, currentDietaryTab],
    enabled: !!selectedCategory && currentStep === 4,
  });

  // Transform dishes to match the FoodItem format
  const foodItems: FoodItem[] = useMemo(() => {
    return dishes
      .filter(dish => dish.isAvailable !== false) // Only show available dishes
      .map((dish) => {
        // Map dietary type from database to FoodItem type
        // Handle both camelCase and snake_case from database
        const rawDietaryType = (dish as any).dietary_type || dish.dietaryType || '';
        const dietaryType = rawDietaryType.toLowerCase();
        const dishName = dish.name?.toLowerCase() || '';

        // Non-veg keywords to check in dish name (excluding egg - handled separately)
        const nonVegKeywords = ['chicken', 'mutton', 'fish', 'prawn', 'shrimp', 'lamb', 'meat', 'keema', 'gosht', 'murgh', 'jhinga', 'machli', 'seafood', 'crab', 'lobster', 'beef', 'pork'];
        const eggKeywords = ['egg', 'anda', 'omelette', 'omelet'];

        let type: "veg" | "egg" | "non-veg" = "veg";

        // First check explicit dietary type from database
        if (dietaryType === 'non-veg' || dietaryType === 'nonveg' || dietaryType === 'non veg') {
          type = "non-veg";
        } else if (dietaryType === 'egg' || dietaryType === 'egg-veg' || dietaryType === 'eggetarian') {
          type = "egg";
        } else if (dietaryType === 'veg' || dietaryType === 'vegetarian') {
          type = "veg";
        } else {
          // Fallback: check dish name for non-veg keywords (excluding egg-only items)
          const hasNonVegKeyword = nonVegKeywords.some(keyword => dishName.includes(keyword));
          const hasEggKeyword = eggKeywords.some(keyword => dishName.includes(keyword));

          if (hasNonVegKeyword && !hasEggKeyword) {
            // Contains meat/fish keywords but not just egg
            type = "non-veg";
          } else if (hasEggKeyword && !hasNonVegKeyword) {
            // Contains only egg keywords
            type = "egg";
          } else if (hasNonVegKeyword && hasEggKeyword) {
            // Contains both - classify as non-veg
            type = "non-veg";
          }
          // else stays as "veg" (default)
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
          image: (dish.image_url || dish.imageUrl) ? getSupabaseImageUrl(dish.image_url || dish.imageUrl) : "",
        };
      });
  }, [dishes]);

  // Hydrate plate selections with full FoodItem data (including images) when dishes are loaded
  // This ensures restored selections from localStorage have their item images populated
  useEffect(() => {
    if (foodItems.length === 0) return;

    // Create a lookup map for quick access
    const foodItemsMap = new Map<string, FoodItem>();
    foodItems.forEach(item => foodItemsMap.set(item.id, item));

    // Hydrate selections with full item data
    const hydrateSelections = (selections: PortionSelection[]): PortionSelection[] => {
      return selections.map(sel => {
        if (sel.itemId && (!sel.item || !sel.item.image)) {
          const fullItem = foodItemsMap.get(sel.itemId);
          if (fullItem) {
            return { ...sel, item: fullItem };
          }
        }
        return sel;
      });
    };

    // Only hydrate if there are selections without images
    const needsHydration = (selections: PortionSelection[]) =>
      selections.some(sel => sel.itemId && (!sel.item || !sel.item.image));

    if (needsHydration(vegPlateSelections)) {
      setVegPlateSelections(hydrateSelections(vegPlateSelections));
    }
    if (needsHydration(eggPlateSelections)) {
      setEggPlateSelections(hydrateSelections(eggPlateSelections));
    }
    if (needsHydration(nonVegPlateSelections)) {
      setNonVegPlateSelections(hydrateSelections(nonVegPlateSelections));
    }
  }, [foodItems]);

  // Get dish count for a category (from all dishes, respecting filters)
  const getDishCountForCategory = (categoryId: string): number => {
    const count = allDishes.filter(d => {
      // Handle both camelCase and snake_case from database
      const dishCategoryId = (d as any).category_id || d.categoryId;

      // Filter by category
      if (dishCategoryId !== categoryId) return false;

      // Apply dietary filter based on current dietary tab
      // Handle both camelCase and snake_case from database
      const rawDietaryType = (d as any).dietary_type || d.dietaryType || '';
      const dietaryType = rawDietaryType.toLowerCase();

      if (currentDietaryTab === 'veg') {
        // For veg tab, only show veg dishes
        if (dietaryType === 'non-veg' || dietaryType === 'nonveg' || dietaryType === 'egg' || dietaryType === 'egg-veg') {
          return false;
        }
      } else if (currentDietaryTab === 'egg') {
        // For egg tab, show veg AND egg items (exclude non-veg)
        if (dietaryType === 'non-veg' || dietaryType === 'nonveg') {
          return false;
        }
      }
      // For non-veg tab, show all (veg, egg, non-veg) - no filtering needed

      return true;
    }).length;

    return count;
  };

  // Fetch dish types for selected category
  const { data: fetchedDishTypes = [] } = useQuery<string[]>({
    queryKey: ['/api/dish-types', selectedCategory],
    enabled: !!selectedCategory && selectedCategory !== 'all' && currentStep === 4,
  });

  // When "All" is selected, compute all unique dish types from all dishes
  const allUniqueDishTypes = useMemo(() => {
    if (selectedCategory !== 'all') return [];
    const types = new Set<string>();
    dishes.forEach(dish => {
      const dishType = (dish as any).dish_type || dish.dishType;
      if (dishType && dishType.trim() !== '') {
        types.add(dishType);
      }
    });
    return Array.from(types).sort();
  }, [dishes, selectedCategory]);

  // Use allUniqueDishTypes when "All" is selected, otherwise use fetched dish types
  // Filter out empty strings from fetched dish types (API may return [""] for categories with no dish types)
  // Also filter out dish types that have 0 dishes (when 60-min filter is active)
  const dishTypes = useMemo(() => {
    const rawTypes = selectedCategory === 'all'
      ? allUniqueDishTypes
      : fetchedDishTypes.filter(dt => dt && dt.trim() !== '');

    // Filter to only dish types that have at least one dish in the current filtered set
    return rawTypes.filter(dt => {
      const count = foodItems.filter(item => {
        const dish = dishes.find(d => d.id === item.id);
        if (!dish) return false;
        const dishDishType = (dish as any).dish_type || dish.dishType;
        return dishDishType === dt;
      }).length;
      return count > 0;
    });
  }, [selectedCategory, allUniqueDishTypes, fetchedDishTypes, foodItems, dishes]);

  // Reset dish type filter when category changes
  useEffect(() => {
    if (currentStep === 4) {
      setSelectedDishType('all');
    }
  }, [selectedCategory, currentStep]);

  // Get dish count for a specific dish type
  const getDishCountForDishType = (dishType: string): number => {
    if (dishType === 'all') return foodItems.length;
    return foodItems.filter(item => {
      const dish = dishes.find(d => d.id === item.id);
      if (!dish) return false;
      const dishDishType = (dish as any).dish_type || dish.dishType;
      return dishDishType === dishType;
    }).length;
  };

  // Filter items based on category, dish type, allowed types for current dietary tab, dietaryMode filter, and exclude already selected items
  const filteredItems = useMemo(() => {
    return foodItems
      .filter(item => {
        const dish = dishes.find(d => d.id === item.id);
        if (!dish) return false;

        // Category filter - check if dish belongs to selected category
        // Skip category filter if 'all' is selected (show all categories)
        if (selectedCategory && selectedCategory !== 'all') {
          const dishCategoryId = (dish as any).category_id || dish.categoryId;
          if (dishCategoryId !== selectedCategory) return false;
        }

        // Dish type filter
        if (selectedDishType !== 'all') {
          const dishDishType = (dish as any).dish_type || dish.dishType;
          if (dishDishType !== selectedDishType) return false;
        }

        // Only show items allowed for current plate type (main tab: veg/egg/non-veg)
        const allowedTypes = getAllowedItemTypes();
        if (!allowedTypes.includes(item.type)) return false;

        // Apply dietaryMode filter (the secondary filter buttons: All, Veg, Egg, Non-Veg)
        if (dietaryMode !== 'all') {
          if (item.type !== dietaryMode) return false;
        }

        // Filter by subcategory (grilled/fried/etc) if selected
        if (selectedSubcategory !== 'all') {
          const matchesSubcategory = dish.tags && dish.tags.includes(selectedSubcategory);
          if (!matchesSubcategory) return false;
        }

        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!(dish.name.toLowerCase().includes(query) || (dish.description && dish.description.toLowerCase().includes(query)))) {
            return false;
          }
        }

        // Exclude already selected items (no duplicates) based on current dietary tab
        const excludedIds = getExcludedItemIds();
        if (excludedIds.has(item.id)) return false;

        return true;
      })
      .sort((a, b) => {
        // Apply sortOption first
        if (sortOption === 'price-low') {
          return a.price - b.price;
        } else if (sortOption === 'price-high') {
          return b.price - a.price;
        } else if (sortOption === 'name-az') {
          return a.name.localeCompare(b.name);
        } else if (sortOption === 'name-za') {
          return b.name.localeCompare(a.name);
        }

        // Fallback: When viewing "All", priority category dishes come first
        if (selectedCategory === 'all' && priorityCategoryId) {
          const dishA = dishes.find(d => d.id === a.id);
          const dishB = dishes.find(d => d.id === b.id);
          const aCategoryId = dishA ? ((dishA as any).category_id || dishA.categoryId) : '';
          const bCategoryId = dishB ? ((dishB as any).category_id || dishB.categoryId) : '';
          const aIsPriority = aCategoryId === priorityCategoryId;
          const bIsPriority = bCategoryId === priorityCategoryId;

          if (aIsPriority && !bIsPriority) return -1;
          if (!aIsPriority && bIsPriority) return 1;
        }

        // Default: sort by name
        return a.name.localeCompare(b.name);
      });
  }, [foodItems, dishes, selectedCategory, selectedDishType, priorityCategoryId, searchQuery, selectedSubcategory, dietaryMode, sortOption]);

  // Check if all slots for current dietary tab are filled
  const currentPlateSelections = getCurrentPlateSelections();
  const allSlotsFilled = currentPlateSelections.length > 0 && currentPlateSelections.every(sel => sel.itemId !== null);

  // Check if ALL slots across ALL active dietary preferences are filled
  const allPlatesFilled = useMemo(() => {
    if (activeDietaryPreferences.length === 0) return false;
    return activeDietaryPreferences.every(pref => {
      const selections = pref === "veg" ? vegPlateSelections :
        pref === "egg" ? eggPlateSelections :
          nonVegPlateSelections;
      return selections.length > 0 && selections.every(sel => sel.itemId !== null);
    });
  }, [activeDietaryPreferences, vegPlateSelections, eggPlateSelections, nonVegPlateSelections]);

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

  // Prepare order data for payment/submission
  const prepareOrderData = () => {
    const vegCount = parseInt(vegBoxes) || 0;
    const eggCount = parseInt(eggBoxes) || 0;
    const nonVegCount = parseInt(nonVegBoxes) || 0;
    const vegTotal = vegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * vegCount;
    const eggTotal = eggPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * eggCount;
    const nonVegTotal = nonVegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * nonVegCount;
    const subtotal = vegTotal + eggTotal + nonVegTotal;
    const packagingFee = Math.round(subtotal * 0.06);
    const baseDeliveryCharges = Math.max(Math.round(subtotal * 0.06), 199);
    const deliveryCharges = appliedCoupon?.isFreeDelivery ? 0 : baseDeliveryCharges;
    const gst = Math.round(subtotal * 0.05);
    const discount = appliedCoupon?.isFreeDelivery ? 0 : (appliedCoupon?.discount || 0);
    const addonsTotal = calculateAddonsTotal();
    const total = subtotal + packagingFee + deliveryCharges + gst + addonsTotal + doorstepDeliveryFee - discount;

    const deliveryDate = eventDate || null;
    const deliveryTime = eventTime || null;
    const selectedAddressId = (document.querySelector('[data-testid="select-saved-address"]') as HTMLSelectElement)?.value || "";
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const hasSavedAddress = selectedAddressId && selectedAddressId.trim() !== "" &&
      selectedAddressId !== "home" && selectedAddressId !== "office" &&
      uuidRegex.test(selectedAddressId);

    let validAddressId: string | undefined = undefined;
    let deliveryAddressText: string | undefined = undefined;

    if (hasSavedAddress) {
      validAddressId = selectedAddressId;
    } else if (addressLine1 && city && pincode) {
      deliveryAddressText = [addressLine1, addressLine2, city, addressState, pincode].filter(Boolean).join(', ');
    }

    const isSixtyMinOrder = !!onNavigate;
    const deliveryFeeCharged = appliedCoupon?.isFreeDelivery ? 0 : baseDeliveryCharges;
    const discountApplied = appliedCoupon?.isFreeDelivery
      ? baseDeliveryCharges
      : (appliedCoupon?.discount || 0);

    return {
      vegCount,
      eggCount,
      nonVegCount,
      subtotal,
      packagingFee,
      deliveryFeeCharged,
      gst,
      addonsTotal,
      total,
      deliveryDate,
      deliveryTime,
      validAddressId,
      deliveryAddressText,
      isSixtyMinOrder,
      discountApplied,
      saveAddressForFuture,
      addressLine2,
    };
  };

  // Handle payment button click - opens payment plan sheet
  const handlePayment = async () => {
    // Validate required fields first
    const orderData = prepareOrderData();

    if (!orderData.deliveryDate) {
      toast({
        title: "Date Required",
        description: "Please select a delivery date.",
        variant: "destructive",
      });
      return;
    }

    if (!orderData.deliveryTime) {
      toast({
        title: "Time Required",
        description: "Please select a delivery time.",
        variant: "destructive",
      });
      return;
    }

    // Check 12-hour minimum
    const selectedDateTime = new Date(`${orderData.deliveryDate}T${orderData.deliveryTime || '12:00'}`);
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

    // Validate address
    if (!orderData.validAddressId && !orderData.deliveryAddressText) {
      if (!addressLine1 || !city || !pincode) {
        toast({
          title: "Address Required",
          description: "Please enter a complete address.",
          variant: "destructive",
        });
        return;
      }
      if (!validateBangalorePincode(pincode)) {
        toast({
          title: BANGALORE_VALIDATION_ERROR.title,
          description: "Please enter a valid Bangalore pincode (starting with 560).",
          variant: "destructive",
        });
        return;
      }
    }

    // Store order data for payment processing
    orderDataRef.current = {
      portions: `${selectedPortions}-portions`,
      mealPreference: mealPreference,
      selectedMealType: selectedMealType,
      vegBoxes: orderData.vegCount,
      eggBoxes: orderData.eggCount,
      nonVegBoxes: orderData.nonVegCount,
      vegPlateSelections: vegPlateSelections,
      eggPlateSelections: eggPlateSelections,
      nonVegPlateSelections: nonVegPlateSelections,
      selectedAddons: selectedAddOns,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFeeCharged,
      tax: orderData.gst,
      addonsTotal: orderData.addonsTotal,
      total: orderData.total,
      deliveryDate: orderData.deliveryDate,
      deliveryTime: orderData.deliveryTime,
      addressId: orderData.validAddressId,
      deliveryAddress: orderData.deliveryAddressText,
      couponId: appliedCoupon?.id || undefined,
      couponCode: appliedCoupon?.code || undefined,
      discountApplied: orderData.discountApplied > 0 ? orderData.discountApplied : undefined,
      isSixtyMinOrder: orderData.isSixtyMinOrder,
      saveAddressForFuture: orderData.saveAddressForFuture,
      addressLine2: orderData.addressLine2,
    };

    setIsPaymentPlanOpen(true);
  };

  // Process payment after plan selection
  const processPayment = async () => {
    if (!razorpayKeyId) {
      // Try to fetch key again
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/razorpay`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.keyId) {
            setRazorpayKeyId(data.keyId);
          } else {
            toast({
              title: "Payment Error",
              description: data.error || "Payment gateway is not configured. Please contact support.",
              variant: "destructive",
            });
            return;
          }
        }
      } catch (error: any) {
        toast({
          title: "Payment Error",
          description: "Failed to initialize payment gateway. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsPaymentPlanOpen(false);
    const orderData = orderDataRef.current;
    if (!orderData) {
      toast({
        title: "Error",
        description: "Order data not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessingPayment(true);
      const paymentAmount = selectedPaymentPlan === "full" ? grandTotal : calculateInitialPayment();

      const createOrderResponse = await fetch(`${SUPABASE_URL}/functions/v1/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentAmount,
          currency: 'INR',
          receipt: `mealbox-${Date.now()}`,
        }),
      });

      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const { orderId: razorpayOrderId, amount } = await createOrderResponse.json();

      // Open Razorpay modal directly
      await openRazorpayModal({
        razorpayKeyId: razorpayKeyId!,
        razorpayOrderId: razorpayOrderId,
        amount: paymentAmount,
        description: "MealBox Order Payment",
        orderType: (orderDataRef.current?.isSixtyMinOrder ? 'sixty-min-mealbox' : 'mealbox') as 'meal_box',
        orderData: orderDataRef.current,
        onError: (error) => {
          toast({
            title: "Payment Error",
            description: error,
            variant: "destructive",
          });
          setIsProcessingPayment(false);
        },
      });

      setIsProcessingPayment(false);
    } catch (error: any) {
      console.error("Error initiating payment:", error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
      });
      setIsProcessingPayment(false);
    }
  };


  // Create order after payment verification
  const createOrderAfterPayment = async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) => {
    const orderData = orderDataRef.current;
    if (!orderData) {
      toast({
        title: "Error",
        description: "Order data not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingOrder(true);

      const { supabaseAuth } = await import("@/lib/supabase-auth");
      const { data: { user: supabaseUser } } = await supabaseAuth.auth.getUser();
      const userId = supabaseUser?.id || localStorage.getItem('userId');

      if (!userId) {
        throw new Error('User not authenticated');
      }

      let finalAddressId = orderData.addressId;
      if (!finalAddressId && orderData.deliveryAddress && orderData.saveAddressForFuture) {
        try {
          const newAddress = await addressService.create({
            label: "My Location",
            address: orderData.deliveryAddress,
            landmark: orderData.addressLine2 || undefined,
            isDefault: false,
          });
          finalAddressId = newAddress.id;
        } catch (addressError: any) {
          console.error("Error creating address:", addressError);
        }
      }

      // Build cutlery items array for order display
      const cutleryItems = [];
      if (servingSpoonQuantity > 0) {
        cutleryItems.push({ dishId: 'serving_spoons', name: 'Serving Spoons', quantity: servingSpoonQuantity, price: 20 });
      }
      if (plateQuantity > 0) {
        cutleryItems.push({ dishId: 'plates', name: 'Plates', quantity: plateQuantity, price: 10 });
      }
      if (waterBottleQuantity > 0) {
        cutleryItems.push({ dishId: 'water_bottles', name: 'Water Bottles', quantity: waterBottleQuantity, price: 10 });
      }

      const finalOrderData = {
        portions: orderData.portions,
        mealPreference: orderData.mealPreference,
        selectedMealType: orderData.selectedMealType,
        vegBoxes: orderData.vegBoxes,
        eggBoxes: orderData.eggBoxes,
        nonVegBoxes: orderData.nonVegBoxes,
        vegPlateSelections: orderData.vegPlateSelections,
        eggPlateSelections: orderData.eggPlateSelections,
        nonVegPlateSelections: orderData.nonVegPlateSelections,
        selectedAddons: orderData.selectedAddons,
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee,
        tax: orderData.tax,
        doorstepDeliveryFee: doorstepDeliveryFee,
        total: orderData.total,
        deliveryDate: orderData.deliveryDate,
        deliveryTime: orderData.deliveryTime,
        addressId: finalAddressId,
        deliveryAddress: orderData.deliveryAddress,
        couponId: orderData.couponId,
        couponCode: orderData.couponCode,
        discountApplied: orderData.discountApplied,
      };

      let createdOrder;
      if (orderData.isSixtyMinOrder) {
        createdOrder = await sixtyMinMealboxOrderService.create(finalOrderData);
      } else {
        createdOrder = await mealboxOrderService.create(finalOrderData);
      }

      const { case: paymentCase } = getPaymentCase();
      let paymentStage: 'initial' | 'second' | 'final' | 'full' = 'full';
      if (paymentCase === 1) {
        paymentStage = 'initial';
      } else if (paymentCase === 2) {
        paymentStage = 'initial';
      } else if (paymentCase === 3 || paymentCase === 4) {
        paymentStage = 'full';
      }

      const isTestPayment = razorpayKeyId?.includes('test') || razorpayKeyId?.includes('rzp_test') || false;

      if (createdOrder?.id) {
        const orderType: 'mealbox' | 'sixty_min_mealbox' = orderData.isSixtyMinOrder ? 'sixty_min_mealbox' : 'mealbox';
        const paymentPayload = {
          orderId: createdOrder.id,
          orderType: orderType,
          orderNumber: createdOrder.order_number,
          userId: userId,
          paymentStage: paymentStage,
          amount: calculateInitialPayment(),
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: razorpayPaymentId,
          razorpaySignature: razorpaySignature,
          razorpayReceipt: razorpayOrderId,
          paymentStatus: 'success' as const,
          isTestPayment: isTestPayment,
          orderItems: [
            { dishId: 'mealbox', name: 'MealBox', quantity: orderData.vegBoxes + orderData.eggBoxes + orderData.nonVegBoxes, price: orderData.subtotal },
            ...cutleryItems,
          ],
          subtotal: orderData.subtotal,
          gst: orderData.tax,
          platformFee: 0,
          packagingFee: 0,
          deliveryFee: orderData.deliveryFee,
          discountApplied: orderData.discountApplied,
          totalOrderAmount: orderData.total,
          deliveryDate: orderData.deliveryDate,
          deliveryTime: orderData.deliveryTime,
          metadata: {
            payment_date: new Date().toISOString(),
            payment_method: 'razorpay',
            portions: orderData.portions,
            mealPreference: orderData.mealPreference,
          },
        };

        try {
          await paymentService.create(paymentPayload);
        } catch (paymentError: any) {
          console.error('[Payment] Error storing payment details:', paymentError);
        }
      }

      // Update order status to "confirmed" after payment (this will trigger notification via database trigger)
      if (createdOrder?.id) {
        try {
          const { supabaseAuth } = await import("@/lib/supabase-auth");
          const tableName = orderData.isSixtyMinOrder ? 'sixty_min_mealbox_orders' : 'mealbox_orders';

          const { error: updateError } = await supabaseAuth
            .from(tableName)
            .update({ status: 'confirmed' })
            .eq('id', createdOrder.id);

          if (updateError) {
            console.error("Error updating order status:", updateError);
            // Continue even if status update fails
          } else {
            console.log(`Order ${createdOrder.id} status updated to 'confirmed' - notification trigger will fire`);
          }
        } catch (updateError: any) {
          console.error("Error updating order status:", updateError);
          // Continue even if status update fails
        }
      }

      clearMealBoxProgress();
      const itemCount = orderData.vegBoxes + orderData.eggBoxes + orderData.nonVegBoxes;
      analytics.trackOrderCompleted(
        `mealbox-${Date.now()}`,
        orderData.total,
        itemCount,
        'paid'
      ).catch(() => { });

      toast({
        title: "Order Confirmed!",
        description: "Your MealBox order has been placed successfully.",
      });

      // Send PUSH NOTIFICATION for order confirmation (FCM - transactional)
      const notifyUserId = userId || localStorage.getItem('userId');
      if (notifyUserId && createdOrder?.id) {
        fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: notifyUserId,
            title: '🎉 MealBox Order Confirmed!',
            body: `Order #${createdOrder?.order_number || ''} confirmed! We'll start preparing your mealbox.`,
            event_name: 'order_confirmed',
            category: 'transactional',
            deep_link: createdOrder?.id ? `plattr://orders/${createdOrder.id}` : 'plattr://orders',
            metadata: {
              order_id: createdOrder?.id,
              order_number: createdOrder?.order_number,
              order_type: orderData.isSixtyMinOrder ? 'sixty_min_mealbox' : 'mealbox'
            },
          }),
        }).catch(err => console.log('[Notification] Failed to send mealbox order notification:', err));
      }

      // Navigate to order status page
      if (createdOrder?.id) {
        setTimeout(() => {
          navigate(`/orders/${createdOrder.id}`, { replace: true });
        }, 200);
      } else {
        console.warn('[MealBox] Order created but ID not available, redirecting to orders page');
        setTimeout(() => {
          navigate("/orders", { replace: true });
        }, 200);
      }
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
  };

  // Handle submit order request (without payment)
  const handleSubmitOrder = async () => {
    const orderData = prepareOrderData();

    // Same validations as handlePayment
    if (!orderData.deliveryDate || !orderData.deliveryTime) {
      toast({
        title: "Date/Time Required",
        description: "Please select delivery date and time.",
        variant: "destructive",
      });
      return;
    }

    const selectedDateTime = new Date(`${orderData.deliveryDate}T${orderData.deliveryTime || '12:00'}`);
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

    if (!orderData.validAddressId && !orderData.deliveryAddressText) {
      if (!addressLine1 || !city || !pincode) {
        toast({
          title: "Address Required",
          description: "Please enter a complete address.",
          variant: "destructive",
        });
        return;
      }
      if (!validateBangalorePincode(pincode)) {
        toast({
          title: BANGALORE_VALIDATION_ERROR.title,
          description: "Please enter a valid Bangalore pincode (starting with 560).",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsCreatingOrder(true);

      // Save address if needed
      let validAddressId = orderData.validAddressId;
      if (!validAddressId && orderData.deliveryAddressText && orderData.saveAddressForFuture) {
        try {
          const fullAddress = [addressLine1, addressLine2, city, addressState, pincode].filter(Boolean).join(', ');
          const newAddress = await addressService.create({
            label: "Saved Address",
            address: fullAddress,
            landmark: addressLine2 || undefined,
            isDefault: false,
          });
          validAddressId = newAddress.id;
        } catch (err) {
          console.error("Failed to save address:", err);
        }
      }

      // Build cutlery items array for order display (for payment payload)
      const cutleryItems = [];
      if (servingSpoonQuantity > 0) {
        cutleryItems.push({ dishId: 'serving_spoons', name: 'Serving Spoons', quantity: servingSpoonQuantity, price: 20 });
      }
      if (plateQuantity > 0) {
        cutleryItems.push({ dishId: 'plates', name: 'Plates', quantity: plateQuantity, price: 10 });
      }
      if (waterBottleQuantity > 0) {
        cutleryItems.push({ dishId: 'water_bottles', name: 'Water Bottles', quantity: waterBottleQuantity, price: 10 });
      }

      const finalOrderData = {
        portions: `${selectedPortions}-portions`,
        mealPreference: mealPreference,
        selectedMealType: selectedMealType,
        vegBoxes: orderData.vegCount,
        eggBoxes: orderData.eggCount,
        nonVegBoxes: orderData.nonVegCount,
        vegPlateSelections: vegPlateSelections,
        eggPlateSelections: eggPlateSelections,
        nonVegPlateSelections: nonVegPlateSelections,
        selectedAddons: selectedAddOns,
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFeeCharged,
        tax: orderData.gst,
        doorstepDeliveryFee: doorstepDeliveryFee,
        total: orderData.total,
        deliveryDate: orderData.deliveryDate,
        deliveryTime: orderData.deliveryTime,
        addressId: validAddressId,
        deliveryAddress: orderData.deliveryAddressText,
        couponId: appliedCoupon?.id || undefined,
        couponCode: appliedCoupon?.code || undefined,
        discountApplied: orderData.discountApplied > 0 ? orderData.discountApplied : undefined,
      };

      if (orderData.isSixtyMinOrder) {
        await sixtyMinMealboxOrderService.create(finalOrderData);
      } else {
        await mealboxOrderService.create(finalOrderData);
      }

      clearMealBoxProgress();
      const itemCount = orderData.vegCount + orderData.eggCount + orderData.nonVegCount;
      analytics.trackOrderCompleted(
        `mealbox-${Date.now()}`,
        orderData.total,
        itemCount,
        'pending'
      ).catch(() => { });

      toast({
        title: "Order Request Submitted!",
        description: "Your order request has been submitted. Our team will confirm shortly.",
      });

      // Navigate to order status page (for pending orders, still show status)
      // Note: This is for submit without payment, so order might not have ID yet
      // In this case, we can navigate to orders list or wait for order creation
      setTimeout(() => {
        navigate("/orders", { replace: true });
      }, 200);
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: error.message || "Failed to submit order. Please try again.",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const openDishDetail = (dish: Dish) => {
    setDetailDish(dish);
    setDishDetailOpen(true);
  };

  // Helper to get category image
  const getCategoryImageUrl = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);

    // Check for DB image_url (snake_case) or imageUrl (camelCase)
    const dbImage = (category as any)?.image_url || category?.imageUrl;

    if (dbImage && !dbImage.startsWith('/images/')) {
      return getSupabaseImageUrl(dbImage);
    }
    return CATEGORY_IMAGES[categoryId] || idliImage1;
  };

  // Helper to get subcategory (dish type) image URL from Supabase with local fallback
  // Moved inside component to access subcategories state
  const getSubcategoryImage = (dishType: string): string => {
    // Try to find image in fetched subcategories
    const subcat = subcategories.find((s: any) => s.name === dishType);
    if (subcat?.image_url) {
      return getSupabaseImageUrl(subcat.image_url);
    }

    const fallbackImage = DISH_TYPE_IMAGES[dishType] || DISH_TYPE_IMAGES['default'];
    return getDishTypeImage(dishType, fallbackImage);
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
      // All slots filled - show upgrade portion dialog instead of replacing
      setPendingDishForUpgrade(item);
      setUpgradePortionDialogOpen(true);
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

  // Handle portion upgrade - called from upgrade dialog
  const handleUpgradePortion = (newPortionSize: PortionSize) => {
    if (!pendingDishForUpgrade) return;

    // Update portion size
    setSelectedPortions(newPortionSize);

    // Get current selections and add the pending dish
    const currentSelections = getCurrentPlateSelections();

    // Create new selections array with the new size
    // Keep existing selections and add empty slots
    const newSelections: PortionSelection[] = Array.from({ length: newPortionSize }, (_, i) => {
      if (i < currentSelections.length && currentSelections[i].itemId) {
        return currentSelections[i];
      }
      // Add the pending dish to the first empty slot
      if (i === currentSelections.length && pendingDishForUpgrade) {
        return {
          slot: i,
          itemId: pendingDishForUpgrade.id,
          item: pendingDishForUpgrade
        };
      }
      return { slot: i, itemId: null, item: undefined };
    });

    // Update the appropriate state based on current dietary tab
    if (currentDietaryTab === "veg") {
      setVegPlateSelections(newSelections);
    } else if (currentDietaryTab === "egg") {
      setEggPlateSelections(newSelections);
    } else {
      setNonVegPlateSelections(newSelections);
    }

    // Close dialog and clear pending dish
    setUpgradePortionDialogOpen(false);
    setPendingDishForUpgrade(null);
    setSelectedSlotIndex(newPortionSize - 1);

    toast({
      title: "Portion Size Upgraded!",
      description: `Your ${currentDietaryTab.toUpperCase()} box now has ${newPortionSize} portions.`,
    });
  };

  return (
    <PageWithLoader>
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
        {/* Fixed Back Button Header */}
        <div
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
          style={{
            backgroundColor: scrollY > 50 ? 'white' : 'transparent',
            boxShadow: scrollY > 50 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            paddingTop: '8px',
            paddingBottom: '8px',
            margin: 0,
          }}
        >
          <div className="px-4">
            <Button
              variant="ghost"
              size="sm"
              className={scrollY > 50 ? "text-[#06352A] hover:text-[#06352A] hover:bg-gray-100" : "text-white hover:text-white hover:bg-white/20"}
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
          </div>
        </div>

        {/* Header Section with Location and Cart */}
        <div
          className="relative z-10 px-4 pb-6"
          style={{
            paddingTop: '52px',
          }}
        >
          {/* Location and Cart */}
          <div className="flex items-center justify-between mb-6">
            <button
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              onClick={() => navigate("/location")}
              data-testid="button-location"
            >
              <MapPin className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-[18px] max-w-[120px] truncate" style={{ fontFamily: "Sweet Sans Pro" }}>
                {locationLabel}
              </span>
            </button>
            <div className="flex items-center gap-2">
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
              <a
                href="tel:+917026644556"
                className="flex items-center justify-center w-10 h-10 bg-[#1A9952] rounded-[10px] shadow-md hover:bg-[#158043] transition-colors"
                data-testid="button-call"
                aria-label="Call us"
              >
                <Phone className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          {/* Service Navigation Tabs */}
          <div className={onNavigate ? "grid grid-cols-2 gap-3 max-w-xs mx-auto" : "grid grid-cols-4 gap-2 lg:gap-4 max-w-2xl lg:max-w-4xl mx-auto"}>
            <button
              onClick={() => {
                setSelectedService("bulk-meals");
                navigate("/bulk-meals");
              }}
              data-testid="service-tab-bulk-meals"
              className={cn(
                "flex flex-col items-center justify-center transition-all hover-elevate active-elevate-2 aspect-square p-0"
              )}
              style={{
                borderRadius: "10px",
                backgroundColor: selectedService === "bulk-meals" ? "#06352A" : "#FFFFFF",
                color: selectedService === "bulk-meals" ? "#F5E9DB" : "#06352A",
              }}
            >
              <img
                src={selectedService === "bulk-meals" ? bulkMealsIconActive : bulkMealsIconInactive}
                alt="Bulk Meals"
                className="w-full h-full object-cover rounded-[10px]"
              />
            </button>

            <button
              onClick={() => setSelectedService("mealbox")}
              data-testid="service-tab-mealbox"
              className={cn(
                "flex flex-col items-center justify-center transition-all hover-elevate active-elevate-2 aspect-square p-0"
              )}
              style={{
                borderRadius: "10px",
                backgroundColor: selectedService === "mealbox" ? "#06352A" : "#FFFFFF",
                color: selectedService === "mealbox" ? "#F5E9DB" : "#06352A",
              }}
            >
              <img
                src={selectedService === "mealbox" ? mealBoxIconActive : mealBoxIconInactive}
                alt="MealBox"
                className="w-full h-full object-cover rounded-[10px]"
              />
            </button>

            {!onNavigate && (
              <>
                <button
                  onClick={() => {
                    setSelectedService("snack-box");
                    navigate("/snack-box");
                  }}
                  data-testid="service-tab-snack-box"
                  className="flex flex-col items-center justify-center transition-all hover-elevate active-elevate-2 aspect-square p-0"
                  style={{
                    borderRadius: "10px",
                    backgroundColor: selectedService === "snack-box" ? "#06352A" : "#FFFFFF",
                    color: selectedService === "snack-box" ? "#F5E9DB" : "#06352A",
                  }}
                >
                  <img
                    src={selectedService === "snack-box" ? snackBoxIconActive : snackBoxIconInactive}
                    alt="Snack-box"
                    className="w-full h-full object-cover rounded-[10px]"
                  />
                </button>

                <button
                  onClick={() => {
                    setSelectedService("catering");
                    navigate("/catering");
                  }}
                  data-testid="service-tab-catering"
                  className="flex flex-col items-center justify-center transition-all hover-elevate active-elevate-2 aspect-square p-0"
                  style={{
                    borderRadius: "10px",
                    backgroundColor: selectedService === "catering" ? "#06352A" : "#FFFFFF",
                    color: selectedService === "catering" ? "#F5E9DB" : "#06352A",
                  }}
                >
                  <img
                    src={selectedService === "catering" ? cateringIconActive : cateringIconInactive}
                    alt="Catering"
                    className="w-full h-full object-cover rounded-[10px]"
                  />
                </button>
              </>
            )}
          </div>
        </div>
        {/* Content below green background */}
        <div className="relative z-10 px-4" style={{ marginTop: "20px" }}>

          {/* Back Navigation - Sticky for steps 4 & 5, non-sticky for others */}
          {currentStep > 1 && (
            <div
              className={`-mx-4 px-4 ${(currentStep === 4 || currentStep === 5) ? 'sticky top-0 z-50 bg-white py-2' : 'mb-4'}`}
            >
              <button
                onClick={handleBackStep}
                className="flex items-center justify-between text-gray-700 hover-elevate active-elevate-2 px-2 py-1 rounded-md w-full"
                style={{ fontFamily: "Sweet Sans Pro" }}
                data-testid="button-back-step"
              >
                <div className="flex items-center gap-2">
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
                </div>
                {(currentStep === 4 || currentStep === 5) && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
              </button>
            </div>
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
            <div>
              {/* Sticky Proceed Card Section - below back navigation (top: 92px) */}
              <div className="sticky -mx-4 px-4 pt-0 pb-2 bg-white" style={{ top: "92px", zIndex: 55 }}>
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

              {/* Sticky Search Bar Section - below proceed card (top: 180px) */}
              <div className="sticky bg-white pb-3 pt-3 -mx-4 px-4" style={{ top: "180px", zIndex: 60 }}>
                <div
                  className="flex items-center gap-2 bg-white px-4 py-3 border border-gray-200 cursor-pointer"
                  style={{ borderRadius: "10px" }}
                  onClick={() => { handleInteraction(); setSearchOverlayOpen(true); }}
                  data-testid="button-open-search-step4"
                >
                  <Search className="w-6 h-6 text-gray-500" />
                  <span
                    className={`flex-1 text-base ${searchQuery ? 'text-gray-800' : 'text-gray-400'}`}
                    style={{ fontFamily: "Sweet Sans Pro" }}
                  >
                    {searchQuery || "Search for dishes..."}
                  </span>
                  {searchQuery && (
                    <button
                      className="p-1 hover:bg-gray-100 rounded-full"
                      onClick={(e) => { e.stopPropagation(); setSearchQuery(""); }}
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filters & Sort - Single Row */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide mb-4">
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

                {/* Tasting Menu Button */}
                <Button
                  onClick={() => setLocation("/tasting-menu")}
                  className="w-auto h-6 px-2 text-[10px] bg-white border border-gray-200 rounded-full gap-0.5 flex-shrink-0 hover:bg-gray-50"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  variant="outline"
                  size="sm"
                  data-testid="button-tasting-menu"
                >
                  <Utensils className="w-2.5 h-2.5" />
                  Tasting Menu
                </Button>
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

              {/* CategoryPage-style Layout */}
              <div className="flex gap-0 flex-1 w-full max-w-full">
                {/* Left Sidebar - Category Filters (Starters, Sides, Mains, etc.) - Sticky with internal scroll */}
                <aside className="w-20 md:w-24 border-r bg-card/50 backdrop-blur-sm flex-shrink-0 sticky self-start" style={{ top: '244px', maxHeight: 'calc(100vh - 244px)', overflowY: 'auto' }}>
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

                    {/* Show category options (Starters, Sides, Mains, etc.) */}
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
                  {/* Horizontal Dish Type Tabs - Sticky (65's, Chilli, Fry, etc.) - Only show when there are dish types */}
                  {dishTypes.length > 0 && (
                    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm pb-3 mb-2 -mx-3 md:-mx-4 px-3 md:px-4">
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-1 pt-2">
                        {/* Dish type options (65's, Chilli, Fry, etc.) - Compact pill design */}
                        {dishTypes.map((dishType) => {
                          return (
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
                                "text-xs md:text-sm font-semibold whitespace-nowrap",
                                selectedDishType === dishType ? "text-primary" : "text-foreground"
                              )}>
                                {dishType}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <h2 className="text-xl font-bold font-serif" data-testid="text-section-title">
                      {categories.find(c => c.id === selectedCategory)?.name || 'All Categories'}
                    </h2>
                  </div>

                  {isLoadingDishes ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Loading dishes...</p>
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No dishes match the selected filters</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredItems.map((item) => {
                        const currentSelections = getCurrentPlateSelections();
                        const isSelected = currentSelections.some(sel => sel.itemId === item.id);
                        const dish = dishes.find(d => d.id === item.id);

                        return (
                          <Card
                            key={item.id}
                            className={cn(
                              "overflow-hidden hover-elevate group",
                              isSelected && "ring-2 ring-primary"
                            )}
                            data-testid={`card-dish-${item.id}`}
                          >
                            <div
                              className="relative h-40 md:h-48 overflow-hidden cursor-pointer"
                              onClick={() => { handleInteraction(); if (dish) openDishDetail(dish); }}
                              data-testid={`image-dish-${item.id}`}
                            >
                              <LazyImage
                                src={dish ? getDishImage(dish) : item.image || idliImage1}
                                alt={item.name}
                                containerClassName="w-full h-full"
                                className="transition-transform duration-500 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              {isSelected && (
                                <div className="absolute top-2 right-2 z-10">
                                  <div className="w-6 h-6 bg-[#1A9952] rounded-full flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="p-3 md:p-4 flex flex-col h-[140px]">
                              <h3 className="font-bold text-sm md:text-base line-clamp-2 min-h-[40px] mb-2" data-testid={`text-dish-name-${item.id}`}>
                                {item.name}
                              </h3>
                              <div className="flex items-center gap-1 mb-2">
                                <span className="text-primary font-bold text-lg" data-testid={`text-dish-price-${item.id}`}>
                                  ₹{item.price.toFixed(0)}
                                </span>
                                {item.quantity ? (
                                  <span className="text-[10px] text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>{item.quantity}</span>
                                ) : (
                                  <span className="text-[10px] text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>per serve</span>
                                )}
                              </div>
                              <div className="mt-auto">
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInteraction();
                                    handleItemSelection(item);
                                  }}
                                  variant={isSelected ? "secondary" : "default"}
                                  className="w-full rounded-full px-4"
                                  data-testid={`button-add-${item.id}`}
                                >
                                  {isSelected ? "SELECTED" : "ADD"}
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Bottom "Proceed to Next Section" Button - Shown only when all slots across all active dietary tabs are filled */}
              {allPlatesFilled && (
                <div
                  className="fixed left-0 right-0 z-[110] px-4 py-6 bg-white border-t-2 border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] animate-in fade-in slide-in-from-bottom-5 duration-500"
                  style={{
                    bottom: 'var(--toast-viewport-height, 0px)',
                    transition: 'bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <div className="max-w-md mx-auto">
                    <Button
                      onClick={handleNextStep}
                      className="w-full h-16 rounded-[24px] text-lg font-bold flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all active:scale-95"
                      style={{
                        fontFamily: "Sweet Sans Pro",
                        backgroundColor: "#1A9952",
                        color: "white",
                        border: "none"
                      }}
                      data-testid="button-proceed-sticky-bottom"
                    >
                      PROCEED TO NEXT SECTION
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                    <p className="text-center text-gray-400 text-[10px] mt-2 font-medium uppercase tracking-wider" style={{ fontFamily: "Sweet Sans Pro" }}>
                      Box Configuration Complete
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Cart Details */}
          {currentStep === 5 && (
            <div className="pb-4">
              {/* Sticky Cart Total Bar Section - below back navigation (top: 40px) */}
              <div
                className="sticky z-40 bg-white border-b border-gray-200 -mx-4 px-4 py-3 mb-4"
                style={{
                  boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  top: "40px"
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
                        const packagingFee = Math.round(subtotal * 0.06); // 6% packaging charge
                        const baseDeliveryCharges = Math.max(Math.round(subtotal * 0.06), 199); // 6% delivery charges with minimum ₹199
                        const deliveryCharges = appliedCoupon?.isFreeDelivery ? 0 : baseDeliveryCharges;
                        const gst = Math.round(subtotal * 0.05); // 5% GST
                        const discount = appliedCoupon?.isFreeDelivery ? 0 : (appliedCoupon?.discount || 0);
                        const grandTotal = subtotal + packagingFee + deliveryCharges + gst - discount;
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
                        Veg Plates
                      </span>
                      <span className="font-bold text-sm sm:text-base ml-auto" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        ×{vegBoxes}
                      </span>
                    </div>

                    {/* Veg Items */}
                    <div className="space-y-3 mb-3">
                      {vegPlateSelections.map((selection, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            <LazyImage
                              src={selection.item?.image || biryaniImage1}
                              alt={selection.item?.name || "Dish"}
                              containerClassName="w-full h-full"
                              className="w-full h-full object-cover"
                              fallbackSrc={biryaniImage1}
                            />
                          </div>
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
                        Egg Plates
                      </span>
                      <span className="font-bold text-sm sm:text-base ml-auto" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        ×{eggBoxes}
                      </span>
                    </div>

                    {/* Egg Items */}
                    <div className="space-y-3 mb-3">
                      {eggPlateSelections.map((selection, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            <LazyImage
                              src={selection.item?.image || biryaniImage1}
                              alt={selection.item?.name || "Dish"}
                              containerClassName="w-full h-full"
                              className="w-full h-full object-cover"
                              fallbackSrc={biryaniImage1}
                            />
                          </div>
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
                        Non-Veg Plates
                      </span>
                      <span className="font-bold text-sm sm:text-base ml-auto" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        ×{nonVegBoxes}
                      </span>
                    </div>

                    {/* Non-Veg Items */}
                    <div className="space-y-3 mb-3">
                      {nonVegPlateSelections.map((selection, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            <LazyImage
                              src={selection.item?.image || biryaniImage1}
                              alt={selection.item?.name || "Dish"}
                              containerClassName="w-full h-full"
                              className="w-full h-full object-cover"
                              fallbackSrc={biryaniImage1}
                            />
                          </div>
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
                  {(() => {
                    const vegCount = parseInt(vegBoxes) || 0;
                    const eggCount = parseInt(eggBoxes) || 0;
                    const nonVegCount = parseInt(nonVegBoxes) || 0;
                    const vegTotal = vegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * vegCount;
                    const eggTotal = eggPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * eggCount;
                    const nonVegTotal = nonVegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * nonVegCount;
                    const subtotal = vegTotal + eggTotal + nonVegTotal;
                    const packagingFee = Math.round(subtotal * 0.06); // 6% packaging charge
                    const baseDeliveryCharges = Math.max(Math.round(subtotal * 0.06), 199); // 6% delivery charges with minimum ₹199
                    const deliveryCharges = appliedCoupon?.isFreeDelivery ? 0 : baseDeliveryCharges;
                    const gst = Math.round(subtotal * 0.05); // 5% GST
                    const discount = appliedCoupon?.isFreeDelivery ? 0 : (appliedCoupon?.discount || 0);

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700" style={{ fontFamily: "Sweet Sans Pro" }}>
                            Packaging (6%)
                          </span>
                          <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                            ₹{packagingFee.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700" style={{ fontFamily: "Sweet Sans Pro" }}>
                            Delivery Charges (6%)
                          </span>
                          <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: appliedCoupon?.isFreeDelivery ? "#1A9952" : "#06352A" }}>
                            {appliedCoupon?.isFreeDelivery ? (
                              <><s className="text-gray-400 mr-1">₹{baseDeliveryCharges.toLocaleString('en-IN')}</s> FREE</>
                            ) : (
                              `₹${deliveryCharges.toLocaleString('en-IN')}`
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700" style={{ fontFamily: "Sweet Sans Pro" }}>
                            GST (5%)
                          </span>
                          <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                            ₹{gst.toLocaleString('en-IN')}
                          </span>
                        </div>
                        {discount > 0 && (
                          <div className="flex items-center justify-between text-green-600">
                            <span className="text-sm" style={{ fontFamily: "Sweet Sans Pro" }}>
                              Discount ({appliedCoupon?.code})
                            </span>
                            <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro" }}>
                              -₹{discount.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Business Order Option */}
                <div
                  className="mb-6 rounded-xl p-4 border-2 transition-all cursor-pointer"
                  style={{
                    backgroundColor: isBusinessOrder ? "#E8F5EE" : "#FAFAFA",
                    borderColor: isBusinessOrder ? "#1A9952" : "#E5E7EB"
                  }}
                  onClick={() => setIsBusinessOrder(!isBusinessOrder)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: isBusinessOrder ? "#1A9952" : "#D1D5DB",
                        backgroundColor: isBusinessOrder ? "#1A9952" : "white"
                      }}
                    >
                      {isBusinessOrder && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <span
                        className="font-semibold text-sm"
                        style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
                      >
                        Business Order
                      </span>
                      <p className="text-xs text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                        Get GST invoice for your order
                      </p>
                    </div>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: isBusinessOrder ? "#1A9952" : "#E5E7EB" }}
                    >
                      <svg className="w-5 h-5" style={{ color: isBusinessOrder ? "white" : "#9CA3AF" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  {isBusinessOrder && (
                    <div className="mt-4 pt-4 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                      <label className="block text-sm font-medium mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        Enter GST Number
                      </label>
                      <input
                        type="text"
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                        placeholder="e.g., 29ABCDE1234F1Z5"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1A9952] bg-white"
                        style={{ fontFamily: "Sweet Sans Pro" }}
                        data-testid="input-gst-number-mealbox"
                      />
                    </div>
                  )}
                </div>

                {/* Coupon Input */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Coupons & Offers
                  </label>
                  <CouponInput
                    subtotal={(() => {
                      const vegCount = parseInt(vegBoxes) || 0;
                      const eggCount = parseInt(eggBoxes) || 0;
                      const nonVegCount = parseInt(nonVegBoxes) || 0;
                      const vegTotal = vegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * vegCount;
                      const eggTotal = eggPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * eggCount;
                      const nonVegTotal = nonVegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * nonVegCount;
                      return vegTotal + eggTotal + nonVegTotal;
                    })()}
                    orderType="mealbox"
                    deliveryFee={(() => {
                      const vegCount = parseInt(vegBoxes) || 0;
                      const eggCount = parseInt(eggBoxes) || 0;
                      const nonVegCount = parseInt(nonVegBoxes) || 0;
                      const vegTotal = vegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * vegCount;
                      const eggTotal = eggPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * eggCount;
                      const nonVegTotal = nonVegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * nonVegCount;
                      const subtotal = vegTotal + eggTotal + nonVegTotal;
                      return Math.max(Math.round(subtotal * 0.06), 199); // 6% delivery charges with minimum ₹199
                    })()}
                    onCouponApply={handleCouponApply}
                    onCouponRemove={handleCouponRemove}
                    appliedCoupon={appliedCoupon}
                  />
                </div>

                {/* Grand Total */}
                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                      Grand Total
                    </span>
                    <span className="font-bold text-2xl" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                      ₹{calculateGrandTotal().toLocaleString('en-IN')}
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
                  ₹{calculateGrandTotal().toLocaleString('en-IN')}
                  <ChevronRight className="w-5 h-5" />
                </span>
              </Button>
            </div>
          )}

          {/* Step 6: Add-Ons */}
          {currentStep === 6 && (
            <div className="pb-4" data-testid="step-6-addons">
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

              {/* Add-Ons List - Cutlery */}
              <div className="space-y-4 mb-6">
                {/* Serving Spoons - ₹20 per piece */}
                <div
                  className="flex items-start gap-4 p-4 border-2 rounded-lg"
                  style={{
                    borderColor: servingSpoonQuantity > 0 ? "#1A9952" : "#E5E7EB",
                    backgroundColor: servingSpoonQuantity > 0 ? "#F0F9F4" : "white"
                  }}
                >
                  <img src={servingSpoonIcon} alt="Serving Spoons" className="w-12 h-12 object-contain flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-base" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        Serving Spoons
                      </h3>
                      <span className="text-sm font-semibold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        ₹20/piece
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => setServingSpoonQuantity(Math.max(0, servingSpoonQuantity - 1))}
                        className="w-8 h-8 rounded border-2 flex items-center justify-center"
                        style={{
                          borderColor: "#1A9952",
                          backgroundColor: servingSpoonQuantity > 0 ? "#1A9952" : "white"
                        }}
                        disabled={servingSpoonQuantity === 0}
                      >
                        <Minus className={`w-4 h-4 ${servingSpoonQuantity > 0 ? "text-white" : "text-gray-400"}`} />
                      </button>
                      <span className="text-base font-semibold min-w-[2rem] text-center" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        {servingSpoonQuantity}
                      </span>
                      <button
                        onClick={() => setServingSpoonQuantity(servingSpoonQuantity + 1)}
                        className="w-8 h-8 rounded border-2 flex items-center justify-center"
                        style={{
                          borderColor: "#1A9952",
                          backgroundColor: "#1A9952"
                        }}
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Spoons & Forks - Free */}
                <div
                  className="flex items-start gap-4 p-4 border-2 rounded-lg"
                  style={{
                    borderColor: selectedAddOns.includes('spoons_forks') ? "#1A9952" : "#E5E7EB",
                    backgroundColor: selectedAddOns.includes('spoons_forks') ? "#F0F9F4" : "white"
                  }}
                >
                  <img src={spoonForkIcon} alt="Spoons & Forks" className="w-12 h-12 object-contain flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-base" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        Spoons & Forks
                      </h3>
                      <span className="text-sm font-semibold text-green-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                        Free
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAddOns(prev =>
                        prev.includes('spoons_forks')
                          ? prev.filter(id => id !== 'spoons_forks')
                          : [...prev, 'spoons_forks']
                      );
                    }}
                    className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor: "#1A9952",
                      backgroundColor: selectedAddOns.includes('spoons_forks') ? "#1A9952" : "white"
                    }}
                    data-testid="addon-spoons-forks"
                  >
                    {selectedAddOns.includes('spoons_forks') && <Check className="w-4 h-4 text-white" />}
                  </button>
                </div>

                {/* Plates - ₹10 per piece */}
                <div
                  className="flex items-start gap-4 p-4 border-2 rounded-lg"
                  style={{
                    borderColor: plateQuantity > 0 ? "#1A9952" : "#E5E7EB",
                    backgroundColor: plateQuantity > 0 ? "#F0F9F4" : "white"
                  }}
                >
                  <img src={plateIcon} alt="Plates" className="w-12 h-12 object-contain flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-base" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        Plates
                      </h3>
                      <span className="text-sm font-semibold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        ₹10/piece
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => setPlateQuantity(Math.max(0, plateQuantity - 1))}
                        className="w-8 h-8 rounded border-2 flex items-center justify-center"
                        style={{
                          borderColor: "#1A9952",
                          backgroundColor: plateQuantity > 0 ? "#1A9952" : "white"
                        }}
                        disabled={plateQuantity === 0}
                      >
                        <Minus className={`w-4 h-4 ${plateQuantity > 0 ? "text-white" : "text-gray-400"}`} />
                      </button>
                      <span className="text-base font-semibold min-w-[2rem] text-center" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        {plateQuantity}
                      </span>
                      <button
                        onClick={() => setPlateQuantity(plateQuantity + 1)}
                        className="w-8 h-8 rounded border-2 flex items-center justify-center"
                        style={{
                          borderColor: "#1A9952",
                          backgroundColor: "#1A9952"
                        }}
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Water Bottles - ₹10 per piece */}
                <div
                  className="flex items-start gap-4 p-4 border-2 rounded-lg"
                  style={{
                    borderColor: waterBottleQuantity > 0 ? "#1A9952" : "#E5E7EB",
                    backgroundColor: waterBottleQuantity > 0 ? "#F0F9F4" : "white"
                  }}
                >
                  <img src={waterBottleIcon} alt="Water Bottles" className="w-12 h-12 object-contain flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-base" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        Water Bottles
                      </h3>
                      <span className="text-sm font-semibold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        ₹10/piece
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => setWaterBottleQuantity(Math.max(0, waterBottleQuantity - 1))}
                        className="w-8 h-8 rounded border-2 flex items-center justify-center"
                        style={{
                          borderColor: "#1A9952",
                          backgroundColor: waterBottleQuantity > 0 ? "#1A9952" : "white"
                        }}
                        disabled={waterBottleQuantity === 0}
                      >
                        <Minus className={`w-4 h-4 ${waterBottleQuantity > 0 ? "text-white" : "text-gray-400"}`} />
                      </button>
                      <span className="text-base font-semibold min-w-[2rem] text-center" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        {waterBottleQuantity}
                      </span>
                      <button
                        onClick={() => setWaterBottleQuantity(waterBottleQuantity + 1)}
                        className="w-8 h-8 rounded border-2 flex items-center justify-center"
                        style={{
                          borderColor: "#1A9952",
                          backgroundColor: "#1A9952"
                        }}
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tissues - Free */}
                <div
                  className="flex items-start gap-4 p-4 border-2 rounded-lg"
                  style={{
                    borderColor: selectedAddOns.includes('tissues') ? "#1A9952" : "#E5E7EB",
                    backgroundColor: selectedAddOns.includes('tissues') ? "#F0F9F4" : "white"
                  }}
                >
                  <img src={tissueIcon} alt="Tissues" className="w-12 h-12 object-contain flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-base" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        Tissues
                      </h3>
                      <span className="text-sm font-semibold text-green-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                        Free
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAddOns(prev =>
                        prev.includes('tissues')
                          ? prev.filter(id => id !== 'tissues')
                          : [...prev, 'tissues']
                      );
                    }}
                    className="w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor: "#1A9952",
                      backgroundColor: selectedAddOns.includes('tissues') ? "#1A9952" : "white"
                    }}
                    data-testid="addon-tissues"
                  >
                    {selectedAddOns.includes('tissues') && <Check className="w-4 h-4 text-white" />}
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

              {/* Total Amount to be Paid - Expandable */}
              <div className="bg-green-50 border border-green-200 rounded-lg mb-6">
                <button
                  onClick={() => setIsTotalBreakdownExpanded(!isTotalBreakdownExpanded)}
                  className="w-full p-4 flex items-center justify-between"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                >
                  <span className="font-semibold text-sm" style={{ color: "#1A9952" }}>
                    Total Amount to be Paid
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xl" style={{ color: "#1A9952" }}>
                      ₹{calculateGrandTotal().toLocaleString('en-IN')}
                    </span>
                    {isTotalBreakdownExpanded ? (
                      <ChevronUp className="w-5 h-5" style={{ color: "#1A9952" }} />
                    ) : (
                      <ChevronDown className="w-5 h-5" style={{ color: "#1A9952" }} />
                    )}
                  </div>
                </button>

                {isTotalBreakdownExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-green-200 pt-4">
                    {(() => {
                      const vegCount = parseInt(vegBoxes) || 0;
                      const eggCount = parseInt(eggBoxes) || 0;
                      const nonVegCount = parseInt(nonVegBoxes) || 0;
                      const vegTotal = vegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * vegCount;
                      const eggTotal = eggPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * eggCount;
                      const nonVegTotal = nonVegPlateSelections.reduce((sum, sel) => sum + (sel.item?.price || 0), 0) * nonVegCount;
                      const subtotal = vegTotal + eggTotal + nonVegTotal;
                      const packagingFee = Math.round(subtotal * 0.06);
                      const baseDeliveryCharges = Math.max(Math.round(subtotal * 0.06), 199);
                      const deliveryCharges = appliedCoupon?.isFreeDelivery ? 0 : baseDeliveryCharges;
                      const gst = Math.round(subtotal * 0.05);
                      const discount = appliedCoupon?.isFreeDelivery ? 0 : (appliedCoupon?.discount || 0);
                      const addonsTotal = calculateAddonsTotal();

                      return (
                        <>
                          {/* Line Items - MealBoxes */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold uppercase" style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                              Line Items
                            </h4>
                            {vegCount > 0 && (
                              <div className="flex justify-between text-sm pl-2">
                                <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                                  Veg MealBox × {vegCount}
                                </span>
                                <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                  ₹{vegTotal.toLocaleString('en-IN')}
                                </span>
                              </div>
                            )}
                            {eggCount > 0 && (
                              <div className="flex justify-between text-sm pl-2">
                                <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                                  Egg MealBox × {eggCount}
                                </span>
                                <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                  ₹{eggTotal.toLocaleString('en-IN')}
                                </span>
                              </div>
                            )}
                            {nonVegCount > 0 && (
                              <div className="flex justify-between text-sm pl-2">
                                <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                                  Non-Veg MealBox × {nonVegCount}
                                </span>
                                <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                  ₹{nonVegTotal.toLocaleString('en-IN')}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Add-ons */}
                          {addonsTotal > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-semibold uppercase" style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                                Add-ons
                              </h4>
                              {servingSpoonQuantity > 0 && (
                                <div className="flex justify-between text-sm pl-2">
                                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                                    Serving Spoons × {servingSpoonQuantity}
                                  </span>
                                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    ₹{(servingSpoonQuantity * 20).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              )}
                              {plateQuantity > 0 && (
                                <div className="flex justify-between text-sm pl-2">
                                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                                    Plates × {plateQuantity}
                                  </span>
                                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    ₹{(plateQuantity * 10).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              )}
                              {waterBottleQuantity > 0 && (
                                <div className="flex justify-between text-sm pl-2">
                                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                                    Water Bottles × {waterBottleQuantity}
                                  </span>
                                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    ₹{(waterBottleQuantity * 10).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              )}
                              {selectedAddOns.includes('spoons_forks') && (
                                <div className="flex justify-between text-sm pl-2">
                                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                                    Spoons & Forks
                                  </span>
                                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                                    FREE
                                  </span>
                                </div>
                              )}
                              {selectedAddOns.includes('tissues') && (
                                <div className="flex justify-between text-sm pl-2">
                                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                                    Tissues
                                  </span>
                                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                                    FREE
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Charges Breakdown */}
                          <div className="space-y-2 pt-2 border-t border-green-200">
                            <div className="flex justify-between text-sm">
                              <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Subtotal</span>
                              <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Packaging Fee</span>
                              <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{packagingFee.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Delivery Charges</span>
                              <span style={{ fontFamily: "Sweet Sans Pro", color: appliedCoupon?.isFreeDelivery ? "#1A9952" : "#06352A" }}>
                                {appliedCoupon?.isFreeDelivery ? "FREE" : `₹${deliveryCharges.toLocaleString('en-IN')}`}
                              </span>
                            </div>
                            {addonsTotal > 0 && (
                              <div className="flex justify-between text-sm">
                                <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Add-ons</span>
                                <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{addonsTotal.toLocaleString('en-IN')}</span>
                              </div>
                            )}
                            {doorstepDelivery && (
                              <div className="flex justify-between text-sm">
                                <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Doorstep Delivery</span>
                                <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{doorstepDeliveryFee.toLocaleString('en-IN')}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>GST</span>
                              <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{gst.toLocaleString('en-IN')}</span>
                            </div>
                            {discount > 0 && (
                              <div className="flex justify-between text-sm text-green-600">
                                <span style={{ fontFamily: "Sweet Sans Pro" }}>Discount</span>
                                <span style={{ fontFamily: "Sweet Sans Pro" }}>-₹{discount.toLocaleString('en-IN')}</span>
                              </div>
                            )}
                            <div className="border-t border-green-200 pt-2 mt-2 flex justify-between font-semibold">
                              <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>Total</span>
                              <span style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>₹{calculateGrandTotal().toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Payment Schedule Display (Case 1 & 2 only) */}
              {shouldShowPaymentStructure() && paymentSchedule && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                      Payment Schedule ({paymentSchedule.type})
                    </h3>
                    <button
                      onClick={() => setIsSplitPaymentExpanded(!isSplitPaymentExpanded)}
                      className="p-1"
                    >
                      {isSplitPaymentExpanded ? (
                        <ChevronUp className="w-4 h-4" style={{ color: "#1A9952" }} />
                      ) : (
                        <ChevronDown className="w-4 h-4" style={{ color: "#1A9952" }} />
                      )}
                    </button>
                  </div>
                  {isSplitPaymentExpanded && (
                    <div className="space-y-2 mt-2">
                      {paymentSchedule.stages.map((stage: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-xs py-1 border-b border-green-100 last:border-0">
                          <span style={{ color: "#666" }}>{stage.label.replace(' Payment', '').replace('Initial', '1st').replace('Second', '2nd').replace('Final', '3rd')}</span>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold" style={{ color: "#1A9952" }}>₹{stage.amount.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-gray-400">{stage.when}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Form */}
              <div className="space-y-4 mb-6">
                {/* When - Date Selection */}
                <DeliveryDatePicker
                  value={eventDate}
                  onChange={(date) => {
                    setEventDate(date);
                    setHasSelectedDateTime(true);
                  }}
                  minDate={new Date(minDateTime.date)}
                />

                {/* Delivery Time Selection */}
                <DeliveryTimePicker
                  mealType="all"
                  value={eventTime}
                  onChange={(time) => {
                    setEventTime(time);
                    setHasSelectedDateTime(true);
                  }}
                  selectedDate={eventDate}
                />

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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Choose Saved Address */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Choose Saved Address (Optional)
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ fontFamily: "Sweet Sans Pro", color: selectedAddressId ? "#06352A" : "#9CA3AF" }}
                    data-testid="select-saved-address"
                    value={selectedAddressId}
                    onChange={(e) => handleSavedAddressChange(e.target.value)}
                  >
                    <option value="">Select Address (Optional)</option>
                    {savedAddresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.label} {address.isDefault ? "(Default)" : ""}
                      </option>
                    ))}
                  </select>

                  {/* Show selected address details */}
                  {selectedAddress && (
                    <div
                      className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                      data-testid="selected-address-display"
                    >
                      <p className="text-sm font-semibold mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        {selectedAddress.label}
                      </p>
                      <p className="text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                        {selectedAddress.address}
                        {selectedAddress.landmark && `, ${selectedAddress.landmark}`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Use Current Location Button */}
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-50 border-2 border-dashed border-green-500 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="button-use-location"
                >
                  <MapPin className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">
                    {isGettingLocation ? "Getting Location..." : "Use Current Location"}
                  </span>
                </button>

                {/* Manual Address Entry - Only show when no saved address selected */}
                {!isAddressFieldsDisabled && (
                  <>
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
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
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
                        value={addressLine2}
                        onChange={(e) => setAddressLine2(e.target.value)}
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
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
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
                        value={addressState}
                        onChange={(e) => setAddressState(e.target.value)}
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
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                      />
                    </div>

                    {/* Save Address Checkbox */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveAddressForFuture}
                        onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-gray-300"
                        style={{ accentColor: "#1A9952" }}
                        data-testid="checkbox-save-address"
                      />
                      <span className="text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        Save Address for future use
                      </span>
                    </label>
                  </>
                )}

                {/* Doorstep Delivery Addon */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={doorstepDelivery}
                        onChange={(e) => {
                          const newValue = e.target.checked;
                          setDoorstepDelivery(newValue);
                          // Force re-render by updating state
                          console.log('Doorstep delivery changed to:', newValue, 'Fee will be:', newValue ? 300 : 0);
                        }}
                        className="w-5 h-5 rounded border-2 border-gray-300"
                        style={{ accentColor: "#1A9952" }}
                        data-testid="checkbox-doorstep-delivery"
                      />
                      <div>
                        <span className="text-sm font-semibold block" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                          Doorstep Delivery
                        </span>
                        <span className="text-xs text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                          Get your order delivered right to your doorstep
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                      ₹300
                    </span>
                  </label>
                </div>
              </div>

              {/* Payment Buttons */}
              <div className="space-y-3">
                {/* Pay Button */}
                <Button
                  onClick={handlePayment}
                  disabled={isProcessingPayment || isCreatingOrder}
                  className="w-full py-6 text-lg font-semibold border-0 flex items-center justify-between"
                  style={{
                    fontFamily: "Sweet Sans Pro",
                    backgroundColor: "#1A9952",
                    color: "white",
                    borderRadius: "10px",
                    opacity: (isProcessingPayment || isCreatingOrder) ? 0.6 : 1
                  }}
                  data-testid="button-pay"
                >
                  <span>
                    {isProcessingPayment || isCreatingOrder
                      ? "Processing..."
                      : getPaymentButtonText()
                    }
                  </span>
                  {!(isProcessingPayment || isCreatingOrder) && (
                    <span className="font-bold text-xl">
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </span>
                  )}
                </Button>

                {/* Submit Order Request Button */}
                <Button
                  onClick={handleSubmitOrder}
                  disabled={isCreatingOrder}
                  className="w-full py-6 text-lg font-semibold border-2 flex items-center justify-center"
                  style={{
                    fontFamily: "Sweet Sans Pro",
                    backgroundColor: "#f3f4f6",
                    color: "#06352A",
                    borderColor: "#1A9952",
                    borderRadius: "10px",
                    opacity: isCreatingOrder ? 0.6 : 1
                  }}
                  data-testid="button-submit-order"
                >
                  {isCreatingOrder ? "Submitting Request..." : "Submit Order Request"}
                </Button>
              </div>
              {(!razorpayLoaded || !razorpayKeyId) && !isProcessingPayment && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Payment gateway is initializing. If this persists, please refresh the page.
                </p>
              )}
              <p className="text-xs text-center text-gray-600 mt-2">
                Pay now to confirm order, or submit request for executive confirmation
              </p>
            </div>
          )}
        </div>
        {/* Continue Order Banner */}
        <ContinueOrderBanner />

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

        {/* Upgrade Portion Size Dialog */}
        <Dialog open={upgradePortionDialogOpen} onOpenChange={setUpgradePortionDialogOpen}>
          <DialogContent
            className="sm:max-w-md"
            style={{
              borderRadius: "24px",
              padding: "24px"
            }}
          >
            <DialogHeader className="text-center">
              <DialogTitle
                className="font-bold text-lg sm:text-xl mb-2"
                style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
              >
                Increase Portion?
              </DialogTitle>
              <DialogDescription
                className="text-gray-600 text-sm"
                style={{ fontFamily: "Sweet Sans Pro" }}
              >
                Your {selectedPortions}-portion box is full. Upgrade to add more?
              </DialogDescription>
            </DialogHeader>

            {/* Portion Options - Horizontal layout with simple number buttons */}
            <div className="flex items-center justify-center gap-4 mt-8 mb-2">
              {[3, 5, 6, 8].filter(size => size > selectedPortions).map((size) => (
                <button
                  key={size}
                  onClick={() => handleUpgradePortion(size as PortionSize)}
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-white border-2 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  style={{
                    borderColor: "#1A9952",
                    borderRadius: "16px",
                    fontFamily: "Sweet Sans Pro"
                  }}
                  data-testid={`upgrade-portion-${size}`}
                >
                  <span
                    className="font-bold text-xl sm:text-2xl"
                    style={{ color: "#06352A" }}
                  >
                    {size}
                  </span>
                </button>
              ))}
            </div>

            {/* No, I'm good button */}
            <div className="flex justify-center mt-6 mb-0">
              <button
                onClick={() => {
                  setUpgradePortionDialogOpen(false);
                  setPendingDishForUpgrade(null);
                }}
                className="text-gray-600 hover:text-gray-800 transition-colors text-sm py-2"
                style={{ fontFamily: "Sweet Sans Pro" }}
              >
                No, I'm good
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Plan Bottom Sheet */}
        <Sheet open={isPaymentPlanOpen} onOpenChange={setIsPaymentPlanOpen}>
          <SheetContent
            side="bottom"
            className="rounded-t-3xl px-4"
            style={{
              maxHeight: "85vh",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)"
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-2 pb-3">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              Payment Plan
            </h2>

            <div className="space-y-2">
              {/* Full Payment Option */}
              <div
                className="rounded-lg p-3 cursor-pointer transition-all border-2"
                style={{
                  backgroundColor: selectedPaymentPlan === "full" ? "#f0fdf4" : "#fafafa",
                  borderColor: selectedPaymentPlan === "full" ? "#1A9952" : "transparent"
                }}
                onClick={() => setSelectedPaymentPlan("full")}
              >
                {/* Header Row: Radio + Title + Badge */}
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: selectedPaymentPlan === "full" ? "#1A9952" : "#D1D5DB" }}
                  >
                    {selectedPaymentPlan === "full" && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#1A9952" }} />
                    )}
                  </div>
                  <span className="text-sm font-semibold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Full Payment
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
                    ★ Best
                  </span>
                </div>
                {/* Description + Price Row */}
                <div className="flex items-center justify-between pl-7">
                  <span className="text-xs text-gray-500">Pay once, done!</span>
                  <span className="text-base font-bold" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Split Payment Option */}
              {shouldShowPaymentStructure() && paymentSchedule && (
                <div
                  className="rounded-lg p-3 cursor-pointer transition-all border-2"
                  style={{
                    backgroundColor: selectedPaymentPlan === "split" ? "#f0fdf4" : "#fafafa",
                    borderColor: selectedPaymentPlan === "split" ? "#1A9952" : "transparent"
                  }}
                  onClick={() => setSelectedPaymentPlan("split")}
                >
                  {/* Header Row: Radio + Title + Chevron */}
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: selectedPaymentPlan === "split" ? "#1A9952" : "#D1D5DB" }}
                    >
                      {selectedPaymentPlan === "split" && (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#1A9952" }} />
                      )}
                    </div>
                    <span className="text-sm font-semibold flex-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                      Split Payment
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSplitPaymentExpanded(!isSplitPaymentExpanded);
                      }}
                      className="p-0.5"
                    >
                      {isSplitPaymentExpanded ? (
                        <ChevronUp className="w-4 h-4" style={{ color: "#1A9952" }} />
                      ) : (
                        <ChevronDown className="w-4 h-4" style={{ color: "#1A9952" }} />
                      )}
                    </button>
                  </div>
                  {/* Description + Price Row */}
                  <div className="flex items-center justify-between pl-7">
                    <span className="text-xs text-gray-500">Easy instalments</span>
                    <span className="text-base font-bold" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                      ₹{calculateInitialPayment().toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Payment Schedule Dropdown */}
                  {isSplitPaymentExpanded && (
                    <div className="mt-2 ml-7 bg-white border border-green-200 rounded-lg p-2">
                      <div className="text-[10px] font-semibold mb-2 flex items-center gap-1" style={{ color: "#06352A" }}>
                        <Info className="w-3 h-3" style={{ color: "#1A9952" }} />
                        Schedule ({paymentSchedule.type})
                      </div>
                      <div className="space-y-1">
                        {paymentSchedule.stages.map((stage: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                            <span style={{ color: "#666" }}>{stage.label.replace(' Payment', '').replace('Initial', '1st').replace('Second', '2nd').replace('Final', '3rd')}</span>
                            <div className="flex items-center gap-1">
                              <span className="font-semibold" style={{ color: "#1A9952" }}>₹{stage.amount.toLocaleString('en-IN')}</span>
                              <span className="text-[10px] text-gray-400">{stage.when}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Proceed Button */}
            <Button
              onClick={processPayment}
              disabled={isProcessingPayment || !razorpayLoaded || !razorpayKeyId}
              className="w-full py-4 text-base font-semibold mt-4"
              style={{
                fontFamily: "Sweet Sans Pro",
                backgroundColor: "#1A9952",
                color: "white",
                borderRadius: "10px",
                opacity: isProcessingPayment ? 0.6 : 1
              }}
            >
              {isProcessingPayment ? "Processing..." : "Proceed to pay"}
            </Button>
          </SheetContent>
        </Sheet>
    </PageWithLoader>
  );
}

