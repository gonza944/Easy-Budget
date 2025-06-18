import { z } from "zod";
import { supabase } from "~/server/supabaseConnection";
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

    const query = getQuery(event);
    console.log(`[expensesBurnDown] Raw query parameters:`, query);

    const validatedQuery = await getValidatedQuery(
      event,
      ExpensesBurnDownQuerySchema.parse
    );
    console.log(`[expensesBurnDown] Validated query parameters:`, validatedQuery);

    const initialDate = new Date(validatedQuery.initial_date);
    const finalDate = new Date(validatedQuery.final_date);
    const budget_id = validatedQuery.budget_id;

    console.log(`[expensesBurnDown] User session:`, { userId: session.user?.id, email: session.user?.email });
    console.log(`[expensesBurnDown] Processing request:`, {
      budget_id: `${budget_id} (${typeof budget_id})`,
      initial_date: initialDate.toISOString(),
      final_date: finalDate.toISOString(),
      dateRange: `${Math.floor((finalDate.getTime() - initialDate.getTime()) / (1000 * 60 * 60 * 24))} days`
    });

    // Get today's date and set to the beginning of the day for comparison
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    console.log(`[expensesBurnDown] Today's date for comparison:`, today.toISOString());

    const formattedInitialDate = formatDateToUTCISOString(initialDate);
    const formattedFinalDate = formatDateToUTCISOString(finalDate);
    console.log(`[expensesBurnDown] Formatted date range:`, { formattedInitialDate, formattedFinalDate });

    console.log(`[expensesBurnDown] Starting parallel queries for expenses and budget data...`);

    const [expenses, budgetData] = await Promise.all([
      supabase
        .from("expenses")
        .select("amount, date")
        .eq("budget_id", budget_id)
        .gte("date", formattedInitialDate)
        .lte("date", formattedFinalDate)
        .order('date', { ascending: true }),
      supabase
        .from("budgets")
        .select("maxExpensesPerDay")
        .eq("id", budget_id)
        .single(),
    ]);

    // Log expenses query response
    console.log(`[expensesBurnDown] Expenses query response:`, {
      success: !expenses.error,
      error: expenses.error,
      dataLength: expenses.data?.length,
      firstFewRecords: expenses.data?.slice(0, 3),
      totalRecords: expenses.data?.length || 0
    });

    // Log budget query response
    console.log(`[expensesBurnDown] Budget query response:`, {
      success: !budgetData.error,
      error: budgetData.error,
      data: budgetData.data
    });

    if (expenses.error) {
      console.error("[expensesBurnDown] Database error fetching expenses:", expenses.error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch expenses from database",
      });
    }

    if (budgetData.error) {
      console.error("[expensesBurnDown] Database error fetching budget:", budgetData.error);
      throw createError({
        statusCode: budgetData.error.code === 'PGRST116' ? 404 : 500,
        statusMessage: budgetData.error.code === 'PGRST116' ? "Budget not found" : "Failed to fetch budget from database",
      });
    }

    console.log(`[expensesBurnDown] Found ${expenses.data?.length || 0} expenses for budget_id: ${budget_id} in date range`);

    // If no expenses found, do broader queries for debugging
    if (!expenses.data || expenses.data.length === 0) {
      console.log(`[expensesBurnDown] No expenses found for date range, checking for any expenses for budget_id ${budget_id}...`);
      
      const { data: allBudgetExpenses, error: allBudgetExpensesError } = await supabase
        .from('expenses')
        .select('id, budget_id, date, amount')
        .eq('budget_id', budget_id)
        .limit(5);
        
      console.log(`[expensesBurnDown] All expenses for budget_id ${budget_id}:`, {
        success: !allBudgetExpensesError,
        sampleData: allBudgetExpenses,
        error: allBudgetExpensesError
      });
    }

    const validatedExpenses = ExpensesArraySchema.element.pick({ amount: true, date: true }).array().parse(expenses.data || []);
    console.log(`[expensesBurnDown] Validated ${validatedExpenses.length} expenses`);
    
    if (!budgetData.data) {
      throw createError({
        statusCode: 404,
        statusMessage: "Budget not found",
      });
    }
    
    const validatedMaxExpensesPerDay = z.number().parse(budgetData.data.maxExpensesPerDay);
    console.log(`[expensesBurnDown] Budget maxExpensesPerDay:`, validatedMaxExpensesPerDay);

    const daysDifference = Math.floor((finalDate.getTime() - initialDate.getTime()) / (1000 * 60 * 60 * 24));
    const maxPeriodBudget = validatedMaxExpensesPerDay * (daysDifference + 1);
    
    console.log(`[expensesBurnDown] Period calculations:`, {
      daysDifference,
      maxExpensesPerDay: validatedMaxExpensesPerDay,
      maxPeriodBudget
    });
      
    // Prepare dates for iteration
    const msPerDay = 24 * 60 * 60 * 1000;
    const startMs = initialDate.getTime();
    const endMs = finalDate.getTime();
    const dayCount = Math.floor((endMs - startMs) / msPerDay) + 1;
    
    console.log(`[expensesBurnDown] Date iteration setup:`, { startMs, endMs, dayCount });
    
    // Process expenses once to create a map of expense amounts by timestamp
    const expensesByDay = validatedExpenses.reduce<Record<number, number>>((acc, expense) => {
      const expenseDate = new Date(expense.date as string);
      const dayIndex = Math.floor((expenseDate.getTime() - startMs) / msPerDay);
      if (dayIndex >= 0 && dayIndex < dayCount)
        acc[dayIndex] = (acc[dayIndex] || 0) + expense.amount;
      return acc;
    }, {});
    
    console.log(`[expensesBurnDown] Expenses grouped by day:`, {
      totalDays: dayCount,
      daysWithExpenses: Object.keys(expensesByDay).length,
      expensesByDayPreview: Object.entries(expensesByDay).slice(0, 5)
    });
    
    // Initial values for tracking the "last valid" remaining budget for calculations
    let lastCalculatedActualRemaining = maxPeriodBudget;
    let lastCalculatedTheoreticalRemaining = maxPeriodBudget;
    
    console.log(`[expensesBurnDown] Starting burn down calculation with initial budget:`, maxPeriodBudget);
    
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
    if (lastItem) {
      lastItem.y = (lastItem.x > today.getTime() && lastItem.y === undefined) ? 0 : lastItem.y;
    }

    console.log(`[expensesBurnDown] Burn down calculation complete:`, {
      totalDataPoints: expensesBurnDown.length,
      firstDataPoint: expensesBurnDown[0],
      lastDataPoint: lastItem,
      finalActualRemaining: lastCalculatedActualRemaining,
      finalTheoreticalRemaining: lastCalculatedTheoreticalRemaining
    });

    return { expensesBurnDown };
    
  } catch (error) {
    console.error("Error calculating expenses burn down:", error);
    
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
