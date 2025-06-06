import { z } from "zod";
import { supabase } from "~/server/supabaseConnection";
import { ExpensesArraySchema } from "~/types/expense";
import { ExpensesBurnDownQuerySchema } from "~/types/metrics";
import { formatDateForSupabase } from "~/utils/date";

export default defineEventHandler(async (event) => {
  const validatedQuery = await getValidatedQuery(
    event,
    ExpensesBurnDownQuerySchema.parse
  );

  const { initial_date, final_date, budget_id } = validatedQuery;

  const startDate = formatDateForSupabase(initial_date);
  const endDate = formatDateForSupabase(final_date);

  try {
    const [expenses, budgetData] = await Promise.all([
      supabase
        .from("expenses")
        .select("amount, date")
        .eq("budget_id", budget_id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order('date', { ascending: true }),
      supabase
        .from("budgets")
        .select("maxExpensesPerDay")
        .eq("id", budget_id)
        .single(),
    ]);

    const validatedExpenses = ExpensesArraySchema.element.pick({ amount: true, date: true }).array().parse(expenses.data);
    
    if (!budgetData.data) {
      throw createError({
        statusCode: 404,
        statusMessage: "Budget not found",
      });
    }
    
    const validatedMaxExpensesPerDay = z.number().parse(budgetData.data.maxExpensesPerDay);

    const daysInPeriod = Math.floor(
      (final_date.getTime() - initial_date.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    const maxPeriodBudget = validatedMaxExpensesPerDay * daysInPeriod;
      
    // Prepare dates for iteration
    const msPerDay = 24 * 60 * 60 * 1000;
    const startMs = initial_date.getTime();
    const endMs = final_date.getTime();
    const dayCount = Math.floor((endMs - startMs) / msPerDay) + 1;
    
    // Process expenses once to create a map of expense amounts by timestamp
    const expensesByDay: Record<number, number> = {};
    validatedExpenses.forEach(expense => {
      const expenseDate = new Date(expense.date as string);
      const dayIndex = Math.floor((expenseDate.getTime() - startMs) / msPerDay);
      if (dayIndex >= 0 && dayIndex < dayCount) {
        expensesByDay[dayIndex] = (expensesByDay[dayIndex] || 0) + expense.amount;
      }
    });
    
    // Calculate burn down in a single pass
    type BurnDownItem = { x: number; y: number; y2: number };
    
    // Generate array of day indices
    const dayIndices = Array.from({ length: dayCount }, (_, i) => i);
    
    // Use reduce to calculate both the actual burn down and the theoretical average line
    const expensesBurnDown = dayIndices.reduce<BurnDownItem[]>((acc, dayIndex) => {
      const dailyExpenses = expensesByDay[dayIndex] || 0;
      
      // For the first day
      if (dayIndex === 0) {
        // Actual remaining budget after day's expenses
        const actualRemaining = maxPeriodBudget - dailyExpenses;
        
        // Theoretical "ideal" remaining if spending exactly maxExpensesPerDay
        const theoreticalRemaining = maxPeriodBudget - validatedMaxExpensesPerDay;
        
        acc.push({ x: dayIndex, y: actualRemaining, y2: theoreticalRemaining });
      } else {
        // Get previous day's values
        const prevDay = acc[dayIndex - 1];
        
        // Actual remaining budget based on previous day minus today's expenses
        const actualRemaining = prevDay.y - dailyExpenses;
        
        // Theoretical "ideal" remaining continues to decrease by maxExpensesPerDay each day
        const theoreticalRemaining = prevDay.y2 - validatedMaxExpensesPerDay;
        
        acc.push({ x: dayIndex, y: actualRemaining, y2: theoreticalRemaining });
      }
      
      return acc;
    }, []);

    return { expensesBurnDown };
  } catch (error) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
