import { supabase } from "../supabaseConnection";

export default defineEventHandler(async (_event) => {
  try {
    const { data } = await supabase.auth.refreshSession();

    return data;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return undefined;
  }
});
