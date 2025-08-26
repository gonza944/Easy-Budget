import { z } from "zod";
import { BudgetPeriodSchema, type BudgetPeriod } from "~/utils/budgetSchemas";
import { createUserSupabaseClient } from "../../supabaseConnection";

// Schema for update request body
const UpdateBudgetPeriodSchema = z.object({
  budgetType: z.enum(["daily", "monthly"]),
  budgetAmount: z.number().min(0.01),
});

export default defineEventHandler<Promise<{ success: boolean; data?: BudgetPeriod; error?: string }>>(async (event) => {
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
    const periodId = getRouterParam(event, 'id');
    
    if (!periodId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Budget period ID is required",
      });
    }

    const { budgetType, budgetAmount } = await readValidatedBody(event, UpdateBudgetPeriodSchema.parse);

    // Use a Supabase RPC function to update budget period with calculated amounts
    // This avoids the extra query and handles calculation in the database
    const { data, error } = await userSupabase.rpc(
      'update_budget_period_amounts',
      {
        p_period_id: parseInt(periodId),
        p_user_id: session.user.id,
        p_budget_type: budgetType,
        p_budget_amount: budgetAmount
      }
    );

    if (error) {
      if (error.message.includes('not found') || error.message.includes('permission')) {
        throw createError({
          statusCode: 404,
          statusMessage: "Current budget period not found or you don't have permission to update it",
        });
      }
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to update budget period: ${error.message}`,
      });
    }

    if (!data || data.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: "Budget period not found or you don't have permission to update it",
      });
    }

    const periodData = data[0];

    // Transform data to match schema
    const budgetPeriod = {
      id: periodData.id,
      budgetId: periodData.budget_id,
      dailyAmount: periodData.daily_amount,
      monthlyAmount: periodData.monthly_amount,
      validFromYear: periodData.valid_from_year,
      validFromMonth: periodData.valid_from_month,
      validUntilYear: periodData.valid_until_year,
      validUntilMonth: periodData.valid_until_month,
      isCurrent: periodData.is_current,
      createdAt: periodData.created_at,
      updatedAt: periodData.updated_at,
    };

    // Validate with Zod schema
    const validatedPeriod = BudgetPeriodSchema.parse(budgetPeriod);

    return { success: true, data: validatedPeriod };

  } catch (error) {
    console.error("Error updating budget period:", error);
    
    // If it's already an H3Error, re-throw it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error;
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
});
