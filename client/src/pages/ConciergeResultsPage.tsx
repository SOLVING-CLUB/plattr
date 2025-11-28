import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ShoppingCart, ArrowLeft, Loader2, TrendingUp, Users, DollarSign } from "lucide-react";
import { getSupabaseImageUrl } from "@/lib/supabase";
import { SupabaseQueryOptions, supabase } from "@/lib/supabase-client";

const CATEGORY_NAME_MAP: Record<string, string> = {
  beverages: "Beverages",
  salads: "Salads",
  bakery: "Bakery",
  breakfast: "Breakfast",
  snacks: "Snacks",
  starters: "Starters",
  desserts: "Desserts",
  sweets: "Sweets",
  "main-course": "Main Course",
  main_course: "Main Course",
  soup: "Soups",
  sides: "Sides",
  "sides-and-accompaniments": "Sides & Accompaniments",
  chaats: "Chaats",
  biryani: "Biryani",
  "rice-items": "Rice Items",
  "breads-curries": "Breads & Curries",
  "baked-snacks": "Baked Snacks",
  "fried-snacks": "Fried Snacks",
  "south-indian-tiffins": "South Indian Tiffins",
  "north-indian-tiffins": "North Indian Tiffins",
  "quick-bites": "Quick Bites",
  aftermeal: "After Meal",
};

const formatCategoryName = (categoryId?: string | null) => {
  if (!categoryId) return "Chef's Picks";
  return (
    CATEGORY_NAME_MAP[categoryId] ||
    categoryId
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

interface Dish {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  mealType: string[];
  categoryId: string | null;
  categoryName: string;
  spiceLevel: string | null;
  dietaryType: string | null;
  dishType: string | null;
  recommendedCategory?: string;
  cuisine?: string | null;
  isAvailable: boolean;
}

interface RecommendationResponse {
  sessionId: string;
  recommendations: Dish[];
  totalEstimatedCost: number;
  estimatedCostPerPerson: number;
  preferences: {
    cuisinePreference?: string;
    numberOfPax: number;
    eventType: string;
    budget?: number;
    mealType: string;
    spiceLevel?: string;
  };
  aiSummary?: string | null;
  budgetStatus?: "within_budget" | "over_budget" | null;
  aiBudgetNote?: string | null;
}

export default function ConciergeResultsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const [isGenerating, setIsGenerating] = useState(true);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  // Parse preferences from URL
  const cuisinePreferencesParam = searchParams.get('cuisinePreferences');
  const categoryCountsParam = searchParams.get('categoryCounts');
  
  const preferences = {
    cuisinePreferences: cuisinePreferencesParam ? JSON.parse(cuisinePreferencesParam) : [],
    numberOfPax: parseInt(searchParams.get('numberOfPax') || '50'),
    eventType: searchParams.get('eventType') || '',
    budget: searchParams.get('budget') ? parseFloat(searchParams.get('budget')!) : undefined,
    mealType: (searchParams.get('mealType') || 'lunch') as 'breakfast' | 'lunch' | 'dinner' | 'snacks',
    dietaryPreference: searchParams.get('dietaryPreference') as 'veg' | 'egg' | 'non-veg' | 'all' | undefined,
    allergies: searchParams.get('allergies') || undefined,
    categoryCounts: categoryCountsParam ? JSON.parse(categoryCountsParam) : [],
  };

  // Generate recommendations on mount
  useEffect(() => {
    const generateRecommendations = async () => {
      try {
        setIsGenerating(true);

        const options: SupabaseQueryOptions = {
          select:
            "id,name,description,price,least_price,image_url,meal_type,category_id,is_available,spice_level,dietary_type,dish_type,cuisine",
          order: "price.asc",
        };

        const rows = await supabase.select<{
          id: string;
          name: string;
          description?: string | null;
          price?: string | number | null;
          least_price?: string | number | null;
          image_url?: string | null;
          meal_type?: string[] | string | null;
          category_id?: string | null;
          is_available?: boolean | null;
          spice_level?: string | null;
          dietary_type?: string | null;
          dish_type?: string | null;
          cuisine?: string | null;
        }>("dishes", options);

        const normalizeMealType = (value: string[] | string | null | undefined): string[] => {
          if (Array.isArray(value)) return value;
          if (typeof value === "string" && value.length > 0) {
            return value
              .replace(/[{}]/g, "")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean);
          }
          return [];
        };

        const allDishes: Dish[] = rows.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description ?? "",
          price: row.price != null ? String(row.price) : "0",
          imageUrl: row.image_url ?? "",
          mealType: normalizeMealType(row.meal_type),
          categoryId: row.category_id ?? null,
          categoryName: formatCategoryName(row.category_id),
          spiceLevel: row.spice_level ?? null,
          dietaryType: row.dietary_type ?? null,
          dishType: row.dish_type ?? null,
          cuisine: row.cuisine ?? null,
          isAvailable: row.is_available ?? true,
          recommendedCategory: undefined,
        }));

        const categoryIds = Array.from(
          new Set(
            allDishes
              .map((dish) => dish.categoryId)
              .filter((value): value is string => Boolean(value))
          )
        );

        if (categoryIds.length > 0) {
          const categoryRows = await supabase.select<{ id: string; name: string | null }>(
            "categories",
            {
              select: "id,name",
              filter: { id: `in.(${categoryIds.join(",")})` },
            }
          );

          const categoryMap: Record<string, string> = {};
          categoryRows.forEach((row) => {
            categoryMap[row.id] = row.name?.trim() || formatCategoryName(row.id);
          });

          allDishes.forEach((dish) => {
            if (dish.categoryId) {
              dish.categoryName = categoryMap[dish.categoryId] || formatCategoryName(dish.categoryId);
            }
          });
        }

        const matchesMealType = (dish: Dish) => {
          if (!preferences.mealType) return true;

          const preference = preferences.mealType.toLowerCase();
          const preferenceAliases: Record<string, string[]> = {
            breakfast: ["breakfast", "tiffins"],
            lunch: ["lunch", "lunch-dinner", "lunch & dinner", "main course"],
            dinner: ["dinner", "lunch-dinner", "lunch & dinner", "main course"],
            snacks: ["snacks", "quick bites", "appetizers"],
          };

          const allowedValues = preferenceAliases[preference] || [preference];

          return dish.mealType.some((type) => {
            const normalizedType = type.toLowerCase();
            return allowedValues.some((allowed) =>
              normalizedType.includes(allowed)
            );
          });
        };

        const matchesCuisine = (dish: Dish) => {
          if (!preferences.cuisinePreferences || preferences.cuisinePreferences.length === 0) {
            return true;
          }
          const dishCuisine = dish.cuisine?.toLowerCase() ?? "";
          return preferences.cuisinePreferences.some((pref: string) =>
            dishCuisine.includes(pref.toLowerCase())
          );
        };

        const matchesDietary = (dish: Dish) => {
          const pref = preferences.dietaryPreference;
          if (!pref || pref === "all") return true;
          const dishType = dish.dietaryType?.toLowerCase() ?? "";
          if (pref === "veg") return dishType === "veg";
          if (pref === "non-veg") return dishType === "non-veg";
          if (pref === "egg") return dishType === "egg";
          return true;
        };

        const filtered = allDishes
          .filter((dish) => dish.isAvailable !== false)
          .filter(matchesMealType)
          .filter(matchesCuisine)
          .filter(matchesDietary);

        const MAX_RECOMMENDATIONS = 12;
        const selection: Dish[] = [];
        let runningTotal = 0;

        const sorted = filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

        for (const dish of sorted) {
          const price = parseFloat(dish.price || "0");
          if (Number.isNaN(price)) continue;

          if (preferences.budget && runningTotal + price > preferences.budget && selection.length >= 6) {
            continue;
          }

          selection.push({
            ...dish,
            recommendedCategory: dish.dishType ?? dish.categoryName ?? undefined,
          });
          runningTotal += price;

          if (selection.length >= MAX_RECOMMENDATIONS) {
            break;
          }
        }

        const chosen = selection.length > 0 ? selection : sorted.slice(0, Math.min(6, sorted.length));

        const categoryGroups = chosen.reduce<Record<string, Dish[]>>((acc, dish) => {
          const key = dish.categoryName || dish.recommendedCategory || "Chef's Picks";
          if (!acc[key]) acc[key] = [];
          acc[key].push(dish);
          return acc;
        }, {});

        const totalEstimatedCost = chosen.reduce((sum, dish) => {
          const price = parseFloat(dish.price || "0");
          return sum + (Number.isFinite(price) ? price : 0);
        }, 0);

        const estimatedCostPerPerson = totalEstimatedCost / Math.max(1, preferences.numberOfPax || 1);

        let budgetStatus: RecommendationResponse["budgetStatus"] = null;
        let aiBudgetNote: RecommendationResponse["aiBudgetNote"] = null;

        if (preferences.budget) {
          if (totalEstimatedCost <= preferences.budget) {
            budgetStatus = "within_budget";
            aiBudgetNote = "This menu stays within your stated budget.";
          } else {
            budgetStatus = "over_budget";
            aiBudgetNote = "This selection exceeds your stated budget. Consider removing a premium dish.";
          }
        }

        const cuisineSummary = preferences.cuisinePreferences?.length
          ? preferences.cuisinePreferences.join(", ")
          : "a variety of cuisines";

        const highlightCategories = Object.entries(categoryGroups)
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 3)
          .map(([categoryName, dishes]) => {
            const highlights = dishes
              .slice(0, 2)
              .map((dish) => dish.name)
              .join(" and ");
            return `${categoryName.toLowerCase()} such as ${highlights}`;
          });

        const highlightSentence = highlightCategories.length
          ? `Highlights include ${highlightCategories.join(", ")}.`
          : "Highlights include chef-curated favourites that balance flavours across the menu.";

        const aiSummary = `I've curated ${chosen.length} dishes perfect for your ${
          preferences.eventType || "celebration"
        }, celebrating ${cuisineSummary.toLowerCase()} traditions with ${
          preferences.dietaryPreference || "mixed"
        } options. ${highlightSentence}`;

        const recommendationPayload: RecommendationResponse = {
          sessionId: typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `supabase-${Math.random().toString(36).slice(2)}`,
          recommendations: chosen,
          totalEstimatedCost,
          estimatedCostPerPerson,
          preferences: {
            cuisinePreference: cuisineSummary,
            numberOfPax: preferences.numberOfPax,
            eventType: preferences.eventType,
            budget: preferences.budget,
            mealType: preferences.mealType,
            spiceLevel: preferences.dietaryPreference,
          },
          aiSummary,
          budgetStatus,
          aiBudgetNote,
        };

        setRecommendations(recommendationPayload);
      } catch (error: any) {
        console.error("[Supabase] concierge recommendations failed", error);
        toast({
          title: "Error",
          description: error.message || "Failed to generate recommendations",
          variant: "destructive",
        });
        setLocation("/concierge");
      } finally {
        setIsGenerating(false);
      }
    };

    generateRecommendations();
  }, []);

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (dishId: string) => {
      return apiRequest("POST", "/api/cart", { dishId, quantity: 1 });
    },
    onSuccess: (_, dishId) => {
      setAddedItems(prev => new Set(prev).add(dishId));
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: "Item has been added to your platter",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (dishId: string) => {
    addToCartMutation.mutate(dishId);
  };

  const handleAddAllToCart = () => {
    if (!recommendations) return;
    recommendations.recommendations.forEach(dish => {
      if (!addedItems.has(dish.id)) {
        addToCartMutation.mutate(dish.id);
      }
    });
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <Card className="text-center py-16">
            <CardContent>
              <Sparkles className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
              <h2 className="text-2xl font-bold mb-2">Creating Your Perfect Menu</h2>
              <p className="text-muted-foreground mb-6">
                Our AI is analyzing your preferences and selecting the best dishes...
              </p>
              <div className="flex justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return null;
  }

  // Group dishes by the category name provided by webhook
  const groupedDishes = recommendations.recommendations.reduce((acc, dish: Dish) => {
    const categoryName = dish.categoryName || dish.recommendedCategory || dish.dishType || 'Chef\'s Picks';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(dish);
    return acc;
  }, {} as Record<string, Dish[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/concierge")}
            className="mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Start Over
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold" data-testid="text-title">Your Personalized Menu</h1>
              <p className="text-muted-foreground">
                AI-curated recommendations for your {preferences.eventType}
              </p>
              <p className="text-xs text-muted-foreground mt-1" data-testid="text-session-id">
                Session ID: <span className="font-mono">{recommendations.sessionId}</span>
              </p>
            </div>
          </div>

          {/* AI Summary */}
          {recommendations.aiSummary && (
            <Card className="mb-6 bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">AI Recommendation Summary</h3>
                    <p className="text-muted-foreground leading-relaxed" data-testid="text-ai-summary">
                      {recommendations.aiSummary}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Guests</p>
                  <p className="text-2xl font-bold" data-testid="text-guests">{preferences.numberOfPax}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Dishes Selected</p>
                  <p className="text-2xl font-bold" data-testid="text-dish-count">{recommendations.recommendations.length}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Total</p>
                  <p className="text-2xl font-bold" data-testid="text-total-cost">
                    ₹{recommendations.totalEstimatedCost.toLocaleString()}
                  </p>
                  {preferences.budget && (
                    <p className="text-xs mt-1" data-testid="text-per-person">
                      ₹{Math.round(recommendations.estimatedCostPerPerson)}/person
                      {recommendations.budgetStatus === "within_budget" && (
                        <span className="text-green-600 ml-2">✓ Within budget</span>
                      )}
                      {recommendations.budgetStatus === "over_budget" && (
                        <span className="text-orange-600 ml-2">Premium option</span>
                      )}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Note from AI */}
          {recommendations.aiBudgetNote && (
            <Card className="mb-6 border-orange-200 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Budget Note</h4>
                    <p className="text-sm text-muted-foreground" data-testid="text-budget-note">
                      {recommendations.aiBudgetNote}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              size="lg"
              onClick={handleAddAllToCart}
              disabled={addToCartMutation.isPending}
              data-testid="button-add-all"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add All to Cart
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/tiffins")}
              data-testid="button-browse-menu"
            >
              Browse Full Menu
            </Button>
          </div>
        </div>

        {/* Recommended Dishes */}
        <div className="space-y-8">
          {Object.entries(groupedDishes).map(([category, dishes]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Badge variant="secondary">{category}</Badge>
                <span className="text-sm text-muted-foreground">({dishes.length} items)</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dishes.map((dish) => {
                  const isAdded = addedItems.has(dish.id);
                  
                  return (
                    <Card key={dish.id} className="hover-elevate" data-testid={`card-dish-${dish.id}`}>
                      <CardHeader className="p-0">
                        <img
                          src={getSupabaseImageUrl(dish.imageUrl)}
                          alt={dish.name}
                          className="w-full h-40 object-cover rounded-t-lg"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder.jpg';
                          }}
                        />
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <CardTitle className="text-lg" data-testid="text-dish-name">{dish.name}</CardTitle>
                          <Badge variant="outline" className="ml-2">
                            ₹{parseFloat(dish.price).toFixed(0)}
                          </Badge>
                        </div>
                        
                        <CardDescription className="text-sm line-clamp-2 mb-3">
                          {dish.description}
                        </CardDescription>
                        
                        <div className="flex gap-2 flex-wrap mb-3">
                          {dish.dietaryType && (
                            <Badge variant="secondary" className="text-xs">
                              {dish.dietaryType}
                            </Badge>
                          )}
                          {dish.spiceLevel && (
                            <Badge variant="secondary" className="text-xs">
                              {dish.spiceLevel}
                            </Badge>
                          )}
                        </div>
                        
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => handleAddToCart(dish.id)}
                          disabled={isAdded || addToCartMutation.isPending}
                          variant={isAdded ? "secondary" : "default"}
                          data-testid={`button-add-${dish.id}`}
                        >
                          {isAdded ? (
                            <>✓ Added</>
                          ) : addToCartMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Add to Cart
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Action */}
        <div className="mt-8 text-center">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Ready to Order?</h3>
            <p className="text-muted-foreground mb-4">
              Add your selected items to the cart and proceed to checkout
            </p>
            <div className="flex justify-center gap-3">
              <Button
                size="lg"
                onClick={() => setLocation("/tiffins")}
                variant="outline"
                data-testid="button-view-cart"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Cart
              </Button>
              <Button
                size="lg"
                onClick={handleAddAllToCart}
                disabled={addToCartMutation.isPending}
                data-testid="button-add-all-bottom"
              >
                Add All & Continue
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
