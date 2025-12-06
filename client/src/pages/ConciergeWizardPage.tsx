import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, ChevronRight, Building2, Heart, Sparkles, Cake, CalendarDays, PartyPopper, Briefcase, GraduationCap, Users, Home, Baby, Music, Tent, Star } from "lucide-react";
import FloatingNav from "@/pages/FloatingNav";
import { supabase } from "@/lib/supabase-client";

import heroImage from "@assets/Smart_Menu34_1765010825958.png";

interface CategoryCount {
  categoryId: string;
  count: number;
}

interface ConciergePreferences {
  cuisinePreferences: string[];
  numberOfPax: number;
  eventType: string;
  budget: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  dietaryPreference?: 'veg' | 'egg' | 'non-veg' | 'all';
  allergies?: string;
  categoryCounts: CategoryCount[];
}

const STEPS = [
  { id: 1, title: "Event Details", label: "" },
  { id: 2, title: "Cuisine Preferences", label: "Event" },
  { id: 3, title: "Guest Count & Meal", label: "Cuisine" },
  { id: 4, title: "Dietary & Allergies", label: "Guest Count & Meals" },
  { id: 5, title: "Budget", label: "Dietary & Allergies" },
  { id: 6, title: "Course Details", label: "Budget" },
];

const EVENT_TYPES = [
  { value: "corporate", label: "Corporate Event", Icon: Building2 },
  { value: "wedding", label: "Wedding", Icon: Heart },
  { value: "engagement", label: "Engagement", Icon: Sparkles },
  { value: "birthday", label: "Birthday Party", Icon: Cake },
  { value: "anniversary", label: "Anniversary", Icon: CalendarDays },
  { value: "festival", label: "Festival", Icon: PartyPopper },
  { value: "meeting", label: "Business Meeting", Icon: Briefcase },
  { value: "conference", label: "Conference", Icon: Users },
  { value: "seminar", label: "Seminar/Workshop", Icon: GraduationCap },
  { value: "reception", label: "Reception", Icon: Music },
  { value: "housewarming", label: "Housewarming", Icon: Home },
  { value: "baby-shower", label: "Baby Shower", Icon: Baby },
  { value: "office-party", label: "Office Party", Icon: Tent },
  { value: "casual", label: "Casual Gathering", Icon: Users },
  { value: "religious", label: "Religious Function", Icon: Star },
  { value: "other", label: "Other", Icon: Sparkles },
];

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast", icon: "🍳" },
  { value: "lunch", label: "Lunch", icon: "🍛" },
  { value: "dinner", label: "Dinner", icon: "🍽️" },
  { value: "snacks", label: "Snacks", icon: "🍪" },
];

const DIETARY_PREFERENCES = [
  { value: "veg", label: "VEG", description: "Only Vegetarian Dishes", color: "#1A9952" },
  { value: "egg", label: "EGGITARIAN", description: "Vegetarian dishes that include eggs", color: "#F59E0B" },
  { value: "non-veg", label: "NON-VEG", description: "All Types including meat", color: "#EF4444" },
  { value: "all", label: "NO PREFERENCE", description: "Shows all dishes", color: "#6B7280", isIcon: true },
];

export default function ConciergeWizardPage() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [cuisineSearch, setCuisineSearch] = useState("");
  const [preferences, setPreferences] = useState<ConciergePreferences>({
    cuisinePreferences: [],
    numberOfPax: 50,
    eventType: "",
    budget: 0,
    mealType: "lunch",
    categoryCounts: [],
  });

  const { data: cuisines = [], isLoading: cuisinesLoading } = useQuery<any[]>({
    queryKey: ['cuisines'],
    queryFn: async () => {
      try {
        const rows = await supabase.select('cuisines', {
          select: 'id,name,display_name,icon,display_order,is_active',
          order: 'display_order.asc',
        });
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((row: any) => ({
            id: row.id ?? row.name,
            name: row.name,
            displayName: row.display_name ?? row.name,
            icon: row.icon ?? 'UtensilsCrossed',
            displayOrder: row.display_order ?? 0,
            isActive: row.is_active ?? true,
          }));
        }
      } catch (error) {
        console.warn('[Supabase] cuisines table unavailable, deriving from dishes', error);
      }
      const dishRows = await supabase.select<{ cuisine: string | null }>('dishes', {
        select: 'cuisine',
      });
      const uniqueCuisines = Array.from(new Set(dishRows.map(d => d.cuisine).filter(Boolean))) as string[];
      return uniqueCuisines.map((name, index) => ({
        id: name,
        name: name,
        displayName: name,
        icon: 'UtensilsCrossed',
        displayOrder: index,
        isActive: true,
      }));
    },
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: ['categories', preferences.mealType],
    enabled: !!preferences.mealType,
    queryFn: async () => {
      const mealTypeMap: Record<string, string> = {
        breakfast: 'tiffins',
        lunch: 'lunch-dinner',
        dinner: 'lunch-dinner',
        snacks: 'snacks',
      };
      const mealTypeFilter = mealTypeMap[preferences.mealType] || preferences.mealType;
      const rows = await supabase.select('categories', {
        select: '*',
        order: 'display_order.asc',
      });
      return rows.filter((cat: any) => {
        const types = cat.meal_type?.split(',').map((t: string) => t.trim()) || [];
        return types.includes(mealTypeFilter);
      });
    },
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      const params = new URLSearchParams();
      Object.entries(preferences).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          if (Array.isArray(value)) {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, value.toString());
          }
        }
      });
      setLocation(`/concierge/results?${params.toString()}`);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      setLocation("/");
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return preferences.eventType !== "";
      case 2:
        return preferences.cuisinePreferences.length > 0;
      case 3:
        return preferences.numberOfPax > 0 && !!preferences.mealType;
      case 4:
        return !!preferences.dietaryPreference;
      case 5:
        return preferences.budget > 0;
      default:
        return true;
    }
  };

  const getStepLabel = () => {
    return STEPS[currentStep - 1]?.label || "";
  };

  const toggleCuisine = (cuisineName: string) => {
    const newCuisines = preferences.cuisinePreferences.includes(cuisineName)
      ? preferences.cuisinePreferences.filter(c => c !== cuisineName)
      : [...preferences.cuisinePreferences, cuisineName];
    setPreferences({ ...preferences, cuisinePreferences: newCuisines });
  };

  const toggleMealType = (mealValue: string) => {
    setPreferences({
      ...preferences,
      mealType: mealValue as ConciergePreferences['mealType'],
    });
  };

  const filteredCuisines = cuisines.filter((c: any) =>
    c.displayName?.toLowerCase().includes(cuisineSearch.toLowerCase()) ||
    c.name?.toLowerCase().includes(cuisineSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white pb-24 flex flex-col">
      <div className="sticky top-0 z-10 bg-white">
        <section className="relative w-full bg-white">
          <div className="relative w-full">
            <img
              src={heroImage}
              alt="Smart Menu Concierge"
              className="w-full h-auto"
              data-testid="image-concierge-hero"
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)',
                maskImage: 'linear-gradient(to bottom, #000 0%, #000 60%, transparent 100%)'
              }}
            />
          </div>
        </section>

        <div className="px-4 pt-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 mb-4"
            style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">
              {currentStep === 1 ? "Home" : getStepLabel()}
            </span>
          </button>

          <div className="flex gap-1">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className="h-1 flex-1 rounded-full transition-colors"
                style={{
                  backgroundColor: step.id <= currentStep ? "#1A9952" : "#E5E7EB",
                }}
              />
            ))}
          </div>
        </div>

        {currentStep === 1 && (
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Event Details
                </h2>
                <p className="text-sm text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                  Tell Us About Your Event
                </p>
              </div>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-5 py-2 text-sm font-semibold disabled:opacity-50"
                style={{
                  fontFamily: "Sweet Sans Pro",
                  backgroundColor: "#1A9952",
                  color: "white",
                  borderRadius: "8px",
                }}
                data-testid="button-next"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <p className="text-sm font-medium mt-4" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              What Type of Event are you planning?
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {currentStep === 1 && (
          <div className="grid grid-cols-2 gap-3 pb-4">
                {EVENT_TYPES.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    onClick={() => setPreferences({ ...preferences, eventType: value })}
                    className="flex items-center gap-3 p-4 border-2 rounded-lg transition-all"
                    style={{
                      borderColor: preferences.eventType === value ? "#1A9952" : "#E5E7EB",
                      backgroundColor: preferences.eventType === value ? "#F0F9F4" : "white",
                    }}
                    data-testid={`event-type-${value}`}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: "#1A9952",
                        backgroundColor: preferences.eventType === value ? "#1A9952" : "white",
                      }}
                    >
                      {preferences.eventType === value && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex flex-col items-center flex-1">
                      <Icon className="w-6 h-6 mb-1" style={{ color: "#1A9952" }} />
                      <span
                        className="text-xs font-medium text-center"
                        style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
                      >
                        {label}
                      </span>
                    </div>
                  </button>
                ))}
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Cuisine Preferences
                </h2>
                <p className="text-sm text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                  Select your preferred cuisines
                </p>
              </div>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-5 py-2 text-sm font-semibold disabled:opacity-50"
                style={{
                  fontFamily: "Sweet Sans Pro",
                  backgroundColor: "#1A9952",
                  color: "white",
                  borderRadius: "8px",
                }}
                data-testid="button-next"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <p className="text-xs text-gray-500 mb-6" style={{ fontFamily: "Sweet Sans Pro" }}>
              Choose all the cuisines that you'd like to include in your menu
            </p>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Cuisines"
                value={cuisineSearch}
                onChange={(e) => setCuisineSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ fontFamily: "Sweet Sans Pro" }}
                data-testid="input-cuisine-search"
              />
            </div>

            {cuisinesLoading ? (
              <div className="text-center py-8 text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                Loading cuisines...
              </div>
            ) : (
              <div className="space-y-0 border-t border-gray-100">
                {filteredCuisines.map((cuisine: any) => (
                  <button
                    key={cuisine.name}
                    onClick={() => toggleCuisine(cuisine.name)}
                    className="w-full flex items-center gap-3 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    data-testid={`cuisine-${cuisine.name}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-sm font-semibold text-green-700">
                      {cuisine.displayName?.charAt(0) || cuisine.name?.charAt(0)}
                    </div>
                    <span
                      className="flex-1 text-left text-sm"
                      style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
                    >
                      {cuisine.displayName || cuisine.name}
                    </span>
                    <div
                      className="w-5 h-5 rounded border-2 flex items-center justify-center"
                      style={{
                        borderColor: preferences.cuisinePreferences.includes(cuisine.name) ? "#1A9952" : "#D1D5DB",
                        backgroundColor: preferences.cuisinePreferences.includes(cuisine.name) ? "#1A9952" : "white",
                      }}
                    >
                      {preferences.cuisinePreferences.includes(cuisine.name) && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Guest Count & Meals
                </h2>
                <p className="text-sm text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                  Guests & Meal Type
                </p>
              </div>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-5 py-2 text-sm font-semibold disabled:opacity-50"
                style={{
                  fontFamily: "Sweet Sans Pro",
                  backgroundColor: "#1A9952",
                  color: "white",
                  borderRadius: "8px",
                }}
                data-testid="button-next"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="mt-8 space-y-8">
              <div>
                <p className="text-sm font-medium mb-4" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Enter Number of Guests
                </p>
                <input
                  type="number"
                  placeholder="50"
                  value={preferences.numberOfPax || ""}
                  onChange={(e) => setPreferences({ ...preferences, numberOfPax: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-guest-count"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm font-medium" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Select the type of meal
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {MEAL_TYPES.map((meal) => (
                    <button
                      key={meal.value}
                      onClick={() => toggleMealType(meal.value)}
                      className="flex items-center gap-3 p-3 border rounded-lg transition-all"
                      style={{
                        borderColor: preferences.mealType === meal.value ? "#1A9952" : "#E5E7EB",
                        backgroundColor: preferences.mealType === meal.value ? "#F0F9F4" : "white",
                      }}
                      data-testid={`meal-type-${meal.value}`}
                    >
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                        style={{
                          borderColor: "#1A9952",
                          backgroundColor: preferences.mealType === meal.value ? "#1A9952" : "white",
                        }}
                      >
                        {preferences.mealType === meal.value && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-lg">
                        {meal.icon}
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
                      >
                        {meal.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Dietary & Allergies
                </h2>
                <p className="text-sm text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                  Special Requirements
                </p>
              </div>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-5 py-2 text-sm font-semibold disabled:opacity-50"
                style={{
                  fontFamily: "Sweet Sans Pro",
                  backgroundColor: "#1A9952",
                  color: "white",
                  borderRadius: "8px",
                }}
                data-testid="button-next"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: "Sweet Sans Pro" }}>
                  Select your dietary preferences to filter dishes accordingly
                </p>

                <div className="space-y-3">
                  {DIETARY_PREFERENCES.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setPreferences({ ...preferences, dietaryPreference: option.value as ConciergePreferences['dietaryPreference'] })}
                      className="w-full flex items-center gap-4 p-4 border rounded-lg transition-all"
                      style={{
                        borderColor: preferences.dietaryPreference === option.value ? "#1A9952" : "#E5E7EB",
                        backgroundColor: preferences.dietaryPreference === option.value ? "#F0F9F4" : "white",
                      }}
                      data-testid={`dietary-${option.value}`}
                    >
                      {option.isIcon ? (
                        <div className="w-6 h-6 flex items-center justify-center">
                          <svg
                            className="w-5 h-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={option.color}
                            strokeWidth={2}
                          >
                            <path d="M12 3v18M3 12h18" strokeLinecap="round" />
                          </svg>
                        </div>
                      ) : (
                        <div
                          className="w-6 h-6 rounded-full border-4"
                          style={{ borderColor: option.color }}
                        />
                      )}
                      <div className="flex-1 text-left">
                        <p
                          className="font-semibold text-sm"
                          style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
                        >
                          {option.label}
                        </p>
                        <p className="text-xs text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                          {option.description}
                        </p>
                      </div>
                      <div
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                        style={{
                          borderColor: "#1A9952",
                          backgroundColor: preferences.dietaryPreference === option.value ? "#1A9952" : "white",
                        }}
                      >
                        {preferences.dietaryPreference === option.value && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p
                  className="font-semibold text-sm mb-2"
                  style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}
                >
                  Allergies or Dietary Restrictions (Optional)
                </p>
                <p className="text-xs text-gray-500 mb-3" style={{ fontFamily: "Sweet Sans Pro" }}>
                  Let us know about any allergies or specific dietary restrictions to avoid
                </p>
                <input
                  type="text"
                  placeholder="Nuts, Peanut, Fish, etc"
                  value={preferences.allergies || ""}
                  onChange={(e) => setPreferences({ ...preferences, allergies: e.target.value || undefined })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-allergies"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Total Budget
                </h2>
                <p className="text-sm text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                  Your total budget for catering
                </p>
              </div>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-5 py-2 text-sm font-semibold disabled:opacity-50"
                style={{
                  fontFamily: "Sweet Sans Pro",
                  backgroundColor: "#1A9952",
                  color: "white",
                  borderRadius: "8px",
                }}
                data-testid="button-next"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm font-medium mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Enter your total budget
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: "#06352A" }}>₹</span>
                  <input
                    type="number"
                    placeholder="25000"
                    value={preferences.budget || ""}
                    onChange={(e) => setPreferences({ ...preferences, budget: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    style={{ fontFamily: "Sweet Sans Pro" }}
                    data-testid="input-budget"
                  />
                </div>
              </div>

              {preferences.budget > 0 && preferences.numberOfPax > 0 && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: "#F0F9F4" }}>
                  <p className="text-sm font-medium" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Budget per person:
                  </p>
                  <p className="text-2xl font-bold" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                    ₹{(preferences.budget / preferences.numberOfPax).toFixed(2)}
                  </p>
                </div>
              )}

              {preferences.budget <= 0 && (
                <p className="text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#EF4444" }}>
                  Please enter a valid budget amount
                </p>
              )}
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Course Details
                </h2>
                <p className="text-sm text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                  Customize your courses (optional)
                </p>
              </div>
              <Button
                onClick={handleNext}
                className="px-5 py-2 text-sm font-semibold"
                style={{
                  fontFamily: "Sweet Sans Pro",
                  backgroundColor: "#1A9952",
                  color: "white",
                  borderRadius: "8px",
                }}
                data-testid="button-get-recommendations"
              >
                Get Menu <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            <div className="mt-6">
              <p className="text-xs text-gray-500 mb-4" style={{ fontFamily: "Sweet Sans Pro" }}>
                Specify how many items you'd like in each category. Leave blank for AI to decide.
              </p>

              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: "#F0F9F4" }}>
                <p className="text-sm font-medium" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                  Meal Type: {MEAL_TYPES.find(m => m.value === preferences.mealType)?.label}
                </p>
              </div>

              {categoriesLoading ? (
                <div className="text-center py-8 text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                  Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                  No categories available for this meal type
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((category: any) => {
                    const currentCount = preferences.categoryCounts.find(
                      cc => cc.categoryId === category.id
                    )?.count || 0;

                    return (
                      <div key={category.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <span className="text-sm font-medium" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                          {category.name}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          placeholder="0"
                          value={currentCount || ""}
                          onChange={(e) => {
                            const newCount = parseInt(e.target.value) || 0;
                            const existingIndex = preferences.categoryCounts.findIndex(
                              cc => cc.categoryId === category.id
                            );
                            let newCategoryCounts = [...preferences.categoryCounts];
                            if (existingIndex >= 0) {
                              if (newCount === 0) {
                                newCategoryCounts = newCategoryCounts.filter(cc => cc.categoryId !== category.id);
                              } else {
                                newCategoryCounts[existingIndex] = { categoryId: category.id, count: newCount };
                              }
                            } else if (newCount > 0) {
                              newCategoryCounts.push({ categoryId: category.id, count: newCount });
                            }
                            setPreferences({ ...preferences, categoryCounts: newCategoryCounts });
                          }}
                          className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                          style={{ fontFamily: "Sweet Sans Pro" }}
                          data-testid={`category-count-${category.id}`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <FloatingNav />
    </div>
  );
}
