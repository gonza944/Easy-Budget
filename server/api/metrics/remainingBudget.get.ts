import { date, z } from "zod";

import { supabase } from "~/server/supabaseConnection";
import { RemainingBudgetQuerySchema } from "~/types/metrics";

export default defineEventHandler(async (event) => {
    // Validate query parameters
    const validatedQuery = await getValidatedQuery(event, RemainingBudgetQuerySchema.parse);

    const { budget_id } = validatedQuery;

    const session = await getUserSession(event);

    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized: Please log in",
      });
    }

    try {
      
      // Query expenses for the month
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('budget_id', budget_id)
        
      if (expensesError) throw expensesError;
      
      // Query budget information
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('startingBudget')
        .eq('id', budget_id)
        .single();
        
      if (budgetError) throw budgetError;
      const validateStartingBudget = z.number().parse(budgetData.startingBudget); 
      
      // Sum up all expenses
      const monthlyExpenses = expenses.reduce(
        (sum, expense) => sum + (Number(expense.amount) || 0), 
        0
      );
      
      // Calculate remaining budget
      const remainingBudget = validateStartingBudget - monthlyExpenses;
      
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
