import "dotenv/config";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check if using Supabase REST API (preferred if credentials are available)
const useRestAPI = !!(process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY));

// Construct database URL from various sources (fallback for direct PostgreSQL)
function getDatabaseUrl(): string | null {
  // Option 1: Direct database URL (full connection string)
  if (process.env.SUPABASE_DATABASE_URL) {
    return process.env.SUPABASE_DATABASE_URL;
  }
  
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Option 2: Supabase URL + Password (construct connection string)
  const supabaseUrl = process.env.SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  
  if (supabaseUrl && dbPassword) {
    // Extract project reference from Supabase URL
    // e.g., https://leltckltotobsibixhqo.supabase.co -> leltckltotobsibixhqo
    const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
    if (urlMatch) {
      const projectRef = urlMatch[1];
      return `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;
    }
  }
  
  return null;
}

// Only initialize direct PostgreSQL connection if not using REST API
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (!useRestAPI) {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    console.warn(
      "⚠️  No direct database connection configured.\n" +
      "💡 Using Supabase REST API is recommended. Set:\n" +
      "   - SUPABASE_URL\n" +
      "   - SUPABASE_ANON_KEY or SUPABASE_KEY\n\n" +
      "Alternatively, provide database connection:\n" +
      "   - SUPABASE_DATABASE_URL (full connection string)\n" +
      "   - SUPABASE_URL + SUPABASE_DB_PASSWORD\n" +
      "   - DATABASE_URL"
    );
  } else {
    pool = new Pool({ connectionString: databaseUrl });
    db = drizzle({ client: pool, schema });
  }
} else {
  console.log("✅ Using Supabase REST API (SUPABASE_URL + SUPABASE_ANON_KEY)");
}

export { pool, db };
