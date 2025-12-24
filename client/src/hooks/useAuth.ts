import { useState, useEffect, useRef } from 'react';
import { supabaseAuth } from '@/lib/supabase-auth';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

// Global singleton for auth state to prevent multiple subscriptions
let globalAuthState: AuthState = {
    user: null,
    session: null,
    loading: true,
    initialized: false,
};

let authSubscribers: Set<(state: AuthState) => void> = new Set();
let authSubscription: { unsubscribe: () => void } | null = null;
let isInitialized = false;

// Check if user is authenticated via localStorage (fallback for OTP auth)
function checkLocalAuth(): User | null {
  const userId = localStorage.getItem('userId');
  const phone = localStorage.getItem('phone');
  const username = localStorage.getItem('username');
  
  if (userId && phone) {
    // Create a mock user object for local auth
    return {
      id: userId,
      phone: phone,
      email: localStorage.getItem('email') || undefined,
      user_metadata: { username },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User;
  }
  return null;
}

// Initialize auth listener once globally
function initAuthListener() {
  if (isInitialized) return;
  isInitialized = true;

  // Get initial session
  supabaseAuth.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      console.warn('Error getting initial session:', error);
      // If there's an error, still check localStorage fallback
    }
    
    // Check Supabase session first, then fall back to local auth
    const supabaseUser = session?.user ?? null;
    const localUser = checkLocalAuth();
    const user = supabaseUser || localUser;
    
    globalAuthState = {
      user,
      session,
      loading: false,
      initialized: true,
    };
    notifySubscribers();
  }).catch((error) => {
    console.error('Failed to get initial session:', error);
    // On error, fall back to localStorage
    const localUser = checkLocalAuth();
    globalAuthState = {
      user: localUser,
      session: null,
      loading: false,
      initialized: true,
    };
    notifySubscribers();
  });

  // Listen to auth state changes
  const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange(async (event, session) => {
    // Skip INITIAL_SESSION events (expected on first load)
    if (event === 'INITIAL_SESSION') {
      return;
    }

    // Check Supabase session first, then fall back to local auth
    const supabaseUser = session?.user ?? null;
    const localUser = checkLocalAuth();
    
    // IMPORTANT: Preserve localStorage fallback when session becomes null due to token expiration
    // Only clear user if it's an explicit SIGNED_OUT event, not when session is null due to refresh failure
    let user: User | null = null;
    if (event === 'SIGNED_OUT') {
      // Explicit logout - clear everything
      user = null;
    } else if (supabaseUser) {
      // Supabase session is valid
      user = supabaseUser;
    } else if (localUser) {
      // Supabase session is null/expired, but localStorage has valid auth - preserve it
      // This prevents logout when token refresh fails temporarily
      user = localUser;
    }

    globalAuthState = {
      user,
      session,
      loading: false,
      initialized: true,
    };

    // Sync with localStorage - only update if we have a session, don't clear on null
    // This preserves our localStorage fallback for OTP auth
    if (session?.user) {
      localStorage.setItem('userId', session.user.id);
      if (session.user.email) {
        localStorage.setItem('email', session.user.email);
      }
      if (session.user.phone) {
        localStorage.setItem('phone', session.user.phone);
      }
    }
    // Only clear localStorage on explicit SIGNED_OUT event, not on null session
    // This is handled separately in the event switch below

    // Log significant events and handle sign out
    switch (event) {
      case 'SIGNED_IN':
        console.log('✅ User signed in:', session?.user?.id);
        break;
      case 'SIGNED_OUT':
        console.log('👋 User signed out');
        // Only clear localStorage on explicit sign out
        // Check if localStorage still has values before clearing (might already be cleared by clearAuthState)
        if (localStorage.getItem('userId')) {
          localStorage.removeItem('userId');
          localStorage.removeItem('email');
          localStorage.removeItem('phone');
          localStorage.removeItem('username');
        }
        break;
      case 'TOKEN_REFRESHED':
        console.log('🔄 Token refreshed');
        // Token was successfully refreshed - session should be valid
        break;
      case 'USER_UPDATED':
        console.log('👤 User updated');
        break;
      case 'PASSWORD_RECOVERY':
        console.log('🔐 Password recovery');
        break;
    }

    notifySubscribers();
  });

  authSubscription = subscription;
}

function notifySubscribers() {
  authSubscribers.forEach(callback => callback(globalAuthState));
}

// Function to refresh auth state (call after OTP verification)
export function refreshAuthState() {
  const localUser = checkLocalAuth();
  if (localUser && !globalAuthState.user) {
    globalAuthState = {
      user: localUser,
      session: null,
      loading: false,
      initialized: true,
    };
    notifySubscribers();
  }
}

// Function to clear auth state (call during logout)
export function clearAuthState() {
  // Clear localStorage
  localStorage.removeItem('userId');
  localStorage.removeItem('phone');
  localStorage.removeItem('email');
  localStorage.removeItem('username');
  
  // Clear global auth state
  globalAuthState = {
    user: null,
    session: null,
    loading: false,
    initialized: true,
  };
  notifySubscribers();
}

/**
 * Custom hook for Supabase authentication
 * Uses singleton pattern to prevent multiple subscriptions
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(globalAuthState);
  const isSubscribed = useRef(false);

  useEffect(() => {
    // Initialize listener if not already done
    initAuthListener();

    // Subscribe to auth state changes
    const updateState = (newState: AuthState) => {
      setAuthState(newState);
    };
    
    authSubscribers.add(updateState);
    
    // Immediately update with current state
    setAuthState(globalAuthState);

    return () => {
      // Remove this component's subscription when it unmounts
      authSubscribers.delete(updateState);
    };
  }, []);


  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    initialized: authState.initialized,
    isAuthenticated: !!authState.user,
    isEmailVerified: !!authState.user?.email_confirmed_at,
    isPhoneVerified: !!authState.user?.phone_confirmed_at,
  };
}

