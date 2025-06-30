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

    const body = await readBody(event);
    const budgetId = Number(body.budgetId);

    if (!budgetId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Budget ID is required",
      });
    }

    // First, unselect all budgets for this user
    const { error: unselectError } = await userSupabase
      .from('budgets')
      .update({ selected: false })
      .eq('user_id', session.user.id);

    if (unselectError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Error unselecting budgets: ${unselectError.message}`,
      });
    }

    // Then, select the specified budget
    const { data: selectedBudget, error: selectError } = await userSupabase
      .from('budgets')
      .update({ selected: true })
      .eq('id', budgetId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (selectError) {
      throw createError({
        statusCode: 500,
        statusMessage: `Error selecting budget: ${selectError.message}`,
      });
    }

    if (!selectedBudget) {
      throw createError({
        statusCode: 404,
        statusMessage: "Budget not found or you don't have permission to select it",
      });
    }

    return { success: true, budget: selectedBudget };
  } catch (error) {
    console.error("Error in budget select endpoint:", error);
    
    // If it's already an H3Error, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
}); 