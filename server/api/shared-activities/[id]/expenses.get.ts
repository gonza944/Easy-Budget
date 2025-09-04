import { createUserSupabaseClient } from "../../../supabaseConnection";
import { z } from "zod";
import { SharedExpenseWithMemberSchema } from "~/types/sharedExpenses";

// Response schema for array of shared expenses
const SharedExpensesArraySchema = z.array(SharedExpenseWithMemberSchema);

export default defineEventHandler(async (event) => {
  try {
    const activityId = getRouterParam(event, 'id');
    
    if (!activityId || isNaN(Number(activityId))) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid activity ID",
      });
    }

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
    
    const userSupabase = createUserSupabaseClient(session.accessToken as string);

    // Get all shared expenses from the activity with member and category info
    const { data, error } = await userSupabase
      .from("shared_expenses")
      .select(`
        id,
        activity_id,
        paid_by_member_id,
        name,
        amount,
        description,
        date,
        category_id,
        split_calculation,
        created_at,
        updated_at,
        paid_by_member:members!paid_by_member_id(
          id,
          email,
          display_name,
          user_id,
          created_at,
          updated_at
        ),
        category:categories(
          id,
          name
        )
      `)
      .eq('activity_id', Number(activityId))
      .order('date', { ascending: false });
    
    if (error) {
      console.error("Database error fetching shared expenses:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch shared expenses from database",
      });
    }

    // Validate and return response
    return SharedExpensesArraySchema.parse(data || []);
    
  } catch (error) {
    console.error("Error in shared expenses GET endpoint:", error);
    
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
