import { z } from "zod";
import { createUserSupabaseClient } from "~/server/supabaseConnection";
import { RemainingBudgetQuerySchema } from "~/types/metrics";

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

    // Validate query parameters
    const validatedQuery = await getValidatedQuery(event, RemainingBudgetQuerySchema.parse);
    const { budget_id } = validatedQuery;

    // Create authenticated Supabase client
    if (!session.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: "No access token found in session",
      });
    }
    
    const userSupabase = createUserSupabaseClient(session.accessToken);

    // Query expenses for the budget
    const { data: expenses, error: expensesError } = await userSupabase
      .from('expenses')
      .select('amount, id, budget_id, date, name')
      .eq('budget_id', budget_id);
      
    if (expensesError) {
      console.error("[remainingBudget] Database error fetching expenses:", expensesError);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch expenses from database",
      });
    }
    
    // Query budget information
    const { data: budgetData, error: budgetError } = await userSupabase
      .from('budgets')
      .select('startingBudget, id, name')
      .eq('id', budget_id)
      .single();
      
    if (budgetError) {
      console.error(`[remainingBudget] Database error fetching budget:`, budgetError);
      
      if (budgetError.code === 'PGRST116') {
        throw createError({
          statusCode: 404,
          statusMessage: `Budget with ID ${budget_id} not found`,
        });
      } else {
        throw createError({
          statusCode: 500,
          statusMessage: "Failed to fetch budget from database",
        });
      }
    }

    const validateStartingBudget = z.number().parse(budgetData.startingBudget); 
    
    // Sum up all expenses
    const monthlyExpenses = (expenses || []).reduce(
      (sum: number, expense: { amount: string | number }) => sum + (Number(expense.amount) || 0), 
      0
    );
    
    // Calculate remaining budget
    const remainingBudget = validateStartingBudget - monthlyExpenses;
    
    return z.number().parse(remainingBudget);
    
  } catch (error) {
    console.error("Error calculating remaining budget:", error);

    // If it's already an H3Error, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      console.error("Validation error details:", error.message);
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid query parameters or data format",
      });
    }
    
    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
