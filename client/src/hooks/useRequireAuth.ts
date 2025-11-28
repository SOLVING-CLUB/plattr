import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from './useAuth';

/**
 * Hook to protect routes that require authentication
 * Redirects to auth page if user is not authenticated
 */
export function useRequireAuth(redirectTo = '/test-auth') {
  const { isAuthenticated, loading, initialized } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (initialized && !loading && !isAuthenticated) {
      setLocation(redirectTo, { replace: true });
    }
  }, [isAuthenticated, loading, initialized, redirectTo, setLocation]);

  return {
    isAuthenticated,
    loading: loading || !initialized,
  };
}

