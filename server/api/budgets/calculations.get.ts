import { z } from 'zod';
import { supabase } from "../../supabaseConnection";

// Schema for query parameters
export const BudgetCalculationQuerySchema = z.object({
  budget_id: z.string().transform(val => Number(val)),
  target_date: z.string().optional().transform(val => val ? new Date(val) : new Date())
});

// Schema for the calculation result
export const BudgetCalculationResultSchema = z.object({
  totalRemaining: z.number(),
  monthlyRemaining: z.number(),
  dailyRemaining: z.number(),
  totalExpenses: z.number(),
  totalAdjustments: z.number(),
  startingBudget: z.number()
});

// Schema for the response body
export const BudgetCalculationResponseSchema = z.object({
  success: z.boolean(),
  data: BudgetCalculationResultSchema.optional(),
  error: z.string().optional()
});

// Derive TypeScript types from Zod schemas
export type BudgetCalculationQuery = z.infer<typeof BudgetCalculationQuerySchema>;
export type BudgetCalculationResult = z.infer<typeof BudgetCalculationResultSchema>;
export type BudgetCalculationResponse = z.infer<typeof BudgetCalculationResponseSchema>;

export default defineEventHandler(async (event) => {
  try {
    // Validate query parameters
    const query = getQuery(event);
    const { budget_id, target_date } = BudgetCalculationQuerySchema.parse(query);
    
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
      .eq('id', budget_id)
      .single();

    if (budgetError || !budgetData) {
      throw createError({
        statusCode: 404,
        message: budgetError?.message || "Budget not found",
      });
    }

    // Calculate total expenses up to target date
    const { data: expensesData, error: expensesError } = await supabase
      .from("expenses")
      .select('amount')
      .eq('budget_id', budget_id)
      .lte('date', target_date.toISOString());

    if (expensesError) {
      throw createError({
        statusCode: 500,
        message: expensesError.message,
      });
    }

    const totalExpenses = expensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

    // Calculate total adjustments up to target date
    const { data: adjustmentsData, error: adjustmentsError } = await supabase
      .from("budget_adjustments")
      .select('amount')
      .eq('budget_id', budget_id)
      .lte('date', target_date.toISOString());

    if (adjustmentsError) {
      throw createError({
        statusCode: 500,
        message: adjustmentsError.message,
      });
    }

    const totalAdjustments = adjustmentsData?.reduce((sum, adjustment) => sum + adjustment.amount, 0) || 0;

    // Calculate the remaining budget
    const totalRemaining = budgetData.startingBudget - totalExpenses + totalAdjustments;

    // Calculate days in month and days remaining
    const startOfMonth = new Date(target_date);
    startOfMonth.setDate(1);
    
    const endOfMonth = new Date(target_date.getFullYear(), target_date.getMonth() + 1, 0);
    const daysInMonth = endOfMonth.getDate();
    const daysRemaining = daysInMonth - target_date.getDate() + 1; // +1 to include current day
    
    // Monthly remaining based on daily budget and days remaining
    const monthlyRemaining = budgetData.maxExpensesPerDay * daysRemaining;
    
    // Daily remaining is simply the daily budget
    const dailyRemaining = budgetData.maxExpensesPerDay;

    // Create and validate the calculation result
    const calculationResult: BudgetCalculationResult = {
      totalRemaining,
      monthlyRemaining,
      dailyRemaining,
      totalExpenses,
      totalAdjustments,
      startingBudget: budgetData.startingBudget
    };

    // Validate with Zod schema
    BudgetCalculationResultSchema.parse(calculationResult);

    // Prepare and return response
    const response: BudgetCalculationResponse = {
      success: true,
      data: calculationResult
    };
    
    return response;
  } catch (error) {
    console.error("Error calculating budget:", error);
    
    // Ensure error response matches our schema
    const errorResponse: BudgetCalculationResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    
    return errorResponse;
  }
}); 