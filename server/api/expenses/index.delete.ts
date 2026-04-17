import { requireSupabaseUser } from "~/server/utils/supabase";
import { DeleteExpenseSchema } from '~/types/expense';
import type { DeleteResponse } from '~/types/expense';

export default defineEventHandler(async (event) => {
  try {
    const { supabase: userSupabase, user } = await requireSupabaseUser(event);

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