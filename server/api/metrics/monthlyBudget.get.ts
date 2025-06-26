import { z } from "zod";
import { createUserSupabaseClient } from "~/server/supabaseConnection";
import { MonthlyBudgetQuerySchema } from "~/types/metrics";
import { calculateFirstAndLastDayOfTheMonth } from "~/utils/date";

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
    const validatedQuery = await getValidatedQuery(event, MonthlyBudgetQuerySchema.parse);

    const { budget_id, target_date:date } = validatedQuery;

    try {
      const { startDate, endDate } = calculateFirstAndLastDayOfTheMonth(date);

      // Execute both queries in parallel
      const [expensesResult, budgetResult] = await Promise.all([
        userSupabase
          .from('expenses')
          .select('amount')
          .eq('budget_id', budget_id)
          .gte('date', startDate)
          .lte('date', endDate),
        userSupabase
          .from('budgets')
          .select('maxExpensesPerDay')
          .eq('id', budget_id)
          .single()
      ]);

      const { data: expenses, error: expensesError } = expensesResult;
      const { data: budgetData, error: budgetError } = budgetResult;
      
      if (expensesError) throw expensesError;
      if (budgetError) throw budgetError;
      
      // Calculate days in month
      const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
      };
      
      // Calculate max monthly budget
      const maxMonthlyBudget = budgetData.maxExpensesPerDay * 
        getDaysInMonth(date.getFullYear(), date.getMonth());
      
      // Sum up all expenses
      const monthlyExpenses = expenses.reduce(
        (sum, expense) => sum + (Number(expense.amount) || 0), 
        0
      );
      
      // Calculate remaining budget
      const remainingBudget = maxMonthlyBudget - monthlyExpenses;
      
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
});
