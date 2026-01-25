# Database Migration Instructions

## Overview
This document outlines the manual database changes required to support coordinate storage for addresses and all order types.

## Migration File
A migration file has been created at: `supabase/migrations/20250125_add_coordinates_to_tables.sql`

## Manual Steps Required

### Option 1: Run the Migration File (Recommended)
1. **Via Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/migrations/20250125_add_coordinates_to_tables.sql`
   - Execute the SQL script

2. **Via Supabase CLI:**
   ```bash
   supabase db push
   ```

### Option 2: Manual SQL Execution
Run the following SQL statements in your Supabase SQL Editor:

#### 1. Add Coordinates to Addresses Table
```sql
-- Add latitude column
ALTER TABLE public.addresses 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8) NULL;

-- Add longitude column
ALTER TABLE public.addresses 
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8) NULL;
```

#### 2. Add Coordinates to Orders Table
```sql
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_latitude NUMERIC(10, 8) NULL;

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_longitude NUMERIC(11, 8) NULL;
```

#### 3. Add Coordinates to Mealbox Orders Table
```sql
ALTER TABLE public.mealbox_orders 
ADD COLUMN IF NOT EXISTS delivery_latitude NUMERIC(10, 8) NULL;

ALTER TABLE public.mealbox_orders 
ADD COLUMN IF NOT EXISTS delivery_longitude NUMERIC(11, 8) NULL;
```

#### 4. Add Coordinates to Bulk Meal Orders Table
```sql
ALTER TABLE public.bulk_meal_orders 
ADD COLUMN IF NOT EXISTS delivery_latitude NUMERIC(10, 8) NULL;

ALTER TABLE public.bulk_meal_orders 
ADD COLUMN IF NOT EXISTS delivery_longitude NUMERIC(11, 8) NULL;
```

#### 5. Add Coordinates to Snack Box Orders Table
```sql
ALTER TABLE public.snack_box_orders 
ADD COLUMN IF NOT EXISTS delivery_latitude NUMERIC(10, 8) NULL;

ALTER TABLE public.snack_box_orders 
ADD COLUMN IF NOT EXISTS delivery_longitude NUMERIC(11, 8) NULL;
```

#### 6. Add Coordinates to Catering Orders Table
```sql
ALTER TABLE public.catering_orders 
ADD COLUMN IF NOT EXISTS delivery_latitude NUMERIC(10, 8) NULL;

ALTER TABLE public.catering_orders 
ADD COLUMN IF NOT EXISTS delivery_longitude NUMERIC(11, 8) NULL;
```

#### 7. Add Coordinates to Corporate Orders Table
```sql
ALTER TABLE public.corporate_orders 
ADD COLUMN IF NOT EXISTS delivery_latitude NUMERIC(10, 8) NULL;

ALTER TABLE public.corporate_orders 
ADD COLUMN IF NOT EXISTS delivery_longitude NUMERIC(11, 8) NULL;
```

## Tables That Already Have Coordinates
The following tables **already have** `delivery_latitude` and `delivery_longitude` columns (no changes needed):
- ✅ `sixty_min_bulk_orders` - Already has coordinates
- ✅ `sixty_min_mealbox_orders` - Already has coordinates

## Verification
After running the migration, verify the columns were added:

```sql
-- Check addresses table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'addresses' 
AND column_name IN ('latitude', 'longitude');

-- Check all order tables
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('orders', 'mealbox_orders', 'bulk_meal_orders', 'snack_box_orders', 'catering_orders', 'corporate_orders')
AND column_name IN ('delivery_latitude', 'delivery_longitude')
ORDER BY table_name, column_name;
```

## Summary of Changes

### Tables Modified:
1. **addresses** - Added `latitude`, `longitude`
2. **orders** - Added `delivery_latitude`, `delivery_longitude`
3. **mealbox_orders** - Added `delivery_latitude`, `delivery_longitude`
4. **bulk_meal_orders** - Added `delivery_latitude`, `delivery_longitude`
5. **snack_box_orders** - Added `delivery_latitude`, `delivery_longitude`
6. **catering_orders** - Added `delivery_latitude`, `delivery_longitude`
7. **corporate_orders** - Added `delivery_latitude`, `delivery_longitude`

### Data Types:
- **Latitude**: `NUMERIC(10, 8)` - Allows values from -90.00000000 to 90.00000000
- **Longitude**: `NUMERIC(11, 8)` - Allows values from -180.00000000 to 180.00000000
- **Nullable**: All coordinate columns are nullable (NULL allowed) to handle cases where geocoding fails

### Indexes Created:
The migration also creates indexes on coordinate columns for better query performance when filtering by location.

## Important Notes:
- All coordinate columns are **nullable** - this allows orders to be created even if geocoding fails
- The application code will attempt to geocode addresses automatically
- If coordinates cannot be determined, a warning will be logged but the order will still be created
- Existing records will have NULL coordinates until they are updated or new orders are created
