import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, MapPin, Package, Calendar, IndianRupee, Info, Loader2, CheckCircle } from "lucide-react";
import { orderService, bulkMealOrderService, sixtyMinBulkOrderService, mealboxOrderService, sixtyMinMealboxOrderService, snackBoxOrderService, addressService, paymentService, snackBoxService } from "@/lib/supabase-service";
import { getSupabaseImageUrl } from "@/lib/supabase";
import { supabaseAuth } from "@/lib/supabase-auth";
import { useGoBack } from "@/hooks/useGoBack";
import { useToast } from "@/hooks/use-toast";
import { getApiUrl } from "@/config/api";
import { openRazorpayModal } from "@/lib/payment-utils";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface OrderItem {
  id: string;
  quantity: number;
  price: string;
  dish: {
    id: string;
    name: string;
    description: string;
    price: string;
    imageUrl: string;
    dietaryType: string;
  };
}

interface OrderDetails {
  id: string;
  orderNumber: number;
  subtotal: string;
  deliveryFee: string;
  tax: string;
  total: string;
  deliveryDate: string;
  deliveryTime: string;
  status: string;
  createdAt: string;
  address: {
    id: string;
    label: string;
    address: string;
    landmark: string | null;
  };
  items: OrderItem[];
}

const STATUS_VARIANTS = {
  pending: { variant: 'secondary' as const, label: 'Pending', color: 'text-yellow-600' },
  confirmed: { variant: 'default' as const, label: 'Confirmed', color: 'text-blue-600' },
  preparing: { variant: 'secondary' as const, label: 'Preparing', color: 'text-orange-600' },
  delivering: { variant: 'default' as const, label: 'Out for Delivery', color: 'text-purple-600' },
  delivered: { variant: 'outline' as const, label: 'Delivered', color: 'text-green-600' },
  cancelled: { variant: 'destructive' as const, label: 'Cancelled', color: 'text-red-600' },
};

// Placeholder image as data URI (simple gray square with icon)
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f3f4f6'/%3E%3Cpath d='M100 70 L130 100 L100 130 L70 100 Z' fill='%239ca3af'/%3E%3C/svg%3E";

/**
 * Helper function to get snack box dish image URL
 * Uses cached dishes list or constructs URL from stored data
 * Handles broken sanishtech.com URLs by converting to Supabase storage
 */
function getSnackBoxDishImageUrl(
  dishId: string | number, 
  storedImageUrl: string | undefined,
  allDishes: any[] = []
): string {
  const prefix = "https://leltckltotobsibixhqo.supabase.co/storage/v1/object/public/dish_images/snack-box/";
  
  // Helper to normalize image URL
  const normalizeImageUrl = (url: string, id: string | number): string => {
    if (!url || !url.trim()) return '';
    
    // If it's a broken legacy URL from sanishtech.com, convert to Supabase storage
    if (url.includes("sanishtech.com")) {
      const normalizedId = id.toString().toLowerCase().replace(/\s+/g, '-');
      return `${prefix}${normalizedId}.png`;
    }
    
    // If it's already a full URL (and not broken), use it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // It's a relative path/filename - construct full URL
    const cleanPath = url.startsWith('/') ? url.slice(1) : url;
    return `${prefix}${cleanPath}`;
  };
  
  // If image is already stored, normalize and use it
  if (storedImageUrl && storedImageUrl.trim()) {
    const normalized = normalizeImageUrl(storedImageUrl, dishId);
    if (normalized) return normalized;
  }

  // Try to find dish in cached list - handle different ID formats
  if (allDishes.length > 0 && dishId) {
    const dishIdStr = dishId.toString();
    const dishIdNum = parseInt(dishIdStr.replace(/\D/g, '') || '0');
    
    const dish = allDishes.find(d => {
      const dId = d.id?.toString() || '';
      // Exact match
      if (dId === dishIdStr) return true;
      // Numeric match (e.g., "37" matches "D-0037" or "37")
      const dIdNum = parseInt(dId.replace(/\D/g, '') || '0');
      if (dIdNum > 0 && dIdNum === dishIdNum) return true;
      return false;
    });
    
    if (dish && (dish.image_url || dish.imageUrl)) {
      const dbImageUrl = dish.image_url || dish.imageUrl;
      if (dbImageUrl && dbImageUrl.trim()) {
        const normalized = normalizeImageUrl(dbImageUrl, dishId);
        if (normalized) return normalized;
      }
    }
  }

  return PLACEHOLDER_IMAGE;
}

export default function OrderDetailsPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/orders/:orderId");
  const orderId = params?.orderId;
  const goBack = useGoBack('/orders');
  const { toast } = useToast();
  
  // Payment state
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [paidStages, setPaidStages] = useState<string[]>(['initial']);
  
  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = async () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => console.error('Failed to load Razorpay SDK');
      document.body.appendChild(script);
    };
    loadRazorpay();
  }, []);

  // Fetch Razorpay key
  useEffect(() => {
    const fetchKey = async () => {
      try {
        const response = await fetch(getApiUrl('/api/payments/key'));
        if (!response.ok) throw new Error('Failed to fetch key');
        const data = await response.json();
        if (data.key) setRazorpayKeyId(data.key);
      } catch (error) {
        console.error('Error fetching Razorpay key:', error);
      }
    };
    fetchKey();
  }, []);

  // Try to fetch from different order tables
  const { data: order, isLoading } = useQuery<OrderDetails | any>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      
      // First try regular orders table
      try {
        return await orderService.getById(orderId);
      } catch (error: any) {
        // If not found in orders, try bulk_meal_orders
        try {
          const bulkOrder = await bulkMealOrderService.getById(orderId);
          
          // Parse items JSON string
          let items = [];
          if (bulkOrder.items) {
            try {
              const parsedItems = typeof bulkOrder.items === 'string' 
                ? JSON.parse(bulkOrder.items) 
                : bulkOrder.items;
              
              // Transform items to match OrderDetails format
              items = parsedItems.map((item: any) => ({
                id: item.dishId || item.id || '',
                quantity: item.quantity || 0,
                price: (item.price || 0).toString(),
                dish: {
                  id: item.dishId || item.id || '',
                  name: item.name || `Dish ${item.dishId || ''}`,
                  description: item.description || '',
                  price: (item.price || 0).toString(),
                  imageUrl: item.image || item.image_url || item.imageUrl || '',
                  dietaryType: item.dietary_type || 'Regular',
                },
              }));
            } catch (parseError) {
              console.error('Error parsing bulk order items:', parseError);
            }
          }
          
          // Transform bulk order to match OrderDetails format
          return {
            id: bulkOrder.id,
            orderNumber: bulkOrder.order_number,
            subtotal: bulkOrder.subtotal?.toString() || '0',
            deliveryFee: bulkOrder.platform_fee?.toString() || '0',
            tax: bulkOrder.gst?.toString() || '0',
            total: bulkOrder.total?.toString() || '0',
            deliveryDate: bulkOrder.delivery_date || '',
            deliveryTime: bulkOrder.delivery_time || '',
            status: bulkOrder.status || 'pending',
            createdAt: bulkOrder.created_at || '',
            address: {
              id: bulkOrder.address_id || '',
              label: 'Delivery Address',
              address: bulkOrder.delivery_address || '',
              landmark: null,
            },
            items: items,
          };
        } catch (bulkError: any) {
          // If not found in bulk_meal_orders, try sixty_min_bulk_orders
          try {
            const sixtyMinOrder = await sixtyMinBulkOrderService.getById(orderId);
            
            // Parse items (could be JSON string or JSONB)
            let items = [];
            if (sixtyMinOrder.items) {
              try {
                const parsedItems = typeof sixtyMinOrder.items === 'string' 
                  ? JSON.parse(sixtyMinOrder.items) 
                  : sixtyMinOrder.items;
                
                // Transform items to match OrderDetails format
                items = Array.isArray(parsedItems) ? parsedItems.map((item: any) => ({
                  id: item.dishId || item.id || '',
                  quantity: item.quantity || 0,
                  price: (item.price || item.unit_price || 0).toString(),
                  dish: {
                    id: item.dishId || item.id || '',
                    name: item.dish_name || item.name || `Dish ${item.dishId || ''}`,
                    description: item.description || '',
                    price: (item.price || item.unit_price || 0).toString(),
                    imageUrl: item.image || item.image_url || item.imageUrl || '',
                    dietaryType: item.dietary_type || 'Regular',
                  },
                })) : [];
              } catch (parseError) {
                console.error('Error parsing 60-min order items:', parseError);
              }
            }
            
            // Transform 60-min order to match OrderDetails format
            return {
              id: sixtyMinOrder.id,
              orderNumber: sixtyMinOrder.order_number,
              subtotal: sixtyMinOrder.subtotal?.toString() || '0',
              deliveryFee: sixtyMinOrder.platform_fee?.toString() || '0',
              tax: sixtyMinOrder.gst?.toString() || '0',
              total: sixtyMinOrder.total?.toString() || '0',
              deliveryDate: sixtyMinOrder.delivery_date || '',
              deliveryTime: sixtyMinOrder.delivery_time || '',
              status: sixtyMinOrder.status || 'pending',
              createdAt: sixtyMinOrder.created_at || '',
              address: {
                id: '',
                label: 'Delivery Address',
                address: sixtyMinOrder.delivery_address || '',
                landmark: null,
              },
              items: items,
            };
          } catch (sixtyMinError: any) {
            // If not found in bulk orders, try mealbox_orders
            try {
              const mealboxOrder = await mealboxOrderService.getById(orderId);
              
              // Fetch address if address_id exists
              let addressText = '';
              let addressLabel = 'Delivery Address';
              if (mealboxOrder.address_id) {
                try {
                  const addresses = await addressService.getAll();
                  const address = addresses.find(addr => addr.id === mealboxOrder.address_id);
                  if (address) {
                    addressText = address.address || '';
                    addressLabel = address.label || 'Delivery Address';
                  }
                } catch (addrError) {
                  console.error('Error fetching address for mealbox order:', addrError);
                }
              }
              
              // Try to fetch items from payment record
              let items: any[] = [];
              try {
                const payments = await paymentService.getByOrderId(orderId);
                console.log('[OrderDetails] Payment records found:', payments?.length || 0);
                if (payments && payments.length > 0) {
                  // Get items from the first payment record
                  const firstPayment = payments[0];
                  console.log('[OrderDetails] First payment order_items:', firstPayment.order_items);
                  if (firstPayment.order_items) {
                    const parsedItems = typeof firstPayment.order_items === 'string' 
                      ? JSON.parse(firstPayment.order_items) 
                      : firstPayment.order_items;
                    items = Array.isArray(parsedItems) ? parsedItems.map((item: any) => {
                      // Get stored image URL and process it through getSupabaseImageUrl
                      const storedImageUrl = item.image || item.image_url || item.imageUrl;
                      const processedImageUrl = storedImageUrl ? getSupabaseImageUrl(storedImageUrl) : PLACEHOLDER_IMAGE;
                      
                      return {
                        id: item.dishId || item.id || '',
                        quantity: item.quantity || 0,
                        price: (item.price || 0).toString(),
                        dish: {
                          id: item.dishId || item.id || '',
                          name: item.name || `Item ${item.dishId || ''}`,
                          description: item.description || '',
                          price: (item.price || 0).toString(),
                          imageUrl: processedImageUrl,
                          dietaryType: item.dietary_type || 'Regular',
                        },
                      };
                    }) : [];
                    console.log('[OrderDetails] Items from payment:', items.length);
                  }
                }
              } catch (paymentError) {
                console.error('[OrderDetails] Error fetching payment items for mealbox order:', paymentError);
              }
              
              // If no items from payment, try to construct items from plate selections
              if (items.length === 0) {
                console.log('[OrderDetails] No items from payment, parsing plate selections...');
                try {
                  console.log('[OrderDetails] Mealbox order data:', {
                    veg_boxes: mealboxOrder.veg_boxes,
                    egg_boxes: mealboxOrder.egg_boxes,
                    non_veg_boxes: mealboxOrder.non_veg_boxes,
                    has_veg_selections: !!mealboxOrder.veg_plate_selections,
                    has_egg_selections: !!mealboxOrder.egg_plate_selections,
                    has_non_veg_selections: !!mealboxOrder.non_veg_plate_selections,
                  });
                  const vegSelections = mealboxOrder.veg_plate_selections 
                    ? (typeof mealboxOrder.veg_plate_selections === 'string' 
                        ? JSON.parse(mealboxOrder.veg_plate_selections) 
                        : mealboxOrder.veg_plate_selections)
                    : [];
                  const eggSelections = mealboxOrder.egg_plate_selections 
                    ? (typeof mealboxOrder.egg_plate_selections === 'string' 
                        ? JSON.parse(mealboxOrder.egg_plate_selections) 
                        : mealboxOrder.egg_plate_selections)
                    : [];
                  const nonVegSelections = mealboxOrder.non_veg_plate_selections 
                    ? (typeof mealboxOrder.non_veg_plate_selections === 'string' 
                        ? JSON.parse(mealboxOrder.non_veg_plate_selections) 
                        : mealboxOrder.non_veg_plate_selections)
                    : [];
                  
                  // Collect all unique dish IDs from all selections
                  const allDishIds = new Set<string>();
                  [...vegSelections, ...eggSelections, ...nonVegSelections].forEach((sel: any) => {
                    if (sel.item?.id) {
                      allDishIds.add(sel.item.id.toString());
                    }
                  });
                  
                  // Fetch dish data from database for all dish IDs
                  const dishDataMap = new Map<string, { name: string; price: number; image_url: string }>();
                  if (allDishIds.size > 0) {
                    try {
                      const dishIdsArray = Array.from(allDishIds);
                      console.log('[OrderDetails] Fetching dishes from database for IDs:', dishIdsArray);
                      
                      const { data: dishes, error: dishesError } = await supabaseAuth
                        .from('dishes')
                        .select('id, name, price, image_url, quantity')
                        .in('id', dishIdsArray);
                      
                      if (dishesError) {
                        console.error('[OrderDetails] Error fetching dishes:', dishesError);
                      } else if (dishes) {
                        dishes.forEach((dish: any) => {
                          dishDataMap.set(dish.id.toString(), {
                            name: dish.name || '',
                            price: parseFloat(dish.price || '0'),
                            image_url: dish.image_url || '',
                          });
                        });
                        console.log('[OrderDetails] Fetched', dishes.length, 'dishes from database');
                      }
                    } catch (fetchError) {
                      console.error('[OrderDetails] Error fetching dishes from database:', fetchError);
                    }
                  }
                  
                  // Group dishes by ID and sum quantities
                  const dishMap = new Map<string, { name: string; price: number; quantity: number; dietaryType: string; imageUrl: string }>();
                  
                  const processSelections = (selections: any[], dietaryType: string) => {
                    selections.forEach((sel: any) => {
                      if (sel.item) {
                        const dishId = sel.item.id?.toString() || '';
                        
                        // Try to get dish data from database first, then fall back to stored data
                        const dbDish = dishDataMap.get(dishId);
                        const dishName = dbDish?.name || sel.item.name || `Dish ${dishId}`;
                        const dishPrice = dbDish?.price || parseFloat(sel.item.price || '0');
                        
                        // Get image URL: prefer database, then stored, then placeholder
                        let storedImageUrl = dbDish?.image_url || sel.item.image_url || sel.item.imageUrl;
                        const dishImage = storedImageUrl ? getSupabaseImageUrl(storedImageUrl) : PLACEHOLDER_IMAGE;
                        
                        if (dishMap.has(dishId)) {
                          const existing = dishMap.get(dishId)!;
                          existing.quantity += 1;
                        } else {
                          dishMap.set(dishId, {
                            name: dishName,
                            price: dishPrice,
                            quantity: 1,
                            dietaryType: dietaryType,
                            imageUrl: dishImage,
                          });
                        }
                      }
                    });
                  };
                  
                  if (mealboxOrder.veg_boxes > 0) {
                    processSelections(vegSelections, 'veg');
                  }
                  if (mealboxOrder.egg_boxes > 0) {
                    processSelections(eggSelections, 'egg');
                  }
                  if (mealboxOrder.non_veg_boxes > 0) {
                    processSelections(nonVegSelections, 'non-veg');
                  }
                  
                  // Convert map to items array
                  items = Array.from(dishMap.entries()).map(([dishId, dishData]) => ({
                    id: dishId,
                    quantity: dishData.quantity,
                    price: (dishData.price * dishData.quantity).toString(),
                    dish: {
                      id: dishId,
                      name: dishData.name,
                      description: '',
                      price: dishData.price.toString(),
                      imageUrl: dishData.imageUrl,
                      dietaryType: dishData.dietaryType,
                    },
                  }));
                  
                  // Add mealbox summary item
                  const totalBoxes = (mealboxOrder.veg_boxes || 0) + (mealboxOrder.egg_boxes || 0) + (mealboxOrder.non_veg_boxes || 0);
                  if (totalBoxes > 0) {
                    items.unshift({
                      id: 'mealbox-summary',
                      quantity: totalBoxes,
                      price: mealboxOrder.subtotal?.toString() || '0',
                      dish: {
                        id: 'mealbox',
                        name: 'MealBox',
                        description: `Veg: ${mealboxOrder.veg_boxes || 0}, Egg: ${mealboxOrder.egg_boxes || 0}, Non-Veg: ${mealboxOrder.non_veg_boxes || 0}`,
                        price: (parseFloat(mealboxOrder.subtotal || '0') / totalBoxes).toString(),
                        imageUrl: PLACEHOLDER_IMAGE,
                        dietaryType: 'Mixed',
                      },
                    });
                  }
                  
                  console.log('[OrderDetails] Items from plate selections:', items.length);
                } catch (parseError) {
                  console.error('[OrderDetails] Error parsing plate selections:', parseError);
                }
              }
              
              // If still no items, create a basic mealbox item from order totals
              if (items.length === 0) {
                console.log('[OrderDetails] Still no items, creating basic mealbox item from totals...');
                const totalBoxes = (mealboxOrder.veg_boxes || 0) + (mealboxOrder.egg_boxes || 0) + (mealboxOrder.non_veg_boxes || 0);
                if (totalBoxes > 0) {
                  items = [{
                    id: 'mealbox-summary',
                    quantity: totalBoxes,
                    price: mealboxOrder.subtotal?.toString() || '0',
                    dish: {
                      id: 'mealbox',
                      name: 'MealBox',
                      description: `Veg: ${mealboxOrder.veg_boxes || 0}, Egg: ${mealboxOrder.egg_boxes || 0}, Non-Veg: ${mealboxOrder.non_veg_boxes || 0}`,
                      price: (parseFloat(mealboxOrder.subtotal || '0') / totalBoxes).toString(),
                      imageUrl: PLACEHOLDER_IMAGE,
                      dietaryType: 'Mixed',
                    },
                  }];
                  console.log('[OrderDetails] Created basic mealbox item:', items);
                }
              }
              
              console.log('[OrderDetails] Final items array length:', items.length);
              
              // Transform mealbox order to match OrderDetails format
              return {
                id: mealboxOrder.id,
                orderNumber: mealboxOrder.order_number,
                subtotal: mealboxOrder.subtotal?.toString() || '0',
                deliveryFee: mealboxOrder.delivery_fee?.toString() || '0',
                tax: mealboxOrder.tax?.toString() || '0',
                total: mealboxOrder.total?.toString() || '0',
                deliveryDate: mealboxOrder.delivery_date || '',
                deliveryTime: mealboxOrder.delivery_time || '',
                status: mealboxOrder.status || 'pending',
                createdAt: mealboxOrder.created_at || '',
                address: {
                  id: mealboxOrder.address_id || '',
                  label: addressLabel,
                  address: addressText,
                  landmark: null,
                },
                items: items,
              };
            } catch (mealboxError: any) {
              // If not found in mealbox_orders, try sixty_min_mealbox_orders
              try {
                const sixtyMinMealboxOrder = await sixtyMinMealboxOrderService.getById(orderId);
                
                // Try to fetch items from payment record
                let items: any[] = [];
                try {
                  const payments = await paymentService.getByOrderId(orderId);
                  if (payments && payments.length > 0) {
                    // Get items from the first payment record
                    const firstPayment = payments[0];
                    if (firstPayment.order_items) {
                      const parsedItems = typeof firstPayment.order_items === 'string' 
                        ? JSON.parse(firstPayment.order_items) 
                        : firstPayment.order_items;
                      items = Array.isArray(parsedItems) ? parsedItems.map((item: any) => {
                        // Get stored image URL and process it through getSupabaseImageUrl
                        const storedImageUrl = item.image || item.image_url || item.imageUrl;
                        const processedImageUrl = storedImageUrl ? getSupabaseImageUrl(storedImageUrl) : PLACEHOLDER_IMAGE;
                        
                        return {
                          id: item.dishId || item.id || '',
                          quantity: item.quantity || 0,
                          price: (item.price || 0).toString(),
                          dish: {
                            id: item.dishId || item.id || '',
                            name: item.name || `Item ${item.dishId || ''}`,
                            description: item.description || '',
                            price: (item.price || 0).toString(),
                            imageUrl: processedImageUrl,
                            dietaryType: item.dietary_type || 'Regular',
                          },
                        };
                      }) : [];
                    }
                  }
                } catch (paymentError) {
                  console.error('Error fetching payment items for 60-min mealbox order:', paymentError);
                }
                
                // Transform 60-min mealbox order to match OrderDetails format
                return {
                  id: sixtyMinMealboxOrder.id,
                  orderNumber: sixtyMinMealboxOrder.order_number,
                  subtotal: sixtyMinMealboxOrder.subtotal?.toString() || '0',
                  deliveryFee: sixtyMinMealboxOrder.delivery_fee?.toString() || '0',
                  tax: sixtyMinMealboxOrder.tax?.toString() || '0',
                  total: sixtyMinMealboxOrder.total?.toString() || '0',
                  deliveryDate: sixtyMinMealboxOrder.delivery_date || '',
                  deliveryTime: sixtyMinMealboxOrder.delivery_time || '',
                  status: sixtyMinMealboxOrder.status || 'pending',
                  createdAt: sixtyMinMealboxOrder.created_at || '',
                  address: {
                    id: '',
                    label: 'Delivery Address',
                    address: sixtyMinMealboxOrder.delivery_address || '',
                    landmark: null,
                  },
                  items: items,
                };
              } catch (sixtyMinMealboxError: any) {
                // If not found in sixty_min_mealbox_orders, try snack_box_orders
                try {
                  const snackBoxOrder = await snackBoxOrderService.getById(orderId);
                  
                  // Fetch all snack box dishes once for image lookup
                  let allSnackBoxDishes: any[] = [];
                  try {
                    allSnackBoxDishes = await snackBoxService.getAll();
                  } catch (dishError) {
                    // Silently fail - will use placeholder
                  }
                  
                  // Parse items from snack box order
                  let items = [];
                  if (snackBoxOrder.items) {
                    try {
                      const parsedItems = typeof snackBoxOrder.items === 'string' 
                        ? JSON.parse(snackBoxOrder.items) 
                        : snackBoxOrder.items;
                      
                      // Transform items and get images
                      items = (Array.isArray(parsedItems) ? parsedItems : []).map((item: any) => {
                        const storedImage = item.image || item.image_url || item.imageUrl || '';
                        const dishId = item.dishId || item.id;
                        const imageUrl = getSnackBoxDishImageUrl(dishId, storedImage, allSnackBoxDishes);
                        
                        return {
                          id: dishId || '',
                          quantity: item.quantity || 0,
                          price: (item.price || 0).toString(),
                          dish: {
                            id: dishId || '',
                            name: item.name || `Item ${dishId || ''}`,
                            description: item.description || '',
                            price: (item.price || 0).toString(),
                            imageUrl: imageUrl,
                            dietaryType: item.dietary_type || 'Regular',
                          },
                        };
                      });
                    } catch (parseError) {
                      console.error('Error parsing snack box order items:', parseError);
                    }
                  }
                  
                  // Fetch address if address_id exists (snack box may have address_id or delivery_address)
                  let snackAddressText = snackBoxOrder.delivery_address || '';
                  let snackAddressLabel = 'Delivery Address';
                  if (snackBoxOrder.address_id && !snackAddressText) {
                    try {
                      const addresses = await addressService.getAll();
                      const address = addresses.find(addr => addr.id === snackBoxOrder.address_id);
                      if (address) {
                        snackAddressText = address.address || '';
                        snackAddressLabel = address.label || 'Delivery Address';
                      }
                    } catch (addrError) {
                      console.error('Error fetching address for snack box order:', addrError);
                    }
                  }
                  
                  // Transform snack box order to match OrderDetails format
                  return {
                    id: snackBoxOrder.id,
                    orderNumber: snackBoxOrder.order_number,
                    subtotal: snackBoxOrder.subtotal?.toString() || '0',
                    deliveryFee: snackBoxOrder.platform_fee?.toString() || '0',
                    tax: snackBoxOrder.gst?.toString() || '0',
                    total: snackBoxOrder.total?.toString() || '0',
                    deliveryDate: snackBoxOrder.delivery_date || '',
                    deliveryTime: snackBoxOrder.delivery_time || '',
                    status: snackBoxOrder.status || 'pending',
                    createdAt: snackBoxOrder.created_at || '',
                    address: {
                      id: snackBoxOrder.address_id || '',
                      label: snackAddressLabel,
                      address: snackAddressText,
                      landmark: null,
                    },
                    items: items,
                  };
                } catch (snackBoxError: any) {
                  console.error('[OrderDetails] Error fetching snack box order:', snackBoxError);
                  // If not found in snack_box_orders either, throw the snack box error
                  throw snackBoxError;
                }
              }
            }
          }
        }
      }
    },
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Order Not Found</h1>
          <p className="text-muted-foreground mb-4">
            We couldn't find this order. It may have been removed or doesn't exist.
          </p>
          <Button onClick={() => setLocation('/orders')}>
            Back to Orders
          </Button>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_VARIANTS[order.status as keyof typeof STATUS_VARIANTS] || STATUS_VARIANTS.pending;

  const calculatePaymentSchedule = () => {
    if (!order.deliveryDate || !order.total) return null;

    const totalAmount = parseFloat(order.total);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) return null;

    // Case 4: If total <= ₹1000, full payment was made - no schedule needed
    if (totalAmount <= 1000) {
      return {
        type: "full" as const,
        stages: [
          {
            key: "full",
            label: "Full Payment",
            description: "Complete payment made at order placement.",
            amount: totalAmount,
            when: "Paid at order placement",
            dueDate: new Date().toISOString(),
            status: "paid",
          },
        ],
      };
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const delivery = new Date(order.deliveryDate);
    const deliveryStart = new Date(
      delivery.getFullYear(),
      delivery.getMonth(),
      delivery.getDate()
    );

    const diffMs = deliveryStart.getTime() - todayStart.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Case 3: Same day delivery - full payment was made
    if (diffDays < 1) {
      return {
        type: "full" as const,
        stages: [
          {
            key: "full",
            label: "Full Payment",
            description: "Complete payment made at order placement.",
            amount: totalAmount,
            when: "Paid at order placement",
            dueDate: todayStart.toISOString(),
            status: "paid",
          },
        ],
      };
    }

    // Case 1: Gap >= 2 days - 10% now, 70% before 1 day, 20% before delivery
    if (diffDays >= 2) {
      const advance = Math.round(totalAmount * 0.1);
      const beforeDay = Math.round(totalAmount * 0.7);
      const remaining = Math.max(totalAmount - advance - beforeDay, 0);

      const oneDayBefore = new Date(deliveryStart);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);

      return {
        type: "long" as const,
        stages: [
          {
            key: "advance",
            label: "Booking Advance",
            description: "Pay 10% right away to confirm your slot.",
            amount: advance,
            when: "Now",
            dueDate: todayStart.toISOString(),
            status: "paid",
          },
          {
            key: "before-day",
            label: "Before Event Day",
            description: "Pay 70% one day before delivery.",
            amount: beforeDay,
            when: "1 day before delivery",
            dueDate: oneDayBefore.toISOString(),
            status: "pending",
          },
          {
            key: "on-delivery",
            label: "On Delivery",
            description: "Pay the remaining 20% on delivery.",
            amount: remaining,
            when: "On delivery day",
            dueDate: deliveryStart.toISOString(),
            status: "pending",
          },
        ],
      };
    }
    
    // Case 2: Gap < 2 days (but not same day) - 80% now, 20% before delivery
    const immediate = Math.round(totalAmount * 0.8);
    const remaining = Math.max(totalAmount - immediate, 0);

    return {
      type: "short" as const,
      stages: [
        {
          key: "immediate",
          label: "Booking Payment",
          description: "Pay 80% right away to confirm your slot.",
          amount: immediate,
          when: "Now",
          dueDate: todayStart.toISOString(),
          status: "paid",
        },
        {
          key: "on-delivery",
          label: "On Delivery",
          description: "Pay the remaining 20% on delivery.",
          amount: remaining,
          when: "On delivery day",
          dueDate: deliveryStart.toISOString(),
          status: "pending",
        },
      ],
    };
  };

  // Helper to determine if a stage is eligible for payment (today >= due date)
  const isStageEligible = (stage: any) => {
    if (!stage.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(stage.dueDate);
    due.setHours(0, 0, 0, 0);
    return today.getTime() >= due.getTime();
  };

  // Handle payment for a specific stage
  const handleStagePayment = async (stage: { key: string; amount: number; label: string }) => {
    if (!order || !razorpayLoaded || !razorpayKeyId) {
      toast({
        title: "Payment Error",
        description: "Payment gateway is not ready. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    setProcessingPayment(stage.key);

    try {
      // Create Razorpay order
      const createOrderResponse = await fetch(getApiUrl('/api/payments/create-order'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: stage.amount,
          currency: 'INR',
          receipt: `${order.orderNumber}-${stage.key}-${Date.now()}`,
        }),
      });

      if (!createOrderResponse.ok) {
        const errorData = await createOrderResponse.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const orderData = await createOrderResponse.json();
      const razorpayOrderId = orderData.orderId;

      // Open Razorpay modal directly
      await openRazorpayModal({
        razorpayKeyId: razorpayKeyId!,
        razorpayOrderId: razorpayOrderId,
        amount: stage.amount,
        description: order ? `${stage.label} - Order #${order.orderNumber}` : "Order Payment",
        orderType: "meal_box",
        orderData: order ? {
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentStage: stage.key,
          stageLabel: stage.label,
          amount: stage.amount,
        } : undefined,
        onError: (error) => {
          toast({
            title: "Payment Error",
            description: error,
            variant: "destructive",
          });
          setProcessingPayment(null);
        },
      });
      
      setProcessingPayment(null);
    } catch (error: any) {
      console.error("Error initiating payment:", error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
      });
      setProcessingPayment(null);
    }
  };

  const paymentSchedule = calculatePaymentSchedule();

  return (
    <div 
      className="min-h-screen bg-background pb-6"
      style={{
        paddingBottom: '24px',
      }}
    >
      {/* Header */}
      <div 
        className="bg-card border-b sticky z-10" 
        style={{ 
          top: 0,
          paddingTop: '16px',
          paddingBottom: '16px'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold" data-testid="text-page-title">
              Order #{order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Kolkata'
              })}
            </p>
          </div>
          <Badge variant={statusConfig.variant} data-testid="badge-order-status">
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Delivery Schedule */}
        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Delivery Schedule
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Delivery Date</p>
                <p className="font-medium" data-testid="text-delivery-date">
                  {new Date(order.deliveryDate).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'Asia/Kolkata'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Delivery Time</p>
                <p className="font-medium" data-testid="text-delivery-time">{order.deliveryTime}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Schedule */}
        {paymentSchedule && (
          <Card className="p-4 space-y-4" data-testid="card-payment-schedule">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg mb-1">Payment Schedule</h2>
                <p className="text-sm text-muted-foreground">
                  Your payment is split into stages based on the time remaining until delivery.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {paymentSchedule.stages.map((stage, index) => (
                <div
                  key={stage.key}
                  className="flex items-start gap-3"
                  data-testid={`payment-stage-${index}`}
                >
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    {index !== paymentSchedule.stages.length - 1 && (
                      <div className="w-px flex-1 bg-muted mt-1" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold">{stage.label}</p>
                          {stage.status === 'paid' && (
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
                              Paid
                            </Badge>
                          )}
                          {stage.status === 'pending' && (
                            <Badge variant="secondary" className="text-xs">Pending</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {stage.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {stage.when}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary flex items-center justify-end gap-1">
                          <IndianRupee className="w-3 h-3" />
                          {stage.amount.toFixed(0)}
                        </p>
                      </div>
                    </div>
                    {/* Pay button for eligible pending stages */}
                    {stage.status === 'pending' && !paidStages.includes(stage.key) && isStageEligible(stage) && (
                      <div className="mt-3">
                        <Button
                          variant="default"
                          size="sm"
                          className="text-xs w-full bg-[#1A9952] hover:bg-[#158844]"
                          onClick={() => handleStagePayment(stage)}
                          disabled={processingPayment !== null || !razorpayLoaded || !razorpayKeyId}
                          data-testid={`button-pay-stage-${stage.key}`}
                        >
                          {processingPayment === stage.key ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            `Pay ₹${stage.amount.toFixed(0)}`
                          )}
                        </Button>
                      </div>
                    )}
                    {paidStages.includes(stage.key) && stage.key !== 'initial' && (
                      <div className="mt-3 flex items-center justify-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Payment Complete</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="w-3 h-3 mt-0.5" />
              <p>
                This schedule is calculated from today to your delivery date. If your event date
                changes, your payment stages may also change.
              </p>
            </div>
          </Card>
        )}

        {/* Delivery Address */}
        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Delivery Address
          </h2>
          <div className="space-y-1">
            <p className="font-medium"  data-testid="text-address-label">{order.address.label}</p>
            <p className="text-sm text-muted-foreground" data-testid="text-address">
              {order.address.address}
            </p>
            {order.address.landmark && (
              <p className="text-sm text-muted-foreground" data-testid="text-landmark">
                Landmark: {order.address.landmark}
              </p>
            )}
          </div>
        </Card>

        {/* Order Items */}
        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Order Items
          </h2>
          <div className="space-y-4">
            {order.items && order.items.length > 0 ? order.items.map((item) => {
              // Get image URL - use the one from dish (already processed by getSnackBoxDishImage)
              const imageUrl = item.dish.imageUrl || PLACEHOLDER_IMAGE;
              
              // Debug: log the image URL being used
              console.log('[OrderDetails] Rendering item:', item.dish.name, 'imageUrl:', imageUrl);
              
              return (
              <div key={item.id} className="flex gap-4" data-testid={`order-item-${item.dish.id}`}>
                <img
                  src={imageUrl}
                  alt={item.dish.name}
                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  data-testid="img-dish"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    // Prevent infinite loop - only set placeholder if not already using it
                    if (img.src !== PLACEHOLDER_IMAGE && !img.src.includes('data:image')) {
                      console.error('[OrderDetails] Image failed to load:', imageUrl, 'falling back to placeholder');
                      img.src = PLACEHOLDER_IMAGE;
                    } else {
                      // Already using placeholder, just hide the error
                      console.warn('[OrderDetails] Placeholder image also failed, hiding image');
                      img.style.display = 'none';
                    }
                  }}
                  onLoad={() => {
                    console.log('[OrderDetails] Image loaded successfully:', imageUrl);
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold" data-testid="text-dish-name">{item.dish.name}</h3>
                    <Badge variant="outline" className="flex-shrink-0" data-testid="badge-dietary-type">
                      {item.dish.dietaryType}
                    </Badge>
                  </div>
                  {item.dish.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {item.dish.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground" data-testid="text-quantity">
                      Qty: {item.quantity}
                    </span>
                    <span className="font-semibold text-primary" data-testid="text-item-price">
                      ₹{parseFloat(item.price).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            );
            }) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No items found for this order.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Bill Details */}
        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-4" data-testid="text-bill-details">Bill Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground" data-testid="text-subtotal-label">Item Total</span>
              <span data-testid="text-subtotal">₹{parseFloat(order.subtotal).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground" data-testid="text-delivery-label">Delivery Fee</span>
              <span data-testid="text-delivery-fee">₹{parseFloat(order.deliveryFee).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground" data-testid="text-tax-label">Taxes & Charges</span>
              <span data-testid="text-tax">₹{parseFloat(order.tax).toFixed(0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold pt-1">
              <span data-testid="text-total-label">Total Paid</span>
              <span className="text-primary font-serif" data-testid="text-total">
                ₹{parseFloat(order.total).toFixed(0)}
              </span>
            </div>
          </div>
        </Card>

        {/* Help Section */}
        <Card className="p-4 bg-muted/50">
          <p className="text-sm text-center text-muted-foreground">
            Need help with your order?{' '}
            <button
              onClick={() => setLocation('/help')}
              className="text-primary font-medium hover:underline"
              data-testid="button-help"
            >
              Contact Support
            </button>
          </p>
        </Card>
      </main>

    </div>
  );
}
