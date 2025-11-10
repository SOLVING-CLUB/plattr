import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Sparkles, Users, Calendar, DollarSign, Utensils, Flame, ChefHat, Coffee, Wheat, UtensilsCrossed, Soup, Fish, Salad, Drumstick, Cookie, Truck, Cake } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import * as LucideIcons from "lucide-react";

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
  { id: 1, title: "Event Details", description: "Tell us about your event" },
  { id: 2, title: "Cuisine Preferences", description: "Select your cuisines" },
  { id: 3, title: "Guest Count & Meal", description: "Guests and meal type" },
  { id: 4, title: "Dietary & Allergies", description: "Special requirements" },
  { id: 5, title: "Budget", description: "Your total budget" },
  { id: 6, title: "Course Details", description: "Customize your courses" },
];

const EVENT_TYPES = [
  { value: "corporate", label: "Corporate Event", icon: "💼" },
  { value: "wedding", label: "Wedding", icon: "💒" },
  { value: "engagement", label: "Engagement", icon: "💍" },
  { value: "birthday", label: "Birthday Party", icon: "🎂" },
  { value: "anniversary", label: "Anniversary", icon: "🎊" },
  { value: "festival", label: "Festival", icon: "🪔" },
  { value: "meeting", label: "Business Meeting", icon: "🤝" },
  { value: "conference", label: "Conference", icon: "📊" },
  { value: "seminar", label: "Seminar/Workshop", icon: "📚" },
  { value: "reception", label: "Reception", icon: "🥂" },
  { value: "housewarming", label: "Housewarming", icon: "🏡" },
  { value: "baby-shower", label: "Baby Shower", icon: "👶" },
  { value: "office-party", label: "Office Party", icon: "🎈" },
  { value: "casual", label: "Casual Gathering", icon: "🎉" },
  { value: "religious", label: "Religious Function", icon: "🙏" },
  { value: "other", label: "Other", icon: "✨" },
];

// Icon mapping for cuisine types
const getCuisineIcon = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'Coffee': Coffee,
    'Wheat': Wheat,
    'UtensilsCrossed': UtensilsCrossed,
    'ChefHat': ChefHat,
    'Flame': Flame,
    'Soup': Soup,
    'Fish': Fish,
    'Salad': Salad,
    'Drumstick': Drumstick,
    'Cookie': Cookie,
    'Truck': Truck,
    'Cake': Cake,
  };
  return iconMap[iconName] || Utensils;
};

const toTitleCase = (value: string) =>
  value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast", icon: "☕" },
  { value: "lunch", label: "Lunch", icon: "🍛" },
  { value: "dinner", label: "Dinner", icon: "🍽️" },
  { value: "snacks", label: "Snacks", icon: "🍪" },
];

const SPICE_LEVELS = [
  { value: "mild", label: "Mild", icon: "😊", color: "bg-green-500" },
  { value: "medium", label: "Medium", icon: "🌶️", color: "bg-yellow-500" },
  { value: "spicy", label: "Spicy", icon: "🔥", color: "bg-orange-500" },
  { value: "extra-spicy", label: "Extra Spicy", icon: "🌋", color: "bg-red-500" },
];

const DIETARY_PREFERENCES = [
  { value: "veg", label: "Vegetarian", icon: "🥗", description: "Only vegetarian dishes" },
  { value: "egg", label: "Eggetarian", icon: "🥚", description: "Veg + Egg dishes" },
  { value: "non-veg", label: "Non-Vegetarian", icon: "🍗", description: "All types including meat" },
  { value: "all", label: "No Preference", icon: "🍽️", description: "Show all dishes" },
];

export default function ConciergeWizardPage() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [preferences, setPreferences] = useState<ConciergePreferences>({
    cuisinePreferences: [],
    numberOfPax: 50,
    eventType: "",
    budget: 0,
    mealType: "lunch",
    categoryCounts: [],
  });

  type SupabaseCuisineRow = {
    id?: string;
    name: string;
    display_name?: string | null;
    displayName?: string | null;
    icon?: string | null;
    display_order?: number | null;
  };

  type ConciergeCuisine = {
    id?: string;
    name: string;
    displayName: string;
    icon: string;
  };

  type SupabaseCategory = {
    id: string;
    name: string;
    meal_type?: string;
    mealType?: string;
  };

  // Fetch cuisines from Supabase
  // const { data: cuisines = [], isLoading: cuisinesLoading } = useQuery<ConciergeCuisine[]>({
  //   queryKey: ["supabase", "cuisines"],
  //   queryFn: async () => {
  //     const normalizeCuisine = (row: SupabaseCuisineRow): ConciergeCuisine => ({
  //       id: row.id,
  //       name: row.name,
  //       displayName: row.displayName ?? row.display_name ?? toTitleCase(row.name),
  //       icon: row.icon ?? "Utensils",
  //     });

  //     try {
  //       const rows = await supabase.select<SupabaseCuisineRow>("cuisines", {
  //         select: "id,name,display_name,icon,display_order",
  //         order: "display_order.asc",
  //       });

  //       if (Array.isArray(rows) && rows.length > 0) {
  //         return rows.map(normalizeCuisine);
  //       }
  //     } catch (error) {
  //       console.warn("[Supabase] Falling back to derived cuisines", error);
  //     }

  //     // Fallback: derive cuisine list from dishes table when cuisines table is absent
  //     try {
  //       const dishRows = await supabase.select<{ cuisine: string | null }>("dishes", {
  //         select: "cuisine",
  //         order: "cuisine.asc",
  //       });

  //       const seen = new Set<string>();
  //       const derived: ConciergeCuisine[] = [];

  //       for (const row of dishRows) {
  //         const cuisineName = row?.cuisine?.trim();
  //         if (!cuisineName) continue;
  //         if (seen.has(cuisineName)) continue;
  //         seen.add(cuisineName);
  //         derived.push(
  //           normalizeCuisine({
  //             name: cuisineName,
  //           })
  //         );
  //       }

  //       return derived;
  //     } catch (fallbackError) {
  //       console.error("[Supabase] Failed to derive cuisines from dishes", fallbackError);
  //       return [] as ConciergeCuisine[];
  //     }
  //   },
  // });

  const { data: cuisines = [], isLoading: cuisinesLoading } = useQuery<ConciergeCuisine[]>({
    queryKey: ["supabase", "cuisines"],
    queryFn: async () => {
      const normalizeCuisine = (row: SupabaseCuisineRow): ConciergeCuisine => ({
        id: row.id,
        name: row.name,
        displayName: row.displayName ?? row.display_name ?? toTitleCase(row.name),
        icon: row.icon ?? "Utensils",
      });
  
      // Directly derive cuisines from the dishes table only
      try {
        const dishRows = await supabase.select<{ cuisine: string | null }>("dishes", {
          select: "cuisine",
          order: "cuisine.asc",
        });
  
        const seen = new Set<string>();
        const derived: ConciergeCuisine[] = [];
  
        for (const row of dishRows) {
          const cuisineName = row?.cuisine?.trim();
          if (!cuisineName || seen.has(cuisineName)) continue;
          seen.add(cuisineName);
          derived.push(
            normalizeCuisine({
              name: cuisineName,
            }),
          );
        }
  
        return derived;
      } catch (error) {
        console.error("[Supabase] Failed to derive cuisines from dishes", error);
        return [] as ConciergeCuisine[];
      }
    },
  });

  // Fetch categories for the selected meal type from Supabase
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["supabase", "categories", preferences.mealType],
    enabled: !!preferences.mealType,
    queryFn: async () => {
      const rows = await supabase.select<SupabaseCategory>("categories", {
        select: "id,name,meal_type,display_order",
        order: "display_order.asc",
        filter: preferences.mealType
          ? { 'meal_type': `eq.${preferences.mealType}` }
          : undefined,
      });

      return rows.map((row) => ({
        ...row,
        mealType: row.mealType ?? row.meal_type,
      }));
    },
  });

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Navigate to results page with preferences
      const params = new URLSearchParams();
      Object.entries(preferences).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          // Serialize arrays and objects as JSON
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold" data-testid="text-title">Smart Menu Concierge</h1>
          </div>
          <p className="text-muted-foreground text-lg" data-testid="text-subtitle">
            Let AI help you create the perfect menu for your event
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {STEPS.length}</span>
            <span className="text-sm text-muted-foreground">{STEPS[currentStep - 1].title}</span>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-wizard" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-8">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                step.id <= currentStep ? "opacity-100" : "opacity-40"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  step.id <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
                data-testid={`step-indicator-${step.id}`}
              >
                {step.id}
              </div>
              <span className="text-xs text-center hidden sm:block">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <Calendar className="w-5 h-5" />}
              {currentStep === 2 && <Users className="w-5 h-5" />}
              {currentStep === 3 && <Utensils className="w-5 h-5" />}
              {currentStep === 4 && <DollarSign className="w-5 h-5" />}
              {currentStep === 5 && <ChefHat className="w-5 h-5" />}
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Event Type */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <Label>What type of event are you planning?</Label>
                <div className="max-h-96 overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {EVENT_TYPES.map((type) => (
                      <Card
                        key={type.value}
                        className={`cursor-pointer hover-elevate ${
                          preferences.eventType === type.value
                            ? "border-primary border-2"
                            : ""
                        }`}
                        onClick={() =>
                          setPreferences({ ...preferences, eventType: type.value })
                        }
                        data-testid={`card-event-${type.value}`}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="text-3xl mb-2">{type.icon}</div>
                          <div className="text-sm font-medium">{type.label}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Cuisine Preferences (Multi-select) */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Select your preferred cuisines (choose one or more)</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose all the cuisines you'd like to include in your menu
                  </p>
                </div>
                {cuisinesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading cuisines...
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cuisines.map((cuisine, index) => {
                        const isSelected = preferences.cuisinePreferences.includes(cuisine.name);
                        const CuisineIcon = getCuisineIcon(cuisine.icon);
                        return (
                          <Card
                            key={cuisine.name || index}
                            className={`cursor-pointer hover-elevate ${
                              isSelected ? "border-primary border-2" : ""
                            }`}
                            onClick={() => {
                              const newCuisines = isSelected
                                ? preferences.cuisinePreferences.filter(c => c !== cuisine.name)
                                : [...preferences.cuisinePreferences, cuisine.name];
                              setPreferences({ ...preferences, cuisinePreferences: newCuisines });
                            }}
                            data-testid={`card-cuisine-${cuisine.name}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="text-primary">
                                  <CuisineIcon className="w-8 h-8" />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium mb-1">{cuisine.displayName}</div>
                                </div>
                                {isSelected && (
                                  <Badge variant="default" className="ml-auto">Selected</Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    {preferences.cuisinePreferences.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">Selected:</span>
                        {preferences.cuisinePreferences.map(cuisineName => {
                          const cuisineData = cuisines.find(c => c.name === cuisineName);
                          if (!cuisineData) return null;
                          const CuisineIcon = getCuisineIcon(cuisineData.icon);
                          return (
                            <Badge key={cuisineName} variant="secondary" className="flex items-center gap-1">
                              <CuisineIcon className="w-3 h-3" />
                              {cuisineData.displayName}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 3: Guest Count & Meal Type (Combined) */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Guest Count Section */}
                <div className="space-y-4">
                  <Label className="text-lg">Number of Guests</Label>
                  <div className="text-center">
                    <div className="text-6xl font-bold text-primary mb-2" data-testid="text-pax-count">
                      {preferences.numberOfPax}
                    </div>
                    <p className="text-muted-foreground">guests</p>
                  </div>

                  <div className="space-y-4">
                    <Slider
                      value={[preferences.numberOfPax]}
                      onValueChange={([value]) =>
                        setPreferences({ ...preferences, numberOfPax: value })
                      }
                      min={10}
                      max={500}
                      step={10}
                      className="w-full"
                      data-testid="slider-pax"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>10</span>
                      <span>500</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pax-input">Or enter exact number</Label>
                    <Input
                      id="pax-input"
                      type="number"
                      min={1}
                      max={1000}
                      value={preferences.numberOfPax}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          numberOfPax: parseInt(e.target.value) || 1,
                        })
                      }
                      data-testid="input-pax"
                    />
                  </div>
                </div>

                {/* Meal Type Section */}
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-lg">What type of meal?</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {MEAL_TYPES.map((meal) => (
                      <Card
                        key={meal.value}
                        className={`cursor-pointer hover-elevate ${
                          preferences.mealType === meal.value
                            ? "border-primary border-2"
                            : ""
                        }`}
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            mealType: meal.value as ConciergePreferences['mealType'],
                          })
                        }
                        data-testid={`card-meal-${meal.value}`}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="text-3xl mb-2">{meal.icon}</div>
                          <div className="text-sm font-medium">{meal.label}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Dietary Preferences & Allergies */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label>Dietary Preferences</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your dietary preference to filter dishes accordingly
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {DIETARY_PREFERENCES.map((diet) => (
                      <Card
                        key={diet.value}
                        className={`cursor-pointer hover-elevate ${
                          preferences.dietaryPreference === diet.value
                            ? "border-primary border-2"
                            : ""
                        }`}
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            dietaryPreference: diet.value as ConciergePreferences['dietaryPreference'],
                          })
                        }
                        data-testid={`card-dietary-${diet.value}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-3xl">{diet.icon}</div>
                            <div className="flex-1">
                              <div className="font-medium mb-1">{diet.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {diet.description}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label htmlFor="allergies">Allergies or Dietary Restrictions (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Let us know about any allergies or specific dietary restrictions to avoid
                  </p>
                  <Input
                    id="allergies"
                    type="text"
                    placeholder="e.g., Nuts, Dairy, Gluten, etc."
                    value={preferences.allergies || ""}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        allergies: e.target.value || undefined,
                      })
                    }
                    data-testid="input-allergies"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Budget */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="budget">What is your total budget? <span className="text-destructive">*</span></Label>
                  <p className="text-sm text-muted-foreground">
                    Enter the total budget for catering your event
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold">₹</span>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="e.g., 25000"
                      value={preferences.budget || ""}
                      onChange={(e) =>
                        setPreferences({
                          ...preferences,
                          budget: e.target.value ? parseFloat(e.target.value) : 0,
                        })
                      }
                      data-testid="input-budget"
                      className="text-lg"
                    />
                  </div>
                  {preferences.budget > 0 && preferences.numberOfPax > 0 && (
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <p className="text-sm font-medium">Budget per person:</p>
                      <p className="text-2xl font-bold text-primary">
                        ₹{(preferences.budget / preferences.numberOfPax).toFixed(2)}
                      </p>
                    </div>
                  )}
                  {preferences.budget <= 0 && (
                    <p className="text-sm text-destructive">
                      Please enter a valid budget amount
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Course Details (Dynamic categories from database) */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-lg">Customize Your Courses</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Specify how many items you'd like in each category (optional - AI will decide if left blank)
                  </p>
                  <Badge variant="outline" className="mt-2">
                    Meal Type: {MEAL_TYPES.find(m => m.value === preferences.mealType)?.label}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {categoriesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading categories...</p>
                  ) : categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No categories available for this meal type</p>
                  ) : (
                    categories.map((category: any) => {
                      const currentCount = preferences.categoryCounts.find(
                        cc => cc.categoryId === category.id
                      )?.count || 0;

                      return (
                        <div key={category.id} className="space-y-2">
                          <Label htmlFor={category.id}>{category.name}</Label>
                          <Input
                            id={category.id}
                            type="number"
                            min={0}
                            max={15}
                            placeholder="e.g., 2-3"
                            value={currentCount || ""}
                            onChange={(e) => {
                              const newCount = e.target.value ? parseInt(e.target.value) : 0;
                              const newCategoryCounts = preferences.categoryCounts.filter(
                                cc => cc.categoryId !== category.id
                              );
                              
                              if (newCount > 0) {
                                newCategoryCounts.push({
                                  categoryId: category.id,
                                  count: newCount,
                                });
                              }
                              
                              setPreferences({
                                ...preferences,
                                categoryCounts: newCategoryCounts,
                              });
                            }}
                            data-testid={`input-${category.id}`}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            data-testid="button-next"
          >
            {currentStep === STEPS.length ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get Recommendations
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
