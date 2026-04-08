import { CategoriesArraySchema } from "~/types/category";
import { requireSupabaseUser } from "~/server/utils/supabase";


export default defineEventHandler(async (event) => {
  try {
    const { supabase: userSupabase, user } = await requireSupabaseUser(event);

    // Query categories
    const { data, error } = await userSupabase
      .from("categories")
      .select()
      .order('name');

    if (error) {
      console.error("Database error fetching categories:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch categories from database",
      });
    }
    
    // Validate response with Zod schema
    const categories = CategoriesArraySchema.parse(data || []);
    return categories;
  } catch (error) {
    console.error("Error in categories GET endpoint:", error);
    
    // If it's already an H3Error, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid data format",
      });
    }
    
    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
}); 