import { supabase } from "../supabaseConnection";

export default defineEventHandler(async (event) => {
  const { data } = await supabase.from("instruments").select();
    return data;
});
