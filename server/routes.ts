import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  registerDeviceToken,
  updateNotificationPreferences,
  getUserDeviceTokens,
  deleteDeviceToken,
} from "./notifications";
import Razorpay from "razorpay";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // put application routes here
  // prefix all routes with /api
  
  // Test route to verify routes are working
  app.get("/api/test", (req: Request, res: Response) => {
    res.json({ message: "API routes are working", timestamp: new Date().toISOString() });
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // ==================== NOTIFICATION ROUTES ====================

  /**
   * POST /api/notifications/register
   * Register device token for push notifications
   */
  app.post("/api/notifications/register", async (req: Request, res: Response) => {
    try {
      const { user_id, device_token, platform, preferences } = req.body;

      if (!user_id || !device_token || !platform) {
        return res.status(400).json({
          error: "Missing required fields: user_id, device_token, platform",
        });
      }

      const token = await registerDeviceToken({
        user_id,
        device_token,
        platform,
        preferences,
      });

      res.json({ success: true, token });
    } catch (error: any) {
      console.error("[Notifications] Registration error:", error);
      res.status(500).json({ error: error.message || "Failed to register device token" });
    }
  });

  /**
   * PUT /api/notifications/preferences
   * Update notification preferences
   */
  app.put("/api/notifications/preferences", async (req: Request, res: Response) => {
    try {
      const { user_id, preferences } = req.body;

      if (!user_id || !preferences) {
        return res.status(400).json({
          error: "Missing required fields: user_id, preferences",
        });
      }

      await updateNotificationPreferences(user_id, preferences);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Notifications] Preferences update error:", error);
      res.status(500).json({ error: error.message || "Failed to update preferences" });
    }
  });

  /**
   * GET /api/notifications/tokens/:userId
   * Get all device tokens for a user (admin/testing)
   */
  app.get("/api/notifications/tokens/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const tokens = await getUserDeviceTokens(userId);
      res.json({ tokens });
    } catch (error: any) {
      console.error("[Notifications] Get tokens error:", error);
      res.status(500).json({ error: error.message || "Failed to get device tokens" });
    }
  });

  /**
   * DELETE /api/notifications/unregister
   * Unregister device token (logout/uninstall)
   */
  app.delete("/api/notifications/unregister", async (req: Request, res: Response) => {
    try {
      const { user_id, device_token } = req.body;

      if (!user_id || !device_token) {
        return res.status(400).json({
          error: "Missing required fields: user_id, device_token",
        });
      }

      await deleteDeviceToken(user_id, device_token);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Notifications] Unregister error:", error);
      res.status(500).json({ error: error.message || "Failed to unregister device token" });
    }
  });

  /**
   * POST /api/notifications/send
   * Send notification to a user (called by Supabase Edge Function)
   * This endpoint handles FCM authentication using Firebase Admin SDK
   */
  app.post("/api/notifications/send", async (req: Request, res: Response) => {
    try {
      const { user_id, title, body, event_name, deep_link, category = "transactional", metadata } = req.body;

      if (!user_id || !title || !body) {
        return res.status(400).json({
          error: "Missing required fields: user_id, title, body",
        });
      }

      const { sendNotificationToUser } = await import('./notification-sender');
      
      const payload = {
        notification_id: require('crypto').randomUUID(),
        category: category as "transactional" | "marketing" | "behavioral",
        event_name: event_name || "notification",
        user_id,
        title,
        body,
        deep_link: deep_link || "",
        metadata: metadata || {},
        dedupe_key: `${event_name || 'notification'}:${user_id}:${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      const result = await sendNotificationToUser(user_id, payload);
      
      res.json({ 
        success: true,
        sent: result.sent,
        failed: result.failed,
      });
    } catch (error: any) {
      console.error("[Notifications] Send error:", error);
      res.status(500).json({ error: error.message || "Failed to send notification" });
    }
  });

  /**
   * POST /api/notifications/test
   * Send a test notification to a user (for testing)
   */
  app.post("/api/notifications/test", async (req: Request, res: Response) => {
    try {
      const { user_id, title, body } = req.body;

      if (!user_id) {
        return res.status(400).json({
          error: "Missing required field: user_id",
        });
      }

      const { sendNotificationToUser, createOrderNotificationPayload } = await import('./notification-sender');
      
      const payload = createOrderNotificationPayload(
        'order_confirmed',
        user_id,
        'test-order-123',
        1234,
        { eta: '30 minutes' }
      );

      // Override title/body if provided
      if (title) payload.title = title;
      if (body) payload.body = body;

      const result = await sendNotificationToUser(user_id, payload);
      
      res.json({ 
        success: true, 
        message: `Notification sent to ${result.sent} device(s)`,
        failed: result.failed,
        payload 
      });
    } catch (error: any) {
      console.error("[Notifications] Test send error:", error);
      res.status(500).json({ error: error.message || "Failed to send test notification" });
    }
  });

  // ==================== RAZORPAY PAYMENT ROUTES ====================

  /**
   * GET /api/payments/key
   * Get Razorpay public key ID (safe to expose to client)
   */
  app.get("/api/payments/key", async (req: Request, res: Response) => {
    try {
      const razorpayKeyId = process.env.RAZORPAY_KEY_ID;

      console.log("[Razorpay] Checking for RAZORPAY_KEY_ID in environment...");
      console.log("[Razorpay] Key exists:", !!razorpayKeyId);
      console.log("[Razorpay] Key starts with:", razorpayKeyId ? razorpayKeyId.substring(0, 10) + "..." : "N/A");

      if (!razorpayKeyId) {
        console.error("[Razorpay] RAZORPAY_KEY_ID environment variable is not set");
        return res.status(500).json({
          error: "Payment gateway is not configured. Please set RAZORPAY_KEY_ID in your .env file.",
        });
      }

      res.json({
        keyId: razorpayKeyId,
      });
    } catch (error: any) {
      console.error("[Razorpay] Get key error:", error);
      res.status(500).json({
        error: error.message || "Failed to get payment key",
      });
    }
  });

  /**
   * POST /api/payments/create-order
   * Create a Razorpay order for payment
   */
  app.post("/api/payments/create-order", async (req: Request, res: Response) => {
    try {
      const { amount, currency = "INR", receipt } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          error: "Invalid amount. Amount must be greater than 0",
        });
      }

      const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!razorpayKeyId || !razorpayKeySecret) {
        console.error("[Razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variables");
        return res.status(500).json({
          error: "Payment gateway is not configured. Please contact support.",
        });
      }

      const razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret,
      });

      // Amount should be in paise (smallest currency unit)
      // Client sends amount in rupees, so multiply by 100 to convert to paise
      const amountInPaise = Math.round(amount * 100);
      
      console.log("[Razorpay] Creating order:", {
        amountInRupees: amount,
        amountInPaise: amountInPaise,
        currency: currency,
      });
      
      const options = {
        amount: amountInPaise,
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);
      
      console.log("[Razorpay] Order created successfully:", order.id);

      res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      });
    } catch (error: any) {
      console.error("[Razorpay] Create order error:", error);
      res.status(500).json({
        error: error.message || "Failed to create payment order",
      });
    }
  });

  /**
   * POST /api/payments/verify
   * Verify Razorpay payment signature
   */
  app.post("/api/payments/verify", async (req: Request, res: Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          error: "Missing required payment verification fields",
        });
      }

      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!razorpayKeySecret) {
        return res.status(500).json({
          error: "Payment gateway is not configured",
        });
      }

      const crypto = await import("crypto");
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const generated_signature = crypto
        .createHmac("sha256", razorpayKeySecret)
        .update(text)
        .digest("hex");

      const isSignatureValid = generated_signature === razorpay_signature;

      if (isSignatureValid) {
        res.json({
          success: true,
          verified: true,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
        });
      } else {
        res.status(400).json({
          success: false,
          verified: false,
          error: "Invalid payment signature",
        });
      }
    } catch (error: any) {
      console.error("[Razorpay] Verify payment error:", error);
      res.status(500).json({
        error: error.message || "Failed to verify payment",
      });
    }
  });

  return httpServer;
}
