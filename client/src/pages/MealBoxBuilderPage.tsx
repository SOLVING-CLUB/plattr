import { useState } from "react";
import { useLocation } from "wouter";
import {
  ShoppingCart,
  MapPin,
  Search,
  Mic,
  ChevronRight,
  Package,
  Utensils,
  UtensilsCrossed,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
// Using fallback image - replace with actual image when available
import heroBackground from "@assets/stock_images/indian_food_platter__b34d03e7.jpg";

export default function MealBoxBuilderPage() {
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState("mealbox");
  const [activeTab, setActiveTab] = useState("categories");
  const [mealPreference, setMealPreference] = useState<"veg" | "non-veg">("non-veg");
  const [vegQuantity, setVegQuantity] = useState(5);
  const [nonVegQuantity, setNonVegQuantity] = useState(12);

  const categories = [
    { id: "bulk-meals", label: "Bulk Meals", icon: Package },
    { id: "mealbox", label: "MealBox", icon: Utensils },
    { id: "catering", label: "Catering", icon: UtensilsCrossed },
    { id: "corporate", label: "Corporate", icon: Building2 },
  ];

  const handleNext = () => {
    // Navigate to next step or dish selection page
    console.log("Proceeding with:", {
      mealPreference,
      vegQuantity,
      nonVegQuantity,
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background relative">
      {/* Background Image with Gradient Overlay */}
      <div 
        className="absolute top-0 left-0 right-0 z-0"
        style={{
          width: '100%',
          maxWidth: '393px',
          height: '351px',
          margin: '0 auto',
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(255,255,255,0.7) 70%, rgba(255,255,255,1) 100%), url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Header */}
      <header className="bg-transparent relative z-50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2" data-testid="text-location">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Bengaluru, KA</span>
          </div>
          <Button
            variant="default"
            size="icon"
            className="bg-primary hover:bg-primary/90 rounded-full"
            data-testid="button-cart"
          >
            <ShoppingCart className="w-5 h-5" />
          </Button>
        </div>

        {/* Category Pills */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === category.id
                    ? "bg-primary text-white"
                    : "bg-muted text-foreground hover-elevate"
                }`}
                data-testid={`chip-${category.id}`}
              >
                <category.icon className="w-4 h-4" />
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar - Figma Dimensions */}
        <div
          style={{
            position: 'absolute',
            top: '208px',
            left: '15px',
            width: '363px',
            height: '40px'
          }}
        >
          <div
            className="flex items-center justify-between bg-muted"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '5px',
              border: '0.5px solid hsl(var(--border))',
              padding: '8px'
            }}
          >
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Search"
                className="flex-1 bg-transparent outline-none text-sm"
                data-testid="input-search"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                data-testid="button-voice-search"
              >
                <Mic className="w-4 h-4" />
              </Button>
              <span className="text-xs font-medium px-2 py-1 bg-background rounded-md border">
                VEG
              </span>
            </div>
          </div>
        </div>

        {/* Progress Indicator - Below Search Bar */}
        <div
          style={{
            position: 'absolute',
            top: '268px',
            left: '15px',
            right: '15px',
            zIndex: 50
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
              1
            </div>
            <h3 className="font-semibold text-base" data-testid="text-step-title">
              Choose Portion Size
            </h3>
          </div>
          <div className="flex gap-1 px-2">
            <div className="h-1 flex-1 bg-primary rounded-full" />
            <div className="h-1 flex-1 bg-muted rounded-full" />
            <div className="h-1 flex-1 bg-muted rounded-full" />
            <div className="h-1 flex-1 bg-muted rounded-full" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-32 relative z-10">
        {/* Preference and Quantity Container - Figma Dimensions */}
        <div
          className="flex flex-col"
          style={{
            position: 'absolute',
            top: '361px',
            left: '15px',
            width: '354px',
            gap: '30px'
          }}
        >
            {/* Meal Preference Section */}
            <div>
              <h2 className="text-2xl font-bold mb-2" data-testid="text-preference-title">
                What's your meal preference?
              </h2>
              <p className="text-sm text-muted-foreground mb-4" data-testid="text-preference-subtitle">
                Tell us how you'd like your boxes prepared.
              </p>

              <div className="flex gap-4 mb-3">
                {/* VEG Option */}
                <button
                  onClick={() => setMealPreference("veg")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-colors ${
                    mealPreference === "veg"
                      ? "border-primary bg-primary/5"
                      : "border-muted bg-background"
                  }`}
                  data-testid="button-preference-veg"
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      mealPreference === "veg"
                        ? "border-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {mealPreference === "veg" && (
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="font-medium">VEG</span>
                </button>

                {/* NON-VEG Option */}
                <button
                  onClick={() => setMealPreference("non-veg")}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-colors ${
                    mealPreference === "non-veg"
                      ? "border-primary bg-primary/5"
                      : "border-muted bg-background"
                  }`}
                  data-testid="button-preference-non-veg"
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      mealPreference === "non-veg"
                        ? "border-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {mealPreference === "non-veg" && (
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="font-medium">NON-VEG</span>
                </button>
              </div>

              <p className="text-xs text-muted-foreground" data-testid="text-preference-note">
                Choose Non-Veg to create a mix of both if needed.
              </p>
            </div>

            {/* Quantity Selection Section - Figma Dimensions: 354px × 95px, gap 12px */}
            <div
              style={{
                width: '354px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <h2 className="text-2xl font-bold" data-testid="text-quantity-title">
                How many people are you ordering for?
              </h2>
              <p className="text-sm text-muted-foreground" data-testid="text-quantity-subtitle">
                Enter the number of boxes you'll need.
              </p>

              <div className="flex gap-4">
                {/* VEG Quantity */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      mealPreference === "veg"
                        ? "border-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {mealPreference === "veg" && (
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <Input
                    type="number"
                    value={vegQuantity}
                    onChange={(e) => setVegQuantity(parseInt(e.target.value) || 0)}
                    className="w-24 h-12 text-center text-lg font-semibold border-2 border-primary rounded-lg"
                    data-testid="input-quantity-veg"
                  />
                </div>

                {/* NON-VEG Quantity */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      mealPreference === "non-veg"
                        ? "border-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {mealPreference === "non-veg" && (
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <Input
                    type="number"
                    value={nonVegQuantity}
                    onChange={(e) =>
                      setNonVegQuantity(parseInt(e.target.value) || 0)
                    }
                    className="w-24 h-12 text-center text-lg font-semibold border-2 border-primary rounded-lg"
                    data-testid="input-quantity-non-veg"
                  />
                </div>
              </div>
            </div>
          </div>

        {/* Next Button */}
        <div className="flex justify-end mt-8" style={{ position: 'absolute', top: '650px', right: '15px' }}>
          <Button
            onClick={handleNext}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-base font-medium"
            data-testid="button-next"
          >
            Next
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

