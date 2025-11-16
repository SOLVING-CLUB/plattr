import {
  Search,
  Mic,
  ShoppingCart,
  MapPin,
  ChevronRight,
  Home as HomeIcon,
  Menu as MenuIcon,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import homepageBackgroundImage from "@assets/homepage_background.png";
import mealBoxCardImage from "@assets/mealBoxCard.svg";
import bulkMealImage from "@assets/bulk_meal.svg";

// Checker pattern - using CSS pattern if image doesn't exist
// If you have the image, replace this with: import checkerPattern from "@assets/Group 2087328978_1763131515041.png";
const checkerPattern = "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";

const SERVICES = [
  {
    id: "mealbox",
    title: "MealBox",
    subtitle: "Custom-packed meals",
    image: mealBoxCardImage,
    bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
  },
  {
    id: "bulk",
    title: "Bulk Meal Delivery",
    subtitle: "Order large portions",
    image: bulkMealImage,
    bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
  },
  {
    id: "catering",
    title: "Catering",
    subtitle: "End-to-end service",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
    bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
  },
  {
    id: "corporate",
    title: "Corporate Order",
    subtitle: "Customizations & more",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
    bgColor: "bg-gradient-to-br from-green-50 to-green-100",
  },
];

export default function HomePage() {
  const [location, setLocation] = useLocation();

  const currentTab =
    location === "/" ? "home" : location === "/menu" ? "menu" : "profile";

  // Only render bottom nav when we're actually on the home route
  const showBottomNav = location === "/";

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with Background Image */}
      <div
        className="relative overflow-hidden"
        style={{
          width: "100%",
          height: "200px",
          borderBottomLeftRadius: "50px",
          borderBottomRightRadius: "50px",
          backgroundImage: `url(${homepageBackgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        data-testid="header-section"
      >
        {/* Checkered Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${checkerPattern})`,
            backgroundSize: "60px 60px",
            backgroundRepeat: "repeat",
          }}
        />

        {/* Header Content */}
        <div className="relative z-10 h-full">
          {/* Location */}
          <div
            className="absolute flex items-center"
            style={{
              width: "175px",
              height: "34px",
              top: "74px",
              left: "15px",
              gap: "4px",
              paddingTop: "5px",
              paddingRight: "10px",
              paddingBottom: "5px",
              paddingLeft: "10px",
            }}
            data-testid="container-location"
          >
            <MapPin className="w-5 h-5" style={{ color: "#000" }} />
            <span
              style={{
                color: "#000",
                fontFamily: "Sweet Sans Pro, -apple-system, sans-serif",
                fontWeight: 700,
                fontSize: "20px",
                lineHeight: "100%",
                letterSpacing: "-0.75px",
                textAlign: "center",
              }}
              data-testid="text-location"
            >
              Bengaluru, KA
            </span>
          </div>

          {/* Cart Button */}
          <div
            className="absolute"
            style={{
              width: "40px",
              height: "40px",
              top: "69px",
              left: "338px",
            }}
          >
            <Button
              size="icon"
              className="rounded-full w-full h-full"
              style={{ backgroundColor: "#1a4d2e", color: "#fff" }}
              data-testid="button-cart"
              onClick={() => setLocation("/checkout")}
            >
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </div>

          {/* Search Bar */}
          <div
            className="absolute bg-white flex items-center"
            style={{
              width: "363px",
              height: "40px",
              top: "129px",
              left: "15px",
              justifyContent: "space-between",
              borderRadius: "5px",
              borderWidth: "0.5px",
              borderColor: "#e5e7eb",
              borderStyle: "solid",
              padding: "8px",
            }}
            data-testid="search-bar"
          >
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="border-0 p-0 focus-visible:ring-0 text-sm flex-1"
                style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}
                data-testid="input-search"
              />
            </div>
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-muted-foreground" />
              <Badge
                variant="outline"
                className="bg-white border-green-600 text-green-600 font-semibold px-2 text-xs"
                data-testid="badge-veg"
              >
                VEG
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="max-w-[393px] mx-auto relative" style={{ minHeight: "500px" }}>
        {/* MealBox Card - Left side */}
        <div
          style={{
            position: "absolute",
            width: "175px",
            height: "145px",
            top: "80px",
            left: "15px",
            borderRadius: "15px",
            cursor: "pointer",
            overflow: "hidden",
          }}
          onClick={() => setLocation("/mealbox")}
          data-testid="card-service-mealbox"
        >
          <img
            src={mealBoxCardImage}
            alt="MealBox"
            className="w-full h-full object-cover"
            style={{ borderRadius: "15px" }}
            data-testid="img-service-mealbox"
          />
        </div>

        {/* Bulk Meal Delivery Card - Right side, same row */}
        <div
          style={{
            position: "absolute",
            width: "179px",
            height: "300px",
            top: "80px",
            left: "200px",
            borderRadius: "15px",
            borderWidth: "0.5px",
            borderStyle: "solid",
            borderColor: "#e5e7eb",
            cursor: "pointer",
            overflow: "hidden",
          }}
          onClick={() => setLocation("/catering")}
          data-testid="card-service-bulk"
        >
          <img
            src={bulkMealImage}
            alt="Bulk Meal Delivery"
            className="w-full h-full object-cover"
            style={{ borderRadius: "15px" }}
            data-testid="img-service-bulk"
          />
        </div>
      </div>
    

      {/* Bottom Navigation - Only show on home route */}
      {showBottomNav && location === "/" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border" style={{ zIndex: 50 }}>
          <div className="max-w-[393px] mx-auto px-4 py-3 flex items-center justify-around">
            <Button
              variant={currentTab === "home" ? "default" : "ghost"}
              className={`flex items-center gap-2 ${
                currentTab === "home"
                  ? "bg-green-700 hover:bg-green-800 text-white"
                  : "text-muted-foreground"
              }`}
              onClick={() => setLocation("/")}
              data-testid="button-nav-home"
            >
              <HomeIcon className="w-5 h-5" />
              <span className="font-medium" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>Home</span>
            </Button>
            <Button
              variant={currentTab === "menu" ? "default" : "ghost"}
              className={`flex items-center gap-2 ${
                currentTab === "menu"
                  ? "bg-green-700 hover:bg-green-800 text-white"
                  : "text-muted-foreground"
              }`}
              onClick={() => setLocation("/categories/tiffins")}
              data-testid="button-nav-menu"
            >
              <MenuIcon className="w-5 h-5" />
              <span className="font-medium" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>Menu</span>
            </Button>
            <Button
              variant={currentTab === "profile" ? "default" : "ghost"}
              className={`flex items-center gap-2 ${
                currentTab === "profile"
                  ? "bg-green-700 hover:bg-green-800 text-white"
                  : "text-muted-foreground"
              }`}
              onClick={() => setLocation("/profile")}
              data-testid="button-nav-profile"
            >
              <User className="w-5 h-5" />
              <span className="font-medium" style={{ fontFamily: "Sweet Sans Pro, -apple-system, sans-serif" }}>Profile</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
