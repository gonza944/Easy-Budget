import { createUserSupabaseClient } from "../../../supabaseConnection";
import { ActivityBalancesSchema } from "~/types/sharedExpenses";

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

    // Call the Postgres function to calculate balances
    const { data, error } = await userSupabase
      .rpc('calculate_activity_balances', { 
        activity_id_param: Number(activityId) 
      });
    
    if (error) {
      console.error("Database error calculating activity balances:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to calculate activity balances",
      });
    }

    // Validate and return response
    return ActivityBalancesSchema.parse(data || []);
    
  } catch (error) {
    console.error("Error in activity balances GET endpoint:", error);
    
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
