/**
 * User Handler - Creates/Updates Leads in Odoo when users are created/updated
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { OdooClient } from "../odoo-client.ts";
import { User } from "../types.ts";

/**
 * Handle user INSERT - Create a new Lead in Odoo
 */
export async function handleUserInsert(
  record: User,
  supabase: SupabaseClient,
  odoo: OdooClient
): Promise<{ success: boolean; leadId?: number; message: string }> {
  console.log("Processing user INSERT:", record.id);

  try {
    // Idempotency check - return existing if already processed
    const { data: existingLead } = await supabase
      .from("integration_odoo_entities")
      .select("odoo_id")
      .eq("source_table", "users")
      .eq("source_id", record.id)
      .eq("entity_type", "lead")
      .single();

    if (existingLead) {
      console.log("Idempotency: Lead already exists for user", record.id);
      return {
        success: true,
        leadId: existingLead.odoo_id,
        message: `Already processed: lead ${existingLead.odoo_id} for user ${record.id}`,
      };
    }

    // Create lead in Odoo
    const leadName = record.username || record.phone || record.email || "New User";
    const leadId = await odoo.createLead({
      name: `Plattr User: ${leadName}`,
      phone: record.phone,
      email: record.email,
      description: `New user registered on Plattr.\nUsername: ${record.username}\nVerified: ${record.is_verified}`,
      source: "Plattr App",
    });

    // Store the mapping in integration_odoo_entities
    await supabase.from("integration_odoo_entities").insert({
      source_table: "users",
      source_id: record.id,
      entity_type: "lead",
      odoo_id: leadId,
      last_synced_at: new Date().toISOString(),
    });

    return {
      success: true,
      leadId,
      message: `Created lead ${leadId} for user ${record.id}`,
    };
  } catch (error) {
    console.error("Error creating lead for user:", error);
    return {
      success: false,
      message: `Failed to create lead: ${error.message}`,
    };
  }
}

/**
 * Handle user UPDATE - Update the corresponding Lead in Odoo
 */
export async function handleUserUpdate(
  record: User,
  oldRecord: User,
  supabase: SupabaseClient,
  odoo: OdooClient
): Promise<{ success: boolean; message: string }> {
  console.log("Processing user UPDATE:", record.id);

  try {
    // Find the existing Odoo lead ID from our mapping table
    const { data: mapping, error } = await supabase
      .from("integration_odoo_entities")
      .select("odoo_id")
      .eq("source_table", "users")
      .eq("source_id", record.id)
      .eq("entity_type", "lead")
      .single();

    if (error || !mapping) {
      // No existing lead, create one
      console.log("No existing lead found, creating new one");
      return await handleUserInsert(record, supabase, odoo);
    }

    // Check what changed
    const changes: any = {};
    if (record.phone !== oldRecord?.phone) changes.phone = record.phone;
    if (record.email !== oldRecord?.email) changes.email = record.email;
    if (record.username !== oldRecord?.username) {
      changes.name = `Plattr User: ${record.username}`;
    }

    if (Object.keys(changes).length === 0) {
      return { success: true, message: "No relevant changes to sync" };
    }

    // Update lead in Odoo
    await odoo.updateLead(mapping.odoo_id, changes);

    // Update last_synced_at
    await supabase
      .from("integration_odoo_entities")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("source_table", "users")
      .eq("source_id", record.id);

    return {
      success: true,
      message: `Updated lead ${mapping.odoo_id} for user ${record.id}`,
    };
  } catch (error) {
    console.error("Error updating lead for user:", error);
    return {
      success: false,
      message: `Failed to update lead: ${error.message}`,
    };
  }
}
