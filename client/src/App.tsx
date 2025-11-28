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
import CateringPage from "@/pages/CateringPage";
import CateringThankYouPage from "@/pages/CateringThankYouPage";
import CorporateThankYouPage from "@/pages/CorporateThankYouPage";
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
import TestAuthPage from "@/pages/TestAuthPage";
import TestOtpPasswordPage from "@/pages/TestOtpPasswordPage";
import SplashScreen from "@/components/SplashScreen";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useRef, type ComponentType, type ReactNode } from "react";

// Simple auth guard - redirects to /test-auth if not authenticated
function RequireAuth({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading, initialized } = useAuth();

  useEffect(() => {
    if (initialized && !loading && !isAuthenticated) {
      setLocation('/test-auth', { replace: true });
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
        setLocation('/test-auth', { replace: true });
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

function Router() {
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
  const GuardedCateringPage = withAuthGuard(CateringPage);
  const GuardedPlannerDetailPage = withAuthGuard(PlannerDetailPage);
  const GuardedOrderConfirmationPage = withAuthGuard(OrderConfirmationPage);
  const GuardedConciergeWizardPage = withAuthGuard(ConciergeWizardPage);
  const GuardedConciergeResultsPage = withAuthGuard(ConciergeResultsPage);
  const GuardedMealBoxPage = withAuthGuard(MealBoxPage);
  const GuardedMealBoxBuilderPage = withAuthGuard(MealBoxBuilderPage);
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
    <Switch>
      <Route path="/" component={GuardedHomePage} />
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
      <Route path="/profile" component={GuardedProfilePage} />
      <Route path="/help" component={GuardedHelpPage} />
      <Route path="/about" component={GuardedAboutPage} />
      <Route path="/referral" component={GuardedReferralPage} />
      <Route path="/corporate" component={GuardedCorporatePage} />
      <Route path="/corporate-thank-you" component={CorporateThankYouPage} />
      <Route path="/catering" component={GuardedCateringPage} />
      <Route path="/catering-thank-you" component={CateringThankYouPage} />
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
  const [, setLocation] = useLocation();
  const splashCompleted = useRef(false);
  const { isAuthenticated, loading, initialized } = useAuth();

  // Force light theme only - ensure dark mode is never enabled
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  // Handle splash screen
  useEffect(() => {
    if (splashCompleted.current) return;

    // Wait for auth to initialize
    if (!initialized || loading) return;

    // Start fade out after 2 seconds
    const timer = setTimeout(() => {
      if (splashCompleted.current) return;
      
      setFadeOut(true);
      
      // After fade animation, hide splash and navigate
      setTimeout(() => {
        splashCompleted.current = true;
        setShowSplash(false);
        
        // Simple navigation logic:
        // - If authenticated → go to home
        // - If not authenticated → go to auth page
        if (isAuthenticated) {
          setLocation('/', { replace: true });
        } else {
          setLocation('/test-auth', { replace: true });
        }
      }, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [initialized, loading, isAuthenticated, setLocation]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      {showSplash && (
        <div
          className={`fixed inset-0 transition-opacity duration-500 ${
            fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{ zIndex: 10000 }}
        >
          <SplashScreen />
        </div>
      )}
      <Router />
    </QueryClientProvider>
  );
}

export default App;
