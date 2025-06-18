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
    const validatedQuery = await getValidatedQuery(event, MonthlyBudgetQuerySchema.parse);
    const { budget_id, target_date: date } = validatedQuery;

    const { startDate, endDate } = calculateFirstAndLastDayOfTheMonth(date);

    // Query expenses for the month
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('budget_id', budget_id)
      .gte('date', startDate)
      .lte('date', endDate);
      
    if (expensesError) {
      console.error("Database error fetching expenses:", expensesError);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch expenses from database",
      });
    }
    
    // Query budget information
    const { data: budgetData, error: budgetError } = await supabase
      .from('budgets')
      .select('maxExpensesPerDay')
      .eq('id', budget_id)
      .single();
      
    if (budgetError) {
      console.error("Database error fetching budget:", budgetError);
      throw createError({
        statusCode: budgetError.code === 'PGRST116' ? 404 : 500,
        statusMessage: budgetError.code === 'PGRST116' ? "Budget not found" : "Failed to fetch budget from database",
      });
    }
    
    // Calculate days in month
    const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };
    
    // Calculate max monthly budget
    const maxMonthlyBudget = budgetData.maxExpensesPerDay * 
      getDaysInMonth(date.getFullYear(), date.getMonth());
    
    // Sum up all expenses
    const monthlyExpenses = (expenses || []).reduce(
      (sum, expense) => sum + (Number(expense.amount) || 0), 
      0
    );
    
    // Calculate remaining budget
    const remainingBudget = maxMonthlyBudget - monthlyExpenses;
    
    return z.number().parse(remainingBudget);
    
  } catch (error) {
    console.error("Error calculating monthly budget:", error);

    // If it's already an H3Error, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
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
