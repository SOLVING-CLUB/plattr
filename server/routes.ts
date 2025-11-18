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
import admin from "firebase-admin";

// Check if using REST API
const useRestAPI = !!(process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY));

const bypassAuthEnv = process.env.BYPASS_AUTH;
const bypassAuth =
  bypassAuthEnv === "true" ||
  (!bypassAuthEnv && process.env.NODE_ENV !== "production");
const bypassAuthPhone = process.env.BYPASS_AUTH_PHONE ?? "9999999999";
const bypassAuthUsername = process.env.BYPASS_AUTH_USERNAME ?? "Demo User";

// Initialize Stripe (only if keys are available)
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-09-30.clover",
  });
}

// Initialize Firebase Admin (only if credentials are available)
if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
  try {
    // Try to initialize with service account JSON
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Initialize with project ID (for emulator or default credentials)
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
  } catch (error) {
    console.warn("Firebase Admin initialization failed:", error);
    console.warn("Firebase phone auth will not work without proper credentials");
  }
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
  type BypassUser = {
    id: number;
    username?: string | null;
    phone?: string | null;
  };

  let cachedBypassUser: BypassUser | null = null;

  const getOrCreateBypassUser = async (): Promise<BypassUser> => {
    if (cachedBypassUser) {
      return cachedBypassUser;
    }

    if (!db && !(useRestAPI && supabase)) {
      throw new Error("BYPASS_AUTH requires either a direct database connection or Supabase REST.");
    }

    const lookupPhone = bypassAuthPhone;
    const fallbackUsername = bypassAuthUsername;

    if (db) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.phone, lookupPhone))
        .limit(1);

      if (existingUser.length > 0) {
        cachedBypassUser = existingUser[0];
        return cachedBypassUser;
      }

      const [newUser] = await db
        .insert(users)
        .values({
          username: fallbackUsername,
          phone: lookupPhone,
          password: "",
          isVerified: true,
        })
        .returning();

      cachedBypassUser = newUser;
      return newUser;
    }

    if (useRestAPI && supabase) {
      const existingUser = await supabase.select("users", {
        filter: { phone: `eq.${lookupPhone}` },
        limit: 1,
      });

      if (existingUser.length > 0) {
        cachedBypassUser = existingUser[0];
        return cachedBypassUser;
      }

      const insertedUser = await supabase.insert(
        "users",
        {
          username: fallbackUsername,
          phone: lookupPhone,
          password: "",
          is_verified: true,
        },
        true
      );

      const normalizedUser = Array.isArray(insertedUser) ? insertedUser[0] : insertedUser;
      cachedBypassUser = normalizedUser;
      return normalizedUser;
    }

    throw new Error("Unable to provision bypass auth user.");
  };

  if (bypassAuth) {
    try {
      const demoUser = await getOrCreateBypassUser();
      console.warn(
        `[auth] BYPASS_AUTH enabled. All requests will use demo user ${demoUser.username ?? demoUser.id}.`
      );
    } catch (error) {
      console.error("Failed to initialize bypass auth user:", error);
      throw error;
    }

    app.use((req, _res, next) => {
      getOrCreateBypassUser()
        .then((demoUser) => {
          req.session.userId = demoUser.id;
          req.session.phone = demoUser.phone ?? undefined;
          next();
        })
        .catch(next);
    });
  }

  // ========== AUTH ROUTES ==========
  
  // Test endpoint to verify server is running latest code
  app.get("/api/test", (req, res) => {
    res.json({ 
      message: "Server is running", 
      timestamp: new Date().toISOString(),
      hasDb: !!db,
      useRestAPI,
      hasSupabase: !!supabase
    });
  });
  
  // Send OTP for signup/login
  app.post("/api/auth/send-otp", async (req, res) => {
    if (bypassAuth) {
      res.json({
        success: true,
        message: "BYPASS_AUTH enabled. OTP flow skipped.",
      });
      return;
    }

    try {
      console.log("📱 [send-otp] Request received:", { body: req.body });
      
      const schema = z.object({
        phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
      });

      const { phone } = schema.parse(req.body);
      console.log("📱 [send-otp] Phone validated:", phone);

      // Generate OTP
      const otp = smsService.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      console.log("🔑 [send-otp] OTP generated:", otp);

      // Store OTP in database
      console.log("💾 [send-otp] Database check - db:", !!db, "useRestAPI:", useRestAPI, "supabase:", !!supabase);
      
      if (db) {
        // Use direct database connection
        console.log("💾 [send-otp] Using direct database connection");
        try {
          await db.insert(otpVerifications).values({
            phone,
            otp,
            expiresAt,
          });
          console.log("✅ [send-otp] OTP stored in database");
        } catch (dbError: any) {
          console.error("❌ [send-otp] Database insert error:", dbError);
          throw new Error(`Database error: ${dbError.message || 'Failed to store OTP'}`);
        }
      } else if (useRestAPI) {
        // Use Supabase REST API
        console.log("💾 [send-otp] Using Supabase REST API");
        try {
          if (!supabase) {
            throw new Error("Supabase client not initialized. Check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.");
          }
          const insertData = {
            phone,
            otp,
            expires_at: expiresAt.toISOString(),
            is_used: false,
          };
          console.log("💾 [send-otp] Inserting OTP data:", JSON.stringify(insertData, null, 2));
          const result = await supabase.insert("otp_verifications", insertData, true); // Use service role key
          console.log("✅ [send-otp] OTP stored via Supabase REST API, result:", JSON.stringify(result, null, 2));
          
          // Verify it was stored by querying it back
          const verifyResult = await supabase.select("otp_verifications", {
            filter: {
              phone: `eq.${phone}`,
              otp: `eq.${otp}`,
            },
            limit: 1,
          });
          console.log("🔍 [send-otp] Verification query result:", JSON.stringify(verifyResult, null, 2));
        } catch (error: any) {
          console.error("❌ [send-otp] Supabase insert error:", error);
          console.error("❌ [send-otp] Error details:", {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
          throw new Error(`Database error: ${error.message || 'Failed to store OTP'}`);
        }
      } else {
        const errorMsg = "No database connection available. Please configure SUPABASE_URL and SUPABASE_ANON_KEY, or set up a direct database connection.";
        console.error("❌ [send-otp]", errorMsg);
        throw new Error(errorMsg);
      }

      // Send SMS
      console.log("📤 [send-otp] Sending SMS...");
      const sent = await smsService.sendOTP(phone, otp);

      if (!sent) {
        console.error("❌ [send-otp] SMS service returned false");
        res.status(500).json({ error: "Failed to send OTP. Please try again." });
        return;
      }

      console.log("✅ [send-otp] OTP sent successfully");
      res.json({ 
        success: true, 
        message: "OTP sent successfully",
        // In development, send OTP in response for testing
        ...(process.env.NODE_ENV === 'development' && { otp })
      });
    } catch (error) {
      console.error("❌ [send-otp] Error:", error);
      if (error instanceof z.ZodError) {
        console.error("❌ [send-otp] Validation error:", error.errors);
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      const errorMessage = error instanceof Error ? error.message : "Failed to send OTP";
      console.error("❌ [send-otp] Returning error:", errorMessage);
      res.status(500).json({ error: errorMessage });
    }
  });

  // Verify OTP and signup/login
  app.post("/api/auth/verify-otp", async (req, res) => {
    if (bypassAuth) {
      try {
        const demoUser = await getOrCreateBypassUser();
        req.session.userId = demoUser.id;
        req.session.phone = demoUser.phone ?? undefined;

        res.json({
          success: true,
          message: "BYPASS_AUTH enabled. OTP verification skipped.",
          user: {
            id: demoUser.id,
            username: demoUser.username,
            phone: demoUser.phone,
          },
        });
      } catch (error) {
        console.error("❌ [verify-otp] Bypass auth failed:", error);
        res.status(500).json({ error: "Failed to initialize bypass auth user" });
      }
      return;
    }

    try {
      console.log("🔐 [verify-otp] Request received:", { body: req.body });
      
      const schema = z.object({
        phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
        otp: z.string().length(6, "OTP must be 6 digits"),
        username: z.string().min(2, "Username must be at least 2 characters").optional(),
      });

      const { phone, otp, username } = schema.parse(req.body);
      console.log("🔐 [verify-otp] Phone and OTP validated:", { phone, otpLength: otp.length });

      let otpRecord: any[] = [];
      
      // Find valid OTP
      if (db) {
        // Use direct database connection
        console.log("💾 [verify-otp] Using direct database connection");
        otpRecord = await db
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
      } else if (useRestAPI && supabase) {
        // Use Supabase REST API
        console.log("💾 [verify-otp] Using Supabase REST API");
        console.log("🔍 [verify-otp] Querying for OTP:", { phone, otp });
        try {
          // First, let's see all OTPs for this phone to debug
          const allOtps = await supabase.select("otp_verifications", {
            filter: {
              phone: `eq.${phone}`,
            },
            limit: 10,
          });
          console.log("🔍 [verify-otp] All OTPs for phone:", JSON.stringify(allOtps, null, 2));
          
          const results = await supabase.select("otp_verifications", {
            filter: {
              phone: `eq.${phone}`,
              otp: `eq.${otp}`,
              is_used: `eq.false`,
            },
            limit: 10,
          });
          
          console.log("🔍 [verify-otp] Filtered results:", JSON.stringify(results, null, 2));
          
          // Filter by expiration date in JavaScript since PostgREST date filtering is complex
          const now = new Date();
          console.log("🔍 [verify-otp] Current time:", now.toISOString());
          otpRecord = results.filter((record: any) => {
            // Parse timestamp as UTC (Supabase returns timestamps without timezone, but they're stored as UTC)
            // If the timestamp doesn't have 'Z' or timezone, treat it as UTC
            let expiresAtStr = record.expires_at;
            if (!expiresAtStr.endsWith('Z') && !expiresAtStr.includes('+') && !expiresAtStr.includes('-', 10)) {
              expiresAtStr = expiresAtStr + 'Z'; // Append Z to indicate UTC
            }
            const expiresAt = new Date(expiresAtStr);
            console.log("🔍 [verify-otp] Checking expiration:", {
              expires_at: record.expires_at,
              expiresAtStr: expiresAtStr,
              expiresAt: expiresAt.toISOString(),
              now: now.toISOString(),
              isValid: expiresAt > now
            });
            return expiresAt > now;
          });
          
          console.log("🔍 [verify-otp] Valid OTP records after expiration filter:", otpRecord.length);
        } catch (error: any) {
          console.error("❌ [verify-otp] Supabase select error:", error);
          throw new Error(`Database error: ${error.message || 'Failed to verify OTP'}`);
        }
      } else {
        throw new Error("No database connection available. Please configure SUPABASE_URL and SUPABASE_ANON_KEY, or set up a direct database connection.");
      }

      console.log("🔐 [verify-otp] OTP record found:", otpRecord.length > 0);

      if (otpRecord.length === 0) {
        console.error("❌ [verify-otp] Invalid or expired OTP");
        res.status(400).json({ error: "Invalid or expired OTP" });
        return;
      }

      const otpId = otpRecord[0].id;

      // Mark OTP as used
      if (db) {
        await db
          .update(otpVerifications)
          .set({ isUsed: true })
          .where(eq(otpVerifications.id, otpId));
      } else if (useRestAPI && supabase) {
        console.log("🔄 [verify-otp] Marking OTP as used, otpId:", otpId);
        console.log("🔄 [verify-otp] Update filter:", { id: `eq.${otpId}` });
        console.log("🔄 [verify-otp] Update data:", { is_used: true });
        await supabase.update("otp_verifications", { id: `eq.${otpId}` }, { is_used: true }, true); // Use service role key
        console.log("✅ [verify-otp] OTP marked as used successfully");
      }

      console.log("✅ [verify-otp] OTP marked as used");

      // Check if user exists
      let existingUser: any[] = [];
      
      if (db) {
        existingUser = await db
          .select()
          .from(users)
          .where(eq(users.phone, phone))
          .limit(1);
      } else if (useRestAPI && supabase) {
        const results = await supabase.select("users", {
          filter: { phone: `eq.${phone}` },
          limit: 1,
        });
        existingUser = results;
        console.log("🔍 [verify-otp] User lookup results:", JSON.stringify(results, null, 2));
      }

      console.log("👤 [verify-otp] Existing user found:", existingUser.length > 0);
      if (existingUser.length > 0) {
        console.log("👤 [verify-otp] Existing user details:", {
          id: existingUser[0].id,
          username: existingUser[0].username,
          phone: existingUser[0].phone
        });
      }

      let user;
      if (existingUser.length > 0) {
        // User exists, mark as verified
        if (db) {
          await db
            .update(users)
            .set({ isVerified: true })
            .where(eq(users.id, existingUser[0].id));
        } else if (useRestAPI && supabase) {
          await supabase.update("users", { id: `eq.${existingUser[0].id}` }, { is_verified: true }, true); // Use service role key
        }
        user = existingUser[0];
        console.log("✅ [verify-otp] Existing user verified");
      } else {
        // Create new user
        // If username not provided, use temporary username (will be updated on name screen)
        // Make it unique by adding timestamp to avoid conflicts
        const baseTempUsername = `user_${phone.slice(-4)}`;
        const tempUsername = username || `${baseTempUsername}_${Date.now().toString().slice(-6)}`;
        console.log("👤 [verify-otp] Creating new user with username:", tempUsername);

        if (db) {
          const newUserResult = await db
            .insert(users)
            .values({
              username: tempUsername,
              phone,
              password: "", // Empty password for phone-based auth
              isVerified: true,
            })
            .returning();
          user = newUserResult[0];
        } else if (useRestAPI && supabase) {
          try {
            const newUserResult = await supabase.insert("users", {
              username: tempUsername,
              phone,
              password: "", // Empty password for phone-based auth
              is_verified: true,
            }, true); // Use service role key
            user = Array.isArray(newUserResult) ? newUserResult[0] : newUserResult;
            console.log("✅ [verify-otp] New user created:", user?.id);
          } catch (insertError: any) {
            // If username already exists, try to find the existing user
            if (insertError.message?.includes('duplicate key') || insertError.message?.includes('already exists')) {
              console.warn("⚠️ [verify-otp] Username conflict, trying to find existing user by phone...");
              // Try to find user by phone again (maybe it was just created)
              const retryResults = await supabase.select("users", {
                filter: { phone: `eq.${phone}` },
                limit: 1,
              });
              if (retryResults.length > 0) {
                console.log("✅ [verify-otp] Found existing user after conflict:", retryResults[0].id);
                user = retryResults[0];
                // Update verification status
                await supabase.update("users", { id: `eq.${user.id}` }, { is_verified: true }, true);
              } else {
                // If still not found, try with a different unique username
                const uniqueUsername = `${baseTempUsername}_${Date.now()}`;
                console.log("🔄 [verify-otp] Retrying with unique username:", uniqueUsername);
                const retryResult = await supabase.insert("users", {
                  username: uniqueUsername,
                  phone,
                  password: "",
                  is_verified: true,
                }, true);
                user = Array.isArray(retryResult) ? retryResult[0] : retryResult;
                console.log("✅ [verify-otp] New user created with unique username:", user?.id);
              }
            } else {
              throw insertError;
            }
          }
        }
      }

      // Set session for authenticated user
      req.session.userId = user.id;
      req.session.phone = user.phone || undefined;
      
      console.log("✅ [verify-otp] Session set, user authenticated");
      
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
      console.error("❌ [verify-otp] Error:", error);
      if (error instanceof z.ZodError) {
        console.error("❌ [verify-otp] Validation error:", error.errors);
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      const errorMessage = error instanceof Error ? error.message : "Failed to verify OTP";
      console.error("❌ [verify-otp] Returning error:", errorMessage);
      res.status(500).json({ error: errorMessage });
    }
  });

  // Check if phone number exists
  app.post("/api/auth/check-phone", async (req, res) => {
    if (bypassAuth) {
      res.json({
        exists: true,
        username: bypassAuthUsername,
      });
      return;
    }

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

  // Sync Firebase authentication with Supabase
  app.post("/api/auth/firebase-sync", async (req, res) => {
    if (bypassAuth) {
      try {
        const demoUser = await getOrCreateBypassUser();
        req.session.userId = demoUser.id;
        req.session.phone = demoUser.phone ?? undefined;

        res.json({
          success: true,
          message: "BYPASS_AUTH enabled. Firebase sync skipped.",
          user: {
            id: demoUser.id,
            username: demoUser.username,
            phone: demoUser.phone,
          },
        });
      } catch (error) {
        console.error("❌ [firebase-sync] Bypass auth failed:", error);
        res.status(500).json({ error: "Failed to initialize bypass auth user" });
      }
      return;
    }

    try {
      const schema = z.object({
        idToken: z.string().min(1, "Firebase ID token is required"),
        phone: z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
        username: z.string().min(2, "Username must be at least 2 characters").optional(),
        firebaseUid: z.string().min(1, "Firebase UID is required"),
      });

      const { idToken, phone, username, firebaseUid } = schema.parse(req.body);

      // Verify Firebase ID token
      let decodedToken;
      try {
        if (!admin.apps.length) {
          res.status(500).json({ error: "Firebase Admin not initialized" });
          return;
        }
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (error: any) {
        console.error("Firebase token verification error:", error);
        res.status(401).json({ error: "Invalid or expired Firebase token" });
        return;
      }

      // Verify that the phone number matches
      const tokenPhone = decodedToken.phone_number?.replace(/^\+91/, '') || '';
      if (tokenPhone !== phone) {
        res.status(400).json({ error: "Phone number mismatch" });
        return;
      }

      // Check if user exists
      let existingUser: any[] = [];

      if (db) {
        existingUser = await db
          .select()
          .from(users)
          .where(eq(users.phone, phone))
          .limit(1);
      } else if (useRestAPI && supabase) {
        existingUser = await supabase.select("users", {
          filter: { phone: `eq.${phone}` },
          limit: 1,
        });
      } else {
        res.status(500).json({ error: "Database connection not configured" });
        return;
      }

      let user;
      if (existingUser.length > 0) {
        // User exists, update verification status
        if (db) {
          const updatedUser = await db
            .update(users)
            .set({ isVerified: true })
            .where(eq(users.id, existingUser[0].id))
            .returning();
          user = updatedUser[0] || existingUser[0];
        } else if (useRestAPI && supabase) {
          const updated = await supabase.update(
            "users",
            { id: `eq.${existingUser[0].id}` },
            { is_verified: true },
            true
          );
          const updatedArray = Array.isArray(updated) ? updated : [updated];
          user = updatedArray[0] || existingUser[0];
        }
      } else {
        // Create new user - username can be set later on name screen
        // For now, create with a temporary username based on phone
        const baseTempUsername = `user_${phone.slice(-4)}`;
        const tempUsername =
          username || `${baseTempUsername}_${Date.now().toString().slice(-6)}`;

        if (db) {
          const newUserResult = await db
            .insert(users)
            .values({
              username: tempUsername,
              phone,
              password: "",
              isVerified: true,
            })
            .returning();
          user = newUserResult[0];
        } else if (useRestAPI && supabase) {
          const newUserResult = await supabase.insert(
            "users",
            {
              username: tempUsername,
              phone,
              password: "",
              is_verified: true,
            },
            true
          );
          user = Array.isArray(newUserResult) ? newUserResult[0] : newUserResult;
        }
      }

      // Set session for authenticated user
      req.session.userId = user.id;
      req.session.phone = user.phone || undefined;

      res.json({
        success: true,
        message: "Authentication successful",
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
        },
      });
    } catch (error) {
      console.error("Error syncing Firebase auth:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      res.status(500).json({ error: "Failed to sync authentication" });
    }
  });

  // Update username
  app.post("/api/auth/update-username", async (req, res) => {
    try {
      console.log("👤 [update-username] Request received:", { body: req.body, userId: req.session.userId });
      
      const schema = z.object({
        username: z.string().min(2, "Username must be at least 2 characters"),
      });

      const { username } = schema.parse(req.body);

      // Check if user is authenticated
      if (!req.session.userId) {
        console.error("❌ [update-username] Not authenticated");
        res.status(401).json({ error: "Not authenticated" });
        return;
      }

      // Check if username is already taken
      let existingUser: any[] = [];
      
      if (db) {
        existingUser = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);
      } else if (useRestAPI && supabase) {
        const results = await supabase.select("users", {
          filter: { username: `eq.${username}` },
          limit: 1,
        });
        existingUser = results;
      }

      if (existingUser.length > 0 && existingUser[0].id !== req.session.userId) {
        console.error("❌ [update-username] Username already taken:", username);
        res.status(400).json({ error: "Username already taken" });
        return;
      }

      // Update username
      let updatedUser: any[] = [];
      
      if (db) {
        updatedUser = await db
          .update(users)
          .set({ username })
          .where(eq(users.id, req.session.userId))
          .returning();
      } else if (useRestAPI && supabase) {
        const result = await supabase.update(
          "users",
          { id: `eq.${req.session.userId}` },
          { username },
          true // Use service role key
        );
        // Supabase update returns the updated record(s)
        updatedUser = Array.isArray(result) ? result : [result];
        
        // If update doesn't return the record, fetch it
        if (updatedUser.length === 0) {
          const fetched = await supabase.select("users", {
            filter: { id: `eq.${req.session.userId}` },
            limit: 1,
          });
          updatedUser = fetched;
        }
      }

      if (updatedUser.length === 0) {
        console.error("❌ [update-username] User not found:", req.session.userId);
        res.status(404).json({ error: "User not found" });
        return;
      }

      console.log("✅ [update-username] Username updated successfully:", updatedUser[0].username);

      res.json({
        success: true,
        user: {
          id: updatedUser[0].id,
          username: updatedUser[0].username,
          phone: updatedUser[0].phone,
        },
      });
    } catch (error) {
      console.error("❌ [update-username] Error:", error);
      if (error instanceof z.ZodError) {
        console.error("❌ [update-username] Validation error:", error.errors);
        res.status(400).json({ error: error.errors[0].message });
        return;
      }
      const errorMessage = error instanceof Error ? error.message : "Failed to update username";
      console.error("❌ [update-username] Returning error:", errorMessage);
      res.status(500).json({ error: errorMessage });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    const userId = req.session?.userId;
    console.log("🚪 [logout] Request received:", { userId });

    try {
      if (!req.session) {
        console.log("ℹ️ [logout] No active session");
        res.clearCookie("connect.sid");
        res.json({ success: true });
        return;
      }

      await new Promise<void>((resolve, reject) => {
        req.session.destroy((err) => {
          if (err) {
            console.error("❌ [logout] Session destroy error:", err);
            return reject(err);
          }
          resolve();
        });
      });

      res.clearCookie("connect.sid");
      console.log("✅ [logout] Session cleared successfully");
      res.json({ success: true });
    } catch (error) {
      console.error("❌ [logout] Error:", error);
      res.status(500).json({ error: "Failed to logout" });
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
