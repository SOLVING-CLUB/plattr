import { useCallback, useState, useEffect } from "react";
import { useLocation } from "wouter";
import BulkMeals from "@/pages/BulkMeal";
import MealBox from "@/pages/MealBoxPage";

type ExploreService = "bulk-meals" | "mealbox";

const SIXTY_MIN_ORDER_FLAG = "isSixtyMinOrder";

export default function ExploreMenuPage() {
  const [, setLocation] = useLocation();
  const [selectedService, setSelectedService] = useState<ExploreService>("bulk-meals");

  // Set flag when entering this page - orders from here are 60-min delivery
  useEffect(() => {
    localStorage.setItem(SIXTY_MIN_ORDER_FLAG, "true");
    return () => {
      // Don't remove on unmount - let it persist until order is completed or cleared
    };
  }, []);

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

