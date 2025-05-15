import { newBudgetSchema } from "~/utils/budgetSchemas";
import { supabase } from "../supabaseConnection";

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

    return data;
  } catch (error) {
    console.error("Error creating budget:", error);
  }
});
