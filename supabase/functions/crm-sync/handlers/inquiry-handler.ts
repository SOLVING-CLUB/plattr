/**
 * Inquiry Handler - Handles Catering and Corporate order inquiries
 * Creates Opportunities and Quotations in Odoo
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OdooClient } from "../odoo-client.ts";
import { CateringOrder, CorporateOrder, OrderLineItem } from "../types.ts";

/**
 * Handle catering order INSERT - Create Opportunity + Quotation
 */
export async function handleCateringOrder(
  record: CateringOrder,
  supabase: SupabaseClient,
  odoo: OdooClient
): Promise<{ success: boolean; opportunityId?: number; quotationId?: number; message: string }> {
  console.log("Processing catering order:", record.order_number);

  try {
    // Idempotency check - return existing if already processed
    const { data: existingOpp } = await supabase
      .from("integration_odoo_entities")
      .select("odoo_id")
      .eq("source_table", "catering_orders")
      .eq("source_id", record.id)
      .eq("entity_type", "opportunity")
      .single();

    if (existingOpp) {
      const { data: existingQuote } = await supabase
        .from("integration_odoo_entities")
        .select("odoo_id")
        .eq("source_table", "catering_orders")
        .eq("source_id", record.id)
        .eq("entity_type", "quotation")
        .single();

      console.log("Idempotency: Already processed catering order", record.order_number);
      return {
        success: true,
        opportunityId: existingOpp.odoo_id,
        quotationId: existingQuote?.odoo_id,
        message: `Already processed: opportunity ${existingOpp.odoo_id} for catering order ${record.order_number}`,
      };
    }

    // Find or get the user's lead
    let leadId: number | null = null;
    if (record.user_id) {
      const { data: userMapping } = await supabase
        .from("integration_odoo_entities")
        .select("odoo_id")
        .eq("source_table", "users")
        .eq("source_id", record.user_id)
        .eq("entity_type", "lead")
        .single();

      if (userMapping) {
        leadId = userMapping.odoo_id;
      }
    }

    // Create or find partner
    const partnerId = await odoo.findOrCreatePartner({
      name: record.name || "Catering Customer",
      phone: record.phone,
      email: record.email,
    });

    // Build description
    const description = buildCateringDescription(record);

    // Calculate expected revenue
    const expectedRevenue = record.budget_max || record.budget_min || 0;

    // Create opportunity (or convert lead if exists)
    let opportunityId: number;
    if (leadId) {
      opportunityId = await odoo.convertLeadToOpportunity(leadId);
      // Update with order details
      await odoo.updateLead(opportunityId, {
        description,
        name: `Catering: ${record.event_type} - ${record.guest_count} guests`,
      });
    } else {
      opportunityId = await odoo.createOpportunity({
        name: `Catering: ${record.event_type} - ${record.guest_count} guests`,
        phone: record.phone,
        email: record.email,
        expectedRevenue,
        description,
        partnerId,
      });
    }

    // Build order lines for quotation
    const orderLines: OrderLineItem[] = buildCateringOrderLines(record);

    // Create quotation
    const quotationId = await odoo.createQuotation({
      partnerId,
      opportunityId,
      orderLines,
      notes: record.message || description,
    });

    // Store mappings
    await supabase.from("integration_odoo_entities").insert([
      {
        source_table: "catering_orders",
        source_id: record.id,
        entity_type: "opportunity",
        odoo_id: opportunityId,
        last_synced_at: new Date().toISOString(),
      },
      {
        source_table: "catering_orders",
        source_id: record.id,
        entity_type: "quotation",
        odoo_id: quotationId,
        last_synced_at: new Date().toISOString(),
      },
    ]);

    return {
      success: true,
      opportunityId,
      quotationId,
      message: `Created opportunity ${opportunityId} and quotation ${quotationId} for catering order ${record.order_number}`,
    };
  } catch (error) {
    console.error("Error processing catering order:", error);
    return {
      success: false,
      message: `Failed to process catering order: ${error.message}`,
    };
  }
}

/**
 * Handle corporate order INSERT - Create Opportunity + Quotation
 */
export async function handleCorporateOrder(
  record: CorporateOrder,
  supabase: SupabaseClient,
  odoo: OdooClient
): Promise<{ success: boolean; opportunityId?: number; quotationId?: number; message: string }> {
  console.log("Processing corporate order:", record.order_number);

  try {
    // Idempotency check - return existing if already processed
    const { data: existingOpp } = await supabase
      .from("integration_odoo_entities")
      .select("odoo_id")
      .eq("source_table", "corporate_orders")
      .eq("source_id", record.id)
      .eq("entity_type", "opportunity")
      .single();

    if (existingOpp) {
      const { data: existingQuote } = await supabase
        .from("integration_odoo_entities")
        .select("odoo_id")
        .eq("source_table", "corporate_orders")
        .eq("source_id", record.id)
        .eq("entity_type", "quotation")
        .single();

      console.log("Idempotency: Already processed corporate order", record.order_number);
      return {
        success: true,
        opportunityId: existingOpp.odoo_id,
        quotationId: existingQuote?.odoo_id,
        message: `Already processed: opportunity ${existingOpp.odoo_id} for corporate order ${record.order_number}`,
      };
    }

    // Find or get the user's lead
    let leadId: number | null = null;
    if (record.user_id) {
      const { data: userMapping } = await supabase
        .from("integration_odoo_entities")
        .select("odoo_id")
        .eq("source_table", "users")
        .eq("source_id", record.user_id)
        .eq("entity_type", "lead")
        .single();

      if (userMapping) {
        leadId = userMapping.odoo_id;
      }
    }

    // Create or find partner (company)
    const partnerId = await odoo.findOrCreatePartner({
      name: record.company_name,
      phone: record.phone,
      email: record.email,
      isCompany: true,
    });

    // Build description
    const description = buildCorporateDescription(record);

    // Calculate expected revenue
    const expectedRevenue = record.budget_max || record.budget_min || 0;

    // Create opportunity (or convert lead if exists)
    let opportunityId: number;
    if (leadId) {
      opportunityId = await odoo.convertLeadToOpportunity(leadId);
      await odoo.updateLead(opportunityId, {
        description,
        name: `Corporate: ${record.company_name} - ${record.number_of_people} people`,
      });
    } else {
      opportunityId = await odoo.createOpportunity({
        name: `Corporate: ${record.company_name} - ${record.number_of_people} people`,
        phone: record.phone,
        email: record.email,
        expectedRevenue,
        description,
        partnerId,
      });
    }

    // Build order lines for quotation
    const orderLines: OrderLineItem[] = buildCorporateOrderLines(record);

    // Create quotation
    const quotationId = await odoo.createQuotation({
      partnerId,
      opportunityId,
      orderLines,
      notes: record.message || description,
    });

    // Store mappings
    await supabase.from("integration_odoo_entities").insert([
      {
        source_table: "corporate_orders",
        source_id: record.id,
        entity_type: "opportunity",
        odoo_id: opportunityId,
        last_synced_at: new Date().toISOString(),
      },
      {
        source_table: "corporate_orders",
        source_id: record.id,
        entity_type: "quotation",
        odoo_id: quotationId,
        last_synced_at: new Date().toISOString(),
      },
    ]);

    return {
      success: true,
      opportunityId,
      quotationId,
      message: `Created opportunity ${opportunityId} and quotation ${quotationId} for corporate order ${record.order_number}`,
    };
  } catch (error) {
    console.error("Error processing corporate order:", error);
    return {
      success: false,
      message: `Failed to process corporate order: ${error.message}`,
    };
  }
}

// ==================== Helper Functions ====================

function buildCateringDescription(record: CateringOrder): string {
  const lines = [
    `Order #${record.order_number}`,
    `Event Type: ${record.event_type}`,
    `Guest Count: ${record.guest_count}`,
    `Event Date: ${record.event_date}`,
    record.event_time ? `Event Time: ${record.event_time}` : null,
    record.veg_count ? `Veg Count: ${record.veg_count}` : null,
    record.non_veg_count ? `Non-Veg Count: ${record.non_veg_count}` : null,
    record.egg_count ? `Egg Count: ${record.egg_count}` : null,
    record.cuisines ? `Cuisines: ${record.cuisines}` : null,
    record.cuisine_preferences ? `Cuisine Preferences: ${record.cuisine_preferences}` : null,
    record.meal_times ? `Meal Times: ${record.meal_times}` : null,
    record.dietary_types ? `Dietary Types: ${record.dietary_types}` : null,
    record.budget_min || record.budget_max
      ? `Budget: ₹${record.budget_min || 0} - ₹${record.budget_max || 0}`
      : null,
    record.add_on_ids ? `Add-ons: ${record.add_on_ids}` : null,
    record.message ? `\nMessage: ${record.message}` : null,
  ];

  return lines.filter(Boolean).join("\n");
}

function buildCorporateDescription(record: CorporateOrder): string {
  const lines = [
    `Order #${record.order_number}`,
    `Company: ${record.company_name}`,
    `Contact Person: ${record.contact_person}`,
    `Number of People: ${record.number_of_people}`,
    `Event Type: ${record.event_type}`,
    `Event Date: ${record.event_date}`,
    record.event_time ? `Event Time: ${record.event_time}` : null,
    record.veg_count ? `Veg Count: ${record.veg_count}` : null,
    record.non_veg_count ? `Non-Veg Count: ${record.non_veg_count}` : null,
    record.egg_count ? `Egg Count: ${record.egg_count}` : null,
    record.budget_min || record.budget_max
      ? `Budget: ₹${record.budget_min || 0} - ₹${record.budget_max || 0}`
      : null,
    record.additional_services ? `Additional Services: ${record.additional_services}` : null,
    record.message ? `\nMessage: ${record.message}` : null,
  ];

  return lines.filter(Boolean).join("\n");
}

function buildCateringOrderLines(record: CateringOrder): OrderLineItem[] {
  const lines: OrderLineItem[] = [];

  // Add main catering service line
  const avgBudget = ((record.budget_min || 0) + (record.budget_max || 0)) / 2;
  const perPersonCost = record.guest_count > 0 ? avgBudget / record.guest_count : 0;

  if (record.veg_count && record.veg_count > 0) {
    lines.push({
      name: `Vegetarian Meals - ${record.event_type}`,
      quantity: record.veg_count,
      priceUnit: perPersonCost || 500, // Default price if budget not set
    });
  }

  if (record.non_veg_count && record.non_veg_count > 0) {
    lines.push({
      name: `Non-Vegetarian Meals - ${record.event_type}`,
      quantity: record.non_veg_count,
      priceUnit: perPersonCost || 600,
    });
  }

  if (record.egg_count && record.egg_count > 0) {
    lines.push({
      name: `Egg Meals - ${record.event_type}`,
      quantity: record.egg_count,
      priceUnit: perPersonCost || 550,
    });
  }

  // If no specific counts, add a general line
  if (lines.length === 0) {
    lines.push({
      name: `Catering Service - ${record.event_type} (${record.guest_count} guests)`,
      quantity: 1,
      priceUnit: avgBudget || record.guest_count * 500,
    });
  }

  return lines;
}

function buildCorporateOrderLines(record: CorporateOrder): OrderLineItem[] {
  const lines: OrderLineItem[] = [];

  const avgBudget = ((record.budget_min || 0) + (record.budget_max || 0)) / 2;
  const perPersonCost = record.number_of_people > 0 ? avgBudget / record.number_of_people : 0;

  if (record.veg_count && record.veg_count > 0) {
    lines.push({
      name: `Corporate Vegetarian Meals - ${record.event_type}`,
      quantity: record.veg_count,
      priceUnit: perPersonCost || 400,
    });
  }

  if (record.non_veg_count && record.non_veg_count > 0) {
    lines.push({
      name: `Corporate Non-Vegetarian Meals - ${record.event_type}`,
      quantity: record.non_veg_count,
      priceUnit: perPersonCost || 500,
    });
  }

  if (record.egg_count && record.egg_count > 0) {
    lines.push({
      name: `Corporate Egg Meals - ${record.event_type}`,
      quantity: record.egg_count,
      priceUnit: perPersonCost || 450,
    });
  }

  // If no specific counts, add a general line
  if (lines.length === 0) {
    lines.push({
      name: `Corporate Catering - ${record.event_type} (${record.number_of_people} people)`,
      quantity: 1,
      priceUnit: avgBudget || record.number_of_people * 400,
    });
  }

  return lines;
}
