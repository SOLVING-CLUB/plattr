/**
 * Supabase Edge Function: Razorpay Payment Gateway
 * 
 * Handles:
 * - GET /razorpay/key - Returns Razorpay public key ID
 * - POST /razorpay/create-order - Creates a Razorpay order
 * - POST /razorpay/verify - Verifies payment signature
 * 
 * Environment variables needed:
 * - RAZORPAY_KEY_ID: Your Razorpay Key ID (public)
 * - RAZORPAY_KEY_SECRET: Your Razorpay Key Secret (private)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  try {
    // GET /razorpay or /razorpay/key - Return public key ID
    if (req.method === "GET" || path === "key") {
      if (!RAZORPAY_KEY_ID) {
        return new Response(
          JSON.stringify({ error: "Razorpay is not configured. Please set RAZORPAY_KEY_ID secret." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ keyId: RAZORPAY_KEY_ID }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /razorpay/create-order - Create a Razorpay order
    if (req.method === "POST" && (path === "create-order" || path === "razorpay")) {
      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        return new Response(
          JSON.stringify({ error: "Razorpay credentials not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();
      const { amount, currency = "INR", receipt, notes } = body;

      if (!amount) {
        return new Response(
          JSON.stringify({ error: "Amount is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create order via Razorpay API
      const authHeader = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
      
      const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to paise
          currency,
          receipt: receipt || `order_${Date.now()}`,
          notes: notes || {},
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        console.error("[Razorpay] Order creation failed:", error);
        return new Response(
          JSON.stringify({ error: error.error?.description || "Failed to create order" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const order = await orderResponse.json();
      console.log("[Razorpay] Order created:", order.id);

      return new Response(
        JSON.stringify({
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /razorpay/create-payment-link - Create a Razorpay Payment Link
    if (req.method === "POST" && path === "create-payment-link") {
      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        return new Response(
          JSON.stringify({ error: "Razorpay credentials not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();
      const { amount, currency = "INR", description, order_id, method, callback_url, callback_method = "get" } = body;

      if (!amount) {
        return new Response(
          JSON.stringify({ error: "Amount is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create payment link via Razorpay API
      const authHeader = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
      
      const paymentLinkData: any = {
        amount: Math.round(amount), // Already in paise
        currency,
        description: description || "Order Payment",
        callback_url: callback_url || `${Deno.env.get("SITE_URL") || "https://plattr.in"}/payment-callback`,
        callback_method,
        notes: {
          order_id: order_id || `order_${Date.now()}`,
        },
      };

      // Add payment method restrictions if specified
      if (method) {
        paymentLinkData.options = {
          checkout: {
            method: {
              [method]: 1, // Enable only selected method
            },
          },
        };
      }

      const linkResponse = await fetch("https://api.razorpay.com/v1/payment_links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${authHeader}`,
        },
        body: JSON.stringify(paymentLinkData),
      });

      if (!linkResponse.ok) {
        const error = await linkResponse.json();
        console.error("[Razorpay] Payment link creation failed:", error);
        return new Response(
          JSON.stringify({ error: error.error?.description || "Failed to create payment link" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const paymentLink = await linkResponse.json();
      console.log("[Razorpay] Payment link created:", paymentLink.id);

      return new Response(
        JSON.stringify({
          paymentLinkId: paymentLink.id,
          paymentLinkUrl: paymentLink.short_url || paymentLink.url,
          amount: paymentLink.amount,
          currency: paymentLink.currency,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /razorpay/verify - Verify payment signature
    if (req.method === "POST" && path === "verify") {
      if (!RAZORPAY_KEY_SECRET) {
        return new Response(
          JSON.stringify({ error: "Razorpay secret not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify signature
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const hmac = createHmac("sha256", RAZORPAY_KEY_SECRET);
      hmac.update(text);
      const generatedSignature = hmac.digest("hex");

      const isValid = generatedSignature === razorpay_signature;

      if (!isValid) {
        console.error("[Razorpay] Invalid signature");
        return new Response(
          JSON.stringify({ verified: false, error: "Invalid signature" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[Razorpay] Payment verified:", razorpay_payment_id);

      return new Response(
        JSON.stringify({
          verified: true,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /razorpay/payment-link-status - Get payment link status
    if (req.method === "GET" && path === "payment-link-status") {
      if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        return new Response(
          JSON.stringify({ error: "Razorpay credentials not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const url = new URL(req.url);
      const paymentLinkId = url.searchParams.get("payment_link_id");

      if (!paymentLinkId) {
        return new Response(
          JSON.stringify({ error: "payment_link_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const authHeader = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
      
      const linkResponse = await fetch(`https://api.razorpay.com/v1/payment_links/${paymentLinkId}`, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${authHeader}`,
        },
      });

      if (!linkResponse.ok) {
        const error = await linkResponse.json();
        console.error("[Razorpay] Payment link fetch failed:", error);
        return new Response(
          JSON.stringify({ error: error.error?.description || "Failed to fetch payment link" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const paymentLink = await linkResponse.json();
      console.log("[Razorpay] Payment link status:", paymentLink.status);

      return new Response(
        JSON.stringify({
          paymentLinkId: paymentLink.id,
          status: paymentLink.status,
          amount: paymentLink.amount,
          currency: paymentLink.currency,
          payments: paymentLink.payments || [],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[Razorpay] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
