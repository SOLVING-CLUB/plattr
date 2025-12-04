import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight, Clock, MapPin, CreditCard, Bell, Pencil, HelpCircle, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { userService } from "@/lib/supabase-service";
import { supabaseAuth } from "@/lib/supabase-auth";
import { useToast } from "@/hooks/use-toast";
import FloatingNav from "@/pages/FloatingNav";

import sunburstBg from "@assets/image 1684_1764062792375.png";
import chopstickHand from "@assets/envato-labs-image-edit - 2025-11-10T182754.233 4_1764062144500.png";
import forkHand from "@assets/envato-labs-image-edit - 2025-11-10T183100.943_1764062144501.png";
import logoImage from "@assets/TE-Vintage-01 1_1764062144502.png";

interface MenuItem {
  id: string;
  label: string;
  icon: typeof Clock;
  hasChevron: boolean;
}

const menuItems: MenuItem[] = [
  { id: "order-history", label: "Order History", icon: Clock, hasChevron: true },
  { id: "saved-addresses", label: "Saved Addresses", icon: MapPin, hasChevron: true },
  { id: "payment-methods", label: "Payment Methods", icon: CreditCard, hasChevron: true },
  { id: "notifications", label: "Notifications", icon: Bell, hasChevron: false },
];

interface UserProfile {
  id: string;
  username: string;
  phone: string | null;
  email: string | null;
  isVerified: boolean;
}

export default function Profile() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("profile");
  const { toast } = useToast();

  const handleTabChange = (tab: "home" | "menu" | "profile") => {
    setActiveTab(tab);
    if (tab === "home") {
      setLocation("/");
    } else if (tab === "menu") {
      setLocation("/menu");
    }
  };

  const handleLogout = async () => {
    try {
      // Set flag to prevent auto-redirect on test-auth page
      sessionStorage.setItem('justLoggedOut', 'true');

      // Sign out from Supabase
      const { error } = await supabaseAuth.auth.signOut();
      
      if (error) {
        throw error;
      }

      // Clear all local storage
      localStorage.clear();
      // Keep justLoggedOut flag for now, will be cleared by test-auth page
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('phone');
      sessionStorage.removeItem('email');
      sessionStorage.removeItem('needsName');

      // Wait a moment for auth state to update
      await new Promise(resolve => setTimeout(resolve, 300));

      // Show success message
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });

      // Redirect to test-auth page (entry point for unauthenticated users)
      setLocation("/test-auth", { replace: true });
    } catch (error: any) {
      console.error("Logout error:", error);
      sessionStorage.removeItem('justLoggedOut');
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message || "Failed to logout. Please try again.",
      });
    }
  };

  // Fetch user profile
  const { data: userData, isLoading } = useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: () => userService.getProfile(),
  });

  // Format phone number for display
  const formatPhone = (phone: string | null) => {
    if (!phone) return "Not provided";
    if (phone.length === 10) {
      return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
  };

  // Format name for display (use username as fallback)
  const displayName = userData?.username || "User";
  const displayPhone = formatPhone(userData?.phone);
  const displayEmail = userData?.email || "Not provided";

  return (
    <div className="h-screen overflow-hidden pb-20 relative flex flex-col">
      {/* Header Section - Solid gradient without sunburst */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            background: "linear-gradient(180deg, #562B00 0%, #DD6D02 100%)"
          }}
        />

        {/* Logo Watermark */}
        <div className="absolute right-0 top-0 w-72 h-72 opacity-50" style={{ marginRight: "10px", marginTop: "-20px" }}>
          <img
            src={logoImage}
            alt=""
            className="w-full h-full object-contain"
          />
        </div>

        {/* User Info */}
        <div className="relative z-10 px-5 pt-12 pb-8">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-7 bg-white/20 rounded animate-pulse" />
              <div className="h-4 bg-white/20 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-white/20 rounded animate-pulse w-2/3" />
            </div>
          ) : (
            <>
          <h1 
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: "Sweet Sans Pro" }}
            data-testid="text-user-name"
          >
                {displayName}
          </h1>
          <p 
            className="text-white/90 text-sm mb-1"
            style={{ fontFamily: "Sweet Sans Pro" }}
            data-testid="text-user-phone"
          >
                {displayPhone}
          </p>
          <p 
            className="text-white/90 text-sm mb-4"
            style={{ fontFamily: "Sweet Sans Pro" }}
            data-testid="text-user-email"
          >
                {displayEmail}
          </p>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="default"
              size="sm"
              className="rounded-full px-4 py-2 h-auto"
              style={{
                fontFamily: "Sweet Sans Pro",
                backgroundColor: "#1A3A2F",
                color: "white"
              }}
              onClick={() => setLocation("/edit-profile")}
              data-testid="button-edit-profile"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              EDIT PROFILE
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-4 py-2 h-auto bg-white border-white"
              style={{
                fontFamily: "Sweet Sans Pro",
                color: "#1A3A2F"
              }}
              data-testid="button-help"
            >
              <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
              HELP
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-4 py-2 h-auto bg-white/10 border-white/30 backdrop-blur-sm"
              style={{
                fontFamily: "Sweet Sans Pro",
                color: "white"
              }}
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              LOGOUT
            </Button>
          </div>
        </div>

        {/* Scalloped/Notepad Edge */}
        <div className="relative h-5 -mb-1">
          <svg
            className="absolute bottom-0 w-full"
            viewBox="0 0 400 20"
            preserveAspectRatio="none"
            style={{ height: "20px" }}
          >
            <defs>
              <pattern id="scallop" x="0" y="0" width="25" height="20" patternUnits="userSpaceOnUse">
                <circle cx="12.5" cy="20" r="10" fill="#FDF8F3" />
              </pattern>
            </defs>
            <rect x="0" y="10" width="400" height="10" fill="#FDF8F3" />
            <rect x="0" y="0" width="400" height="20" fill="url(#scallop)" />
          </svg>
        </div>
      </div>

      {/* Content Section with Sunburst Background - Covers remaining page */}
      <div className="relative flex-1 h-full">
        {/* Sunburst Background for content area */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <img
            src={sunburstBg}
            alt=""
            className="w-full h-full object-cover object-bottom"
          />
        </div>

        {/* Menu Items */}
        <div className="relative z-10 px-4 py-4">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {menuItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "order-history") {
                    setLocation("/orders");
                  } else if (item.id === "saved-addresses") {
                    setLocation("/saved-addresses");
                  } else if (item.id === "payment-methods") {
                    setLocation("/payment-methods");
                  }
                }}
                className={`w-full flex items-center justify-between px-5 py-4 hover-elevate ${
                  index < menuItems.length - 1 ? "border-b border-gray-100" : ""
                }`}
                style={{ fontFamily: "Sweet Sans Pro" }}
                data-testid={`button-${item.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 flex items-center justify-center">
                    {item.id === "order-history" ? (
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <Clock className="w-5 h-5 text-gray-600 -ml-2" />
                      </div>
                    ) : (
                      <item.icon className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <span className="text-gray-800 font-medium">{item.label}</span>
                </div>
                {item.hasChevron && (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Illustrations - Edge to edge */}
        <div className="fixed bottom-20 left-0 right-0 flex justify-between items-end pointer-events-none">
          <img
            src={chopstickHand}
            alt=""
            className="w-40 h-auto object-contain -ml-2"
          />
          <img
            src={forkHand}
            alt=""
            className="w-40 h-auto object-contain -mr-2"
          />
        </div>
      </div>

      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}