import { sql } from "drizzle-orm";
import { pgTable, text, varchar, numeric, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Coupon schema
export const coupons = pgTable("coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(), // 'percentage' or 'fixed'
  discountValue: numeric("discount_value").notNull(), // percentage (e.g., 20) or fixed amount (e.g., 100)
  minOrderAmount: numeric("min_order_amount").default("0"),
  maxDiscount: numeric("max_discount"), // max discount for percentage coupons
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  usageLimit: integer("usage_limit"), // total times coupon can be used
  usageCount: integer("usage_count").default(0),
  perUserLimit: integer("per_user_limit").default(1),
  isActive: boolean("is_active").default(true),
  description: text("description"),
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  usageCount: true,
});

export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;

// Coupon usage tracking
export const couponUsages = pgTable("coupon_usages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  couponId: varchar("coupon_id").notNull(),
  userId: varchar("user_id").notNull(),
  orderId: varchar("order_id"),
  usedAt: timestamp("used_at").default(sql`now()`),
});

export type CouponUsage = typeof couponUsages.$inferSelect;
