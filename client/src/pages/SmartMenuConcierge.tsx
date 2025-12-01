import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, ChevronRight, Building2, Heart, Sparkles, Cake, CalendarDays, PartyPopper } from "lucide-react";
import FloatingNav from "@/pages/FloatingNav";

import heroImage from "@assets/Banner - 60 mins_1763877285748.png";

const STORAGE_KEY = "smartMenuConciergeData";

interface FormData {
  eventType: string;
  cuisines: string[];
  guestCount: string;
  mealTypes: string[];
  dietaryPreference: string;
  allergies: string;
  budget: string;
}

const eventTypes = [
  { id: "corporate", label: "Corporate Event", Icon: Building2 },
  { id: "wedding", label: "Wedding", Icon: Heart },
  { id: "engagement", label: "Engagement", Icon: Sparkles },
  { id: "birthday", label: "Birthday Party", Icon: Cake },
  { id: "anniversary", label: "Anniversary", Icon: CalendarDays },
  { id: "festival", label: "Festival", Icon: PartyPopper },
];

// Simplified cuisine list without external image assets
const cuisines = [
  { id: "north-indian", label: "North Indian" },
  { id: "south-indian", label: "South Indian" },
  { id: "continental", label: "Continental" },
  { id: "andhra", label: "Andhra" },
  { id: "indo-chinese", label: "Indo-Chinese" },
  { id: "kerala", label: "Kerala" },
  { id: "italian", label: "Italian" },
  { id: "mexican", label: "Mexican" },
];

const mealTypes = [
  { id: "hi-tea", label: "Hi-Tea", icon: "☕" },
  { id: "breakfast", label: "Breakfast", icon: "🍳" },
  { id: "lunch", label: "Lunch", icon: "🍛" },
  { id: "dinner", label: "Dinner", icon: "🍽️" },
];

const dietaryOptions = [
  { id: "veg", label: "VEG", description: "Only Vegetarian Dishes", color: "#1A9952" },
  { id: "eggitarian", label: "EGGITARIAN", description: "Vegetarian dishes that include eggs", color: "#F59E0B" },
  { id: "non-veg", label: "NON-VEG", description: "All Types including meat", color: "#EF4444" },
  { id: "no-preference", label: "NO PREFERENCE", description: "Shows all dishes", color: "#6B7280", isIcon: true },
];

export default function SmartMenuConcierge() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("menu");
  const [cuisineSearch, setCuisineSearch] = useState("");

  const [formData, setFormData] = useState<FormData>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      try {
        return JSON.parse(stored) as FormData;
      } catch {
        // fall through to default
      }
    }
    return {
      eventType: "",
      cuisines: [],
      guestCount: "",
      mealTypes: [],
      dietaryPreference: "",
      allergies: "",
      budget: "",
    };
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  const handleTabChange = (tab: "home" | "menu" | "profile") => {
    if (tab === "home") {
      setLocation("/");
    } else if (tab === "menu") {
      setLocation("/menu");
    } else if (tab === "profile") {
      setLocation("/profile");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      setLocation("/");
    }
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleGetRecommendations();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.eventType !== "";
      case 2:
        return formData.cuisines.length > 0;
      case 3:
        return formData.guestCount !== "" && formData.mealTypes.length > 0;
      case 4:
        return formData.dietaryPreference !== "";
      case 5:
        return formData.budget !== "";
      default:
        return true;
    }
  };

  const toggleCuisine = (cuisineId: string) => {
    setFormData((prev) => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisineId)
        ? prev.cuisines.filter((c) => c !== cuisineId)
        : [...prev.cuisines, cuisineId],
    }));
  };

  const toggleMealType = (mealId: string) => {
    setFormData((prev) => ({
      ...prev,
      mealTypes: prev.mealTypes.includes(mealId)
        ? prev.mealTypes.filter((m) => m !== mealId)
        : [...prev.mealTypes, mealId],
    }));
  };

  const filteredCuisines = cuisines.filter((c) =>
    c.label.toLowerCase().includes(cuisineSearch.toLowerCase())
  );

  const getStepLabel = () => {
    switch (currentStep) {
      case 1:
        return "";
      case 2:
        return "Event";
      case 3:
        return "Cuisine";
      case 4:
        return "Guest Count & Meals";
      case 5:
        return "Dietary & Allergies";
      case 6:
        return "Total Budget";
      default:
        return "";
    }
  };

  const handleGetRecommendations = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLocation("/smart-menu-results");
  };

  const getDietaryLabel = () => {
    const option = dietaryOptions.find((d) => d.id === formData.dietaryPreference);
    return option ? { label: option.label, description: option.description, color: option.color } : null;
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Hero Section */}
      <div className="relative">
        <img
          src={heroImage}
          alt="Smart Menu Concierge"
          className="w-full h-80 sm:h-96 object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent" />

        {/* Back Button */}
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-medium shadow-sm"
          style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentStep === 1 ? "Home" : getStepLabel()}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="px-4 pt-4">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div
              key={step}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                backgroundColor: step <= currentStep ? "#1A9952" : "#E5E7EB",
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Step 1: Event Details */}
        {currentStep === 1 && (
          <div>
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

            <div className="mt-6">
              <p className="text-sm font-medium mb-4" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                What Type of Event are you planning?
              </p>

              <div className="grid grid-cols-2 gap-3">
                {eventTypes.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setFormData((prev) => ({ ...prev, eventType: id }))}
                    className="flex items-center gap-3 p-4 border-2 rounded-lg transition-all"
                    style={{
                      borderColor: formData.eventType === id ? "#1A9952" : "#E5E7EB",
                      backgroundColor: formData.eventType === id ? "#F0F9F4" : "white",
                    }}
                    data-testid={`event-type-${id}`}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: "#1A9952",
                        backgroundColor: formData.eventType === id ? "#1A9952" : "white",
                      }}
                    >
                      {formData.eventType === id && <div className="w-2 h-2 rounded-full bg-white" />}
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
            </div>
          </div>
        )}

        {/* Step 2: Cuisine Preferences */}
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

            <p className="text-xs text-gray-500 mb-4" style={{ fontFamily: "Sweet Sans Pro" }}>
              Choose all the cuisines that you'd like to include in your menu
            </p>

            {/* Search Box */}
            <div className="relative mb-4">
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

            {/* Cuisine List */}
            <div className="space-y-0 border-t border-gray-100">
              {filteredCuisines.map((cuisine) => (
                <button
                  key={cuisine.id}
                  onClick={() => toggleCuisine(cuisine.id)}
                  className="w-full flex items-center gap-3 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  data-testid={`cuisine-${cuisine.id}`}
                >
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-sm font-semibold text-green-700">
                    {cuisine.label.charAt(0)}
                  </div>
                  <span
                    className="flex-1 text-left text-sm"
                    style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}
                  >
                    {cuisine.label}
                  </span>
                  <div
                    className="w-5 h-5 rounded border-2 flex items-center justify-center"
                    style={{
                      borderColor: formData.cuisines.includes(cuisine.id) ? "#1A9952" : "#D1D5DB",
                      backgroundColor: formData.cuisines.includes(cuisine.id) ? "#1A9952" : "white",
                    }}
                  >
                    {formData.cuisines.includes(cuisine.id) && (
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
          </div>
        )}

        {/* Step 3: Guest Count & Meals */}
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

            <div className="mt-6 space-y-6">
              {/* Guest Count */}
              <div>
                <p className="text-sm font-medium mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Enter Number of Guests
                </p>
                <input
                  type="number"
                  placeholder="50"
                  value={formData.guestCount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, guestCount: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-guest-count"
                />
              </div>

              {/* Meal Type */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Select the type of meal
                  </p>
                  <span className="text-xs" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                    Multi Select
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {mealTypes.map((meal) => (
                    <button
                      key={meal.id}
                      onClick={() => toggleMealType(meal.id)}
                      className="flex items-center gap-3 p-3 border rounded-lg transition-all"
                      style={{
                        borderColor: formData.mealTypes.includes(meal.id) ? "#1A9952" : "#E5E7EB",
                        backgroundColor: formData.mealTypes.includes(meal.id) ? "#F0F9F4" : "white",
                      }}
                      data-testid={`meal-type-${meal.id}`}
                    >
                      <div
                        className="w-5 h-5 rounded border-2 flex items-center justify-center"
                        style={{
                          borderColor: formData.mealTypes.includes(meal.id) ? "#1A9952" : "#D1D5DB",
                          backgroundColor: formData.mealTypes.includes(meal.id) ? "#1A9952" : "white",
                        }}
                      >
                        {formData.mealTypes.includes(meal.id) && (
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

        {/* Step 4: Dietary & Allergies */}
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
              {/* Dietary Preferences */}
              <div>
                <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: "Sweet Sans Pro" }}>
                  Select your dietary preferences to filter dishes accordingly
                </p>

                <div className="space-y-3">
                  {dietaryOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setFormData((prev) => ({ ...prev, dietaryPreference: option.id }))}
                      className="w-full flex items-center gap-4 p-4 border rounded-lg transition-all"
                      style={{
                        borderColor: formData.dietaryPreference === option.id ? "#1A9952" : "#E5E7EB",
                        backgroundColor: formData.dietaryPreference === option.id ? "#F0F9F4" : "white",
                      }}
                      data-testid={`dietary-${option.id}`}
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
                          backgroundColor:
                            formData.dietaryPreference === option.id ? "#1A9952" : "white",
                        }}
                      >
                        {formData.dietaryPreference === option.id && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Allergies */}
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
                  value={formData.allergies}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, allergies: e.target.value }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-allergies"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Total Budget */}
        {currentStep === 5 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Total Budget
                </h2>
                <p className="text-sm text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                  Your Event Budget
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

            <div className="mt-6 space-y-4">
              <p className="text-sm text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                Enter the total budget for your event
              </p>
              <input
                type="number"
                placeholder="50000"
                value={formData.budget}
                onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                style={{ fontFamily: "Sweet Sans Pro" }}
                data-testid="input-budget"
              />
            </div>
          </div>
        )}

        {/* Step 6: Summary & Submit */}
        {currentStep === 6 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Review Details
                </h2>
                <p className="text-sm text-gray-600" style={{ fontFamily: "Sweet Sans Pro" }}>
                  Confirm your preferences
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4 text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              <div>
                <p className="font-semibold mb-1">Event Type</p>
                <p className="text-gray-700">
                  {eventTypes.find((e) => e.id === formData.eventType)?.label || "-"}
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">Cuisines</p>
                <p className="text-gray-700">
                  {formData.cuisines.length > 0
                    ? formData.cuisines
                        .map((id) => cuisines.find((c) => c.id === id)?.label)
                        .filter(Boolean)
                        .join(", ")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">Guest Count & Meals</p>
                <p className="text-gray-700">
                  {formData.guestCount || "-"} guests •{" "}
                  {formData.mealTypes.length > 0
                    ? formData.mealTypes
                        .map((id) => mealTypes.find((m) => m.id === id)?.label)
                        .filter(Boolean)
                        .join(", ")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">Dietary Preference</p>
                <p className="text-gray-700">
                  {getDietaryLabel()?.label || "-"}
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">Allergies</p>
                <p className="text-gray-700">
                  {formData.allergies || "None specified"}
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">Total Budget</p>
                <p className="text-gray-700">
                  {formData.budget ? `₹${formData.budget}` : "-"}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Button
                onClick={handleGetRecommendations}
                className="w-full py-3 text-sm font-semibold"
                style={{
                  fontFamily: "Sweet Sans Pro",
                  backgroundColor: "#1A9952",
                  color: "white",
                  borderRadius: "10px",
                }}
                data-testid="button-get-recommendations"
              >
                Get Menu Recommendations
              </Button>
            </div>
          </div>
        )}
      </div>

      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}


