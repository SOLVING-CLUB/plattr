import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password"),
  email: text("email"),
  phone: text("phone").unique(),
  isVerified: boolean("is_verified").notNull().default(false),
});

export const otpVerifications = pgTable("otp_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  mealType: text("meal_type").notNull(), // 'tiffins', 'snacks', 'lunch-dinner'
  displayOrder: integer("display_order").notNull().default(0),
  imageUrl: text("image_url"),
});

export const dishes = pgTable("dishes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  mealType: text("meal_type").array().notNull(), // Array of: 'breakfast', 'tiffins', 'snacks', 'lunch-dinner'
  categoryId: varchar("category_id").references(() => categories.id),
  isAvailable: boolean("is_available").notNull().default(true),
  spiceLevel: text("spice_level"), // 'mild', 'medium', 'spicy', 'extra-spicy'
  dietaryType: text("dietary_type"), // 'veg', 'non-veg', 'vegan'
  dishType: text("dish_type"), // e.g., 'Bread', 'EggPlate', 'GrainBowl', 'Handheld', 'HotFry', 'PanFry', 'SavoryBakery', 'Steamed', 'SweetGriddle'
  // Note: cuisine, meal_type_old exist in production but not used by app
});

export const addresses = pgTable("addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  label: text("label").notNull(), // 'Home', 'Office', etc.
  address: text("address").notNull(),
  landmark: text("landmark"),
  isDefault: boolean("is_default").notNull().default(false),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: integer("order_number").notNull().unique(), // 8-digit unique order ID (e.g., 10000001, 10000002...)
  userId: varchar("user_id").notNull().references(() => users.id),
  addressId: varchar("address_id").notNull().references(() => addresses.id),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  deliveryDate: text("delivery_date").notNull(), // Date in YYYY-MM-DD format
  deliveryTime: text("delivery_time").notNull(), // Time slot like "9:00 AM - 11:00 AM"
  status: text("status").notNull().default('pending'), // 'pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  dishId: varchar("dish_id").notNull().references(() => dishes.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  dishId: varchar("dish_id").notNull().references(() => dishes.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const addOns = pgTable("add_ons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  category: text("category").notNull(), // 'staff', 'entertainment', 'decor', 'equipment'
});

// MealBox Orders
export const mealboxOrders = pgTable("mealbox_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  orderNumber: integer("order_number").notNull().unique(),
  portions: text("portions").notNull(), // '3-portions', '5-portions', '6-portions', '8-portions'
  mealPreference: text("meal_preference").notNull(), // 'veg', 'non-veg', 'mixed'
  selectedMealType: text("selected_meal_type"), // 'breakfast', 'lunch', 'dinner', etc.
  vegBoxes: integer("veg_boxes").notNull().default(0),
  eggBoxes: integer("egg_boxes").notNull().default(0),
  nonVegBoxes: integer("non_veg_boxes").notNull().default(0),
  vegPlateSelections: text("veg_plate_selections"), // JSON array of selected dishes
  eggPlateSelections: text("egg_plate_selections"), // JSON array of selected dishes
  nonVegPlateSelections: text("non_veg_plate_selections"), // JSON array of selected dishes
  selectedAddons: text("selected_addons"), // JSON array of addon IDs
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  deliveryDate: text("delivery_date"),
  deliveryTime: text("delivery_time"),
  addressId: varchar("address_id").references(() => addresses.id),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bulk Meal Orders
export const bulkMealOrders = pgTable("bulk_meal_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  orderNumber: integer("order_number").notNull().unique(),
  items: text("items").notNull(), // JSON array of {dishId, quantity, price}
  selectedAddons: text("selected_addons"), // JSON array of addon IDs
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  gst: decimal("gst", { precision: 10, scale: 2 }).notNull().default("0"),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  packagingFee: decimal("packaging_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  deliveryDate: text("delivery_date"),
  deliveryTime: text("delivery_time"),
  addressId: varchar("address_id").references(() => addresses.id),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Catering Orders
export const cateringOrders = pgTable("catering_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Optional - can be guest order
  orderNumber: integer("order_number").notNull().unique(),
  eventType: text("event_type").notNull(),
  guestCount: integer("guest_count").notNull(),
  vegCount: integer("veg_count").default(0),
  nonVegCount: integer("non_veg_count").default(0),
  eggCount: integer("egg_count").default(0),
  eventDate: text("event_date").notNull(),
  eventTime: text("event_time"),
  mealTimes: text("meal_times"), // JSON array of meal times
  dietaryTypes: text("dietary_types"), // JSON array
  cuisines: text("cuisines"), // JSON array
  cuisinePreferences: text("cuisine_preferences"), // JSON array
  budgetMin: decimal("budget_min", { precision: 10, scale: 2 }),
  budgetMax: decimal("budget_max", { precision: 10, scale: 2 }),
  addOnIds: text("add_on_ids"), // JSON array
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  message: text("message"),
  addressId: varchar("address_id").references(() => addresses.id),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Corporate Orders
export const corporateOrders = pgTable("corporate_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Optional - can be guest order
  orderNumber: integer("order_number").notNull().unique(),
  companyName: text("company_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  numberOfPeople: integer("number_of_people").notNull(),
  vegCount: integer("veg_count").default(0),
  nonVegCount: integer("non_veg_count").default(0),
  eggCount: integer("egg_count").default(0),
  eventType: text("event_type").notNull(),
  budgetMin: decimal("budget_min", { precision: 10, scale: 2 }),
  budgetMax: decimal("budget_max", { precision: 10, scale: 2 }),
  eventDate: text("event_date").notNull(),
  eventTime: text("event_time"),
  additionalServices: text("additional_services"), // JSON array
  message: text("message"),
  addressId: varchar("address_id").references(() => addresses.id),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Concierge Preferences
export const conciergePreferences = pgTable("concierge_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  preferences: text("preferences").notNull(), // JSON object with user preferences
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  phone: true,
});

export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertDishSchema = createInsertSchema(dishes).omit({
  id: true,
});

export const insertAddressSchema = createInsertSchema(addresses).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertAddOnSchema = createInsertSchema(addOns).omit({
  id: true,
});

export const insertMealboxOrderSchema = createInsertSchema(mealboxOrders).omit({
  id: true,
  createdAt: true,
});

export const insertBulkMealOrderSchema = createInsertSchema(bulkMealOrders).omit({
  id: true,
  createdAt: true,
});

export const insertCateringOrderSchema = createInsertSchema(cateringOrders).omit({
  id: true,
  createdAt: true,
});

export const insertCorporateOrderSchema = createInsertSchema(corporateOrders).omit({
  id: true,
  createdAt: true,
});

export const insertConciergePreferenceSchema = createInsertSchema(conciergePreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;
export type OtpVerification = typeof otpVerifications.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertDish = z.infer<typeof insertDishSchema>;
export type Dish = typeof dishes.$inferSelect;

export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof addresses.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;

export type InsertAddOn = z.infer<typeof insertAddOnSchema>;
export type AddOn = typeof addOns.$inferSelect;

export type InsertMealboxOrder = z.infer<typeof insertMealboxOrderSchema>;
export type MealboxOrder = typeof mealboxOrders.$inferSelect;

export type InsertBulkMealOrder = z.infer<typeof insertBulkMealOrderSchema>;
export type BulkMealOrder = typeof bulkMealOrders.$inferSelect;

export type InsertCateringOrder = z.infer<typeof insertCateringOrderSchema>;
export type CateringOrder = typeof cateringOrders.$inferSelect;

export type InsertCorporateOrder = z.infer<typeof insertCorporateOrderSchema>;
export type CorporateOrder = typeof corporateOrders.$inferSelect;

export type InsertConciergePreference = z.infer<typeof insertConciergePreferenceSchema>;
export type ConciergePreference = typeof conciergePreferences.$inferSelect;
