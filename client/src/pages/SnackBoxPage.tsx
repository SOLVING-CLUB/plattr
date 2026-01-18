import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContex";
import { snackBoxService } from "@/lib/supabase-service";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Building2,
    Users,
    Calendar,
    Mail,
    Phone,
    MapPin,
    ShoppingCart,
    UtensilsCrossed,
    Package,
    Truck,
    Leaf,
    Drumstick,
    Sparkles,
    Egg,
    Clock,
    X,
    ChevronDown,
    ChevronRight,
    ArrowUpDown,
    Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { LazyImage } from "@/components/ui/lazy-image";

import { SearchOverlay } from "@/components/SearchOverlay";
import ContinueOrderBanner from "@/pages/ContinueOrderBanner";
import cateringHeroPattern from "@assets/Hero_Catering.png";
// Service category icons (using same icons as other pages)
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

import { analytics } from "@/lib/analytics";
import { facebookEvents } from "@/lib/facebook-capi";

type ServiceType = "bulk-meals" | "mealbox" | "catering" | "corporate" | "snack-box";

const LOCATION_STORAGE_KEY = "activeLocation";

export default function SnackBoxPage() {
    const [location, setLocation] = useLocation();
    const { toast } = useToast();
    const { addToCart, cart, addedItems, removeFromCart, enterCategory, setBulkMealType } = useCart();

    const [selectedService, setSelectedService] = useState<ServiceType>("snack-box");
    const [dishDetailOpen, setDishDetailOpen] = useState(false);
    const [detailDish, setDetailDish] = useState<any | null>(null);
    const [quantities, setQuantities] = useState<Record<string, string>>({});
    const [quantityErrors, setQuantityErrors] = useState<Record<string, string>>({});
    const [selectedDrink, setSelectedDrink] = useState<string | null>(null);
    const hasInteractedRef = useRef(false);

    const handleInteraction = () => {
        if (!hasInteractedRef.current) {
            hasInteractedRef.current = true;
            enterCategory("snack-box");
        }
    };

    const openDishDetail = (dish: any) => {
        facebookEvents.trackViewContent(dish.id.toString(), dish.name, 'product');
        setDetailDish(dish);
        setSelectedDrink(null);

        // Sync quantity from cart if already added
        const dishId = typeof dish.id === 'string' ? parseInt(dish.id.replace(/\D/g, '') || "0", 10) : dish.id;
        const cartItem = cart.find(i => i.id === dishId);
        if (cartItem) {
            setQuantities(prev => ({ ...prev, [dish.id]: cartItem.quantity.toString() }));
        }

        setDishDetailOpen(true);
    };

    const handleSnackBoxAddToCart = (dish: any) => {
        const quantityStr = quantities[dish.id] !== undefined ? quantities[dish.id] : '5';
        const quantity = parseInt(quantityStr, 10) || 5;

        if (quantity < 5) {
            setQuantityErrors(prev => ({ ...prev, [dish.id]: "Minimum 5 servings required" }));
            toast({
                title: "Minimum Order Required",
                description: "Please select at least 5 servings.",
                variant: "destructive",
            });
            return;
        }

        setQuantityErrors(prev => ({ ...prev, [dish.id]: '' }));

        const hasMaazaOrPaperBoat = dish.description?.toLowerCase().includes('maaza') || dish.description?.toLowerCase().includes('paper boat');
        const extraCost = (selectedDrink === 'Diet coke' || selectedDrink === 'Coke zero') ? 20 : 0;
        const finalPrice = Number(dish.price || 0) + extraCost;
        const displayName = (hasMaazaOrPaperBoat && selectedDrink) ? `${dish.name} (${selectedDrink})` : dish.name;

        addToCart("snack-box", {
            id: typeof dish.id === 'string' ? parseInt(dish.id.replace(/\D/g, '') || "0", 10) : dish.id,
            name: displayName,
            price: finalPrice,
            quantity: quantity,
            image: (() => {
                const prefix = "https://leltckltotobsibixhqo.supabase.co/storage/v1/object/public/dish_images/snack-box/";
                const raw = dish.image_url ? dish.image_url.trim() : "";
                if (!raw) return "";

                // If it's already a full URL
                if (/^https?:\/\//i.test(raw)) {
                    // If it's from the broken legacy host, try to use the ID-based filename
                    if (raw.includes("sanishtech.com")) {
                        const normalizedId = dish.id.toString().toLowerCase().replace(/\s+/g, '-');
                        return `${prefix}${normalizedId}.png`;
                    }
                    return raw;
                }

                // It's a relative path/filename
                const cleanRaw = raw.startsWith('/') ? raw.slice(1) : raw;
                return `${prefix}${cleanRaw}`;
            })(),
            metadata: selectedDrink ? { selectedDrink, extraCost } : undefined
        });
    };

    const isMobile = useIsMobile();
    const isDesktop = !isMobile;

    const [scrollY, setScrollY] = useState(0);
    const [locationLabel, setLocationLabel] = useState("Select Address");
    const [selectedPortions, setSelectedPortions] = useState<number | null>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const portions = params.get('portions');
            if (portions) return parseInt(portions, 10);
        }
        return null;
    });
    const [snackBoxDishes, setSnackBoxDishes] = useState<any[]>([]);
    const [loadingSnackBox, setLoadingSnackBox] = useState(false);
    const [dietaryFilter, setDietaryFilter] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const dietary = params.get('dietary');
            if (dietary) return dietary;
        }
        return "All";
    });
    const [sortOrder, setSortOrder] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const sort = params.get('sort');
            if (sort) return sort;
        }
        return "Price: Low → High";
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
    const [expandedDishes, setExpandedDishes] = useState<Record<string, boolean>>({});
    const [festiveFilter, setFestiveFilter] = useState<string | null>(null);
    const [availableFestiveFilter, setAvailableFestiveFilter] = useState<string | null>(null);
    const isStuck = scrollY > 20;

    // Handle festive filter
    useEffect(() => {
        const filter = localStorage.getItem('festiveFilter');
        if (filter) {
            setFestiveFilter(filter);
            setAvailableFestiveFilter(filter);
        }
    }, []);

    // Header height logic to match DesktopHeader.tsx (md: breakpoint is 768px)
    const [isMd, setIsMd] = useState(false);
    useEffect(() => {
        const mql = window.matchMedia("(min-width: 768px)");
        setIsMd(mql.matches);
        const onChange = () => setIsMd(mql.matches);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    const headerHeight = isMd ? 128 : 80;

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedDishes((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    // Analytics tracking now handled centrally in App.tsx (ScrollToTop)
    useEffect(() => {
    }, []);

    // Track Filter/Sort changes and Sync with URL
    useEffect(() => {
        analytics.track('filter_applied', {
            filter_type: 'snack_box_filters',
            dietary: dietaryFilter,
            portions: selectedPortions === null ? 'All' : selectedPortions,
            sort_order: sortOrder
        }).catch(() => { });

        // Sync with URL
        const params = new URLSearchParams(window.location.search);
        let changed = false;

        if (dietaryFilter !== "All") {
            if (params.get('dietary') !== dietaryFilter) {
                params.set('dietary', dietaryFilter);
                changed = true;
            }
        } else {
            if (params.has('dietary')) {
                params.delete('dietary');
                changed = true;
            }
        }

        if (selectedPortions !== null) {
            if (params.get('portions') !== selectedPortions.toString()) {
                params.set('portions', selectedPortions.toString());
                changed = true;
            }
        } else {
            if (params.has('portions')) {
                params.delete('portions');
                changed = true;
            }
        }

        if (sortOrder !== "Price: Low → High") {
            if (params.get('sort') !== sortOrder) {
                params.set('sort', sortOrder);
                changed = true;
            }
        } else {
            if (params.has('sort')) {
                params.delete('sort');
                changed = true;
            }
        }

        if (changed) {
            const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
            window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
        }
    }, [dietaryFilter, selectedPortions, sortOrder]);

    // Fetch snack box dishes
    useEffect(() => {
        const loadDishes = async () => {
            setLoadingSnackBox(true);
            try {
                const data = await snackBoxService.getAll();
                setSnackBoxDishes(data);
            } catch (err) {
                console.error("Failed to load snack box dishes:", err);
                toast({
                    title: "Error",
                    description: "Failed to load snack box options. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setLoadingSnackBox(false);
            }
        };
        loadDishes();
        enterCategory("snack-box");
    }, []);

    // Track scroll position for sticky header
    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
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




    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans mb-16">
            {/* Hero Background */}
            <div
                className="absolute top-0 left-0 right-0 z-0"
                style={{
                    backgroundImage: `url("${cateringHeroPattern}")`,
                    backgroundSize: "100% auto",
                    backgroundPosition: "center top",
                    backgroundRepeat: "repeat-x",
                    height: "300px",
                    width: "100%",
                }}
            />

            {/* Sticky Back Button Header */}
            <div
                className="sticky top-0 z-50 transition-all duration-200"
                style={{
                    backgroundColor: scrollY > 50 ? 'white' : 'transparent',
                    boxShadow: scrollY > 50 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
            >
                <div className="px-4 pt-12 pb-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={scrollY > 50 ? "text-[#06352A] hover:text-[#06352A] hover:bg-gray-100" : "text-white hover:text-white hover:bg-white/20"}
                        onClick={() => setLocation("/")}
                        data-testid="button-back"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>
            </div>

            {/* Header Section */}
            <div className="relative z-10 px-4 pt-4 pb-6">
                {/* Location and AI Menu Planner */}
                <div className="flex items-center justify-between mb-6">
                    <button 
                        className="flex items-center gap-2 max-w-[180px] hover:opacity-80 transition-opacity" 
                        onClick={() => setLocation("/location")}
                        data-testid="button-location"
                    >
                        <MapPin className="w-5 h-5 text-white flex-shrink-0" />
                        <span className="text-white font-semibold text-[18px] truncate max-w-[120px]" style={{ fontFamily: "Sweet Sans Pro" }}>
                            {locationLabel}
                        </span>
                    </button>
                    <button
                        onClick={() => setLocation("/concierge")}
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
                <div className="grid grid-cols-4 gap-2 lg:gap-4 max-w-2xl lg:max-w-4xl mx-auto">
                        <button
                            onClick={() => { setSelectedService("bulk-meals"); setLocation("/bulk-meals"); }}
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
                            onClick={() => { setSelectedService("mealbox"); setLocation("/mealbox"); }}
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

                        <button
                            onClick={() => { setSelectedService("snack-box"); setLocation("/snack-box"); }}
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
                            onClick={() => { setSelectedService("catering"); setLocation("/catering"); }}
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
                </div>
            </div>

            {/* Sticky Search Bar and Meal Category Container - At the top */}
            <div
                style={{
                    position: 'sticky',
                    top: `${headerHeight}px`,
                    zIndex: 40,
                    backgroundColor: "white",
                    boxShadow: isStuck ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                    paddingLeft: '1rem',
                    paddingRight: '1rem',
                    paddingBottom: '0.5rem',
                    paddingTop: '0.5rem',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    width: '100%',
                    borderBottom: isStuck ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    marginTop: '0'
                }}
            >
                {/* Search Bar */}
                <div className="mb-2">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-[#1A9952] transition-colors" />
                        <Input
                            type="text"
                            placeholder="Search snack boxes..."
                            readOnly
                            onClick={() => {
                                setSearchOverlayOpen(true);
                                setSelectedPortions(null);
                                setDietaryFilter('All');
                            }}
                            className="w-full pl-12 pr-4 h-11 text-base border-gray-200 focus-visible:ring-[#1A9952] focus-visible:border-[#1A9952] rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            value={searchQuery}
                            style={{ fontFamily: "Sweet Sans Pro" }}
                        />
                    </div>
                </div>

                {/* Festive Filter Toggle */}
                {availableFestiveFilter && (
                    <div className="flex justify-center mt-3 mb-2">
                        <div className="inline-flex p-1 bg-gray-100 rounded-full shadow-sm border border-gray-200">
                            <button
                                onClick={() => { handleInteraction(); setFestiveFilter(null); }}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300",
                                    !festiveFilter
                                        ? "bg-white text-[#06352A] shadow-md"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                                style={{ fontFamily: "Sweet Sans Pro" }}
                            >
                                Full Menu
                            </button>
                            <button
                                onClick={() => { handleInteraction(); setFestiveFilter(availableFestiveFilter); }}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-1.5",
                                    festiveFilter
                                        ? "bg-[#06352A] text-white shadow-md"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                                style={{ fontFamily: "Sweet Sans Pro" }}
                            >
                                <Sparkles className={cn("w-3 h-3", festiveFilter ? "text-yellow-400" : "text-gray-400")} />
                                {availableFestiveFilter} Specials
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pt-1 pb-1">
                    <button
                        onClick={() => setDietaryFilter('All')}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all flex-shrink-0",
                            dietaryFilter === 'All'
                                ? "bg-[#06352A] text-white"
                                : "bg-gray-100 text-gray-600"
                        )}
                        style={{ fontFamily: "Sweet Sans Pro" }}
                    >
                        <Sparkles className="w-2.5 h-2.5" />
                        All
                    </button>
                    <button
                        onClick={() => setDietaryFilter('Veg')}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all flex-shrink-0",
                            dietaryFilter === 'Veg'
                                ? "bg-[#1A9952] text-white"
                                : "bg-gray-100 text-gray-600"
                        )}
                        style={{ fontFamily: "Sweet Sans Pro" }}
                    >
                        <Leaf className="w-2.5 h-2.5" />
                        Veg
                    </button>
                    <button
                        onClick={() => setDietaryFilter('Egg')}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all flex-shrink-0",
                            dietaryFilter === 'Egg'
                                ? "bg-[#F59E0B] text-white"
                                : "bg-gray-100 text-gray-600"
                        )}
                        style={{ fontFamily: "Sweet Sans Pro" }}
                    >
                        <Egg className="w-2.5 h-2.5" />
                        Egg
                    </button>
                    <button
                        onClick={() => setDietaryFilter('Non-Veg')}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all flex-shrink-0",
                            dietaryFilter === 'Non-Veg'
                                ? "bg-[#DC2626] text-white"
                                : "bg-gray-100 text-gray-600"
                        )}
                        style={{ fontFamily: "Sweet Sans Pro" }}
                    >
                        <Drumstick className="w-2.5 h-2.5" />
                        Non-Veg
                    </button>

                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger
                            className="w-auto h-6 px-2 text-[10px] bg-white border-gray-200 rounded-full gap-0.5 flex-shrink-0 focus:ring-0"
                            style={{ fontFamily: "Sweet Sans Pro" }}
                        >
                            <ArrowUpDown className="w-2.5 h-2.5" />
                            <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100">
                            <SelectItem value="Price: Low → High" className="text-[10px]">Price: Low → High</SelectItem>
                            <SelectItem value="Price: High → Low" className="text-[10px]">Price: High → Low</SelectItem>
                            <SelectItem value="Name: A → Z" className="text-[10px]">Name: A → Z</SelectItem>
                            <SelectItem value="Name: Z → A" className="text-[10px]">Name: Z → A</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Mobile Portions Filter Row (Sticky) */}
                {!isMd && (
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pt-1 pb-1">
                        {["All", 3, 4, 5, 6].map(val => (
                            <button
                                key={String(val)}
                                onClick={() => setSelectedPortions(val === "All" ? null : val as number)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-semibold transition-all flex-shrink-0 whitespace-nowrap",
                                    (val === "All" ? selectedPortions === null : selectedPortions === val)
                                        ? "bg-[#1A9952] text-white shadow-sm"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                )}
                                style={{ fontFamily: "Sweet Sans Pro" }}
                            >
                                {val === "All" ? "All Portions" : `${val} Portions`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="px-4 pb-24 max-w-7xl mx-auto w-full flex-grow">
                {/* Snack Box Content */}
                <div className="space-y-8">
                    <div className="flex flex-1 gap-0 w-full">
                        {/* Desktop Sidebar */}
                        {isDesktop && (
                            <aside
                                className="w-24 border-r bg-card/50 backdrop-blur-sm flex-shrink-0 sticky self-start"
                                style={{
                                    top: `${headerHeight + 112}px`,
                                    maxHeight: `calc(100vh - ${headerHeight + 112}px)`,
                                    overflowY: 'auto'
                                }}
                            >
                                <div className="flex flex-col py-3 pb-32">
                                    <button
                                        onClick={() => setSelectedPortions(null)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 py-4 px-2 transition-all relative",
                                            selectedPortions === null
                                                ? "bg-[#1A9952]/10 before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1.5 before:bg-[#1A9952] before:rounded-r"
                                                : "hover:bg-gray-50"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all",
                                            selectedPortions === null ? "border-[#1A9952] bg-[#1A9952]/20" : "border-gray-200 bg-white"
                                        )}>
                                            <Package className={cn("w-6 h-6", selectedPortions === null ? "text-[#1A9952]" : "text-gray-400")} />
                                        </div>
                                        <span className={cn("text-[10px] font-bold text-center leading-tight", selectedPortions === null ? "text-[#1A9952]" : "text-gray-600")}>
                                            All Portions
                                        </span>
                                    </button>

                                    {[3, 4, 5, 6].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setSelectedPortions(val)}
                                            className={cn(
                                                "flex flex-col items-center gap-2 py-4 px-2 transition-all relative",
                                                selectedPortions === val
                                                    ? "bg-[#1A9952]/10 before:absolute before:left-0 before:top-3 before:bottom-3 before:w-1.5 before:bg-[#1A9952] before:rounded-r"
                                                    : "hover:bg-gray-50"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all font-bold text-lg",
                                                selectedPortions === val ? "border-[#1A9952] bg-[#1A9952]/20 text-[#1A9952]" : "border-gray-200 bg-white text-gray-400"
                                            )}>
                                                {val}
                                            </div>
                                            <span className={cn("text-[10px] font-bold text-center leading-tight", selectedPortions === val ? "text-[#1A9952]" : "text-gray-600")}>
                                                {val} Portions
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </aside>
                        )}

                        <div className="flex-1 px-4 md:px-6 min-w-0">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 md:gap-4 mb-2 md:mb-6">
                                {!isDesktop && (
                                    <Badge variant="outline" className="w-fit text-[#1A9952] border-[#1A9952] bg-green-50/50 px-3 py-1 rounded-lg font-bold order-first">
                                        {snackBoxDishes.filter(dish => {
                                            const isAvailable = (dish as any).is_available !== false && dish.isAvailable !== false;
                                            if (!isAvailable) return false;

                                            // Festive filter (Sankranthi)
                                            if (festiveFilter) {
                                                const dishTags = (dish as any).tags || '';
                                                if (!dishTags.toLowerCase().includes(festiveFilter.toLowerCase())) {
                                                    return false;
                                                }
                                            }

                                            if (!dish.description) return false;
                                            const cleanedDesc = dish.description.trim().replace(/\.+$/, '');
                                            const items = cleanedDesc.split(/[+,;.&]|\band\b/).map((i: any) => i.trim()).filter((i: any) => i.length > 0);
                                            const isPortionMatch = selectedPortions === null || items.length === selectedPortions;
                                            const isDietaryMatch = dietaryFilter === "All" || dish.dietary_type?.toLowerCase() === dietaryFilter.toLowerCase();
                                            const isSearchMatch = dish.name.toLowerCase().includes(searchQuery.toLowerCase());
                                            return isPortionMatch && isDietaryMatch && isSearchMatch;
                                        }).length} options found
                                    </Badge>
                                )}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        {selectedPortions !== null && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedPortions(null)}
                                                className="p-0 h-auto text-[#1B9849] hover:bg-transparent"
                                            >
                                                <ArrowLeft className="w-5 h-5 mr-1" />
                                            </Button>
                                        )}
                                        <h3 className="text-2xl md:text-3xl font-extrabold text-[#06352A]" style={{ fontFamily: "Sweet Sans Pro" }}>
                                            {selectedPortions ? `${selectedPortions} Portion Kits` : 'All Snack Boxes'}
                                        </h3>
                                    </div>
                                    <p className="text-gray-500 text-sm md:text-base font-medium" style={{ fontFamily: "Sweet Sans Pro" }}>
                                        Select a curated snack kit for your team or event
                                    </p>
                                </div>
                                {isDesktop && (
                                    <Badge variant="outline" className="w-fit text-[#1A9952] border-[#1A9952] bg-green-50/50 px-3 py-1 rounded-lg font-bold">
                                        {snackBoxDishes.filter(dish => {
                                            const isAvailable = (dish as any).is_available !== false && dish.isAvailable !== false;
                                            if (!isAvailable) return false;

                                            // Festive filter (Sankranthi)
                                            if (festiveFilter) {
                                                const dishTags = (dish as any).tags || '';
                                                if (!dishTags.toLowerCase().includes(festiveFilter.toLowerCase())) {
                                                    return false;
                                                }
                                            }

                                            if (!dish.description) return false;
                                            const cleanedDesc = dish.description.trim().replace(/\.+$/, '');
                                            const items = cleanedDesc.split(/[+,;.&]|\band\b/).map((i: any) => i.trim()).filter((i: any) => i.length > 0);
                                            const isPortionMatch = selectedPortions === null || items.length === selectedPortions;
                                            const isDietaryMatch = dietaryFilter === "All" || dish.dietary_type?.toLowerCase() === dietaryFilter.toLowerCase();
                                            const isSearchMatch = dish.name.toLowerCase().includes(searchQuery.toLowerCase());
                                            return isPortionMatch && isDietaryMatch && isSearchMatch;
                                        }).length} options found
                                    </Badge>
                                )}
                            </div>



                            {loadingSnackBox ? (
                                <div className="flex justify-center p-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A9952]"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6">
                                    {snackBoxDishes
                                        .filter(dish => {
                                            const isAvailable = (dish as any).is_available !== false && dish.isAvailable !== false;
                                            if (!isAvailable) return false;

                                            // Festive filter (Sankranthi)
                                            if (festiveFilter) {
                                                const dishTags = (dish as any).tags || '';
                                                if (!dishTags.toLowerCase().includes(festiveFilter.toLowerCase())) {
                                                    return false;
                                                }
                                            }

                                            if (!dish.description) return false;
                                            const cleanedDesc = dish.description.trim().replace(/\.+$/, '');
                                            const items = cleanedDesc.split(/[+,;.&]|\band\b/).map((i: any) => i.trim()).filter((i: any) => i.length > 0);
                                            const isPortionMatch = selectedPortions === null || items.length === selectedPortions;
                                            const isDietaryMatch = dietaryFilter === "All" || dish.dietary_type?.toLowerCase() === dietaryFilter.toLowerCase();
                                            const excludedNames = ["Grab & Go Box", "Anytime Snack Box", "Snackiee Pack", "Office Much Pack", "Office Munch Pack"].map(n => n.toLowerCase());
                                            const isNotExcluded = !excludedNames.includes(dish.name.toLowerCase());
                                            const isSearchMatch = dish.name.toLowerCase().includes(searchQuery.toLowerCase());
                                            return isPortionMatch && isDietaryMatch && isNotExcluded && isSearchMatch;
                                        })
                                        .sort((a, b) => {
                                            if (sortOrder === "Price: Low → High") return (a.price || 0) - (b.price || 0);
                                            if (sortOrder === "Price: High → Low") return (b.price || 0) - (a.price || 0);
                                            if (sortOrder === "Name: A → Z") return (a.name || "").localeCompare(b.name || "");
                                            if (sortOrder === "Name: Z → A") return (b.name || "").localeCompare(a.name || "");
                                            return 0;
                                        })
                                        .map((dish, index) => (
                                            <Card
                                                key={dish.id}
                                                className="overflow-hidden border-none shadow-sm hover:shadow-2xl rounded-2xl bg-white flex flex-col transition-all duration-300 hover:-translate-y-2 group"
                                                onClick={() => openDishDetail(dish)}
                                            >
                                                <div className="relative aspect-[4/3] w-full overflow-hidden cursor-pointer">
                                                    {(() => {
                                                        const prefix = "https://leltckltotobsibixhqo.supabase.co/storage/v1/object/public/dish_images/snack-box/";
                                                        const rawUrl = dish.image_url ? dish.image_url.trim() : "";
                                                        let imageUrl = "/placeholder-dish.png";

                                                        if (rawUrl) {
                                                            if (/^https?:\/\//i.test(rawUrl)) {
                                                                if (rawUrl.includes("sanishtech.com")) {
                                                                    const normalizedId = dish.id.toString().toLowerCase().replace(/\s+/g, '-');
                                                                    imageUrl = `${prefix}${normalizedId}.png`;
                                                                } else {
                                                                    imageUrl = rawUrl;
                                                                }
                                                            } else {
                                                                const cleanRaw = rawUrl.startsWith('/') ? rawUrl.slice(1) : rawUrl;
                                                                imageUrl = `${prefix}${cleanRaw}`;
                                                            }
                                                        }
                                                        return (
                                                            <LazyImage
                                                                src={imageUrl}
                                                                alt={dish.name}
                                                                aspectRatio="auto"
                                                                className="transition-transform duration-700 group-hover:scale-110"
                                                            />
                                                        );
                                                    })()}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                                </div>
                                                <CardContent className="p-3 md:p-3 flex flex-col flex-1 bg-gradient-to-b from-white to-gray-50/30">
                                                    <h4 className="font-bold text-[#1a1a1a] text-sm md:text-base leading-tight mb-2 line-clamp-2 md:min-h-[32px] group-hover:text-[#1A9952] transition-colors" style={{ fontFamily: "Sweet Sans Pro" }}>
                                                        {dish.name}
                                                    </h4>

                                                    <div className="flex flex-col gap-3 mt-auto pt-2 border-t border-gray-50">
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-[16px] font-extrabold text-[#1A9952]" style={{ fontFamily: "Sweet Sans Pro" }}>
                                                                ₹{dish.price}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500 font-medium" style={{ fontFamily: "Sweet Sans Pro" }}>
                                                                per serve
                                                            </span>
                                                        </div>
                                                        <Button
                                                            className="w-full rounded-full font-bold"
                                                            variant={addedItems.has(typeof dish.id === 'string' ? parseInt(dish.id.replace(/\D/g, '') || "0", 10) : dish.id) ? "secondary" : "default"}
                                                            style={{
                                                                backgroundColor: addedItems.has(typeof dish.id === 'string' ? parseInt(dish.id.replace(/\D/g, '') || "0", 10) : dish.id)
                                                                    ? undefined // Let variant handle it or use secondary color
                                                                    : "#1A9952",
                                                                color: addedItems.has(typeof dish.id === 'string' ? parseInt(dish.id.replace(/\D/g, '') || "0", 10) : dish.id) ? undefined : "white"
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const dishId = typeof dish.id === 'string' ? parseInt(dish.id.replace(/\D/g, '') || "0", 10) : dish.id;
                                                                if (addedItems.has(dishId)) {
                                                                    removeFromCart(dishId);
                                                                } else {
                                                                    openDishDetail(dish);
                                                                }
                                                            }}
                                                        >
                                                            {addedItems.has(typeof dish.id === 'string' ? parseInt(dish.id.replace(/\D/g, '') || "0", 10) : dish.id) ? "Added" : "Add"}
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}

                                    {snackBoxDishes.filter(dish => {
                                        const isAvailable = (dish as any).is_available !== false && dish.isAvailable !== false;
                                        if (!isAvailable) return false;

                                        // Festive filter (Sankranthi)
                                        if (festiveFilter) {
                                            const dishTags = (dish as any).tags || '';
                                            if (!dishTags.toLowerCase().includes(festiveFilter.toLowerCase())) {
                                                return false;
                                            }
                                        }

                                        if (!dish.description) return false;
                                        const cleanedDesc = dish.description.trim().replace(/\.+$/, '');
                                        const items = cleanedDesc.split(/[+,;.&]|\band\b/).map((i: any) => i.trim()).filter((i: any) => i.length > 0);
                                        const isPortionMatch = selectedPortions === null || items.length === selectedPortions;
                                        const isDietaryMatch = dietaryFilter === "All" || dish.dietary_type?.toLowerCase() === dietaryFilter.toLowerCase();
                                        const isSearchMatch = dish.name.toLowerCase().includes(searchQuery.toLowerCase());
                                        return isPortionMatch && isDietaryMatch && isSearchMatch;
                                    }).length === 0 && (
                                            <div className="col-span-full text-center py-16 px-6 max-w-md mx-auto">
                                                {festiveFilter ? (
                                                    <div className="space-y-6">
                                                        <div className="space-y-2">
                                                            <p className="text-lg font-bold text-[#06352A]" style={{ fontFamily: "Sweet Sans Pro" }}>
                                                                No {festiveFilter} Specials Here
                                                            </p>
                                                            <p className="text-muted-foreground">
                                                                This category doesn't have {festiveFilter} specials yet, but our full menu has plenty of delicious options for you!
                                                            </p>
                                                        </div>
                                                        <Button
                                                            onClick={() => {
                                                                handleInteraction();
                                                                setFestiveFilter(null);
                                                            }}
                                                            className="rounded-full px-8 py-3 bg-[#06352A] text-white hover:opacity-90 shadow-lg transition-all"
                                                            style={{ fontFamily: "Sweet Sans Pro" }}
                                                        >
                                                            Check Full Menu
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 italic">No snack boxes found matching your filters.</p>
                                                )}
                                            </div>
                                        )}

                                    {festiveFilter && snackBoxDishes.filter(dish => {
                                        const isAvailable = (dish as any).is_available !== false && dish.isAvailable !== false;
                                        if (!isAvailable) return false;
                                        const dishTags = (dish as any).tags || '';
                                        if (!dishTags.toLowerCase().includes(festiveFilter.toLowerCase())) return false;
                                        if (!dish.description) return false;
                                        const cleanedDesc = dish.description.trim().replace(/\.+$/, '');
                                        const items = cleanedDesc.split(/[+,;.&]|\band\b/).map((i: any) => i.trim()).filter((i: any) => i.length > 0);
                                        const isPortionMatch = selectedPortions === null || items.length === selectedPortions;
                                        const isDietaryMatch = dietaryFilter === "All" || dish.dietary_type?.toLowerCase() === dietaryFilter.toLowerCase();
                                        const isSearchMatch = dish.name.toLowerCase().includes(searchQuery.toLowerCase());
                                        return isPortionMatch && isDietaryMatch && isSearchMatch;
                                    }).length > 0 && (
                                            <div className="col-span-full mt-12 text-center pb-12 border-t border-gray-100 pt-12">
                                                <div className="max-w-md mx-auto space-y-4">
                                                    <p className="text-muted-foreground text-sm" style={{ fontFamily: "Sweet Sans Pro" }}>
                                                        Finished browsing {festiveFilter} specials? Check out our complete menu for more delicious options!
                                                    </p>
                                                    <Button
                                                        onClick={() => {
                                                            handleInteraction();
                                                            setFestiveFilter(null);
                                                        }}
                                                        className="rounded-full px-8 py-3 bg-[#06352A] text-white hover:opacity-90 shadow-lg transition-all"
                                                        style={{ fontFamily: "Sweet Sans Pro" }}
                                                    >
                                                        Check Full Menu
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Drawer open={dishDetailOpen} onOpenChange={setDishDetailOpen}>
                <DrawerContent className="rounded-t-[32px] max-h-[85vh]">
                    <div className="mx-auto w-full max-w-md">
                        <DrawerHeader className="text-left p-6 pb-4 relative">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-4 top-4 h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200"
                                onClick={() => setDishDetailOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <DrawerTitle className="text-2xl font-bold text-[#06352A] pr-8 mb-2" style={{ fontFamily: "Sweet Sans Pro" }}>
                                {detailDish?.name}
                            </DrawerTitle>
                            <div className="h-0.5 w-full bg-gray-100 rounded-full" />
                        </DrawerHeader>

                        <div className="px-6 pb-8 space-y-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                            <div className="space-y-4">
                                <h4 className="font-bold text-[#06352A] text-lg" style={{ fontFamily: "Sweet Sans Pro" }}>Description</h4>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "Sweet Sans Pro" }}>
                                        {detailDish?.description}
                                    </p>
                                </div>
                            </div>

                            {/* Add-on selection for Specific Items */}
                            {(detailDish?.description?.toLowerCase().includes('maaza') || detailDish?.description?.toLowerCase().includes('paper boat')) && (
                                <div className="space-y-4 pt-2 border-t border-gray-100">
                                    <h4 className="font-bold text-[#06352A]" style={{ fontFamily: "Sweet Sans Pro" }}>Choose Beverage</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Diet coke', 'Coke zero', 'Thumsup', 'Coke', 'Sprite'].map((drink) => (
                                            <div
                                                key={drink}
                                                className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${selectedDrink === drink
                                                    ? "border-[#1A9952] bg-[#F0FDF4]"
                                                    : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                                onClick={() => setSelectedDrink(selectedDrink === drink ? null : drink)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Checkbox checked={selectedDrink === drink} className="h-4 w-4" />
                                                    <span className="text-[13px] font-medium text-gray-700 leading-tight">{drink}</span>
                                                </div>
                                                <span className="text-[11px] font-semibold text-[#1A9952]">
                                                    {(drink === 'Diet coke' || drink === 'Coke zero') ? '+₹20' : ''}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6 pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="text-gray-500 text-sm font-medium" style={{ fontFamily: "Sweet Sans Pro" }}>Price per serve</span>
                                        <div className="text-[#1A9952] text-3xl font-bold" style={{ fontFamily: "Sweet Sans Pro" }}>₹{Number(detailDish?.price || 0) + (selectedDrink ? ((selectedDrink === 'Diet coke' || selectedDrink === 'Coke zero') ? 20 : 0) : 0)}</div>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <span className="text-gray-500 text-sm font-medium" style={{ fontFamily: "Sweet Sans Pro" }}>Total</span>
                                        <div className="text-[#1A9952] text-3xl font-bold" style={{ fontFamily: "Sweet Sans Pro" }}>₹{(parseInt(quantities[detailDish?.id] || '5') * (Number(detailDish?.price || 0) + (selectedDrink ? ((selectedDrink === 'Diet coke' || selectedDrink === 'Coke zero') ? 20 : 0) : 0))).toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[#06352A] font-bold" style={{ fontFamily: "Sweet Sans Pro" }}>Select Quantity</Label>
                                        <span className="text-[#1A9952] font-bold" style={{ fontFamily: "Sweet Sans Pro" }}>{quantities[detailDish?.id] || '5'} servings</span>
                                    </div>

                                    <div className="px-2 pt-2 pb-6">
                                        <Slider
                                            value={[parseInt(quantities[detailDish?.id] || '5')]}
                                            min={5}
                                            max={200}
                                            step={1}
                                            onValueChange={(vals) => {
                                                if (!detailDish) return;
                                                setQuantities(prev => ({ ...prev, [detailDish.id]: vals[0].toString() }));
                                            }}
                                            className="[&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:border-4 [&_[role=slider]]:border-white [&_[role=slider]]:bg-[#1A9952]"
                                        />
                                        <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-medium px-1">
                                            <span>5</span>
                                            <span>50</span>
                                            <span>100</span>
                                            <span>150</span>
                                            <span>200</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 text-sm" style={{ fontFamily: "Sweet Sans Pro" }}>Or enter:</span>
                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            placeholder="5"
                                            value={detailDish ? (quantities[detailDish.id] || '') : ''}
                                            onChange={(e) => {
                                                if (!detailDish) return;
                                                setQuantities(prev => ({ ...prev, [detailDish.id]: e.target.value }));
                                            }}
                                            className="w-24 h-10 text-center rounded-xl bg-gray-50 border-gray-200"
                                            min="5"
                                            max="200"
                                        />
                                    </div>
                                </div>

                                {/* Add to Cart Button */}
                                <Button
                                    size="lg"
                                    onClick={() => {
                                        if (!detailDish) return;
                                        const dishId = typeof detailDish.id === 'string' ? parseInt(detailDish.id.replace(/\D/g, '') || "0", 10) : detailDish.id;
                                        if (addedItems.has(dishId)) {
                                            removeFromCart(dishId);
                                            setDishDetailOpen(false);
                                        } else {
                                            handleSnackBoxAddToCart(detailDish);
                                            if (!quantityErrors[detailDish.id] && (parseInt(quantities[detailDish.id] || '5') >= 5)) {
                                                setDishDetailOpen(false);
                                            }
                                        }
                                    }}
                                    className="w-full h-16 rounded-full text-lg font-bold transition-all active:scale-95"
                                    variant={detailDish && addedItems.has(typeof detailDish.id === 'string' ? parseInt(detailDish.id.replace(/\D/g, '') || "0", 10) : detailDish.id) ? "secondary" : "default"}
                                    style={{
                                        fontFamily: "Sweet Sans Pro",
                                        backgroundColor: (detailDish && !addedItems.has(typeof detailDish.id === 'string' ? parseInt(detailDish.id.replace(/\D/g, '') || "0", 10) : detailDish.id)) ? "#1A9952" : undefined
                                    }}
                                >
                                    {(() => {
                                        const dishId = typeof detailDish?.id === 'string' ? parseInt(detailDish.id.replace(/\D/g, '') || "0", 10) : detailDish?.id;
                                        return detailDish && addedItems.has(dishId) ? "Added ✓" : "Add to Cart";
                                    })()}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
            {/* Floating Cart Bar - Sits above bottom nav */}
            {
                cart.length > 0 && (
                    <div className="fixed bottom-4 left-0 right-0 z-40 px-4">
                        <button
                            onClick={() => setLocation("/snack-box-cart")}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all active:scale-[0.98]"
                            style={{
                                backgroundColor: '#1A9952',
                                boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.15)'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                                    style={{ backgroundColor: '#F5E9DB', color: '#1A9952' }}
                                >
                                    {cart.length}
                                </div>
                                <span className="text-white font-semibold" style={{ fontFamily: "Sweet Sans Pro" }}>
                                    {cart.length === 1 ? 'Item added to cart' : 'Items added to cart'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-white font-semibold" style={{ fontFamily: "Sweet Sans Pro" }}>
                                <span>View Cart</span>
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </button>
                    </div>
                )
            }



            <SearchOverlay
                isOpen={searchOverlayOpen}
                onClose={() => setSearchOverlayOpen(false)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onSearch={(query) => {
                    setSearchQuery(query);
                    setSearchOverlayOpen(false);
                }}
                placeholder="Search for snack boxes..."
                resultsCount={snackBoxDishes.filter(dish =>
                    dish.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).length}
            />
        </div>
    );
}
