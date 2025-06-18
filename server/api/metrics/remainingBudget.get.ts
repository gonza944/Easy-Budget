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

    // Debug logging for production troubleshooting
    console.log(`[remainingBudget] Processing request for budget_id: ${budget_id} (type: ${typeof budget_id})`);
    console.log(`[remainingBudget] User session:`, { userId: session.user?.id, email: session.user?.email });

    // Query expenses for the budget with detailed logging
    console.log(`[remainingBudget] Querying expenses with filter: budget_id = ${budget_id}`);
    
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, id, budget_id, date, name')
      .eq('budget_id', budget_id);
      
    // Log the raw response from expenses query
    console.log(`[remainingBudget] Expenses query response:`, {
      success: !expensesError,
      error: expensesError,
      dataLength: expenses?.length,
      firstFewRecords: expenses?.slice(0, 3),
      totalRecords: expenses?.length || 0
    });
      
    if (expensesError) {
      console.error("[remainingBudget] Database error fetching expenses:", expensesError);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch expenses from database",
      });
    }
    
    console.log(`[remainingBudget] Found ${expenses?.length || 0} expenses for budget_id: ${budget_id}`);
    
    // If no expenses found, let's do a broader query to check if there are any expenses at all
    if (!expenses || expenses.length === 0) {
      console.log(`[remainingBudget] No expenses found for budget_id ${budget_id}, checking for any expenses in the table...`);
      
      const { data: allExpenses, error: allExpensesError } = await supabase
        .from('expenses')
        .select('id, budget_id')
        .limit(5);
        
      console.log(`[remainingBudget] Sample of all expenses in table:`, {
        success: !allExpensesError,
        sampleData: allExpenses,
        error: allExpensesError
      });
    }
    
    // Query budget information
    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('startingBudget, id, name')
      .eq('id', budget_id)
      .single();
      
    if (budgetError) {
      console.error(`[remainingBudget] Database error fetching budget with id ${budget_id}:`, {
        error: budgetError,
        code: budgetError.code,
        message: budgetError.message,
        details: budgetError.details
      });
      
      // More specific error message for debugging
      if (budgetError.code === 'PGRST116') {
        throw createError({
          statusCode: 404,
          statusMessage: `Budget with ID ${budget_id} not found`,
        });
      } else {
        throw createError({
          statusCode: 500,
          statusMessage: `Failed to fetch budget from database: ${budgetError.message}`,
        });
      }
    }

    console.log(`[remainingBudget] Found budget:`, { id: budgetData.id, name: budgetData.name, startingBudget: budgetData.startingBudget });

    const validateStartingBudget = z.number().parse(budgetData.startingBudget); 
    
    // Sum up all expenses with detailed logging
    const expenseAmounts = (expenses || []).map(expense => ({
      id: expense.id,
      amount: expense.amount,
      numericAmount: Number(expense.amount)
    }));
    
    console.log(`[remainingBudget] Processing expense amounts:`, expenseAmounts);
    
    const monthlyExpenses = expenseAmounts.reduce(
      (sum, expense) => sum + (expense.numericAmount || 0), 
      0
    );
    
    // Calculate remaining budget
    const remainingBudget = validateStartingBudget - monthlyExpenses;
    
    console.log(`[remainingBudget] Calculation complete - Starting: ${validateStartingBudget}, Expenses: ${monthlyExpenses}, Remaining: ${remainingBudget}`);
    
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
