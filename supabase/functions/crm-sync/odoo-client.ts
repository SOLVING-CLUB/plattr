/**
 * Odoo API Client using JSON-RPC
 * Handles authentication caching and CRUD operations for CRM and Sales
 */

const ODOO_URL = Deno.env.get("ODOO_URL")!;
const ODOO_DB = Deno.env.get("ODOO_DB")!;
const ODOO_USERNAME = Deno.env.get("ODOO_USERNAME")!;
const ODOO_API_KEY = Deno.env.get("ODOO_API_KEY")!;

let cachedUid: number | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL = 3600000; // 1 hour

export class OdooClient {
  private async authenticate(): Promise<number> {
    const now = Date.now();
    if (cachedUid && cacheExpiry > now) {
      return cachedUid;
    }

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
    if (result.error) {
      throw new Error(`Odoo auth error: ${result.error.message || JSON.stringify(result.error)}`);
    }

    cachedUid = result.result;
    cacheExpiry = now + CACHE_TTL;
    console.log("Odoo authentication successful, uid:", cachedUid);
    return cachedUid!;
  }

  private async execute(
    model: string,
    method: string,
    args: any[] = [],
    kwargs: any = {}
  ): Promise<any> {
    const uid = await this.authenticate();

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
    if (result.error) {
      throw new Error(`Odoo API error: ${result.error.message || JSON.stringify(result.error)}`);
    }

    return result.result;
  }

  // ==================== LEAD OPERATIONS ====================

  async createLead(data: {
    name: string;
    phone?: string;
    email?: string;
    description?: string;
    source?: string;
  }): Promise<number> {
    console.log("Creating Odoo lead:", data);

    const leadId = await this.execute("crm.lead", "create", [
      {
        name: data.name || "New Lead from Plattr",
        phone: data.phone || false,
        email_from: data.email || false,
        description: data.description || false,
        type: "lead",
        // You can add a source/medium if configured in Odoo
        // source_id: data.source ? await this.getSourceId(data.source) : false,
      },
    ]);

    console.log("Created lead with ID:", leadId);
    return leadId;
  }

  async updateLead(
    leadId: number,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      description?: string;
    }
  ): Promise<boolean> {
    console.log("Updating Odoo lead:", leadId, data);

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.phone) updateData.phone = data.phone;
    if (data.email) updateData.email_from = data.email;
    if (data.description) updateData.description = data.description;

    await this.execute("crm.lead", "write", [[leadId], updateData]);
    console.log("Lead updated successfully");
    return true;
  }

  async searchLead(phone?: string, email?: string): Promise<number | null> {
    const domain: any[] = [];
    if (phone) domain.push(["phone", "=", phone]);
    if (email) domain.push(["email_from", "=", email]);

    if (domain.length === 0) return null;

    const leadIds = await this.execute("crm.lead", "search", [domain], { limit: 1 });
    return leadIds.length > 0 ? leadIds[0] : null;
  }

  // ==================== OPPORTUNITY OPERATIONS ====================

  async convertLeadToOpportunity(leadId: number): Promise<number> {
    console.log("Converting lead to opportunity:", leadId);

    // Update the lead type to 'opportunity'
    await this.execute("crm.lead", "write", [[leadId], { type: "opportunity" }]);

    console.log("Lead converted to opportunity");
    return leadId;
  }

  async createOpportunity(data: {
    name: string;
    phone?: string;
    email?: string;
    expectedRevenue?: number;
    description?: string;
    partnerId?: number;
  }): Promise<number> {
    console.log("Creating Odoo opportunity:", data);

    const oppId = await this.execute("crm.lead", "create", [
      {
        name: data.name,
        phone: data.phone || false,
        email_from: data.email || false,
        expected_revenue: data.expectedRevenue || 0,
        description: data.description || false,
        type: "opportunity",
        partner_id: data.partnerId || false,
      },
    ]);

    console.log("Created opportunity with ID:", oppId);
    return oppId;
  }

  // ==================== PARTNER (CONTACT) OPERATIONS ====================

  async findOrCreatePartner(data: {
    name: string;
    phone?: string;
    email?: string;
    isCompany?: boolean;
  }): Promise<number> {
    // Try to find existing partner by phone or email
    let domain: any[] = [];
    if (data.phone) {
      domain = [["phone", "=", data.phone]];
    } else if (data.email) {
      domain = [["email", "=", data.email]];
    }

    if (domain.length > 0) {
      const partnerIds = await this.execute("res.partner", "search", [domain], { limit: 1 });
      if (partnerIds.length > 0) {
        console.log("Found existing partner:", partnerIds[0]);
        return partnerIds[0];
      }
    }

    // Create new partner
    const partnerId = await this.execute("res.partner", "create", [
      {
        name: data.name,
        phone: data.phone || false,
        email: data.email || false,
        is_company: data.isCompany || false,
      },
    ]);

    console.log("Created partner with ID:", partnerId);
    return partnerId;
  }

  // ==================== QUOTATION / SALES ORDER OPERATIONS ====================

  async createQuotation(data: {
    partnerId: number;
    opportunityId?: number;
    orderLines: Array<{
      name: string;
      quantity: number;
      priceUnit: number;
    }>;
    notes?: string;
  }): Promise<number> {
    console.log("Creating quotation for partner:", data.partnerId);

    // Create the sales order (quotation)
    const orderId = await this.execute("sale.order", "create", [
      {
        partner_id: data.partnerId,
        opportunity_id: data.opportunityId || false,
        note: data.notes || false,
        state: "draft", // Quotation state
      },
    ]);

    // Add order lines
    for (const line of data.orderLines) {
      await this.execute("sale.order.line", "create", [
        {
          order_id: orderId,
          name: line.name,
          product_uom_qty: line.quantity,
          price_unit: line.priceUnit,
          // If you have products configured, you can link them:
          // product_id: await this.findProductByName(line.name),
        },
      ]);
    }

    console.log("Created quotation with ID:", orderId);
    return orderId;
  }

  async confirmSalesOrder(orderId: number): Promise<boolean> {
    console.log("Confirming sales order:", orderId);
    await this.execute("sale.order", "action_confirm", [[orderId]]);
    console.log("Sales order confirmed");
    return true;
  }

  // ==================== INVOICE OPERATIONS ====================

  async createInvoiceFromSalesOrder(orderId: number): Promise<number | null> {
    console.log("Creating invoice from sales order:", orderId);

    // Create invoice using Odoo's built-in method
    const result = await this.execute("sale.order", "action_invoice_create", [[orderId]]);

    if (result && result.length > 0) {
      const invoiceId = result[0];
      console.log("Created invoice with ID:", invoiceId);
      return invoiceId;
    }

    // Alternative: Try the newer _create_invoices method
    try {
      const invoices = await this.execute("sale.order", "_create_invoices", [[orderId]]);
      if (invoices && invoices.length > 0) {
        console.log("Created invoice with ID:", invoices[0]);
        return invoices[0];
      }
    } catch (e) {
      console.log("Could not create invoice automatically:", e);
    }

    return null;
  }

  async postInvoice(invoiceId: number): Promise<boolean> {
    console.log("Posting invoice:", invoiceId);
    await this.execute("account.move", "action_post", [[invoiceId]]);
    console.log("Invoice posted");
    return true;
  }

  // ==================== UTILITY METHODS ====================

  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch (error) {
      console.error("Odoo connection test failed:", error);
      return false;
    }
  }
}
