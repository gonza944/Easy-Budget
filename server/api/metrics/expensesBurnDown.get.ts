import { z } from "zod";
import { createUserSupabaseClient } from "~/server/supabaseConnection";
import { ExpensesArraySchema } from "~/types/expense";
import { ExpensesBurnDownQuerySchema } from "~/types/metrics";
import { formatDateToUTCISOString } from "~/utils/date";

// Calculate burn down in a single pass
type BurnDownItem = { x: number; y: number | undefined; y2: number | null };

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

    // Create authenticated Supabase client
    if (!session.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: "No access token found in session",
      });
    }
    
    const userSupabase = createUserSupabaseClient(session.accessToken);

    const validatedQuery = await getValidatedQuery(
      event,
      ExpensesBurnDownQuerySchema.parse
    );

    const initialDate = new Date(validatedQuery.initial_date);
    const finalDate = new Date(validatedQuery.final_date);
    const budget_id = validatedQuery.budget_id;

    // Get today's date and set to the beginning of the day for comparison
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [expenses, budgetData] = await Promise.all([
      userSupabase
        .from("expenses")
        .select("amount, date")
        .eq("budget_id", budget_id)
        .gte("date", formatDateToUTCISOString(initialDate))
        .lte("date", formatDateToUTCISOString(finalDate))
        .order('date', { ascending: true }),
      userSupabase
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

    const maxPeriodBudget = validatedMaxExpensesPerDay * (
      Math.floor((finalDate.getTime() - initialDate.getTime()) / (1000 * 60 * 60 * 24))
    ) + 1;
      
    // Prepare dates for iteration
    const msPerDay = 24 * 60 * 60 * 1000;
    const startMs = initialDate.getTime();
    const endMs = finalDate.getTime();
    const dayCount = Math.floor((endMs - startMs) / msPerDay) + 1;
    
    // Process expenses once to create a map of expense amounts by timestamp
    const expensesByDay = validatedExpenses.reduce<Record<number, number>>((acc, expense) => {
      const expenseDate = new Date(expense.date as string);
      const dayIndex = Math.floor((expenseDate.getTime() - startMs) / msPerDay);
      if (dayIndex >= 0 && dayIndex < dayCount)
        acc[dayIndex] = (acc[dayIndex] || 0) + expense.amount;
      return acc;
    }, {});
    
    // Initial values for tracking the "last valid" remaining budget for calculations
    let lastCalculatedActualRemaining = maxPeriodBudget;
    let lastCalculatedTheoreticalRemaining = maxPeriodBudget;
    
    // Generate array of day indices
    const dayIndices = Array.from({ length: dayCount }, (_, i) => i);
    
    // Use reduce to calculate both the actual burn down and the theoretical average line
    const expensesBurnDown = dayIndices.reduce<BurnDownItem[]>((acc, dayIndex) => {
      const dailyExpenses = expensesByDay[dayIndex] || 0;
      
      // Calculate the actual date for the current dayIndex
      const currentDate = new Date(initialDate.getTime() + dayIndex * msPerDay);

      // Calculate the values based on the *last valid calculated* amounts
      const currentCalculatedActual = lastCalculatedActualRemaining - dailyExpenses;
      const currentCalculatedTheoretical = lastCalculatedTheoreticalRemaining - validatedMaxExpensesPerDay;

      // Update the "last valid calculated" amounts for the next iteration
      lastCalculatedActualRemaining = currentCalculatedActual;
      lastCalculatedTheoreticalRemaining = currentCalculatedTheoretical;
      
      acc.push({
        x: currentDate.getTime(),
        y: (currentDate.getTime() > today.getTime() && dailyExpenses === 0) ? undefined : currentCalculatedActual,
        y2: currentCalculatedTheoretical,
      });
      
      return acc;
    }, []);
    const lastItem = expensesBurnDown[expensesBurnDown.length - 1];
    lastItem.y = (lastItem.x > today.getTime() && lastItem.y === undefined) ? 0 : lastItem.y;

    return { expensesBurnDown };
  } catch (error) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
