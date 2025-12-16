// Product Sync Edge Function - Syncs dishes to Odoo products
// Deploy with: supabase functions deploy product-sync --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ODOO_URL = Deno.env.get("ODOO_URL")!;
const ODOO_DB = Deno.env.get("ODOO_DB")!;
const ODOO_USERNAME = Deno.env.get("ODOO_USERNAME")!;
const ODOO_API_KEY = Deno.env.get("ODOO_API_KEY")!;

// Matches your dishes table schema
interface Dish {
  id: string;
  name: string | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category_id: string | null;
  is_available: boolean | null;
  spice_level: string | null;
  dietary_type: string | null; // veg, non-veg, egg
  cuisine: string | null;
  dish_type: string | null;
  meal_type: string[] | null; // jsonb array
  least_price: number | null;
  sixty_min_price: number | null;
  is_sixty_min: boolean | null;
  snack_box_price: number | null;
}

let cachedUid: number | null = null;
let cacheExpiry: number = 0;

async function odooAuth(): Promise<number> {
  if (cachedUid && cacheExpiry > Date.now()) return cachedUid;
  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service: "common", method: "authenticate", args: [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}] },
      id: Math.random() * 1000000 | 0,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  cachedUid = data.result;
  cacheExpiry = Date.now() + 3600000;
  console.log("Odoo authenticated, uid:", cachedUid);
  return cachedUid!;
}

async function odooExec(model: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
  const uid = await odooAuth();
  const res = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service: "object", method: "execute_kw", args: [ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs] },
      id: Math.random() * 1000000 | 0,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.result;
}

async function findProduct(externalId: string): Promise<number | null> {
  const ids = await odooExec("product.template", "search", [[["default_code", "=", externalId]]], { limit: 1 });
  return ids.length > 0 ? ids[0] : null;
}

function buildProductData(dish: Dish) {
  // Build internal notes with Plattr metadata
  const notes: string[] = [];
  if (dish.dietary_type) notes.push(`Dietary: ${dish.dietary_type}`);
  if (dish.spice_level) notes.push(`Spice Level: ${dish.spice_level}`);
  if (dish.cuisine) notes.push(`Cuisine: ${dish.cuisine}`);
  if (dish.dish_type) notes.push(`Dish Type: ${dish.dish_type}`);
  if (dish.category_id) notes.push(`Category ID: ${dish.category_id}`);
  if (dish.meal_type && Array.isArray(dish.meal_type)) {
    notes.push(`Meal Types: ${dish.meal_type.join(", ")}`);
  }
  if (dish.is_sixty_min) notes.push("60-Min Delivery: Yes");
  
  // Price breakdown
  const prices: string[] = [];
  if (dish.price) prices.push(`Regular: ₹${dish.price}`);
  if (dish.least_price) prices.push(`Least: ₹${dish.least_price}`);
  if (dish.sixty_min_price) prices.push(`60-Min: ₹${dish.sixty_min_price}`);
  if (dish.snack_box_price) prices.push(`Snack Box: ₹${dish.snack_box_price}`);
  if (prices.length > 0) notes.push(`Prices: ${prices.join(", ")}`);

  return {
    name: dish.name || `Dish ${dish.id}`,
    default_code: `PLATTR-${dish.id}`,
    type: "consu", // Consumable
    sale_ok: true,
    purchase_ok: false,
    list_price: dish.price || dish.least_price || 0,
    description_sale: dish.description || "",
    description: notes.join("\n"),
    active: dish.is_available !== false,
  };
}

async function createProduct(dish: Dish): Promise<number> {
  const productData = buildProductData(dish);
  console.log("Creating product:", productData.name);
  const productId = await odooExec("product.template", "create", [productData]);
  console.log("Created product:", productId);
  return productId;
}

async function updateProduct(productId: number, dish: Dish): Promise<void> {
  const productData = buildProductData(dish);
  // Remove default_code from update (shouldn't change)
  delete (productData as any).default_code;
  delete (productData as any).type;
  delete (productData as any).sale_ok;
  delete (productData as any).purchase_ok;
  
  console.log("Updating product:", productId, productData.name);
  await odooExec("product.template", "write", [[productId], productData]);
  console.log("Updated product:", productId);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  try {
    const { type, table, record } = await req.json();
    console.log("Product sync webhook:", type, table, record?.id);

    if (!type || !record || table !== "dishes") {
      return new Response(
        JSON.stringify({ success: true, message: "Ignored - not dishes table" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const dish = record as Dish;
    const externalId = `PLATTR-${dish.id}`;
    let productId = await findProduct(externalId);

    if (type === "INSERT" || type === "UPDATE") {
      if (productId) {
        await updateProduct(productId, dish);
        
        // Update last synced timestamp
        await supabase.from("integration_odoo_entities")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("source_table", "dishes")
          .eq("source_id", dish.id);
          
        return new Response(
          JSON.stringify({ success: true, action: "updated", productId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        productId = await createProduct(dish);
        
        // Track the mapping
        await supabase.from("integration_odoo_entities").insert({
          source_table: "dishes",
          source_id: dish.id,
          entity_type: "product",
          odoo_id: productId,
          last_synced_at: new Date().toISOString(),
        });
        
        return new Response(
          JSON.stringify({ success: true, action: "created", productId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (type === "DELETE" && productId) {
      // Archive the product in Odoo (soft delete)
      await odooExec("product.template", "write", [[productId], { active: false }]);
      
      // Remove mapping
      await supabase.from("integration_odoo_entities")
        .delete()
        .eq("source_table", "dishes")
        .eq("source_id", dish.id);
      
      return new Response(
        JSON.stringify({ success: true, action: "archived", productId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "No action needed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Product sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
