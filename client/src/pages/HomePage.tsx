import MealTypeCard from "@/components/MealTypeCard";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import FloatingCartButton from "@/components/FloatingCartButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Bell, Coffee, Cookie, Utensils, Building2, Users, Calendar, Truck, Sparkles, Gift, Percent, Star, TrendingUp, ChevronRight } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { cartStorage } from "@/lib/cartStorage";
import type { Dish, Category } from "@shared/schema";
import useEmblaCarousel from 'embla-carousel-react';

import tiffinsImage from '@assets/stock_images/indian_food_platter__b34d03e7.jpg';
import cateringBuffetBg from '@assets/catering_buffet_bg.png';
import masalaDosaImage from '@assets/stock_images/indian_masala_dosa_2cd2adc1.jpg';
import samosaImage from '@assets/stock_images/samosa_snacks_indian_0946aa28.jpg';
import biryaniImage from '@assets/stock_images/indian_biryani_dish__60e99e80.jpg';
import foodPlatterImage from '@assets/stock_images/indian_food_platter__04e21eaf.jpg';
import thaliMealImage from '@assets/stock_images/indian_thali_meal_3a645a6d.jpg';
import lunchDinnerImage from '@assets/stock_images/indian_lunch_dinner__c3e92f73.jpg';
import biryaniEventImage from '@assets/stock_images/indian_biryani_dish__65f2a773.jpg';

const MOCK_MEAL_TYPES = [
  {
    id: 'tiffins',
    title: 'Tiffins',
    icon: Coffee,
    itemCount: 24,
    imageUrl: masalaDosaImage,
    bgColor: 'bg-purple-200',
    textColor: 'text-purple-900'
  },
  {
    id: 'snacks',
    title: 'Snacks',
    icon: Cookie,
    itemCount: 18,
    imageUrl: samosaImage,
    bgColor: 'bg-amber-200',
    textColor: 'text-amber-900'
  },
  {
    id: 'lunch-dinner',
    title: 'Lunch & Dinner',
    icon: Utensils,
    itemCount: 32,
    imageUrl: biryaniImage,
    bgColor: 'bg-teal-200',
    textColor: 'text-teal-900'
  }
];

// Cart now uses session-based authentication - no need for guest user ID

const CORPORATE_FEATURES = [
  {
    id: 'bulk-orders',
    title: 'Bulk Orders',
    description: 'Special pricing for large orders',
    icon: Users,
    imageUrl: foodPlatterImage,
    bgColor: 'bg-blue-200',
    textColor: 'text-blue-900'
  },
  {
    id: 'scheduled-delivery',
    title: 'Scheduled Delivery',
    description: 'Plan meals in advance',
    icon: Calendar,
    imageUrl: thaliMealImage,
    bgColor: 'bg-green-200',
    textColor: 'text-green-900'
  },
  {
    id: 'dedicated-support',
    title: 'Dedicated Support',
    description: 'Priority service & delivery',
    icon: Truck,
    imageUrl: lunchDinnerImage,
    bgColor: 'bg-rose-200',
    textColor: 'text-rose-900'
  },
  {
    id: 'event-package',
    title: 'Event Package',
    description: 'Decor + Photography + Catering',
    icon: Sparkles,
    imageUrl: biryaniEventImage,
    bgColor: 'bg-indigo-200',
    textColor: 'text-indigo-900'
  }
];

const DEALS = [
  {
    id: 1,
    title: "20% OFF",
    subtitle: "First Order",
    description: "Get 20% off on your first order above ₹500",
    icon: Percent,
    bgGradient: "from-orange-500/10 to-red-500/10"
  },
  {
    id: 2,
    title: "FREE DELIVERY",
    subtitle: "No Minimum",
    description: "Free delivery on all orders this weekend",
    icon: Truck,
    bgGradient: "from-green-500/10 to-emerald-500/10"
  },
  {
    id: 3,
    title: "COMBO DEALS",
    subtitle: "Save More",
    description: "Special combo offers on Tiffins + Snacks",
    icon: Gift,
    bgGradient: "from-purple-500/10 to-pink-500/10"
  },
  {
    id: 4,
    title: "REFER & EARN",
    subtitle: "₹100 Cashback",
    description: "Refer a friend and get ₹100 in your wallet",
    icon: Star,
    bgGradient: "from-blue-500/10 to-cyan-500/10"
  },
  {
    id: 5,
    title: "TRENDING",
    subtitle: "Popular Picks",
    description: "Top rated dishes at special prices today",
    icon: TrendingUp,
    bgGradient: "from-amber-500/10 to-yellow-500/10"
  }
];

interface CartItem {
  id: string;
  quantity: number;
  dish: Dish;
  category: Category;
}

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('home');

  const [currentDealIndex, setCurrentDealIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const [mealTypesEmblaRef, mealTypesEmblaApi] = useEmblaCarousel({ 
    loop: false,
    align: 'start',
    containScroll: false,
    dragFree: false
  });

  const [selectedMealTypeIndex, setSelectedMealTypeIndex] = useState(0);

  const [corporateEmblaRef, corporateEmblaApi] = useEmblaCarousel({ 
    loop: false,
    align: 'start',
    containScroll: false,
    dragFree: false
  });

  const [selectedCorporateIndex, setSelectedCorporateIndex] = useState(0);

  useEffect(() => {
    if (!mealTypesEmblaApi) return;

    const onSelect = () => {
      setSelectedMealTypeIndex(mealTypesEmblaApi.selectedScrollSnap());
    };

    mealTypesEmblaApi.on('select', onSelect);
    onSelect();

    return () => {
      mealTypesEmblaApi.off('select', onSelect);
    };
  }, [mealTypesEmblaApi]);

  const scrollToMealType = useCallback((index: number) => {
    if (mealTypesEmblaApi) {
      mealTypesEmblaApi.scrollTo(index);
    }
  }, [mealTypesEmblaApi]);

  useEffect(() => {
    if (!corporateEmblaApi) return;

    const onSelect = () => {
      setSelectedCorporateIndex(corporateEmblaApi.selectedScrollSnap());
    };

    corporateEmblaApi.on('select', onSelect);
    onSelect();

    return () => {
      corporateEmblaApi.off('select', onSelect);
    };
  }, [corporateEmblaApi]);

  const scrollToCorporateFeature = useCallback((index: number) => {
    if (corporateEmblaApi) {
      corporateEmblaApi.scrollTo(index);
    }
  }, [corporateEmblaApi]);

  const { data: apiCartItems } = useQuery<CartItem[] | null>({
    queryKey: ['/api/cart'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Use server cart for authenticated users, localStorage for guests
  const cartItems = apiCartItems !== null && apiCartItems !== undefined
    ? apiCartItems // Authenticated: use server cart only
    : apiCartItems === null // Guest: use localStorage
      ? cartStorage.getCart().map(item => ({
          id: `local-${item.dishId}`,
          quantity: item.quantity,
          dish: item.dish,
          category: { id: item.dish.categoryId, name: item.dish.categoryId } as Category,
        }))
      : []; // Loading: empty array

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => {
    return sum + (parseFloat(item.dish.price as string) * item.quantity);
  }, 0);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'categories') {
      setLocation('/categories/tiffins');
    } else if (tab === 'profile') {
      setLocation('/profile');
    }
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const userName = 'Rahul';

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-background pt-4 pb-2" style={{ paddingTop: `calc(1rem + env(safe-area-inset-top))` }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  {userName.charAt(0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-muted-foreground text-xs">Hello!</p>
                  <h2 className="text-foreground font-semibold" data-testid="text-greeting">
                    {userName}
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full border border-border">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="text-foreground text-xs font-medium" data-testid="text-location">Bangalore</span>
                </div>
              </div>
            </div>
            <Button 
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              data-testid="button-get-help"
            >
              Get Help
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-4 pb-32 md:pb-6">
        {/* Hero Section */}
        <div className="mb-6" data-testid="section-hero">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight" data-testid="text-hero-title">
            Planning an event or ordering in bulk?
          </h1>
          
          {/* Hero Card */}
          <Card className="overflow-hidden bg-gradient-to-br from-primary/90 to-primary rounded-3xl">
            <div className="relative h-48 md:h-56 flex flex-col justify-center px-6">
              <h2 className="text-white text-3xl md:text-5xl font-black font-serif mb-2" data-testid="text-hero-subtitle">
                The Cater Planner
              </h2>
              <p className="text-white/90 text-base md:text-xl font-black font-serif mb-1">
                Authentic Indian cuisine for every occasion
              </p>
              <p className="text-white text-lg md:text-2xl font-black font-serif" data-testid="text-minimum-order">
                Orders as low as 10 servings
              </p>
            </div>
          </Card>
        </div>

                {/* Smart Menu Concierge Section */}
                <div className="mb-8" data-testid="section-concierge">
          <Card 
            className="overflow-hidden bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border-2 border-primary/20 hover-elevate cursor-pointer"
            onClick={() => setLocation('/concierge')}
            data-testid="card-concierge"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold" data-testid="text-concierge-title">
                      Smart Menu Concierge
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      AI-Powered
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-4" data-testid="text-concierge-description">
                    Let our AI help you create the perfect menu for your event. Just tell us your preferences, and we'll suggest the ideal platter.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      Any guest count
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      All event types
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Budget-friendly
                    </Badge>
                  </div>
                  <Button 
                    className="w-full sm:w-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation('/concierge');
                    }}
                    data-testid="button-start-concierge"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Personalized Recommendations
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Food Category Section */}
        <div className="mb-8" id="meal-types-section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl md:text-2xl font-bold" data-testid="text-meal-types-title">
              Food Category
            </h3>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-primary hover:text-primary"
              onClick={() => setLocation('/categories/tiffins')}
              data-testid="button-see-all-categories"
            >
              See all
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

        {/* Meal Type Cards Carousel with Peek Preview */}
        <div className="mb-4">
          <div className="overflow-hidden -mx-4 px-4" ref={mealTypesEmblaRef} data-testid="section-meal-types-carousel">
            <div className="flex gap-4">
              {MOCK_MEAL_TYPES.map((mealType, index) => {
                const IconComponent = mealType.icon;
                return (
                  <div 
                    key={mealType.id} 
                    className={`flex-[0_0_85%] md:flex-[0_0_45%] lg:flex-[0_0_30%] min-w-0 transition-all duration-300 ${
                      index === selectedMealTypeIndex ? 'scale-100 opacity-100' : 'scale-95 opacity-70'
                    }`}
                    data-testid={`card-meal-type-${mealType.id}`}
                  >
                    <div
                      className={`relative ${mealType.bgColor} rounded-3xl p-6 h-64 cursor-pointer overflow-hidden hover-elevate`}
                      onClick={() => setLocation(`/categories/${mealType.id}`)}
                    >
                      {/* Category Title and Info */}
                      <div className="relative z-10">
                        <h4 className={`${mealType.textColor} text-3xl font-bold mb-3 leading-tight`}>
                          {mealType.title}
                        </h4>
                        <div className="flex items-center gap-2 mb-4">
                          <IconComponent className={`w-5 h-5 ${mealType.textColor}`} />
                          <span className={`${mealType.textColor} font-medium`}>
                            {mealType.itemCount} items
                          </span>
                        </div>
                      </div>
                      
                      {/* See Menu Button */}
                      <div className="absolute bottom-6 left-6 z-10">
                        <div className={`${mealType.bgColor} border-2 ${mealType.textColor.replace('text-', 'border-')} px-6 py-2 rounded-full inline-flex items-center gap-2`}>
                          <span className={`${mealType.textColor} font-semibold text-sm`}>See Menu</span>
                        </div>
                      </div>

                      {/* Circular Dish Image - Bottom Right */}
                      <div className="absolute -bottom-8 -right-8 w-56 h-56 rounded-full overflow-hidden border-8 border-white/30">
                        <img 
                          src={mealType.imageUrl}
                          alt={mealType.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Carousel Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {MOCK_MEAL_TYPES.map((mealType, index) => (
              <button
                key={mealType.id}
                onClick={() => scrollToMealType(index)}
                className={`h-2 rounded-full transition-all ${
                  index === selectedMealTypeIndex 
                    ? 'w-8 bg-primary' 
                    : 'w-2 bg-muted-foreground/30'
                }`}
                data-testid={`indicator-meal-type-${index}`}
              />
            ))}
          </div>
        </div>
        </div>

        {/* Premium Items / Deals - Card Stack */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xl md:text-2xl font-bold" data-testid="text-deals-title">
                Premium Deals
              </h3>
            </div>
            <button className="text-primary text-sm font-medium hover:underline" data-testid="button-see-all-deals">
              See all
            </button>
          </div>

          <div className="relative h-24 w-full max-w-md mx-auto" data-testid="section-deals-stack">
            {DEALS.map((deal, index) => {
              const IconComponent = deal.icon;
              const isVisible = index >= currentDealIndex && index < currentDealIndex + 3;
              const stackPosition = index - currentDealIndex;
              
              if (!isVisible) return null;
              
              return (
                <div
                  key={deal.id}
                  className="absolute inset-0 transition-all duration-300 cursor-grab active:cursor-grabbing select-none touch-pan-x"
                  style={{
                    transform: `translateY(${stackPosition * 10}px) scale(${1 - stackPosition * 0.04})`,
                    zIndex: DEALS.length - stackPosition,
                    opacity: stackPosition === 0 ? 1 : 0.6,
                    pointerEvents: stackPosition === 0 ? 'auto' : 'none',
                  }}
                  data-testid={`card-deal-${deal.id}`}
                  onTouchStart={(e) => {
                    if (stackPosition !== 0) return;
                    const touch = e.touches[0];
                    (e.currentTarget as any).startX = touch.clientX;
                  }}
                  onTouchEnd={(e) => {
                    if (stackPosition !== 0) return;
                    const touch = e.changedTouches[0];
                    const startX = (e.currentTarget as any).startX;
                    const diffX = touch.clientX - startX;
                    
                    if (Math.abs(diffX) > 50) {
                      if (diffX > 0) {
                        // Swipe right - go to previous
                        setCurrentDealIndex((prev) => (prev - 1 + DEALS.length) % DEALS.length);
                      } else {
                        // Swipe left - go to next
                        setCurrentDealIndex((prev) => (prev + 1) % DEALS.length);
                      }
                    }
                  }}
                  onMouseDown={(e) => {
                    if (stackPosition !== 0) return;
                    (e.currentTarget as any).startX = e.clientX;
                  }}
                  onMouseUp={(e) => {
                    if (stackPosition !== 0) return;
                    const startX = (e.currentTarget as any).startX;
                    const diffX = e.clientX - startX;
                    
                    if (Math.abs(diffX) > 50) {
                      if (diffX > 0) {
                        setCurrentDealIndex((prev) => (prev - 1 + DEALS.length) % DEALS.length);
                      } else {
                        setCurrentDealIndex((prev) => (prev + 1) % DEALS.length);
                      }
                    }
                  }}
                >
                  <Card className={`h-full bg-gradient-to-br ${deal.bgGradient} border border-primary/20`}>
                    <div className="p-2.5 flex items-start gap-2.5 h-full">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm mb-0.5 leading-tight" data-testid={`text-deal-title-${deal.id}`}>
                          {deal.title}
                        </h4>
                        <p className="text-xs text-primary font-semibold mb-0.5 leading-tight" data-testid={`text-deal-subtitle-${deal.id}`}>
                          {deal.subtitle}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1 leading-tight" data-testid={`text-deal-description-${deal.id}`}>
                          {deal.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="mb-8" data-testid="tagline-coming-soon">
          <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-primary/30">
            <div className="p-4 flex items-center justify-center gap-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <p className="text-sm md:text-base font-semibold text-center">
                <span className="text-primary">Hyderabad</span> Coming Soon - Stay Tuned!
              </p>
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
          </Card>
        </div>

        {/* Corporate Orders Section */}
        <div className="mb-8" data-testid="section-corporate">
          <Card className="border-primary/20">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold" data-testid="text-corporate-title">
                    Corporate Orders
                  </h3>
                  <p className="text-sm text-muted-foreground">Perfect for your team</p>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-6" data-testid="text-corporate-description">
                Delight your team with authentic Indian cuisine. Perfect for office meetings, events, and daily meals.
              </p>

              {/* Corporate Features Carousel */}
              <div className="overflow-hidden -mx-6 px-6 mb-6" ref={corporateEmblaRef} data-testid="section-corporate-carousel">
                <div className="flex gap-4">
                  {CORPORATE_FEATURES.map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <div 
                        key={feature.id} 
                        className={`flex-[0_0_80%] sm:flex-[0_0_60%] md:flex-[0_0_45%] min-w-0 transition-all duration-300 ${
                          index === selectedCorporateIndex ? 'scale-100 opacity-100' : 'scale-95 opacity-70'
                        }`}
                        data-testid={`card-corporate-${feature.id}`}
                      >
                        <div
                          className={`relative ${feature.bgColor} rounded-3xl p-6 h-56 cursor-pointer overflow-hidden hover-elevate`}
                        >
                          {/* Feature Icon and Title */}
                          <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-full ${feature.bgColor} border-2 ${feature.textColor.replace('text-', 'border-')} flex items-center justify-center mb-4`}>
                              <IconComponent className={`w-6 h-6 ${feature.textColor}`} />
                            </div>
                            <h4 className={`${feature.textColor} text-2xl font-bold mb-2 leading-tight`}>
                              {feature.title}
                            </h4>
                            <p className={`${feature.textColor} opacity-80 text-sm`}>
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Carousel Indicators */}
              <div className="flex justify-center gap-2 mb-6">
                {CORPORATE_FEATURES.map((feature, index) => (
                  <button
                    key={feature.id}
                    onClick={() => scrollToCorporateFeature(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === selectedCorporateIndex 
                        ? 'w-8 bg-primary' 
                        : 'w-2 bg-muted-foreground/30'
                    }`}
                    data-testid={`indicator-corporate-${index}`}
                  />
                ))}
              </div>

              <Button 
                className="w-full md:w-auto"
                size="lg"
                onClick={() => setLocation('/corporate')}
                data-testid="button-corporate-inquiry"
              >
                Get Corporate Quote
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <FloatingCartButton 
        itemCount={totalItems}
        totalPrice={totalPrice}
        onClick={() => setLocation('/categories/tiffins')}
      />

      <BottomNav 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        cartItemCount={totalItems}
      />
    </div>
  );
}
