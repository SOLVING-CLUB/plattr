/**
 * Supabase Service Layer
 * Replaces Express backend API routes with direct Supabase calls
 */

import { supabaseAuth } from './supabase-auth';

// Get the Supabase client from auth (it has full database access)
const supabase = supabaseAuth;

/**
 * User Profile Operations
 */
export const userService = {
  /**
   * Get current user profile
   */
  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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
};

/**
 * Address Operations
 */
export const addressService = {
  /**
   * Get all addresses for current user
   */
  async getAll() {
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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

    // Get next order number
    const { data: lastOrder } = await supabase
      .from('orders')
      .select('order_number')
      .order('order_number', { ascending: false })
      .limit(1)
      .single();

    const nextOrderNumber = lastOrder?.order_number 
      ? lastOrder.order_number + 1 
      : 10000001;

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
    const { data: { user } } = await supabase.auth.getUser();
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
   * Get order by ID
   */
  async getById(orderId: string) {
    const { data: { user } } = await supabase.auth.getUser();
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
      throw new Error(error.message || 'Failed to verify OTP');
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get next order number
    const { data: lastOrder } = await supabase
      .from('mealbox_orders')
      .select('order_number')
      .order('order_number', { ascending: false })
      .limit(1)
      .single();

    const nextOrderNumber = lastOrder?.order_number 
      ? lastOrder.order_number + 1 
      : 20000001; // Start from 20M to differentiate from regular orders

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
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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
    subtotal: number;
    gst: number;
    platformFee: number;
    packagingFee: number;
    total: number;
    deliveryDate?: string;
    deliveryTime?: string;
    addressId?: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get next order number
    const { data: lastOrder } = await supabase
      .from('bulk_meal_orders')
      .select('order_number')
      .order('order_number', { ascending: false })
      .limit(1)
      .single();

    const nextOrderNumber = lastOrder?.order_number 
      ? lastOrder.order_number + 1 
      : 30000001; // Start from 30M

    const { data, error } = await supabase
      .from('bulk_meal_orders')
      .insert({
        user_id: user.id,
        order_number: nextOrderNumber,
        items: JSON.stringify(orderData.items),
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
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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

    // Get next order number
    const { data: lastOrder } = await supabase
      .from('catering_orders')
      .select('order_number')
      .order('order_number', { ascending: false })
      .limit(1)
      .single();

    const nextOrderNumber = lastOrder?.order_number 
      ? lastOrder.order_number + 1 
      : 40000001; // Start from 40M

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
    const { data: { user } } = await supabase.auth.getUser();
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

    // Get next order number
    const { data: lastOrder } = await supabase
      .from('corporate_orders')
      .select('order_number')
      .order('order_number', { ascending: false })
      .limit(1)
      .single();

    const nextOrderNumber = lastOrder?.order_number 
      ? lastOrder.order_number + 1 
      : 50000001; // Start from 50M

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
    const { data: { user } } = await supabase.auth.getUser();
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

