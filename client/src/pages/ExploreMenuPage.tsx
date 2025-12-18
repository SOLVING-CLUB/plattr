import { useCallback, useState, useEffect } from "react";
import { useLocation } from "wouter";
import BulkMeals from "@/pages/BulkMeal";
import MealBox from "@/pages/MealBoxPage";
import { checkExploreMenuAccess, GeoStatus, EXPLORE_MENU_RADIUS_KM } from "@/lib/geo";
import { Button } from "@/components/ui/button";
import { MapPin, RefreshCw, AlertCircle, Navigation } from "lucide-react";

type ExploreService = "bulk-meals" | "mealbox";

const SIXTY_MIN_ORDER_FLAG = "isSixtyMinOrder";

export default function ExploreMenuPage() {
  const [, setLocation] = useLocation();
  const [selectedService, setSelectedService] = useState<ExploreService>("bulk-meals");
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('pending');
  const [distance, setDistance] = useState<number | undefined>();
  const [geoError, setGeoError] = useState<string | undefined>();
  const [isChecking, setIsChecking] = useState(false);

  const checkLocation = useCallback(async () => {
    setIsChecking(true);
    setGeoStatus('checking');
    
    const result = await checkExploreMenuAccess();
    setGeoStatus(result.status);
    setDistance(result.distance);
    setGeoError(result.error);
    setIsChecking(false);
  }, []);

  useEffect(() => {
    checkLocation();
  }, [checkLocation]);

  useEffect(() => {
    if (geoStatus === 'in-range') {
      localStorage.setItem(SIXTY_MIN_ORDER_FLAG, "true");
    }
  }, [geoStatus]);

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

  if (geoStatus === 'pending' || geoStatus === 'checking') {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <Navigation className="w-8 h-8 text-amber-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: "Sweet Sans Pro" }}>
            Checking your location...
          </h2>
          <p className="text-gray-500 text-sm" style={{ fontFamily: "Sweet Sans Pro" }}>
            Please allow location access when prompted
          </p>
        </div>
      </div>
    );
  }

  if (geoStatus === 'out-of-range' || geoStatus === 'denied' || geoStatus === 'unavailable' || geoStatus === 'error') {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
            {geoStatus === 'out-of-range' ? (
              <MapPin className="w-10 h-10 text-red-500" />
            ) : (
              <AlertCircle className="w-10 h-10 text-red-500" />
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-3" style={{ fontFamily: "Sweet Sans Pro" }}>
            {geoStatus === 'out-of-range' 
              ? "Outside Service Area" 
              : geoStatus === 'denied'
              ? "Location Access Required"
              : "Location Unavailable"}
          </h2>
          
          <p className="text-gray-600 mb-4" style={{ fontFamily: "Sweet Sans Pro" }}>
            {geoStatus === 'out-of-range' ? (
              <>
                60-minute express delivery is only available within {EXPLORE_MENU_RADIUS_KM}km of our kitchen.
                {distance && (
                  <span className="block mt-2 text-sm text-gray-500">
                    You are currently {distance.toFixed(1)}km away.
                  </span>
                )}
              </>
            ) : geoStatus === 'denied' ? (
              "Please enable location access in your browser settings to use express delivery."
            ) : (
              geoError || "Unable to determine your location. Please try again."
            )}
          </p>

          <div className="space-y-3">
            <Button
              onClick={checkLocation}
              disabled={isChecking}
              className="w-full bg-[#1A9952] hover:bg-[#158544] text-white"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="button-retry-location"
            >
              {isChecking ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Try Again
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setLocation("/")}
              className="w-full"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="button-go-home"
            >
              Go to Home
            </Button>
          </div>

          <p className="mt-6 text-xs text-gray-400" style={{ fontFamily: "Sweet Sans Pro" }}>
            For regular delivery (2-3 hours), please order from the home page.
          </p>
        </div>
      </div>
    );
  }

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
