import { requireSupabaseUser } from "~/server/utils/supabase";
import { DeleteSharedActivitySchema, type DeleteSharedActivityResponse } from "~/types/sharedExpenses";

export default defineEventHandler(async (event) => {
  try {
    const { supabase: userSupabase, user } = await requireSupabaseUser(event);

    // Validate request body
    const validatedData = await readValidatedBody(event, DeleteSharedActivitySchema.parse);
    const { id } = validatedData;


    // Delete related data in the correct order (child tables first)
    // 1. Delete settlement transactions
    const { error: settlementsError } = await userSupabase
      .from("settlement_transactions")
      .delete()
      .eq('activity_id', id);

    if (settlementsError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to delete settlement transactions: ${settlementsError.message}`,
      });
    }

    // 2. Delete shared expenses
    const { error: expensesError } = await userSupabase
      .from("shared_expenses")
      .delete()
      .eq('activity_id', id);

    if (expensesError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to delete shared expenses: ${expensesError.message}`,
      });
    }

    // 3. Delete activity participations
    const { error: participationsError } = await userSupabase
      .from("activity_participations")
      .delete()
      .eq('activity_id', id);

    if (participationsError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to delete activity participations: ${participationsError.message}`,
      });
    }

    // 4. Finally, delete the shared activity itself
    const { error: activityDeleteError } = await userSupabase
      .from("shared_activities")
      .delete()
      .eq('id', id);

    if (activityDeleteError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to delete shared activity: ${activityDeleteError.message}`,
      });
    }

    // Return success response
    const response: DeleteSharedActivityResponse = {
      success: true
    };
    
    return response;
  } catch (error) {
    console.error("Error deleting shared activity:", error);
    
    // If it's already an H3Error, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: error.message || "Invalid data format",
      });
    }
    
    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
