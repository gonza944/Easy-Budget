import { z } from "zod";

import { supabase } from "~/server/supabaseConnection";
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

    // Query expenses for the budget
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('budget_id', budget_id);
      
    if (expensesError) {
      console.error("Database error fetching expenses:", expensesError);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch expenses from database",
      });
    }
    
    // Query budget information
    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('startingBudget')
      .eq('id', budget_id)
      .single();
      
    if (budgetError) {
      console.error("Database error fetching budget:", budgetError);
      throw createError({
        statusCode: budgetError.code === 'PGRST116' ? 404 : 500,
        statusMessage: budgetError.code === 'PGRST116' ? "Budget not found" : "Failed to fetch budget from database",
      });
    }

    const validateStartingBudget = z.number().parse(budgetData.startingBudget); 
    
    // Sum up all expenses
    const monthlyExpenses = (expenses || []).reduce(
      (sum, expense) => sum + (Number(expense.amount) || 0), 
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
