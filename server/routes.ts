import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  registerDeviceToken,
  updateNotificationPreferences,
  getUserDeviceTokens,
  deleteDeviceToken,
} from "./notifications";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

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

  return httpServer;
}
