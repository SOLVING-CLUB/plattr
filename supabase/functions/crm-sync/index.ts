import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OdooClient } from "./odoo-client.ts";
import {
  handleUserInsert,
  handleUserUpdate,
} from "./handlers/user-handler.ts";
import {
  handleCateringOrder,
  handleCorporateOrder,
} from "./handlers/inquiry-handler.ts";
import {
  handleBulkMealOrder,
  handleMealboxOrder,
  handleSixtyMinBulkOrder,
  handleSixtyMinMealboxOrder,
} from "./handlers/order-handler.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Webhook received:", JSON.stringify(payload, null, 2));

    const { type, table, record, old_record } = payload;

    if (!type || !table || !record) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const odoo = new OdooClient();

    let result: any = { success: true, message: "No action taken" };

    switch (table) {
      case "users":
        if (type === "INSERT") {
          result = await handleUserInsert(record, supabase, odoo);
        } else if (type === "UPDATE") {
          result = await handleUserUpdate(record, old_record, supabase, odoo);
        }
        break;

      case "catering_orders":
        if (type === "INSERT") {
          result = await handleCateringOrder(record, supabase, odoo);
        }
        break;

      case "corporate_orders":
        if (type === "INSERT") {
          result = await handleCorporateOrder(record, supabase, odoo);
        }
        break;

      case "bulk_meal_orders":
        if (type === "INSERT") {
          result = await handleBulkMealOrder(record, supabase, odoo);
        }
        break;

      case "mealbox_orders":
        if (type === "INSERT") {
          result = await handleMealboxOrder(record, supabase, odoo);
        }
        break;

      case "sixty_min_bulk_orders":
        if (type === "INSERT") {
          result = await handleSixtyMinBulkOrder(record, supabase, odoo);
        }
        break;

      case "sixty_min_mealbox_orders":
        if (type === "INSERT") {
          result = await handleSixtyMinMealboxOrder(record, supabase, odoo);
        }
        break;

      default:
        console.log(`Unhandled table: ${table}`);
        result = { success: true, message: `No handler for table: ${table}` };
    }

    console.log("Handler result:", JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
