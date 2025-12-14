/**
 * Supabase Service Layer
 * Replaces Express backend API routes with direct Supabase calls
 */

import { supabaseAuth } from './supabase-auth';

// Get the Supabase client from auth (it has full database access)
const supabase = supabaseAuth;

/**
 * Ensure user exists in public.users table (auto-create if missing)
 * This handles the case where Supabase Auth user exists but no corresponding DB record
 */
async function ensureUserExists(authUser: { id: string; phone?: string; email?: string }): Promise<void> {
  // Check if user exists in database
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .single();

  if (!existingUser) {
    // Create user record with Auth user ID
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

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
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
    }));
  },

  /**
   * Create new address
   */
  async create(address: { label: string; address: string; landmark?: string; isDefault?: boolean }) {
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

    const { data, error } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        label: address.label,
        address: address.address,
        landmark: address.landmark || null,
        is_default: address.isDefault || false,
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
    };
  },

  /**
   * Update address
   */
  async update(id: string, updates: { label?: string; address?: string; landmark?: string; isDefault?: boolean }) {
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
 * Order Operations
 */
export const orderService = {
  /**
   * Create a new order
   */
  async create(addressId: string, deliveryDate: string, deliveryTime: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

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

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
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
      })
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

    // Fetch from specialized order tables in parallel (excluding main orders table)
    const [mealboxOrders, bulkMealOrders, cateringOrders, corporateOrders] = await Promise.all([
      supabase
        .from('mealbox_orders')
        .select('*')
        .eq('user_id', user.id),
      supabase
        .from('bulk_meal_orders')
        .select('*')
        .eq('user_id', user.id),
      supabase
        .from('catering_orders')
        .select('*')
        .eq('user_id', user.id),
      supabase
        .from('corporate_orders')
        .select('*')
        .eq('user_id', user.id),
    ]);

    // Handle errors from any of the queries
    if (mealboxOrders.error) throw mealboxOrders.error;
    if (bulkMealOrders.error) throw bulkMealOrders.error;
    if (cateringOrders.error) throw cateringOrders.error;
    if (corporateOrders.error) throw corporateOrders.error;

    const allOrders: any[] = [];

    // Process mealbox orders
    if (mealboxOrders.data) {
      mealboxOrders.data.forEach(order => {
        allOrders.push({
          id: order.id,
          orderNumber: order.order_number,
          orderType: 'mealbox',
          orderTypeLabel: 'Meal Box',
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
      bulkMealOrders.data.forEach(order => {
        allOrders.push({
          id: order.id,
          orderNumber: order.order_number,
          orderType: 'bulk',
          orderTypeLabel: 'Bulk Meal',
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
    }

    // Process catering orders
    if (cateringOrders.data) {
      cateringOrders.data.forEach(order => {
        allOrders.push({
          id: order.id,
          orderNumber: order.order_number || Math.floor(Math.random() * 10000),
          orderType: 'catering',
          orderTypeLabel: 'Catering',
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
          orderTypeLabel: 'Corporate',
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

    // Sort all orders by created_at descending
    allOrders.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
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
    total: number;
    deliveryDate?: string;
    deliveryTime?: string;
    addressId?: string;
  }) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    // Generate unique order number (max 2147483647 for integer)
    const timePart = Date.now() % 100000000; // Last 8 digits of timestamp
    const nextOrderNumber = Math.floor(timePart / 100) + Math.floor(Math.random() * 1000)

    const { data, error } = await supabase
      .from('mealbox_orders')
      .insert({
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
        total: orderData.total.toFixed(2),
        delivery_date: orderData.deliveryDate || null,
        delivery_time: orderData.deliveryTime || null,
        address_id: orderData.addressId || null,
        status: 'pending',
      })
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
    total: number;
    deliveryDate?: string;
    deliveryTime?: string;
    addressId?: string;
    deliveryAddress?: string;
  }) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('Not authenticated');

    // Generate unique order number (max 2147483647 for integer)
    const timePart = Date.now() % 100000000;
    const nextOrderNumber = Math.floor(timePart / 100) + Math.floor(Math.random() * 1000)

    const { data, error } = await supabase
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
        status: 'pending',
      })
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
    
    if (orderData.addressId && orderData.deliveryAddress === undefined) {
      // Look up the saved address and use its text
      const { data: addressData } = await supabase
        .from('addresses')
        .select('address, landmark')
        .eq('id', orderData.addressId)
        .single();
      
      if (addressData) {
        finalDeliveryAddress = addressData.address;
        if (addressData.landmark) {
          finalDeliveryAddress += `, ${addressData.landmark}`;
        }
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
          ? `${orderData.deliveryDate}T${orderData.deliveryTime}:00` 
          : null,
        delivery_address: finalDeliveryAddress,
        order_status: 'pending',
        payment_status: 'pending',
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

    // Resolve delivery address
    let finalDeliveryAddress = orderData.deliveryAddress || 'Address not provided';
    
    if (orderData.addressId && !orderData.deliveryAddress) {
      const { data: addressData } = await supabase
        .from('addresses')
        .select('address, landmark')
        .eq('id', orderData.addressId)
        .single();
      
      if (addressData) {
        finalDeliveryAddress = addressData.address;
        if (addressData.landmark) {
          finalDeliveryAddress += `, ${addressData.landmark}`;
        }
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
          ? `${orderData.deliveryDate}T${orderData.deliveryTime}:00` 
          : null,
        delivery_address: finalDeliveryAddress,
        order_status: 'pending',
        payment_status: 'pending',
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

    // Generate unique order number (max 2147483647 for integer)
    const timePart = Date.now() % 100000000;
    const nextOrderNumber = Math.floor(timePart / 100) + Math.floor(Math.random() * 1000)

    const { data, error } = await supabase
      .from('catering_orders')
      .insert({
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
      })
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

    // Generate unique order number (max 2147483647 for integer)
    const timePart = Date.now() % 100000000;
    const nextOrderNumber = Math.floor(timePart / 100) + Math.floor(Math.random() * 1000)

    const { data, error } = await supabase
      .from('corporate_orders')
      .insert({
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
      })
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
 */
export interface CouponValidationResult {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxDiscount?: number;
    description?: string;
  };
  discount?: number;
  error?: string;
}

export const couponService = {
  /**
   * Validate a coupon code and calculate discount
   */
  async validate(code: string, orderTotal: number): Promise<CouponValidationResult> {
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

    // Check if coupon is within valid dates
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return { valid: false, error: 'This coupon is not yet active' };
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return { valid: false, error: 'This coupon has expired' };
    }

    // Check total usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { valid: false, error: 'This coupon has reached its usage limit' };
    }

    // Check minimum order amount
    const minOrderAmount = parseFloat(coupon.min_order_amount || '0');
    if (orderTotal < minOrderAmount) {
      return { valid: false, error: `Minimum order of ₹${minOrderAmount} required for this coupon` };
    }

    // Check per-user limit (if user is authenticated)
    const user = await getAuthenticatedUser();
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

    // Calculate discount
    let discount = 0;
    const discountValue = parseFloat(coupon.discount_value);

    if (coupon.discount_type === 'percentage') {
      discount = Math.round(orderTotal * (discountValue / 100));
      // Apply max discount cap if set
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
        discountType: coupon.discount_type as 'percentage' | 'fixed',
        discountValue: discountValue,
        maxDiscount: coupon.max_discount ? parseFloat(coupon.max_discount) : undefined,
        description: coupon.description,
      },
      discount,
    };
  },

  /**
   * Record coupon usage after order is placed
   */
  async recordUsage(couponId: string, orderId?: string): Promise<void> {
    const user = await getAuthenticatedUser();
    if (!user) return;

    // Insert usage record
    await supabase
      .from('coupon_usages')
      .insert({
        coupon_id: couponId,
        user_id: user.id,
        order_id: orderId || null,
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

