import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase, mapApiRouteToSupabase } from "@/lib/supabase-client";
import { supabaseAuth } from "@/lib/supabase-auth";
import { getApiUrl } from "@/config/api";
import { Capacitor, CapacitorHttp, type HttpOptions } from "@capacitor/core";

// Use direct Supabase REST API
const USE_DIRECT_SUPABASE = true;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const route = url.split('/').filter(Boolean);
  
  // Auth routes and other backend-only routes should always go to backend
  const backendOnlyRoutes = ['api/auth', 'api/orders', 'api/cart', 'api/corporate', 'api/figma', 'api/catering-orders', 'api/user', 'api/addresses'];
  const isBackendRoute = backendOnlyRoutes.some(backendRoute => 
    url.includes(backendRoute)
  );
  
  // For direct Supabase, map the URL to Supabase REST API (only for non-auth routes)
  if (USE_DIRECT_SUPABASE && !isBackendRoute) {
    // Handle cart locally (no backend/cart API when using direct Supabase)
    if (route[0] === 'api' && route[1] === 'cart') {
      // Emulate success so UI can fall back to localStorage cart
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    
    try {
      const mapped = mapApiRouteToSupabase(route);
      
      if (method === 'GET') {
        const result = await supabase.select(mapped.table, mapped.options);
        return new Response(JSON.stringify(result), { status: 200 });
      } else if (method === 'POST') {
        const result = await supabase.insert(mapped.table, data);
        return new Response(JSON.stringify(result), { status: 200 });
      }
    } catch (error) {
      // If Supabase mapping fails, fall through to backend
      console.warn('Supabase mapping failed, falling back to backend:', error);
    }
  }
  
  // Use backend API for auth routes and fallback
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  
  // Add Supabase Auth token if available
  try {
    const { data: { session } } = await supabaseAuth.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
  } catch (error) {
    // Supabase auth not available, continue without token
  }
  
  // Use getApiUrl to construct the proper backend URL
  const apiUrl = getApiUrl(url);
  console.log('[apiRequest] Original URL:', url, '→ Constructed URL:', apiUrl);

  const isNative = typeof window !== "undefined" && Capacitor?.isNativePlatform?.();

  if (isNative) {
    try {
      const httpOptions: HttpOptions = {
        url: apiUrl,
        method: method as any,
        headers: headers as Record<string, string>,
        webFetchExtra: {
          credentials: "include",
        },
      };

      if (data !== undefined && method !== "GET") {
        httpOptions.data = data as any;
      }

      const nativeResponse = await CapacitorHttp.request(httpOptions);
      const responseBody =
        typeof nativeResponse.data === "string"
          ? nativeResponse.data
          : JSON.stringify(nativeResponse.data);

      if (nativeResponse.status < 200 || nativeResponse.status >= 300) {
        throw new Error(`${nativeResponse.status}: ${responseBody}`);
      }

      return new Response(responseBody, {
        status: nativeResponse.status,
        headers: nativeResponse.headers as HeadersInit,
      });
    } catch (error) {
      console.error("[apiRequest:native] Request failed:", {
        url: apiUrl,
        method,
        error,
      });
      throw error;
    }
  }
  
  const res = await fetch(apiUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> => {
  const { on401: unauthorizedBehavior } = options;
  return async ({ queryKey }) => {
    try {
      const route = queryKey as string[];
      const url = route.join("/");
      
      // Check if this is a backend-only route (skip Supabase mapping)
      const backendOnlyRoutes = ['api/auth', 'api/orders', 'api/cart', 'api/corporate', 'api/figma', 'api/catering-orders', 'api/user', 'api/addresses'];
      const isBackendRoute = backendOnlyRoutes.some(backendRoute => 
        url.includes(backendRoute)
      );
      
      // If it's a backend route, skip Supabase and go directly to backend
      if (isBackendRoute) {
        const apiUrl = getApiUrl(url);
        const res = await fetch(apiUrl, {
          credentials: 'include',
        });

        console.log('[API Response]', url, 'Status:', res.status, 'OK:', res.ok);

        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null as T;
        }

        await throwIfResNotOk(res);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          console.log('[API Data]', url, 'Items:', data.length, 'Sample:', JSON.stringify(data.slice(0, 2)));
        } else {
          console.log('[API Data]', url, 'Data:', JSON.stringify(data));
        }
        
        return data as T;
      }
      
      // Use direct Supabase REST API for other routes
      if (USE_DIRECT_SUPABASE) {
        // Handle cart locally: return null to trigger localStorage usage in UI
        if (route[0] === '/api/cart' || route[1] === 'cart') {
          return null as T;
        }
        const mapped = mapApiRouteToSupabase(route);
        
        console.log('[Supabase Direct]', route.join('/'), '→', mapped.table, mapped.options);
        
        let result;
        
        // Special handling for dish-types (need to extract unique values)
        if (route[0] === '/api/dish-types' || route[0]?.includes('dish-types')) {
          const categoryId = route[2] || route[1];
          if (categoryId && categoryId !== 'all') {
            const dishes = await supabase.select('dishes', {
              select: 'dish_type',
              filter: { 'category_id': `eq.${categoryId}` }
            });
            result = Array.from(new Set(
              dishes
                .map((d: any) => d.dish_type)
                .filter((type: any) => type !== null && type !== undefined)
            )).sort();
          } else {
            result = [];
          }
        } else if (route[0] === '/api/dishes' || route[0]?.includes('dishes')) {
          const mealType = route[1];
          const categoryId = route[2];
          // If category is 'all' or empty, filter dishes by categories of this mealType
          if (!categoryId || categoryId === 'all') {
            // Fetch categories for this mealType
            const categories = await supabase.select('categories', {
              select: 'id',
              filter: { 'meal_type': `eq.${mealType}` },
              order: 'display_order.asc'
            });
            const ids = (categories as Array<{ id: string }>).map(c => c.id).filter(Boolean);
            const inList = ids.length > 0 ? `in.(${ids.join(',')})` : undefined;
            const options = { ...mapped.options } as any;
            options.filter = options.filter ? { ...options.filter } : {};
            // Remove meal_type filter if present
            if (options.filter['meal_type']) delete options.filter['meal_type'];
            if (inList) options.filter['category_id'] = inList;
            result = await supabase.select('dishes', options);
          } else {
            result = await supabase.select(mapped.table, mapped.options);
          }
        } else {
          result = await supabase.select(mapped.table, mapped.options);
        }
        
        console.log('[Supabase Data]', route.join('/'), Array.isArray(result) ? `Items: ${result.length}` : 'Data:', result);
        
        return result as T;
      }
      
      // Fallback: use backend API (url is already declared above)
      const apiUrl = getApiUrl(url);
      const res = await fetch(apiUrl, {
        credentials: 'include',
      });

      console.log('[API Response]', url, 'Status:', res.status, 'OK:', res.ok);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null as T;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        console.log('[API Data]', url, 'Dishes:', data.length, 'Sample:', JSON.stringify(data.slice(0, 2)));
      } else {
        console.log('[API Data]', url, 'Data:', JSON.stringify(data));
      }
      
      return data as T;
    } catch (error) {
      console.error('[API Error]', {
        route: queryKey.join('/'),
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
