-- Trigger function to send notifications on order status changes
-- This will call a Supabase Edge Function or webhook

CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  event_name TEXT;
  order_number_text TEXT;
  current_status TEXT;
  old_status_value TEXT;
BEGIN
  -- Determine which status column to use
  -- Try 'status' first, then 'order_status'
  current_status := COALESCE(NEW.status, NEW.order_status);
  old_status_value := COALESCE(OLD.status, OLD.order_status);
  
  -- Only trigger if status actually changed
  IF current_status IS NOT DISTINCT FROM old_status_value THEN
    RETURN NEW;
  END IF;

  -- Map status to event name
  CASE current_status
    WHEN 'confirmed' THEN event_name := 'order_confirmed';
    WHEN 'preparing' THEN event_name := 'order_processing';
    WHEN 'delivering' THEN event_name := 'order_dispatched';
    WHEN 'delivered' THEN event_name := 'order_delivered';
    WHEN 'cancelled' THEN event_name := 'order_cancelled';
    ELSE RETURN NEW; -- Unknown status, skip
  END CASE;

  -- Get order number (handle different order types)
  IF NEW.order_number IS NOT NULL THEN
    order_number_text := NEW.order_number::TEXT;
  ELSIF NEW.id IS NOT NULL THEN
    -- Use last 4 chars of UUID as fallback
    order_number_text := RIGHT(NEW.id::TEXT, 4);
  ELSE
    order_number_text := '----';
  END IF;

  -- Call Edge Function or webhook to send notification
  -- For now, we'll use pg_notify which can be listened to by a service
  PERFORM pg_notify('order_status_changed', json_build_object(
    'event_name', event_name,
    'user_id', NEW.user_id,
    'order_id', NEW.id,
    'order_number', order_number_text,
    'old_status', old_status_value,
    'new_status', current_status,
    'created_at', COALESCE(NEW.created_at, NOW())
  )::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on bulk_meal_orders table
DROP TRIGGER IF EXISTS bulk_meal_order_status_notification ON bulk_meal_orders;
CREATE TRIGGER bulk_meal_order_status_notification
  AFTER UPDATE OF status ON bulk_meal_orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_order_status_change();

-- Create trigger on mealbox_orders table
DROP TRIGGER IF EXISTS mealbox_order_status_notification ON mealbox_orders;
CREATE TRIGGER mealbox_order_status_notification
  AFTER UPDATE OF status ON mealbox_orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_order_status_change();

-- Create trigger on sixty_min_mealbox_orders table
DROP TRIGGER IF EXISTS sixty_min_mealbox_order_status_notification ON sixty_min_mealbox_orders;
CREATE TRIGGER sixty_min_mealbox_order_status_notification
  AFTER UPDATE OF order_status ON sixty_min_mealbox_orders
  FOR EACH ROW
  WHEN (OLD.order_status IS DISTINCT FROM NEW.order_status)
  EXECUTE FUNCTION notify_order_status_change();

-- Create trigger on sixty_min_bulk_orders table (if it exists)
DROP TRIGGER IF EXISTS sixty_min_bulk_order_status_notification ON sixty_min_bulk_orders;
CREATE TRIGGER sixty_min_bulk_order_status_notification
  AFTER UPDATE OF order_status ON sixty_min_bulk_orders
  FOR EACH ROW
  WHEN (OLD.order_status IS DISTINCT FROM NEW.order_status)
  EXECUTE FUNCTION notify_order_status_change();

-- Note: You'll need to create a listener service or Edge Function
-- that listens to 'order_status_changed' channel and sends notifications

