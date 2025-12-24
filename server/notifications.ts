/**
 * Notification Service for Backend
 * Handles device token registration and notification sending
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://leltckltotobsibixhqo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create Supabase client with service role for admin operations
const supabase = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export interface DeviceToken {
  id?: string;
  user_id: string;
  device_token: string;
  platform: 'ios' | 'android' | 'web';
  preferences?: {
    order_updates: boolean;
    offers_promotions: boolean;
    menu_recommendations: boolean;
    reminders: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

export interface NotificationPayload {
  notification_id: string;
  category: 'transactional' | 'marketing' | 'behavioral';
  event_name: string;
  user_id: string;
  title: string;
  body: string;
  deep_link?: string;
  image_url?: string;
  cta_text?: string;
  metadata?: Record<string, any>;
  dedupe_key: string;
  created_at: string;
}

/**
 * Register or update device token
 */
export async function registerDeviceToken(data: DeviceToken): Promise<DeviceToken> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Check if token already exists for this user
  const { data: existing } = await supabase
    .from('device_tokens')
    .select('*')
    .eq('user_id', data.user_id)
    .eq('device_token', data.device_token)
    .single();

  if (existing) {
    // Update existing token
    const { data: updated, error } = await supabase
      .from('device_tokens')
      .update({
        platform: data.platform,
        preferences: data.preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return updated as DeviceToken;
  } else {
    // Insert new token
    const { data: inserted, error } = await supabase
      .from('device_tokens')
      .insert({
        user_id: data.user_id,
        device_token: data.device_token,
        platform: data.platform,
        preferences: data.preferences || {
          order_updates: true,
          offers_promotions: false,
          menu_recommendations: false,
          reminders: true,
        },
      })
      .select()
      .single();

    if (error) throw error;
    return inserted as DeviceToken;
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<DeviceToken['preferences']>
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  // Update all tokens for this user
  const { error } = await supabase
    .from('device_tokens')
    .update({
      preferences: preferences as DeviceToken['preferences'],
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Get all device tokens for a user
 */
export async function getUserDeviceTokens(userId: string): Promise<DeviceToken[]> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase
    .from('device_tokens')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return (data || []) as DeviceToken[];
}

/**
 * Delete device token (when user logs out or uninstalls)
 */
export async function deleteDeviceToken(userId: string, deviceToken: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase
    .from('device_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('device_token', deviceToken);

  if (error) throw error;
}

/**
 * Check if notification should be sent based on preferences
 */
export function shouldSendNotification(
  category: NotificationPayload['category'],
  preferences?: DeviceToken['preferences']
): boolean {
  if (!preferences) return true; // Default to sending if preferences not set

  switch (category) {
    case 'transactional':
      return preferences.order_updates !== false; // Always allow transactional
    case 'marketing':
      return preferences.offers_promotions === true || preferences.menu_recommendations === true;
    case 'behavioral':
      return preferences.reminders === true;
    default:
      return true;
  }
}

