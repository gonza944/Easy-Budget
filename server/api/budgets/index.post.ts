import { newBudgetSchema, CreateBudgetApiResponseSchema, type CreateBudgetApiResponse } from "~/utils/budgetSchemas";
import { calculateBudgetAmounts } from "~/utils/date";
import { createUserSupabaseClient } from "../../supabaseConnection";

export default defineEventHandler<Promise<CreateBudgetApiResponse>>(async (event) => {
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

    const { name, description, startingBudget, budgetType, budgetAmount, startDate } =
      await readValidatedBody(event, newBudgetSchema.parse);

    // Calculate current date info
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Calculate daily and monthly amounts using helper function
    const { dailyAmount, monthlyAmount } = calculateBudgetAmounts(
      budgetType,
      budgetAmount,
      currentYear,
      currentMonth
    );

    // Use Supabase RPC for transaction-like behavior
    // Since Supabase doesn't support full transactions in the client library,
    // we'll use a stored procedure approach with error handling
    const { data: result, error: transactionError } = await userSupabase.rpc(
      'create_budget_with_period',
      {
        p_name: name,
        p_description: description || null,
        p_starting_budget: startingBudget,
        p_start_date: startDate,
        p_user_id: session.user.id,
        p_daily_amount: dailyAmount,
        p_monthly_amount: monthlyAmount,
        p_valid_from_year: currentYear,
        p_valid_from_month: currentMonth
      }
    );

    if (transactionError) {
      console.error("Transaction error:", transactionError);
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to create budget: ${transactionError.message}`,
      });
    }

    if (!result || result.length === 0) {
      throw createError({
        statusCode: 500,
        statusMessage: "Failed to create budget: No data returned",
      });
    }

    const budgetData = result[0];

    const response = {
      success: true,
      data: {
        id: budgetData.budget_id,
        name: budgetData.budget_name,
        description: budgetData.budget_description,
        startingBudget: budgetData.starting_budget,
        startDate: budgetData.start_date,
        currentPeriod: {
          dailyAmount: budgetData.daily_amount,
          monthlyAmount: budgetData.monthly_amount,
          validFromYear: budgetData.valid_from_year,
          validFromMonth: budgetData.valid_from_month,
          isCurrent: true,
        }
      }
    };

    // Validate response with Zod schema
    return CreateBudgetApiResponseSchema.parse(response);

  } catch (error) {
    console.error("Error creating budget:", error);
    
    // If it's already an H3Error, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }

    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };

    // Validate error response with Zod schema
    return CreateBudgetApiResponseSchema.parse(errorResponse);
  }
}); 