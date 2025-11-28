import { useState, useEffect } from 'react';
import { supabaseAuth } from '@/lib/supabase-auth';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

/**
 * Custom hook for Supabase authentication
 * Follows best practices:
 * - Uses Supabase session management
 * - Listens to auth state changes
 * - Automatically refreshes tokens
 * - Provides loading states
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  });

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabaseAuth.auth.getSession();
        
        if (error) throw error;

        if (mounted) {
          setAuthState({
            user: session?.user ?? null,
            session,
            loading: false,
            initialized: true,
          });

          // Sync with localStorage for backward compatibility
          if (session?.user) {
            localStorage.setItem('userId', session.user.id);
            if (session.user.email) {
              localStorage.setItem('email', session.user.email);
            }
          } else {
            localStorage.removeItem('userId');
            localStorage.removeItem('email');
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            initialized: true,
          });
        }
      }
    };

    getInitialSession();

    // Listen to auth state changes (best practice: use Supabase's built-in listener)
    const {
      data: { subscription },
    } = supabaseAuth.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.id);

      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
        initialized: true,
      });

      // Sync with localStorage for backward compatibility
      if (session?.user) {
        localStorage.setItem('userId', session.user.id);
        if (session.user.email) {
          localStorage.setItem('email', session.user.email);
        }
        if (session.user.phone) {
          localStorage.setItem('phone', session.user.phone);
        }
      } else {
        // Clear auth data on sign out
        localStorage.removeItem('userId');
        localStorage.removeItem('email');
        localStorage.removeItem('phone');
        localStorage.removeItem('username');
        sessionStorage.clear();
      }

      // Handle specific auth events
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in');
          break;
        case 'SIGNED_OUT':
          console.log('User signed out');
          break;
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed');
          break;
        case 'USER_UPDATED':
          console.log('User updated');
          break;
        case 'PASSWORD_RECOVERY':
          console.log('Password recovery');
          break;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
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

