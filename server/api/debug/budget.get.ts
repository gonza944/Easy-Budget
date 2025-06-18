import { supabase } from "../../supabaseConnection";

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

    const query = getQuery(event);
    const debugBudgetId = query.budget_id as string | undefined;

    // Get all budgets for debugging
    const { data: allBudgets, error: allBudgetsError } = await supabase
      .from('budgets')
      .select('id, name, startingBudget, maxExpensesPerDay');

    if (allBudgetsError) {
      console.error("Error fetching all budgets:", allBudgetsError);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch budgets",
      });
    }

    let specificBudget = null;
    let specificBudgetError = null;

    // If a specific budget_id is provided, try to fetch it
    if (debugBudgetId) {
      const numericId = Number(debugBudgetId);
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', numericId)
        .single();

      specificBudget = data;
      specificBudgetError = error;
    }

    return {
      debugInfo: {
        totalBudgets: allBudgets?.length || 0,
        requestedBudgetId: debugBudgetId,
        requestedBudgetIdType: typeof debugBudgetId,
        numericBudgetId: debugBudgetId ? Number(debugBudgetId) : null,
      },
      allBudgets: allBudgets || [],
      specificBudget: {
        found: !!specificBudget,
        data: specificBudget,
        error: specificBudgetError ? {
          code: specificBudgetError.code,
          message: specificBudgetError.message,
          details: specificBudgetError.details
        } : null
      }
    };

  } catch (error) {
    console.error("Debug endpoint error:", error);
    
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
}); 