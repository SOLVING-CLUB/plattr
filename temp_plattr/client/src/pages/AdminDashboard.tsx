import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ChefHat, Grid3x3, UtensilsCrossed, Search } from "lucide-react";
import { getSupabaseImageUrl } from "@/lib/supabase";
import { SupabaseQueryOptions, supabase } from "@/lib/supabase-client";

interface Cuisine {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  mealType: string;
  displayOrder: number;
  imageUrl: string | null;
}

interface Dish {
  id: string;
  name: string;
  description: string;
  price: string;
  leastPrice: string | null;
  imageUrl: string;
  mealType: string[];
  categoryId: string | null;
  isAvailable: boolean;
  spiceLevel: string | null;
  dietaryType: string | null;
  dishType: string | null;
  cuisine: string | null;
}

type SupabaseCuisineRow = {
  id?: string;
  name: string;
  display_name?: string | null;
  displayName?: string | null;
  icon?: string | null;
  display_order?: number | null;
  displayOrder?: number | null;
  is_active?: boolean | null;
  isActive?: boolean | null;
};

const toTitleCase = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dishes");
  
  // Cuisine state
  const [cuisineDialog, setCuisineDialog] = useState(false);
  const [editingCuisine, setEditingCuisine] = useState<Cuisine | null>(null);
  const [cuisineForm, setCuisineForm] = useState({
    name: "",
    displayName: "",
    icon: "",
    displayOrder: 0,
    isActive: true,
  });

  // Category state
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    mealType: "",
    displayOrder: 0,
    imageUrl: "",
  });

  // Dish state
  const [dishDialog, setDishDialog] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [dishSearch, setDishSearch] = useState("");
  const [dishForm, setDishForm] = useState({
    name: "",
    description: "",
    price: "",
    leastPrice: "",
    imageUrl: "",
    mealType: [] as string[],
    categoryId: "",
    isAvailable: true,
    spiceLevel: "",
    dietaryType: "",
    dishType: "",
    cuisine: "",
  });

  // Fetch queries - cuisines is optional (table may not exist)
  const {
    data: cuisineData,
    isLoading: cuisinesLoading,
    isError: cuisinesError,
  } = useQuery<{ items: Cuisine[]; source: "table" | "derived" }>({
    queryKey: ["admin", "cuisines"],
    retry: false,
    queryFn: async () => {
      const normalizeCuisine = (row: SupabaseCuisineRow): Cuisine => ({
        id: row.id ?? row.name,
        name: row.name,
        displayName: row.displayName ?? row.display_name ?? toTitleCase(row.name),
        icon: row.icon ?? "UtensilsCrossed",
        displayOrder: row.displayOrder ?? row.display_order ?? 0,
        isActive: row.isActive ?? row.is_active ?? true,
      });

      try {
        const rows = await supabase.select<SupabaseCuisineRow>("cuisines", {
          select: "id,name,display_name,icon,display_order,is_active",
          order: "display_order.asc",
        });

        if (Array.isArray(rows) && rows.length > 0) {
          return {
            items: rows.map(normalizeCuisine),
            source: "table" as const,
          };
        }
      } catch (error) {
        console.warn("[Supabase] cuisines table unavailable, deriving from dishes", error);
      }

      try {
        const dishRows = await supabase.select<{ cuisine: string | null }>("dishes", {
          select: "cuisine",
          order: "cuisine.asc",
        });

        const seen = new Set<string>();
        const derived: Cuisine[] = [];

        dishRows.forEach((row) => {
          const cuisineName = row?.cuisine?.trim();
          if (!cuisineName || seen.has(cuisineName)) return;
          seen.add(cuisineName);
          derived.push(
            normalizeCuisine({
              id: `derived:${cuisineName}`,
              name: cuisineName,
              displayName: toTitleCase(cuisineName),
              icon: "UtensilsCrossed",
              display_order: derived.length,
              is_active: true,
            })
          );
        });

        return {
          items: derived,
          source: "derived" as const,
        };
      } catch (fallbackError) {
        console.error("[Supabase] failed to derive cuisines from dishes", fallbackError);
        throw fallbackError;
      }
    },
  });

  const cuisines = cuisineData?.items ?? [];
  const cuisinesSource = cuisineData?.source ?? "table";
  const cuisinesReadOnly = cuisinesSource === "derived";

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const rows = await supabase.select<{
        id: string;
        name: string;
        meal_type?: string | null;
        mealType?: string | null;
        display_order?: number | null;
        displayOrder?: number | null;
        image_url?: string | null;
        imageUrl?: string | null;
      }>("categories", {
        select: "id,name,meal_type,display_order,image_url",
        order: "display_order.asc",
      });

      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        mealType: row.mealType ?? row.meal_type ?? "",
        displayOrder: row.displayOrder ?? row.display_order ?? 0,
        imageUrl: row.imageUrl ?? row.image_url ?? null,
      }));
    },
  });

  const { data: dishes = [], isLoading: dishesLoading } = useQuery<Dish[]>({
    queryKey: ["admin", "dishes", dishSearch],
    queryFn: async () => {
      const options: SupabaseQueryOptions = {
        select:
          "id,name,description,price,least_price,image_url,meal_type,category_id,is_available,spice_level,dietary_type,dish_type,cuisine",
        order: "name.asc",
      };

      if (dishSearch) {
        options.filter = {
          name: `ilike.%${dishSearch}%`,
        };
      }

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

      return rows.map((row) => {
        const mealTypeArray = Array.isArray(row.meal_type)
          ? row.meal_type
          : typeof row.meal_type === "string" && row.meal_type.length > 0
            ? row.meal_type
                .replace(/[{}]/g, "")
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean)
            : [];

        return {
          id: row.id,
          name: row.name,
          description: row.description ?? "",
          price: row.price != null ? String(row.price) : "",
          leastPrice: row.least_price != null ? String(row.least_price) : null,
          imageUrl: row.image_url ?? "",
          mealType: mealTypeArray,
          categoryId: row.category_id ?? null,
          isAvailable: row.is_available ?? true,
          spiceLevel: row.spice_level ?? null,
          dietaryType: row.dietary_type ?? null,
          dishType: row.dish_type ?? null,
          cuisine: row.cuisine ?? null,
        };
      });
    },
  });

  // Fetch unique cuisine and dish type values
  const uniqueCuisines = useMemo(() => {
    const names = new Set<string>();
    cuisines.forEach((cuisine) => {
      if (cuisine.name) {
        names.add(cuisine.name);
      }
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [cuisines]);

  const { data: uniqueDishTypes = [] } = useQuery<string[]>({
    queryKey: ["admin", "unique-dish-types"],
    queryFn: async () => {
      const rows = await supabase.select<{ dish_type: string | null }>("dishes", {
        select: "dish_type",
        order: "dish_type.asc",
      });

      return Array.from(
        new Set(
          rows
            .map((row) => row.dish_type?.trim())
            .filter((type): type is string => Boolean(type))
        )
      );
    },
  });

  // Cuisine mutations
  const createCuisineMutation = useMutation({
    mutationFn: async (data: typeof cuisineForm) => {
      await supabase.insert("cuisines", {
        name: data.name,
        display_name: data.displayName,
        icon: data.icon,
        display_order: data.displayOrder,
        is_active: data.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "cuisines"] });
      setCuisineDialog(false);
      resetCuisineForm();
      toast({ title: "Success", description: "Cuisine created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateCuisineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof cuisineForm> }) => {
      await supabase.update(
        "cuisines",
        { id: `eq.${id}` },
        {
          name: data.name,
          display_name: data.displayName,
          icon: data.icon,
          display_order: data.displayOrder,
          is_active: data.isActive,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "cuisines"] });
      setCuisineDialog(false);
      setEditingCuisine(null);
      resetCuisineForm();
      toast({ title: "Success", description: "Cuisine updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteCuisineMutation = useMutation({
    mutationFn: (id: string) => supabase.delete("cuisines", { id: `eq.${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "cuisines"] });
      toast({ title: "Success", description: "Cuisine deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Category mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryForm) => {
      await supabase.insert("categories", {
        name: data.name,
        meal_type: data.mealType,
        display_order: data.displayOrder,
        image_url: data.imageUrl || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      setCategoryDialog(false);
      resetCategoryForm();
      toast({ title: "Success", description: "Category created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof categoryForm> }) => {
      await supabase.update(
        "categories",
        { id: `eq.${id}` },
        {
          name: data.name,
          meal_type: data.mealType,
          display_order: data.displayOrder,
          image_url: data.imageUrl || null,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      setCategoryDialog(false);
      setEditingCategory(null);
      resetCategoryForm();
      toast({ title: "Success", description: "Category updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => supabase.delete("categories", { id: `eq.${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast({ title: "Success", description: "Category deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Dish mutations
  const createDishMutation = useMutation({
    mutationFn: async (data: typeof dishForm) => {
      await supabase.insert("dishes", {
        name: data.name,
        description: data.description,
        price: data.price ? Number(data.price) : null,
        least_price: data.leastPrice ? Number(data.leastPrice) : null,
        image_url: data.imageUrl || null,
        meal_type: data.mealType,
        category_id: data.categoryId || null,
        is_available: data.isAvailable,
        spice_level: data.spiceLevel || null,
        dietary_type: data.dietaryType || null,
        dish_type: data.dishType || null,
        cuisine: data.cuisine || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "dishes"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "unique-dish-types"] });
      setDishDialog(false);
      resetDishForm();
      toast({ title: "Success", description: "Dish created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateDishMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof dishForm> }) => {
      await supabase.update(
        "dishes",
        { id: `eq.${id}` },
        {
          name: data.name,
          description: data.description,
          price: data.price ? Number(data.price) : null,
          least_price: data.leastPrice ? Number(data.leastPrice) : null,
          image_url: data.imageUrl || null,
          meal_type: data.mealType,
          category_id: data.categoryId || null,
          is_available: data.isAvailable,
          spice_level: data.spiceLevel || null,
          dietary_type: data.dietaryType || null,
          dish_type: data.dishType || null,
          cuisine: data.cuisine || null,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "dishes"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "unique-dish-types"] });
      setDishDialog(false);
      setEditingDish(null);
      resetDishForm();
      toast({ title: "Success", description: "Dish updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteDishMutation = useMutation({
    mutationFn: (id: string) => supabase.delete("dishes", { id: `eq.${id}` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "dishes"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "unique-dish-types"] });
      toast({ title: "Success", description: "Dish deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Helper functions
  const resetCuisineForm = () => {
    setCuisineForm({ name: "", displayName: "", icon: "", displayOrder: 0, isActive: true });
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", mealType: "", displayOrder: 0, imageUrl: "" });
  };

  const resetDishForm = () => {
    setDishForm({
      name: "",
      description: "",
      price: "",
      leastPrice: "",
      imageUrl: "",
      mealType: [],
      categoryId: "",
      isAvailable: true,
      spiceLevel: "",
      dietaryType: "",
      dishType: "",
      cuisine: "",
    });
  };

  const notifyCuisinesReadOnly = () => {
    toast({
      title: "Cuisines table unavailable",
      description: "Supabase is missing the 'cuisines' table. Cuisines are derived from dishes and cannot be modified here.",
      variant: "destructive",
    });
  };

  const openCuisineDialog = (cuisine?: Cuisine) => {
    if (cuisinesReadOnly) {
      notifyCuisinesReadOnly();
      return;
    }
    if (cuisine) {
      setEditingCuisine(cuisine);
      setCuisineForm({
        name: cuisine.name,
        displayName: cuisine.displayName,
        icon: cuisine.icon,
        displayOrder: cuisine.displayOrder,
        isActive: cuisine.isActive,
      });
    } else {
      setEditingCuisine(null);
      resetCuisineForm();
    }
    setCuisineDialog(true);
  };

  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        mealType: category.mealType,
        displayOrder: category.displayOrder,
        imageUrl: category.imageUrl || "",
      });
    } else {
      setEditingCategory(null);
      resetCategoryForm();
    }
    setCategoryDialog(true);
  };

  const openDishDialog = (dish?: Dish) => {
    if (dish) {
      setEditingDish(dish);
      setDishForm({
        name: dish.name,
        description: dish.description,
        price: dish.price,
        leastPrice: dish.leastPrice || "",
        imageUrl: dish.imageUrl,
        mealType: dish.mealType,
        categoryId: dish.categoryId || "",
        isAvailable: dish.isAvailable,
        spiceLevel: dish.spiceLevel || "",
        dietaryType: dish.dietaryType || "",
        dishType: dish.dishType || "",
        cuisine: dish.cuisine || "",
      });
    } else {
      setEditingDish(null);
      resetDishForm();
    }
    setDishDialog(true);
  };

  const handleSaveCuisine = () => {
    if (cuisinesReadOnly) {
      notifyCuisinesReadOnly();
      return;
    }
    if (editingCuisine) {
      updateCuisineMutation.mutate({ id: editingCuisine.id, data: cuisineForm });
    } else {
      createCuisineMutation.mutate(cuisineForm);
    }
  };

  const handleSaveCategory = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  const handleSaveDish = () => {
    if (editingDish) {
      updateDishMutation.mutate({ id: editingDish.id, data: dishForm });
    } else {
      createDishMutation.mutate(dishForm);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-admin-title">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage cuisines, categories, and dishes</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${cuisinesError ? 'grid-cols-2' : 'grid-cols-3'}`} data-testid="tabs-admin">
            {!cuisinesError && (
              <TabsTrigger value="cuisines" data-testid="tab-cuisines">
                <ChefHat className="w-4 h-4 mr-2" />
                Cuisines
              </TabsTrigger>
            )}
            <TabsTrigger value="categories" data-testid="tab-categories">
              <Grid3x3 className="w-4 h-4 mr-2" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="dishes" data-testid="tab-dishes">
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              Dishes
            </TabsTrigger>
          </TabsList>

          {/* CUISINES TAB */}
          {!cuisinesError && (
            <TabsContent value="cuisines">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle>Cuisines</CardTitle>
                    <CardDescription>
                      Manage cuisine types
                      {cuisinesReadOnly && (
                        <span className="block text-xs text-muted-foreground mt-1">
                          Displaying cuisines derived from dishes. Create, edit, and delete actions are disabled.
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => (cuisinesReadOnly ? notifyCuisinesReadOnly() : openCuisineDialog())}
                    data-testid="button-add-cuisine"
                    disabled={cuisinesReadOnly}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Cuisine
                  </Button>
                </CardHeader>
                <CardContent>
                  {cuisinesLoading ? (
                    <p className="text-muted-foreground">Loading...</p>
                  ) : (
                    <div className="grid gap-4">
                      {cuisines.map((cuisine) => (
                      <div
                        key={cuisine.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                        data-testid={`cuisine-item-${cuisine.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="font-medium">{cuisine.displayName}</div>
                          <Badge variant={cuisine.isActive ? "default" : "secondary"}>
                            {cuisine.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">Order: {cuisine.displayOrder}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => (cuisinesReadOnly ? notifyCuisinesReadOnly() : openCuisineDialog(cuisine))}
                            data-testid={`button-edit-cuisine-${cuisine.id}`}
                            disabled={cuisinesReadOnly}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              cuisinesReadOnly
                                ? notifyCuisinesReadOnly()
                                : deleteCuisineMutation.mutate(cuisine.id)
                            }
                            data-testid={`button-delete-cuisine-${cuisine.id}`}
                            disabled={cuisinesReadOnly}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}

          {/* CATEGORIES TAB */}
          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>Categories</CardTitle>
                  <CardDescription>Manage dish categories</CardDescription>
                </div>
                <Button onClick={() => openCategoryDialog()} data-testid="button-add-category">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : (
                  <div className="grid gap-4">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                        data-testid={`category-item-${category.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="font-medium">{category.name}</div>
                          <Badge variant="outline">{category.mealType}</Badge>
                          <span className="text-sm text-muted-foreground">Order: {category.displayOrder}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openCategoryDialog(category)}
                            data-testid={`button-edit-category-${category.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCategoryMutation.mutate(category.id)}
                            data-testid={`button-delete-category-${category.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* DISHES TAB */}
          <TabsContent value="dishes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle>Dishes</CardTitle>
                  <CardDescription>Manage menu dishes</CardDescription>
                </div>
                <div className="flex gap-2 items-center flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search dishes..."
                      value={dishSearch}
                      onChange={(e) => setDishSearch(e.target.value)}
                      className="pl-9 w-64"
                      data-testid="input-search-dishes"
                    />
                  </div>
                  <Button onClick={() => openDishDialog()} data-testid="button-add-dish">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Dish
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {dishesLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : (
                  <div className="grid gap-4">
                    {dishes.map((dish) => (
                      <div
                        key={dish.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover-elevate"
                        data-testid={`dish-item-${dish.id}`}
                      >
                        <img
                          src={getSupabaseImageUrl(dish.imageUrl)}
                          alt={dish.name}
                          className="w-20 h-20 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{dish.name}</div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{dish.description}</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant="outline">₹{dish.price}</Badge>
                            {dish.cuisine && <Badge variant="secondary">{dish.cuisine}</Badge>}
                            {dish.dietaryType && <Badge>{dish.dietaryType}</Badge>}
                            <Badge variant={dish.isAvailable ? "default" : "secondary"}>
                              {dish.isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDishDialog(dish)}
                            data-testid={`button-edit-dish-${dish.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteDishMutation.mutate(dish.id)}
                            data-testid={`button-delete-dish-${dish.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CUISINE DIALOG */}
        <Dialog open={cuisineDialog} onOpenChange={setCuisineDialog}>
          <DialogContent data-testid="dialog-cuisine-form">
            <DialogHeader>
              <DialogTitle>{editingCuisine ? "Edit Cuisine" : "Add Cuisine"}</DialogTitle>
              <DialogDescription>
                {editingCuisine ? "Update cuisine details" : "Create a new cuisine type"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name (ID)</Label>
                <Input
                  id="name"
                  value={cuisineForm.name}
                  onChange={(e) => setCuisineForm({ ...cuisineForm, name: e.target.value })}
                  placeholder="e.g., south-indian"
                  data-testid="input-cuisine-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={cuisineForm.displayName}
                  onChange={(e) => setCuisineForm({ ...cuisineForm, displayName: e.target.value })}
                  placeholder="e.g., South Indian"
                  data-testid="input-cuisine-displayName"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="icon">Icon (Lucide name)</Label>
                <Input
                  id="icon"
                  value={cuisineForm.icon}
                  onChange={(e) => setCuisineForm({ ...cuisineForm, icon: e.target.value })}
                  placeholder="e.g., UtensilsCrossed"
                  data-testid="input-cuisine-icon"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={cuisineForm.displayOrder}
                  onChange={(e) => setCuisineForm({ ...cuisineForm, displayOrder: parseInt(e.target.value) })}
                  data-testid="input-cuisine-displayOrder"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={cuisineForm.isActive}
                  onCheckedChange={(checked) => setCuisineForm({ ...cuisineForm, isActive: checked })}
                  data-testid="switch-cuisine-isActive"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCuisineDialog(false)} data-testid="button-cancel-cuisine">
                Cancel
              </Button>
              <Button onClick={handleSaveCuisine} data-testid="button-save-cuisine">
                {editingCuisine ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CATEGORY DIALOG */}
        <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
          <DialogContent data-testid="dialog-category-form">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
              <DialogDescription>
                {editingCategory ? "Update category details" : "Create a new category"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="categoryName">Name</Label>
                <Input
                  id="categoryName"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g., Beverages"
                  data-testid="input-category-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mealType">Meal Type</Label>
                <Select
                  value={categoryForm.mealType}
                  onValueChange={(value) => setCategoryForm({ ...categoryForm, mealType: value })}
                >
                  <SelectTrigger data-testid="select-category-mealType">
                    <SelectValue placeholder="Select meal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch-dinner">Lunch/Dinner</SelectItem>
                    <SelectItem value="snacks">Snacks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="categoryDisplayOrder">Display Order</Label>
                <Input
                  id="categoryDisplayOrder"
                  type="number"
                  value={categoryForm.displayOrder}
                  onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: parseInt(e.target.value) })}
                  data-testid="input-category-displayOrder"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="categoryImageUrl">Image URL (optional)</Label>
                <Input
                  id="categoryImageUrl"
                  value={categoryForm.imageUrl}
                  onChange={(e) => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })}
                  placeholder="e.g., categories/beverages.png"
                  data-testid="input-category-imageUrl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCategoryDialog(false)} data-testid="button-cancel-category">
                Cancel
              </Button>
              <Button onClick={handleSaveCategory} data-testid="button-save-category">
                {editingCategory ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DISH DIALOG */}
        <Dialog open={dishDialog} onOpenChange={setDishDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-dish-form">
            <DialogHeader>
              <DialogTitle>{editingDish ? "Edit Dish" : "Add Dish"}</DialogTitle>
              <DialogDescription>
                {editingDish ? "Update dish details" : "Create a new dish"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="dishName">Name</Label>
                <Input
                  id="dishName"
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  placeholder="e.g., Masala Dosa"
                  data-testid="input-dish-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dishDescription">Description</Label>
                <Textarea
                  id="dishDescription"
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  placeholder="Describe the dish..."
                  data-testid="input-dish-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dishPrice">Price</Label>
                  <Input
                    id="dishPrice"
                    type="number"
                    value={dishForm.price}
                    onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-dish-price"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dishLeastPrice">Least Price (Optional)</Label>
                  <Input
                    id="dishLeastPrice"
                    type="number"
                    value={dishForm.leastPrice}
                    onChange={(e) => setDishForm({ ...dishForm, leastPrice: e.target.value })}
                    placeholder="0.00"
                    data-testid="input-dish-leastPrice"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dishImageUrl">Image URL (Optional)</Label>
                <Input
                  id="dishImageUrl"
                  value={dishForm.imageUrl}
                  onChange={(e) => setDishForm({ ...dishForm, imageUrl: e.target.value })}
                  placeholder="dishes/D-0001/main.png"
                  data-testid="input-dish-imageUrl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dishCuisine">Cuisine</Label>
                <Select
                  value={dishForm.cuisine}
                  onValueChange={(value) => setDishForm({ ...dishForm, cuisine: value })}
                >
                  <SelectTrigger data-testid="select-dish-cuisine">
                    <SelectValue placeholder="Select cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCuisines.map((cuisine) => (
                      <SelectItem key={cuisine} value={cuisine}>
                        {cuisine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dishDietaryType">Dietary Type</Label>
                  <Select
                    value={dishForm.dietaryType}
                    onValueChange={(value) => setDishForm({ ...dishForm, dietaryType: value })}
                  >
                    <SelectTrigger data-testid="select-dish-dietaryType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Veg">Veg</SelectItem>
                      <SelectItem value="Non-Veg">Non-Veg</SelectItem>
                      <SelectItem value="Egg">Egg</SelectItem>
                      <SelectItem value="Vegan">Vegan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dishSpiceLevel">Spice Level</Label>
                  <Select
                    value={dishForm.spiceLevel}
                    onValueChange={(value) => setDishForm({ ...dishForm, spiceLevel: value })}
                  >
                    <SelectTrigger data-testid="select-dish-spiceLevel">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="spicy">Spicy</SelectItem>
                      <SelectItem value="extra-spicy">Extra Spicy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dishType">Dish Type</Label>
                <Select
                  value={dishForm.dishType}
                  onValueChange={(value) => setDishForm({ ...dishForm, dishType: value })}
                >
                  <SelectTrigger data-testid="select-dish-dishType">
                    <SelectValue placeholder="Select dish type" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueDishTypes.map((dishType) => (
                      <SelectItem key={dishType} value={dishType}>
                        {dishType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="dishIsAvailable"
                  checked={dishForm.isAvailable}
                  onCheckedChange={(checked) => setDishForm({ ...dishForm, isAvailable: checked })}
                  data-testid="switch-dish-isAvailable"
                />
                <Label htmlFor="dishIsAvailable">Available</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDishDialog(false)} data-testid="button-cancel-dish">
                Cancel
              </Button>
              <Button onClick={handleSaveDish} data-testid="button-save-dish">
                {editingDish ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
