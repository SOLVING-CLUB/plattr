import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar, Info, ChevronDown, ChevronUp, Star } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useCart } from "@/context/CartContex";
import FloatingNav from "@/pages/FloatingNav";
import { bulkMealOrderService, sixtyMinBulkOrderService, addressService, paymentService } from "@/lib/supabase-service";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DeliveryTimePicker from "@/components/DeliveryTimePicker";
import DeliveryDatePicker from "@/components/DeliveryDatePicker";
import { openRazorpayModal } from "@/lib/payment-utils";
import { validateBangaloreAddress, validateBangalorePincode, BANGALORE_VALIDATION_ERROR } from "@/lib/addressValidation";
import { analytics } from "@/lib/analytics";
import { facebookEvents } from "@/lib/facebook-capi";
import { getCurrentPosition, getLocationPermissionInstructions } from "@/lib/locationPermission";
import { getApiUrl } from "@/config/api";

// Declare Razorpay global type
declare global {
  interface Window {
    Razorpay: any;
  }
}

// Supabase configuration for Edge Functions
const SUPABASE_URL = 'https://leltckltotobsibixhqo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbHRja2x0b3RvYnNpYml4aHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzc5ODEsImV4cCI6MjA3NTk1Mzk4MX0._IrMgGQDJB7OvKEoT7pwWG9AjN6aeN1ejnj8IViDLyE';

const SIXTY_MIN_ORDER_FLAG = "isSixtyMinOrder";

export default function BulkMealsDelivery() {
  const [, setLocation] = useLocation();
  const { cart, clearCart, bulkMealType } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"home" | "menu" | "profile">("menu");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [orderDataToSubmit, setOrderDataToSubmit] = useState<any>(null);
  const orderDataRef = useRef<any>(null); // Ref to avoid stale closure in Razorpay callback
  const [paymentResponseData, setPaymentResponseData] = useState<{
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    razorpayReceipt?: string;
  } | null>(null);
  
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  
  // Contact info - prefilled from localStorage (logged in user)
  const [phone, setPhone] = useState(() => {
    const savedPhone = localStorage.getItem('phone');
    return savedPhone ? `+91 ${savedPhone}` : "";
  });
  const [email, setEmail] = useState(() => localStorage.getItem('email') || "");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(false);
  const [doorstepDelivery, setDoorstepDelivery] = useState(false);
  
  // Payment plan modal state
  const [isPaymentPlanOpen, setIsPaymentPlanOpen] = useState(false);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<"full" | "split">("full");
  const [isTotalBreakdownExpanded, setIsTotalBreakdownExpanded] = useState(false);
  const [isSplitPaymentExpanded, setIsSplitPaymentExpanded] = useState(false);
  

  // Update selected plan when modal opens - default to full if split not available
  useEffect(() => {
    if (isPaymentPlanOpen && !shouldShowPaymentStructure()) {
      setSelectedPaymentPlan("full");
    }
  }, [isPaymentPlanOpen]);
  
  // Read coupon from localStorage (set in BulkMealCart)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discount: number;
    discountType: 'percentage' | 'fixed' | 'free_delivery';
    discountValue: number;
    isFreeDelivery?: boolean;
  } | null>(() => {
    const saved = localStorage.getItem('bulkMealCoupon');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Calculate T+12 hours for default date/time
  const getMinDateTime = () => {
    const minTime = new Date(Date.now() + 12 * 60 * 60 * 1000);
    return {
      date: minTime.toISOString().split('T')[0],
      time: `${minTime.getHours().toString().padStart(2, '0')}:00`
    };
  };
  
  const minDateTime = getMinDateTime();
  const [eventDate, setEventDate] = useState(minDateTime.date);
  const [eventTime, setEventTime] = useState(minDateTime.time);
  const [hasSelectedDateTime, setHasSelectedDateTime] = useState(false);

  // Helper function to reverse geocode coordinates
  const reverseGeocode = async (latitude: number, longitude: number) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
    );
    const data = await response.json();

    if (data && data.address) {
      const addr = data.address;
      const newAddressLine1 = data.display_name?.split(',').slice(0, 2).join(', ') || "";
      const newAddressLine2 = addr.suburb || addr.neighbourhood || addr.road || addr.residential || "";
      const newCity = addr.city || addr.town || addr.village || addr.county || addr.state_district || "";
      const newState = addr.state || addr.region || "";
      const newPincode = addr.postcode || "";
      
      if (newAddressLine1) setAddressLine1(newAddressLine1);
      if (newAddressLine2) setAddressLine2(newAddressLine2);
      if (newCity) setCity(newCity);
      if (newState) setState(newState);
      if (newPincode) setPincode(newPincode);
      
      setSelectedAddressId("");
      return true;
    }
    return false;
  };

  // Function to get current location using IP-based fallback
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      // First try browser geolocation using improved permission handling
      const result = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });

      if (result.success && result.position) {
        const { latitude, longitude } = result.position.coords;
        const success = await reverseGeocode(latitude, longitude);
        if (success) {
          toast({ title: "Location Found", description: "Address filled from your current location" });
          setIsGettingLocation(false);
          return;
        }
        } else {
        // If permission denied, show helpful message
        if (result.error?.code === 1) {
          toast({
            title: "Location Permission Denied",
            description: `${result.error.userFriendlyMessage}\n\n${getLocationPermissionInstructions()}`,
            variant: "destructive",
            duration: 8000,
          });
          console.warn('Geolocation permission denied, using IP-based fallback');
        } else {
          console.log('Browser geolocation failed, trying IP-based fallback...');
        }
      }

      // Fallback: IP-based geolocation using free API
      const ipResponse = await fetch('https://ipapi.co/json/');
      const ipData = await ipResponse.json();
      
      if (ipData && !ipData.error) {
        // Use IP-based location data directly
        setAddressLine1(ipData.city ? `${ipData.city} Area` : "");
        setAddressLine2("");
        setCity(ipData.city || "");
        setState(ipData.region || "");
        setPincode(ipData.postal || "");
        setSelectedAddressId("");
        
        toast({ 
          title: "Approximate Location Found", 
          description: "Address filled based on your approximate location. Please verify and update if needed." 
        });
      } else {
        throw new Error("IP geolocation failed");
      }
    } catch (error: any) {
      console.error('Location error:', error);
      toast({ 
        title: "Location Error", 
        description: "Could not detect your location. Please enter your address manually.", 
        variant: "destructive" 
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Fetch saved addresses
  const { data: savedAddresses = [] } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => addressService.getAll(),
  });
  
  const handleSavedAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId);
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setState("");
    setPincode("");
  };
  
  const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
  const isAddressFieldsDisabled = !!selectedAddressId;

  // Load Razorpay script and get key ID
  useEffect(() => {
    // Fetch Razorpay key ID from Supabase Edge Function
    fetch(`${SUPABASE_URL}/functions/v1/razorpay`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(errorData.error || `Failed to fetch payment key: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.keyId) {
          setRazorpayKeyId(data.keyId);
          console.log('[BulkMealDelivery] Razorpay key loaded successfully');
        } else if (data.error) {
          console.error('Failed to get Razorpay key ID:', data.error);
          // Don't show toast on initial load - only show if user tries to pay
          console.warn('[BulkMealDelivery] Payment gateway not configured:', data.error);
        } else {
          console.error('Invalid response format from payment key endpoint');
          console.warn('[BulkMealDelivery] Payment gateway not configured');
        }
      })
      .catch(error => {
        console.error('Error fetching Razorpay key:', error);
        // Don't show toast on initial load - only show if user tries to pay
        console.warn('[BulkMealDelivery] Payment gateway initialization failed:', error.message);
      });

    // Load Razorpay script - check if already exists first
    const loadRazorpayScript = () => {
      // Check if Razorpay is already available
      if (window.Razorpay) {
        console.log('[BulkMealDelivery] Razorpay already loaded');
        setRazorpayLoaded(true);
        return;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        console.log('[BulkMealDelivery] Razorpay script tag already exists, waiting for load...');
        // Wait a bit for it to load
        const checkInterval = setInterval(() => {
          if (window.Razorpay) {
            setRazorpayLoaded(true);
            clearInterval(checkInterval);
          }
        }, 100);
        
        // Clear interval after 5 seconds
        setTimeout(() => clearInterval(checkInterval), 5000);
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        console.log('[BulkMealDelivery] Razorpay script loaded successfully');
        if (window.Razorpay) {
          setRazorpayLoaded(true);
        } else {
          console.warn('[BulkMealDelivery] Script loaded but window.Razorpay not available');
          // Retry after a short delay
          setTimeout(() => {
            if (window.Razorpay) {
              setRazorpayLoaded(true);
            }
          }, 500);
        }
      };
      script.onerror = (error) => {
        console.error('[BulkMealDelivery] Failed to load Razorpay script:', error);
        toast({
          title: "Payment Error",
          description: "Failed to load payment gateway. Please check your internet connection and try again.",
          variant: "destructive",
        });
      };
      document.body.appendChild(script);
    };

    loadRazorpayScript();

    // Don't cleanup script on unmount - let it persist for better iOS compatibility
    // return () => {
    //   const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    //   if (existingScript) {
    //     document.body.removeChild(existingScript);
    //   }
    // };
  }, [toast]);

  useEffect(() => {
    if (cart.length === 0) {
      setLocation("/bulk-meals");
    }
  }, [cart.length, setLocation]);

  const handleTabChange = (tab: "home" | "menu" | "profile") => {
    if (tab === "home") {
      setLocation("/");
    } else if (tab === "menu") {
      setLocation("/bulk-meals");
    } else if (tab === "profile") {
      setLocation("/profile");
    }
  };

  // Calculate all totals - these are reactive and will recalculate on every render
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const packagingFee = Math.round(subtotal * 0.06);
  const baseDeliveryCharges = 500;
  const deliveryCharges = appliedCoupon?.isFreeDelivery ? 0 : baseDeliveryCharges;
  const doorstepDeliveryFee = doorstepDelivery ? 300 : 0; // This will update when doorstepDelivery state changes
  const gst = Math.round(subtotal * 0.05);
  const discount = appliedCoupon?.isFreeDelivery ? 0 : (appliedCoupon?.discount || 0);
  
  // Calculate addons total from localStorage
  const calculateAddonsTotal = () => {
    const BULK_MEALS_ADDONS_KEY = "bulkMealsAddons";
    let servingSpoonQuantity = 0;
    let plateQuantity = 0;
    let waterBottleQuantity = 0;
    
    try {
      const storedSpoonQty = localStorage.getItem(`${BULK_MEALS_ADDONS_KEY}_serving_spoon_qty`);
      if (storedSpoonQty) servingSpoonQuantity = parseInt(storedSpoonQty) || 0;
      
      const storedPlateQty = localStorage.getItem(`${BULK_MEALS_ADDONS_KEY}_plate_qty`);
      if (storedPlateQty) plateQuantity = parseInt(storedPlateQty) || 0;
      
      const storedWaterBottleQty = localStorage.getItem(`${BULK_MEALS_ADDONS_KEY}_water_bottle_qty`);
      if (storedWaterBottleQty) waterBottleQuantity = parseInt(storedWaterBottleQty) || 0;
    } catch (e) {
      console.error('Error reading addons quantities:', e);
    }
    
    const servingSpoonPrice = servingSpoonQuantity * 20; // ₹20 per piece
    const platePrice = plateQuantity * 10; // ₹10 per piece
    const waterBottlePrice = waterBottleQuantity * 10; // ₹10 per piece
    return servingSpoonPrice + platePrice + waterBottlePrice;
  };
  
  const addonsTotal = calculateAddonsTotal();
  // Grand total includes doorstepDeliveryFee - will update when doorstepDelivery state changes
  const grandTotal = subtotal + packagingFee + deliveryCharges + doorstepDeliveryFee + gst + addonsTotal - discount;

  // Helper function to determine payment case and calculate days difference
  const getPaymentCase = () => {
    // Case 4: If total <= ₹1000, highest priority
    if (grandTotal <= 1000) {
      return { case: 4, diffDays: null };
    }

    if (!eventDate) {
      return { case: null, diffDays: null };
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const delivery = new Date(eventDate);
    const deliveryStart = new Date(
      delivery.getFullYear(),
      delivery.getMonth(),
      delivery.getDate()
    );

    const diffMs = deliveryStart.getTime() - todayStart.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Case 3: Same day delivery
    if (diffDays < 1) {
      return { case: 3, diffDays };
    }

    // Case 1: Gap >= 2 days
    if (diffDays >= 2) {
      return { case: 1, diffDays };
    }
    
    // Case 2: Gap < 2 days (but not same day)
    return { case: 2, diffDays };
  };

  // Calculate initial payment amount based on delivery date gap
  const calculateInitialPayment = () => {
    const { case: paymentCase } = getPaymentCase();

    // Case 4: If total <= ₹1000, pay full amount
    if (paymentCase === 4) {
      return grandTotal;
    }

    if (!paymentCase) return grandTotal;

    // Case 3: Same day delivery - pay full amount
    if (paymentCase === 3) {
      return grandTotal;
    }

    // Case 1: Gap >= 2 days - pay 10% initially
    if (paymentCase === 1) {
      return Math.round(grandTotal * 0.1);
    }
    
    // Case 2: Gap < 2 days (but not same day) - pay 80% initially
    return Math.round(grandTotal * 0.8);
  };

  const getPaymentButtonText = () => {
    const { case: paymentCase } = getPaymentCase();

    // Case 4: If total <= ₹1000, show "Pay"
    if (paymentCase === 4) {
      return "Pay";
    }

    if (!paymentCase) return "Pay Now";

    // Case 3: Same day delivery - show "Pay Now"
    if (paymentCase === 3) {
      return "Pay Now";
    }

    // Case 1 & 2: Show "Pay Initial Amount"
    return "Pay Initial Amount";
  };

  // Check if we should show payment structure (only for Case 1 & 2)
  const shouldShowPaymentStructure = () => {
    const { case: paymentCase } = getPaymentCase();
    return hasSelectedDateTime && eventDate && eventTime && (paymentCase === 1 || paymentCase === 2);
  };

  // Check if we should show Submit button (only for Case 1 & 2)
  const shouldShowSubmitButton = () => {
    const { case: paymentCase } = getPaymentCase();
    return paymentCase === 1 || paymentCase === 2;
  };

  // Calculate full payment schedule for display (only for Case 1 & 2)
  const calculatePaymentSchedule = () => {
    if (!shouldShowPaymentStructure()) return null;

    const { case: paymentCase, diffDays } = getPaymentCase();
    if (!paymentCase || paymentCase !== 1 && paymentCase !== 2) return null;

    const totalAmount = grandTotal;
    if (totalAmount <= 0) return null;

    // Case 1: Gap >= 2 days - 10-70-20 split
    if (paymentCase === 1) {
      const advance = Math.round(totalAmount * 0.1);
      const beforeDay = Math.round(totalAmount * 0.7);
      const remaining = Math.max(totalAmount - advance - beforeDay, 0);

      // Calculate one day before delivery date
      const delivery = new Date(eventDate);
      const oneDayBefore = new Date(delivery);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);

      return {
        type: "10-70-20" as const,
        stages: [
          {
            label: "Initial Payment (10%)",
            description: "Pay 10% right away to book your slot.",
            amount: advance,
            when: "Now",
          },
          {
            label: "Second Payment (70%)",
            description: "Pay 70% one day before delivery.",
            amount: beforeDay,
            when: `Before ${oneDayBefore.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
          },
          {
            label: "Final Payment (20%)",
            description: "Pay the remaining 20% on delivery.",
            amount: remaining,
            when: `Before ${delivery.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
          },
        ],
      };
    }

    // Case 2: Gap < 2 days - 80-20 split
    const immediate = Math.round(totalAmount * 0.8);
    const remaining = Math.max(totalAmount - immediate, 0);

    const delivery = new Date(eventDate);

    return {
      type: "80-20" as const,
      stages: [
        {
          label: "Initial Payment (80%)",
          description: "Pay 80% right away to confirm your slot.",
          amount: immediate,
          when: "Now",
        },
        {
          label: "Final Payment (20%)",
          description: "Pay the remaining 20% on delivery.",
          amount: remaining,
          when: `Before ${delivery.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`,
        },
      ],
    };
  };

  const paymentSchedule = calculatePaymentSchedule();

  // Validate form and prepare order data
  const validateAndPrepareOrderData = () => {
      // Check 12-hour minimum advance booking
      if (eventDate) {
        const selectedDateTime = new Date(`${eventDate}T${eventTime || '12:00'}`);
        const now = new Date();
        const hoursDiff = (selectedDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 12) {
          toast({
            title: "Invalid Date/Time",
            description: "Please select a date and time at least 12 hours from now.",
            variant: "destructive",
          });
        return null;
        }
      }
      
      // Handle address - use saved address ID or inline address text
      let validAddressId: string | undefined = undefined;
      let deliveryAddressText: string | undefined = undefined;
      
      // Check if a saved address is selected (valid UUID format)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const hasSavedAddress = selectedAddressId && selectedAddressId.trim() !== "" && 
                              selectedAddressId !== "home" && selectedAddressId !== "office" &&
                              uuidRegex.test(selectedAddressId);
      
      if (hasSavedAddress) {
        validAddressId = selectedAddressId;
      } else {
        // No saved address - validate manual address fields
        // Required fields: Address Line 1, City, Pincode
        if (!addressLine1 || !addressLine1.trim()) {
          toast({
            title: "Address Required",
            description: "Please enter Address Line 1.",
            variant: "destructive",
          });
        return null;
        }
        
        if (!city || !city.trim()) {
          toast({
            title: "City Required",
            description: "Please enter the city.",
            variant: "destructive",
          });
        return null;
        }
        
        if (!pincode || !pincode.trim()) {
          toast({
            title: "Pincode Required",
            description: "Please enter the pincode.",
            variant: "destructive",
          });
        return null;
        }
        
        // Validate Bangalore pincode (must start with 560)
        if (!validateBangalorePincode(pincode)) {
          toast({
            title: BANGALORE_VALIDATION_ERROR.title,
            description: "Please enter a valid Bangalore pincode (starting with 560).",
            variant: "destructive",
          });
        return null;
        }
        
        const fullAddress = [addressLine1, addressLine2, city, state, pincode].filter(Boolean).join(", ");
        
        if (saveAddressForFuture) {
        // Only save to addresses table when user opts in - we'll do this in handleSubmitOrder
        deliveryAddressText = fullAddress;
        } else {
          // Don't save to addresses table - just pass the address text with the order
          deliveryAddressText = fullAddress;
        }
      }
      
      // Get selected addons from localStorage
      const BULK_MEALS_ADDONS_KEY = "bulkMealsAddons";
      let selectedAddons: string[] = [];
      const storedAddons = localStorage.getItem(BULK_MEALS_ADDONS_KEY);
      if (storedAddons) {
        try {
          selectedAddons = JSON.parse(storedAddons);
        } catch {
          selectedAddons = [];
        }
      }
      
      // Convert cart items to order format
      const items = cart.map(item => ({
        dishId: item.id.toString(),
        quantity: item.quantity,
        price: item.price,
      }));
      
      // Check if this is a 60-min order by checking cart items
      const isSixtyMinOrder = cart.length > 0 && cart.every(item => item.isSixtyMin === true);
      
    // Prepare order data
    return {
        items: items,
        selectedAddons: selectedAddons.length > 0 ? selectedAddons : undefined,
        subtotal: subtotal,
        gst: gst,
        platformFee: deliveryCharges,
        packagingFee: packagingFee,
        doorstepDeliveryFee: doorstepDeliveryFee,
        total: grandTotal,
        deliveryDate: eventDate || undefined,
        deliveryTime: eventTime || undefined,
        addressId: validAddressId,
        deliveryAddress: deliveryAddressText,
        couponId: appliedCoupon?.id || undefined,
        couponCode: appliedCoupon?.code || undefined,
        discountApplied: appliedCoupon?.isFreeDelivery 
          ? baseDeliveryCharges  
          : (appliedCoupon?.discount || 0),
      isSixtyMinOrder,
      saveAddressForFuture,
      addressLine2,
    };
  };

  // Handle payment button click - opens payment plan modal
  const handlePayment = () => {
    // Validate and prepare order data first
    const orderData = validateAndPrepareOrderData();
    if (!orderData) {
      return;
    }

    // Store order data for later use (both state and ref)
    setOrderDataToSubmit(orderData);
    orderDataRef.current = orderData;

    // Open payment plan modal
    setIsPaymentPlanOpen(true);
  };

  // Process payment based on selected plan
  const processPayment = async () => {
    // Check if Razorpay is actually available (double-check for iOS)
    if (!window.Razorpay && !razorpayLoaded) {
      // Try to detect if script is loading
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript && !razorpayLoaded) {
        toast({
          title: "Payment Loading",
          description: "Payment gateway is still loading. Please wait a moment and try again.",
          variant: "default",
        });
        return;
      }
      
      // Script might have failed to load, try reloading
      toast({
        title: "Payment Error",
        description: "Payment gateway not ready. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    // Ensure Razorpay is available even if state says it's loaded
    if (!window.Razorpay) {
      console.error('[BulkMealDelivery] window.Razorpay not available despite razorpayLoaded being true');
      toast({
        title: "Payment Error",
        description: "Payment gateway failed to initialize. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (!razorpayKeyId) {
      // Try to fetch the key one more time from Supabase Edge Function
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/razorpay`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          toast({
            title: "Server Configuration Error",
            description: "Payment gateway not configured. Please contact support.",
            variant: "destructive",
          });
          return;
        }
        
        if (res.ok) {
          const data = await res.json();
          if (data.keyId) {
            setRazorpayKeyId(data.keyId);
      } else {
            toast({
              title: "Payment Error",
              description: data.error || "Payment gateway is not configured. Please contact support.",
              variant: "destructive",
            });
            return;
          }
        } else {
          const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          toast({
            title: "Payment Error",
            description: errorData.error || "Failed to initialize payment gateway. Please refresh the page.",
            variant: "destructive",
          });
          return;
        }
      } catch (error: any) {
        console.error('Error fetching Razorpay key on payment attempt:', error);
        if (error.message && error.message.includes('Unexpected token')) {
          toast({
            title: "Server Configuration Error",
            description: "Payment gateway route is not accessible. Please restart the development server.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Payment Error",
            description: "Failed to connect to payment gateway. Please check your connection and try again.",
            variant: "destructive",
          });
        }
        return;
      }
    }

    // Close modal
    setIsPaymentPlanOpen(false);

    // Get order data (should already be set from handlePayment)
    const orderData = orderDataToSubmit || orderDataRef.current;
    if (!orderData) {
      toast({
        title: "Error",
        description: "Order data not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessingPayment(true);

      // Calculate payment amount based on selected plan
      const paymentAmount = selectedPaymentPlan === "full" 
        ? grandTotal 
        : calculateInitialPayment();
      const createOrderResponse = await fetch(`${SUPABASE_URL}/functions/v1/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentAmount,
          currency: 'INR',
          receipt: `bulk-meal-${Date.now()}`,
        }),
      });

      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const { orderId: razorpayOrderId, amount } = await createOrderResponse.json();

      // Store order data for payment processing
      orderDataRef.current = orderData;
      setOrderDataToSubmit(orderData);

      // Open Razorpay modal directly
      await openRazorpayModal({
        razorpayKeyId: razorpayKeyId!,
        razorpayOrderId: razorpayOrderId,
        amount: paymentAmount,
        description: "Bulk Meal Order Payment",
        orderType: "bulk_meal",
        orderData: orderData,
        onError: (error) => {
          toast({
            title: "Payment Error",
            description: error,
            variant: "destructive",
          });
          setIsProcessingPayment(false);
        },
      });
      
      setIsProcessingPayment(false);
    } catch (error: any) {
      console.error("Error initiating payment:", error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
      });
      setIsProcessingPayment(false);
    }
  };


  // Create order after payment (status="paid") - confirms order and syncs to Odoo
  const createOrderAfterPayment = async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) => {
    // Use ref to avoid stale closure issue with state
    const orderData = orderDataRef.current || orderDataToSubmit;
    console.log('[Order] createOrderAfterPayment called with orderData:', !!orderData);
    
    if (!orderData) {
      console.error('[Order] orderData is null! orderDataRef.current:', orderDataRef.current, 'orderDataToSubmit:', orderDataToSubmit);
      toast({
        title: "Error",
        description: "Order data not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingOrder(true);

      // Get user ID - try Supabase auth first, fallback to localStorage
      const { supabaseAuth } = await import("@/lib/supabase-auth");
      const { data: { user: supabaseUser } } = await supabaseAuth.auth.getUser();
      const userId = supabaseUser?.id || localStorage.getItem('userId');
      
      console.log('[Order] User ID:', userId, 'Supabase user:', !!supabaseUser, 'localStorage userId:', localStorage.getItem('userId'));
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Create a user object for compatibility
      const user = supabaseUser || { id: userId };

      // Handle address saving if needed
      let finalAddressId = orderData.addressId;
      if (!finalAddressId && orderData.deliveryAddress && orderData.saveAddressForFuture) {
        try {
          const newAddress = await addressService.create({
            label: "My Location",
            address: orderData.deliveryAddress,
            landmark: orderData.addressLine2 || undefined,
            isDefault: false,
          });
          finalAddressId = newAddress.id;
        } catch (addressError: any) {
          console.error("Error creating address:", addressError);
          // Continue without saving address
        }
      }

      // Prepare final order data
      const finalOrderData = {
        items: orderData.items,
        selectedAddons: orderData.selectedAddons,
        subtotal: orderData.subtotal,
        gst: orderData.gst,
        platformFee: orderData.platformFee,
        packagingFee: orderData.packagingFee,
        total: orderData.total,
        deliveryDate: orderData.deliveryDate,
        deliveryTime: orderData.deliveryTime,
        addressId: finalAddressId,
        deliveryAddress: orderData.deliveryAddress,
        couponId: orderData.couponId,
        couponCode: orderData.couponCode,
        discountApplied: orderData.discountApplied,
      };

      // Create the order first (will be created with status="pending")
      console.log('[Order] Creating order with data:', JSON.stringify(finalOrderData, null, 2));
      let createdOrder;
      try {
        if (orderData.isSixtyMinOrder) {
          createdOrder = await sixtyMinBulkOrderService.create(finalOrderData);
        } else {
          createdOrder = await bulkMealOrderService.create(finalOrderData);
        }
        console.log('[Order] ✓ Order created successfully:', createdOrder?.id, 'Order Number:', createdOrder?.order_number);
        
        // Invalidate orders query to refresh the orders list
        queryClient.invalidateQueries({ queryKey: ["orders-unified"] });
      } catch (orderError: any) {
        console.error('[Order] ✗ Order creation failed:', orderError.message || orderError);
        throw orderError; // Re-throw to stop payment storage
      }

      // Determine payment stage based on payment case
      const { case: paymentCase } = getPaymentCase();
      let paymentStage: 'initial' | 'second' | 'final' | 'full' = 'full';
      if (paymentCase === 1) {
        paymentStage = 'initial'; // 10% payment
      } else if (paymentCase === 2) {
        paymentStage = 'initial'; // 80% payment
      } else if (paymentCase === 3 || paymentCase === 4) {
        paymentStage = 'full'; // 100% payment
      }

      // Check if test payment
      const isTestPayment = razorpayKeyId?.includes('test') || razorpayKeyId?.includes('rzp_test') || false;

      // Prepare order items with names from cart
      const orderItems = cart.map(item => ({
        dishId: item.id.toString(),
        name: item.name || `Item ${item.id}`,
        quantity: item.quantity,
        price: item.price,
      }));

      // Store payment details in payments table
      if (createdOrder?.id) {
        const orderType: 'bulk_meal' | 'sixty_min_bulk' = orderData.isSixtyMinOrder ? 'sixty_min_bulk' : 'bulk_meal';
        const paymentPayload = {
          orderId: createdOrder.id,
          orderType: orderType,
          orderNumber: createdOrder.order_number,
          userId: user.id,
          paymentStage: paymentStage,
          amount: calculateInitialPayment(),
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: razorpayPaymentId,
          razorpaySignature: razorpaySignature,
          razorpayReceipt: razorpayOrderId,
          paymentStatus: 'success' as const,
          isTestPayment: isTestPayment,
          orderItems: orderItems,
          subtotal: orderData.subtotal,
          gst: orderData.gst,
          platformFee: orderData.platformFee,
          packagingFee: orderData.packagingFee,
          deliveryFee: orderData.platformFee,
          discountApplied: orderData.discountApplied,
          totalOrderAmount: orderData.total,
          deliveryDate: orderData.deliveryDate,
          deliveryTime: orderData.deliveryTime,
          metadata: {
            payment_date: new Date().toISOString(),
            payment_method: 'razorpay',
            cart_items_count: cart.length,
          },
        };
        
        console.log('[Payment] Storing payment details:', JSON.stringify(paymentPayload, null, 2));
        
        try {
          const paymentRecord = await paymentService.create(paymentPayload);
          console.log('[Payment] ✓ Payment record created successfully:', paymentRecord);
        } catch (paymentError: any) {
          console.error('[Payment] ✗ Error storing payment details:', paymentError.message || paymentError);
          console.error('[Payment] Full error:', paymentError);
          toast({
            title: "Payment Record Warning",
            description: "Order placed but payment record failed to save. Support will be notified.",
            variant: "destructive",
          });
        }
      } else {
        console.warn('[Payment] No order ID available, skipping payment record creation');
      }

      // Update order status to "paid" after creation (this will trigger Odoo sync via webhook)
      if (createdOrder?.id) {
        try {
          const tableName = orderData.isSixtyMinOrder ? 'sixty_min_bulk_orders' : 'bulk_meal_orders';
          
          const { error: updateError } = await supabaseAuth
            .from(tableName)
            .update({ status: 'paid' })
            .eq('id', createdOrder.id);
          
          if (updateError) {
            console.error("Error updating order status:", updateError);
            // Continue even if status update fails
          } else {
            console.log(`Order ${createdOrder.id} status updated to 'paid' - will sync to Odoo`);
          }
        } catch (updateError: any) {
          console.error("Error updating order status:", updateError);
          // Continue even if status update fails
        }
      }
      
      // Clear localStorage and cart
      localStorage.removeItem(SIXTY_MIN_ORDER_FLAG);
    localStorage.removeItem("bulkMealsAddons");
    localStorage.removeItem("bulkMealCoupon");
    clearCart();
      
      // Track order completed
      const orderId = createdOrder?.id || `bulk-meal-${Date.now()}`;
      analytics.trackOrderCompleted(
        orderId,
        orderData.total,
        cart.length,
        'paid'
      ).catch(() => {});
      
      facebookEvents.trackPurchase(orderId, orderData.total, cart.length, cart.map(item => String(item.id)));

      toast({
        title: "Order Confirmed!",
        description: "Your payment was successful and order is confirmed!",
      });
      
      // Send PUSH NOTIFICATION for order confirmation (FCM - order_status)
      const notifyUserId = localStorage.getItem('userId');
      if (notifyUserId) {
        fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: notifyUserId,
            title: '🎉 Bulk Order Confirmed!',
            body: `Order #${createdOrder?.order_number || ''} confirmed! We'll start preparing your food.`,
            event_name: 'order_placed',
            category: 'order_status',
            deep_link: createdOrder?.id ? `plattr://bulk-orders/${createdOrder.id}` : 'plattr://orders',
            metadata: { order_id: createdOrder?.id, order_number: createdOrder?.order_number },
          }),
        }).catch(err => console.log('[Notification] Failed to send order notification:', err));
      }

      // Navigate to bulk meal order status page
      if (createdOrder?.id) {
        setTimeout(() => {
          setLocation(`/bulk-orders/${createdOrder.id}`, { replace: true });
        }, 200);
      } else {
        console.warn('[BulkMealDelivery] Order created but ID not available, redirecting to orders page');
        setTimeout(() => {
          setLocation('/orders', { replace: true });
        }, 200);
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast({
        title: "Order Error",
        description: error.message || "Failed to create order. Please contact support.",
        variant: "destructive",
      });
      
      // Send PUSH NOTIFICATION for order failure (FCM - order_status)
      const notifyUserId = localStorage.getItem('userId');
      if (notifyUserId) {
        fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: notifyUserId,
            title: '❌ Order Failed',
            body: error.message || 'Failed to create your order. Please try again.',
            event_name: 'order_failed',
            category: 'order_status',
          }),
        }).catch(err => console.log('[Notification] Failed to send order error notification:', err));
      }
    } finally {
      setIsCreatingOrder(false);
      setIsProcessingPayment(false);
    }
  };

  // Handle order submission without payment (status="pending") - sends to Odoo for executive confirmation
  const handleSubmitOrder = async () => {
    // Validate and prepare order data
    const orderData = validateAndPrepareOrderData();
    if (!orderData) {
      return;
    }

    try {
      setIsCreatingOrder(true);

      // Handle address saving if needed
      let finalAddressId = orderData.addressId;
      if (!finalAddressId && orderData.deliveryAddress && orderData.saveAddressForFuture) {
        try {
          const newAddress = await addressService.create({
            label: "My Location",
            address: orderData.deliveryAddress,
            landmark: orderData.addressLine2 || undefined,
            isDefault: false,
          });
          finalAddressId = newAddress.id;
        } catch (addressError: any) {
          console.error("Error creating address:", addressError);
          // Continue without saving address
        }
      }

      // Prepare final order data
      const finalOrderData = {
        items: orderData.items,
        selectedAddons: orderData.selectedAddons,
        subtotal: orderData.subtotal,
        gst: orderData.gst,
        platformFee: orderData.platformFee,
        packagingFee: orderData.packagingFee,
        doorstepDeliveryFee: orderData.doorstepDeliveryFee || 0,
        total: orderData.total,
        deliveryDate: orderData.deliveryDate,
        deliveryTime: orderData.deliveryTime,
        addressId: finalAddressId,
        deliveryAddress: orderData.deliveryAddress,
        couponId: orderData.couponId,
        couponCode: orderData.couponCode,
        discountApplied: orderData.discountApplied,
      };

      // Create the order with status="pending" (will sync to Odoo as Opportunity + Quotation)
      let createdOrder;
      if (orderData.isSixtyMinOrder) {
        createdOrder = await sixtyMinBulkOrderService.create(finalOrderData);
      } else {
        createdOrder = await bulkMealOrderService.create(finalOrderData);
      }
      
      // Invalidate orders query to refresh the orders list
      queryClient.invalidateQueries({ queryKey: ["orders-unified"] });
      
      // Clear localStorage and cart
      localStorage.removeItem(SIXTY_MIN_ORDER_FLAG);
      localStorage.removeItem("bulkMealsAddons");
      localStorage.removeItem("bulkMealCoupon");
      clearCart();
      
      // Track order submitted
      const orderId = createdOrder?.id || `bulk-meal-${Date.now()}`;
      analytics.trackOrderCompleted(
        orderId,
        orderData.total,
        cart.length,
        'pending'
      ).catch(() => {});

      toast({
        title: "Request Submitted!",
        description: "Your order request has been sent. Our executive will contact you for confirmation.",
      });

      // Navigate to bulk meal order status page
      if (createdOrder?.id) {
        setTimeout(() => {
          setLocation(`/bulk-orders/${createdOrder.id}`, { replace: true });
        }, 200);
      } else {
        console.warn('[BulkMealDelivery] Order created but ID not available, redirecting to orders page');
        setTimeout(() => {
          setLocation('/orders', { replace: true });
        }, 200);
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      toast({
        title: "Order Error",
        description: error.message || "Failed to submit order. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (cart.length === 0) {
    return null;
  }

  return (
    <div 
      className="min-h-screen bg-white pb-32"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 128px)',
      }}
    >
      {/* Header */}
      <div 
        className="bg-white px-4 pb-4 border-b border-gray-100 sticky z-50" 
        style={{ 
          top: 0,
          paddingTop: "16px",
          paddingBottom: "16px"
        }}
      >
        <button 
          onClick={() => setLocation("/bulk-meals-addons")}
          className="flex items-center gap-2 text-gray-700"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold" style={{ fontFamily: "Sweet Sans Pro" }}>Back</span>
        </button>
      </div>

      <div className="px-4 py-6">
        {/* Header */}
        <h2 className="text-xl sm:text-2xl font-bold mb-6" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
          Proceed to Payment
        </h2>

        {/* Total Amount to be Paid - Expandable */}
        <div className="bg-green-50 border border-green-200 rounded-lg mb-6">
          <button
            onClick={() => setIsTotalBreakdownExpanded(!isTotalBreakdownExpanded)}
            className="w-full p-4 flex items-center justify-between"
            style={{ fontFamily: "Sweet Sans Pro" }}
          >
            <span className="font-semibold text-sm" style={{ color: "#1A9952" }}>
              Total Amount to be Paid
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl" style={{ color: "#1A9952" }}>
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
              {isTotalBreakdownExpanded ? (
                <ChevronUp className="w-5 h-5" style={{ color: "#1A9952" }} />
              ) : (
                <ChevronDown className="w-5 h-5" style={{ color: "#1A9952" }} />
              )}
            </div>
          </button>
          
          {isTotalBreakdownExpanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-green-200 pt-4">
              {/* Line Items - Cart Items */}
              {cart.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase" style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                    Line Items
                  </h4>
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm pl-2">
                      <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                        {item.name} × {item.quantity}
                      </span>
                      <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add-ons */}
              {addonsTotal > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase" style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                    Add-ons
                  </h4>
                  {(() => {
                    const BULK_MEALS_ADDONS_KEY = "bulkMealsAddons";
                    let servingSpoonQuantity = 0;
                    let plateQuantity = 0;
                    let waterBottleQuantity = 0;
                    let selectedAddons: string[] = [];
                    
                    try {
                      const storedSpoonQty = localStorage.getItem(`${BULK_MEALS_ADDONS_KEY}_serving_spoon_qty`);
                      if (storedSpoonQty) servingSpoonQuantity = parseInt(storedSpoonQty) || 0;
                      
                      const storedPlateQty = localStorage.getItem(`${BULK_MEALS_ADDONS_KEY}_plate_qty`);
                      if (storedPlateQty) plateQuantity = parseInt(storedPlateQty) || 0;
                      
                      const storedWaterBottleQty = localStorage.getItem(`${BULK_MEALS_ADDONS_KEY}_water_bottle_qty`);
                      if (storedWaterBottleQty) waterBottleQuantity = parseInt(storedWaterBottleQty) || 0;
                      
                      const storedAddons = localStorage.getItem(BULK_MEALS_ADDONS_KEY);
                      if (storedAddons) {
                        selectedAddons = JSON.parse(storedAddons);
                      }
                    } catch (e) {
                      console.error('Error reading addons:', e);
                    }
                    
                    return (
                      <>
                        {servingSpoonQuantity > 0 && (
                          <div className="flex justify-between text-sm pl-2">
                            <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                              Serving Spoons × {servingSpoonQuantity}
                            </span>
                            <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                              ₹{(servingSpoonQuantity * 20).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        {plateQuantity > 0 && (
                          <div className="flex justify-between text-sm pl-2">
                            <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                              Plates × {plateQuantity}
                            </span>
                            <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                              ₹{(plateQuantity * 10).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        {waterBottleQuantity > 0 && (
                          <div className="flex justify-between text-sm pl-2">
                            <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                              Water Bottles × {waterBottleQuantity}
                            </span>
                            <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                              ₹{(waterBottleQuantity * 10).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                        {selectedAddons.includes('spoons_forks') && (
                          <div className="flex justify-between text-sm pl-2">
                            <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                              Spoons & Forks
                            </span>
                            <span style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                              FREE
                            </span>
                          </div>
                        )}
                        {selectedAddons.includes('tissues') && (
                          <div className="flex justify-between text-sm pl-2">
                            <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                              Tissues
                            </span>
                            <span style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                              FREE
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Charges Breakdown */}
              <div className="space-y-2 pt-2 border-t border-green-200">
                <div className="flex justify-between text-sm">
                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Subtotal</span>
                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Packaging Fee</span>
                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{packagingFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Delivery Charges</span>
                  <span style={{ fontFamily: "Sweet Sans Pro", color: appliedCoupon?.isFreeDelivery ? "#1A9952" : "#06352A" }}>
                    {appliedCoupon?.isFreeDelivery ? (
                      <><s className="text-gray-400 mr-1">₹{baseDeliveryCharges}</s> FREE</>
                    ) : (
                      `₹${deliveryCharges.toLocaleString('en-IN')}`
                    )}
                  </span>
                </div>
                {addonsTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Add-ons</span>
                    <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{addonsTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {doorstepDelivery && (
                  <div className="flex justify-between text-sm">
                    <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Doorstep Delivery</span>
                    <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{doorstepDeliveryFee.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>GST</span>
                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{gst.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span style={{ fontFamily: "Sweet Sans Pro" }}>Discount ({appliedCoupon?.code})</span>
                    <span style={{ fontFamily: "Sweet Sans Pro" }}>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="border-t border-green-200 pt-2 mt-2 flex justify-between font-semibold">
                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>Total</span>
                  <span style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          {/* When - Date Selection */}
          <DeliveryDatePicker
            value={eventDate}
            onChange={(date) => {
              setEventDate(date);
              setHasSelectedDateTime(true);
            }}
            minDate={new Date(minDateTime.date)}
          />

          {/* Delivery Time Selection */}
          <DeliveryTimePicker
            mealType="all"
            value={eventTime}
            onChange={(time) => {
              setEventTime(time);
              setHasSelectedDateTime(true);
            }}
            selectedDate={eventDate}
            disabledPeriods={
              bulkMealType === "lunch-dinner" 
                ? ["morning"] 
                : bulkMealType === "tiffins" 
                ? ["afternoon"] 
                : []
            }
          />


          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              Enter Your Phone Number
            </label>
            <input
              type="tel"
              placeholder="+91 98552 12375"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="input-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              Enter Your Email Address
            </label>
            <input
              type="email"
              placeholder="test@gmail.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ fontFamily: "Sweet Sans Pro" }}
              data-testid="input-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Choose Saved Address */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
              Choose Saved Address (Optional)
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              style={{ fontFamily: "Sweet Sans Pro", color: selectedAddressId ? "#06352A" : "#9CA3AF" }}
              data-testid="select-saved-address"
              value={selectedAddressId}
              onChange={(e) => handleSavedAddressChange(e.target.value)}
            >
              <option value="">Select Address (Optional)</option>
              {savedAddresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label} {address.isDefault ? "(Default)" : ""}
                </option>
              ))}
            </select>
            
            {/* Show selected address details */}
            {selectedAddress && (
              <div 
                className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                data-testid="selected-address-display"
              >
                <p className="text-sm font-semibold mb-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  {selectedAddress.label}
                </p>
                <p className="text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>
                  {selectedAddress.address}
                  {selectedAddress.landmark && `, ${selectedAddress.landmark}`}
                </p>
              </div>
            )}
          </div>

          {/* Use Current Location Button */}
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-50 border-2 border-dashed border-green-500 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
            style={{ fontFamily: "Sweet Sans Pro" }}
            data-testid="button-use-location"
          >
            <MapPin className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">
              {isGettingLocation ? "Getting Location..." : "Use Current Location"}
            </span>
          </button>

          {/* Manual Address Entry - Only show when no saved address selected */}
          {!isAddressFieldsDisabled && (
            <>
              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Address Line 1
                </label>
                <input
                  type="text"
                  placeholder="Door No. 32, Jaya Prakash Nagar"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-address-line1"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Address Line 2
                </label>
                <input
                  type="text"
                  placeholder="Near Metro Station, JP Nagar"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-address-line2"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  City
                </label>
                <input
                  type="text"
                  placeholder="Bengaluru"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  State
                </label>
                <input
                  type="text"
                  placeholder="Karnataka"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Pincode
                </label>
                <input
                  type="text"
                  placeholder="450003"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: "Sweet Sans Pro" }}
                  data-testid="input-pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                />
              </div>

              {/* Save Address Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAddressForFuture}
                  onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-gray-300"
                  style={{ accentColor: "#1A9952" }}
                  data-testid="checkbox-save-address"
                />
                <span className="text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Save Address for future use
                </span>
              </label>
            </>
          )}

          {/* Doorstep Delivery Addon */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={doorstepDelivery}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    setDoorstepDelivery(newValue);
                    // Force re-render by updating state
                    console.log('Doorstep delivery changed to:', newValue, 'Fee will be:', newValue ? 300 : 0);
                  }}
                  className="w-5 h-5 rounded border-2 border-gray-300"
                  style={{ accentColor: "#1A9952" }}
                  data-testid="checkbox-doorstep-delivery"
                />
                <div>
                  <span className="text-sm font-semibold block" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Doorstep Delivery
                  </span>
                  <span className="text-xs text-gray-500" style={{ fontFamily: "Sweet Sans Pro" }}>
                    Get your order delivered right to your doorstep
                  </span>
                </div>
              </div>
              <span className="text-sm font-semibold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                ₹300
              </span>
            </label>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Subtotal</span>
              <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Packaging Fee</span>
              <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{packagingFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Delivery Charges</span>
              <span style={{ fontFamily: "Sweet Sans Pro", color: appliedCoupon?.isFreeDelivery ? "#1A9952" : "#06352A" }}>
                {appliedCoupon?.isFreeDelivery ? (
                  <><s className="text-gray-400 mr-1">₹{baseDeliveryCharges}</s> FREE</>
                ) : (
                  `₹${deliveryCharges.toLocaleString('en-IN')}`
                )}
              </span>
            </div>
            {addonsTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Add-ons</span>
                <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{addonsTotal.toLocaleString('en-IN')}</span>
              </div>
            )}
            {doorstepDelivery && (
              <div className="flex justify-between text-sm">
                <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>Doorstep Delivery</span>
                <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{doorstepDeliveryFee.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span style={{ fontFamily: "Sweet Sans Pro", color: "#4B5563" }}>GST</span>
              <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>₹{gst.toLocaleString('en-IN')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span style={{ fontFamily: "Sweet Sans Pro" }}>Discount ({appliedCoupon?.code})</span>
                <span style={{ fontFamily: "Sweet Sans Pro" }}>-₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
              <span style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>Total</span>
              <span style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Payment and Submit Buttons */}
        <div className="space-y-3">
          {/* Pay Button - Pay and confirm order (creates order with status="paid") */}
          <Button
            onClick={handlePayment}
            disabled={isProcessingPayment || isCreatingOrder}
          className="w-full py-6 text-lg font-semibold border-0 flex items-center justify-between"
          style={{ 
            fontFamily: "Sweet Sans Pro",
            backgroundColor: "#1A9952",
            color: "white",
              borderRadius: "10px",
              opacity: (isProcessingPayment || isCreatingOrder || !razorpayLoaded || !razorpayKeyId) ? 0.6 : 1
            }}
            data-testid="button-pay"
          >
            <span>
              {isProcessingPayment || isCreatingOrder
                ? "Processing..." 
                : !razorpayLoaded || !razorpayKeyId
                ? "Initializing Payment..."
                : "Pay"
              }
            </span>
            {!(isProcessingPayment || isCreatingOrder) && (
          <span className="font-bold text-xl">
                ₹{grandTotal.toLocaleString('en-IN')}
          </span>
            )}
          </Button>

          {/* Submit Order Button - Submit request without payment (creates order with status="pending") */}
          <Button
            onClick={handleSubmitOrder}
            disabled={isCreatingOrder}
            className="w-full py-6 text-lg font-semibold border-2 flex items-center justify-center"
            style={{ 
              fontFamily: "Sweet Sans Pro",
              backgroundColor: "#f3f4f6",
              color: "#06352A",
              borderColor: "#1A9952",
              borderRadius: "10px",
              opacity: isCreatingOrder ? 0.6 : 1
            }}
            data-testid="button-submit-order"
          >
            {isCreatingOrder ? "Submitting Request..." : "Submit Order Request"}
        </Button>
        </div>
        {(!razorpayLoaded || !razorpayKeyId) && !isProcessingPayment && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Payment gateway is initializing. If this persists, please refresh the page.
          </p>
        )}
        <p className="text-xs text-center text-gray-600 mt-2">
          Pay now to confirm order, or submit request for executive confirmation
        </p>
      </div>

      {/* Payment Plan Bottom Sheet */}
      <Sheet open={isPaymentPlanOpen} onOpenChange={setIsPaymentPlanOpen}>
        <SheetContent 
          side="bottom" 
          className="rounded-t-3xl px-4" 
          style={{ 
            maxHeight: "85vh",
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)"
          }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-2 pb-3">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
            Payment Plan
          </h2>

          <div className="space-y-2">
            {/* Full Payment Option */}
            <div 
              className="rounded-lg p-3 cursor-pointer transition-all border-2"
              style={{ 
                backgroundColor: selectedPaymentPlan === "full" ? "#f0fdf4" : "#fafafa",
                borderColor: selectedPaymentPlan === "full" ? "#1A9952" : "transparent"
              }}
              onClick={() => setSelectedPaymentPlan("full")}
            >
              {/* Header Row: Radio + Title + Badge */}
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: selectedPaymentPlan === "full" ? "#1A9952" : "#D1D5DB" }}
                >
                  {selectedPaymentPlan === "full" && (
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#1A9952" }} />
                  )}
                </div>
                <span className="text-sm font-semibold" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                  Full Payment
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
                  ★ Best
                </span>
              </div>
              {/* Description + Price Row */}
              <div className="flex items-center justify-between pl-7">
                <span className="text-xs text-gray-500">Pay once, done!</span>
                <span className="text-base font-bold" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Split Payment Option */}
            {shouldShowPaymentStructure() && paymentSchedule && (
              <div 
                className="rounded-lg p-3 cursor-pointer transition-all border-2"
                style={{ 
                  backgroundColor: selectedPaymentPlan === "split" ? "#f0fdf4" : "#fafafa",
                  borderColor: selectedPaymentPlan === "split" ? "#1A9952" : "transparent"
                }}
                onClick={() => setSelectedPaymentPlan("split")}
              >
                {/* Header Row: Radio + Title + Chevron */}
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: selectedPaymentPlan === "split" ? "#1A9952" : "#D1D5DB" }}
                  >
                    {selectedPaymentPlan === "split" && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#1A9952" }} />
                    )}
                  </div>
                  <span className="text-sm font-semibold flex-1" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Split Payment
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSplitPaymentExpanded(!isSplitPaymentExpanded);
                    }}
                    className="p-0.5"
                  >
                    {isSplitPaymentExpanded ? (
                      <ChevronUp className="w-4 h-4" style={{ color: "#1A9952" }} />
                    ) : (
                      <ChevronDown className="w-4 h-4" style={{ color: "#1A9952" }} />
                    )}
                  </button>
                </div>
                {/* Description + Price Row */}
                <div className="flex items-center justify-between pl-7">
                  <span className="text-xs text-gray-500">Easy instalments</span>
                  <span className="text-base font-bold" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                    ₹{calculateInitialPayment().toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Payment Schedule Dropdown */}
                {isSplitPaymentExpanded && (
                  <div className="mt-2 ml-7 bg-white border border-green-200 rounded-lg p-2">
                    <div className="text-[10px] font-semibold mb-2 flex items-center gap-1" style={{ color: "#06352A" }}>
                      <Info className="w-3 h-3" style={{ color: "#1A9952" }} />
                      Schedule ({paymentSchedule.type})
                    </div>
                    <div className="space-y-1">
                      {paymentSchedule.stages.map((stage: any, index: number) => (
                        <div key={index} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                          <span style={{ color: "#666" }}>{stage.label.replace(' Payment', '').replace('Initial', '1st').replace('Second', '2nd').replace('Final', '3rd')}</span>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold" style={{ color: "#1A9952" }}>₹{stage.amount.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-gray-400">{stage.when}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Proceed Button */}
          <Button
            onClick={processPayment}
            disabled={isProcessingPayment}
            className="w-full py-4 text-base font-semibold mt-4"
            style={{
              fontFamily: "Sweet Sans Pro",
              backgroundColor: "#1A9952",
              color: "white",
              borderRadius: "10px",
              opacity: (isProcessingPayment || !razorpayLoaded || !razorpayKeyId) ? 0.6 : 1
            }}
          >
            {isProcessingPayment ? "Processing..." : "Proceed to pay"}
          </Button>
        </SheetContent>
      </Sheet>


      <FloatingNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
