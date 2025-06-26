import { createUserSupabaseClient } from "~/server/supabaseConnection";
import { ExpensesBurnDownQuerySchema } from "~/types/metrics";
import { formatDateToUTCISOString } from "~/utils/date";

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

    // Validate query parameters
    const validatedQuery = await getValidatedQuery(
      event,
      ExpensesBurnDownQuerySchema.parse
    );

    // Call the edge function with the validated parameters
    const { data, error } = await userSupabase.functions.invoke('expenses-burn-down', {
      body: {
        initial_date: formatDateToUTCISOString(validatedQuery.initial_date),
        final_date: formatDateToUTCISOString(validatedQuery.final_date),
        budget_id: validatedQuery.budget_id,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      throw createError({
        statusCode: 500,
        statusMessage: `Error calling edge function: ${error.message}`,
      });
    }

    // Return the data from the edge function
    return data;
    
  } catch (error) {
    console.error('Error in expenses burn down API:', error);
    
    // If it's already a createError, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    // Otherwise, create a generic error
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch expenses burn down: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
});
