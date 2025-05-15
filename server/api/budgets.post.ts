import { newBudgetSchema } from "~/utils/budgetSchemas";
import { supabase } from "../supabaseConnection";

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
    const { name, description, startingBudget, maxExpensesPerDay, startDate } =
      await readValidatedBody(event, newBudgetSchema.parse);

    const { data, error } = await supabase.from("budgets").insert({
      name,
      description,
      startingBudget,
      maxExpensesPerDay,
      startDate,
    });

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
