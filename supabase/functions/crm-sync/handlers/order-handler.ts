/**
 * Order Handler - Handles Bulk Meal and Mealbox orders
 * Status-based logic:
 * - pending: Create Opportunity + Quotation (needs clarification)
 * - paid: Create Sales Order + Invoice
 * - failed: Log but no action
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OdooClient } from "../odoo-client.ts";
import { BulkMealOrder, MealboxOrder, OrderLineItem } from "../types.ts";

interface OrderResult {
  success: boolean;
  opportunityId?: number;
  quotationId?: number;
  salesOrderId?: number;
  invoiceId?: number;
  message: string;
}

// ==================== BULK MEAL ORDERS ====================

export async function handleBulkMealOrder(
  record: BulkMealOrder,
  supabase: SupabaseClient,
  odoo: OdooClient
): Promise<OrderResult> {
  console.log(`Processing bulk meal order #${record.order_number}, status: ${record.status}`);

  if (record.status === "failed") {
    return { success: true, message: "Payment failed, no Odoo action taken" };
  }

  try {
    // Get user info for partner creation
    const { data: user } = await supabase
      .from("users")
      .select("username, email, phone")
      .eq("id", record.user_id)
      .single();

    const partnerId = await odoo.findOrCreatePartner({
      name: user?.username || `Bulk Order Customer #${record.order_number}`,
      phone: user?.phone,
      email: user?.email,
    });

    // Parse items JSON
    const items = parseItems(record.items);
    const orderLines = buildBulkMealOrderLines(record, items);
    const description = buildBulkMealDescription(record, items);

    if (record.status === "pending") {
      // Needs clarification - Create Opportunity + Quotation
      return await createOpportunityAndQuotation(
        supabase,
        odoo,
        {
          sourceTable: "bulk_meal_orders",
          sourceId: record.id,
          userId: record.user_id,
          orderNumber: record.order_number,
          partnerId,
          name: `Bulk Meal Order #${record.order_number}`,
          description,
          expectedRevenue: record.total,
          orderLines,
        }
      );
    } else if (record.status === "paid") {
      // Payment done - Create Sales Order + Invoice
      return await createSalesOrderAndInvoice(
        supabase,
        odoo,
        {
          sourceTable: "bulk_meal_orders",
          sourceId: record.id,
          orderNumber: record.order_number,
          partnerId,
          orderLines,
          notes: description,
        }
      );
    }

    return { success: true, message: `Unknown status: ${record.status}` };
  } catch (error) {
    console.error("Error processing bulk meal order:", error);
    return { success: false, message: `Failed: ${error.message}` };
  }
}

export async function handleSixtyMinBulkOrder(
  record: BulkMealOrder,
  supabase: SupabaseClient,
  odoo: OdooClient
): Promise<OrderResult> {
  // Same logic as regular bulk orders
  console.log(`Processing 60-min bulk meal order #${record.order_number}`);
  return handleBulkMealOrderInternal(record, supabase, odoo, "sixty_min_bulk_orders");
}

// ==================== MEALBOX ORDERS ====================

export async function handleMealboxOrder(
  record: MealboxOrder,
  supabase: SupabaseClient,
  odoo: OdooClient
): Promise<OrderResult> {
  console.log(`Processing mealbox order #${record.order_number}, status: ${record.status}`);

  if (record.status === "failed") {
    return { success: true, message: "Payment failed, no Odoo action taken" };
  }

  try {
    // Get user info for partner creation
    const { data: user } = await supabase
      .from("users")
      .select("username, email, phone")
      .eq("id", record.user_id)
      .single();

    const partnerId = await odoo.findOrCreatePartner({
      name: user?.username || `Mealbox Customer #${record.order_number}`,
      phone: user?.phone,
      email: user?.email,
    });

    const orderLines = buildMealboxOrderLines(record);
    const description = buildMealboxDescription(record);

    if (record.status === "pending") {
      // Needs clarification - Create Opportunity + Quotation
      return await createOpportunityAndQuotation(
        supabase,
        odoo,
        {
          sourceTable: "mealbox_orders",
          sourceId: record.id,
          userId: record.user_id,
          orderNumber: record.order_number,
          partnerId,
          name: `Mealbox Order #${record.order_number}`,
          description,
          expectedRevenue: record.total,
          orderLines,
        }
      );
    } else if (record.status === "paid") {
      // Payment done - Create Sales Order + Invoice
      return await createSalesOrderAndInvoice(
        supabase,
        odoo,
        {
          sourceTable: "mealbox_orders",
          sourceId: record.id,
          orderNumber: record.order_number,
          partnerId,
          orderLines,
          notes: description,
        }
      );
    }

    return { success: true, message: `Unknown status: ${record.status}` };
  } catch (error) {
    console.error("Error processing mealbox order:", error);
    return { success: false, message: `Failed: ${error.message}` };
  }
}

export async function handleSixtyMinMealboxOrder(
  record: MealboxOrder,
  supabase: SupabaseClient,
  odoo: OdooClient
): Promise<OrderResult> {
  // Same logic as regular mealbox orders
  console.log(`Processing 60-min mealbox order #${record.order_number}`);
  return handleMealboxOrderInternal(record, supabase, odoo, "sixty_min_mealbox_orders");
}

// ==================== INTERNAL HELPERS ====================

async function handleBulkMealOrderInternal(
  record: BulkMealOrder,
  supabase: SupabaseClient,
  odoo: OdooClient,
  sourceTable: string
): Promise<OrderResult> {
  if (record.status === "failed") {
    return { success: true, message: "Payment failed, no Odoo action taken" };
  }

  try {
    const { data: user } = await supabase
      .from("users")
      .select("username, email, phone")
      .eq("id", record.user_id)
      .single();

    const partnerId = await odoo.findOrCreatePartner({
      name: user?.username || `Bulk Order Customer #${record.order_number}`,
      phone: user?.phone,
      email: user?.email,
    });

    const items = parseItems(record.items);
    const orderLines = buildBulkMealOrderLines(record, items);
    const description = buildBulkMealDescription(record, items);

    if (record.status === "pending") {
      return await createOpportunityAndQuotation(supabase, odoo, {
        sourceTable,
        sourceId: record.id,
        userId: record.user_id,
        orderNumber: record.order_number,
        partnerId,
        name: `60-Min Bulk Meal Order #${record.order_number}`,
        description,
        expectedRevenue: record.total,
        orderLines,
      });
    } else if (record.status === "paid") {
      return await createSalesOrderAndInvoice(supabase, odoo, {
        sourceTable,
        sourceId: record.id,
        orderNumber: record.order_number,
        partnerId,
        orderLines,
        notes: description,
      });
    }

    return { success: true, message: `Unknown status: ${record.status}` };
  } catch (error) {
    console.error("Error processing bulk meal order:", error);
    return { success: false, message: `Failed: ${error.message}` };
  }
}

async function handleMealboxOrderInternal(
  record: MealboxOrder,
  supabase: SupabaseClient,
  odoo: OdooClient,
  sourceTable: string
): Promise<OrderResult> {
  if (record.status === "failed") {
    return { success: true, message: "Payment failed, no Odoo action taken" };
  }

  try {
    const { data: user } = await supabase
      .from("users")
      .select("username, email, phone")
      .eq("id", record.user_id)
      .single();

    const partnerId = await odoo.findOrCreatePartner({
      name: user?.username || `Mealbox Customer #${record.order_number}`,
      phone: user?.phone,
      email: user?.email,
    });

    const orderLines = buildMealboxOrderLines(record);
    const description = buildMealboxDescription(record);

    if (record.status === "pending") {
      return await createOpportunityAndQuotation(supabase, odoo, {
        sourceTable,
        sourceId: record.id,
        userId: record.user_id,
        orderNumber: record.order_number,
        partnerId,
        name: `60-Min Mealbox Order #${record.order_number}`,
        description,
        expectedRevenue: record.total,
        orderLines,
      });
    } else if (record.status === "paid") {
      return await createSalesOrderAndInvoice(supabase, odoo, {
        sourceTable,
        sourceId: record.id,
        orderNumber: record.order_number,
        partnerId,
        orderLines,
        notes: description,
      });
    }

    return { success: true, message: `Unknown status: ${record.status}` };
  } catch (error) {
    console.error("Error processing mealbox order:", error);
    return { success: false, message: `Failed: ${error.message}` };
  }
}

// ==================== COMMON OPERATIONS ====================

async function createOpportunityAndQuotation(
  supabase: SupabaseClient,
  odoo: OdooClient,
  params: {
    sourceTable: string;
    sourceId: string;
    userId: string;
    orderNumber: number;
    partnerId: number;
    name: string;
    description: string;
    expectedRevenue: number;
    orderLines: OrderLineItem[];
  }
): Promise<OrderResult> {
  // Check if user has an existing lead to convert
  let opportunityId: number;
  const { data: userMapping } = await supabase
    .from("integration_odoo_entities")
    .select("odoo_id")
    .eq("source_table", "users")
    .eq("source_id", params.userId)
    .eq("entity_type", "lead")
    .single();

  if (userMapping) {
    opportunityId = await odoo.convertLeadToOpportunity(userMapping.odoo_id);
    await odoo.updateLead(opportunityId, {
      description: params.description,
      name: params.name,
    });
  } else {
    opportunityId = await odoo.createOpportunity({
      name: params.name,
      expectedRevenue: params.expectedRevenue,
      description: params.description,
      partnerId: params.partnerId,
    });
  }

  // Create quotation
  const quotationId = await odoo.createQuotation({
    partnerId: params.partnerId,
    opportunityId,
    orderLines: params.orderLines,
    notes: params.description,
  });

  // Store mappings
  await supabase.from("integration_odoo_entities").insert([
    {
      source_table: params.sourceTable,
      source_id: params.sourceId,
      entity_type: "opportunity",
      odoo_id: opportunityId,
      last_synced_at: new Date().toISOString(),
    },
    {
      source_table: params.sourceTable,
      source_id: params.sourceId,
      entity_type: "quotation",
      odoo_id: quotationId,
      last_synced_at: new Date().toISOString(),
    },
  ]);

  return {
    success: true,
    opportunityId,
    quotationId,
    message: `Created opportunity ${opportunityId} and quotation ${quotationId} for order #${params.orderNumber}`,
  };
}

async function createSalesOrderAndInvoice(
  supabase: SupabaseClient,
  odoo: OdooClient,
  params: {
    sourceTable: string;
    sourceId: string;
    orderNumber: number;
    partnerId: number;
    orderLines: OrderLineItem[];
    notes: string;
  }
): Promise<OrderResult> {
  // Create quotation/sales order
  const salesOrderId = await odoo.createQuotation({
    partnerId: params.partnerId,
    orderLines: params.orderLines,
    notes: params.notes,
  });

  // Confirm the sales order
  await odoo.confirmSalesOrder(salesOrderId);

  // Create invoice
  const invoiceId = await odoo.createInvoiceFromSalesOrder(salesOrderId);

  // Post invoice if created
  if (invoiceId) {
    try {
      await odoo.postInvoice(invoiceId);
    } catch (e) {
      console.log("Could not post invoice automatically:", e);
    }
  }

  // Store mappings
  const mappings: any[] = [
    {
      source_table: params.sourceTable,
      source_id: params.sourceId,
      entity_type: "sales_order",
      odoo_id: salesOrderId,
      last_synced_at: new Date().toISOString(),
    },
  ];

  if (invoiceId) {
    mappings.push({
      source_table: params.sourceTable,
      source_id: params.sourceId,
      entity_type: "invoice",
      odoo_id: invoiceId,
      last_synced_at: new Date().toISOString(),
    });
  }

  await supabase.from("integration_odoo_entities").insert(mappings);

  return {
    success: true,
    salesOrderId,
    invoiceId: invoiceId || undefined,
    message: `Created sales order ${salesOrderId}${invoiceId ? ` and invoice ${invoiceId}` : ""} for order #${params.orderNumber}`,
  };
}

// ==================== HELPER FUNCTIONS ====================

function parseItems(itemsJson: string): any[] {
  try {
    return JSON.parse(itemsJson);
  } catch {
    return [];
  }
}

function buildBulkMealOrderLines(record: BulkMealOrder, items: any[]): OrderLineItem[] {
  const lines: OrderLineItem[] = [];

  // Add individual dish items
  for (const item of items) {
    lines.push({
      name: item.name || item.dish_name || "Menu Item",
      quantity: item.quantity || 1,
      priceUnit: item.price || item.pricePerServing || 0,
    });
  }

  // Add fees as separate lines
  if (record.gst > 0) {
    lines.push({
      name: "GST (5%)",
      quantity: 1,
      priceUnit: Number(record.gst),
    });
  }

  if (record.platform_fee > 0) {
    lines.push({
      name: "Platform Fee",
      quantity: 1,
      priceUnit: Number(record.platform_fee),
    });
  }

  if (record.packaging_fee > 0) {
    lines.push({
      name: "Packaging Fee",
      quantity: 1,
      priceUnit: Number(record.packaging_fee),
    });
  }

  return lines;
}

function buildMealboxOrderLines(record: MealboxOrder): OrderLineItem[] {
  const lines: OrderLineItem[] = [];

  // Parse plate selections
  const vegSelections = parseItems(record.veg_plate_selections || "[]");
  const eggSelections = parseItems(record.egg_plate_selections || "[]");
  const nonVegSelections = parseItems(record.non_veg_plate_selections || "[]");

  // Add veg boxes
  if (record.veg_boxes > 0) {
    const vegItems = vegSelections.map((s: any) => s.item?.name || s.name || "Veg Item").join(", ");
    lines.push({
      name: `Veg Mealbox (${record.portions}) - ${vegItems || "Standard"}`,
      quantity: record.veg_boxes,
      priceUnit: vegSelections.reduce((sum: number, s: any) => sum + (s.item?.price || 0), 0) || 200,
    });
  }

  // Add egg boxes
  if (record.egg_boxes > 0) {
    const eggItems = eggSelections.map((s: any) => s.item?.name || s.name || "Egg Item").join(", ");
    lines.push({
      name: `Egg Mealbox (${record.portions}) - ${eggItems || "Standard"}`,
      quantity: record.egg_boxes,
      priceUnit: eggSelections.reduce((sum: number, s: any) => sum + (s.item?.price || 0), 0) || 220,
    });
  }

  // Add non-veg boxes
  if (record.non_veg_boxes > 0) {
    const nonVegItems = nonVegSelections.map((s: any) => s.item?.name || s.name || "Non-Veg Item").join(", ");
    lines.push({
      name: `Non-Veg Mealbox (${record.portions}) - ${nonVegItems || "Standard"}`,
      quantity: record.non_veg_boxes,
      priceUnit: nonVegSelections.reduce((sum: number, s: any) => sum + (s.item?.price || 0), 0) || 250,
    });
  }

  // Add fees
  if (record.delivery_fee > 0) {
    lines.push({
      name: "Delivery Fee",
      quantity: 1,
      priceUnit: Number(record.delivery_fee),
    });
  }

  if (record.tax > 0) {
    lines.push({
      name: "GST (5%)",
      quantity: 1,
      priceUnit: Number(record.tax),
    });
  }

  return lines;
}

function buildBulkMealDescription(record: BulkMealOrder, items: any[]): string {
  const itemsList = items.map((i: any) => `- ${i.name || "Item"} x${i.quantity || 1} @ ₹${i.price || 0}`).join("\n");

  return [
    `Order #${record.order_number}`,
    `\nItems:\n${itemsList || "No items parsed"}`,
    `\nSubtotal: ₹${record.subtotal}`,
    `GST: ₹${record.gst}`,
    `Platform Fee: ₹${record.platform_fee}`,
    `Packaging Fee: ₹${record.packaging_fee}`,
    `Total: ₹${record.total}`,
    record.delivery_date ? `\nDelivery Date: ${record.delivery_date}` : null,
    record.delivery_time ? `Delivery Time: ${record.delivery_time}` : null,
    record.selected_addons ? `\nAdd-ons: ${record.selected_addons}` : null,
  ].filter(Boolean).join("\n");
}

function buildMealboxDescription(record: MealboxOrder): string {
  return [
    `Order #${record.order_number}`,
    `Portions: ${record.portions}`,
    `Meal Preference: ${record.meal_preference}`,
    record.selected_meal_type ? `Meal Type: ${record.selected_meal_type}` : null,
    `\nVeg Boxes: ${record.veg_boxes}`,
    `Egg Boxes: ${record.egg_boxes}`,
    `Non-Veg Boxes: ${record.non_veg_boxes}`,
    `\nSubtotal: ₹${record.subtotal}`,
    `Delivery Fee: ₹${record.delivery_fee}`,
    `Tax: ₹${record.tax}`,
    `Total: ₹${record.total}`,
    record.delivery_date ? `\nDelivery Date: ${record.delivery_date}` : null,
    record.delivery_time ? `Delivery Time: ${record.delivery_time}` : null,
    record.selected_addons ? `\nAdd-ons: ${record.selected_addons}` : null,
  ].filter(Boolean).join("\n");
}
