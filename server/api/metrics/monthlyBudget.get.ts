import { z } from "zod";
import { supabase } from "~/server/supabaseConnection";
import { MonthlyBudgetQuerySchema } from "~/types/metrics";
import { calculateFirstAndLastDayOfTheMonth } from "~/utils/date";

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
    const query = getQuery(event);
    console.log(`[monthlyBudget] Raw query parameters:`, query);
    
    const validatedQuery = await getValidatedQuery(event, MonthlyBudgetQuerySchema.parse);
    console.log(`[monthlyBudget] Validated query parameters:`, validatedQuery);
    
    const { budget_id, target_date: date } = validatedQuery;

    console.log(`[monthlyBudget] User session:`, { userId: session.user?.id, email: session.user?.email });
    console.log(`[monthlyBudget] Processing request:`, {
      budget_id: `${budget_id} (${typeof budget_id})`,
      target_date: date.toISOString(),
      dateMonth: date.getMonth() + 1,
      dateYear: date.getFullYear()
    });

    const { startDate, endDate } = calculateFirstAndLastDayOfTheMonth(date);
    console.log(`[monthlyBudget] Date range calculated:`, { startDate, endDate });

    // Query expenses for the month
    console.log(`[monthlyBudget] Querying expenses with filters: budget_id=${budget_id}, date range: ${startDate} to ${endDate}`);
    
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, id, budget_id, date, name')
      .eq('budget_id', budget_id)
      .gte('date', startDate)
      .lte('date', endDate);
      
    // Log the raw expenses response
    console.log(`[monthlyBudget] Expenses query response:`, {
      success: !expensesError,
      error: expensesError,
      dataLength: expenses?.length,
      firstFewRecords: expenses?.slice(0, 3),
      totalRecords: expenses?.length || 0
    });
      
    if (expensesError) {
      console.error("[monthlyBudget] Database error fetching expenses:", expensesError);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch expenses from database",
      });
    }
    
    console.log(`[monthlyBudget] Found ${expenses?.length || 0} expenses for budget_id: ${budget_id} in date range`);
    
    // If no expenses found, do broader queries for debugging
    if (!expenses || expenses.length === 0) {
      console.log(`[monthlyBudget] No expenses found for date range, checking for any expenses for budget_id ${budget_id}...`);
      
      const { data: allBudgetExpenses, error: allBudgetExpensesError } = await supabase
        .from('expenses')
        .select('id, budget_id, date, amount')
        .eq('budget_id', budget_id)
        .limit(5);
        
      console.log(`[monthlyBudget] All expenses for budget_id ${budget_id}:`, {
        success: !allBudgetExpensesError,
        sampleData: allBudgetExpenses,
        error: allBudgetExpensesError
      });
    }
    
    // Query budget information
    console.log(`[monthlyBudget] Querying budget data for budget_id: ${budget_id}`);
    
    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('maxExpensesPerDay, id, name')
      .eq('id', budget_id)
      .single();
      
    console.log(`[monthlyBudget] Budget query response:`, {
      success: !budgetError,
      error: budgetError,
      data: budgetData
    });
      
    if (budgetError) {
      console.error("[monthlyBudget] Database error fetching budget:", budgetError);
      throw createError({
        statusCode: budgetError.code === 'PGRST116' ? 404 : 500,
        statusMessage: budgetError.code === 'PGRST116' ? "Budget not found" : "Failed to fetch budget from database",
      });
    }
    
    console.log(`[monthlyBudget] Found budget:`, { id: budgetData.id, name: budgetData.name, maxExpensesPerDay: budgetData.maxExpensesPerDay });
    
    // Calculate days in month
    const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };
    
    const daysInMonth = getDaysInMonth(date.getFullYear(), date.getMonth());
    console.log(`[monthlyBudget] Days in month calculation:`, { year: date.getFullYear(), month: date.getMonth() + 1, daysInMonth });
    
    // Calculate max monthly budget
    const maxMonthlyBudget = budgetData.maxExpensesPerDay * daysInMonth;
    console.log(`[monthlyBudget] Max monthly budget calculation:`, { maxExpensesPerDay: budgetData.maxExpensesPerDay, daysInMonth, maxMonthlyBudget });
    
    // Sum up all expenses with detailed logging
    const expenseAmounts = (expenses || []).map(expense => ({
      id: expense.id,
      amount: expense.amount,
      numericAmount: Number(expense.amount),
      date: expense.date
    }));
    
    console.log(`[monthlyBudget] Processing expense amounts:`, expenseAmounts);
    
    const monthlyExpenses = expenseAmounts.reduce(
      (sum, expense) => sum + (expense.numericAmount || 0), 
      0
    );
    
    // Calculate remaining budget
    const remainingBudget = maxMonthlyBudget - monthlyExpenses;
    
    console.log(`[monthlyBudget] Final calculation:`, {
      maxMonthlyBudget,
      monthlyExpenses,
      remainingBudget,
      expenseCount: expenseAmounts.length
    });
    
    return z.number().parse(remainingBudget);
    
  } catch (error) {
    console.error("Error calculating monthly budget:", error);

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
