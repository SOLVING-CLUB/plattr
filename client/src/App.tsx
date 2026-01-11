import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useAndroidBackButton } from "@/hooks/useAndroidBackButton";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { PageLoaderProvider, usePageLoader } from "@/components/PageLoader";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import AdminDashboard from "@/pages/AdminDashboard";
import CategoryPage from "@/pages/CategoryPage";
import Menu from "@/pages/Menu";
import DishesPage from "@/pages/DishesPage";
import CheckoutPage from "@/pages/CheckoutPage";
import PaymentPage from "@/pages/PaymentPage";
import AddOnsPage from "@/pages/AddOnsPage";
import OrdersPage from "@/pages/OrdersPage";
import OrderDetailsPage from "@/pages/OrderDetailsPage";
import BulkMealOrderDetailsPage from "@/pages/BulkMealOrderDetailsPage";
import ProfilePage from "@/pages/ProfilePage";
import EditProfile from "@/pages/EditProfile";
import SavedAddresses from "@/pages/SavedAddresses";
import PaymentMethods from "@/pages/PaymentMethods";
import HelpPage from "@/pages/HelpPage";
import AboutPage from "@/pages/AboutPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import LicensesPage from "@/pages/LicensesPage";
import ReferralPage from "@/pages/ReferralPage";
import CorporatePage from "@/pages/CorporatePage";
import CateringPage from "@/pages/CateringPage";
import CateringThankYouPage from "@/pages/CateringThankYouPage";
import CorporateThankYouPage from "@/pages/CorporateThankYouPage";
import PlannerDetailPage from "@/pages/PlannerDetailPage";
import AuthPage from "@/pages/AuthPage";
import OrderConfirmationPage from "@/pages/OrderConfirmationPage";
import ConciergeWizardPage from "@/pages/ConciergeWizardPage";
import ConciergeResultsPage from "./pages/ConciergeResultsPage";
import SmartMenuConcierge from "@/pages/SmartMenuConcierge";
import SmartMenuResults from "@/pages/SmartMenuResults";
import ExploreMenuPage from "@/pages/ExploreMenuPage";
import MealBoxPage from "@/pages/MealBoxPage";
import MealBoxBuilderPage from "@/pages/MealBoxBuilderPage";
import BulkMeal from "@/pages/BulkMeal";
import BulkMealCart from "@/pages/BulkMealCart";
import BulkMealAddons from "@/pages/BulkMealAddons";
import BulkMealDelivery from "@/pages/BulkMealDelivery";
import BulkMealThankyouPage from "@/pages/BulkMealThankyouPage";
import MealBoxThankyouPage from "@/pages/MealBoxThankyouPage";
import VerificationScreen from "@/pages/VerificationScreen";
import PhoneScreen from "@/pages/PhoneScreen";
import NameScreen from "@/pages/NameScreen";
import TestAuthPage from "@/pages/TestAuthPage";
import TestOtpPasswordPage from "@/pages/TestOtpPasswordPage";
import LocationPage from "@/pages/LocationPage";
import MapConfirmationPage from "@/pages/MapConfirmationPage";
import NotificationSettingsPage from "@/pages/NotificationSettingsPage";
import SplashScreen from "@/components/SplashScreen";
import { useAuth } from "@/hooks/useAuth";
import { CartProvider } from "@/context/CartContex";
import { NotificationHandler } from "@/components/NotificationHandler";
import { useEffect, useState, useRef, type ComponentType, type ReactNode } from "react";

// Simple auth guard - redirects to /phone if not authenticated
function RequireAuth({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading, initialized } = useAuth();

  useEffect(() => {
    if (initialized && !loading && !isAuthenticated) {
      setLocation('/phone', { replace: true });
    }
  }, [isAuthenticated, loading, initialized, setLocation]);

  if (!initialized || loading) {
    return null; // Show nothing while loading
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

// Simple public-only guard - redirects to / if authenticated
function PublicOnly({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading, initialized } = useAuth();

  useEffect(() => {
    if (initialized && !loading && isAuthenticated) {
      // If authenticated, redirect to home
      setLocation('/', { replace: true });
    }
  }, [isAuthenticated, loading, initialized, setLocation]);

  if (!initialized || loading) {
    return null;
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

// Name page guard - only allow if needsName flag is set
function RequireNeedsName({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading, initialized } = useAuth();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (initialized && !loading) {
      if (!isAuthenticated) {
        setLocation('/phone', { replace: true });
        return;
      }

      const needsName = sessionStorage.getItem('needsName');
      if (needsName === 'true') {
        setShouldRender(true);
      } else {
        // User doesn't need to set name, redirect to home
        setLocation('/', { replace: true });
      }
    }
  }, [isAuthenticated, loading, initialized, setLocation]);

  if (!initialized || loading || !shouldRender) {
    return null;
  }

  return <>{children}</>;
}

const withAuthGuard = <P extends object>(Component: ComponentType<P>) => (props: P) => (
      <RequireAuth>
        <Component {...props} />
      </RequireAuth>
    );

const withPublicOnly = <P extends object>(Component: ComponentType<P>) => (props: P) => (
  <PublicOnly>
        <Component {...props} />
      </PublicOnly>
    );

const withNeedsName = <P extends object>(Component: ComponentType<P>) => (props: P) => (
  <RequireNeedsName>
    <Component {...props} />
  </RequireNeedsName>
);

// Scroll to top on every route change and show page loader
function ScrollToTop() {
  const [location] = useLocation();
  const { showLoader, hideLoader } = usePageLoader();
  const previousLocation = useRef(location);
  
  useEffect(() => {
    // Show loader when location changes
    if (previousLocation.current !== location) {
      showLoader();
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      
      // Hide loader after a short delay (simulates page load)
      const timer = setTimeout(() => {
        hideLoader();
      }, 300);
      
      previousLocation.current = location;
      return () => clearTimeout(timer);
    }
  }, [location, showLoader, hideLoader]);
  
  return null;
}

function Router() {
  useAndroidBackButton();
  
  // Disable browser's native scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  const GuardedHomePage = withAuthGuard(HomePage);
  const GuardedAdminDashboard = withAuthGuard(AdminDashboard);
  const GuardedCategoryPage = withAuthGuard(CategoryPage);
  const GuardedMenuPage = withAuthGuard(Menu);
  const GuardedDishesPage = withAuthGuard(DishesPage);
  const GuardedCheckoutPage = withAuthGuard(CheckoutPage);
  const GuardedPaymentPage = withAuthGuard(PaymentPage);
  const GuardedAddOnsPage = withAuthGuard(AddOnsPage);
  const GuardedOrdersPage = withAuthGuard(OrdersPage);
  const GuardedOrderDetailsPage = withAuthGuard(OrderDetailsPage);
  const GuardedBulkMealOrderDetailsPage = withAuthGuard(BulkMealOrderDetailsPage);
  const GuardedProfilePage = withAuthGuard(ProfilePage);
  const GuardedEditProfile = withAuthGuard(EditProfile);
  const GuardedNotificationSettingsPage = withAuthGuard(NotificationSettingsPage);
  const GuardedSavedAddresses = withAuthGuard(SavedAddresses);
  const GuardedLocationPage = withAuthGuard(LocationPage);
  const GuardedMapConfirmationPage = withAuthGuard(MapConfirmationPage);
  const GuardedPaymentMethods = withAuthGuard(PaymentMethods);
  const GuardedHelpPage = withAuthGuard(HelpPage);
  const GuardedAboutPage = withAuthGuard(AboutPage);
  const GuardedTermsPage = withAuthGuard(TermsPage);
  const GuardedPrivacyPage = withAuthGuard(PrivacyPage);
  const GuardedLicensesPage = withAuthGuard(LicensesPage);
  const GuardedReferralPage = withAuthGuard(ReferralPage);
  const GuardedCorporatePage = withAuthGuard(CorporatePage);
  const GuardedCateringPage = withAuthGuard(CateringPage);
  const GuardedPlannerDetailPage = withAuthGuard(PlannerDetailPage);
  const GuardedOrderConfirmationPage = withAuthGuard(OrderConfirmationPage);
  const GuardedConciergeWizardPage = withAuthGuard(ConciergeWizardPage);
  const GuardedConciergeResultsPage = withAuthGuard(ConciergeResultsPage);
  const GuardedSmartMenuConcierge = withAuthGuard(SmartMenuConcierge);
  const GuardedSmartMenuResults = withAuthGuard(SmartMenuResults);
  const GuardedExploreMenuPage = withAuthGuard(ExploreMenuPage);
  const GuardedMealBoxPage = withAuthGuard(MealBoxPage);
  const GuardedMealBoxBuilderPage = withAuthGuard(MealBoxBuilderPage);
  const GuardedBulkMeal = withAuthGuard(BulkMeal);
  const GuardedBulkMealCart = withAuthGuard(BulkMealCart);
  const GuardedBulkMealAddons = withAuthGuard(BulkMealAddons);
  const GuardedBulkMealDelivery = withAuthGuard(BulkMealDelivery);
  const GuardedBulkMealThankyouPage = withAuthGuard(BulkMealThankyouPage);
  const GuardedCartRedirect = withAuthGuard(() => {
    const [, setLocation] = useLocation();
    useEffect(() => { setLocation('/checkout'); }, [setLocation]);
    return null;
  });

  // Public auth pages - TestAuthPage handles its own redirects (for email verification flow)
  const PublicAuthPage = withPublicOnly(AuthPage);
  const PublicPhoneScreen = withPublicOnly(PhoneScreen);
  const PublicVerificationScreen = withPublicOnly(VerificationScreen);

  // Name screen - only accessible during signup flow
  const GuardedNameScreen = withNeedsName(NameScreen);

  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={GuardedHomePage} />
      <Route path="/menu" component={GuardedMenuPage} />
      <Route path="/explore-menu" component={GuardedExploreMenuPage} />
      <Route path="/test-auth" component={TestAuthPage} />
      <Route path="/test-otp-password" component={TestOtpPasswordPage} />
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
      <Route path="/bulk-orders/:orderId" component={GuardedBulkMealOrderDetailsPage} />
      <Route path="/profile" component={GuardedProfilePage} />
      <Route path="/edit-profile" component={GuardedEditProfile} />
      <Route path="/notification-settings" component={GuardedNotificationSettingsPage} />
      <Route path="/saved-addresses" component={GuardedSavedAddresses} />
      <Route path="/location" component={GuardedLocationPage} />
      <Route path="/location/map" component={GuardedMapConfirmationPage} />
      <Route path="/payment-methods" component={GuardedPaymentMethods} />
      <Route path="/help" component={GuardedHelpPage} />
      <Route path="/about" component={GuardedAboutPage} />
      <Route path="/terms" component={GuardedTermsPage} />
      <Route path="/privacy" component={GuardedPrivacyPage} />
      <Route path="/licenses" component={GuardedLicensesPage} />
      <Route path="/referral" component={GuardedReferralPage} />
      <Route path="/corporate" component={GuardedCorporatePage} />
      <Route path="/corporate-thank-you" component={CorporateThankYouPage} />
      <Route path="/catering" component={GuardedCateringPage} />
      <Route path="/catering-thank-you" component={CateringThankYouPage} />
      <Route path="/concierge" component={GuardedConciergeWizardPage} />
      <Route path="/ai-planner" component={GuardedConciergeWizardPage} />
      <Route path="/concierge/results" component={GuardedConciergeResultsPage} />
      <Route path="/concierge-results" component={GuardedConciergeResultsPage} />
      <Route path="/ai-planner-results" component={GuardedConciergeResultsPage} />
      <Route path="/smart-menu-concierge" component={GuardedSmartMenuConcierge} />
      <Route path="/smart-menu-results" component={GuardedSmartMenuResults} />
      <Route path="/mealbox" component={GuardedMealBoxPage} />
      <Route path="/mealbox/builder" component={GuardedMealBoxBuilderPage} />
      <Route path="/mealbox-thank-you" component={MealBoxThankyouPage} />
      <Route path="/bulk-meals" component={GuardedBulkMeal} />
      <Route path="/bulk-meals-cart" component={GuardedBulkMealCart} />
      <Route path="/bulk-meals-addons" component={GuardedBulkMealAddons} />
      <Route path="/bulk-meals-delivery" component={GuardedBulkMealDelivery} />
      <Route path="/bulk-meals-thank-you" component={GuardedBulkMealThankyouPage} />
      <Route path="/admin" component={GuardedAdminDashboard} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  const [fadeOut, setFadeOut] = useState(false);
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading, initialized } = useAuth();
  
  useSwipeBack();
  
  // Check sessionStorage ONCE on mount - if splash was seen, never show it
  const [showSplash, setShowSplash] = useState(() => {
    const alreadySeen = sessionStorage.getItem('splashSeen') === 'true';
    if (!alreadySeen) {
      // Mark as seen IMMEDIATELY to prevent any race conditions
      sessionStorage.setItem('splashSeen', 'true');
      return true;
    }
    return false;
  });

  // Force light theme only - ensure dark mode is never enabled
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  // Handle splash screen video end
  const handleVideoEnd = () => {
    if (!showSplash) return;
    
    setFadeOut(true);
    
    // After fade animation, hide splash and navigate
    setTimeout(() => {
      setShowSplash(false);
      
      // Simple navigation logic:
      // - If authenticated → go to home
      // - If not authenticated → go to phone screen (WhatsApp login)
      if (isAuthenticated) {
        setLocation('/', { replace: true });
      } else {
        setLocation('/phone', { replace: true });
      }
    }, 500);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <PageLoaderProvider>
          <Toaster />
          <NotificationHandler />
          {showSplash && (
            <div
              className={`fixed inset-0 transition-opacity duration-500 ${
                fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
              style={{ zIndex: 10000 }}
            >
              <SplashScreen onVideoEnd={handleVideoEnd} />
            </div>
          )}
          <Router />
        </PageLoaderProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
