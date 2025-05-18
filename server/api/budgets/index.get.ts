import { BudgetSchema, type BudgetsResponse } from "~/utils/budgetSchemas";
import { supabase } from "../../supabaseConnection";

export default defineEventHandler<Promise<BudgetsResponse | { statusCode: number; body: { message: string; error: string } }>>(async (event) => {
  const query = getQuery(event);
  const nameFilter = query.name as string | undefined;

  let supabaseQuery = supabase.from("budgets").select();
  
  // Apply name filter if provided
  if (nameFilter) {
    supabaseQuery = supabaseQuery.ilike('name', `%${nameFilter}%`);
  }

  const { data, error } = await supabaseQuery;
  try {
    if (error) {
      throw new Error(error.message);
    }
    const budgets = BudgetSchema.parse(data);
    return budgets;
  } catch (error) {
    return {
      statusCode: 500,
      body: { message: "Failed to fetch budgets", error: error instanceof Error ? error.message : String(error) },
    };
  }
}); 