import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Bell, Copy, Check } from "lucide-react";
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
  const { preferences, updatePreferences, deviceToken } = useNotifications();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("profile");
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [copied, setCopied] = useState(false);
  const [tokenFromStorage, setTokenFromStorage] = useState<string | null>(null);
  const [tokenFromSupabase, setTokenFromSupabase] = useState<string | null>(null);

  // Load token from localStorage and Supabase
  useEffect(() => {
    // Check localStorage
    const storedToken = localStorage.getItem('plattr_device_token');
    setTokenFromStorage(storedToken);
    
    // Check Supabase
    const checkSupabaseToken = async () => {
      try {
        const { data: { session } } = await supabaseAuth.auth.getSession();
        const userId = session?.user?.id || localStorage.getItem('userId');
        
        if (userId) {
          const { data, error } = await supabaseAuth
            .from('device_tokens')
            .select('device_token')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (!error && data) {
            setTokenFromSupabase(data.device_token);
          }
        }
      } catch (error) {
        console.error('Error fetching token from Supabase:', error);
      }
    };
    
    checkSupabaseToken();
  }, []);

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

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "FCM token copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
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

      // Check notification permissions first (especially important for iOS)
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const permResult = await PushNotifications.checkPermissions();
        console.log('[Test Notification] Permission status:', permResult);
        
        if (permResult.receive !== 'granted') {
          toast({
            variant: "destructive",
            title: "Notifications Disabled",
            description: "Please enable notifications in iPhone Settings → Notifications → Plattr",
          });
          return;
        }
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

      console.log('[Test Notification] Device token:', deviceToken.substring(0, 30) + '...');
      console.log('[Test Notification] Token length:', deviceToken.length);
      console.log('[Test Notification] Token format:', /^[a-zA-Z0-9_-]+$/.test(deviceToken) ? 'FCM-like' : 'Other');

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
          // Check if actually sent or if there were errors
          if (data.sent === 0) {
            const errorMsg = data.errors?.length > 0 
              ? `Failed: ${data.errors.join(', ')}`
              : 'No device tokens found. Make sure you\'re logged in and notifications are enabled.';
            toast({
              variant: "destructive",
              title: "No notifications sent",
              description: errorMsg,
            });
            console.error('[Test Notification] Edge Function response:', data);
          } else if (data.failed > 0 && data.errors?.length > 0) {
            toast({
              variant: "destructive",
              title: "Partial failure",
              description: `Sent to ${data.sent} device(s), but ${data.failed} failed: ${data.errors.join(', ')}`,
            });
            console.error('[Test Notification] Partial failure:', data.errors);
          } else {
          toast({
            title: "Test sent!",
              description: `Notification sent to ${data.sent} device(s). Check your notifications.`,
          });
          }
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

        {/* FCM Token Display */}
        <div className="bg-white rounded-lg p-4">
          <Label className="text-base font-semibold text-[#1C1C1C] mb-3 block" style={{ fontFamily: "'Sweet Sans Pro', sans-serif" }}>
            FCM Registration Token
          </Label>
          
          {/* Token from Service */}
          {deviceToken && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">From Notification Service:</p>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                <code className="text-xs flex-1 break-all font-mono">{deviceToken}</code>
                <button
                  onClick={() => handleCopyToken(deviceToken)}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Copy token"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Token from localStorage */}
          {tokenFromStorage && tokenFromStorage !== deviceToken && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">From LocalStorage:</p>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                <code className="text-xs flex-1 break-all font-mono">{tokenFromStorage}</code>
                <button
                  onClick={() => handleCopyToken(tokenFromStorage)}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Copy token"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          )}
          
          {/* Token from Supabase */}
          {tokenFromSupabase && tokenFromSupabase !== deviceToken && tokenFromSupabase !== tokenFromStorage && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">From Supabase:</p>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                <code className="text-xs flex-1 break-all font-mono">{tokenFromSupabase}</code>
                <button
                  onClick={() => handleCopyToken(tokenFromSupabase)}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Copy token"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          )}
          
          {!deviceToken && !tokenFromStorage && !tokenFromSupabase && (
            <p className="text-sm text-gray-500 italic">
              No FCM token found. Make sure notifications are enabled and the app has been registered for push notifications.
            </p>
          )}
          
          {deviceToken && (
            <div className="mt-2 text-xs text-gray-500">
              <p>Token Length: {deviceToken.length} characters</p>
              <p>Token Format: {/^[a-zA-Z0-9_-]+$/.test(deviceToken) ? 'FCM (valid)' : deviceToken.length === 64 && /^[0-9a-fA-F]{64}$/.test(deviceToken) ? 'APNs (needs conversion)' : 'Unknown'}</p>
            </div>
          )}
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

