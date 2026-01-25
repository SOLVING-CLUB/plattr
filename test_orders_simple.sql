-- ============================================================
-- SIMPLE VERSION: Test Orders Queries
-- Uses auth.uid() - works when you're authenticated in Supabase
-- ============================================================

-- ============================================================
-- Individual Table Queries (Run each separately)
-- ============================================================

-- 1. Regular Orders
SELECT 
  id,
  order_number,
  order_type_label,
  subtotal,
  delivery_fee,
  tax,
  total,
  delivery_date,
  delivery_time,
  status,
  created_at
FROM orders
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 2. Mealbox Orders
SELECT 
  id,
  order_number,
  order_type_label,
  subtotal,
  delivery_fee,
  tax,
  total,
  delivery_date,
  delivery_time,
  status,
  created_at
FROM mealbox_orders
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 3. Bulk Meal Orders
SELECT 
  id,
  order_number,
  order_type_label,
  subtotal,
  platform_fee,
  gst,
  total,
  delivery_date,
  delivery_time,
  status,
  created_at
FROM bulk_meal_orders
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 4. Snack Box Orders
SELECT 
  id,
  order_number,
  order_type_label,
  subtotal,
  platform_fee,
  gst,
  total,
  delivery_date,
  delivery_time,
  status,
  created_at
FROM snack_box_orders
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 5. 60-Min Mealbox Orders
SELECT 
  id,
  order_number,
  order_type_label,
  subtotal,
  delivery_fee,
  tax_amount as tax,
  total_amount as total,
  delivery_date,
  delivery_time,
  order_status as status,
  created_at
FROM sixty_min_mealbox_orders
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 6. 60-Min Bulk Orders
SELECT 
  id,
  order_number,
  order_type_label,
  subtotal,
  delivery_fee,
  tax_amount as tax,
  total_amount as total,
  delivery_date,
  delivery_time,
  order_status as status,
  created_at
FROM sixty_min_bulk_orders
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 7. Catering Orders
SELECT 
  id,
  order_number,
  order_type_label,
  budget_min as subtotal,
  budget_max as total,
  event_date as delivery_date,
  event_time as delivery_time,
  status,
  created_at
FROM catering_orders
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 8. Corporate Orders
SELECT 
  id,
  order_number,
  order_type_label,
  subtotal,
  total,
  delivery_date,
  delivery_time,
  status,
  created_at
FROM corporate_orders
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 9. Tasting Menu Orders
SELECT 
  id,
  order_number,
  order_type_label,
  subtotal,
  COALESCE(delivery_fee, platform_fee, 0) as delivery_fee,
  COALESCE(tax, gst, 0) as tax,
  total,
  delivery_date,
  delivery_time,
  COALESCE(status, order_status, 'pending') as status,
  created_at
FROM tasting_menu_orders
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- ============================================================
-- Combined View (All orders together, sorted by latest)
-- ============================================================
WITH unified_orders AS (
  SELECT 
    id,
    order_number,
    COALESCE(order_type_label, 'Regular Order') as order_type_label,
    'regular' as order_type,
    created_at,
    status
  FROM orders
  WHERE user_id = auth.uid()
  
  UNION ALL
  
  SELECT 
    id,
    order_number,
    COALESCE(order_type_label, 'Meal Box') as order_type_label,
    'mealbox' as order_type,
    created_at,
    status
  FROM mealbox_orders
  WHERE user_id = auth.uid()
  
  UNION ALL
  
  SELECT 
    id,
    order_number,
    COALESCE(order_type_label, 'Bulk Meal') as order_type_label,
    'bulk' as order_type,
    created_at,
    status
  FROM bulk_meal_orders
  WHERE user_id = auth.uid()
  
  UNION ALL
  
  SELECT 
    id,
    order_number,
    COALESCE(order_type_label, 'Snack Box') as order_type_label,
    'snackbox' as order_type,
    created_at,
    status
  FROM snack_box_orders
  WHERE user_id = auth.uid()
  
  UNION ALL
  
  SELECT 
    id,
    order_number,
    COALESCE(order_type_label, '60-Min Meal Box') as order_type_label,
    'sixty_min_mealbox' as order_type,
    created_at,
    order_status as status
  FROM sixty_min_mealbox_orders
  WHERE user_id = auth.uid()
  
  UNION ALL
  
  SELECT 
    id,
    order_number,
    COALESCE(order_type_label, '60-Min Bulk Meal') as order_type_label,
    'sixty_min_bulk' as order_type,
    created_at,
    order_status as status
  FROM sixty_min_bulk_orders
  WHERE user_id = auth.uid()
  
  UNION ALL
  
  SELECT 
    id,
    order_number,
    COALESCE(order_type_label, 'Catering') as order_type_label,
    'catering' as order_type,
    created_at,
    status
  FROM catering_orders
  WHERE user_id = auth.uid()
  
  UNION ALL
  
  SELECT 
    id,
    order_number,
    COALESCE(order_type_label, 'Corporate') as order_type_label,
    'corporate' as order_type,
    created_at,
    status
  FROM corporate_orders
  WHERE user_id = auth.uid()
  
  UNION ALL
  
  SELECT 
    id,
    order_number,
    COALESCE(order_type_label, 'Tasting Menu') as order_type_label,
    'tasting_menu' as order_type,
    created_at,
    COALESCE(status, order_status, 'pending') as status
  FROM tasting_menu_orders
  WHERE user_id = auth.uid()
)
SELECT 
  id,
  order_number,
  order_type_label,
  order_type,
  status,
  created_at
FROM unified_orders
ORDER BY created_at DESC;

-- ============================================================
-- Check order_type_label distribution
-- ============================================================
SELECT 
  'orders' as table_name,
  order_type_label,
  COUNT(*) as count
FROM orders
WHERE user_id = auth.uid()
GROUP BY order_type_label

UNION ALL

SELECT 
  'mealbox_orders' as table_name,
  order_type_label,
  COUNT(*) as count
FROM mealbox_orders
WHERE user_id = auth.uid()
GROUP BY order_type_label

UNION ALL

SELECT 
  'bulk_meal_orders' as table_name,
  order_type_label,
  COUNT(*) as count
FROM bulk_meal_orders
WHERE user_id = auth.uid()
GROUP BY order_type_label

UNION ALL

SELECT 
  'snack_box_orders' as table_name,
  order_type_label,
  COUNT(*) as count
FROM snack_box_orders
WHERE user_id = auth.uid()
GROUP BY order_type_label

UNION ALL

SELECT 
  'tasting_menu_orders' as table_name,
  order_type_label,
  COUNT(*) as count
FROM tasting_menu_orders
WHERE user_id = auth.uid()
GROUP BY order_type_label

ORDER BY table_name, order_type_label;
