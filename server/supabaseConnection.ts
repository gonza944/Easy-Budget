import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL) {
  throw new Error("Environment variable SUPABASE_URL is not defined.");
}
if (!process.env.SUPABASE_KEY) {
  throw new Error("Environment variable SUPABASE_KEY is not defined.");
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
