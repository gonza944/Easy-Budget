import { supabase } from "../supabaseConnection";

export default defineEventHandler(async (event) => {
  const { data, error } = await supabase.from("instruments").select();
  if (error) {
    return {
      statusCode: 500,
      body: { message: "Failed to fetch instruments", error: error.message },
    };
  }
  return data;
});
