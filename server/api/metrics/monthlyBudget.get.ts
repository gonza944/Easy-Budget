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

      const queryYear = date.getFullYear();
      const queryMonth = date.getMonth() + 1;

      // Execute both queries in parallel
      const [expensesResult, budgetPeriodResult] = await Promise.all([
        userSupabase
          .from('expenses')
          .select('amount')
          .eq('budget_id', budget_id)
          .gte('date', startDate)
          .lte('date', endDate),
        // NEW: Get budget period for the specific month
        userSupabase
          .from('budget_periods')
          .select('daily_amount, monthly_amount')
          .eq('budget_id', budget_id)
          .lte('valid_from_year', queryYear)
          .lte('valid_from_month', queryMonth)
          .or(`valid_until_year.is.null,valid_until_year.gt.${queryYear},and(valid_until_year.eq.${queryYear},valid_until_month.gte.${queryMonth})`)
          .order('valid_from_year', { ascending: false })
          .order('valid_from_month', { ascending: false })
          .limit(1)
          .single()
      ]);

      const { data: expenses, error: expensesError } = expensesResult;
      const { data: budgetPeriod, error: budgetError } = budgetPeriodResult;
      
      if (expensesError) throw expensesError;
      if (budgetError) throw budgetError;
      
      if (!budgetPeriod) {
        throw createError({
          statusCode: 404,
          statusMessage: `No budget period found for budget ${budget_id} in ${queryMonth}/${queryYear}`,
        });
      }
      
      // Use stored monthly amount from budget_periods
      const maxMonthlyBudget = budgetPeriod.monthly_amount;
      
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
