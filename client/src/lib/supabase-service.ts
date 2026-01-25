/**
 * Supabase Service Layer
 * Replaces Express backend API routes with direct Supabase calls
 */

import { supabaseAuth } from './supabase-auth';
import { geocodeAddress } from './geo';

// Get the Supabase client from auth (it has full database access)
const supabase = supabaseAuth;

/**
 * Convert time slot (e.g., "9:00 AM - 10:00 AM") to 24-hour format (e.g., "09:00")
 * Returns the START time of the slot
 */
function parseTimeSlotTo24Hour(timeSlot: string): string {
  if (!timeSlot) return '12:00';
  
  // If already in 24-hour format (HH:MM), return as-is
  if (/^\d{1,2}:\d{2}$/.test(timeSlot)) {
    const [hours, mins] = timeSlot.split(':');
    return `${hours.padStart(2, '0')}:${mins}`;
  }
  
  // Extract the first time from a slot like "9:00 AM - 10:00 AM"
  const timeMatch = timeSlot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!timeMatch) return '12:00';
  
  let hours = parseInt(timeMatch[1]);
  const mins = timeMatch[2];
  const period = timeMatch[3].toUpperCase();
  
  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${mins}`;
}

/**
 * Ensure user exists in public.users table (auto-create if missing)
 * This handles the case where Supabase Auth user exists but no corresponding DB record
 * IMPORTANT: Only creates user if they don't exist - never overwrites existing user data
 */
async function ensureUserExists(authUser: { id: string; phone?: string; email?: string }): Promise<void> {
  // Check if user exists in database (check both id and username to be thorough)
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, username')
    .eq('id', authUser.id)
    .single();

  // Only create if user doesn't exist at all
  // If user exists (even with temp username), don't overwrite - let NameScreen handle the update
  if (!existingUser) {
    // Create user record with Auth user ID and temporary username
    // This temporary username will be replaced when user enters their name on NameScreen
    const phone = authUser.phone?.replace('+91', '') || authUser.email?.split('@')[0] || '';
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        username: `user_${Math.floor(1000 + Math.random() * 9000)}`,
        phone: phone,
        password: 'OTP_AUTH',
        is_verified: true,
      });

    if (insertError && !insertError.message.includes('duplicate')) {
      console.error('Error creating user record:', insertError);
    }
  } else {
    // User already exists - don't modify anything
    // The NameScreen will update the username if it's still a temporary one
    console.log('User already exists in database, skipping creation');
  }
}

/**
 * Get authenticated user - checks Supabase session first, then falls back to localStorage
 * This supports both Supabase Auth sessions and our custom OTP auth
 */
async function getAuthenticatedUser(): Promise<{ id: string; phone?: string; email?: string } | null> {
  // First try Supabase auth - use getSession for reliability (cached, no network call)
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const user = session.user;
    // Ensure user exists in database (auto-create if missing)
    await ensureUserExists({ id: user.id, phone: user.phone || undefined, email: user.email || undefined });
    return { id: user.id, phone: user.phone || undefined, email: user.email || undefined };
  }
  
  // Fall back to localStorage (OTP auth) - important for maintaining auth after page refreshes
  const userId = localStorage.getItem('userId');
  const phone = localStorage.getItem('phone');
  if (userId && phone) {
    return { id: userId, phone, email: localStorage.getItem('email') || undefined };
  }
  
  return null;
}

/**
 * User Profile Operations
 */
export const userService = {
  /**
   * Get current user profile
   */
  async getProfile() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('users')
      .select('id, username, phone, email, is_verified')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return {
      id: data.id,
      username: data.username,
      phone: data.phone,
      email: data.email,
      isVerified: data.is_verified || data.isVerified,
    };
  },

  /**
   * Update user profile
   */
  async updateProfile(updates: { username?: string; email?: string; phone?: string }) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    // Check for duplicates
    if (updates.username) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', updates.username)
        .neq('id', user.id)
        .single();
      if (existing) throw new Error('Username already taken');
    }

    if (updates.phone) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('phone', updates.phone)
        .neq('id', user.id)
        .single();
      if (existing) throw new Error('Phone number already registered');
    }

    const updateData: any = {};
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('Failed to update profile - no data returned');
    }
    
    // Verify the update was successful, especially for username
    if (updates.username && data.username !== updates.username) {
      console.error('Username update mismatch:', { expected: updates.username, actual: data.username });
      throw new Error('Username update failed - value mismatch');
    }
    
    return {
      id: data.id,
      username: data.username,
      phone: data.phone,
      email: data.email,
      isVerified: data.is_verified || data.isVerified,
    };
  },

  async deleteAccount(reason: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    try {
      await supabase.from('account_deletion_logs').insert({
        user_id: user.id,
        reason: reason,
        deleted_at: new Date().toISOString(),
      });
    } catch (e) {
      console.log('Note: account_deletion_logs table may not exist, continuing with deletion');
    }

    // Step 1: Delete order_items first (references orders)
    const { data: userOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id);

    if (userOrders && userOrders.length > 0) {
      const orderIds = userOrders.map(o => o.id);
      await supabase.from('order_items').delete().in('order_id', orderIds);
    }

    // Step 2: Delete all order tables that reference addresses (BEFORE addresses)
    // Delete bulk_meal_orders first
    const { error: bulkError } = await supabase.from('bulk_meal_orders').delete().eq('user_id', user.id);
    if (bulkError) console.error('Error deleting bulk_meal_orders:', bulkError);
    
    // Delete mealbox_orders
    const { error: mealboxError } = await supabase.from('mealbox_orders').delete().eq('user_id', user.id);
    if (mealboxError) console.error('Error deleting mealbox_orders:', mealboxError);
    
    // Delete catering_orders
    const { error: cateringError } = await supabase.from('catering_orders').delete().eq('user_id', user.id);
    if (cateringError) console.error('Error deleting catering_orders:', cateringError);
    
    // Delete corporate_orders
    const { error: corpError } = await supabase.from('corporate_orders').delete().eq('user_id', user.id);
    if (corpError) console.error('Error deleting corporate_orders:', corpError);
    
    // Delete orders (main orders table)
    const { error: ordersError } = await supabase.from('orders').delete().eq('user_id', user.id);
    if (ordersError) console.error('Error deleting orders:', ordersError);

    // Step 3: Now delete addresses (after order tables that reference them)
    const { error: addressError } = await supabase
      .from('addresses')
      .delete()
      .eq('user_id', user.id);
    
    if (addressError) {
      console.error('Error deleting addresses:', addressError);
    }

    // Step 4: Delete other user-related tables
    const otherTables = [
      'cart_items',
      'concierge_preferences',
    ];

    for (const table of otherTables) {
      try {
        await supabase.from(table).delete().eq('user_id', user.id);
      } catch (e) {
        console.log(`Note: Could not clear ${table}, may not exist`);
      }
    }

    // Step 5: Finally delete the user record
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (userDeleteError) {
      console.error('Error deleting user record:', userDeleteError);
      throw new Error('Failed to delete account');
    }

    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.warn('Sign out warning:', signOutError);
    }

    return { success: true };
  },
};

/**
 * Address Operations
 */
export const addressService = {
  /**
   * Get all addresses for current user
   */
  async getAll() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data.map(addr => ({
      id: addr.id,
      label: addr.label,
      address: addr.address,
      landmark: addr.landmark,
      isDefault: addr.is_default || addr.isDefault,
      userId: addr.user_id || addr.userId,
      latitude: addr.latitude,
      longitude: addr.longitude,
    }));
  },

  /**
   * Create new address
   */
  async create(address: { 
    label: string; 
    address: string; 
    landmark?: string; 
    isDefault?: boolean;
    latitude?: number;
    longitude?: number;
  }) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    // If setting as default, unset other defaults
    if (address.isDefault) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);
    }

    // Get coordinates - use provided coordinates or geocode the address
    let latitude: number | null = address.latitude || null;
    let longitude: number | null = address.longitude || null;

    // If coordinates not provided, try to geocode the address
    if (!latitude || !longitude) {
      const fullAddress = address.landmark 
        ? `${address.address}, ${address.landmark}` 
        : address.address;
      const coords = await geocodeAddress(fullAddress);
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lng;
      }
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        label: address.label,
        address: address.address,
        landmark: address.landmark || null,
        is_default: address.isDefault || false,
        latitude: latitude,
        longitude: longitude,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      label: data.label,
      address: data.address,
      landmark: data.landmark,
      isDefault: data.is_default || data.isDefault,
      userId: data.user_id || data.userId,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  },

  /**
   * Update address
   */
  async update(id: string, updates: { 
    label?: string; 
    address?: string; 
    landmark?: string; 
    isDefault?: boolean;
    latitude?: number;
    longitude?: number;
  }) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    // Verify ownership
    const { data: existing } = await supabase
      .from('addresses')
      .select('user_id, address, landmark')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) throw new Error('Address not found or access denied');

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)
        .neq('id', id);
    }

    const updateData: any = {};
    if (updates.label !== undefined) updateData.label = updates.label;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.landmark !== undefined) updateData.landmark = updates.landmark || null;
    if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;
    
    // Handle coordinates
    let latitude: number | null | undefined = updates.latitude;
    let longitude: number | null | undefined = updates.longitude;

    // If address or landmark changed and coordinates not explicitly provided, geocode
    if ((updates.address !== undefined || updates.landmark !== undefined) && 
        latitude === undefined && longitude === undefined) {
      const addressToGeocode = updates.address !== undefined ? updates.address : existing.address;
      const landmarkToUse = updates.landmark !== undefined ? updates.landmark : existing.landmark;
      const fullAddress = landmarkToUse 
        ? `${addressToGeocode}, ${landmarkToUse}` 
        : addressToGeocode;
      const coords = await geocodeAddress(fullAddress);
      if (coords) {
        latitude = coords.lat;
        longitude = coords.lng;
      }
    }

    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    const { data, error } = await supabase
      .from('addresses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      label: data.label,
      address: data.address,
      landmark: data.landmark,
      isDefault: data.is_default || data.isDefault,
      userId: data.user_id || data.userId,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  },

  /**
   * Delete address
   */
  async delete(id: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    // Verify ownership
    const { data: existing } = await supabase
      .from('addresses')
      .select('user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) throw new Error('Address not found or access denied');

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

/**
 * Helper function to get coordinates from address (either from saved address or by geocoding)
 * This ensures all orders have coordinates stored
 */
async function getAddressCoordinates(addressId?: string | null, deliveryAddress?: string | null): Promise<{ latitude: number | null; longitude: number | null }> {
  let latitude: number | null = null;
  let longitude: number | null = null;

  // First, try to get coordinates from saved address
  if (addressId) {
    const { data: addressData } = await supabase
      .from('addresses')
      .select('latitude, longitude, address, landmark')
      .eq('id', addressId)
      .single();
    
    if (addressData) {
      latitude = addressData.latitude;
      longitude = addressData.longitude;
      
      // If coordinates exist, return them
      if (latitude && longitude) {
        return { latitude, longitude };
      }
      
      // If coordinates don't exist but address does, geocode it
      if (addressData.address) {
        const fullAddress = addressData.landmark 
          ? `${addressData.address}, ${addressData.landmark}` 
          : addressData.address;
        const coords = await geocodeAddress(fullAddress);
        if (coords) {
          // Update the address with coordinates for future use
          await supabase
            .from('addresses')
            .update({ latitude: coords.lat, longitude: coords.lng })
            .eq('id', addressId);
          return { latitude: coords.lat, longitude: coords.lng };
        }
      }
    }
  }

  // If no saved address or no coordinates found, geocode the delivery address
  if (deliveryAddress) {
    const coords = await geocodeAddress(deliveryAddress);
    if (coords) {
      return { latitude: coords.lat, longitude: coords.lng };
    }
  }

  // Return null if coordinates cannot be determined
  console.warn('Could not determine coordinates for address', { addressId, deliveryAddress });
  return { latitude: null, longitude: null };
}

/**
 * Order Operations
 */
export const orderService = {
  /**
   * Create a new order
   */
  async create(addressId: string, deliveryDate: string, deliveryTime: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    // Verify address exists
    const { data: addressData } = await supabase
      .from('addresses')
      .select('id')
      .eq('id', addressId)
      .single();

    if (!addressData) {
      throw new Error('Address not found');
    }

    // Get coordinates from address - MANDATORY for all orders
    const { latitude, longitude } = await getAddressCoordinates(addressId, null);

    // Fetch cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        dish_id,
        quantity,
        dishes (
          price
        )
      `)
      .eq('user_id', user.id);

    if (cartError) throw cartError;
    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum: number, item: any) => {
      const price = parseFloat(item.dishes?.price || '0');
      return sum + (price * item.quantity);
    }, 0);

    const deliveryFee = 40;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + tax;

    // Generate unique order number (max 2147483647 for integer)
    const timePart = Date.now() % 100000000;
    const nextOrderNumber = Math.floor(timePart / 100) + Math.floor(Math.random() * 1000)

    // Create order with coordinates - MANDATORY
    const orderInsertData: any = {
      order_number: nextOrderNumber,
      user_id: user.id,
      address_id: addressId,
      subtotal: subtotal.toFixed(2),
      delivery_fee: deliveryFee.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      delivery_date: deliveryDate,
      delivery_time: deliveryTime,
      status: 'pending',
      order_type_label: 'Regular Order', // Store order type label for easy display
    };

    // Add coordinates - MANDATORY (store even if null, will log warning)
    orderInsertData.delivery_latitude = latitude;
    orderInsertData.delivery_longitude = longitude;

    // Log warning if coordinates couldn't be determined
    if (latitude === null || longitude === null) {
      console.warn('⚠️ Order created without coordinates for addressId:', addressId);
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItemsData = cartItems.map((item: any) => ({
      order_id: order.id,
      dish_id: item.dish_id,
      quantity: item.quantity,
      price: item.dishes?.price || '0',
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) throw itemsError;

    // Clear cart
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    return {
      id: order.id,
      orderNumber: order.order_number,
      total: order.total,
    };
  },

  /**
   * Get all orders for current user
   */
  async getAll() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        subtotal,
        delivery_fee,
        tax,
        total,
        delivery_date,
        delivery_time,
        status,
        created_at,
        addresses (
          label,
          address
        ),
        order_items (
          id,
          quantity,
          price,
          dishes (
            id,
            name,
            image_url,
            dietary_type
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return orders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      subtotal: String(order.subtotal),
      deliveryFee: String(order.delivery_fee),
      tax: String(order.tax),
      total: String(order.total),
      deliveryDate: order.delivery_date,
      deliveryTime: order.delivery_time,
      status: order.status,
      createdAt: order.created_at,
      addressLabel: order.addresses?.label || '',
      address: order.addresses?.address || '',
      items: (order.order_items || []).map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        price: String(item.price),
        dishId: item.dishes?.id || '',
        dishName: item.dishes?.name || '',
        dishImageUrl: item.dishes?.image_url || '',
        dishDietaryType: item.dishes?.dietary_type || '',
      })),
    }));
  },

  /**
   * Get all orders from specialized order tables (mealbox, bulk, catering, corporate)
   */
  async getAllUnified() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch from all order tables in parallel
    const [regularOrders, mealboxOrders, bulkMealOrders, snackBoxOrders, sixtyMinMealboxOrders, sixtyMinBulkOrders, cateringOrders, corporateOrders, tastingMenuOrders] = await Promise.all([
      supabase
        .from('orders')
        .select(`
          *,
          addresses (
            id,
            label,
            address
          ),
          order_items (
            id,
            quantity,
            price,
            dishes (
              id,
              name,
              image_url,
              dietary_type
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('mealbox_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('bulk_meal_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('snack_box_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('sixty_min_mealbox_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('sixty_min_bulk_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('catering_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('corporate_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('tasting_menu_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    // Handle errors from any of the queries
    if (regularOrders.error) throw regularOrders.error;
    if (mealboxOrders.error) throw mealboxOrders.error;
    if (bulkMealOrders.error) throw bulkMealOrders.error;
    if (snackBoxOrders.error) throw snackBoxOrders.error;
    if (sixtyMinMealboxOrders.error) throw sixtyMinMealboxOrders.error;
    if (sixtyMinBulkOrders.error) throw sixtyMinBulkOrders.error;
    if (cateringOrders.error) throw cateringOrders.error;
    if (corporateOrders.error) throw corporateOrders.error;
    if (tastingMenuOrders.error) throw tastingMenuOrders.error;
    if (tastingMenuOrders.error) throw tastingMenuOrders.error;

    const allOrders: any[] = [];

    // Helper function to get order type label from stored field or determine from table
    const getOrderTypeLabel = (order: any, defaultLabel: string, tableName: string): string => {
      // First check if order_type_label is stored in the order
      if (order.order_type_label) {
        return order.order_type_label;
      }
      // Fallback to default label based on table
      return defaultLabel;
    };

    // Process regular orders (from main orders table)
    if (regularOrders.data) {
      regularOrders.data.forEach(order => {
        const items = (order.order_items || []).map((item: any) => ({
          id: item.id,
          quantity: item.quantity,
          price: String(item.price || '0'),
          dishId: item.dishes?.id || '',
          dishName: item.dishes?.name || '',
          dishImageUrl: item.dishes?.image_url || '',
          dishDietaryType: item.dishes?.dietary_type || 'Regular',
        }));

        allOrders.push({
          id: order.id,
          orderNumber: order.order_number,
          orderType: 'regular',
          orderTypeLabel: getOrderTypeLabel(order, 'Regular Order', 'orders'),
          subtotal: String(order.subtotal || 0),
          deliveryFee: String(order.delivery_fee || 0),
          tax: String(order.tax || 0),
          total: String(order.total || 0),
          deliveryDate: order.delivery_date || '',
          deliveryTime: order.delivery_time || '',
          status: order.status || 'pending',
          createdAt: order.created_at,
          addressLabel: order.addresses?.label || 'Delivery',
          address: order.addresses?.address || '',
          items: items,
        });
      });
    }

    // Process mealbox orders
    if (mealboxOrders.data) {
      mealboxOrders.data.forEach(order => {
        allOrders.push({
          id: order.id,
          orderNumber: order.order_number,
          orderType: 'mealbox',
          orderTypeLabel: getOrderTypeLabel(order, 'Meal Box', 'mealbox_orders'),
          subtotal: String(order.subtotal || 0),
          deliveryFee: String(order.delivery_fee || 0),
          tax: String(order.tax || 0),
          total: String(order.total || 0),
          deliveryDate: order.delivery_date || order.event_date,
          deliveryTime: order.delivery_time || order.event_time || '',
          status: order.status || 'pending',
          createdAt: order.created_at,
          addressLabel: 'Delivery',
          address: '',
          items: [],
          mealDetails: {
            portions: order.portions,
            mealPreference: order.meal_preference,
            vegBoxes: order.veg_boxes,
            eggBoxes: order.egg_boxes,
            nonVegBoxes: order.non_veg_boxes,
          },
        });
      });
    }

    // Process bulk meal orders
    if (bulkMealOrders.data) {
      console.log('[Orders] Bulk meal orders fetched:', bulkMealOrders.data.length);
      bulkMealOrders.data.forEach(order => {
        // Log the specific order we're looking for
        if (order.order_number === 159073) {
          console.log('[Orders] 🔍 Found order 159073 in bulk_meal_orders:', {
            id: order.id,
            order_number: order.order_number,
            created_at: order.created_at,
            created_at_type: typeof order.created_at,
            status: order.status
          });
        }
        
        allOrders.push({
          id: order.id,
          orderNumber: order.order_number,
          orderType: 'bulk',
          orderTypeLabel: getOrderTypeLabel(order, 'Bulk Meal', 'bulk_meal_orders'),
          subtotal: String(order.subtotal || 0),
          deliveryFee: String(order.platform_fee || 0),
          tax: String(order.gst || 0),
          total: String(order.total || 0),
          deliveryDate: order.delivery_date || order.event_date,
          deliveryTime: order.delivery_time || order.event_time || '',
          status: order.status || 'pending',
          createdAt: order.created_at,
          addressLabel: 'Delivery',
          address: '',
          items: [],
        });
      });
    } else {
      console.warn('[Orders] ⚠️ No bulk meal orders data found');
    }

    // Process snack box orders
    if (snackBoxOrders.data) {
      snackBoxOrders.data.forEach(order => {
        // Parse items from snack box order
        let items: any[] = [];
        if (order.items) {
          try {
            const parsedItems = typeof order.items === 'string' 
              ? JSON.parse(order.items) 
              : order.items;
            items = Array.isArray(parsedItems) ? parsedItems.map((item: any) => ({
              id: item.dishId || item.id || '',
              quantity: item.quantity || 0,
              price: String(item.price || 0),
              dishId: item.dishId || item.id || '',
              dishName: item.name || `Item ${item.dishId || ''}`,
              dishImageUrl: item.image_url || item.imageUrl || '',
              dishDietaryType: item.dietary_type || 'Regular',
            })) : [];
          } catch (parseError) {
            console.error('Error parsing snack box order items:', parseError);
          }
        }

        allOrders.push({
          id: order.id,
          orderNumber: order.order_number,
          orderType: 'snackbox',
          orderTypeLabel: getOrderTypeLabel(order, 'Snack Box', 'snack_box_orders'),
          subtotal: String(order.subtotal || 0),
          deliveryFee: String(order.platform_fee || 0),
          tax: String(order.gst || 0),
          total: String(order.total || 0),
          deliveryDate: order.delivery_date || '',
          deliveryTime: order.delivery_time || '',
          status: order.status || 'pending',
          createdAt: order.created_at,
          addressLabel: 'Delivery',
          address: order.delivery_address || '',
          items: items,
        });
      });
    }

    // Process 60-min mealbox orders
    if (sixtyMinMealboxOrders.data) {
      sixtyMinMealboxOrders.data.forEach(order => {
        allOrders.push({
          id: order.id,
          orderNumber: order.order_number,
          orderType: 'sixty_min_mealbox',
          orderTypeLabel: getOrderTypeLabel(order, '60-Min Meal Box', 'sixty_min_mealbox_orders'),
          subtotal: String(order.subtotal || 0),
          deliveryFee: String(order.delivery_fee || 0),
          tax: String(order.tax || 0),
          total: String(order.total || 0),
          deliveryDate: order.delivery_date || '',
          deliveryTime: order.delivery_time || '',
          status: order.status || 'pending',
          createdAt: order.created_at,
          addressLabel: 'Delivery',
          address: order.delivery_address || '',
          items: [],
          mealDetails: {
            portions: order.portions,
            mealPreference: order.meal_preference,
            vegBoxes: order.veg_boxes,
            eggBoxes: order.egg_boxes,
            nonVegBoxes: order.non_veg_boxes,
          },
        });
      });
    }

    // Process 60-min bulk orders
    if (sixtyMinBulkOrders.data) {
      sixtyMinBulkOrders.data.forEach(order => {
        // Parse items from 60-min bulk order
        let items: any[] = [];
        if (order.items) {
          try {
            const parsedItems = typeof order.items === 'string' 
              ? JSON.parse(order.items) 
              : order.items;
            items = Array.isArray(parsedItems) ? parsedItems.map((item: any) => ({
              id: item.dishId || item.id || '',
              quantity: item.quantity || 0,
              price: String(item.price || item.unit_price || 0),
              dishId: item.dishId || item.id || '',
              dishName: item.dish_name || item.name || `Dish ${item.dishId || ''}`,
              dishImageUrl: item.image_url || item.imageUrl || '',
              dishDietaryType: item.dietary_type || 'Regular',
            })) : [];
          } catch (parseError) {
            console.error('Error parsing 60-min bulk order items:', parseError);
          }
        }

        allOrders.push({
          id: order.id,
          orderNumber: order.order_number,
          orderType: 'sixty_min_bulk',
          orderTypeLabel: getOrderTypeLabel(order, '60-Min Bulk Meal', 'sixty_min_bulk_orders'),
          subtotal: String(order.subtotal || 0),
          deliveryFee: String(order.platform_fee || 0),
          tax: String(order.gst || 0),
          total: String(order.total || 0),
          deliveryDate: order.delivery_date || '',
          deliveryTime: order.delivery_time || '',
          status: order.status || 'pending',
          createdAt: order.created_at,
          addressLabel: 'Delivery',
          address: order.delivery_address || '',
          items: items,
        });
      });
    }

    // Process catering orders
    if (cateringOrders.data) {
      cateringOrders.data.forEach(order => {
        allOrders.push({
          id: order.id,
          orderNumber: order.order_number || Math.floor(Math.random() * 10000),
          orderType: 'catering',
          orderTypeLabel: getOrderTypeLabel(order, 'Catering', 'catering_orders'),
          subtotal: String(order.budget_min || order.estimated_total || 0),
          deliveryFee: '0',
          tax: '0',
          total: String(order.budget_max || order.estimated_total || 0),
          deliveryDate: order.event_date,
          deliveryTime: order.event_time || '',
          status: order.status || 'pending',
          createdAt: order.created_at,
          addressLabel: order.event_type || 'Catering Event',
          address: order.venue_address || '',
          items: [],
          cateringDetails: {
            eventType: order.event_type,
            guestCount: order.guest_count,
          },
        });
      });
    }

    // Process corporate orders
    if (corporateOrders.data) {
      corporateOrders.data.forEach(order => {
        allOrders.push({
          id: order.id,
          orderNumber: order.order_number || Math.floor(Math.random() * 10000),
          orderType: 'corporate',
          orderTypeLabel: getOrderTypeLabel(order, 'Corporate', 'corporate_orders'),
          subtotal: String(order.subtotal || order.estimated_total || 0),
          deliveryFee: '0',
          tax: '0',
          total: String(order.total || order.estimated_total || 0),
          deliveryDate: order.delivery_date || order.event_date,
          deliveryTime: order.delivery_time || order.event_time || '',
          status: order.status || 'pending',
          createdAt: order.created_at,
          addressLabel: order.company_name || 'Corporate Order',
          address: order.delivery_address || '',
          items: [],
          corporateDetails: {
            companyName: order.company_name,
            employeeCount: order.employee_count,
          },
        });
      });
    }

    // Process tasting menu orders
    if (tastingMenuOrders.data) {
      tastingMenuOrders.data.forEach(order => {
        // Parse items from tasting menu order if stored as JSON
        let items: any[] = [];
        if (order.items) {
          try {
            const parsedItems = typeof order.items === 'string' 
              ? JSON.parse(order.items) 
              : order.items;
            items = Array.isArray(parsedItems) ? parsedItems.map((item: any) => ({
              id: item.dishId || item.id || '',
              quantity: item.quantity || 0,
              price: String(item.price || 0),
              dishId: item.dishId || item.id || '',
              dishName: item.name || item.dish_name || `Item ${item.dishId || ''}`,
              dishImageUrl: item.image_url || item.imageUrl || '',
              dishDietaryType: item.dietary_type || 'Regular',
            })) : [];
          } catch (parseError) {
            console.error('Error parsing tasting menu order items:', parseError);
          }
        }

        allOrders.push({
          id: order.id,
          orderNumber: order.order_number || Math.floor(Math.random() * 10000),
          orderType: 'tasting_menu',
          orderTypeLabel: getOrderTypeLabel(order, 'Tasting Menu', 'tasting_menu_orders'),
          subtotal: String(order.subtotal || order.total || 0),
          deliveryFee: String(order.delivery_fee || order.platform_fee || 0),
          tax: String(order.tax || order.gst || 0),
          total: String(order.total || 0),
          deliveryDate: order.delivery_date || order.event_date || '',
          deliveryTime: order.delivery_time || order.event_time || '',
          status: order.status || order.order_status || 'pending',
          createdAt: order.created_at,
          addressLabel: 'Delivery',
          address: order.delivery_address || '',
          items: items,
        });
      });
    }

    // Log orders BEFORE sorting for debugging
    if (allOrders.length > 0) {
      console.log('[Orders] BEFORE SORT - Total orders:', allOrders.length);
      console.log('[Orders] BEFORE SORT - First 3 orders:', 
        allOrders.slice(0, 3).map((o) => ({ 
          id: o.id?.substring(0, 8), 
          orderNumber: o.orderNumber,
          type: o.orderType,
          createdAt: o.createdAt,
          timestamp: o.createdAt ? new Date(o.createdAt).getTime() : 0
        }))
      );
    }

    // Sort all orders by created_at descending (newest first)
    // Use a more robust sorting that handles different date formats and timezones
    allOrders.sort((a, b) => {
      // Get created_at values - handle both string and Date objects
      const createdAtA = a.createdAt || a.created_at || '';
      const createdAtB = b.createdAt || b.created_at || '';
      
      // Convert to timestamps - handle timezone inconsistencies
      let dateA = 0;
      let dateB = 0;
      
      if (createdAtA) {
        // If no timezone is specified (no + or Z), treat as UTC (database default)
        // Format: '2026-01-21T17:18:23.489944' -> '2026-01-21T17:18:23.489944Z'
        let dateStrA = createdAtA;
        if (typeof createdAtA === 'string' && createdAtA.includes('T') && !createdAtA.includes('+') && !createdAtA.includes('Z')) {
          dateStrA = createdAtA + 'Z'; // Append Z to treat as UTC
        }
        const parsedA = new Date(dateStrA);
        dateA = isNaN(parsedA.getTime()) ? 0 : parsedA.getTime();
      }
      
      if (createdAtB) {
        // If no timezone is specified (no + or Z), treat as UTC (database default)
        // Format: '2026-01-21T17:18:23.489944' -> '2026-01-21T17:18:23.489944Z'
        let dateStrB = createdAtB;
        if (typeof createdAtB === 'string' && createdAtB.includes('T') && !createdAtB.includes('+') && !createdAtB.includes('Z')) {
          dateStrB = createdAtB + 'Z'; // Append Z to treat as UTC
        }
        const parsedB = new Date(dateStrB);
        dateB = isNaN(parsedB.getTime()) ? 0 : parsedB.getTime();
      }
      
      // If both dates are invalid, maintain order
      if (dateA === 0 && dateB === 0) return 0;
      
      // Invalid dates go to the end
      if (dateA === 0) return 1; // A goes to end
      if (dateB === 0) return -1; // B goes to end
      
      // Descending order: newest first (dateB - dateA)
      // This ensures the most recent order (larger timestamp) comes first
      return dateB - dateA;
    });
    
    // Log sorted orders for debugging - show all orders with timestamps
    if (allOrders.length > 0) {
      console.log('[Orders] AFTER SORT - Total orders:', allOrders.length);
      
      // Find the specific order we're looking for (159073)
      const targetOrder = allOrders.find(o => o.orderNumber === 159073);
      if (targetOrder) {
        console.log('[Orders] 🔍 Found order 159073:', {
          position: allOrders.indexOf(targetOrder) + 1,
          id: targetOrder.id,
          orderNumber: targetOrder.orderNumber,
          type: targetOrder.orderType,
          label: targetOrder.orderTypeLabel,
          createdAt: targetOrder.createdAt,
          timestamp: targetOrder.createdAt ? new Date(targetOrder.createdAt).getTime() : 0,
          readableDate: targetOrder.createdAt ? new Date(targetOrder.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'
        });
      } else {
        console.warn('[Orders] ⚠️ Order 159073 NOT FOUND in results!');
      }
      
      // Show first 10 orders with full details
      console.log('[Orders] AFTER SORT - First 10 orders:', 
        allOrders.slice(0, 10).map((o, index) => ({ 
          position: index + 1,
          id: o.id?.substring(0, 8) + '...', 
          orderNumber: o.orderNumber,
          type: o.orderType,
          label: o.orderTypeLabel,
          createdAt: o.createdAt,
          timestamp: o.createdAt ? new Date(o.createdAt).getTime() : 0,
          readableDate: o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'
        }))
      );
      
      // Show all order numbers for quick reference
      console.log('[Orders] All order numbers (in sorted order):', allOrders.map(o => o.orderNumber));
      
      console.log('[Orders] ✅ First order (should be newest):', {
        id: allOrders[0]?.id,
        orderNumber: allOrders[0]?.orderNumber,
        type: allOrders[0]?.orderType,
        label: allOrders[0]?.orderTypeLabel,
        createdAt: allOrders[0]?.createdAt,
        timestamp: allOrders[0]?.createdAt ? new Date(allOrders[0].createdAt).getTime() : 0,
        readableDate: allOrders[0]?.createdAt ? new Date(allOrders[0].createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'
      });
    }

    // Fetch all payments for the user to determine payment status
    const { data: allPayments } = await supabase
      .from('payments')
      .select('order_id, order_type, payment_status, payment_stage, amount')
      .eq('user_id', user.id);

    // Create a map of order_id + order_type -> payment status
    const paymentMap = new Map<string, { status: string; hasPayment: boolean; totalPaid: number }>();
    if (allPayments) {
      allPayments.forEach((payment: any) => {
        const key = `${payment.order_id}_${payment.order_type}`;
        const existing = paymentMap.get(key);
        const paymentAmount = parseFloat(payment.amount || '0');
        
        if (existing) {
          // If payment exists, update status and add to total paid
          existing.hasPayment = true;
          existing.totalPaid += paymentAmount;
          // If any payment is success, mark as paid
          if (payment.payment_status === 'success') {
            existing.status = 'paid';
          } else if (existing.status !== 'paid' && payment.payment_status === 'pending') {
            existing.status = 'pending';
          }
        } else {
          paymentMap.set(key, {
            status: payment.payment_status === 'success' ? 'paid' : payment.payment_status || 'pending',
            hasPayment: true,
            totalPaid: paymentAmount,
          });
        }
      });
    }

    // Add payment status to each order
    allOrders.forEach(order => {
      // Map order type to payment order_type format
      // Note: payment order_type uses: 'bulk_meal', 'mealbox', 'sixty_min_bulk', 'sixty_min_mealbox', 'snack_box'
      const paymentOrderType = order.orderType === 'bulk' ? 'bulk_meal' :
                              order.orderType === 'mealbox' ? 'mealbox' :
                              order.orderType === 'sixty_min_bulk' ? 'sixty_min_bulk' :
                              order.orderType === 'sixty_min_mealbox' ? 'sixty_min_mealbox' :
                              order.orderType === 'snackbox' ? 'snack_box' :
                              order.orderType === 'regular' ? null : // Regular orders may not have payments
                              null;
      
      if (paymentOrderType) {
        const key = `${order.id}_${paymentOrderType}`;
        const paymentInfo = paymentMap.get(key);
        if (paymentInfo) {
          order.paymentStatus = paymentInfo.status;
          order.hasPayment = true;
          order.totalPaid = paymentInfo.totalPaid;
        } else {
          order.paymentStatus = 'unpaid';
          order.hasPayment = false;
          order.totalPaid = 0;
        }
      } else {
        // For order types without payment tracking (catering, corporate, etc.)
        order.paymentStatus = 'unknown';
        order.hasPayment = false;
        order.totalPaid = 0;
      }
    });

    return allOrders;
  },

  /**
   * Get order by ID
   */
  async getById(orderId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        subtotal,
        delivery_fee,
        tax,
        total,
        delivery_date,
        delivery_time,
        status,
        created_at,
        addresses (
          id,
          label,
          address,
          landmark
        ),
        order_items (
          id,
          quantity,
          price,
          dishes (
            id,
            name,
            description,
            price,
            image_url,
            dietary_type
          )
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    if (!order) throw new Error('Order not found');

    return {
      id: order.id,
      orderNumber: order.order_number,
      subtotal: String(order.subtotal),
      deliveryFee: String(order.delivery_fee),
      tax: String(order.tax),
      total: String(order.total),
      deliveryDate: order.delivery_date,
      deliveryTime: order.delivery_time,
      status: order.status,
      createdAt: order.created_at,
      address: {
        id: order.addresses?.id || '',
        label: order.addresses?.label || '',
        address: order.addresses?.address || '',
        landmark: order.addresses?.landmark || null,
      },
      items: (order.order_items || []).map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        price: String(item.price),
        dish: {
          id: item.dishes?.id || '',
          name: item.dishes?.name || '',
          description: item.dishes?.description || '',
          price: String(item.dishes?.price || '0'),
          imageUrl: item.dishes?.image_url || '',
          dietaryType: item.dishes?.dietary_type || '',
        },
      })),
    };
  },
};

/**
 * Edge Functions - Server-side operations that need to stay on server
 * These will call Supabase Edge Functions
 */
export const edgeFunctions = {
  /**
   * Create Stripe payment intent
   */
  async createPaymentIntent(cartItems: Array<{ dishId: string; quantity: number }>) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { cartItems },
    });

    if (error) {
      throw new Error(error.message || 'Failed to create payment intent');
    }
    return data;
  },

  /**
   * Send OTP via SMS
   */
  async sendOTP(phone: string) {
    const { data, error } = await supabase.functions.invoke('send-otp', {
      body: { phone },
    });

    if (error) {
      throw new Error(error.message || 'Failed to send OTP');
    }
    return data;
  },

  /**
   * Verify OTP
   */
  async verifyOTP(phone: string, otp: string, username?: string) {
    const { data, error } = await supabase.functions.invoke('verify-otp', {
      body: { phone, otp, username },
    });

    if (error) {
      // Convert technical errors to user-friendly messages
      const errorMsg = error.message || '';
      if (errorMsg.includes('non-2xx') || errorMsg.includes('status code') || errorMsg.includes('Edge Function')) {
        throw new Error('Invalid OTP. Please try again.');
      }
      throw new Error(error.message || 'Invalid OTP. Please try again.');
    }
    return data;
  },
};

/**
 * MealBox Order Operations
 */
export const mealboxOrderService = {
  /**
   * Create a new MealBox order
   */
  async create(orderData: {
    portions: string;
    mealPreference: string;
    selectedMealType?: string;
    vegBoxes: number;
    eggBoxes: number;
    nonVegBoxes: number;
    vegPlateSelections: any[];
    eggPlateSelections: any[];
    nonVegPlateSelections: any[];
    selectedAddons: string[];
    subtotal: number;
    deliveryFee: number;
    tax: number;
    doorstepDeliveryFee?: number;
    total: number;
    deliveryDate?: string;
    deliveryTime?: string;
    addressId?: string;
  }) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    // Get coordinates from address
    const { latitude, longitude } = await getAddressCoordinates(orderData.addressId || null, null);

    // Generate unique order number (max 2147483647 for integer)
    const timePart = Date.now() % 100000000; // Last 8 digits of timestamp
    const nextOrderNumber = Math.floor(timePart / 100) + Math.floor(Math.random() * 1000)

    const insertData: any = {
      user_id: user.id,
      order_number: nextOrderNumber,
      portions: orderData.portions,
      meal_preference: orderData.mealPreference,
      selected_meal_type: orderData.selectedMealType || null,
      veg_boxes: orderData.vegBoxes,
      egg_boxes: orderData.eggBoxes,
      non_veg_boxes: orderData.nonVegBoxes,
      veg_plate_selections: JSON.stringify(orderData.vegPlateSelections),
      egg_plate_selections: JSON.stringify(orderData.eggPlateSelections),
      non_veg_plate_selections: JSON.stringify(orderData.nonVegPlateSelections),
      selected_addons: JSON.stringify(orderData.selectedAddons),
      subtotal: orderData.subtotal.toFixed(2),
      delivery_fee: orderData.deliveryFee.toFixed(2),
      tax: orderData.tax.toFixed(2),
      doorstep_delivery_fee: (orderData.doorstepDeliveryFee || 0).toFixed(2),
      total: orderData.total.toFixed(2),
      delivery_date: orderData.deliveryDate || null,
      delivery_time: orderData.deliveryTime || null,
      address_id: orderData.addressId || null,
      status: 'pending',
      // Don't set created_at manually - let database use default now()
      order_type_label: 'Meal Box', // Store order type label for easy display
    };

    // Add coordinates - MANDATORY (store even if null, will log warning)
    insertData.delivery_latitude = latitude;
    insertData.delivery_longitude = longitude;

    // Log warning if coordinates couldn't be determined
    if (latitude === null || longitude === null) {
      console.warn('⚠️ MealBox order created without coordinates:', { 
        addressId: orderData.addressId 
      });
    }

    const { data, error } = await supabase
      .from('mealbox_orders')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all MealBox orders for current user
   */
  async getAll() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('mealbox_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Get MealBox order by ID
   */
  async getById(orderId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('mealbox_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  },
};

/**
 * Bulk Meal Order Operations
 */
export const bulkMealOrderService = {
  /**
   * Create a new Bulk Meal order
   */
  async create(orderData: {
    items: Array<{ dishId: string; quantity: number; price: number }>;
    selectedAddons?: string[];
    subtotal: number;
    gst: number;
    platformFee: number;
    packagingFee: number;
    doorstepDeliveryFee?: number;
    total: number;
    deliveryDate?: string;
    deliveryTime?: string;
    addressId?: string;
    deliveryAddress?: string;
  }) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    // Get coordinates from address - MANDATORY for all orders
    const { latitude, longitude } = await getAddressCoordinates(orderData.addressId || null, orderData.deliveryAddress || null);

    // Generate unique order number (max 2147483647 for integer)
    const timePart = Date.now() % 100000000;
    const nextOrderNumber = Math.floor(timePart / 100) + Math.floor(Math.random() * 1000)

    const insertData: any = {
      user_id: user.id,
      order_number: nextOrderNumber,
      items: JSON.stringify(orderData.items),
      selected_addons: orderData.selectedAddons && orderData.selectedAddons.length > 0 
        ? JSON.stringify(orderData.selectedAddons) 
        : null,
      subtotal: orderData.subtotal.toFixed(2),
      gst: orderData.gst.toFixed(2),
      platform_fee: orderData.platformFee.toFixed(2),
      packaging_fee: orderData.packagingFee.toFixed(2),
      doorstep_delivery_fee: (orderData.doorstepDeliveryFee || 0).toFixed(2),
      total: orderData.total.toFixed(2),
      delivery_date: orderData.deliveryDate || null,
      delivery_time: orderData.deliveryTime || null,
      address_id: orderData.addressId || null,
      status: 'pending',
      // Don't set created_at manually - let database use default now()
      // This ensures consistent timestamp format and timezone
      order_type_label: 'Bulk Meal', // Store order type label for easy display
    };

    // Add coordinates - MANDATORY: store even if null (will log warning)
    insertData.delivery_latitude = latitude;
    insertData.delivery_longitude = longitude;

    // Log warning if coordinates couldn't be determined
    if (latitude === null || longitude === null) {
      console.warn('⚠️ Order created without coordinates:', { 
        addressId: orderData.addressId, 
        deliveryAddress: orderData.deliveryAddress 
      });
    }

    const { data, error } = await supabase
      .from('bulk_meal_orders')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all Bulk Meal orders for current user
   */
  async getAll() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('bulk_meal_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Get Bulk Meal order by ID
   */
  async getById(orderId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('bulk_meal_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  },
};

/**
 * 60-Min Bulk Meal Order Operations
 * For orders placed through the Explore Menu (60-min delivery)
 */
export const sixtyMinBulkOrderService = {
  /**
   * Create a new 60-min Bulk Meal order
   */
  async create(orderData: {
    items: Array<{ dishId: string; quantity: number; price: number }>;
    selectedAddons?: string[];
    subtotal: number;
    gst: number;
    platformFee: number;
    packagingFee: number;
    doorstepDeliveryFee?: number;
    total: number;
    deliveryDate?: string;
    deliveryTime?: string;
    addressId?: string;
    deliveryAddress?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  }) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    // Generate unique order number as TEXT
    const orderNumber = `60M-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // For sixty_min_bulk_orders, we only use delivery_address text (no address_id foreign key)
    // If an addressId was passed, we need to look up the address and use it as text
    let finalDeliveryAddress = orderData.deliveryAddress || 'Address not provided';
    let deliveryLatitude: number | null = null;
    let deliveryLongitude: number | null = null;
    
    if (orderData.addressId && orderData.deliveryAddress === undefined) {
      // Look up the saved address and use its text and coordinates
      const { data: addressData } = await supabase
        .from('addresses')
        .select('address, landmark, latitude, longitude')
        .eq('id', orderData.addressId)
        .single();
      
      if (addressData) {
        finalDeliveryAddress = addressData.address;
        if (addressData.landmark) {
          finalDeliveryAddress += `, ${addressData.landmark}`;
        }
        deliveryLatitude = addressData.latitude;
        deliveryLongitude = addressData.longitude;
      }
    } else if (orderData.deliveryAddress) {
      // Geocode the delivery address if coordinates not available
      const coords = await geocodeAddress(orderData.deliveryAddress);
      if (coords) {
        deliveryLatitude = coords.lat;
        deliveryLongitude = coords.lng;
      }
    }

    // Calculate headcount from items (total quantity)
    const headcount = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Get customer info from user or passed values
    const customerName = orderData.customerName || user.phone || 'Customer';
    const customerPhone = orderData.customerPhone || user.phone || '';

    const { data, error } = await supabase
      .from('sixty_min_bulk_orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: orderData.customerEmail || user.email || null,
        items: orderData.items,
        headcount: headcount,
        subtotal: orderData.subtotal.toFixed(2),
        tax_amount: orderData.gst.toFixed(2),
        delivery_fee: orderData.platformFee.toFixed(2),
        total_amount: orderData.total.toFixed(2),
        requested_delivery_time: orderData.deliveryDate && orderData.deliveryTime 
          ? `${orderData.deliveryDate}T${parseTimeSlotTo24Hour(orderData.deliveryTime)}:00` 
          : null,
        delivery_address: finalDeliveryAddress,
        delivery_latitude: deliveryLatitude,
        delivery_longitude: deliveryLongitude,
        order_status: 'pending',
        payment_status: 'pending',
        doorstep_delivery_fee: (orderData.doorstepDeliveryFee || 0).toFixed(2),
        // Don't set created_at manually - let database use default now()
        order_type_label: '60-Min Bulk Meal', // Store order type label for easy display
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all 60-min Bulk Meal orders for current user
   */
  async getAll() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('sixty_min_bulk_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Get 60-min Bulk Meal order by ID
   */
  async getById(orderId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('sixty_min_bulk_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  },
};

/**
 * 60-Min MealBox Order Operations
 * For mealbox orders placed through the Explore Menu (60-min delivery)
 */
export const sixtyMinMealboxOrderService = {
  /**
   * Create a new 60-min MealBox order
   */
  async create(orderData: {
    portions: string;
    mealPreference: string;
    selectedMealType?: string;
    vegBoxes: number;
    eggBoxes: number;
    nonVegBoxes: number;
    vegPlateSelections: any[];
    eggPlateSelections: any[];
    nonVegPlateSelections: any[];
    selectedAddons: string[];
    subtotal: number;
    deliveryFee: number;
    tax: number;
    doorstepDeliveryFee?: number;
    total: number;
    deliveryDate?: string;
    deliveryTime?: string;
    addressId?: string;
    deliveryAddress?: string;
  }) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    // Generate unique order number as TEXT
    const orderNumber = `60MB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Resolve delivery address and coordinates
    let finalDeliveryAddress = orderData.deliveryAddress || 'Address not provided';
    let deliveryLatitude: number | null = null;
    let deliveryLongitude: number | null = null;
    
    if (orderData.addressId && !orderData.deliveryAddress) {
      const { data: addressData } = await supabase
        .from('addresses')
        .select('address, landmark, latitude, longitude')
        .eq('id', orderData.addressId)
        .single();
      
      if (addressData) {
        finalDeliveryAddress = addressData.address;
        if (addressData.landmark) {
          finalDeliveryAddress += `, ${addressData.landmark}`;
        }
        deliveryLatitude = addressData.latitude;
        deliveryLongitude = addressData.longitude;
      }
    } else if (orderData.deliveryAddress) {
      // Geocode the delivery address if coordinates not available
      const coords = await geocodeAddress(orderData.deliveryAddress);
      if (coords) {
        deliveryLatitude = coords.lat;
        deliveryLongitude = coords.lng;
      }
    }

    // Parse portion size
    const portionSize = parseInt(orderData.portions.replace('-portions', '')) || 5;
    const boxQuantity = orderData.vegBoxes + orderData.eggBoxes + orderData.nonVegBoxes;
    const perBoxPrice = boxQuantity > 0 ? orderData.subtotal / boxQuantity : 0;

    // Build items array from plate selections
    const items = [
      ...orderData.vegPlateSelections.filter(s => s.item).map(s => ({
        type: 'veg',
        itemId: s.item?.id,
        name: s.item?.name,
        price: s.item?.price,
        slot: s.slot
      })),
      ...orderData.eggPlateSelections.filter(s => s.item).map(s => ({
        type: 'egg',
        itemId: s.item?.id,
        name: s.item?.name,
        price: s.item?.price,
        slot: s.slot
      })),
      ...orderData.nonVegPlateSelections.filter(s => s.item).map(s => ({
        type: 'non-veg',
        itemId: s.item?.id,
        name: s.item?.name,
        price: s.item?.price,
        slot: s.slot
      }))
    ];

    const customerPhone = user.phone || '';

    const { data, error } = await supabase
      .from('sixty_min_mealbox_orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        customer_name: user.phone || 'Customer',
        customer_phone: customerPhone,
        customer_email: user.email || null,
        portion_size: portionSize,
        box_quantity: boxQuantity,
        veg_count: orderData.vegBoxes,
        egg_count: orderData.eggBoxes,
        nonveg_count: orderData.nonVegBoxes,
        dietary_preference: orderData.mealPreference,
        items: items,
        per_box_price: perBoxPrice.toFixed(2),
        subtotal: orderData.subtotal.toFixed(2),
        tax_amount: orderData.tax.toFixed(2),
        delivery_fee: orderData.deliveryFee.toFixed(2),
        total_amount: orderData.total.toFixed(2),
        requested_delivery_time: orderData.deliveryDate && orderData.deliveryTime 
          ? `${orderData.deliveryDate}T${parseTimeSlotTo24Hour(orderData.deliveryTime)}:00` 
          : null,
        delivery_address: finalDeliveryAddress,
        delivery_latitude: deliveryLatitude,
        delivery_longitude: deliveryLongitude,
        order_status: 'pending',
        payment_status: 'pending',
        doorstep_delivery_fee: (orderData.doorstepDeliveryFee || 0).toFixed(2),
        // Don't set created_at manually - let database use default now()
        order_type_label: '60-Min Meal Box', // Store order type label for easy display
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all 60-min MealBox orders for current user
   */
  async getAll() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('sixty_min_mealbox_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Get 60-min MealBox order by ID
   */
  async getById(orderId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('sixty_min_mealbox_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  },
};

/**
 * Catering Order Operations
 */
export const cateringOrderService = {
  /**
   * Create a new Catering order (can be guest order)
   */
  async create(orderData: {
    eventType: string;
    guestCount: number;
    vegCount?: number;
    nonVegCount?: number;
    eggCount?: number;
    eventDate: string;
    eventTime?: string;
    mealTimes?: string[];
    dietaryTypes?: string[];
    cuisines?: string[];
    cuisinePreferences?: string[];
    budgetMin?: number;
    budgetMax?: number;
    addOnIds?: string[];
    name: string;
    email?: string;
    phone: string;
    message?: string;
    addressId?: string;
  }) {
    // Get user if authenticated (optional for catering orders)
    const { data: { user } } = await supabase.auth.getUser();

    // Get coordinates from address - MANDATORY for all orders
    const { latitude, longitude } = await getAddressCoordinates(orderData.addressId || null, null);

    // Generate unique order number (max 2147483647 for integer)
    const timePart = Date.now() % 100000000;
    const nextOrderNumber = Math.floor(timePart / 100) + Math.floor(Math.random() * 1000)

    const insertData: any = {
      user_id: user?.id || null,
      order_number: nextOrderNumber,
      event_type: orderData.eventType,
      guest_count: orderData.guestCount,
      veg_count: orderData.vegCount || 0,
      non_veg_count: orderData.nonVegCount || 0,
      egg_count: orderData.eggCount || 0,
      event_date: orderData.eventDate,
      event_time: orderData.eventTime || null,
      meal_times: orderData.mealTimes ? JSON.stringify(orderData.mealTimes) : null,
      dietary_types: orderData.dietaryTypes ? JSON.stringify(orderData.dietaryTypes) : null,
      cuisines: orderData.cuisines ? JSON.stringify(orderData.cuisines) : null,
      cuisine_preferences: orderData.cuisinePreferences ? JSON.stringify(orderData.cuisinePreferences) : null,
      budget_min: orderData.budgetMin ? orderData.budgetMin.toFixed(2) : null,
      budget_max: orderData.budgetMax ? orderData.budgetMax.toFixed(2) : null,
      add_on_ids: orderData.addOnIds ? JSON.stringify(orderData.addOnIds) : null,
      name: orderData.name,
      email: orderData.email || null,
      phone: orderData.phone,
      message: orderData.message || null,
      address_id: orderData.addressId || null,
      status: 'pending',
      order_type_label: 'Catering', // Store order type label for easy display
    };

    // Add coordinates - MANDATORY
    insertData.delivery_latitude = latitude;
    insertData.delivery_longitude = longitude;

    // Log warning if coordinates couldn't be determined
    if (latitude === null || longitude === null) {
      console.warn('⚠️ Catering order created without coordinates:', { 
        addressId: orderData.addressId 
      });
    }

    const { data, error } = await supabase
      .from('catering_orders')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all Catering orders for current user (if authenticated)
   */
  async getAll() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('catering_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};

/**
 * Corporate Order Operations
 */
export const corporateOrderService = {
  /**
   * Create a new Corporate order (can be guest order)
   */
  async create(orderData: {
    companyName: string;
    contactPerson: string;
    email?: string;
    phone: string;
    numberOfPeople: number;
    vegCount?: number;
    nonVegCount?: number;
    eggCount?: number;
    eventType: string;
    budgetMin?: number;
    budgetMax?: number;
    eventDate: string;
    eventTime?: string;
    additionalServices?: string[];
    message?: string;
    addressId?: string;
  }) {
    // Get user if authenticated (optional for corporate orders)
    const { data: { user } } = await supabase.auth.getUser();

    // Get coordinates from address - MANDATORY for all orders
    const { latitude, longitude } = await getAddressCoordinates(orderData.addressId || null, null);

    // Generate unique order number (max 2147483647 for integer)
    const timePart = Date.now() % 100000000;
    const nextOrderNumber = Math.floor(timePart / 100) + Math.floor(Math.random() * 1000)

    const insertData: any = {
      user_id: user?.id || null,
      order_number: nextOrderNumber,
      company_name: orderData.companyName,
      contact_person: orderData.contactPerson,
      email: orderData.email || null,
      phone: orderData.phone,
      number_of_people: orderData.numberOfPeople,
      veg_count: orderData.vegCount || 0,
      non_veg_count: orderData.nonVegCount || 0,
      egg_count: orderData.eggCount || 0,
      event_type: orderData.eventType,
      budget_min: orderData.budgetMin ? orderData.budgetMin.toFixed(2) : null,
      budget_max: orderData.budgetMax ? orderData.budgetMax.toFixed(2) : null,
      event_date: orderData.eventDate,
      event_time: orderData.eventTime || null,
      additional_services: orderData.additionalServices ? JSON.stringify(orderData.additionalServices) : null,
      message: orderData.message || null,
      address_id: orderData.addressId || null,
      status: 'pending',
      order_type_label: 'Corporate', // Store order type label for easy display
    };

    // Add coordinates - MANDATORY
    insertData.delivery_latitude = latitude;
    insertData.delivery_longitude = longitude;

    // Log warning if coordinates couldn't be determined
    if (latitude === null || longitude === null) {
      console.warn('⚠️ Corporate order created without coordinates:', { 
        addressId: orderData.addressId 
      });
    }

    const { data, error } = await supabase
      .from('corporate_orders')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all Corporate orders for current user (if authenticated)
   */
  async getAll() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('corporate_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};

/**
 * Coupon Service - Validate and apply coupon codes
 * Supports: order types, meal types, user targeting, time-based validity
 */
export interface CouponValidationResult {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    name: string;
    discountType: 'percentage' | 'fixed' | 'free_delivery';
    discountValue: number;
    maxDiscount?: number;
    description?: string;
  };
  discount?: number;
  isFreeDelivery?: boolean;
  error?: string;
}

export interface CouponValidateOptions {
  orderTotal: number;
  orderType?: 'regular' | 'bulk_meal' | 'mealbox' | 'catering' | 'corporate';
  mealTypes?: string[];
  deliveryFee?: number;
}

export const couponService = {
  /**
   * Validate a coupon code and calculate discount
   * @param code - Coupon code to validate
   * @param options - Validation options including orderTotal, orderType, mealTypes
   */
  async validate(code: string, options: CouponValidateOptions | number): Promise<CouponValidationResult> {
    // Support legacy call signature: validate(code, orderTotal)
    const opts: CouponValidateOptions = typeof options === 'number' 
      ? { orderTotal: options } 
      : options;
    
    const { orderTotal, orderType = 'regular', mealTypes = [], deliveryFee = 40 } = opts;

    if (!code || !code.trim()) {
      return { valid: false, error: 'Please enter a coupon code' };
    }

    const normalizedCode = code.trim().toUpperCase();

    // Fetch coupon from database
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', normalizedCode)
      .eq('is_active', true)
      .single();

    if (error || !coupon) {
      return { valid: false, error: 'Invalid coupon code' };
    }

    const now = new Date();

    // Check if coupon is within valid dates
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return { valid: false, error: 'This coupon is not yet active' };
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return { valid: false, error: 'This coupon has expired' };
    }

    // Check valid days of week (0=Sunday, 6=Saturday)
    if (coupon.valid_days_of_week && coupon.valid_days_of_week.length > 0) {
      const currentDay = now.getDay();
      if (!coupon.valid_days_of_week.includes(currentDay)) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const validDays = coupon.valid_days_of_week.map((d: number) => dayNames[d]).join(', ');
        return { valid: false, error: `This coupon is only valid on ${validDays}` };
      }
    }

    // Check total usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { valid: false, error: 'This coupon has reached its usage limit' };
    }

    // Check minimum order amount
    const minOrderAmount = parseFloat(coupon.min_order_amount || '0');
    if (orderTotal < minOrderAmount) {
      return { valid: false, error: `Minimum order of ₹${minOrderAmount} required` };
    }

    // Check order type restrictions
    if (coupon.applicable_order_types && coupon.applicable_order_types.length > 0) {
      const orderTypes = coupon.applicable_order_types as string[];
      if (!orderTypes.includes('all') && !orderTypes.includes(orderType)) {
        const typeLabels: Record<string, string> = {
          'bulk_meal': 'Bulk Meals',
          'mealbox': 'Meal Box',
          'catering': 'Catering',
          'corporate': 'Corporate',
          'regular': 'Regular orders'
        };
        const validFor = orderTypes.map(t => typeLabels[t] || t).join(', ');
        return { valid: false, error: `This coupon is only for ${validFor}` };
      }
    }

    // Check meal type restrictions
    if (coupon.applicable_meal_types && coupon.applicable_meal_types.length > 0 && mealTypes.length > 0) {
      const applicableMealTypes = coupon.applicable_meal_types as string[];
      const hasMatch = mealTypes.some(mt => applicableMealTypes.includes(mt.toLowerCase()));
      if (!hasMatch) {
        return { valid: false, error: `This coupon is only for ${applicableMealTypes.join(', ')} items` };
      }
    }

    // Get authenticated user for user-specific checks
    const user = await getAuthenticatedUser();

    // Check per-user limit
    if (user && coupon.per_user_limit) {
      const { count } = await supabase
        .from('coupon_usages')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id)
        .eq('user_id', user.id);

      if (count && count >= coupon.per_user_limit) {
        return { valid: false, error: 'You have already used this coupon' };
      }
    }

    // Check first-time user restriction
    if (coupon.first_time_user_only && user) {
      // Check if user has any previous orders (across ALL order types)
      const orderTables = [
        'orders',
        'bulk_meal_orders',
        'mealbox_orders',
        'snack_box_orders',
        'catering_orders',
        'corporate_orders',
        'sixty_min_bulk_orders',
        'sixty_min_mealbox_orders'
      ];
      
      let totalOrders = 0;
      for (const table of orderTables) {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        totalOrders += count || 0;
      }

      if (totalOrders > 0) {
        return { valid: false, error: 'This coupon is for first-time customers only' };
      }
    }

    // Check returning user restriction
    if (coupon.returning_user_only && user) {
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (!orderCount || orderCount === 0) {
        return { valid: false, error: 'This coupon is for returning customers' };
      }
    }

    // Check minimum previous orders
    if (coupon.min_previous_orders && coupon.min_previous_orders > 0 && user) {
      // Check total orders across ALL order types
      const orderTables = [
        'orders',
        'bulk_meal_orders',
        'mealbox_orders',
        'snack_box_orders',
        'catering_orders',
        'corporate_orders',
        'sixty_min_bulk_orders',
        'sixty_min_mealbox_orders'
      ];
      
      let totalOrders = 0;
      for (const table of orderTables) {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        totalOrders += count || 0;
      }

      if (totalOrders < coupon.min_previous_orders) {
        return { valid: false, error: `Complete ${coupon.min_previous_orders} orders to unlock this coupon` };
      }
    }

    // Calculate discount based on type
    let discount = 0;
    let isFreeDelivery = false;
    const discountValue = parseFloat(coupon.discount_value);

    if (coupon.discount_type === 'free_delivery') {
      discount = deliveryFee;
      isFreeDelivery = true;
    } else if (coupon.discount_type === 'percentage') {
      discount = Math.round(orderTotal * (discountValue / 100));
      if (coupon.max_discount) {
        const maxDiscount = parseFloat(coupon.max_discount);
        discount = Math.min(discount, maxDiscount);
      }
    } else {
      // Fixed discount
      discount = Math.min(discountValue, orderTotal);
    }

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discount_type as 'percentage' | 'fixed' | 'free_delivery',
        discountValue: discountValue,
        maxDiscount: coupon.max_discount ? parseFloat(coupon.max_discount) : undefined,
        description: coupon.description,
      },
      discount,
      isFreeDelivery,
    };
  },

  /**
   * Get all coupons with eligibility status for a user and order type
   * Returns both eligible and non-eligible coupons with reasons
   */
  async getAllCouponsWithEligibility(orderType: string = 'regular', orderTotal: number = 0): Promise<{
    eligible: Array<{
      id: string;
      code: string;
      description: string | null;
      discountType: 'percentage' | 'fixed' | 'free_delivery';
      discountValue: number;
      minOrderAmount: number;
      maxDiscount?: number;
      savingsText: string;
    }>;
    ineligible: Array<{
      id: string;
      code: string;
      description: string | null;
      discountType: 'percentage' | 'fixed' | 'free_delivery';
      discountValue: number;
      minOrderAmount: number;
      maxDiscount?: number;
      savingsText: string;
      reason: string;
    }>;
  }> {
    const now = new Date().toISOString();
    const user = await getAuthenticatedUser();

    // Fetch all active coupons
    const { data: coupons, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .or(`valid_from.is.null,valid_from.lte.${now}`)
      .or(`valid_until.is.null,valid_until.gte.${now}`);

    if (error || !coupons) {
      console.error('Error fetching coupons:', error);
      return { eligible: [], ineligible: [] };
    }

    const eligible: Array<{
      id: string;
      code: string;
      description: string | null;
      discountType: 'percentage' | 'fixed' | 'free_delivery';
      discountValue: number;
      minOrderAmount: number;
      maxDiscount?: number;
      savingsText: string;
    }> = [];

    const ineligible: Array<{
      id: string;
      code: string;
      description: string | null;
      discountType: 'percentage' | 'fixed' | 'free_delivery';
      discountValue: number;
      minOrderAmount: number;
      maxDiscount?: number;
      savingsText: string;
      reason: string;
    }> = [];

    // Helper to build coupon object
    const buildCouponObj = (coupon: any) => {
      const discountValue = parseFloat(coupon.discount_value);
      const minOrderAmount = parseFloat(coupon.min_order_amount || '0');
      const maxDiscount = coupon.max_discount ? parseFloat(coupon.max_discount) : undefined;

      let savingsText = '';
      if (coupon.discount_type === 'free_delivery') {
        savingsText = 'Free Delivery';
      } else if (coupon.discount_type === 'percentage') {
        savingsText = `${discountValue}% off`;
        if (maxDiscount) {
          savingsText += ` upto ₹${maxDiscount}`;
        }
      } else {
        savingsText = `₹${discountValue} off`;
      }

      if (minOrderAmount > 0) {
        savingsText += ` on orders above ₹${minOrderAmount}`;
      }

      return {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discount_type as 'percentage' | 'fixed' | 'free_delivery',
        discountValue,
        minOrderAmount,
        maxDiscount,
        savingsText,
      };
    };

    for (const coupon of coupons) {
      let ineligibleReason: string | null = null;

      // Check usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        ineligibleReason = 'Coupon limit reached';
      }

      // Check valid days of week (0=Sunday, 6=Saturday)
      if (!ineligibleReason && coupon.valid_days_of_week && coupon.valid_days_of_week.length > 0) {
        const currentDay = new Date().getDay();
        if (!coupon.valid_days_of_week.includes(currentDay)) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const validDays = coupon.valid_days_of_week.map((d: number) => dayNames[d]).join(', ');
          ineligibleReason = `Only valid on ${validDays}`;
        }
      }

      // Check order type
      if (!ineligibleReason && coupon.applicable_order_types && coupon.applicable_order_types.length > 0) {
        const orderTypes = coupon.applicable_order_types as string[];
        if (!orderTypes.includes('all') && !orderTypes.includes(orderType)) {
          const typeLabels: Record<string, string> = {
            'bulk_meal': 'Bulk Meals',
            'mealbox': 'Meal Box',
            'catering': 'Catering',
            'corporate': 'Corporate',
          };
          const validFor = orderTypes.map(t => typeLabels[t] || t).join(', ');
          ineligibleReason = `Only for ${validFor}`;
        }
      }

      // Check per-user limit
      if (!ineligibleReason && user && coupon.per_user_limit) {
        const { count } = await supabase
          .from('coupon_usages')
          .select('*', { count: 'exact', head: true })
          .eq('coupon_id', coupon.id)
          .eq('user_id', user.id);

        if (count && count >= coupon.per_user_limit) {
          ineligibleReason = 'Already used';
        }
      }

      // Check first-time user only
      if (!ineligibleReason && coupon.first_time_user_only && user) {
        // Check all order types for first-time user validation
        const orderTables = [
          'orders',
          'bulk_meal_orders',
          'mealbox_orders',
          'snack_box_orders',
          'catering_orders',
          'corporate_orders',
          'sixty_min_bulk_orders',
          'sixty_min_mealbox_orders'
        ];
        
        let totalOrders = 0;
        for (const table of orderTables) {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          totalOrders += count || 0;
        }
        
        if (totalOrders > 0) {
          ineligibleReason = 'For first-time customers only';
        }
      }

      // Check returning user only restriction
      if (!ineligibleReason && coupon.returning_user_only && user) {
        // Check all order types for returning user validation
        const orderTables = [
          'orders',
          'bulk_meal_orders',
          'mealbox_orders',
          'snack_box_orders',
          'catering_orders',
          'corporate_orders',
          'sixty_min_bulk_orders',
          'sixty_min_mealbox_orders'
        ];
        
        let totalOrders = 0;
        for (const table of orderTables) {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          totalOrders += count || 0;
        }
        
        if (totalOrders === 0) {
          ineligibleReason = 'For returning customers only';
        }
      }

      // Check minimum previous orders requirement
      if (!ineligibleReason && coupon.min_previous_orders && coupon.min_previous_orders > 0 && user) {
        // Check all order types for minimum previous orders
        const orderTables = [
          'orders',
          'bulk_meal_orders',
          'mealbox_orders',
          'snack_box_orders',
          'catering_orders',
          'corporate_orders',
          'sixty_min_bulk_orders',
          'sixty_min_mealbox_orders'
        ];
        
        let totalOrders = 0;
        for (const table of orderTables) {
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          totalOrders += count || 0;
        }

        if (totalOrders < coupon.min_previous_orders) {
          ineligibleReason = `Need ${coupon.min_previous_orders}+ orders`;
        }
      }

      const couponObj = buildCouponObj(coupon);

      if (ineligibleReason) {
        ineligible.push({ ...couponObj, reason: ineligibleReason });
      } else {
        eligible.push(couponObj);
      }
    }

    return { eligible, ineligible };
  },

  /**
   * Get eligible coupons for a user and order type (backwards compatible)
   * Returns coupons that could be applied to the order
   */
  async getEligibleCoupons(orderType: string = 'regular', orderTotal: number = 0): Promise<Array<{
    id: string;
    code: string;
    description: string | null;
    discountType: 'percentage' | 'fixed' | 'free_delivery';
    discountValue: number;
    minOrderAmount: number;
    maxDiscount?: number;
    savingsText: string;
  }>> {
    const result = await this.getAllCouponsWithEligibility(orderType, orderTotal);
    return result.eligible;
  },

  /**
   * Record coupon usage after order is placed
   */
  async recordUsage(couponId: string, orderId?: string, orderType?: string, discountApplied?: number): Promise<void> {
    const user = await getAuthenticatedUser();
    if (!user) return;

    // Insert usage record
    await supabase
      .from('coupon_usages')
      .insert({
        coupon_id: couponId,
        user_id: user.id,
        order_id: orderId || null,
        order_type: orderType || null,
        discount_applied: discountApplied || null,
      });

    // Increment usage count on coupon
    const { data: coupon } = await supabase
      .from('coupons')
      .select('usage_count')
      .eq('id', couponId)
      .single();

    if (coupon) {
      await supabase
        .from('coupons')
        .update({ usage_count: (coupon.usage_count || 0) + 1 })
        .eq('id', couponId);
    }
  },
};

/**
 * Payment Operations
 * Store and manage payment transaction details
 */
export const paymentService = {
  /**
   * Create a payment record
   * Stores initial payment details with all order information
   */
  async create(paymentData: {
    orderId: string;
    orderType: 'bulk_meal' | 'mealbox' | 'sixty_min_bulk' | 'sixty_min_mealbox' | 'snack_box';
    orderNumber: number;
    userId: string;
    paymentStage: 'initial' | 'second' | 'final' | 'full';
    amount: number;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    razorpayReceipt?: string;
    paymentStatus?: 'pending' | 'success' | 'failed' | 'refunded';
    isTestPayment?: boolean;
    orderItems: Array<{ dishId: string; name?: string; quantity: number; price: number }>;
    subtotal: number;
    gst: number;
    platformFee: number;
    packagingFee: number;
    deliveryFee?: number;
    discountApplied?: number;
    totalOrderAmount: number;
    deliveryDate?: string;
    deliveryTime?: string;
    metadata?: Record<string, any>;
  }) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const itemsCount = paymentData.orderItems.length;
    const totalItemsQuantity = paymentData.orderItems.reduce((sum, item) => sum + item.quantity, 0);

    const insertData = {
      order_id: paymentData.orderId,
      order_type: paymentData.orderType,
      order_number: paymentData.orderNumber,
      user_id: paymentData.userId,
      payment_stage: paymentData.paymentStage,
      amount: paymentData.amount.toFixed(2),
      currency: 'INR',
      razorpay_order_id: paymentData.razorpayOrderId || null,
      razorpay_payment_id: paymentData.razorpayPaymentId || null,
      razorpay_signature: paymentData.razorpaySignature || null,
      razorpay_receipt: paymentData.razorpayReceipt || null,
      payment_status: paymentData.paymentStatus || 'success',
      payment_method: 'razorpay',
      is_test_payment: paymentData.isTestPayment || false,
      order_items: JSON.stringify(paymentData.orderItems),
      items_count: itemsCount,
      total_items_quantity: totalItemsQuantity,
      subtotal: paymentData.subtotal.toFixed(2),
      gst: paymentData.gst.toFixed(2),
      platform_fee: paymentData.platformFee.toFixed(2),
      packaging_fee: paymentData.packagingFee.toFixed(2),
      delivery_fee: paymentData.deliveryFee ? paymentData.deliveryFee.toFixed(2) : null,
      discount_applied: paymentData.discountApplied ? paymentData.discountApplied.toFixed(2) : null,
      total_order_amount: paymentData.totalOrderAmount.toFixed(2),
      delivery_date: paymentData.deliveryDate || null,
      delivery_time: paymentData.deliveryTime || null,
      payment_date: new Date().toISOString(),
      payment_time: new Date().toISOString(),
      metadata: paymentData.metadata ? JSON.stringify(paymentData.metadata) : null,
    };

    console.log('[paymentService.create] Inserting payment record...');

    const { data, error } = await supabase
      .from('payments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[paymentService.create] Database error:', error.message, error.code, error.details);
      throw new Error(`Payment storage failed: ${error.message} (Code: ${error.code})`);
    }
    
    console.log('[paymentService.create] Success! Payment ID:', data?.id);
    return data;
  },

  /**
   * Update payment status
   */
  async updateStatus(paymentId: string, status: 'pending' | 'success' | 'failed' | 'refunded') {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('payments')
      .update({
        payment_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all payments for an order
   */
  async getByOrderId(orderId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .order('payment_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Get payment by Razorpay payment ID
   */
  async getByRazorpayPaymentId(razorpayPaymentId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('razorpay_payment_id', razorpayPaymentId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Add a new payment stage for an existing order
   * Used when subsequent payments are made (second, final stages)
   */
  async addPaymentStage(paymentData: {
    orderId: string;
    orderType: 'bulk_meal' | 'mealbox' | 'sixty_min_bulk' | 'sixty_min_mealbox' | 'snack_box';
    orderNumber: number;
    userId: string;
    paymentStage: 'second' | 'final';
    amount: number;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    razorpayReceipt?: string;
    paymentStatus?: 'pending' | 'success' | 'failed' | 'refunded';
    isTestPayment?: boolean;
    metadata?: Record<string, any>;
  }) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { supabaseAuth } = await import("@/lib/supabase-auth");
    const tableName = paymentData.orderType === 'sixty_min_bulk'
      ? 'sixty_min_bulk_orders'
      : paymentData.orderType === 'sixty_min_mealbox'
      ? 'sixty_min_mealbox_orders'
      : paymentData.orderType === 'mealbox'
      ? 'mealbox_orders'
      : 'bulk_meal_orders';

    const { data: order, error: orderError } = await supabaseAuth
      .from(tableName)
      .select('*')
      .eq('id', paymentData.orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    let orderItems: Array<{ dishId: string; name?: string; quantity: number; price: number }> = [];
    try {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      orderItems = items.map((item: any) => ({
        dishId: item.dishId || item.dish_id || String(item.id || ''),
        name: item.name || item.dish_name || `Item ${item.dishId || item.id}`,
        quantity: item.quantity || 1,
        price: item.price || 0,
      }));
    } catch (e) {
      console.error('Error parsing order items:', e);
    }

    const itemsCount = orderItems.length;
    const totalItemsQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);

    const { data, error } = await supabase
      .from('payments')
      .insert({
        order_id: paymentData.orderId,
        order_type: paymentData.orderType,
        order_number: paymentData.orderNumber,
        user_id: paymentData.userId,
        payment_stage: paymentData.paymentStage,
        amount: paymentData.amount.toFixed(2),
        currency: 'INR',
        razorpay_order_id: paymentData.razorpayOrderId || null,
        razorpay_payment_id: paymentData.razorpayPaymentId || null,
        razorpay_signature: paymentData.razorpaySignature || null,
        razorpay_receipt: paymentData.razorpayReceipt || null,
        payment_status: paymentData.paymentStatus || 'success',
        payment_method: 'razorpay',
        is_test_payment: paymentData.isTestPayment || false,
        order_items: JSON.stringify(orderItems),
        items_count: itemsCount,
        total_items_quantity: totalItemsQuantity,
        subtotal: parseFloat(order.subtotal?.toString() || '0').toFixed(2),
        gst: parseFloat(order.gst?.toString() || order.tax?.toString() || '0').toFixed(2),
        platform_fee: parseFloat(order.platform_fee?.toString() || order.delivery_fee?.toString() || '0').toFixed(2),
        packaging_fee: parseFloat(order.packaging_fee?.toString() || '0').toFixed(2),
        delivery_fee: parseFloat(order.delivery_fee?.toString() || order.platform_fee?.toString() || '0').toFixed(2),
        discount_applied: parseFloat(order.discount_applied?.toString() || '0').toFixed(2),
        total_order_amount: parseFloat(order.total?.toString() || '0').toFixed(2),
        delivery_date: order.delivery_date || order.deliveryDate || null,
        delivery_time: order.delivery_time || order.deliveryTime || null,
        payment_date: new Date().toISOString(),
        payment_time: new Date().toISOString(),
        metadata: paymentData.metadata ? JSON.stringify(paymentData.metadata) : null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

/**
 * SnackBox Order Operations
 * For snack box orders
 */
export const snackBoxOrderService = {
  /**
   * Create a new SnackBox order
   */
  async create(orderData: {
    items: Array<{ dishId: string; name: string; quantity: number; price: number; metadata?: any }>;
    selectedAddons?: string[];
    subtotal: number;
    gst: number;
    platformFee: number;
    packagingFee: number;
    doorstepDeliveryFee?: number;
    total: number;
    deliveryDate?: string;
    deliveryTime?: string;
    addressId?: string;
    deliveryAddress?: string;
    couponId?: string | null;
    discountApplied?: number;
  }) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    // Get coordinates from address - MANDATORY for all orders
    const { latitude, longitude } = await getAddressCoordinates(orderData.addressId || null, orderData.deliveryAddress || null);

    // Generate unique order number (max 2147483647 for integer)
    const timePart = Date.now() % 100000000;
    const nextOrderNumber = Math.floor(timePart / 100) + Math.floor(Math.random() * 1000)

    const insertData: any = {
      user_id: user.id,
      order_number: nextOrderNumber,
      items: JSON.stringify(orderData.items),
      selected_addons: orderData.selectedAddons && orderData.selectedAddons.length > 0
        ? JSON.stringify(orderData.selectedAddons)
        : null,
      subtotal: orderData.subtotal.toFixed(2),
      gst: orderData.gst.toFixed(2),
      platform_fee: orderData.platformFee.toFixed(2),
      packaging_fee: orderData.packagingFee.toFixed(2),
      doorstep_delivery_fee: (orderData.doorstepDeliveryFee || 0).toFixed(2),
      total: orderData.total.toFixed(2),
      delivery_date: orderData.deliveryDate || null,
      delivery_time: orderData.deliveryTime || null,
      address_id: orderData.addressId || null,
      delivery_address: orderData.deliveryAddress || null,
      coupon_id: orderData.couponId || null,
      discount_applied: orderData.discountApplied || 0,
      status: 'pending',
      // Don't set created_at manually - let database use default now()
      order_type_label: 'Snack Box', // Store order type label for easy display
    };

    // Add coordinates - MANDATORY
    insertData.delivery_latitude = latitude;
    insertData.delivery_longitude = longitude;

    // Log warning if coordinates couldn't be determined
    if (latitude === null || longitude === null) {
      console.warn('⚠️ SnackBox order created without coordinates:', { 
        addressId: orderData.addressId, 
        deliveryAddress: orderData.deliveryAddress 
      });
    }

    const { data, error } = await supabase
      .from('snack_box_orders')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.warn('Failed to insert into snack_box_orders, fallback to bulk_meal_orders', error);

      const { data: fallbackData, error: fallbackError } = await supabase
        .from('bulk_meal_orders')
        .insert({
          user_id: user.id,
          order_number: nextOrderNumber,
          items: JSON.stringify(orderData.items),
          selected_addons: orderData.selectedAddons && orderData.selectedAddons.length > 0
            ? JSON.stringify(orderData.selectedAddons)
            : null,
          subtotal: orderData.subtotal.toFixed(2),
          gst: orderData.gst.toFixed(2),
          platform_fee: orderData.platformFee.toFixed(2),
          packaging_fee: orderData.packagingFee.toFixed(2),
          total: orderData.total.toFixed(2),
          delivery_date: orderData.deliveryDate || null,
          delivery_time: orderData.deliveryTime || null,
          address_id: orderData.addressId || null,
          delivery_address: orderData.deliveryAddress || null,
          coupon_id: orderData.couponId || null,
          coupon_discount: orderData.discountApplied || 0,
          status: 'pending',
          // Don't set created_at manually - let database use default now()
          order_type_label: 'Snack Box', // Store order type label for easy display (fallback case)
        })
        .select()
        .single();

      if (fallbackError) throw error;

      // Record coupon usage if applied (even in fallback)
      if (orderData.couponId) {
        const { error: usageError } = await supabase
          .from('coupon_usages')
          .insert({
            coupon_id: orderData.couponId,
            user_id: user.id,
            order_id: fallbackData.id,
            order_type: 'snack-box-fallback',
            discount_applied: orderData.discountApplied || 0
          });

        if (usageError) {
          console.warn('Failed to record coupon usage for fallback:', usageError);
        }
      }

      return fallbackData;
    }

    // Record coupon usage if applied
    if (orderData.couponId) {
      const { error: usageError } = await supabase
        .from('coupon_usages')
        .insert({
          coupon_id: orderData.couponId,
          user_id: user.id,
          order_id: data.id,
          order_type: 'snack-box',
          discount_applied: orderData.discountApplied || 0
        });

      if (usageError) {
        console.warn('Failed to record coupon usage:', usageError);
      }
    }

    return data;
  },

  /**
   * Get all SnackBox orders for current user
   */
  async getAll() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('snack_box_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching snack_box_orders:', error);
      return [];
    }
    return data;
  },

  /**
   * Get SnackBox order by ID
   */
  async getById(orderId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('snack_box_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  },
};

/**
 * SnackBox Dishes Service
 * Handles fetching available snack boxes for the menu
 */
export const snackBoxService = {
  /**
   * Get all snack box dishes
   */
  async getAll() {
    // Use 'dishes' table with category filter (this is the working approach)
    const result = await supabase
      .from('dishes')
      .select('*')
      .eq('category_id', 'snack-box')
      .order('name', { ascending: true });

    if (result.error) throw result.error;
    return result.data || [];
  },

  /**
   * Get snack box dish by ID
   */
  async getById(dishId: string | number) {
    const idStr = dishId.toString();
    
    // Use 'dishes' table with category filter (this is the working approach)
    const result = await supabase
      .from('dishes')
      .select('*')
      .eq('id', idStr)
      .eq('category_id', 'snack-box')
      .single();

    if (result.error && result.error.code !== 'PGRST116') throw result.error;
    return result.data || null;
  },
};