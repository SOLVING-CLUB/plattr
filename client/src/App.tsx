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
import { useEffect } from "react";

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
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;



// hello world