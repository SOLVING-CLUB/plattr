-- ============================================================
-- SQL Queries to Test getAllUnified() Function
-- Run these in Supabase SQL Editor to see the response
-- ============================================================

-- Option 1: Replace 'YOUR_USER_ID_HERE' with an actual user ID from your users table
-- Or use auth.uid() if you're authenticated in Supabase
-- ============================================================

-- Get a sample user ID first (uncomment to use):
-- SELECT id, phone, email FROM users LIMIT 1;

-- Replace this with your actual user ID:
\set user_id 'YOUR_USER_ID_HERE'

-- ============================================================
-- Query 1: Regular Orders (from orders table)
-- ============================================================
SELECT 
  o.*,
  json_build_object(
    'id', a.id,
    'label', a.label,
    'address', a.address
  ) as addresses,
  COALESCE(
    json_agg(
      json_build_object(
        'id', oi.id,
        'quantity', oi.quantity,
        'price', oi.price,
        'dishes', json_build_object(
          'id', d.id,
          'name', d.name,
          'image_url', d.image_url,
          'dietary_type', d.dietary_type
        )
      )
    ) FILTER (WHERE oi.id IS NOT NULL),
    '[]'::json
  ) as order_items
FROM orders o
LEFT JOIN addresses a ON o.address_id = a.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN dishes d ON oi.dish_id = d.id
WHERE o.user_id = :'user_id'
GROUP BY o.id, a.id, a.label, a.address
ORDER BY o.created_at DESC;

-- ============================================================
-- Query 2: Mealbox Orders
-- ============================================================
SELECT *
FROM mealbox_orders
WHERE user_id = :'user_id'
ORDER BY created_at DESC;

-- ============================================================
-- Query 3: Bulk Meal Orders
-- ============================================================
SELECT *
FROM bulk_meal_orders
WHERE user_id = :'user_id'
ORDER BY created_at DESC;

-- ============================================================
-- Query 4: Snack Box Orders
-- ============================================================
SELECT *
FROM snack_box_orders
WHERE user_id = :'user_id'
ORDER BY created_at DESC;

-- ============================================================
-- Query 5: 60-Min Mealbox Orders
-- ============================================================
SELECT *
FROM sixty_min_mealbox_orders
WHERE user_id = :'user_id'
ORDER BY created_at DESC;

-- ============================================================
-- Query 6: 60-Min Bulk Orders
-- ============================================================
SELECT *
FROM sixty_min_bulk_orders
WHERE user_id = :'user_id'
ORDER BY created_at DESC;

-- ============================================================
-- Query 7: Catering Orders
-- ============================================================
SELECT *
FROM catering_orders
WHERE user_id = :'user_id'
ORDER BY created_at DESC;

-- ============================================================
-- Query 8: Corporate Orders
-- ============================================================
SELECT *
FROM corporate_orders
WHERE user_id = :'user_id'
ORDER BY created_at DESC;

-- ============================================================
-- ALTERNATIVE: Combined Query (All orders in one result)
-- This simulates what the JavaScript code does
-- ============================================================
WITH all_orders AS (
  -- Regular Orders
  SELECT 
    id,
    order_number,
    'regular' as order_type,
    COALESCE(order_type_label, 'Regular Order') as order_type_label,
    subtotal::text,
    delivery_fee::text as delivery_fee,
    tax::text,
    total::text,
    delivery_date,
    delivery_time,
    status,
    created_at,
    'Delivery' as address_label,
    '' as address
  FROM orders
  WHERE user_id = :'user_id'
  
  UNION ALL
  
  -- Mealbox Orders
  SELECT 
    id,
    order_number,
    'mealbox' as order_type,
    COALESCE(order_type_label, 'Meal Box') as order_type_label,
    subtotal::text,
    delivery_fee::text,
    tax::text,
    total::text,
    delivery_date,
    delivery_time,
    status,
    created_at,
    'Delivery' as address_label,
    '' as address
  FROM mealbox_orders
  WHERE user_id = :'user_id'
  
  UNION ALL
  
  -- Bulk Meal Orders
  SELECT 
    id,
    order_number,
    'bulk' as order_type,
    COALESCE(order_type_label, 'Bulk Meal') as order_type_label,
    subtotal::text,
    platform_fee::text as delivery_fee,
    gst::text as tax,
    total::text,
    delivery_date,
    delivery_time,
    status,
    created_at,
    'Delivery' as address_label,
    '' as address
  FROM bulk_meal_orders
  WHERE user_id = :'user_id'
  
  UNION ALL
  
  -- Snack Box Orders
  SELECT 
    id,
    order_number,
    'snackbox' as order_type,
    COALESCE(order_type_label, 'Snack Box') as order_type_label,
    subtotal::text,
    platform_fee::text as delivery_fee,
    gst::text as tax,
    total::text,
    delivery_date,
    delivery_time,
    status,
    created_at,
    'Delivery' as address_label,
    COALESCE(delivery_address, '') as address
  FROM snack_box_orders
  WHERE user_id = :'user_id'
  
  UNION ALL
  
  -- 60-Min Mealbox Orders
  SELECT 
    id,
    order_number,
    'sixty_min_mealbox' as order_type,
    COALESCE(order_type_label, '60-Min Meal Box') as order_type_label,
    subtotal::text,
    delivery_fee::text,
    tax_amount::text as tax,
    total_amount::text as total,
    delivery_date,
    delivery_time,
    order_status as status,
    created_at,
    'Delivery' as address_label,
    COALESCE(delivery_address, '') as address
  FROM sixty_min_mealbox_orders
  WHERE user_id = :'user_id'
  
  UNION ALL
  
  -- 60-Min Bulk Orders
  SELECT 
    id,
    order_number,
    'sixty_min_bulk' as order_type,
    COALESCE(order_type_label, '60-Min Bulk Meal') as order_type_label,
    subtotal::text,
    delivery_fee::text,
    tax_amount::text as tax,
    total_amount::text as total,
    delivery_date,
    delivery_time,
    order_status as status,
    created_at,
    'Delivery' as address_label,
    COALESCE(delivery_address, '') as address
  FROM sixty_min_bulk_orders
  WHERE user_id = :'user_id'
  
  UNION ALL
  
  -- Catering Orders
  SELECT 
    id,
    order_number,
    'catering' as order_type,
    COALESCE(order_type_label, 'Catering') as order_type_label,
    COALESCE(budget_min, estimated_total, 0)::text as subtotal,
    '0' as delivery_fee,
    '0' as tax,
    COALESCE(budget_max, estimated_total, 0)::text as total,
    event_date as delivery_date,
    event_time as delivery_time,
    status,
    created_at,
    COALESCE(event_type, 'Catering Event') as address_label,
    COALESCE(venue_address, '') as address
  FROM catering_orders
  WHERE user_id = :'user_id'
  
  UNION ALL
  
  -- Corporate Orders
  SELECT 
    id,
    order_number,
    'corporate' as order_type,
    COALESCE(order_type_label, 'Corporate') as order_type_label,
    COALESCE(subtotal, estimated_total, 0)::text,
    '0' as delivery_fee,
    '0' as tax,
    COALESCE(total, estimated_total, 0)::text,
    delivery_date,
    delivery_time,
    status,
    created_at,
    COALESCE(company_name, 'Corporate Order') as address_label,
    COALESCE(delivery_address, '') as address
  FROM corporate_orders
  WHERE user_id = :'user_id'
)
SELECT *
FROM all_orders
ORDER BY created_at DESC;

-- ============================================================
-- SIMPLER VERSION: If you want to use auth.uid() directly
-- (Only works if you're authenticated in Supabase)
-- ============================================================
-- Just replace :'user_id' with auth.uid() in the queries above
-- Example:
-- WHERE user_id = auth.uid()

-- ============================================================
-- Check order_type_label column exists and has data
-- ============================================================
SELECT 
  'orders' as table_name,
  COUNT(*) as total_orders,
  COUNT(order_type_label) as orders_with_label,
  COUNT(*) FILTER (WHERE order_type_label IS NULL) as orders_without_label
FROM orders
WHERE user_id = :'user_id'

UNION ALL

SELECT 
  'mealbox_orders' as table_name,
  COUNT(*) as total_orders,
  COUNT(order_type_label) as orders_with_label,
  COUNT(*) FILTER (WHERE order_type_label IS NULL) as orders_without_label
FROM mealbox_orders
WHERE user_id = :'user_id'

UNION ALL

SELECT 
  'bulk_meal_orders' as table_name,
  COUNT(*) as total_orders,
  COUNT(order_type_label) as orders_with_label,
  COUNT(*) FILTER (WHERE order_type_label IS NULL) as orders_without_label
FROM bulk_meal_orders
WHERE user_id = :'user_id'

UNION ALL

SELECT 
  'snack_box_orders' as table_name,
  COUNT(*) as total_orders,
  COUNT(order_type_label) as orders_with_label,
  COUNT(*) FILTER (WHERE order_type_label IS NULL) as orders_without_label
FROM snack_box_orders
WHERE user_id = :'user_id';
