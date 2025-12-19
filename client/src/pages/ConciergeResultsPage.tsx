import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ShoppingCart, ArrowLeft, Loader2, TrendingUp, Users, DollarSign, Leaf, Drumstick, Plus, Minus, Package, Utensils, RefreshCw } from "lucide-react";
import { getSupabaseImageUrl } from "@/lib/supabase";
import { supabase } from "@/lib/supabase-client";
import FloatingNav from "@/pages/FloatingNav";
import { LazyImage } from "@/components/ui/lazy-image";
import { useCart } from "@/context/CartContex";
import { analytics } from "@/lib/analytics";

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

// Generate a unique request key based on URL parameters
const getRequestKey = () => {
  const params = window.location.search;
  return `concierge-request-${btoa(params).slice(0, 50)}`;
};

export default function ConciergeResultsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(true);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Order mode: "bulkMeal" or "mealbox"
  const [orderMode, setOrderMode] = useState<"bulkMeal" | "mealbox">("bulkMeal");
  
  // Bulk Meal mode: quantity per dish
  const [dishQuantities, setDishQuantities] = useState<Record<string, number>>({});
  
  // MealBox mode: portion counts for veg, egg, and non-veg plates (minimum 5 when selected)
  const [vegPortions, setVegPortions] = useState(5);
  const [eggPortions, setEggPortions] = useState(0);
  const [nonVegPortions, setNonVegPortions] = useState(0);
  
  // MealBox portion size (3, 5, 6, 8 items per plate)
  const [mealboxPortionSize, setMealboxPortionSize] = useState<number>(5);
  const PORTION_OPTIONS = [3, 5, 6, 8];
  
  // MealBox dish selection - store selected dish IDs and data for each plate type
  const [currentDietaryTab, setCurrentDietaryTab] = useState<"veg" | "egg" | "non-veg">("veg");
  const [vegPlateSelections, setVegPlateSelections] = useState<Array<{ dishId: string; dish: Dish }>>([]);
  const [eggPlateSelections, setEggPlateSelections] = useState<Array<{ dishId: string; dish: Dish }>>([]);
  const [nonVegPlateSelections, setNonVegPlateSelections] = useState<Array<{ dishId: string; dish: Dish }>>([]);
  
  // Use cart context for bulk meals and mealbox progress
  const { cart, addToCart, getQuantity, clearCart, saveMealBoxProgress } = useCart();

  // Parse preferences from URL
  const searchParams = new URLSearchParams(window.location.search);
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

  // Retry function - clear session storage and trigger retry
  const handleRetry = () => {
    const requestKey = getRequestKey();
    sessionStorage.removeItem(requestKey);
    sessionStorage.removeItem(`${requestKey}-data`);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setError(null);
    setRetryCount(prev => prev + 1);
  };

  // Generate recommendations on mount by calling n8n webhook
  useEffect(() => {
    const requestKey = getRequestKey();
    
    const generateRecommendations = async (signal: AbortSignal) => {
      // Check sessionStorage for existing request or cached data
      const requestStatus = sessionStorage.getItem(requestKey);
      const cachedData = sessionStorage.getItem(`${requestKey}-data`);
      
      // If we have cached data, use it immediately
      if (cachedData && requestStatus === 'completed') {
        console.log('[Concierge] Using cached recommendations');
        try {
          const parsed = JSON.parse(cachedData);
          setRecommendations(parsed);
          setIsGenerating(false);
          return;
        } catch (e) {
          console.error('[Concierge] Failed to parse cached data, refetching');
          sessionStorage.removeItem(requestKey);
          sessionStorage.removeItem(`${requestKey}-data`);
        }
      }
      
      // If a request is already in progress, just wait
      if (requestStatus === 'pending') {
        console.log('[Concierge] Request already in progress, waiting...');
        return;
      }
      
      // Mark request as pending in sessionStorage
      sessionStorage.setItem(requestKey, 'pending');
      console.log('[Concierge] Starting new request');
      
      // Track start time for response time calculation
      const startTime = Date.now();
      
      try {
        setIsGenerating(true);
        setError(null);
        
        // Re-parse preferences inside useEffect to get the latest URL params
        const currentSearchParams = new URLSearchParams(window.location.search);
        const currentCuisineParam = currentSearchParams.get('cuisinePreferences');
        const currentCategoryCountsParam = currentSearchParams.get('categoryCounts');
        
        const currentPrefs = {
          cuisinePreferences: currentCuisineParam ? JSON.parse(currentCuisineParam) : [],
          numberOfPax: parseInt(currentSearchParams.get('numberOfPax') || '50'),
          eventType: currentSearchParams.get('eventType') || '',
          budget: currentSearchParams.get('budget') ? parseFloat(currentSearchParams.get('budget')!) : undefined,
          mealType: currentSearchParams.get('mealType') || 'lunch',
          dietaryPreference: currentSearchParams.get('dietaryPreference') || undefined,
          allergies: currentSearchParams.get('allergies') || undefined,
          categoryCounts: currentCategoryCountsParam ? JSON.parse(currentCategoryCountsParam) : [],
        };
        
        // Validate that we have required preferences - redirect to wizard if missing
        if (!currentPrefs.eventType || currentPrefs.cuisinePreferences.length === 0) {
          sessionStorage.removeItem(requestKey);
          toast({
            title: "Please complete the wizard",
            description: "We need your preferences to generate recommendations",
          });
          setLocation("/concierge");
          return;
        }
        
        // Generate a unique session ID for n8n tracking
        const sessionId = `plattr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Track AI planner initiated
        analytics.trackAIPlannerInitiated(
          currentPrefs.numberOfPax,
          currentPrefs.eventType,
          currentPrefs.budget ? `₹${currentPrefs.budget}` : undefined
        ).catch(() => {});
        
        // Calculate per-plate budget
        const perPlateBudget = currentPrefs.budget && currentPrefs.numberOfPax > 0 
          ? Math.round(currentPrefs.budget / currentPrefs.numberOfPax) 
          : undefined;
        
        // Build request body with the freshly parsed preferences
        const requestBody = {
          sessionId: sessionId,
          cuisinePreferences: currentPrefs.cuisinePreferences,
          numberOfPax: currentPrefs.numberOfPax,
          eventType: currentPrefs.eventType,
          budget: currentPrefs.budget,
          budgetPerPlate: perPlateBudget,
          mealType: currentPrefs.mealType,
          dietaryPreference: currentPrefs.dietaryPreference,
          allergies: currentPrefs.allergies,
          categoryCounts: currentPrefs.categoryCounts,
        };
        
        // Call the n8n webhook with user preferences
        console.log('[Concierge] Sending webhook request with session:', sessionId);
        const webhookResponse = await fetch('https://navaneeth03.app.n8n.cloud/webhook/smart-plattr-concierge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal, // Use AbortController signal
        });
        
        if (!webhookResponse.ok) {
          throw new Error(`Failed to get recommendations from AI (Status: ${webhookResponse.status})`);
        }
        
        // Get the raw text first to check if it's valid
        const rawText = await webhookResponse.text();
        console.log('Webhook raw response:', rawText);
        
        // Check if response is empty
        if (!rawText || rawText.trim() === '') {
          throw new Error('The AI service returned an empty response. Please check your n8n workflow - make sure it has a "Respond to Webhook" node that returns JSON data.');
        }
        
        // Try to parse the JSON
        let webhookData;
        try {
          webhookData = JSON.parse(rawText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error(`The AI service returned invalid JSON: "${rawText.substring(0, 100)}...". Please check your n8n workflow output.`);
        }
        
        console.log('Webhook parsed response:', webhookData);
        
        // Extract dish IDs from webhook response
        // The webhook may return data in various formats - handle common patterns
        let dishIds: string[] = [];
        let categoryMap: Record<string, string> = {}; // Map dish ID to category name
        let aiSummary: string | null = null;
        let budgetNote: string | null = null;
        let budgetStatusFromWebhook: string | null = null;
        
        // Check if response has an "output" field with embedded JSON (n8n AI response format)
        let parsedData = webhookData;
        if (webhookData.output && typeof webhookData.output === 'string') {
          console.log('Detected n8n output format, extracting JSON...');
          const outputText = webhookData.output;
          
          // Extract JSON from markdown code blocks
          const jsonMatch = outputText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              parsedData = JSON.parse(jsonMatch[1]);
              console.log('Extracted JSON from output:', parsedData);
            } catch (e) {
              console.error('Failed to parse embedded JSON:', e);
            }
          }
          
          // Also extract the text before the JSON as the summary
          const textBeforeJson = outputText.split('```json')[0].trim();
          if (textBeforeJson) {
            aiSummary = textBeforeJson;
          }
        }
        
        // Now extract dish IDs from the parsed data
        if (parsedData.dishIds) {
          dishIds = Array.isArray(parsedData.dishIds) ? parsedData.dishIds : [parsedData.dishIds];
        } else if (parsedData.dishes) {
          dishIds = Array.isArray(parsedData.dishes) 
            ? parsedData.dishes.map((d: any) => typeof d === 'string' ? d : d.id || d.dishId)
            : [];
        } else if (parsedData.recommendations) {
          const recs = Array.isArray(parsedData.recommendations) ? parsedData.recommendations : [];
          dishIds = recs.map((d: any) => typeof d === 'string' ? d : d.id || d.dishId);
          // Build category map from recommendations
          recs.forEach((d: any) => {
            if (d.id && d.categoryName) {
              categoryMap[d.id] = d.categoryName;
            }
          });
        } else if (Array.isArray(parsedData)) {
          dishIds = parsedData.map((d: any) => typeof d === 'string' ? d : d.id || d.dishId);
        }
        
        console.log('Extracted dish IDs:', dishIds);
        console.log('Category map:', categoryMap);
        
        // Extract summary and budget info
        if (parsedData.overallSummary) {
          aiSummary = parsedData.overallSummary;
        } else if (parsedData.summary || parsedData.aiSummary) {
          aiSummary = parsedData.summary || parsedData.aiSummary;
        }
        if (parsedData.budgetNote || parsedData.aiBudgetNote) {
          budgetNote = parsedData.budgetNote || parsedData.aiBudgetNote;
        }
        if (parsedData.budgetStatus) {
          budgetStatusFromWebhook = parsedData.budgetStatus;
        }
        
        // Fetch dish details from Supabase using the IDs
        // Use PostgREST 'in' operator to only fetch the dishes we need
        let selectedDishes: any[] = [];
        
        if (dishIds.length > 0) {
          try {
            console.log('Fetching dishes from Supabase for IDs:', dishIds);
            
            // Build the 'in' filter for id column (format: D-0001, D-0002, etc.)
            // PostgREST requires string values to be double-quoted
            const quotedIds = dishIds.map((id: string) => `"${id}"`).join(',');
            const inFilter = `in.(${quotedIds})`;
            
            console.log('Supabase filter:', inFilter);
            
            // Query by 'id' column which contains the dish IDs like D-0002, D-0003, etc.
            const dishesResult = await supabase.select<any>('dishes', {
              select: '*',
              filter: { 'id': inFilter },
            });
            
            console.log('Dishes fetched from Supabase:', dishesResult?.length || 0);
            
            if (dishesResult && dishesResult.length > 0) {
              selectedDishes = dishesResult;
            }
          } catch (supabaseError: any) {
            console.error('Supabase query error:', supabaseError);
            toast({
              title: "Error loading dishes",
              description: "Could not fetch dish details. Please try again.",
              variant: "destructive",
            });
          }
        }
        
        console.log('Selected dishes count:', selectedDishes.length);
        
        // Calculate costs
        const totalCost = selectedDishes.reduce((sum: number, d: any) => sum + (parseFloat(d.price) || 0) * preferences.numberOfPax, 0);
        const costPerPerson = preferences.numberOfPax > 0 ? totalCost / preferences.numberOfPax : 0;
        
        // Format dishes for response
        const formattedDishes: Dish[] = selectedDishes.map((d: any) => ({
          id: d.id,
          name: d.name,
          description: d.description || '',
          price: String(d.price || 0),
          imageUrl: d.image_url || '',
          mealType: d.meal_type || [],
          categoryId: d.category_id,
          spiceLevel: d.spice_level,
          dietaryType: d.dietary_type,
          dishType: d.dish_type,
          // Use category from webhook's categoryMap if available, otherwise use dish_type
          recommendedCategory: categoryMap[d.dish_id] || categoryMap[d.id] || d.dish_type || 'Other',
        }));
        
        console.log('Formatted dishes:', formattedDishes);
        
        // Determine budget status - use webhook value if provided, otherwise calculate
        let budgetStatus: "within_budget" | "over_budget" | null = null;
        if (budgetStatusFromWebhook) {
          budgetStatus = budgetStatusFromWebhook === 'within_budget' ? 'within_budget' : 'over_budget';
        } else if (preferences.budget) {
          const budgetPerPerson = preferences.budget;
          budgetStatus = costPerPerson <= budgetPerPerson ? "within_budget" : "over_budget";
        }
        
        const data: RecommendationResponse = {
          sessionId: webhookData.sessionId || `session-${Date.now()}`,
          recommendations: formattedDishes,
          totalEstimatedCost: totalCost,
          estimatedCostPerPerson: costPerPerson,
          preferences: {
            cuisinePreference: preferences.cuisinePreferences.join(', '),
            numberOfPax: preferences.numberOfPax,
            eventType: preferences.eventType,
            budget: preferences.budget,
            mealType: preferences.mealType,
          },
          aiSummary: aiSummary || `Based on your preferences for a ${preferences.eventType} event with ${preferences.numberOfPax} guests, we've curated ${formattedDishes.length} personalized dishes.`,
          budgetStatus,
          aiBudgetNote: budgetNote,
        };
        
        // Cache the result in sessionStorage
        sessionStorage.setItem(requestKey, 'completed');
        sessionStorage.setItem(`${requestKey}-data`, JSON.stringify(data));
        // Save current URL so wizard can redirect back here
        sessionStorage.setItem('concierge-results-url', window.location.pathname + window.location.search);
        console.log('[Concierge] Request completed and cached');
        
        // Track AI planner suggestion received
        const responseTime = Date.now() - startTime;
        analytics.trackAIPlannerSuggestionReceived(
          preferences.numberOfPax,
          formattedDishes.length,
          responseTime
        ).catch(() => {});
        
        setRecommendations(data);
      } catch (error: any) {
        // Ignore abort errors - these are intentional
        if (error.name === 'AbortError') {
          console.log('[Concierge] Request was aborted');
          return;
        }
        
        // Clear the pending status on error so retry can work
        sessionStorage.removeItem(requestKey);
        
        console.error('Recommendation error:', error);
        
        // Determine error type and message
        let errorMessage = "Failed to generate recommendations";
        
        if (error instanceof TypeError) {
          errorMessage = "Unable to connect to the AI service. Please check your internet connection and try again.";
        } else if (error.name === 'TypeError' || error.message === 'Load failed' || error.message === 'Failed to fetch') {
          errorMessage = "Unable to connect to the AI service. Please check your internet connection and try again.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // Track AI planner failure
        analytics.trackAIPlannerSuggestionFailed(
          preferences.numberOfPax,
          errorMessage,
          retryCount
        ).catch(() => {});
        
        console.error('Error details:', { 
          name: error?.name, 
          message: error?.message, 
          type: typeof error,
          isTypeError: error instanceof TypeError 
        });
        
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsGenerating(false);
      }
    };

    // Create AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    // Start the request
    generateRecommendations(controller.signal);
    
    // Cleanup: abort request if component unmounts - DON'T reset sessionStorage status
    // because we want to track that a request is still pending even across remounts
    return () => {
      console.log('[Concierge] Cleanup: aborting pending request');
      controller.abort();
    };
  }, [retryCount]);

  const handleAddAllToCart = () => {
    if (!recommendations || isAddingToCart) return;
    
    setIsAddingToCart(true);
    let addedCount = 0;
    
    try {
      recommendations.recommendations.forEach(dish => {
        if (!addedItems.has(dish.id)) {
          const quantity = dishQuantities[dish.id] ?? 5; // Default to 5 per dish
          if (quantity > 0) {
            const numericId = parseInt(dish.id.replace(/\D/g, '')) || Date.now() + addedCount;
            addToCart("bulk-meals", {
              id: numericId,
              name: dish.name,
              price: parseFloat(dish.price),
              quantity: quantity,
            });
            setAddedItems(prev => new Set(prev).add(dish.id));
            addedCount++;
          }
        }
      });
      
      if (addedCount > 0) {
        toast({
          title: "Added to cart",
          description: `${addedCount} dishes added to your bulk meal cart`,
        });
        // Navigate to bulk meals cart
        setLocation("/bulk-meals-cart");
      }
    } finally {
      setIsAddingToCart(false);
    }
  };
  
  // Bulk Meal mode: update dish quantity
  const handleBulkQuantityChange = (dishId: string, change: number) => {
    setDishQuantities(prev => {
      const current = prev[dishId] ?? 5; // Default to 5 if not set
      const newQty = Math.max(1, current + change); // Minimum 1
      return { ...prev, [dishId]: newQty };
    });
  };
  
  // Bulk Meal mode: set dish quantity directly (for typing)
  const handleBulkQuantitySet = (dishId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setDishQuantities(prev => ({
      ...prev,
      [dishId]: Math.max(0, numValue)
    }));
  };
  
  // Bulk Meal mode: add dish to bulk cart
  const handleAddToBulkCart = (dish: Dish, quantity: number) => {
    if (quantity <= 0) return;
    
    const numericId = parseInt(dish.id.replace(/\D/g, '')) || Date.now();
    addToCart("bulk-meals", {
      id: numericId,
      name: dish.name,
      price: parseFloat(dish.price),
      quantity: quantity,
    });
    
    setAddedItems(prev => new Set(prev).add(dish.id));
    setDishQuantities(prev => {
      const { [dish.id]: _, ...rest } = prev;
      return rest;
    });
    
    toast({
      title: "Added to cart",
      description: `${quantity}x ${dish.name} added to your bulk meal cart`,
    });
  };
  
  // Calculate total items in bulk cart
  const bulkCartTotal = cart.reduce((sum, item) => sum + item.quantity, 0);
  const bulkCartValue = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // MealBox mode: add dish to plate selection
  const handleAddToPlate = (dish: Dish) => {
    const dietaryType = dish.dietaryType?.toLowerCase() || 'veg';
    
    // Determine which plate this dish goes to based on current tab
    // Veg dishes can go to veg plate only
    // Egg dishes can go to egg or non-veg plates
    // Non-veg dishes can go to non-veg plate only
    const targetTab = currentDietaryTab;
    
    // Get current selections and max allowed
    const getCurrentSelections = () => {
      if (targetTab === "veg") return vegPlateSelections;
      if (targetTab === "egg") return eggPlateSelections;
      return nonVegPlateSelections;
    };
    
    const getMaxItems = () => {
      if (targetTab === "veg") return mealboxPortionSize;
      if (targetTab === "egg") return mealboxPortionSize;
      return mealboxPortionSize;
    };
    
    const currentSelections = getCurrentSelections();
    const maxItems = getMaxItems();
    
    // Check if dish already selected for this plate type
    if (currentSelections.some(sel => sel.dishId === dish.id)) {
      // Remove it
      if (targetTab === "veg") {
        setVegPlateSelections(prev => prev.filter(sel => sel.dishId !== dish.id));
      } else if (targetTab === "egg") {
        setEggPlateSelections(prev => prev.filter(sel => sel.dishId !== dish.id));
      } else {
        setNonVegPlateSelections(prev => prev.filter(sel => sel.dishId !== dish.id));
      }
      return;
    }
    
    // Check if at max capacity
    if (currentSelections.length >= maxItems) {
      toast({
        title: "Plate is full",
        description: `You can only select ${maxItems} items per ${targetTab} plate`,
        variant: "destructive",
      });
      return;
    }
    
    // Add to selections
    const newSelection = { dishId: dish.id, dish };
    if (targetTab === "veg") {
      setVegPlateSelections(prev => [...prev, newSelection]);
    } else if (targetTab === "egg") {
      setEggPlateSelections(prev => [...prev, newSelection]);
    } else {
      setNonVegPlateSelections(prev => [...prev, newSelection]);
    }
    
    toast({
      title: "Added to plate",
      description: `${dish.name} added to ${targetTab} plate (${currentSelections.length + 1}/${maxItems})`,
    });
  };
  
  // Check if dish is selected for current plate
  const isDishSelectedForPlate = (dishId: string) => {
    if (currentDietaryTab === "veg") return vegPlateSelections.some(sel => sel.dishId === dishId);
    if (currentDietaryTab === "egg") return eggPlateSelections.some(sel => sel.dishId === dishId);
    return nonVegPlateSelections.some(sel => sel.dishId === dishId);
  };
  
  // Get dietary types allowed for current tab
  const getAllowedDietaryTypes = () => {
    if (currentDietaryTab === "veg") return ["veg"];
    if (currentDietaryTab === "egg") return ["veg", "egg"];
    return ["veg", "egg", "non-veg"];
  };
  
  // Filter dishes by dietary type for current tab
  const getFilteredDishesForTab = () => {
    if (!recommendations) return [];
    const allowedTypes = getAllowedDietaryTypes();
    return recommendations.recommendations.filter(dish => {
      const dtype = dish.dietaryType?.toLowerCase() || 'veg';
      return allowedTypes.includes(dtype);
    });
  };
  
  // Calculate if all required plates are filled
  const getPlateProgress = () => {
    const vegProgress = vegPortions > 0 ? { current: vegPlateSelections.length, required: mealboxPortionSize } : null;
    const eggProgress = eggPortions > 0 ? { current: eggPlateSelections.length, required: mealboxPortionSize } : null;
    const nonVegProgress = nonVegPortions > 0 ? { current: nonVegPlateSelections.length, required: mealboxPortionSize } : null;
    
    const allFilled = 
      (!vegProgress || vegProgress.current >= vegProgress.required) &&
      (!eggProgress || eggProgress.current >= eggProgress.required) &&
      (!nonVegProgress || nonVegProgress.current >= nonVegProgress.required);
    
    return { vegProgress, eggProgress, nonVegProgress, allFilled };
  };
  
  // Handle proceed to MealBox checkout
  const handleProceedToMealbox = () => {
    // Save progress to mealBoxProgress context so MealBoxPage can resume
    const mealTypeMap: Record<string, "breakfast" | "lunch" | "dinner" | "hi-tea"> = {
      breakfast: "breakfast",
      lunch: "lunch",
      dinner: "dinner",
      snacks: "hi-tea",
    };
    
    // Convert selections to MealBoxPage format
    const formatSelections = (selections: Array<{ dishId: string; dish: Dish }>) => {
      return selections.map((sel, idx) => ({
        slot: idx,
        itemId: sel.dishId,
        item: {
          id: sel.dishId,
          name: sel.dish.name,
          price: parseFloat(sel.dish.price),
          image: sel.dish.imageUrl,
          type: (sel.dish.dietaryType?.toLowerCase() || 'veg') as string,
          rating: 4.5,
          reviewCount: 0,
          category: sel.dish.recommendedCategory || "main",
        },
      }));
    };
    
    saveMealBoxProgress({
      currentStep: 5, // Jump to item review step
      selectedPortions: mealboxPortionSize as 3 | 5 | 6 | 8,
      mealPreference: currentDietaryTab,
      selectedMealType: mealTypeMap[preferences.mealType] || "lunch",
      vegBoxes: vegPortions > 0 ? String(vegPortions) : "",
      eggBoxes: eggPortions > 0 ? String(eggPortions) : "",
      nonVegBoxes: nonVegPortions > 0 ? String(nonVegPortions) : "",
      vegPlateSelections: formatSelections(vegPlateSelections),
      eggPlateSelections: formatSelections(eggPlateSelections),
      nonVegPlateSelections: formatSelections(nonVegPlateSelections),
      selectedAddons: [],
      currentDietaryTab,
    });
    
    // Navigate to MealBox page
    setLocation("/mealbox");
  };

  // Fun food facts to cycle through while loading
  const foodFacts = [
    "Did you know? Indian cuisine has over 30 distinct regional cooking styles!",
    "A typical South Indian meal has 6 different tastes: sweet, sour, salty, bitter, pungent, and astringent.",
    "The word 'curry' comes from 'kari', a Tamil word meaning sauce.",
    "Biryani originated in Persia and evolved in India over 400 years ago.",
    "India is the world's largest producer of spices, growing over 50 varieties.",
    "A traditional thali can have anywhere from 6 to 36 different dishes!",
    "Masala chai became popular in India only in the 1900s when the British started tea cultivation.",
    "The dosa has been around for over 2000 years, mentioned in ancient Tamil literature.",
  ];

  // State for cycling through facts
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [progressStep, setProgressStep] = useState(0);

  // Effect to cycle facts and progress
  useEffect(() => {
    if (!isGenerating) return;
    
    const factInterval = setInterval(() => {
      setCurrentFactIndex(prev => (prev + 1) % foodFacts.length);
    }, 4000);
    
    const progressInterval = setInterval(() => {
      setProgressStep(prev => prev < 3 ? prev + 1 : prev);
    }, 8000);
    
    return () => {
      clearInterval(factInterval);
      clearInterval(progressInterval);
    };
  }, [isGenerating]);

  const progressSteps = [
    "Analyzing your preferences...",
    "Finding the perfect dishes...",
    "Balancing your menu...",
    "Finalizing recommendations..."
  ];

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          {/* Animated sparkles icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <Sparkles className="w-20 h-20 text-primary animate-pulse" />
            <div className="absolute inset-0 animate-ping opacity-30">
              <Sparkles className="w-20 h-20 text-primary" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Creating Your Perfect Menu</h2>
          
          {/* Progress steps */}
          <div className="mb-6">
            <p className="text-primary font-medium mb-3">
              {progressSteps[progressStep]}
            </p>
            <div className="flex justify-center gap-2">
              {progressSteps.map((_, index) => (
                <div 
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${
                    index <= progressStep ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Spinning loader */}
          <div className="flex justify-center mb-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          
          {/* Food facts carousel */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-primary/10">
            <p className="text-xs text-muted-foreground mb-1">Did you know?</p>
            <p className="text-sm text-foreground leading-relaxed transition-opacity duration-500">
              {foodFacts[currentFactIndex].replace("Did you know? ", "")}
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground mt-6">
            This may take up to 30 seconds
          </p>
        </div>
      </div>
    );
  }

  // Show error UI with retry option
  if (error && !recommendations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold mb-2">Something Went Wrong</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRetry}
              className="w-full"
              data-testid="button-retry"
            >
              <Loader2 className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Clear all concierge session data and start fresh
                Object.keys(sessionStorage).forEach(key => {
                  if (key.startsWith('concierge-')) sessionStorage.removeItem(key);
                });
                setLocation("/concierge");
              }}
              className="w-full"
              data-testid="button-start-over"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
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

  const handleNavTabChange = (tab: "home" | "menu" | "profile") => {
    if (tab === "home") setLocation("/");
    else if (tab === "menu") setLocation("/menu");
    else if (tab === "profile") setLocation("/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 pb-24">
      <div className="container max-w-6xl mx-auto pt-12 pb-8 px-4">
        {/* Header - Start Over button with extra top spacing for mobile status bar */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Button
              variant="ghost"
              onClick={() => {
                // Clear all concierge session data and start fresh
                Object.keys(sessionStorage).forEach(key => {
                  if (key.startsWith('concierge-')) sessionStorage.removeItem(key);
                });
                setLocation("/concierge");
              }}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Save current preferences to sessionStorage and navigate back to wizard
                sessionStorage.setItem('concierge-preferences', JSON.stringify(preferences));
                sessionStorage.setItem('concierge-step', '6'); // Go to last step to review
                // Clear results URL so wizard is accessible
                sessionStorage.removeItem('concierge-results-url');
                setLocation("/concierge");
              }}
              data-testid="button-change-preferences"
            >
              Change Preferences
            </Button>
            <Button
              variant="outline"
              onClick={handleRetry}
              disabled={isGenerating}
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold" data-testid="text-title">Your Personalized Menu</h1>
              <p className="text-sm text-muted-foreground">
                AI-curated recommendations for your {preferences.eventType}
              </p>
            </div>
          </div>

          {/* Summary Cards - Horizontal scroll on mobile */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <Card className="flex-shrink-0 min-w-[100px]">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Guests</p>
                <p className="text-lg font-bold" data-testid="text-guests">{preferences.numberOfPax}</p>
              </CardContent>
            </Card>
            
            <Card className="flex-shrink-0 min-w-[100px]">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Dishes</p>
                <p className="text-lg font-bold" data-testid="text-dish-count">{recommendations.recommendations.length}</p>
              </CardContent>
            </Card>
            
            <Card className="flex-shrink-0 min-w-[140px]">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Est. Total</p>
                <p className="text-lg font-bold" data-testid="text-total-cost">
                  ₹{recommendations.totalEstimatedCost.toLocaleString()}
                </p>
                {recommendations.budgetStatus === "within_budget" && (
                  <span className="text-xs text-green-600">✓ Within budget</span>
                )}
              </CardContent>
            </Card>
            
            {/* User Preferences */}
            {preferences.eventType && (
              <Card className="flex-shrink-0 min-w-[120px]">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Event</p>
                  <p className="text-sm font-semibold capitalize">{preferences.eventType.replace(/-/g, ' ')}</p>
                </CardContent>
              </Card>
            )}
            
            {preferences.mealType && (
              <Card className="flex-shrink-0 min-w-[100px]">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Meal</p>
                  <p className="text-sm font-semibold capitalize">{preferences.mealType}</p>
                </CardContent>
              </Card>
            )}
            
            {preferences.dietaryPreference && (
              <Card className="flex-shrink-0 min-w-[100px]">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Diet</p>
                  <p className="text-sm font-semibold capitalize">{preferences.dietaryPreference}</p>
                </CardContent>
              </Card>
            )}
            
            {preferences.cuisinePreferences && preferences.cuisinePreferences.length > 0 && (
              <Card className="flex-shrink-0 min-w-[140px]">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Cuisines</p>
                  <p className="text-sm font-semibold">{preferences.cuisinePreferences.slice(0, 2).join(', ')}{preferences.cuisinePreferences.length > 2 ? ` +${preferences.cuisinePreferences.length - 2}` : ''}</p>
                </CardContent>
              </Card>
            )}
            
            {preferences.budget && (
              <Card className="flex-shrink-0 min-w-[120px]">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="text-sm font-semibold">₹{preferences.budget.toLocaleString()}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Mode Toggle */}
          <div className="mt-4 mb-4">
            <p className="text-sm font-medium mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              How would you like to order?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setOrderMode("bulkMeal")}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all"
                style={{
                  borderColor: orderMode === "bulkMeal" ? "#1A9952" : "#E5E7EB",
                  backgroundColor: orderMode === "bulkMeal" ? "#F0F9F4" : "white",
                }}
                data-testid="button-mode-bulk"
              >
                <Package className="w-5 h-5" style={{ color: "#1A9952" }} />
                <span className="text-sm font-medium" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Bulk Meal
                </span>
              </button>
              <button
                onClick={() => setOrderMode("mealbox")}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all"
                style={{
                  borderColor: orderMode === "mealbox" ? "#1A9952" : "#E5E7EB",
                  backgroundColor: orderMode === "mealbox" ? "#F0F9F4" : "white",
                }}
                data-testid="button-mode-mealbox"
              >
                <Utensils className="w-5 h-5" style={{ color: "#1A9952" }} />
                <span className="text-sm font-medium" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  MealBox
                </span>
              </button>
            </div>
          </div>

          {/* MealBox Mode: Portion Selection */}
          {orderMode === "mealbox" && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <h3 className="text-base font-semibold mb-3" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                Select Number of Items Per Plate
              </h3>
              <p className="text-xs text-gray-500 mb-4" style={{ fontFamily: "Sweet Sans Pro" }}>
                How many items would you like in each meal plate?
              </p>
              
              {/* Portion Size Options */}
              <div className="flex gap-2 mb-4">
                {PORTION_OPTIONS.map((size) => (
                  <button
                    key={size}
                    onClick={() => setMealboxPortionSize(size)}
                    className="flex-1 py-3 px-4 rounded-lg border-2 transition-all text-center"
                    style={{
                      borderColor: mealboxPortionSize === size ? "#1A9952" : "#E5E7EB",
                      backgroundColor: mealboxPortionSize === size ? "#F0F9F4" : "white",
                    }}
                    data-testid={`button-portion-${size}`}
                  >
                    <span className="text-lg font-bold" style={{ color: mealboxPortionSize === size ? "#1A9952" : "#06352A" }}>{size}</span>
                    <p className="text-xs text-gray-500">items</p>
                  </button>
                ))}
              </div>
              
              {/* Plate Type Selection */}
              <div className="space-y-3 mt-4">
                <p className="text-sm font-medium" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Select plate types:
                </p>
                
                {/* Veg Plate */}
                {(preferences.dietaryPreference === 'veg' || preferences.dietaryPreference === 'egg' || preferences.dietaryPreference === 'all' || preferences.dietaryPreference === 'non-veg' || !preferences.dietaryPreference) && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>Veg Plate</p>
                        <p className="text-xs text-gray-500">{mealboxPortionSize} items per plate</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setVegPortions(vegPortions <= 5 ? 0 : vegPortions - 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        data-testid="button-veg-minus"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{vegPortions}</span>
                      <button
                        onClick={() => setVegPortions(vegPortions === 0 ? 5 : vegPortions + 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        data-testid="button-veg-plus"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Egg Plate - Show if egg preference */}
                {(preferences.dietaryPreference === 'egg' || preferences.dietaryPreference === 'all' || !preferences.dietaryPreference) && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">E</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>Egg Plate</p>
                        <p className="text-xs text-gray-500">{mealboxPortionSize} items per plate</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEggPortions(eggPortions <= 5 ? 0 : eggPortions - 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        data-testid="button-egg-minus"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{eggPortions}</span>
                      <button
                        onClick={() => setEggPortions(eggPortions === 0 ? 5 : eggPortions + 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        data-testid="button-egg-plus"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Non-Veg Plate */}
                {(preferences.dietaryPreference === 'non-veg' || preferences.dietaryPreference === 'all' || !preferences.dietaryPreference) && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                        <Drumstick className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>Non-Veg Plate</p>
                        <p className="text-xs text-gray-500">{mealboxPortionSize} items per plate</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setNonVegPortions(nonVegPortions <= 5 ? 0 : nonVegPortions - 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        data-testid="button-nonveg-minus"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{nonVegPortions}</span>
                      <button
                        onClick={() => setNonVegPortions(nonVegPortions === 0 ? 5 : nonVegPortions + 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                        data-testid="button-nonveg-plus"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Dietary Tab Selector - show when any plates selected */}
              {(vegPortions > 0 || nonVegPortions > 0 || eggPortions > 0) && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-medium text-gray-600">Select dishes for each plate type:</p>
                  
                  {/* Progress Summary */}
                  {(() => {
                    const progress = getPlateProgress();
                    return (
                      <div className="flex flex-wrap gap-2">
                        {progress.vegProgress && (
                          <Badge 
                            variant={progress.vegProgress.current >= progress.vegProgress.required ? "default" : "outline"}
                            className={progress.vegProgress.current >= progress.vegProgress.required ? "bg-green-500" : ""}
                          >
                            Veg: {progress.vegProgress.current}/{progress.vegProgress.required}
                          </Badge>
                        )}
                        {progress.eggProgress && (
                          <Badge 
                            variant={progress.eggProgress.current >= progress.eggProgress.required ? "default" : "outline"}
                            className={progress.eggProgress.current >= progress.eggProgress.required ? "bg-amber-500" : ""}
                          >
                            Egg: {progress.eggProgress.current}/{progress.eggProgress.required}
                          </Badge>
                        )}
                        {progress.nonVegProgress && (
                          <Badge 
                            variant={progress.nonVegProgress.current >= progress.nonVegProgress.required ? "default" : "outline"}
                            className={progress.nonVegProgress.current >= progress.nonVegProgress.required ? "bg-red-500" : ""}
                          >
                            Non-Veg: {progress.nonVegProgress.current}/{progress.nonVegProgress.required}
                          </Badge>
                        )}
                      </div>
                    );
                  })()}
                  
                  {/* Dietary Tab Buttons */}
                  <div className="flex gap-2">
                    {vegPortions > 0 && (
                      <button
                        onClick={() => setCurrentDietaryTab("veg")}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          currentDietaryTab === "veg" 
                            ? "bg-green-500 text-white" 
                            : "bg-green-50 text-green-700 border border-green-200"
                        }`}
                        data-testid="tab-veg"
                      >
                        <Leaf className="w-4 h-4 inline mr-1" />
                        Veg ({vegPlateSelections.length}/{mealboxPortionSize})
                      </button>
                    )}
                    {eggPortions > 0 && (
                      <button
                        onClick={() => setCurrentDietaryTab("egg")}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          currentDietaryTab === "egg" 
                            ? "bg-amber-500 text-white" 
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                        data-testid="tab-egg"
                      >
                        <span className="inline mr-1">🥚</span>
                        Egg ({eggPlateSelections.length}/{mealboxPortionSize})
                      </button>
                    )}
                    {nonVegPortions > 0 && (
                      <button
                        onClick={() => setCurrentDietaryTab("non-veg")}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          currentDietaryTab === "non-veg" 
                            ? "bg-red-500 text-white" 
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                        data-testid="tab-nonveg"
                      >
                        <Drumstick className="w-4 h-4 inline mr-1" />
                        Non-Veg ({nonVegPlateSelections.length}/{mealboxPortionSize})
                      </button>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    {currentDietaryTab === "veg" && "Select veg dishes for your veg plates"}
                    {currentDietaryTab === "egg" && "Select veg or egg dishes for your egg plates"}
                    {currentDietaryTab === "non-veg" && "Select any dishes for your non-veg plates"}
                  </p>
                </div>
              )}
              
              {/* Proceed to MealBox button */}
              {(vegPortions > 0 || nonVegPortions > 0 || eggPortions > 0) && (
                <Button
                  onClick={handleProceedToMealbox}
                  className="w-full mt-4"
                  style={{ backgroundColor: getPlateProgress().allFilled ? "#1A9952" : "#9CA3AF" }}
                  disabled={!getPlateProgress().allFilled}
                  data-testid="button-proceed-mealbox"
                >
                  {getPlateProgress().allFilled 
                    ? "Proceed to MealBox Checkout" 
                    : "Complete dish selection to proceed"}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Recommended Dishes - 2 column grid like BulkMeal */}
        <div className="space-y-6">
          {Object.entries(groupedDishes).map(([category, dishes]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">{category}</Badge>
                <span className="text-xs text-muted-foreground">({dishes.length})</span>
              </h2>
              
              {/* 2 column grid matching BulkMeal */}
              <div className="grid grid-cols-2 gap-3">
                {dishes.map((dish) => {
                  const isAdded = addedItems.has(dish.id);
                  const isVeg = dish.dietaryType?.toLowerCase() === 'veg';
                  const isEgg = dish.dietaryType?.toLowerCase() === 'egg';
                  const isNonVeg = dish.dietaryType?.toLowerCase() === 'non-veg';
                  const currentQty = dishQuantities[dish.id] ?? 5;
                  const isSelectedForPlate = isDishSelectedForPlate(dish.id);
                  
                  // Check if dish is compatible with current dietary tab
                  const allowedTypes = getAllowedDietaryTypes();
                  const dishDietaryType = dish.dietaryType?.toLowerCase() || 'veg';
                  const isDishAllowedForTab = allowedTypes.includes(dishDietaryType);
                  
                  return (
                    <Card 
                      key={dish.id} 
                      className="overflow-hidden hover-elevate group"
                      data-testid={`card-dish-${dish.id}`}
                    >
                      {/* Dish Image */}
                      <div className="relative h-32 overflow-hidden">
                        <LazyImage 
                          src={getSupabaseImageUrl(dish.imageUrl)}
                          alt={dish.name}
                          containerClassName="w-full h-full"
                          className="transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                      
                      {/* Dish Content */}
                      <div className="p-3">
                        <h3 className="font-bold text-sm mb-1 line-clamp-1" data-testid={`text-dish-name-${dish.id}`}>
                          {dish.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {dish.description}
                        </p>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-primary font-bold text-base" data-testid={`text-dish-price-${dish.id}`}>
                            ₹{parseFloat(dish.price).toFixed(0)}
                          </span>
                        </div>
                        
                        {/* Bulk Meal Mode: Quantity controls */}
                        {orderMode === "bulkMeal" && (
                          <div className="space-y-2">
                            {!isAdded ? (
                              <>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleBulkQuantityChange(dish.id, -1)}
                                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                      data-testid={`button-qty-minus-${dish.id}`}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <input
                                      type="number"
                                      value={currentQty}
                                      onChange={(e) => handleBulkQuantitySet(dish.id, e.target.value)}
                                      className="w-12 h-7 text-center font-semibold text-sm border border-gray-300 rounded"
                                      min="0"
                                      data-testid={`input-qty-${dish.id}`}
                                    />
                                    <button
                                      onClick={() => handleBulkQuantityChange(dish.id, 1)}
                                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                      data-testid={`button-qty-plus-${dish.id}`}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleAddToBulkCart(dish, currentQty)}
                                  disabled={currentQty === 0}
                                  className="w-full rounded-full text-xs h-8"
                                  style={{ backgroundColor: currentQty > 0 ? "#1A9952" : undefined }}
                                  data-testid={`button-add-${dish.id}`}
                                >
                                  {currentQty > 0 ? `Add ${currentQty}` : "Add"}
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="w-full rounded-full text-xs h-8"
                                disabled
                                data-testid={`button-added-${dish.id}`}
                              >
                                Added to Cart
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {/* MealBox Mode: Add to plate (only when plates selected and dish is allowed for current tab) */}
                        {orderMode === "mealbox" && (vegPortions > 0 || eggPortions > 0 || nonVegPortions > 0) && (
                          <Button
                            size="sm"
                            onClick={() => handleAddToPlate(dish)}
                            variant={isSelectedForPlate ? "secondary" : "default"}
                            className={`w-full rounded-full text-xs h-8 ${!isDishAllowedForTab ? "opacity-50" : ""}`}
                            style={{ backgroundColor: isSelectedForPlate ? "#E5E7EB" : isDishAllowedForTab ? "#1A9952" : "#9CA3AF" }}
                            disabled={!isDishAllowedForTab}
                            data-testid={`button-add-plate-${dish.id}`}
                          >
                            {isSelectedForPlate ? (
                              <>✓ Added to {currentDietaryTab} plate</>
                            ) : isDishAllowedForTab ? (
                              <>Add to {currentDietaryTab} plate</>
                            ) : (
                              <>Not for {currentDietaryTab}</>
                            )}
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* AI Recommendation Summary - Moved to after dishes */}
        {recommendations.aiSummary && (
          <Card className="mt-6 bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm mb-2">AI Recommendation Summary</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed" data-testid="text-ai-summary">
                    {recommendations.aiSummary}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Budget Note from AI */}
        {recommendations.aiBudgetNote && (
          <Card className="mt-4 border-orange-200 bg-orange-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Budget Note</h4>
                  <p className="text-xs text-muted-foreground" data-testid="text-budget-note">
                    {recommendations.aiBudgetNote}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bottom Action - Only show for Bulk Meal mode */}
        {orderMode === "bulkMeal" && (
          <div className="mt-6 text-center">
            <Card className="p-4">
              <h3 className="text-base font-semibold mb-2">Ready to Order?</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Add your selected items to the cart and proceed to checkout
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  size="sm"
                  onClick={() => setLocation("/bulk-meals")}
                  variant="outline"
                  data-testid="button-view-cart"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View Cart
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddAllToCart}
                  disabled={isAddingToCart}
                  data-testid="button-add-all-bottom"
                >
                  Add All & Continue
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Floating Cart Button - Only show in Bulk Meal mode when cart has items */}
      {orderMode === "bulkMeal" && bulkCartTotal > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md">
          <button
            onClick={() => setLocation("/bulk-meals-cart")}
            className="w-full flex items-center justify-between px-5 py-4 rounded-xl shadow-lg"
            style={{ backgroundColor: "#1A9952" }}
            data-testid="button-floating-cart"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-white" />
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-xs font-bold flex items-center justify-center" style={{ color: "#1A9952" }}>
                  {bulkCartTotal}
                </span>
              </div>
              <span className="text-white font-medium" style={{ fontFamily: "Sweet Sans Pro" }}>
                {bulkCartTotal} item{bulkCartTotal > 1 ? 's' : ''} in cart
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg" style={{ fontFamily: "Sweet Sans Pro" }}>
                ₹{bulkCartValue.toLocaleString('en-IN')}
              </span>
              <span className="text-white">→</span>
            </div>
          </button>
        </div>
      )}

      {/* Floating Navigation */}
      <FloatingNav activeTab="menu" onTabChange={handleNavTabChange} />
    </div>
  );
}
