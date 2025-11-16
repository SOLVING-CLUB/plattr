import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAndroidBackButton } from "@/hooks/useAndroidBackButton";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import AdminDashboard from "@/pages/AdminDashboard";
import CategoryPage from "@/pages/CategoryPage";
import DishesPage from "@/pages/DishesPage";
import CheckoutPage from "@/pages/CheckoutPage";
import PaymentPage from "@/pages/PaymentPage";
import AddOnsPage from "@/pages/AddOnsPage";
import OrdersPage from "@/pages/OrdersPage";
import OrderDetailsPage from "@/pages/OrderDetailsPage";
import ProfilePage from "@/pages/ProfilePage";
import HelpPage from "@/pages/HelpPage";
import AboutPage from "@/pages/AboutPage";
import ReferralPage from "@/pages/ReferralPage";
import CorporatePage from "@/pages/CorporatePage";
import PlannerDetailPage from "@/pages/PlannerDetailPage";
import AuthPage from "@/pages/AuthPage";
import OrderConfirmationPage from "@/pages/OrderConfirmationPage";
import ConciergeWizardPage from "@/pages/ConciergeWizardPage";
import ConciergeResultsPage from "./pages/ConciergeResultsPage";
import MealBoxPage from "@/pages/MealBoxPage";
import MealBoxBuilderPage from "@/pages/MealBoxBuilderPage";
import VerificationScreen from "@/pages/VerificationScreen";
import PhoneScreen from "@/pages/PhoneScreen";
import NameScreen from "@/pages/NameScreen";
import SplashScreen from "@/components/SplashScreen";
import { useEffect, useState, useRef } from "react";

// Redirect component for /cart to /checkout
function CartRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation('/checkout');
  }, [setLocation]);
  return null;
}

function Router() {
  // Handle Android back button globally
  useAndroidBackButton();

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/phone" component={PhoneScreen} />
      <Route path="/verification" component={VerificationScreen} />
      <Route path="/name" component={NameScreen} />
      <Route path="/cart" component={CartRedirect} />
      <Route path="/categories/:mealType" component={CategoryPage} />
      <Route path="/dishes/:mealType/:category" component={DishesPage} />
      <Route path="/planner/:mealType/:planType" component={PlannerDetailPage} />
      <Route path="/add-ons" component={AddOnsPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/payment" component={PaymentPage} />
      <Route path="/order-confirmation" component={OrderConfirmationPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/orders/:orderId" component={OrderDetailsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/help" component={HelpPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/referral" component={ReferralPage} />
      <Route path="/corporate" component={CorporatePage} />
      <Route path="/concierge" component={ConciergeWizardPage} />
      <Route path="/concierge/results" component={ConciergeResultsPage} />
      <Route path="/concierge-results" component={ConciergeResultsPage} />
      <Route path="/mealbox" component={MealBoxPage} />
      <Route path="/mealbox/builder" component={MealBoxBuilderPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [location, setLocation] = useLocation();
  const hasNavigatedFromSplash = useRef(false);

  // Development mode - set to true to keep splash open for development
  // Set to false when you want normal splash behavior (2 seconds then fade)
  const DEV_MODE_SPLASH = true;
  
  // Check if we're in development mode (works in browser and Android emulator)
  // When DEV_MODE_SPLASH is true, always keep splash open regardless of environment
  const isDev = DEV_MODE_SPLASH || import.meta.env.DEV || window.location.hostname === '10.0.2.2' || window.location.hostname === 'localhost' || window.location.hostname.includes('192.168') || window.location.hostname.includes('10.');

  useEffect(() => {
    // Only set up navigation if splash is still showing
    if (!showSplash) return;
    
    // If user is on home page AND we've already navigated from splash, hide splash
    // This means user completed onboarding - don't show onboarding again
    if (location === '/' && hasNavigatedFromSplash.current) {
      setShowSplash(false);
      return;
    }
    
    // If user is on other pages (not onboarding routes), hide splash
    if (location !== '/' && location !== '/phone' && location !== '/verification' && location !== '/name') {
      setShowSplash(false);
      return;
    }
    
    // At this point, we're on '/', '/phone', '/verification', or '/name' route
    // This means user is in the onboarding flow or initial load - allow splash navigation

    // In dev mode, keep splash open so you can develop on it
    if (DEV_MODE_SPLASH) {
      // Splash stays open - you can manually hide it by clicking or pressing a key
      const handleClick = () => {
        // Only navigate if splash is still showing
        if (!showSplash) return;
        hasNavigatedFromSplash.current = true;
        setFadeOut(true);
        setTimeout(() => {
          setShowSplash(false);
          // Navigate to phone screen (first step of onboarding)
          setLocation('/phone');
        }, 500);
      };
      
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          if (!showSplash) return;
          handleClick();
        }
      };

      // Add touch event for mobile/emulator
      const handleTouch = () => {
        if (!showSplash) return;
        handleClick();
      };

      window.addEventListener('click', handleClick);
      window.addEventListener('touchstart', handleTouch);
      window.addEventListener('keydown', handleKeyPress);

      // Return cleanup - NO TIMER in dev mode!
      return () => {
        window.removeEventListener('click', handleClick);
        window.removeEventListener('touchstart', handleTouch);
        window.removeEventListener('keydown', handleKeyPress);
      };
    } else {
      // Normal behavior: Show splash screen for 2 seconds, then navigate to phone
      // This ONLY runs when DEV_MODE_SPLASH is false
      const timer = setTimeout(() => {
        // Only navigate if splash is still showing
        if (!showSplash) return;
        hasNavigatedFromSplash.current = true;
        setFadeOut(true);
        // Remove from DOM after fade animation completes, then navigate
        setTimeout(() => {
          setShowSplash(false);
          // Navigate to phone screen (first step of onboarding)
          setLocation('/phone');
        }, 500); // Match transition duration
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [DEV_MODE_SPLASH, setLocation, showSplash, location]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      {showSplash && (
        <div
          className={`transition-opacity duration-500 ${
            fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <SplashScreen />
        </div>
      )}
      <Router />
    </QueryClientProvider>
  );
}

export default App;



// hello world