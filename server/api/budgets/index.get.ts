import { BudgetsSchema, type BudgetsResponse } from "~/utils/budgetSchemas";
import { createUserSupabaseClient } from "../../supabaseConnection";

export default defineEventHandler<Promise<BudgetsResponse>>(async (event) => {
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

    const query = getQuery(event);
    const nameFilter = query.name as string | undefined;

    // Updated query to join with budget_periods for current period info
    let supabaseQuery = userSupabase
      .from("budgets")
      .select(`
        id,
        name,
        description,
        "startingBudget",
        "startDate",
        selected,
        created_at,
        budget_periods!inner(
          id,
          daily_amount,
          monthly_amount,
          valid_from_year,
          valid_from_month,
          is_current
        )
      `)
      .eq('budget_periods.is_current', true)
      .order("created_at", { ascending: false });

    // Apply name filter if provided
    if (nameFilter) {
      supabaseQuery = supabaseQuery.ilike("name", `%${nameFilter}%`);
    }

    const { data, error } = await supabaseQuery;
    
    if (error) {
      console.error("Database error fetching budgets:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to fetch budgets from database",
      });
    }

    // Transform data to include current period info in the expected format
    const budgetsWithPeriods = (data || []).map(budget => ({
      id: budget.id,
      name: budget.name,
      description: budget.description,
      startingBudget: budget.startingBudget,
      startDate: budget.startDate,
      selected: budget.selected,
      currentPeriod: budget.budget_periods[0] ? {
        id: budget.budget_periods[0].id,
        dailyAmount: budget.budget_periods[0].daily_amount,
        monthlyAmount: budget.budget_periods[0].monthly_amount,
        validFromYear: budget.budget_periods[0].valid_from_year,
        validFromMonth: budget.budget_periods[0].valid_from_month,
        isCurrent: budget.budget_periods[0].is_current,
      } : undefined
    }));

    const budgets = BudgetsSchema.parse(budgetsWithPeriods);
    return budgets;
  } catch (error) {
    console.error("Error in budgets GET endpoint:", error);
    
    // If it's already an H3Error, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }
    
    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: error.message || "Invalid data format",
      });
    }
    
    // Generic error fallback
    throw createError({
      statusCode: 500,
      statusMessage: "Internal server error",
    });
  }
});
