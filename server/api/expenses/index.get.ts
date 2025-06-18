import { createUserSupabaseClient } from "../../supabaseConnection";
import { ExpensesArraySchema, ExpenseQuerySchema } from "~/types/expense";

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

    // Validate query parameters
    const query = getQuery(event);
    const validatedQuery = ExpenseQuerySchema.parse(query);
    const { budget_id, category_id, start_date, end_date, date } = validatedQuery;

    // Create authenticated Supabase client with user's access token
    if (!session.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: "No access token found in session",
      });
    }
    
    const userSupabase = createUserSupabaseClient(session.accessToken);

    // Build the query with base filters - RLS will now work with authenticated user
    let supabaseQuery = userSupabase.from("expenses").select();
    
    // Apply filters (no need for explicit user_id filter with authenticated client)
    supabaseQuery = supabaseQuery.eq('budget_id', budget_id);
    
    if (category_id) {
      supabaseQuery = supabaseQuery.eq('category_id', category_id);
    }
    
    // Apply date filters
    if (date) {
      // Use PostgreSQL's date casting to compare just the date portion of timestamp
      supabaseQuery = supabaseQuery.filter('date::date', 'eq', date);
    } else if (start_date) {
      supabaseQuery = supabaseQuery.gte('date', start_date);
      
      if (end_date) {
        supabaseQuery = supabaseQuery.lte('date', end_date);
      }
    }

    // Order by date descending (newest first)
    supabaseQuery = supabaseQuery.order('date', { ascending: false });
    
    // Execute query
    const { data, error } = await supabaseQuery;
    
    if (error) {
      console.error("[expenses] Database error fetching expenses:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch expenses from database",
      });
    }

    // Validate and return response
    const validatedData = ExpensesArraySchema.parse(data || []);
    return validatedData;
    
  } catch (error) {
    console.error("Error in expenses GET endpoint:", error);
    
    // If it's already an H3Error, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      console.error("Validation error details:", error.message);
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid query parameters",
      });
    }
    
    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
}); 