import { z } from "zod";
import { requireSupabaseUser } from "~/server/utils/supabase";
import { MonthlyBudgetQuerySchema } from "~/types/metrics";
import { calculateFirstAndLastDayOfTheMonth } from "~/utils/date";

export default defineEventHandler(async (event) => {
    const { supabase: userSupabase, user } = await requireSupabaseUser(event);

    // Validate query parameters
    const validatedQuery = await getValidatedQuery(event, MonthlyBudgetQuerySchema.parse);

    const { budget_id, target_date:date } = validatedQuery;

    try {
      const { startDate, endDate } = calculateFirstAndLastDayOfTheMonth(date);

      const queryYear = date.getUTCFullYear();
      const queryMonth = date.getUTCMonth() + 1;

      // Execute both queries in parallel
      const [expensesResult, budgetPeriodResult] = await Promise.all([
        userSupabase
          .from('expenses')
          .select('amount')
          .eq('budget_id', budget_id)
          .gte('date', startDate)
          .lte('date', endDate),
        // Get budget period for the specific month with corrected year/month comparison
        userSupabase
          .from('budget_periods')
          .select('daily_amount, monthly_amount')
          .eq('budget_id', budget_id)
          .or(`valid_from_year.lt.${queryYear},and(valid_from_year.eq.${queryYear},valid_from_month.lte.${queryMonth})`)
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
