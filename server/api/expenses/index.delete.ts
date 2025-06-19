import { createUserSupabaseClient } from "../../supabaseConnection";
import { DeleteExpenseSchema } from '~/types/expense';
import type { DeleteResponse } from '~/types/expense';

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

    // Validate request body
    const validatedData = await readValidatedBody(event, DeleteExpenseSchema.parse);
    const { id } = validatedData;

    // Delete the expense
    const { error } = await userSupabase
      .from("expenses")
      .delete()
      .eq('id', id);

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message,
      });
    }

    // Validate and return response
    const response: DeleteResponse = {
      success: true
    };
    
    return response;
  } catch (error) {
    console.error("Error deleting expense:", error);
    
    // Ensure error response matches our schema
    const errorResponse: DeleteResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    
    return errorResponse;
  }
}); 