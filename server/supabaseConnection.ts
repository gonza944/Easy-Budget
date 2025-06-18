import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL) {
  throw new Error("Environment variable SUPABASE_URL is not defined.");
}
if (!process.env.SUPABASE_KEY) {
  throw new Error("Environment variable SUPABASE_KEY is not defined.");
}

// Default client with anon key (for public operations)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false // Important for server-side usage
    },
    db: {
      schema: 'public'
    },
    // Add some timeout configurations for production
    realtime: {
      timeout: 20000
    }
  }
);

// Service role client (bypasses RLS) - add this environment variable
export const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      }
    )
  : null;

// Function to create authenticated client for specific user (alternative approach)
export function createUserSupabaseClient(accessToken: string) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    }
  );
}

// Utility function to test database connection
export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('budgets')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Database connection test error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
