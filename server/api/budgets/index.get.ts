import { BudgetsSchema, type BudgetsResponse } from "~/utils/budgetSchemas";
import { createUserSupabaseClient } from "../../supabaseConnection";

export default defineEventHandler<Promise<BudgetsResponse>>(async (event) => {
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

    const query = getQuery(event);
    const nameFilter = query.name as string | undefined;

    let supabaseQuery = userSupabase.from("budgets").select().order("created_at", { ascending: false });

    // Apply name filter if provided
    if (nameFilter) {
      supabaseQuery = supabaseQuery.ilike("name", `%${nameFilter}%`);
    }

    const { data, error } = await supabaseQuery;
    
    if (error) {
      console.error("Database error fetching budgets:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch budgets from database",
      });
    }

    const budgets = BudgetsSchema.parse(data || []);
    return budgets;
  } catch (error) {
    console.error("Error in budgets GET endpoint:", error);
    
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
