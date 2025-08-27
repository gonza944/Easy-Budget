import { CreateBudgetPeriodSchema, BudgetPeriodSchema, type BudgetPeriod } from "~/utils/budgetSchemas";
import { calculateBudgetAmounts } from "~/utils/date";
import { createUserSupabaseClient } from "../../supabaseConnection";

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

    const { budgetId, budgetType, budgetAmount, validFromYear, validFromMonth } =
      await readValidatedBody(event, CreateBudgetPeriodSchema.parse);

    // Calculate daily and monthly amounts using helper function
    const { dailyAmount, monthlyAmount } = calculateBudgetAmounts(
      budgetType,
      budgetAmount,
      validFromYear,
      validFromMonth
    );

    // Create new budget period - let database constraints handle validation
    const { data, error } = await userSupabase
      .from('budget_periods')
      .insert({
        budget_id: budgetId,
        user_id: session.user.id,
        daily_amount: dailyAmount,
        monthly_amount: monthlyAmount,
        valid_from_year: validFromYear,
        valid_from_month: validFromMonth,
        is_current: validFromYear === new Date().getFullYear() && validFromMonth === new Date().getMonth() + 1,
      })
      .select()
      .single();

    if (error) {
      // Handle specific database constraint errors
      if (error.code === '23503') { // Foreign key violation
        throw createError({
          statusCode: 404,
          statusMessage: "Budget not found or you don't have permission to access it",
        });
      }
      if (error.code === '23505') { // Unique constraint violation
        throw createError({
          statusCode: 409,
          statusMessage: `A budget period already exists for ${validFromMonth}/${validFromYear}`,
        });
      }
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to create budget period: ${error.message}`,
      });
    }

    // Transform data to match schema
    const budgetPeriod = {
      id: data.id,
      budgetId: data.budget_id,
      dailyAmount: data.daily_amount,
      monthlyAmount: data.monthly_amount,
      validFromYear: data.valid_from_year,
      validFromMonth: data.valid_from_month,
      validUntilYear: data.valid_until_year,
      validUntilMonth: data.valid_until_month,
      isCurrent: data.is_current,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Validate with Zod schema
    const validatedPeriod = BudgetPeriodSchema.parse(budgetPeriod);

    return { success: true, data: validatedPeriod };

  } catch (error) {
    console.error("Error creating budget period:", error);
    
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
