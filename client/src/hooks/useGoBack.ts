import { useLocation } from 'wouter';
import { useCallback } from 'react';

/**
 * Hook for logical back navigation using browser history
 * Falls back to a provided path or default navigation logic if no history exists
 */
export function useGoBack(fallbackPath?: string) {
  const [location, setLocation] = useLocation();

  const goBack = useCallback(() => {
    // Check if we have browser history to go back to
    // We check if history length > 1 OR if there's a previous entry in the history state
    const hasHistory = window.history.length > 1;
    
    // Try to use browser history first
    if (hasHistory && !fallbackPath) {
      // Use browser history if available and no specific fallback
      window.history.back();
      return;
    }

    // If fallback path is provided, use it
    if (fallbackPath) {
      setLocation(fallbackPath);
      return;
    }

    // Default fallback logic based on current location
    const backNavigationMap: Record<string, string> = {
      '/categories/tiffins': '/',
      '/categories/snacks': '/',
      '/categories/lunch-dinner': '/',
      '/profile': '/',
      '/help': '/profile',
      '/about': '/profile',
      '/referral': '/profile',
      '/corporate': '/',
      '/orders': '/profile',
      '/checkout': '/',
      '/add-ons': '/checkout',
      '/payment': '/checkout',
      '/order-confirmation': '/orders',
    };

    // Check if current path matches any specific route
    let navigateTo = backNavigationMap[location];

    // Handle dynamic routes
    if (!navigateTo) {
      if (location.startsWith('/dishes/')) {
        const mealType = location.split('/')[2];
        navigateTo = `/categories/${mealType}`;
      } else if (location.startsWith('/planner/')) {
        const mealType = location.split('/')[2];
        navigateTo = `/categories/${mealType}`;
      } else if (location.startsWith('/categories/')) {
        navigateTo = '/';
      } else if (location.startsWith('/orders/')) {
        navigateTo = '/orders';
      } else if (location.startsWith('/concierge/results') || location.startsWith('/concierge-results')) {
        navigateTo = '/concierge';
      } else {
        // Default: go to home
        navigateTo = '/';
      }
    }

    setLocation(navigateTo);
  }, [location, setLocation, fallbackPath]);

  return goBack;
}

