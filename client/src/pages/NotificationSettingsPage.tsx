import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNotifications } from "@/hooks/useNotifications";
import { notificationService } from "@/lib/notifications/service";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { supabaseAuth } from "@/lib/supabase-auth";
import { TestTube } from "lucide-react";
import FloatingNav from "@/pages/FloatingNav";

export default function NotificationSettingsPage() {
  const [, setLocation] = useLocation();
  const { preferences, updatePreferences } = useNotifications();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("profile");
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleTabChange = (tab: "home" | "menu" | "profile") => {
    setActiveTab(tab);
    if (tab === "home") {
      setLocation("/");
    } else if (tab === "menu") {
      setLocation("/menu");
    } else if (tab === "profile") {
      setLocation("/profile");
    }
  };

  const handleToggle = async (key: keyof typeof preferences, value: boolean) => {
    const newPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(newPreferences);
    
    try {
      await updatePreferences({ [key]: value });
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update preferences. Please try again.",
      });
      // Revert on error
      setLocalPreferences(preferences);
    }
  };

  const handleTestNotification = async () => {
    try {
      const { data: { session } } = await supabaseAuth.auth.getSession();
      const userId = session?.user?.id || localStorage.getItem('userId');
      
      if (!userId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please log in first",
        });
        return;
      }

      const deviceToken = notificationService.getDeviceToken();
      if (!deviceToken) {
        toast({
          variant: "destructive",
          title: "No Device Token",
          description: "Device token not registered. Make sure notifications are enabled in app settings.",
        });
        return;
      }

      toast({
        title: "Sending test notification...",
        description: "Check your device in a few seconds",
      });

      try {
        // Use Supabase Edge Function instead of Express backend
        const { data, error } = await supabaseAuth.functions.invoke('send-notification', {
          body: {
            user_id: userId,
            title: "Test Notification 🎉",
            body: "If you see this, notifications are working!",
            event_name: 'test_notification',
            category: 'transactional',
            deep_link: 'plattr://test'
          }
        });

        if (error) {
          throw new Error(error.message || "Failed to send notification");
        }

        if (data?.success) {
          toast({
            title: "Test sent!",
            description: `Notification sent to ${data.sent || 0} device(s). Check your notifications.`,
          });
        } else {
          throw new Error(data?.error || "Failed to send");
        }
      } catch (apiError: any) {
        // If Edge Function not available, show helpful message
        if (apiError.message?.includes('Edge Function') || apiError.message?.includes('not found')) {
          toast({
            variant: "destructive",
            title: "Edge Function Not Deployed",
            description: "Deploy send-notification function or use Firebase Console to test.",
          });
          console.log('Device Token for Firebase Console:', deviceToken);
        } else {
          throw apiError;
        }
      }
    } catch (error: any) {
      console.error("Test notification error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send test notification. Check console for device token.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-16 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setLocation("/profile")}
            className="p-1"
            data-testid="button-back-profile"
          >
            <ChevronLeft className="w-6 h-6 text-[#1C1C1C]" />
          </button>
          <h1
            className="text-lg font-semibold text-[#1C1C1C]"
            style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
            data-testid="text-page-title"
          >
            Notification Settings
          </h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="px-4 mt-4 space-y-4">
        {/* Order Updates (Transactional) */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <Label
                htmlFor="order-updates"
                className="text-base font-semibold text-[#1C1C1C]"
                style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
              >
                Order Updates
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Get notified about your order status, delivery updates, and important order information.
              </p>
            </div>
            <Switch
              id="order-updates"
              checked={localPreferences.order_updates}
              onCheckedChange={(checked) => handleToggle("order_updates", checked)}
            />
          </div>
        </div>

        {/* Offers & Promotions (Marketing) */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <Label
                htmlFor="offers-promotions"
                className="text-base font-semibold text-[#1C1C1C]"
                style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
              >
                Offers & Promotions
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Receive notifications about special offers, discounts, and promotional campaigns.
              </p>
            </div>
            <Switch
              id="offers-promotions"
              checked={localPreferences.offers_promotions}
              onCheckedChange={(checked) => handleToggle("offers_promotions", checked)}
            />
          </div>
        </div>

        {/* Menu Recommendations (Marketing) */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <Label
                htmlFor="menu-recommendations"
                className="text-base font-semibold text-[#1C1C1C]"
                style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
              >
                Menu Recommendations
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Get suggestions for new dishes and menu items based on your preferences.
              </p>
            </div>
            <Switch
              id="menu-recommendations"
              checked={localPreferences.menu_recommendations}
              onCheckedChange={(checked) => handleToggle("menu_recommendations", checked)}
            />
          </div>
        </div>

        {/* Reminders (Behavioral) */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <Label
                htmlFor="reminders"
                className="text-base font-semibold text-[#1C1C1C]"
                style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}
              >
                Reminders
              </Label>
              <p className="text-sm text-gray-500 mt-1">
                Get reminders about items in your cart and incomplete checkouts.
              </p>
            </div>
            <Switch
              id="reminders"
              checked={localPreferences.reminders}
              onCheckedChange={(checked) => handleToggle("reminders", checked)}
            />
          </div>
        </div>

        {/* Test Notification Button */}
        <div className="bg-white rounded-lg p-4">
          <Button
            onClick={handleTestNotification}
            className="w-full bg-primary text-white"
            variant="default"
          >
            <TestTube className="w-4 h-4 mr-2" />
            Send Test Notification
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Test if notifications are working on your device
          </p>
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-900 font-medium mb-1">
                About Notifications
              </p>
              <p className="text-xs text-blue-700">
                Order updates are important notifications about your orders and cannot be disabled. 
                You can control marketing and reminder notifications using the toggles above.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Nav */}
      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}

