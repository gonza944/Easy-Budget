import { CategoriesArraySchema } from "~/types/category";
import { createUserSupabaseClient } from "../../supabaseConnection";


export default defineEventHandler(async (event) => {
  try {
    // Check authentication first
    const session = await getUserSession(event);
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized: Please log in",
      });
    }

    // Create authenticated Supabase client
    if (!session.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: "No access token found in session",
      });
    }
    
    const userSupabase = createUserSupabaseClient(session.accessToken);

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