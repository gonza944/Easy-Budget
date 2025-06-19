import { z } from 'zod';
import { createUserSupabaseClient } from "../../supabaseConnection";

// Define the schema for delete request
const deleteBudgetSchema = z.object({
  id: z.number(),
});

// Define API response type
export type DeleteBudgetApiResponse = {
  success: boolean;
  error?: string;
};

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

    // Validate the request body containing the budget ID
    const { id } = await readValidatedBody(event, deleteBudgetSchema.parse);

    // Delete the budget with the provided ID
    const { error } = await userSupabase
      .from("budgets")
      .delete()
      .eq('id', id);

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message,
      });
    }

    return {
      success: true,
    } satisfies DeleteBudgetApiResponse;
  } catch (error) {
    console.error("Error deleting budget:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    } satisfies DeleteBudgetApiResponse;
  }
}); 