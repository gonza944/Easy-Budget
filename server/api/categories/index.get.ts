import { CategoriesArraySchema } from "~/types/category";
import { supabase } from "../../supabaseConnection";


export default defineEventHandler(async () => {
  try {
    // Query categories
    const { data, error } = await supabase
      .from("categories")
      .select()
      .order('name');

    if (error) {
      throw new Error(error.message);
    }
    
    // Validate response with Zod schema
    const categories = CategoriesArraySchema.parse(data);
    return categories;
  } catch (error) {
    return {
      statusCode: 500,
      body: { 
        message: "Failed to fetch categories", 
        error: error instanceof Error ? error.message : String(error) 
      },
    };
  }
}); 