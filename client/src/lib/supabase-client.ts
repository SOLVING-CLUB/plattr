/**
 * Client-side Supabase REST API Client
 * Direct Supabase REST API calls from frontend
 */

// Supabase configuration (from environment or hardcoded for client)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://leltckltotobsibixhqo.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlbHRja2x0b3RvYnNpYml4aHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNzc5ODEsImV4cCI6MjA3NTk1Mzk4MX0._IrMgGQDJB7OvKEoT7pwWG9AjN6aeN1ejnj8IViDLyE';

export interface SupabaseQueryOptions {
  select?: string;
  filter?: Record<string, string>;
  order?: string;
  limit?: number;
  offset?: number;
}

/**
 * Make a request to Supabase REST API (client-side)
 */
async function supabaseRequest(
  table: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  options?: SupabaseQueryOptions,
  body?: any
): Promise<any> {
  const baseUrl = `${SUPABASE_URL}/rest/v1/${table}`;
  
  // Build query parameters (curl --get with -d format)
  const params = new URLSearchParams();
  
  if (method === 'GET' && options) {
    if (options.select) {
      params.append('select', options.select);
    }
    
    if (options.filter) {
      // PostgREST filter syntax
      Object.entries(options.filter).forEach(([key, value]) => {
        params.append(key, value);
      });
    }
    
    if (options.order) {
      params.append('order', options.order);
    }
  }

  // Headers matching curl format
  const headers: HeadersInit = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Prefer': 'return=representation',
  };
  
  // Add Range header for pagination
  if (options?.limit && method === 'GET') {
    const rangeEnd = (options.limit - 1).toString();
    headers['Range'] = `0-${rangeEnd}`;
  }
  
  // Build final URL with query parameters
  let requestUrl = baseUrl;
  if (params.toString()) {
    requestUrl += `?${params.toString()}`;
  }
  
  // Body for POST/PATCH requests
  let requestBody: string | undefined;
  if (method === 'POST' || method === 'PATCH') {
    headers['Content-Type'] = 'application/json';
    if (body) {
      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(requestUrl, {
    method,
    headers,
    body: requestBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase API error (${response.status}): ${errorText}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Supabase REST API Client (client-side)
 */
export const supabase = {
  /**
   * Select data from a table
   */
  select: async <T = any>(table: string, options?: SupabaseQueryOptions): Promise<T[]> => {
    return supabaseRequest(table, 'GET', options);
  },

  /**
   * Select a single row
   */
  selectOne: async <T = any>(table: string, options?: SupabaseQueryOptions): Promise<T | null> => {
    const results = await supabase.select<T>(table, { ...options, limit: 1 });
    return results[0] || null;
  },

  /**
   * Insert data
   */
  insert: async <T = any>(table: string, data: any): Promise<T> => {
    return supabaseRequest(table, 'POST', undefined, data);
  },

  /**
   * Update data
   */
  update: async <T = any>(table: string, filter: Record<string, string>, data: any): Promise<T> => {
    const options: SupabaseQueryOptions = { filter };
    return supabaseRequest(table, 'PATCH', options, data);
  },

  /**
   * Delete data
   */
  delete: async (table: string, filter: Record<string, string>): Promise<void> => {
    const options: SupabaseQueryOptions = { filter };
    await supabaseRequest(table, 'DELETE', options);
  },
};

/**
 * Map API routes to Supabase table queries
 * Route format: ['/api/dishes', 'tiffins', 'all', 'veg'] or ['/api/categories', 'snacks']
 */
export function mapApiRouteToSupabase(route: string[]): { table: string; options?: SupabaseQueryOptions } {
  // Route format: ['/api/dishes', 'tiffins', 'all', 'veg'] or ['/api/dishes', 'tiffins', 'all']
  const endpoint = route[0]; // '/api/dishes', '/api/categories', etc.
  const mealType = route[1]; // 'tiffins', 'snacks', etc.
  const categoryId = route[2]; // 'all', categoryId, or undefined
  const dietaryFilter = route[3]; // 'all', 'veg', 'non-veg', 'egg' or undefined
  
  // Map meal type names
  // Map UI route segment to categories.meal_type (text)
  const mealTypeMap: Record<string, string> = {
    'tiffins': 'tiffins',
    'snacks': 'snacks',
    'lunch-dinner': 'lunch-dinner',
    'breakfast': 'breakfast'
  };

  // Map UI route segment to dishes.meal_type (text[])
  // In your CSV, dishes.meal_type uses 'breakfast' | 'snacks' | 'lunch-dinner'
  const dishesMealTypeMap: Record<string, string> = {
    'tiffins': 'breakfast',
    'snacks': 'snacks',
    'lunch-dinner': 'lunch-dinner',
    'breakfast': 'breakfast'
  };
   
  const dbMealType = mealTypeMap[mealType || ''] || mealType;
  
  // Build base filter for dishes
  const buildDishFilters = (): Record<string, string> => {
    const filters: Record<string, string> = {};

    // Filter by dishes.meal_type treating it as JSON array for compatibility
    // PostgREST json array contains syntax: cs.["value"]
    const dishesMealType = dishesMealTypeMap[mealType || ''] || mealType;
    if (dishesMealType) {
      const jsonArray = `[\"${dishesMealType}\"]`;
      filters['meal_type'] = `cs.${jsonArray}`;
    }
    
    // Add dietary filter (veg, non-veg) - note: egg filter is done client-side
    if (dietaryFilter && dietaryFilter !== 'all' && dietaryFilter !== 'egg') {
      // Map filter names to database values
      // Database uses: 'Non-Veg' (capitalized with hyphen), 'Veg' (capitalized)
      const dietaryMap: Record<string, string> = {
        'veg': 'Veg',           // Database uses 'Veg' (capitalized)
        'non-veg': 'Non-Veg'    // Database uses 'Non-Veg' (capitalized with hyphen)
      };
      const dbDietaryType = dietaryMap[dietaryFilter];
      if (dbDietaryType) {
        // PostgREST filter: dietary_type=eq.Non-Veg or dietary_type=eq.Veg
        filters['dietary_type'] = `eq.${dbDietaryType}`;
      }
    }
    
    return filters;
  };
  
  switch (endpoint) {
    case '/api/categories':
      // If fetching all categories, don't filter by meal_type
      if (mealType === 'all') {
        return {
          table: 'categories',
          options: {
            select: '*',
            order: 'display_order.asc'
          }
        };
      }
      // Otherwise filter by meal_type
      return {
        table: 'categories',
        options: {
          select: '*',
          filter: { 'meal_type': `eq.${dbMealType}` },
          order: 'display_order.asc'
        }
      };
      
    case '/api/dishes':
      if (categoryId === 'all' || !categoryId) {
        return {
          table: 'dishes',
          options: {
            select: '*',
            filter: buildDishFilters(),
            order: 'name.asc'
          }
        };
      } else {
        // Check if it's a plan type
        if (['basic', 'gold', 'platinum'].includes(categoryId)) {
          return {
            table: 'dishes',
            options: {
              select: '*',
              filter: buildDishFilters(),
              order: 'name.asc'
            }
          };
        }
        // Pseudo categories (no direct mapping in dishes.category_id) → ignore category filter
        const pseudoCategoryIds = new Set([
          'south-indian-tiffins',
          'north-indian-tiffins',
          'quick-bites'
        ]);

        const filters = buildDishFilters();
        // When filtering by a specific category, rely on category only (remove meal_type to avoid conflicts)
        if (filters['meal_type']) delete filters['meal_type'];
        if (!pseudoCategoryIds.has(categoryId)) {
          filters['category_id'] = `eq.${categoryId}`;
        }
        return {
          table: 'dishes',
          options: {
            select: '*',
            filter: filters,
            order: 'name.asc'
          }
        };
      }
      
    case '/api/add-ons':
      return {
        table: 'add_ons',
        options: {
          select: '*',
          filter: { 'is_available': 'eq.true' },
          order: 'name.asc'
        }
      };
      
    case '/api/dish-types':
      // This requires a separate query - get dishes and extract unique dish_type
      return {
        table: 'dishes',
        options: {
          select: 'dish_type',
          filter: { 'category_id': `eq.${categoryId}` }
        }
      };
      
    default:
      throw new Error(`Unknown API route: ${endpoint}`);
  }
}

