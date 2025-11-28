import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://leltckltotobsibixhqo.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbHRja2x0b3RvYnNpYml4aHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzc5ODEsImV4cCI6MjA3NTk1Mzk4MX0._IrMgGQDJB7OvKEoT7pwWG9AjN6aeN1ejnj8IViDLyE';

// Singleton pattern to prevent multiple client instances
// Best practice: Single instance across the app
let supabaseAuthInstance: SupabaseClient | null = null;

export const supabaseAuth = (() => {
  if (!supabaseAuthInstance) {
    supabaseAuthInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // Best practices for auth configuration:
        autoRefreshToken: true, // Automatically refresh expired tokens
        persistSession: true, // Persist session in localStorage
        detectSessionInUrl: true, // Detect session from URL (for email verification redirects)
        storageKey: 'plattr-supabase-auth', // Unique storage key to avoid conflicts
        storage: typeof window !== 'undefined' ? window.localStorage : undefined, // Use localStorage
        flowType: 'pkce', // Use PKCE flow for better security (recommended)
      },
      // Global configuration
      global: {
        headers: {
          'x-client-info': 'plattr-web-app',
        },
      },
    });
  }
  return supabaseAuthInstance;
})();

// Helper function to check if user is authenticated (best practice)
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabaseAuth.auth.getSession();
    return !!session?.user;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

// Helper function to get current user (best practice)
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

