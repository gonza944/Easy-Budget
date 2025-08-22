import { createUserSupabaseClient } from "../../supabaseConnection";
import { BudgetSchema, type Budget } from "~/utils/budgetSchemas";

export default defineEventHandler<Promise<Budget>>(async (event) => {
  try {
    const session = await getUserSession(event);
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized: Please log in",
      });
    }

    if (!session.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: "No access token found in session",
      });
    }

    const userSupabase = createUserSupabaseClient(session.accessToken);

    // Get selected budget with current period info
    const { data: budget, error } = await userSupabase
      .from('budgets')
      .select(`
        id,
        name,
        description,
        "startingBudget",
        "startDate",
        selected,
        budget_periods!inner(
          daily_amount,
          monthly_amount,
          valid_from_year,
          valid_from_month,
          is_current
        )
      `)
      .eq('user_id', session.user.id)
      .eq('selected', true)
      .eq('budget_periods.is_current', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      throw createError({
        statusCode: 500,
        statusMessage: `Error fetching selected budget: ${error.message}`,
      });
    }

    if (!budget) {
      throw createError({
        statusCode: 404,
        statusMessage: "No selected budget found. Please select a budget first.",
      });
    }

    // Transform to include current period info in expected format
    const budgetWithPeriod = {
      id: budget.id,
      name: budget.name,
      description: budget.description,
      startingBudget: budget.startingBudget,
      startDate: budget.startDate,
      selected: budget.selected,
      currentPeriod: budget.budget_periods[0] ? {
        dailyAmount: budget.budget_periods[0].daily_amount,
        monthlyAmount: budget.budget_periods[0].monthly_amount,
        validFromYear: budget.budget_periods[0].valid_from_year,
        validFromMonth: budget.budget_periods[0].valid_from_month,
        isCurrent: budget.budget_periods[0].is_current,
      } : undefined
    };

    // Validate with Zod schema
    return BudgetSchema.parse(budgetWithPeriod);
  } catch (error) {
    console.error("Error in selected budget endpoint:", error);
    
    // If it's already an H3Error, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid data format",
      });
    }
    
    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
}); 