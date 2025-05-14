import { supabase } from "../supabaseConnection";
import { newBudgetSchema } from "~/utils/budgetSchemas";


export default defineEventHandler(async (event) => {
  const { name, description, startingBudget, maxExpensesPerDay, startDate } =
    await readValidatedBody(event, newBudgetSchema.parse);

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      name,
      description,
      startingBudget,
      maxExpensesPerDay,
      startDate,
    })

  if (error) {
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }

  return data;
});
