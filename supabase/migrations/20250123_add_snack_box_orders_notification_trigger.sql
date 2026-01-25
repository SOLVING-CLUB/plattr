-- Add notification trigger for snack_box_orders table
-- This ensures snack box orders send notifications on status changes

-- Create trigger for snack_box_orders (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'snack_box_orders' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trg_snack_box_orders_status_notification ON public.snack_box_orders;
    CREATE TRIGGER trg_snack_box_orders_status_notification
      AFTER UPDATE ON public.snack_box_orders
      FOR EACH ROW
      EXECUTE FUNCTION notify_order_status_change();
    
    RAISE NOTICE 'Trigger created for snack_box_orders';
  ELSE
    RAISE NOTICE 'Table snack_box_orders does not exist, skipping trigger creation';
  END IF;
END $$;

-- Comments
COMMENT ON TRIGGER trg_snack_box_orders_status_notification ON public.snack_box_orders IS 'Sends push notification when snack box order status changes via Edge Function';
