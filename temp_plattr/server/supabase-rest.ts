import "dotenv/config";

/**
 * Supabase REST API Client
 * Uses Supabase REST API with URL + Anon Key instead of direct PostgreSQL connection
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string; // Optional: for admin operations
}

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase REST API credentials must be set. Provide:\n" +
      "  - SUPABASE_URL (e.g., https://your-project.supabase.co)\n" +
      "  - SUPABASE_ANON_KEY or SUPABASE_KEY (your anon key)\n\n" +
      "Optional:\n" +
      "  - SUPABASE_SERVICE_ROLE_KEY (for admin operations)\n\n" +
      "Get these from: Supabase Dashboard → Settings → API"
    );
  }

  return { url: url.replace(/\/$/, ''), anonKey, serviceRoleKey };
}

// Lazy initialization - only get config when actually needed
// This allows the server to start even without Supabase credentials
// (useful for frontend-only development)
let config: SupabaseConfig | null = null;

function getConfig(): SupabaseConfig {
  if (!config) {
    config = getSupabaseConfig();
  }
  return config;
}

export interface SupabaseQueryOptions {
  select?: string;
  filter?: Record<string, string>;
  order?: string;
  limit?: number;
  offset?: number;
}

/**
 * Make a request to Supabase REST API
 */
async function supabaseRequest(
  table: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  options?: SupabaseQueryOptions,
  body?: any,
  useServiceRole = false
): Promise<any> {
  const cfg = getConfig();
  const baseUrl = `${cfg.url}/rest/v1/${table}`;
  const key = useServiceRole && cfg.serviceRoleKey ? cfg.serviceRoleKey : cfg.anonKey;
  
  // Build request using PostgREST format (curl --get with -d parameters)
  // For GET: curl --get with -d params become query parameters
  // For POST/PATCH: body is JSON, filters can be in query params
  
  const params = new URLSearchParams();
  
  // Build query parameters from options (filters are needed for GET, PATCH, and DELETE)
  if (options) {
    if (options.select && (method === 'GET' || method === 'PATCH')) {
      params.append('select', options.select);
    }
    
    // Filters are required for PATCH and DELETE (WHERE clause), and optional for GET
    if (options.filter && (method === 'GET' || method === 'PATCH' || method === 'DELETE')) {
      // Supabase PostgREST filter syntax (curl -d format)
      // Examples:
      //   column=eq.Equal+to        → params.append('column', 'eq.Equal+to')
      //   column=gt.Greater+than    → params.append('column', 'gt.Greater+than')
      //   column=cs.{array,contains} → params.append('column', 'cs.{array,contains}')
      //   column=in.(val1,val2)     → params.append('column', 'in.(val1,val2)')
      //   or=(col1.eq.val1,col2.eq.val2) → params.append('or', '(col1.eq.val1,col2.eq.val2)')
      Object.entries(options.filter).forEach(([key, value]) => {
        // Value already contains operator (e.g., 'eq.true', 'cs.{snacks}', 'in.(val1,val2)')
        params.append(key, value);
      });
    }
    
    if (options.order && method === 'GET') {
      // PostgREST order syntax: column.direction
      params.append('order', options.order);
    }
  }

  // Headers matching curl format
  const headers: HeadersInit = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Prefer': 'return=representation',
  };
  
  // Add Range header for pagination (equivalent to curl -H "Range: 0-9")
  if (options?.limit && method === 'GET') {
    const rangeEnd = (options.limit - 1).toString();
    headers['Range'] = `0-${rangeEnd}`;
  }
  
  // Build final URL with query parameters (curl --get with -d becomes query params)
  let requestUrl = baseUrl;
  if (params.toString()) {
    requestUrl += `?${params.toString()}`;
  }
  
  // Body for POST/PATCH requests (JSON format)
  let requestBody: string | undefined;
  if (method === 'POST' || method === 'PATCH') {
    headers['Content-Type'] = 'application/json';
    if (body) {
      requestBody = JSON.stringify(body);
    }
  }

  // Debug logging for PATCH/DELETE requests
  if (method === 'PATCH' || method === 'DELETE') {
    console.log(`🔧 [supabase-request] ${method} ${requestUrl}`);
    console.log(`🔧 [supabase-request] Query params:`, params.toString());
    console.log(`🔧 [supabase-request] Body:`, requestBody);
    console.log(`🔧 [supabase-request] Options filter:`, options?.filter);
  }

  // Make request matching curl format
  // GET: query parameters in URL + Range header for pagination
  // POST/PATCH: JSON body + query params for filters (if any)
  const response = await fetch(requestUrl, {
    method,
    headers,
    body: requestBody, // Only for POST/PATCH/DELETE
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase API error (${response.status}): ${errorText}`);
  }

  // Handle 204 No Content (for DELETE operations)
  if (response.status === 204) {
    return null;
  }

  // Handle empty responses
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
 * Supabase REST API Client
 */
export const supabase = {
  /**
   * Select data from a table
   */
  select: async <T = any>(table: string, options?: SupabaseQueryOptions, useServiceRole = false): Promise<T[]> => {
    return supabaseRequest(table, 'GET', options, undefined, useServiceRole);
  },

  /**
   * Select a single row
   */
  selectOne: async <T = any>(table: string, options?: SupabaseQueryOptions, useServiceRole = false): Promise<T | null> => {
    const results = await supabase.select<T>(table, { ...options, limit: 1 }, useServiceRole);
    return results[0] || null;
  },

  /**
   * Insert data
   */
  insert: async <T = any>(table: string, data: any, useServiceRole = false): Promise<T> => {
    return supabaseRequest(table, 'POST', undefined, data, useServiceRole);
  },

  /**
   * Update data
   */
  update: async <T = any>(table: string, filter: Record<string, string>, data: any, useServiceRole = false): Promise<T> => {
    const options: SupabaseQueryOptions = { filter };
    return supabaseRequest(table, 'PATCH', options, data, useServiceRole);
  },

  /**
   * Delete data
   */
  delete: async (table: string, filter: Record<string, string>, useServiceRole = false): Promise<void> => {
    const options: SupabaseQueryOptions = { filter };
    await supabaseRequest(table, 'DELETE', options, undefined, useServiceRole);
  },

  /**
   * Execute a custom query (using PostgREST query syntax)
   */
  query: async <T = any>(table: string, query: string): Promise<T[]> => {
    // For custom queries, we'll use the select method with filter
    // Format: "column.eq.value" or "column.gte.value" etc.
    const cfg = getConfig();
    const url = `${cfg.url}/rest/v1/${table}?${query}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': cfg.anonKey,
        'Authorization': `Bearer ${cfg.anonKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase query error: ${response.statusText}`);
    }

    return response.json();
  },
};

/**
 * Get Supabase configuration
 */
export function getSupabaseUrl(): string {
  return getConfig().url;
}

export function getSupabaseAnonKey(): string {
  return getConfig().anonKey;
}

