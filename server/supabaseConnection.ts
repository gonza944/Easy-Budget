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
      persistSession: true // Important for server-side usage
    },
  }
);;
