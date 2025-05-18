import { z } from 'zod';
import { supabase } from "../../supabaseConnection";

// Schema for query parameters
export const BudgetBurndownQuerySchema = z.object({
  budget_id: z.string().transform(val => Number(val)),
  start_date: z.string().optional().transform(val => {
    if (!val) {
      // Default to start of current month
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return new Date(val);
  }),
  end_date: z.string().optional().transform(val => {
    if (!val) {
      // Default to end of current month
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    return new Date(val);
  })
});

// Schema for a day's burndown data
export const BurndownDaySchema = z.object({
  date: z.string(),
  projectedRemaining: z.number(),
  actualRemaining: z.number()
});

// Schema for the response
export const BudgetBurndownResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(BurndownDaySchema).optional(),
  error: z.string().optional()
});

// Derive TypeScript types from Zod schemas
export type BudgetBurndownQuery = z.infer<typeof BudgetBurndownQuerySchema>;
export type BurndownDay = z.infer<typeof BurndownDaySchema>;
export type BudgetBurndownResponse = z.infer<typeof BudgetBurndownResponseSchema>;

export default defineEventHandler(async (event) => {
  try {
    // Validate query parameters
    const query = getQuery(event);
    const { budget_id, start_date, end_date } = BudgetBurndownQuerySchema.parse(query);
    
    if (isNaN(budget_id)) {
      throw createError({
        statusCode: 400,
        message: "Budget ID must be a valid number",
      });
    }

    // Get budget details
    const { data: budgetData, error: budgetError } = await supabase
      .from("budgets")
      .select()
      .single();

    if (budgetError || !budgetData) {
      throw createError({
        statusCode: 404,
        message: budgetError?.message || "Budget not found",
      });
    }

    // Get all expenses for this budget in the date range
    const { data: expensesData, error: expensesError } = await supabase
      .from("expenses")
      .select('amount, date')
      .eq('budget_id', budget_id)
      .gte('date', start_date.toISOString())
      .lte('date', end_date.toISOString())
      .order('date', { ascending: true });

    if (expensesError) {
      throw createError({
        statusCode: 500,
        message: expensesError.message,
      });
    }

    // Get all adjustments for this budget in the date range
    const { data: adjustmentsData, error: adjustmentsError } = await supabase
      .from("budget_adjustments")
      .select('amount, date')
      .eq('budget_id', budget_id)
      .gte('date', start_date.toISOString())
      .lte('date', end_date.toISOString())
      .order('date', { ascending: true });

    if (adjustmentsError) {
      throw createError({
        statusCode: 500,
        message: adjustmentsError.message,
      });
    }

    // Generate daily data for the burndown chart
    const burndownData: BurndownDay[] = [];
    const dailyBudget = budgetData.maxExpensesPerDay;
    const initialBudget = budgetData.startingBudget;
    
    // Group expenses and adjustments by date
    const expensesByDate: Record<string, number> = {};
    expensesData?.forEach(expense => {
      const dateStr = new Date(expense.date).toISOString().split('T')[0];
      if (!expensesByDate[dateStr]) {
        expensesByDate[dateStr] = 0;
      }
      expensesByDate[dateStr] += expense.amount;
    });
    
    const adjustmentsByDate: Record<string, number> = {};
    adjustmentsData?.forEach(adjustment => {
      const dateStr = new Date(adjustment.date).toISOString().split('T')[0];
      if (!adjustmentsByDate[dateStr]) {
        adjustmentsByDate[dateStr] = 0;
      }
      adjustmentsByDate[dateStr] += adjustment.amount;
    });
    
    // Calculate daily burndown
    const currentDate = new Date(start_date);
    let cumulativeExpenses = 0;
    let cumulativeAdjustments = 0;
    
    while (currentDate <= end_date) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Track cumulative amounts
      if (expensesByDate[dateStr]) {
        cumulativeExpenses += expensesByDate[dateStr];
      }
      
      if (adjustmentsByDate[dateStr]) {
        cumulativeAdjustments += adjustmentsByDate[dateStr];
      }
      
      const dayNumber = Math.floor((currentDate.getTime() - start_date.getTime()) / (1000 * 60 * 60 * 24));
      const projectedRemaining = initialBudget - (dailyBudget * dayNumber);
      const actualRemaining = initialBudget - cumulativeExpenses + cumulativeAdjustments;
      
      burndownData.push({
        date: dateStr,
        projectedRemaining,
        actualRemaining
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Validate the burndown data with our schema
    const validatedData = z.array(BurndownDaySchema).parse(burndownData);

    // Prepare and return response
    const response: BudgetBurndownResponse = {
      success: true,
      data: validatedData
    };
    
    return response;
  } catch (error) {
    console.error("Error generating budget burndown:", error);
    
    // Ensure error response matches our schema
    const errorResponse: BudgetBurndownResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    
    return errorResponse;
  }
}); 