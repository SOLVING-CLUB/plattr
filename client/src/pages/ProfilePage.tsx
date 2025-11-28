import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";
import AppHeader from "@/components/AppHeader";
import { User, MapPin, CreditCard, Bell, HelpCircle, LogOut, ChevronRight, Package, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, queryClient } from "@/lib/queryClient";
import { cartStorage } from "@/lib/cartStorage";
import { supabaseAuth } from "@/lib/supabase-auth";
import type { Dish, Category } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  quantity: number;
  dish: Dish;
  category: Category;
}

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setLocation('/');
    } else if (tab === 'categories') {
      setLocation('/categories/tiffins');
    }
  };

  // Fetch cart items (session-based authentication)
  const { data: apiCartItems } = useQuery<CartItem[] | null>({
    queryKey: ['/api/cart'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Use server cart for authenticated users, localStorage for guests only
  const cartItems = apiCartItems !== null && apiCartItems !== undefined
    ? apiCartItems // Authenticated: use server cart only (even if empty)
    : apiCartItems === null // Guest: use localStorage
      ? cartStorage.getCart().map(item => ({
          id: `local-${item.dishId}`,
          quantity: item.quantity,
          dish: item.dish,
          category: { id: item.dish.categoryId, name: item.dish.categoryId } as Category,
        }))
      : []; // Loading: empty array

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      // Best practice: Sign out from Supabase first (this clears the session)
      try {
        const { error } = await supabaseAuth.auth.signOut();
        if (error) throw error;
      } catch (error) {
        console.error("Supabase auth signout error:", error);
        // Continue with cleanup even if Supabase signout fails
      }

      // Logout from backend API
      try {
        await apiRequest("POST", "/api/auth/logout");
      } catch (error) {
        console.log("Backend logout:", error);
      }

      // Clear all storage (Supabase signOut should handle this, but clear for safety)
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      localStorage.removeItem("phone");
      localStorage.removeItem("email");
      sessionStorage.clear();
      cartStorage.clearCart();
      queryClient.clear();

      toast({
        title: "Logged out",
        description: "You have been signed out successfully.",
      });

      // Navigate to splash screen (which will then navigate to test-auth)
      // Clear splash state by reloading the page
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (error) {
      console.error("❌ Logout failed:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "Please try again.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const menuItems = [
    { 
      icon: Package, 
      label: 'Order History', 
      onClick: () => setLocation('/orders'),
      testId: 'menu-item-order-history'
    },
    { 
      icon: User, 
      label: 'Account Details', 
      onClick: () => console.log('Account details'),
      testId: 'menu-item-account-details'
    },
    { 
      icon: MapPin, 
      label: 'Saved Addresses', 
      onClick: () => console.log('Addresses'),
      testId: 'menu-item-saved-addresses'
    },
    { 
      icon: CreditCard, 
      label: 'Payment Methods', 
      onClick: () => console.log('Payment methods'),
      testId: 'menu-item-payment-methods'
    },
    { 
      icon: Bell, 
      label: 'Notifications', 
      onClick: () => console.log('Notifications'),
      testId: 'menu-item-notifications'
    },
    { 
      icon: HelpCircle, 
      label: 'Help & Support', 
      onClick: () => setLocation('/help'),
      testId: 'menu-item-help-support'
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      <AppHeader 
        cartItemCount={totalItems}
        onCartClick={() => setLocation('/categories/tiffins')}
      />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <Card className="p-6 mb-6" data-testid="card-profile">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                RK
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold font-serif mb-1" data-testid="text-user-name">Rahul Kumar</h2>
              <p className="text-sm text-muted-foreground" data-testid="text-user-email">rahul.kumar@example.com</p>
              <p className="text-sm text-muted-foreground" data-testid="text-user-phone">+91 98765 43210</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" data-testid="button-edit-profile">
            Edit Profile
          </Button>
        </Card>

        {/* Menu Items */}
        <div className="space-y-2 mb-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card 
                key={item.label}
                className="p-4 cursor-pointer hover-elevate active-elevate-2"
                onClick={item.onClick}
                data-testid={item.testId}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 font-medium">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>
            );
          })}
        </div>


        {/* Logout & Delete Account */}
        <Button 
          variant="destructive" 
          className="w-full"
          onClick={handleLogout}
          disabled={isLoggingOut}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Button>

        <div className="h-3" />

        <Button 
          variant="outline" 
          className="w-full border-red-600 text-red-600 hover:bg-red-50"
          onClick={async () => {
            const confirmed = window.confirm('Delete your account and all data? This cannot be undone.');
            if (!confirmed) return;
            try {
              await apiRequest('DELETE', '/api/account');
              alert('Your account has been deleted.');
              setLocation('/');
            } catch (e) {
              alert('Failed to delete account. Please try again.');
            }
          }}
          data-testid="button-delete-account"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </Button>
      </main>

      <BottomNav 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        cartItemCount={totalItems}
      />
    </div>
  );
}
