import { z } from "zod";

import { createUserSupabaseClient } from "~/server/supabaseConnection";
import { RemainingBudgetQuerySchema } from "~/types/metrics";

export default defineEventHandler(async (event) => {
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
    const validatedQuery = await getValidatedQuery(event, RemainingBudgetQuerySchema.parse);

    const { budget_id } = validatedQuery;

    try {
      // Execute both queries in parallel
      const [expensesResult, budgetResult] = await Promise.all([
        userSupabase
          .from('expenses')
          .select('amount')
          .eq('budget_id', budget_id),
        userSupabase
          .from('budgets')
          .select('startingBudget')
          .eq('id', budget_id)
          .single()
      ]);

      const { data: expenses, error: expensesError } = expensesResult;
      const { data: budgetData, error: budgetError } = budgetResult;
      
      if (expensesError) throw expensesError;
      if (budgetError) throw budgetError;
      
      if (!budgetData) {
        throw createError({
          statusCode: 404,
          statusMessage: `Budget with ID ${budget_id} not found`,
        });
      }
      
      const validateStartingBudget = z.number().parse(budgetData.startingBudget); 
      
      // Sum up all expenses
      const totalExpenses = expenses.reduce(
        (sum, expense) => sum + (Number(expense.amount) || 0), 
        0
      );
      
      // Calculate remaining budget from total starting budget
      const remainingBudget = validateStartingBudget - totalExpenses;
      
      return z.number().parse(remainingBudget);
    } catch (error) {
      console.error("Error calculating budget:", error);

      // Ensure error response matches our schema
      const errorResponse = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };

      return errorResponse;
    }
})
