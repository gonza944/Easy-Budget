import { newBudgetSchema } from "~/utils/budgetSchemas";
import { createUserSupabaseClient } from "../../supabaseConnection";

// Define and export API response type
export type BudgetApiResponse = {
  success: boolean;
  data?: {
    id: string;
    name: string;
    description?: string;
    startingBudget: number;
    maxExpensesPerDay: number;
    startDate: string;
  };
};

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

    // Create authenticated Supabase client
    if (!session.accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: "No access token found in session",
      });
    }
    
    const userSupabase = createUserSupabaseClient(session.accessToken);

    const { name, description, startingBudget, maxExpensesPerDay, startDate } =
      await readValidatedBody(event, newBudgetSchema.parse);

    const { data, error } = await userSupabase.from("budgets").insert({
      name,
      description,
      startingBudget,
      maxExpensesPerDay,
      startDate,
    }).select().single();

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message,
      });
    }

    return {
      success: true,
      data: data || undefined
    } satisfies BudgetApiResponse;
  } catch (error) {
    console.error("Error creating budget:", error);
    return {
      success: false
    } satisfies BudgetApiResponse;
  }
}); 