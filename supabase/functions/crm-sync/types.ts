/**
 * Type definitions for CRM Sync Edge Function
 */

export interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: any;
  old_record?: any;
  schema: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  is_verified: boolean;
  created_time?: string;
}

export interface CateringOrder {
  id: string;
  user_id?: string;
  order_number: number;
  event_type: string;
  guest_count: number;
  veg_count?: number;
  non_veg_count?: number;
  egg_count?: number;
  event_date: string;
  event_time?: string;
  meal_times?: string;
  dietary_types?: string;
  cuisines?: string;
  cuisine_preferences?: string;
  budget_min?: number;
  budget_max?: number;
  add_on_ids?: string;
  name: string;
  email?: string;
  phone: string;
  message?: string;
  address_id?: string;
  status: string;
  created_at: string;
}

export interface CorporateOrder {
  id: string;
  user_id?: string;
  order_number: number;
  company_name: string;
  contact_person: string;
  email?: string;
  phone: string;
  number_of_people: number;
  veg_count?: number;
  non_veg_count?: number;
  egg_count?: number;
  event_type: string;
  budget_min?: number;
  budget_max?: number;
  event_date: string;
  event_time?: string;
  additional_services?: string;
  message?: string;
  address_id?: string;
  status: string;
  created_at: string;
}

export interface BulkMealOrder {
  id: string;
  user_id: string;
  order_number: number;
  items: string; // JSON string of items
  subtotal: number;
  gst: number;
  platform_fee: number;
  packaging_fee: number;
  total: number;
  delivery_date?: string;
  delivery_time?: string;
  address_id?: string;
  status: string;
  created_at: string;
  selected_addons?: string;
}

export interface MealboxOrder {
  id: string;
  user_id: string;
  order_number: number;
  portions: string;
  meal_preference: string;
  selected_meal_type?: string;
  veg_boxes: number;
  egg_boxes: number;
  non_veg_boxes: number;
  veg_plate_selections?: string;
  egg_plate_selections?: string;
  non_veg_plate_selections?: string;
  selected_addons?: string;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  delivery_date?: string;
  delivery_time?: string;
  address_id?: string;
  status: string;
  created_at: string;
}

export interface OdooEntity {
  id: string;
  source_table: string;
  source_id: string;
  entity_type: string; // 'lead', 'opportunity', 'partner', 'order', 'invoice'
  odoo_id: number;
  last_synced_at: string;
  created_at: string;
}

export interface OrderLineItem {
  name: string;
  quantity: number;
  priceUnit: number;
}
