import { refreshSupabaseAuthIfNeeded } from "~/server/utils/supabase";

export default defineEventHandler(async (event) => {
  try {
    await refreshSupabaseAuthIfNeeded(event);
  } catch (error) {
    console.error("Supabase auth middleware error:", error);
  }
});
