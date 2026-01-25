-- Create integration_odoo_entities table to track Supabase → Odoo ID mappings
-- This allows us to update/convert records in Odoo when changes occur in Supabase

CREATE TABLE IF NOT EXISTS public.integration_odoo_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'lead', 'opportunity', 'partner', 'quotation', 'sales_order', 'invoice'
  odoo_id INTEGER NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate mappings
  CONSTRAINT unique_source_entity UNIQUE (source_table, source_id, entity_type)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_odoo_entities_source 
  ON public.integration_odoo_entities (source_table, source_id);

CREATE INDEX IF NOT EXISTS idx_odoo_entities_odoo_id 
  ON public.integration_odoo_entities (odoo_id);

CREATE INDEX IF NOT EXISTS idx_odoo_entities_entity_type 
  ON public.integration_odoo_entities (entity_type);

-- Add RLS policies (optional - adjust based on your security requirements)
ALTER TABLE public.integration_odoo_entities ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for Edge Functions)
DROP POLICY IF EXISTS "Service role has full access" ON public.integration_odoo_entities;
CREATE POLICY "Service role has full access" 
  ON public.integration_odoo_entities 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE public.integration_odoo_entities IS 'Tracks mappings between Supabase records and Odoo CRM/ERP entities';
COMMENT ON COLUMN public.integration_odoo_entities.source_table IS 'The Supabase table name (users, bulk_meal_orders, etc.)';
COMMENT ON COLUMN public.integration_odoo_entities.source_id IS 'The ID of the record in the Supabase table';
COMMENT ON COLUMN public.integration_odoo_entities.entity_type IS 'The type of Odoo entity (lead, opportunity, sales_order, invoice)';
COMMENT ON COLUMN public.integration_odoo_entities.odoo_id IS 'The ID of the record in Odoo';
