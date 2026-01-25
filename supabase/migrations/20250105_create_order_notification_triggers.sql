-- Create triggers for sending notifications on order status changes
-- These triggers will call the send-notification Edge Function

-- Enable the http extension if not already enabled (for calling Edge Functions)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Function to send notification on order status change
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  notification_url TEXT;
  user_id_val TEXT;
  order_id_val TEXT;
  order_number_val INTEGER;
  event_name_val TEXT;
  response extensions.http_response;
BEGIN
  -- Only trigger on status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Get the Supabase URL for the Edge Function
    notification_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-notification';
    
    -- If setting not available, use default
    IF notification_url IS NULL OR notification_url = '' OR notification_url = '/functions/v1/send-notification' THEN
      notification_url := 'https://leltckltotobsibixhqo.supabase.co/functions/v1/send-notification';
    END IF;
    
    -- Extract values based on table
    user_id_val := NEW.user_id;
    order_id_val := NEW.id::text;
    order_number_val := NEW.order_number;
    
    -- Determine event name based on new status
    CASE NEW.status
      WHEN 'confirmed' THEN event_name_val := 'order_confirmed';
      WHEN 'paid' THEN event_name_val := 'order_confirmed'; -- Treat 'paid' as confirmed for payment notifications
      WHEN 'processing' THEN event_name_val := 'order_processing';
      WHEN 'preparing' THEN event_name_val := 'order_processing';
      WHEN 'dispatched' THEN event_name_val := 'order_dispatched';
      WHEN 'delivering' THEN event_name_val := 'order_dispatched';
      WHEN 'delivered' THEN event_name_val := 'order_delivered';
      WHEN 'cancelled' THEN event_name_val := 'order_cancelled';
      ELSE event_name_val := NULL;
    END CASE;
    
    -- Only send notification for recognized status changes
    IF event_name_val IS NOT NULL AND user_id_val IS NOT NULL THEN
      BEGIN
        -- Call the Edge Function via HTTP
        SELECT * INTO response FROM extensions.http((
          'POST',
          notification_url,
          ARRAY[
            extensions.http_header('Content-Type', 'application/json'),
            extensions.http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true))
          ],
          'application/json',
          json_build_object(
            'user_id', user_id_val,
            'category', 'transactional',
            'event_name', event_name_val,
            'title', CASE event_name_val
              WHEN 'order_confirmed' THEN 'Order Confirmed ✅'
              WHEN 'order_processing' THEN 'We''re on it 👨‍🍳'
              WHEN 'order_dispatched' THEN 'Out for delivery 🚚'
              WHEN 'order_delivered' THEN 'Delivered ✅'
              WHEN 'order_cancelled' THEN 'Order cancelled'
              ELSE 'Order Update'
            END,
            'body', CASE event_name_val
              WHEN 'order_confirmed' THEN 'Your Plattr order #' || order_number_val || ' is confirmed.'
              WHEN 'order_processing' THEN 'Your order is now being prepared.'
              WHEN 'order_dispatched' THEN 'Your order #' || order_number_val || ' is on the way!'
              WHEN 'order_delivered' THEN 'Hope everyone loved it! Rate your experience.'
              WHEN 'order_cancelled' THEN 'Your order #' || order_number_val || ' has been cancelled.'
              ELSE 'Your order has been updated.'
            END,
            'deep_link', 'plattr://orders/' || order_id_val,
            'metadata', json_build_object(
              'order_id', order_id_val,
              'order_number', order_number_val,
              'old_status', OLD.status,
              'new_status', NEW.status
            )
          )::text
        )::extensions.http_request);
        
        -- Log the response (optional - for debugging)
        IF response.status >= 400 THEN
          RAISE WARNING 'Notification failed for order %: status %, body %', 
            order_id_val, response.status, response.content;
        END IF;
        
      EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE WARNING 'Failed to send notification for order %: %', order_id_val, SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for each order table
-- Note: These triggers fire AFTER UPDATE so they don't block the original transaction

-- Trigger for bulk_meal_orders
DROP TRIGGER IF EXISTS trg_bulk_meal_orders_status_notification ON public.bulk_meal_orders;
CREATE TRIGGER trg_bulk_meal_orders_status_notification
  AFTER UPDATE ON public.bulk_meal_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();

-- Trigger for mealbox_orders (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mealbox_orders' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trg_mealbox_orders_status_notification ON public.mealbox_orders;
    CREATE TRIGGER trg_mealbox_orders_status_notification
      AFTER UPDATE ON public.mealbox_orders
      FOR EACH ROW
      EXECUTE FUNCTION notify_order_status_change();
  END IF;
END $$;

-- Trigger for sixty_min_bulk_orders (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sixty_min_bulk_orders' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trg_sixty_min_bulk_orders_status_notification ON public.sixty_min_bulk_orders;
    CREATE TRIGGER trg_sixty_min_bulk_orders_status_notification
      AFTER UPDATE ON public.sixty_min_bulk_orders
      FOR EACH ROW
      EXECUTE FUNCTION notify_order_status_change();
  END IF;
END $$;

-- Trigger for sixty_min_mealbox_orders (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sixty_min_mealbox_orders' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trg_sixty_min_mealbox_orders_status_notification ON public.sixty_min_mealbox_orders;
    CREATE TRIGGER trg_sixty_min_mealbox_orders_status_notification
      AFTER UPDATE ON public.sixty_min_mealbox_orders
      FOR EACH ROW
      EXECUTE FUNCTION notify_order_status_change();
  END IF;
END $$;

-- Comments
COMMENT ON FUNCTION notify_order_status_change IS 'Sends push notification when order status changes via Edge Function';
