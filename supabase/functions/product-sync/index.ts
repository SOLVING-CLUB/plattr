// Product Sync Edge Function - Syncs dishes to Odoo products
// Deploy with: supabase functions deploy product-sync --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ==================== ENVIRONMENT VARIABLES ====================
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ODOO_URL = Deno.env.get("ODOO_URL")!;
const ODOO_DB = Deno.env.get("ODOO_DB")!;
const ODOO_USERNAME = Deno.env.get("ODOO_USERNAME")!;
const ODOO_API_KEY = Deno.env.get("ODOO_API_KEY")!;

// ==================== TYPES ====================
interface Dish {
  id: string | number;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  category_id?: string | number;
  is_available?: boolean;
  is_veg?: boolean;
  is_egg?: boolean;
  spice_level?: string;
  image_url?: string;
  // Add more fields as needed
}

// ==================== ODOO CLIENT ====================
let cachedUid: number | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL = 3600000; // 1 hour

async function odooAuthenticate(): Promise<number> {
  const now = Date.now();
  if (cachedUid && cacheExpiry > now) return cachedUid;

  console.log("Authenticating with Odoo...");
  const response = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "authenticate",
        args: [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}],
      },
      id: Math.floor(Math.random() * 1000000),
    }),
  });

  const result = await response.json();
  if (result.error) throw new Error(`Odoo auth error: ${JSON.stringify(result.error)}`);

  cachedUid = result.result;
  cacheExpiry = now + CACHE_TTL;
  console.log("Odoo auth successful, uid:", cachedUid);
  return cachedUid!;
}

async function odooExecute(model: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
  const uid = await odooAuthenticate();
  const response = await fetch(`${ODOO_URL}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: [ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs],
      },
      id: Math.floor(Math.random() * 1000000),
    }),
  });

  const result = await response.json();
  if (result.error) throw new Error(`Odoo API error: ${JSON.stringify(result.error)}`);
  return result.result;
}

// ==================== PRODUCT OPERATIONS ====================
async function findProductByName(name: string): Promise<number | null> {
  const productIds = await odooExecute("product.template", "search", [[["name", "=", name]]], { limit: 1 });
  return productIds.length > 0 ? productIds[0] : null;
}

async function findProductByExternalId(externalId: string): Promise<number | null> {
  // Search by external reference if stored
  const productIds = await odooExecute("product.template", "search", [[["default_code", "=", externalId]]], { limit: 1 });
  return productIds.length > 0 ? productIds[0] : null;
}

async function createProduct(dish: Dish): Promise<number> {
  const productData: any = {
    name: dish.name,
    default_code: `PLATTR-${dish.id}`, // External reference
    type: "consu", // Consumable product (or "service" for services)
    sale_ok: true,
    purchase_ok: false,
    list_price: dish.price || 0,
  };

  // Add optional fields
  if (dish.description) {
    productData.description_sale = dish.description;
  }

  // Build internal notes with Plattr metadata
  const notes: string[] = [];
  if (dish.is_veg !== undefined) notes.push(`Veg: ${dish.is_veg ? "Yes" : "No"}`);
  if (dish.is_egg !== undefined) notes.push(`Egg: ${dish.is_egg ? "Yes" : "No"}`);
  if (dish.spice_level) notes.push(`Spice Level: ${dish.spice_level}`);
  if (dish.category) notes.push(`Category: ${dish.category}`);
  if (notes.length > 0) {
    productData.description = notes.join("\n");
  }

  // Set active status based on availability
  if (dish.is_available !== undefined) {
    productData.active = dish.is_available;
  }

  console.log("Creating Odoo product:", productData);
  const productId = await odooExecute("product.template", "create", [productData]);
  console.log("Created product:", productId);
  return productId;
}

async function updateProduct(productId: number, dish: Dish): Promise<boolean> {
  const productData: any = {
    name: dish.name,
    list_price: dish.price || 0,
  };

  // Add optional fields
  if (dish.description) {
    productData.description_sale = dish.description;
  }

  // Build internal notes with Plattr metadata
  const notes: string[] = [];
  if (dish.is_veg !== undefined) notes.push(`Veg: ${dish.is_veg ? "Yes" : "No"}`);
  if (dish.is_egg !== undefined) notes.push(`Egg: ${dish.is_egg ? "Yes" : "No"}`);
  if (dish.spice_level) notes.push(`Spice Level: ${dish.spice_level}`);
  if (dish.category) notes.push(`Category: ${dish.category}`);
  if (notes.length > 0) {
    productData.description = notes.join("\n");
  }

  // Set active status based on availability
  if (dish.is_available !== undefined) {
    productData.active = dish.is_available;
  }

  console.log("Updating Odoo product:", productId, productData);
  await odooExecute("product.template", "write", [[productId], productData]);
  console.log("Updated product:", productId);
  return true;
}

// ==================== CORS ====================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==================== MAIN HANDLER ====================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Product sync webhook received:", JSON.stringify(payload, null, 2));

    const { type, table, record, old_record } = payload;

    if (!type || !table || !record) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate this is for dishes table
    if (table !== "dishes") {
      return new Response(
        JSON.stringify({ success: true, message: `Ignoring table: ${table}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const dish = record as Dish;
    let result: any = { success: true, message: "No action taken" };

    // Check if we already have a mapping for this dish
    const externalId = `PLATTR-${dish.id}`;
    let existingProductId = await findProductByExternalId(externalId);

    if (type === "INSERT") {
      if (existingProductId) {
        // Product already exists, just update
        await updateProduct(existingProductId, dish);
        result = { success: true, productId: existingProductId, message: `Updated existing product ${existingProductId}` };
      } else {
        // Create new product
        const productId = await createProduct(dish);
        
        // Track the mapping
        await supabase.from("integration_odoo_entities").insert({
          source_table: "dishes",
          source_id: String(dish.id),
          entity_type: "product",
          odoo_id: productId,
          last_synced_at: new Date().toISOString(),
        });
        
        result = { success: true, productId, message: `Created product ${productId}` };
      }
    } else if (type === "UPDATE") {
      if (existingProductId) {
        await updateProduct(existingProductId, dish);
        result = { success: true, productId: existingProductId, message: `Updated product ${existingProductId}` };
      } else {
        // Product doesn't exist yet, create it
        const productId = await createProduct(dish);
        
        // Track the mapping
        await supabase.from("integration_odoo_entities").insert({
          source_table: "dishes",
          source_id: String(dish.id),
          entity_type: "product",
          odoo_id: productId,
          last_synced_at: new Date().toISOString(),
        });
        
        result = { success: true, productId, message: `Created product ${productId} (was missing)` };
      }
    } else if (type === "DELETE") {
      // Optionally archive the product in Odoo instead of deleting
      if (existingProductId) {
        await odooExecute("product.template", "write", [[existingProductId], { active: false }]);
        
        // Remove mapping
        await supabase.from("integration_odoo_entities")
          .delete()
          .eq("source_table", "dishes")
          .eq("source_id", String(dish.id))
          .eq("entity_type", "product");
        
        result = { success: true, productId: existingProductId, message: `Archived product ${existingProductId}` };
      }
    }

    console.log("Product sync result:", JSON.stringify(result, null, 2));
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Product sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
