import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, ChevronUp, ChevronDown, Info } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

// Supabase configuration for Edge Functions
const SUPABASE_URL = 'https://leltckltotobsibixhqo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbHRja2x0b3RvYnNpYml4aHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzc5ODEsImV4cCI6MjA3NTk1Mzk4MX0._IrMgGQDJB7OvKEoT7pwWG9AjN6aeN1ejnj8IViDLyE';
import { useCart } from "@/context/CartContex";

import { snackBoxOrderService, addressService, paymentService } from "@/lib/supabase-service";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import DeliveryTimePicker from "@/components/DeliveryTimePicker";
import DeliveryDatePicker from "@/components/DeliveryDatePicker";
import { validateBangalorePincode, BANGALORE_VALIDATION_ERROR } from "@/lib/addressValidation";
import { analytics } from "@/lib/analytics";
import { facebookEvents } from "@/lib/facebook-capi";
import { getCurrentPosition, getLocationPermissionInstructions } from "@/lib/locationPermission";
import { openRazorpayModal } from "@/lib/payment-utils";

export default function SnackBoxDelivery() {
    const [, setLocation] = useLocation();
    const { cart, clearCart } = useCart();
    const { toast } = useToast();

    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    
    // Razorpay payment state
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentVerified, setPaymentVerified] = useState(false);
    const [isPaymentPlanOpen, setIsPaymentPlanOpen] = useState(false);
    const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<"full" | "split">("full");
    const [isSplitPaymentExpanded, setIsSplitPaymentExpanded] = useState(false);
    const [hasSelectedDateTime, setHasSelectedDateTime] = useState(false);
    const [paymentResponseData, setPaymentResponseData] = useState<{
        razorpayOrderId: string;
        razorpayPaymentId: string;
        razorpaySignature: string;
        razorpayReceipt: string;
    } | null>(null);
    const orderDataRef = useRef<any>(null);
    

    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [pincode, setPincode] = useState("");

    const [phone, setPhone] = useState(() => {
        const savedPhone = localStorage.getItem('phone');
        return savedPhone ? `+91 ${savedPhone}` : "";
    });
    const [email, setEmail] = useState(() => {
        const savedEmail = localStorage.getItem('email') || "";
        return savedEmail.includes('@phone.plattr.app') ? "" : savedEmail;
    });
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [saveAddressForFuture, setSaveAddressForFuture] = useState(false);
    const [doorstepDelivery, setDoorstepDelivery] = useState(false);

    const [appliedCoupon, setAppliedCoupon] = useState<{
        id: string;
        code: string;
        discount: number;
        discountType: 'percentage' | 'fixed' | 'free_delivery';
        discountValue: number;
        isFreeDelivery?: boolean;
    } | null>(() => {
        const saved = localStorage.getItem('snackBoxCoupon');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return null;
            }
        }
        return null;
    });

    const getMinDateTime = () => {
        const minTime = new Date(Date.now() + 6 * 60 * 60 * 1000);
        return {
            date: minTime.toISOString().split('T')[0],
            time: `${minTime.getHours().toString().padStart(2, '0')}:00`
        };
    };

    const minDateTime = getMinDateTime();
    const [eventDate, setEventDate] = useState(minDateTime.date);
    const [eventTime, setEventTime] = useState(minDateTime.time);

    const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'Plattr App',
                    },
                }
            );

            if (!response.ok) {
                console.warn('[SnackBoxDelivery] Reverse geocoding failed:', response.status, response.statusText);
                return false;
            }

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
        } catch (error: any) {
            console.error('[SnackBoxDelivery] Reverse geocoding error:', error);
            // Silently fail - user can still enter address manually
            return false;
        }
    }, []);

    const getCurrentLocation = () => {
        setLocation("/location/map?redirect=/snack-box-delivery");
    };

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

    useEffect(() => {
        if (cart.length === 0) {
            setLocation("/snack-box");
            return;
        }

        const savedLocation = localStorage.getItem('activeLocation');
        if (savedLocation) {
            try {
                const { lat, lng } = JSON.parse(savedLocation);
                if (lat && lng) {
                    reverseGeocode(lat, lng).catch((error) => {
                        console.error("[SnackBoxDelivery] Error in reverseGeocode:", error);
                        // Silently fail - user can still enter address manually
                    });
                }
            } catch (e) {
                console.error("Error parsing saved location:", e);
            }
        }
    }, [cart.length, setLocation, reverseGeocode]);

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const packagingFee = Math.round(subtotal * 0.06);
    const baseDeliveryCharges = Math.min(2000, Math.max(199, Math.round(subtotal * 0.06)));
    const deliveryCharges = appliedCoupon?.isFreeDelivery ? 0 : baseDeliveryCharges;
    const doorstepDeliveryFee = doorstepDelivery ? 300 : 0;
    const gst = Math.round(subtotal * 0.05);

    // Use sum of all charges for coupon eligibility (total bill amount)
    const totalForCoupon = subtotal + packagingFee + baseDeliveryCharges + doorstepDeliveryFee + gst;

    const discount = (() => {
        if (!appliedCoupon) return 0;
        if (appliedCoupon.isFreeDelivery) return 0; // Handled by deliveryCharges
        if (appliedCoupon.discountType === 'percentage') {
            return Math.floor(totalForCoupon * appliedCoupon.discountValue / 10) / 10;
        }
        if (appliedCoupon.discountType === 'fixed') {
            return appliedCoupon.discountValue;
        }
        return appliedCoupon.discount || 0;
    })();

    const grandTotal = totalForCoupon - (appliedCoupon?.isFreeDelivery ? baseDeliveryCharges : 0) - (appliedCoupon?.isFreeDelivery ? 0 : discount);

    // Load Razorpay script and get key ID
    useEffect(() => {
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
                } else if (data.error) {
                    console.warn('[SnackBoxDelivery] Payment gateway not configured:', data.error);
                }
            })
            .catch(error => {
                console.warn('[SnackBoxDelivery] Payment gateway initialization failed:', error.message);
            });

        // Load Razorpay script - check if already exists first
        const loadRazorpayScript = () => {
            // Check if Razorpay is already available
            if (window.Razorpay) {
                console.log('[SnackBoxDelivery] Razorpay already loaded');
                setRazorpayLoaded(true);
                return;
            }

            // Check if script tag already exists
            const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
            if (existingScript) {
                console.log('[SnackBoxDelivery] Razorpay script tag already exists, waiting for load...');
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
                console.log('[SnackBoxDelivery] Razorpay script loaded successfully');
                if (window.Razorpay) {
                    setRazorpayLoaded(true);
                } else {
                    console.warn('[SnackBoxDelivery] Script loaded but window.Razorpay not available');
                    // Retry after a short delay
                    setTimeout(() => {
                        if (window.Razorpay) {
                            setRazorpayLoaded(true);
                        }
                    }, 500);
                }
            };
            script.onerror = (error) => {
                console.error('[SnackBoxDelivery] Failed to load Razorpay script:', error);
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
    }, [toast]);

    // Track date/time selection
    useEffect(() => {
        if (eventDate && eventTime) {
            setHasSelectedDateTime(true);
        }
    }, [eventDate, eventTime]);

    // Helper function to determine payment case
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

    // Calculate initial payment amount
    const calculateInitialPayment = () => {
        const { case: paymentCase } = getPaymentCase();
        if (paymentCase === 4) return grandTotal;
        if (!paymentCase) return grandTotal;
        if (paymentCase === 3) return grandTotal;
        if (paymentCase === 1) return Math.round(grandTotal * 0.1);
        return Math.round(grandTotal * 0.8);
    };

    const getPaymentButtonText = () => {
        const { case: paymentCase } = getPaymentCase();
        if (paymentCase === 4) return "Pay";
        if (!paymentCase) return "Pay Now";
        if (paymentCase === 3) return "Pay Now";
        return "Pay Initial Amount";
    };

    const shouldShowPaymentStructure = () => {
        const { case: paymentCase } = getPaymentCase();
        return hasSelectedDateTime && eventDate && eventTime && (paymentCase === 1 || paymentCase === 2);
    };

    const calculatePaymentSchedule = () => {
        if (!shouldShowPaymentStructure()) return null;
        const { case: paymentCase, diffDays } = getPaymentCase();
        if (!paymentCase || paymentCase !== 1 && paymentCase !== 2) return null;

        const totalAmount = grandTotal;
        if (totalAmount <= 0) return null;

        if (paymentCase === 1) {
            const advance = Math.round(totalAmount * 0.1);
            const beforeDay = Math.round(totalAmount * 0.7);
            const remaining = Math.max(totalAmount - advance - beforeDay, 0);
            const delivery = new Date(eventDate);
            const oneDayBefore = new Date(delivery);
            oneDayBefore.setDate(oneDayBefore.getDate() - 1);

            return {
                type: "10-70-20" as const,
                stages: [
                    { label: "Initial Payment (10%)", description: "Pay 10% right away to book your slot.", amount: advance, when: "Now" },
                    { label: "Second Payment (70%)", description: "Pay 70% one day before delivery.", amount: beforeDay, when: `Before ${oneDayBefore.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` },
                    { label: "Final Payment (20%)", description: "Pay the remaining 20% on delivery.", amount: remaining, when: `Before ${delivery.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` },
                ],
            };
        }

        const immediate = Math.round(totalAmount * 0.8);
        const remaining = Math.max(totalAmount - immediate, 0);
        const delivery = new Date(eventDate);

        return {
            type: "80-20" as const,
            stages: [
                { label: "Initial Payment (80%)", description: "Pay 80% right away to confirm your slot.", amount: immediate, when: "Now" },
                { label: "Final Payment (20%)", description: "Pay the remaining 20% on delivery.", amount: remaining, when: `Before ${delivery.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` },
            ],
        };
    };

    const paymentSchedule = calculatePaymentSchedule();

    // Prepare order data for payment/submission
    const prepareOrderData = () => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const hasSavedAddress = selectedAddressId && uuidRegex.test(selectedAddressId);
        
        let validAddressId: string | undefined = undefined;
        let deliveryAddressText: string | undefined = undefined;
        
        if (hasSavedAddress) {
            validAddressId = selectedAddressId;
        } else if (addressLine1 && city && pincode) {
            deliveryAddressText = [addressLine1, addressLine2, city, state, pincode].filter(Boolean).join(", ");
        }

        const SNACK_BOX_ADDONS_KEY = "snackBoxAddons";
        let selectedAddons: string[] = [];
        const storedAddons = localStorage.getItem(SNACK_BOX_ADDONS_KEY);
        if (storedAddons) {
            try {
                selectedAddons = JSON.parse(storedAddons);
            } catch {
                selectedAddons = [];
            }
        }

        const items = cart.map(item => ({
            dishId: item.id.toString(),
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            image: item.image || '',
            image_url: item.image || '',
            imageUrl: item.image || '',
            metadata: item.metadata
        }));

        return {
            items,
            selectedAddons,
            subtotal,
            gst,
            platformFee: deliveryCharges,
            packagingFee,
            doorstepDeliveryFee,
            total: grandTotal,
            deliveryDate: eventDate,
            deliveryTime: eventTime,
            validAddressId,
            deliveryAddressText,
            saveAddressForFuture,
            addressLine2,
        };
    };

    // Handle payment button click
    const handlePayment = async () => {
        const orderData = prepareOrderData();
        
        if (!orderData.deliveryDate || !orderData.deliveryTime) {
            toast({
                title: "Date/Time Required",
                description: "Please select delivery date and time.",
                variant: "destructive",
            });
            return;
        }

        // Check 6-hour minimum
        const timeToParse = orderData.deliveryTime?.includes(" - ")
            ? orderData.deliveryTime.split(" - ")[0]
            : (orderData.deliveryTime || "12:00");
        let ISOtime = timeToParse;
        if (timeToParse.includes("AM") || timeToParse.includes("PM")) {
            const [time, modifier] = timeToParse.split(" ");
            let [hours, minutes] = time.split(":");
            if (hours === "12") hours = "00";
            if (modifier === "PM") hours = (parseInt(hours, 10) + 12).toString();
            ISOtime = `${hours.padStart(2, "0")}:${minutes}`;
        }
        const selectedDateTime = new Date(`${orderData.deliveryDate}T${ISOtime}`);
        const now = new Date();
        const hoursDiff = (selectedDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 6) {
            toast({
                title: "Invalid Date/Time",
                description: "Please select a date and time at least 6 hours from now.",
                variant: "destructive",
            });
            return;
        }

        if (!orderData.validAddressId && !orderData.deliveryAddressText) {
            if (!addressLine1 || !city || !pincode) {
                toast({
                    title: "Address Required",
                    description: "Please enter a complete address.",
                    variant: "destructive",
                });
                return;
            }
            if (!validateBangalorePincode(pincode)) {
                toast({
                    title: BANGALORE_VALIDATION_ERROR.title,
                    description: "Please enter a valid Bangalore pincode (starting with 560).",
                    variant: "destructive",
                });
                return;
            }
        }

        orderDataRef.current = {
            ...orderData,
            couponId: appliedCoupon?.id || undefined,
            couponCode: appliedCoupon?.code || undefined,
            discountApplied: discount,
        };

        setIsPaymentPlanOpen(true);
    };

    // Process payment after plan selection
    const processPayment = async () => {
        if (!razorpayKeyId) {
            try {
                const res = await fetch(`${SUPABASE_URL}/functions/v1/razorpay`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.keyId) {
                        setRazorpayKeyId(data.keyId);
                    } else {
                        toast({
                            title: "Payment Error",
                            description: data.error || "Payment gateway is not configured.",
                            variant: "destructive",
                        });
                        return;
                    }
                }
            } catch (error: any) {
                toast({
                    title: "Payment Error",
                    description: "Failed to initialize payment gateway.",
                    variant: "destructive",
                });
                return;
            }
        }

        setIsPaymentPlanOpen(false);
        const orderData = orderDataRef.current;
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
            const paymentAmount = selectedPaymentPlan === "full" ? grandTotal : calculateInitialPayment();
            
            const createOrderResponse = await fetch(`${SUPABASE_URL}/functions/v1/razorpay/create-order`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: paymentAmount,
                    currency: 'INR',
                    receipt: `snack-box-${Date.now()}`,
                }),
            });

            if (!createOrderResponse.ok) {
                const errorData = await createOrderResponse.json();
                throw new Error(errorData.error || 'Failed to create payment order');
            }

            const { orderId: razorpayOrderId, amount } = await createOrderResponse.json();

            // Open Razorpay modal directly
            await openRazorpayModal({
                razorpayKeyId: razorpayKeyId!,
                razorpayOrderId: razorpayOrderId,
                amount: amount / 100, // Convert from paise to rupees
                description: "Snack Box Order Payment",
                orderType: "snack_box",
                orderData: orderDataRef.current,
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
                description: error.message || "Failed to initiate payment.",
            });
            setIsProcessingPayment(false);
        }
    };

    // Create order after payment verification
    const createOrderAfterPayment = async (
        razorpayOrderId: string,
        razorpayPaymentId: string,
        razorpaySignature: string
    ) => {
        const orderData = orderDataRef.current;
        if (!orderData) {
            toast({
                title: "Error",
                description: "Order data not found.",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsCreatingOrder(true);

            const { supabaseAuth } = await import("@/lib/supabase-auth");
            const { data: { user: supabaseUser } } = await supabaseAuth.auth.getUser();
            const userId = supabaseUser?.id || localStorage.getItem('userId');
            
            if (!userId) {
                throw new Error('User not authenticated');
            }

            let finalAddressId = orderData.validAddressId;
            if (!finalAddressId && orderData.deliveryAddressText && orderData.saveAddressForFuture) {
                try {
                    const newAddress = await addressService.create({
                        label: "My Location",
                        address: orderData.deliveryAddressText,
                        landmark: orderData.addressLine2 || undefined,
                        isDefault: false,
                    });
                    finalAddressId = newAddress.id;
                } catch (addressError: any) {
                    console.error("Error creating address:", addressError);
                }
            }

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
                deliveryAddress: orderData.deliveryAddressText,
                couponId: orderData.couponId,
                discountApplied: orderData.discountApplied,
            };

            const createdOrder = await snackBoxOrderService.create(finalOrderData);

            const { case: paymentCase } = getPaymentCase();
            let paymentStage: 'initial' | 'second' | 'final' | 'full' = 'full';
            if (paymentCase === 1) {
                paymentStage = 'initial';
            } else if (paymentCase === 2) {
                paymentStage = 'initial';
            } else if (paymentCase === 3 || paymentCase === 4) {
                paymentStage = 'full';
            }

            const isTestPayment = razorpayKeyId?.includes('test') || razorpayKeyId?.includes('rzp_test') || false;

            if (createdOrder?.id) {
                const paymentPayload = {
                    orderId: createdOrder.id,
                    orderType: 'snack_box' as const,
                    orderNumber: createdOrder.order_number,
                    userId: userId,
                    paymentStage: paymentStage,
                    amount: calculateInitialPayment(),
                    razorpayOrderId: razorpayOrderId,
                    razorpayPaymentId: razorpayPaymentId,
                    razorpaySignature: razorpaySignature,
                    razorpayReceipt: razorpayOrderId,
                    paymentStatus: 'success' as const,
                    isTestPayment: isTestPayment,
                    orderItems: orderData.items,
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
                
                try {
                    await paymentService.create(paymentPayload);
                } catch (paymentError: any) {
                    console.error('[Payment] Error storing payment details:', paymentError);
                }
            }

            // Update order status to "confirmed" after payment (this will trigger notification via database trigger)
            if (createdOrder?.id) {
                try {
                    const { supabaseAuth } = await import("@/lib/supabase-auth");
                    
                    const { error: updateError } = await supabaseAuth
                        .from('snack_box_orders')
                        .update({ status: 'confirmed' })
                        .eq('id', createdOrder.id);
                    
                    if (updateError) {
                        console.error("Error updating order status:", updateError);
                        // Continue even if status update fails
                    } else {
                        console.log(`Order ${createdOrder.id} status updated to 'confirmed' - notification trigger will fire`);
                    }
                } catch (updateError: any) {
                    console.error("Error updating order status:", updateError);
                    // Continue even if status update fails
                }
            }

            localStorage.removeItem("snackBoxAddons");
            localStorage.removeItem("snackBoxCoupon");
            clearCart();

            const orderId = `snack-box-${Date.now()}`;
            analytics.trackOrderCompleted(orderId, orderData.total, cart.length, 'paid').catch(() => {});
            facebookEvents.trackPurchase(orderId, orderData.total, cart.length, cart.map(item => String(item.id)));

            toast({
                title: "Order Confirmed!",
                description: "Your snack box order has been placed successfully.",
            });

            // Send PUSH NOTIFICATION for order confirmation (FCM - order_status)
            const notifyUserId = userId || localStorage.getItem('userId');
            if (notifyUserId && createdOrder?.id) {
                fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: notifyUserId,
                        title: '🎉 Snack Box Order Confirmed!',
                        body: `Order #${createdOrder?.order_number || ''} confirmed! We'll start preparing your snack box.`,
                        event_name: 'order_confirmed',
                        category: 'transactional',
                        deep_link: createdOrder?.id ? `plattr://orders/${createdOrder.id}` : 'plattr://orders',
                        metadata: { 
                            order_id: createdOrder?.id, 
                            order_number: createdOrder?.order_number,
                            order_type: 'snack_box'
                        },
                    }),
                }).catch(err => console.log('[Notification] Failed to send snack box order notification:', err));
            }

            // Navigate to order status page
            if (createdOrder?.id) {
                setTimeout(() => {
                    setLocation(`/orders/${createdOrder.id}`, { replace: true });
                }, 200);
            } else {
                console.warn('[SnackBoxDelivery] Order created but ID not available, redirecting to orders page');
                setTimeout(() => {
                    setLocation("/orders", { replace: true });
                }, 200);
            }
        } catch (error: any) {
            console.error("Error creating order:", error);
            toast({
                variant: "destructive",
                title: "Order Failed",
                description: error.message || "Failed to create order.",
            });
        } finally {
            setIsCreatingOrder(false);
        }
    };

    // Handle submit order request (without payment)
    const handleSubmitOrder = async () => {
        try {
            setIsCreatingOrder(true);

            // Check 6-hour minimum advance booking
            if (eventDate) {
                // Support "1:00 PM - 2:00 PM" format from DeliveryTimePicker
                const timeToParse = eventTime?.includes(" - ")
                    ? eventTime.split(" - ")[0]
                    : (eventTime || "12:00");

                // Normalize format for Date constructor if it's like "1:00 PM"
                let ISOtime = timeToParse;
                if (timeToParse.includes("AM") || timeToParse.includes("PM")) {
                    const [time, modifier] = timeToParse.split(" ");
                    let [hours, minutes] = time.split(":");
                    if (hours === "12") hours = "00";
                    if (modifier === "PM") hours = (parseInt(hours, 10) + 12).toString();
                    ISOtime = `${hours.padStart(2, "0")}:${minutes}`;
                }

                const selectedDateTime = new Date(`${eventDate}T${ISOtime}`);
                const now = new Date();
                const hoursDiff = (selectedDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

                if (hoursDiff < 6) {
                    toast({
                        title: "Invalid Date/Time",
                        description: "Please select a date and time at least 6 hours from now.",
                        variant: "destructive",
                    });
                    setIsCreatingOrder(false);
                    return;
                }
            }

            let validAddressId: string | undefined = undefined;
            let deliveryAddressText: string | undefined = undefined;

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const hasSavedAddress = selectedAddressId && uuidRegex.test(selectedAddressId);

            if (hasSavedAddress) {
                validAddressId = selectedAddressId;
            } else {
                if (!addressLine1 || !addressLine1.trim()) {
                    toast({ title: "Address Required", description: "Please enter Address Line 1.", variant: "destructive" });
                    setIsCreatingOrder(false);
                    return;
                }
                if (!city || !city.trim()) {
                    toast({ title: "City Required", description: "Please enter the city.", variant: "destructive" });
                    setIsCreatingOrder(false);
                    return;
                }
                if (!pincode || !pincode.trim()) {
                    toast({ title: "Pincode Required", description: "Please enter the pincode.", variant: "destructive" });
                    setIsCreatingOrder(false);
                    return;
                }
                if (!validateBangalorePincode(pincode)) {
                    toast({ title: BANGALORE_VALIDATION_ERROR.title, description: "Please enter a valid Bangalore pincode (starting with 560).", variant: "destructive" });
                    setIsCreatingOrder(false);
                    return;
                }

                const fullAddress = [addressLine1, addressLine2, city, state, pincode].filter(Boolean).join(", ");
                if (saveAddressForFuture) {
                    const newAddress = await addressService.create({
                        label: "My Location",
                        address: fullAddress,
                        landmark: addressLine2 || undefined,
                        isDefault: false,
                    });
                    validAddressId = newAddress.id;
                } else {
                    deliveryAddressText = fullAddress;
                }
            }

            const SNACK_BOX_ADDONS_KEY = "snackBoxAddons";
            let selectedAddons: string[] = [];
            const storedAddons = localStorage.getItem(SNACK_BOX_ADDONS_KEY);
            if (storedAddons) {
                try {
                    selectedAddons = JSON.parse(storedAddons);
                } catch {
                    selectedAddons = [];
                }
            }

            const items = cart.map(item => ({
              dishId: item.id.toString(),
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              image: item.image || '',
              image_url: item.image || '',
              imageUrl: item.image || '',
              metadata: item.metadata
            }));

            const createdOrder = await snackBoxOrderService.create({
                items: items,
                selectedAddons: selectedAddons,
                subtotal: subtotal,
                gst: gst,
                platformFee: deliveryCharges,
                packagingFee: packagingFee,
                doorstepDeliveryFee: doorstepDeliveryFee,
                total: grandTotal,
                deliveryDate: eventDate,
                deliveryTime: eventTime,
                addressId: validAddressId,
                deliveryAddress: deliveryAddressText,
                couponId: appliedCoupon?.id || undefined,
                discountApplied: discount,
            });

            localStorage.removeItem("snackBoxAddons");
            localStorage.removeItem("snackBoxCoupon");
            clearCart();

            const orderId = createdOrder?.id || `snack-box-${Date.now()}`;
            analytics.trackOrderCompleted(orderId, grandTotal, cart.length, 'pending').catch(() => { });
            facebookEvents.trackPurchase(orderId, grandTotal, cart.length, cart.map(item => String(item.id)));

            toast({
                title: "Request Submitted!",
                description: "Your snack box order request has been sent. Our executive will contact you for confirmation.",
            });

            // Send notification for order request submission
            const { supabaseAuth } = await import("@/lib/supabase-auth");
            const { data: { user: supabaseUser } } = await supabaseAuth.auth.getUser();
            const notifyUserId = supabaseUser?.id || localStorage.getItem('userId');
            if (notifyUserId && createdOrder?.id) {
                fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: notifyUserId,
                        title: '📋 Snack Box Request Submitted!',
                        body: `Order request #${createdOrder?.order_number || ''} submitted. We'll contact you soon for confirmation.`,
                        event_name: 'order_request_submitted',
                        category: 'transactional',
                        deep_link: createdOrder?.id ? `plattr://orders/${createdOrder.id}` : 'plattr://orders',
                        metadata: { 
                            order_id: createdOrder?.id, 
                            order_number: createdOrder?.order_number,
                            order_type: 'snack_box',
                            status: 'pending'
                        },
                    }),
                }).catch(err => console.log('[Notification] Failed to send snack box order request notification:', err));
            }

            // Navigate to order status page (for pending orders without payment)
            if (createdOrder?.id) {
                setTimeout(() => {
                    setLocation(`/orders/${createdOrder.id}`, { replace: true });
                }, 200);
            } else {
                setTimeout(() => {
                    setLocation("/orders", { replace: true });
                }, 200);
            }
        } catch (error: any) {
            console.error("Error creating order:", error);
            toast({
                variant: "destructive",
                title: "Order Failed",
                description: error.message || "Failed to create order. Please try again.",
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
                paddingTop: '0'
            }}
        >
            <div 
                className="bg-white px-4 pb-4 border-b border-gray-100 sticky z-50"
                style={{
                    top: 0,
                    paddingTop: "64px",
                    paddingBottom: "16px"
                }}
            >
                <button
                    onClick={() => setLocation("/snack-box-addons")}
                    className="flex items-center gap-2 text-gray-700"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-semibold" style={{ fontFamily: "Sweet Sans Pro" }}>Back</span>
                </button>
            </div>

            <div className="px-4 py-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-6" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                    Proceed to Payment
                </h2>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                    <span className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                        Total Amount to be Paid
                    </span>
                    <span className="font-bold text-xl" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                        ₹{grandTotal.toLocaleString('en-IN')}
                    </span>
                </div>

                {/* Payment Schedule Display (Case 1 & 2 only) */}
                {shouldShowPaymentStructure() && paymentSchedule && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-sm" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                Payment Schedule ({paymentSchedule.type})
                            </h3>
                            <button
                                onClick={() => setIsSplitPaymentExpanded(!isSplitPaymentExpanded)}
                                className="p-1"
                            >
                                {isSplitPaymentExpanded ? (
                                    <ChevronUp className="w-4 h-4" style={{ color: "#1A9952" }} />
                                ) : (
                                    <ChevronDown className="w-4 h-4" style={{ color: "#1A9952" }} />
                                )}
                            </button>
                        </div>
                        {isSplitPaymentExpanded && (
                            <div className="space-y-2 mt-2">
                                {paymentSchedule.stages.map((stage: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between text-xs py-1 border-b border-green-100 last:border-0">
                                        <span style={{ color: "#666" }}>{stage.label.replace(' Payment', '').replace('Initial', '1st').replace('Second', '2nd').replace('Final', '3rd')}</span>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold" style={{ color: "#1A9952" }}>₹{stage.amount.toLocaleString('en-IN')}</span>
                                            <span className="text-[10px] text-gray-400">{stage.when}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-4 mb-6">
                    <DeliveryDatePicker
                        value={eventDate}
                        onChange={(date) => {
                            setEventDate(date);
                            setHasSelectedDateTime(true);
                        }}
                        minDate={new Date(minDateTime.date)}
                    />

                    <DeliveryTimePicker
                        mealType="all"
                        value={eventTime}
                        onChange={(time) => {
                            setEventTime(time);
                            setHasSelectedDateTime(true);
                        }}
                        selectedDate={eventDate}
                    />

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                            Enter Your Phone Number
                        </label>
                        <input
                            type="tel"
                            placeholder="+91 98552 12375"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            style={{ fontFamily: "Sweet Sans Pro" }}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                            Enter Your Email Address
                        </label>
                        <input
                            type="email"
                            placeholder="example@gmail.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            style={{ fontFamily: "Sweet Sans Pro" }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                            Choose Saved Address (Optional)
                        </label>
                        <select
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            style={{ fontFamily: "Sweet Sans Pro", color: selectedAddressId ? "#06352A" : "#9CA3AF" }}
                            value={selectedAddressId}
                            onChange={(e) => handleSavedAddressChange(e.target.value)}
                        >
                            <option value="">Select Address (Optional)</option>
                            {savedAddresses.map((address: any) => (
                                <option key={address.id} value={address.id}>
                                    {address.label} {address.isDefault ? "(Default)" : ""}
                                </option>
                            ))}
                        </select>

                        {selectedAddress && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
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

                    <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-50 border-2 border-dashed border-green-500 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                        style={{ fontFamily: "Sweet Sans Pro" }}
                    >
                        <MapPin className="w-5 h-5 text-green-600" />
                        <span className="text-green-700 font-medium">
                            {isGettingLocation ? "Getting Location..." : "Use Current Location"}
                        </span>
                    </button>

                    {!isAddressFieldsDisabled && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    Address Line 1
                                </label>
                                <input
                                    type="text"
                                    placeholder="Door No. 32, Jaya Prakash Nagar"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    style={{ fontFamily: "Sweet Sans Pro" }}
                                    value={addressLine1}
                                    onChange={(e) => setAddressLine1(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                    Address Line 2
                                </label>
                                <input
                                    type="text"
                                    placeholder="Near Metro Station, JP Nagar"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    style={{ fontFamily: "Sweet Sans Pro" }}
                                    value={addressLine2}
                                    onChange={(e) => setAddressLine2(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Bengaluru"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        style={{ fontFamily: "Sweet Sans Pro" }}
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ fontFamily: "Sweet Sans Pro", color: "#06352A" }}>
                                        Pincode
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="560001"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        style={{ fontFamily: "Sweet Sans Pro" }}
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value)}
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={saveAddressForFuture}
                                    onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                                    className="w-5 h-5 rounded border-2 border-gray-300"
                                    style={{ accentColor: "#1A9952" }}
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
                                    onChange={(e) => setDoorstepDelivery(e.target.checked)}
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
                </div>

                {(appliedCoupon || discount > 0) && (
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
                                    {appliedCoupon?.isFreeDelivery ? "FREE" : `₹${deliveryCharges.toLocaleString('en-IN')}`}
                                </span>
                            </div>
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
                    )}

                {/* Payment Buttons */}
                <div className="space-y-3">
                    {/* Pay Button */}
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
                                : getPaymentButtonText()
                            }
                        </span>
                        {!(isProcessingPayment || isCreatingOrder) && (
                            <span className="font-bold text-xl">
                                ₹{grandTotal.toLocaleString('en-IN')}
                            </span>
                        )}
                    </Button>

                    {/* Submit Order Request Button */}
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
                                <div className="flex items-center justify-between pl-7">
                                    <span className="text-xs text-gray-500">Easy instalments</span>
                                    <span className="text-base font-bold" style={{ fontFamily: "Sweet Sans Pro", color: "#1A9952" }}>
                                        ₹{calculateInitialPayment().toLocaleString('en-IN')}
                                    </span>
                                </div>

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
                        disabled={isProcessingPayment || !razorpayLoaded || !razorpayKeyId}
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

        </div>
    );
}
