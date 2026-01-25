import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { createClient } from '@supabase/supabase-js';

export interface FestiveSetting {
  id: string;
  festive_name: string;
  filter_tag: string;
  banner_media_url: string | null;
  banner_media_type: 'image' | 'video';
  is_active: boolean;
  display_order: number;
  button_text: string | null;
  banner_bg_color: string | null;
  banner_text_color: string | null;
  show_cta_button: boolean;
  // CTA action method: 1 = filter method, 2 = direct redirect method
  cta_action_method: number | null;
  // Target page for method 2: 'bulk-meals', 'mealbox', 'snack-box', 'corporate', 'catering'
  cta_target_page: string | null;
  // CTA position: predefined positions or 'custom'
  cta_position: string | null;
  // Custom X position (e.g., '20%', '100px')
  cta_position_x: string | null;
  // Custom Y position (e.g., '30%', '200px')
  cta_position_y: string | null;
  created_at: string;
  updated_at: string;
  // Backward compatibility
  banner_video_url?: string | null;
}

// Create Supabase client for realtime (using same config as REST client)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://leltckltotobsibixhqo.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbHRja2x0b3RvYnNpYml4aHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzc5ODEsImV4cCI6MjA3NTk1Mzk4MX0._IrMgGQDJB7OvKEoT7pwWG9AjN6aeN1ejnj8IViDLyE';

const supabaseRealtime = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Hook to fetch active festive settings from Supabase with real-time updates
 * Returns the first active festive (sorted by display_order)
 * Automatically refetches when changes are detected in Supabase
 */
export function useFestiveSettings() {
  const queryClient = useQueryClient();
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const query = useQuery<FestiveSetting | null>({
    queryKey: ['festive-settings'],
    queryFn: async () => {
      try {
        const settings = await supabase.select<FestiveSetting>('festive_settings', {
          filter: {
            'is_active': 'eq.true'
          },
          order: 'display_order.asc'
        } as any);
        
        // Return the first active festive (or null if none)
        return settings && settings.length > 0 ? settings[0] : null;
      } catch (error) {
        console.error('[useFestiveSettings] Error fetching festive settings:', error);
        return null;
      }
    },
    staleTime: 0, // No cache - always fetch fresh data when invalidated
    refetchOnWindowFocus: true, // Refetch when window regains focus
    // Only poll if realtime is not connected (fallback)
    refetchInterval: realtimeConnected ? false : 30000, // Poll every 30 seconds if realtime fails
  });

  // Set up realtime subscription for instant updates
  useEffect(() => {
    console.log('[useFestiveSettings] Setting up realtime subscription');

    // Subscribe to changes in festive_settings table
    const channel = supabaseRealtime
      .channel('festive-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'festive_settings',
        },
        (payload) => {
          console.log('[useFestiveSettings] Realtime change detected:', payload.eventType, payload);
          
          // Invalidate and refetch the query when any change occurs
          queryClient.invalidateQueries({ queryKey: ['festive-settings'] });
        }
      )
      .subscribe((status) => {
        console.log('[useFestiveSettings] Realtime subscription status:', status);
        
        // Track connection status
        if (status === 'SUBSCRIBED') {
          setRealtimeConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeConnected(false);
        }
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('[useFestiveSettings] Cleaning up realtime subscription');
      supabaseRealtime.removeChannel(channel);
      setRealtimeConnected(false);
    };
  }, [queryClient]);

  return query;
}
