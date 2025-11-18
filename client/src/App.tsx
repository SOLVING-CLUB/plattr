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
import { useEffect, useState, useRef, type ComponentType, type ReactNode } from "react";

const bypassAuthEnv = import.meta.env.VITE_BYPASS_AUTH;
const BYPASS_AUTH =
  bypassAuthEnv === "true" ||
  (!bypassAuthEnv && import.meta.env.DEV);
const BYPASS_AUTH_USER_ID = import.meta.env.VITE_BYPASS_AUTH_USER_ID ?? "demo-user";
const BYPASS_AUTH_PHONE = import.meta.env.VITE_BYPASS_AUTH_PHONE ?? "9999999999";
const BYPASS_AUTH_USERNAME = import.meta.env.VITE_BYPASS_AUTH_USERNAME ?? "Demo User";

// Redirect component for /cart to /checkout
function CartRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation('/checkout');
  }, [setLocation]);
  return null;
}

const getIsAuthenticated = () => {
  if (BYPASS_AUTH) return true;
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("userId"));
};

function RequireAuth({
  children,
  redirectTo = "/phone",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const [, setLocation] = useLocation();
  const [isAllowed] = useState(() => getIsAuthenticated());

  useEffect(() => {
    if (!isAllowed) {
      setLocation(redirectTo, { replace: true });
    }
  }, [isAllowed, redirectTo, setLocation]);

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
}

function PublicOnly({
  children,
  redirectTo = "/",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const [, setLocation] = useLocation();
  const [canRender] = useState(() => !getIsAuthenticated());

  useEffect(() => {
    if (!canRender) {
      setLocation(redirectTo, { replace: true });
    }
  }, [canRender, redirectTo, setLocation]);

  if (!canRender) {
    return null;
  }

  return <>{children}</>;
}

const withAuthGuard =
  <P extends object>(Component: ComponentType<P>) =>
  (props: P) =>
    (
      <RequireAuth>
        <Component {...props} />
      </RequireAuth>
    );

const withPublicOnly =
  <P extends object>(Component: ComponentType<P>, redirectTo = "/") =>
  (props: P) =>
    (
      <PublicOnly redirectTo={redirectTo}>
        <Component {...props} />
      </PublicOnly>
    );

function Router() {
  // Handle Android back button globally
  useAndroidBackButton();

  const GuardedHomePage = withAuthGuard(HomePage);
  const GuardedAdminDashboard = withAuthGuard(AdminDashboard);
  const GuardedCategoryPage = withAuthGuard(CategoryPage);
  const GuardedDishesPage = withAuthGuard(DishesPage);
  const GuardedCheckoutPage = withAuthGuard(CheckoutPage);
  const GuardedPaymentPage = withAuthGuard(PaymentPage);
  const GuardedAddOnsPage = withAuthGuard(AddOnsPage);
  const GuardedOrdersPage = withAuthGuard(OrdersPage);
  const GuardedOrderDetailsPage = withAuthGuard(OrderDetailsPage);
  const GuardedProfilePage = withAuthGuard(ProfilePage);
  const GuardedHelpPage = withAuthGuard(HelpPage);
  const GuardedAboutPage = withAuthGuard(AboutPage);
  const GuardedReferralPage = withAuthGuard(ReferralPage);
  const GuardedCorporatePage = withAuthGuard(CorporatePage);
  const GuardedPlannerDetailPage = withAuthGuard(PlannerDetailPage);
  const GuardedOrderConfirmationPage = withAuthGuard(OrderConfirmationPage);
  const GuardedConciergeWizardPage = withAuthGuard(ConciergeWizardPage);
  const GuardedConciergeResultsPage = withAuthGuard(ConciergeResultsPage);
  const GuardedMealBoxPage = withAuthGuard(MealBoxPage);
  const GuardedMealBoxBuilderPage = withAuthGuard(MealBoxBuilderPage);
  const GuardedCartRedirect = withAuthGuard(CartRedirect);
  const GuardedNameScreen = withAuthGuard(NameScreen);
  const PublicAuthPage = withPublicOnly(AuthPage);
  const PublicPhoneScreen = withPublicOnly(PhoneScreen);
  const PublicVerificationScreen = withPublicOnly(VerificationScreen);

  return (
    <Switch>
      <Route path="/" component={GuardedHomePage} />
      <Route path="/auth" component={PublicAuthPage} />
      <Route path="/phone" component={PublicPhoneScreen} />
      <Route path="/verification" component={PublicVerificationScreen} />
      <Route path="/name" component={GuardedNameScreen} />
      <Route path="/cart" component={GuardedCartRedirect} />
      <Route path="/categories/:mealType" component={GuardedCategoryPage} />
      <Route path="/dishes/:mealType/:category" component={GuardedDishesPage} />
      <Route path="/planner/:mealType/:planType" component={GuardedPlannerDetailPage} />
      <Route path="/add-ons" component={GuardedAddOnsPage} />
      <Route path="/checkout" component={GuardedCheckoutPage} />
      <Route path="/payment" component={GuardedPaymentPage} />
      <Route path="/order-confirmation" component={GuardedOrderConfirmationPage} />
      <Route path="/orders" component={GuardedOrdersPage} />
      <Route path="/orders/:orderId" component={GuardedOrderDetailsPage} />
      <Route path="/profile" component={GuardedProfilePage} />
      <Route path="/help" component={GuardedHelpPage} />
      <Route path="/about" component={GuardedAboutPage} />
      <Route path="/referral" component={GuardedReferralPage} />
      <Route path="/corporate" component={GuardedCorporatePage} />
      <Route path="/concierge" component={GuardedConciergeWizardPage} />
      <Route path="/concierge/results" component={GuardedConciergeResultsPage} />
      <Route path="/concierge-results" component={GuardedConciergeResultsPage} />
      <Route path="/mealbox" component={GuardedMealBoxPage} />
      <Route path="/mealbox/builder" component={GuardedMealBoxBuilderPage} />
      <Route path="/admin" component={GuardedAdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [location, setLocation] = useLocation();
  const hasNavigatedFromSplash = useRef(false);

  useEffect(() => {
    if (!BYPASS_AUTH || typeof window === "undefined") return;

    if (!localStorage.getItem("userId")) {
      localStorage.setItem("userId", BYPASS_AUTH_USER_ID);
    }

    if (!localStorage.getItem("username")) {
      localStorage.setItem("username", BYPASS_AUTH_USERNAME);
    }

    if (!localStorage.getItem("phone")) {
      localStorage.setItem("phone", BYPASS_AUTH_PHONE);
    }
  }, [BYPASS_AUTH, BYPASS_AUTH_USER_ID, BYPASS_AUTH_USERNAME, BYPASS_AUTH_PHONE]);

  useEffect(() => {
    if (!BYPASS_AUTH) return;

    setShowSplash(false);
    hasNavigatedFromSplash.current = true;

    if (location && ["/phone", "/verification", "/name", "/auth"].includes(location)) {
      setLocation("/", { replace: true });
    }
  }, [BYPASS_AUTH, location, setLocation]);

  // Development mode - set to true to keep splash open for development
  // Set to false when you want normal splash behavior (2 seconds then fade)
  const DEV_MODE_SPLASH = true;
  
  // Check if we're in development mode (works in browser and Android emulator)
  // When DEV_MODE_SPLASH is true, always keep splash open regardless of environment
  const isDev = DEV_MODE_SPLASH || import.meta.env.DEV || window.location.hostname === '10.0.2.2' || window.location.hostname === 'localhost' || window.location.hostname.includes('192.168') || window.location.hostname.includes('10.');

  useEffect(() => {
    if (BYPASS_AUTH) return;

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
  }, [BYPASS_AUTH, DEV_MODE_SPLASH, setLocation, showSplash, location]);

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