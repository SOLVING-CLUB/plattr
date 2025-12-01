import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ShoppingCart, ArrowLeft, Loader2, TrendingUp, Users, DollarSign } from "lucide-react";
import { getSupabaseImageUrl } from "@/lib/supabase";

interface Dish {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  mealType: string[];
  categoryId: string | null;
  spiceLevel: string | null;
  dietaryType: string | null;
  dishType: string | null;
  recommendedCategory?: string;
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
        const response = await fetch("/api/concierge/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preferences),
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to generate recommendations");
        }

        const data: RecommendationResponse = await response.json();
        setRecommendations(data);
      } catch (error: any) {
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
  const groupedDishes = recommendations.recommendations.reduce((acc, dish: any) => {
    // Use recommendedCategory if available (from webhook), otherwise fall back to dishType
    const categoryName = dish.recommendedCategory || dish.dishType || 'Other';
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
            <Card className="mb-6 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900">
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
