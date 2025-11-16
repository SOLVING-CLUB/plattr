import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { supabase } from "./supabase-rest";
import { categories, dishes, cartItems, users, addOns, otpVerifications, orders, orderItems, addresses } from "@shared/schema";
import { eq, and, sql, gt } from "drizzle-orm";
import { smsService } from "./sms";
import { z } from "zod";
import Stripe from "stripe";
import "./types/session";

// Check if using REST API
const useRestAPI = !!(process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY));

// Initialize Stripe (only if keys are available)
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-09-30.clover",
  });
}

// Helper function to format category names
function formatCategoryName(categoryId: string): string {
  const nameMap: Record<string, string> = {
    'beverages': 'Beverages',
    'salads': 'Salads',
    'bakery': 'Bakery',
    'breakfast': 'Breakfast',
    'snacks': 'Snacks',
    'starters': 'Starters',
    'desserts': 'Desserts',
    'sweets': 'Sweets',
    'main-course': 'Main Course',
    'main_course': 'Main Course',
    'soup': 'Soups',
    'sides': 'Sides',
    'sides-and-accompaniments': 'Sides & Accompaniments',
    'chaats': 'Chaats',
    'biryani': 'Biryani',
    'rice-items': 'Rice Items',
    'breads-curries': 'Breads & Curries',
    'baked-snacks': 'Baked Snacks',
    'fried-snacks': 'Fried Snacks',
    'south-indian-tiffins': 'South Indian Tiffins',
    'north-indian-tiffins': 'North Indian Tiffins',
    'quick-bites': 'Quick Bites',
    'aftermeal': 'After Meal'
  };
  
  return nameMap[categoryId] || categoryId.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ========== AUTH ROUTES ==========
  
  // Send OTP for signup/login
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const schema = z.object({
        phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
      });

      const { phone } = schema.parse(req.body);

      // Generate OTP
      const otp = smsService.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in database
      await db.insert(otpVerifications).values({
        phone,
        otp,
        expiresAt,
      });

      // Send SMS
      const sent = await smsService.sendOTP(phone, otp);

      if (!sent) {
        res.status(500).json({ error: "Failed to send OTP. Please try again." });
        return;
      }

      res.json({ 
        success: true, 
        message: "OTP sent successfully",
        // In development, send OTP in response for testing
        ...(process.env.NODE_ENV === 'development' && { otp })
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  // Verify OTP and signup/login
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const schema = z.object({
        phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
        otp: z.string().length(6, "OTP must be 6 digits"),
        username: z.string().min(2, "Username must be at least 2 characters").optional(),
      });

      const { phone, otp, username } = schema.parse(req.body);

      // Find valid OTP
      const otpRecord = await db
        .select()
        .from(otpVerifications)
        .where(
          and(
            eq(otpVerifications.phone, phone),
            eq(otpVerifications.otp, otp),
            eq(otpVerifications.isUsed, false),
            gt(otpVerifications.expiresAt, new Date())
          )
        )
        .limit(1);

      if (otpRecord.length === 0) {
        res.status(400).json({ error: "Invalid or expired OTP" });
        return;
      }

      // Mark OTP as used
      await db
        .update(otpVerifications)
        .set({ isUsed: true })
        .where(eq(otpVerifications.id, otpRecord[0].id));

      // Check if user exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.phone, phone))
        .limit(1);

      let user;
      if (existingUser.length > 0) {
        // User exists, mark as verified
        await db
          .update(users)
          .set({ isVerified: true })
          .where(eq(users.id, existingUser[0].id));
        user = existingUser[0];
      } else {
        // Create new user
        if (!username) {
          res.status(400).json({ error: "Username is required for new users" });
          return;
        }

        const newUserResult = await db
          .insert(users)
          .values({
            username,
            phone,
            isVerified: true,
          })
          .returning();
        user = newUserResult[0];
      }

      // Set session for authenticated user
      req.session.userId = user.id;
      req.session.phone = user.phone || undefined;
      
      res.json({
        success: true,
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
        },
      });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  // Check if phone number exists
  app.post("/api/auth/check-phone", async (req, res) => {
    try {
      const schema = z.object({
        phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
      });

      const { phone } = schema.parse(req.body);

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.phone, phone))
        .limit(1);

      res.json({
        exists: existingUser.length > 0,
        username: existingUser.length > 0 ? existingUser[0].username : null,
      });
    } catch (error) {
      console.error("Error checking phone:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      res.status(500).json({ error: "Failed to check phone" });
    }
  });

  // ========== EXISTING ROUTES ==========
  
  // Get unique categories dynamically from dishes based on meal type
  app.get("/api/categories/:mealType", async (req, res) => {
    try {
      const { mealType } = req.params;
      
      if (useRestAPI) {
        // If fetching all categories, don't filter
        if (mealType === 'all') {
          const categories = await supabase.select('categories', {
            select: '*',
            order: 'display_order.asc'
          });
          
          // Format categories for frontend
          const formatted = categories.map((cat: any) => ({
            id: cat.id || 'unknown',
            name: cat.name || formatCategoryName(cat.id || 'unknown'),
            mealType: cat.meal_type || '',
            displayOrder: cat.display_order || 0,
            imageUrl: cat.image_url || `/images/categories/${cat.id}.jpg`
          }));
          
          res.json(formatted);
          return;
        }
        
        // Use Supabase REST API - get categories filtered by meal_type
        // Map friendly meal type names to database values
        const mealTypeMap: Record<string, string> = {
          'tiffins': 'breakfast',
          'snacks': 'snacks',
          'lunch-dinner': 'lunch-dinner',
          'breakfast': 'breakfast'
        };
        
        const dbMealType = mealTypeMap[mealType] || mealType;
        
        // Query Supabase REST API with filter: meal_type = dbMealType
        const categories = await supabase.select('categories', {
          select: '*',
          filter: { 'meal_type': `eq.${dbMealType}` },
          order: 'display_order.asc'
        });
        
        // Format categories for frontend
        const formatted = categories.map((cat: any) => ({
          id: cat.id || 'unknown',
          name: cat.name || formatCategoryName(cat.id || 'unknown'),
          mealType: dbMealType,
          displayOrder: cat.display_order || 0,
          imageUrl: cat.image_url || `/images/categories/${cat.id}.jpg`
        }));
        
        res.json(formatted);
      } else {
        // Use Drizzle ORM (direct PostgreSQL)
        if (!db) {
          throw new Error("Database not initialized");
        }
        
        // Map friendly meal type names to database values
        const mealTypeMap: Record<string, string> = {
          'tiffins': 'breakfast',  // Tiffins maps to breakfast
          'snacks': 'snacks',
          'lunch-dinner': 'lunch-dinner',
          'breakfast': 'breakfast'
        };
        
        const dbMealType = mealTypeMap[mealType] || mealType;
        
        // Get distinct category_ids where dishes have the specified meal_type
        const result = await db
          .selectDistinct({ categoryId: dishes.categoryId })
          .from(dishes)
          .where(sql`${dishes.mealType} @> ARRAY[${sql.raw(`'${dbMealType}'`)}]::text[]`);
        
        // Return formatted category objects with basic info
        const formattedCategories = result.map((row, index) => ({
          id: row.categoryId || 'unknown',
          name: formatCategoryName(row.categoryId || 'unknown'),
          mealType: dbMealType,
          displayOrder: index,
          imageUrl: `/images/categories/${row.categoryId}.jpg`
        }));
        
        res.json(formattedCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Get distinct dish types for a category
  app.get("/api/dish-types/:categoryId", async (req, res) => {
    try {
      const { categoryId } = req.params;
      
      if (categoryId === 'all') {
        // If 'all' category, return empty array (no dish type filtering needed)
        res.json([]);
        return;
      }
      
      if (useRestAPI) {
        // Use Supabase REST API
        // Get all dishes for this category, then extract unique dish_type values
        const dishes = await supabase.select('dishes', {
          select: 'dish_type',
          filter: { 'category_id': `eq.${categoryId}` },
        });
        
        // Extract unique non-null dish_type values
        const dishTypes = [...new Set(
          dishes
            .map((d: any) => d.dish_type)
            .filter((type: any) => type !== null && type !== undefined)
        )];
        
        res.json(dishTypes.sort());
      } else {
        // Use Drizzle ORM (direct PostgreSQL)
        if (!db) {
          throw new Error("Database not initialized");
        }
        
        // Get distinct dish_types for the specified category
        const result = await db
          .selectDistinct({ dishType: dishes.dishType })
          .from(dishes)
          .where(eq(dishes.categoryId, categoryId))
          .orderBy(dishes.dishType);
        
        // Filter out null values and return just the dish type strings
        const dishTypes = result
          .filter(row => row.dishType !== null)
          .map(row => row.dishType as string);
        
        res.json(dishTypes);
      }
    } catch (error) {
      console.error("Error fetching dish types:", error);
      res.status(500).json({ error: "Failed to fetch dish types" });
    }
  });

  // Get all dishes by meal type
  app.get("/api/dishes/:mealType", async (req, res) => {
    try {
      let { mealType } = req.params;
      
      // Map "tiffins" to "breakfast" for production database compatibility
      const dbMealType = mealType === 'tiffins' ? 'breakfast' : mealType;
      
      if (useRestAPI) {
        // Use Supabase REST API
        // Query dishes where meal_type array contains the meal type
        // PostgREST filter: meal_type=cs.{dbMealType} (contains)
        const dishes = await supabase.select('dishes', {
          select: '*',
          filter: { 'meal_type': `cs.{${dbMealType}}` }, // Contains operator for arrays
          order: 'name.asc'
        });
        
        res.json(dishes);
      } else {
        // Use Drizzle ORM (direct PostgreSQL)
        if (!db) {
          throw new Error("Database not initialized");
        }
        
        const result = await db
          .select()
          .from(dishes)
          .where(sql`${dishes.mealType} @> ARRAY[${sql.raw(`'${dbMealType}'`)}]::text[]`);
        
        res.json(result);
      }
    } catch (error) {
      console.error("Error fetching dishes:", error);
      res.status(500).json({ error: "Failed to fetch dishes" });
    }
  });

  // Get dishes by meal type and category or plan type
  app.get("/api/dishes/:mealType/:categoryId", async (req, res) => {
    try {
      let { mealType, categoryId } = req.params;
      
      // Map "tiffins" to "breakfast" for production database compatibility
      const dbMealType = mealType === 'tiffins' ? 'breakfast' : mealType;
      
      if (useRestAPI) {
        // Use Supabase REST API
        // Build filters for meal_type and category_id
        
        const filters: Record<string, string> = {
          'meal_type': `cs.{${dbMealType}}` // Contains operator for arrays
        };
        
        // Add category filter if not 'all' and not a plan type
        if (categoryId !== 'all' && !['basic', 'gold', 'platinum'].includes(categoryId)) {
          filters['category_id'] = `eq.${categoryId}`;
        }
        
        const dishes = await supabase.select('dishes', {
          select: '*',
          filter: filters,
          order: 'name.asc'
        });
        
        res.json(dishes);
      } else {
        // Use Drizzle ORM (direct PostgreSQL)
        if (!db) {
          throw new Error("Database not initialized");
        }
        
        // Check if categoryId is actually a planType (basic, gold, platinum)
        if (['basic', 'gold', 'platinum'].includes(categoryId)) {
          // For now, just return all dishes for this meal type since planType doesn't exist in production
          const result = await db.select().from(dishes).where(
            sql`${dishes.mealType} @> ARRAY[${sql.raw(`'${dbMealType}'`)}]::text[]`
          );
          res.json(result);
          return;
        }
        
        // Otherwise, treat as categoryId
        const query = categoryId === 'all' 
          ? db.select().from(dishes).where(sql`${dishes.mealType} @> ARRAY[${sql.raw(`'${dbMealType}'`)}]::text[]`)
          : db.select().from(dishes).where(
              and(
                sql`${dishes.mealType} @> ARRAY[${sql.raw(`'${dbMealType}'`)}]::text[]`,
                eq(dishes.categoryId, categoryId)
              )
            );
        
        const result = await query;
        res.json(result);
      }
    } catch (error) {
      console.error("Error fetching dishes:", error);
      res.status(500).json({ error: "Failed to fetch dishes" });
    }
  });

  // Get cart items - return 401 for unauthenticated users
  app.get("/api/cart", async (req, res) => {
    try {
      const userId = req.session.userId;
      
      // If not authenticated, return 401 so frontend can detect guest status
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const result = await db
        .select({
          id: cartItems.id,
          quantity: cartItems.quantity,
          dish: {
            id: dishes.id,
            name: dishes.name,
            description: dishes.description,
            price: dishes.price,
            imageUrl: dishes.imageUrl,
            mealType: dishes.mealType,
            categoryId: dishes.categoryId,
            isAvailable: dishes.isAvailable,
            spiceLevel: dishes.spiceLevel,
            dietaryType: dishes.dietaryType,
          },
          category: categories,
        })
        .from(cartItems)
        .innerJoin(dishes, eq(cartItems.dishId, dishes.id))
        .innerJoin(categories, eq(dishes.categoryId, categories.id))
        .where(eq(cartItems.userId, userId));
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  // Add item to cart - only for authenticated users (guests use localStorage)
  app.post("/api/cart", async (req, res) => {
    try {
      const userId = req.session.userId;

      const { dishId, quantity } = req.body;
      
      if (!dishId || !quantity) {
        return res.status(400).json({ error: "dishId and quantity are required" });
      }
      
      // If not authenticated, return success (frontend handles localStorage)
      if (!userId) {
        return res.json({ success: true, message: "Item added to cart" });
      }
      
      // Check if item already exists in cart
      const existing = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.userId, userId), eq(cartItems.dishId, dishId)))
        .limit(1);
      
      if (existing.length > 0) {
        // Update quantity
        const result = await db
          .update(cartItems)
          .set({ quantity: existing[0].quantity + quantity })
          .where(eq(cartItems.id, existing[0].id))
          .returning();
        
        res.json(result[0]);
      } else {
        // Insert new cart item
        const result = await db
          .insert(cartItems)
          .values({ userId, dishId, quantity })
          .returning();
        
        res.json(result[0]);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  // Update cart item quantity (authenticated users only)
  app.put("/api/cart/:id", async (req, res) => {
    try {
      const userId = req.session.userId;

      const { id } = req.params;
      const { quantity } = req.body;
      
      // If not authenticated, return success (frontend handles localStorage)
      if (!userId) {
        return res.json({ success: true, message: "Item updated" });
      }
      
      // Verify cart item belongs to authenticated user
      const cartItem = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
        .limit(1);
      
      if (cartItem.length === 0) {
        return res.status(404).json({ error: "Cart item not found or access denied" });
      }
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        await db.delete(cartItems).where(eq(cartItems.id, id));
        res.json({ message: "Item removed from cart" });
      } else {
        const result = await db
          .update(cartItems)
          .set({ quantity })
          .where(eq(cartItems.id, id))
          .returning();
        
        res.json(result[0]);
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      res.status(500).json({ error: "Failed to update cart" });
    }
  });

  // Remove item from cart (authenticated users only)
  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const userId = req.session.userId;

      const { id } = req.params;
      
      // If not authenticated, return success (frontend handles localStorage)
      if (!userId) {
        return res.json({ success: true, message: "Item removed" });
      }
      
      // Verify cart item belongs to authenticated user
      const cartItem = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
        .limit(1);
      
      if (cartItem.length === 0) {
        return res.status(404).json({ error: "Cart item not found or access denied" });
      }
      
      await db.delete(cartItems).where(eq(cartItems.id, id));
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ error: "Failed to remove from cart" });
    }
  });

  // Get all add-ons
  app.get("/api/add-ons", async (req, res) => {
    try {
      let result;
      
      if (useRestAPI) {
        // Use Supabase REST API - get all available add-ons
        // Filter: is_available = true
        result = await supabase.select('add_ons', {
          select: '*',
          filter: { 'is_available': 'eq.true' },
          order: 'name.asc'
        });
      } else {
        // Use Drizzle ORM (direct PostgreSQL)
        if (!db) {
          throw new Error("Database not initialized");
        }
        result = await db
          .select()
          .from(addOns)
          .where(eq(addOns.isAvailable, true));
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching add-ons:", error);
      res.status(500).json({ error: "Failed to fetch add-ons" });
    }
  });

  // Create address
  app.post("/api/addresses", async (req, res) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated. Please log in to add an address." });
      }

      const schema = z.object({
        label: z.string().min(1, "Label is required"),
        address: z.string().min(10, "Please enter a complete address"),
        landmark: z.string().nullable().optional(),
        isDefault: z.boolean().optional().default(false),
      });

      const data = schema.parse(req.body);

      // If this is set as default, unset other defaults
      if (data.isDefault) {
        await db
          .update(addresses)
          .set({ isDefault: false })
          .where(eq(addresses.userId, userId));
      }

      const [address] = await db
        .insert(addresses)
        .values({
          userId,
          label: data.label,
          address: data.address,
          landmark: data.landmark || null,
          isDefault: data.isDefault || false,
        })
        .returning();

      res.json(address);
    } catch (error) {
      console.error("Error creating address:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      res.status(500).json({ error: "Failed to create address" });
    }
  });

  // Get order details by ID
  app.get("/api/orders/:orderId", async (req, res) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { orderId } = req.params;

      // Fetch order with address
      const orderData = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          subtotal: orders.subtotal,
          deliveryFee: orders.deliveryFee,
          tax: orders.tax,
          total: orders.total,
          deliveryDate: orders.deliveryDate,
          deliveryTime: orders.deliveryTime,
          status: orders.status,
          createdAt: orders.createdAt,
          addressId: addresses.id,
          addressLabel: addresses.label,
          address: addresses.address,
          landmark: addresses.landmark,
        })
        .from(orders)
        .innerJoin(addresses, eq(orders.addressId, addresses.id))
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
        .limit(1);

      if (orderData.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      const order = orderData[0];

      // Fetch order items with dish details
      const items = await db
        .select({
          id: orderItems.id,
          quantity: orderItems.quantity,
          price: orderItems.price,
          dishId: dishes.id,
          dishName: dishes.name,
          dishDescription: dishes.description,
          dishPrice: dishes.price,
          dishImageUrl: dishes.imageUrl,
          dishDietaryType: dishes.dietaryType,
        })
        .from(orderItems)
        .innerJoin(dishes, eq(orderItems.dishId, dishes.id))
        .where(eq(orderItems.orderId, orderId));

      // Format response
      const response = {
        id: order.id,
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        tax: order.tax,
        total: order.total,
        deliveryDate: order.deliveryDate,
        deliveryTime: order.deliveryTime,
        status: order.status,
        createdAt: order.createdAt,
        address: {
          id: order.addressId,
          label: order.addressLabel,
          address: order.address,
          landmark: order.landmark,
        },
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          dish: {
            id: item.dishId,
            name: item.dishName,
            description: item.dishDescription,
            price: item.dishPrice,
            imageUrl: item.dishImageUrl,
            dietaryType: item.dishDietaryType,
          },
        })),
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching order details:", error);
      res.status(500).json({ error: "Failed to fetch order details" });
    }
  });

  // Create order
  app.post("/api/orders", async (req, res) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated. Please log in to place an order." });
      }

      const schema = z.object({
        addressId: z.string(),
        deliveryDate: z.string(),
        deliveryTime: z.string(),
      });

      const { addressId, deliveryDate, deliveryTime } = schema.parse(req.body);

      // Fetch user's cart items to create order
      const cart = await db
        .select({
          dishId: cartItems.dishId,
          quantity: cartItems.quantity,
          price: dishes.price,
        })
        .from(cartItems)
        .innerJoin(dishes, eq(cartItems.dishId, dishes.id))
        .where(eq(cartItems.userId, userId));

      if (cart.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      // Calculate totals
      const subtotal = cart.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * item.quantity);
      }, 0);
      const deliveryFee = 40;
      const tax = Math.round(subtotal * 0.05);
      const total = subtotal + deliveryFee + tax;

      // Generate next sequential 8-digit order number
      const lastOrder = await db
        .select({ orderNumber: orders.orderNumber })
        .from(orders)
        .orderBy(sql`${orders.orderNumber} DESC`)
        .limit(1);
      
      const nextOrderNumber = lastOrder.length > 0 
        ? lastOrder[0].orderNumber + 1 
        : 10000001; // Start from 10000001 for first order

      // Create order
      const [order] = await db
        .insert(orders)
        .values({
          userId,
          addressId,
          orderNumber: nextOrderNumber,
          subtotal: subtotal.toString(),
          deliveryFee: deliveryFee.toString(),
          tax: tax.toString(),
          total: total.toString(),
          deliveryDate,
          deliveryTime,
          status: 'pending',
        })
        .returning();

      // Create order items
      const orderItemsData = cart.map((item) => ({
        orderId: order.id,
        dishId: item.dishId,
        quantity: item.quantity,
        price: item.price,
      }));

      await db.insert(orderItems).values(orderItemsData);

      // Clear user's cart
      await db.delete(cartItems).where(eq(cartItems.userId, userId));

      res.json({ 
        success: true, 
        id: order.id,
        orderNumber: order.orderNumber,
        message: "Order placed successfully" 
      });
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Stripe payment intent creation
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ 
          error: "Stripe is not configured. Please set up your Stripe API keys." 
        });
      }

      // Get userId from authenticated session (not from client request)
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated. Please log in." });
      }

      // Fetch user's cart items to calculate the total amount server-side
      const cart = await db
        .select({
          quantity: cartItems.quantity,
          price: dishes.price,
        })
        .from(cartItems)
        .innerJoin(dishes, eq(cartItems.dishId, dishes.id))
        .where(eq(cartItems.userId, userId));

      if (cart.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      // Calculate totals from server-side cart data
      const subtotal = cart.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * item.quantity);
      }, 0);
      const deliveryFee = 40;
      const tax = Math.round(subtotal * 0.05);
      const total = subtotal + deliveryFee + tax;

      if (total <= 0) {
        return res.status(400).json({ error: "Invalid cart total" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // Convert to paise (smallest currency unit for INR)
        currency: "inr", // Indian Rupees
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId,
          cartItems: cart.length,
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: total
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        error: "Failed to create payment intent", 
        message: error.message 
      });
    }
  });

  // ========== ACCOUNT MANAGEMENT ==========
  // Delete current user's account and related data (Apple compliance)
  app.delete("/api/account", async (req, res) => {
    try {
      const userId = req.session.userId;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated." });
      }

      // Delete dependent data in a safe order
      // 1) Delete cart items
      await db.delete(cartItems).where(eq(cartItems.userId, userId));

      // 2) Delete order items via orders
      const userOrders = await db.select({ id: orders.id }).from(orders).where(eq(orders.userId, userId));
      if (userOrders.length > 0) {
        const orderIds = userOrders.map(o => o.id);
        // Delete orderItems for all user orders
        for (const orderId of orderIds) {
          await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
        }
      }

      // 3) Delete orders
      await db.delete(orders).where(eq(orders.userId, userId));

      // 4) Delete addresses
      await db.delete(addresses).where(eq(addresses.userId, userId));

      // 5) Delete OTP verifications associated with user's phone (best effort)
      const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (userRecord.length > 0 && userRecord[0].phone) {
        await db.delete(otpVerifications).where(eq(otpVerifications.phone, userRecord[0].phone as string));
      }

      // 6) Finally, delete the user
      await db.delete(users).where(eq(users.id, userId));

      // 7) Destroy session
      req.session.destroy(() => {});

      res.json({ success: true, message: "Account deleted successfully." });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // ========== FIGMA ROUTES ==========
  
  // Download assets from Figma design
  app.post("/api/figma/download", async (req, res) => {
    try {
      const schema = z.object({
        figmaUrl: z.string().url("Invalid Figma URL"),
        outputPrefix: z.string().optional().default("figma"),
      });

      const { figmaUrl, outputPrefix } = schema.parse(req.body);
      const accessToken = process.env.FIGMA_ACCESS_TOKEN;

      if (!accessToken) {
        res.status(500).json({ 
          error: "FIGMA_ACCESS_TOKEN not configured. Please set it in your .env file." 
        });
        return;
      }

      const { downloadFigmaDesign } = await import("./figma.js");
      const downloadedFiles = await downloadFigmaDesign(figmaUrl, accessToken, outputPrefix);

      res.json({ 
        success: true, 
        message: `Downloaded ${downloadedFiles.length} file(s)`,
        files: downloadedFiles.map(file => file.split('/').pop())
      });
    } catch (error: any) {
      console.error("Error downloading Figma assets:", error);
      res.status(500).json({ 
        error: error.message || "Failed to download Figma assets" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
