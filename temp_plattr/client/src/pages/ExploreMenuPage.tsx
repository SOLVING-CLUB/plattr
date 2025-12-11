import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import BulkMeals from "@/pages/BulkMeal";
import MealBox from "@/pages/MealBoxPage";

type ExploreService = "bulk-meals" | "mealbox";

export default function ExploreMenuPage() {
  const [, setLocation] = useLocation();
  const [selectedService, setSelectedService] = useState<ExploreService>("bulk-meals");

  const handleNavigate = useCallback(
    (path: string, options?: { replace?: boolean }) => {
      if (path === "/bulk-meals") {
        setSelectedService("bulk-meals");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (path === "/mealbox") {
        setSelectedService("mealbox");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setLocation(path, options);
    },
    [setLocation]
  );

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      <div key={selectedService} className="min-h-screen">
        {selectedService === "bulk-meals" ? (
          <BulkMeals onNavigate={handleNavigate} />
        ) : (
          <MealBox onNavigate={handleNavigate} />
        )}
      </div>
    </div>
  );
}

