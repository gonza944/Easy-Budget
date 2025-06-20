import { z } from "zod";
import { createUserSupabaseClient } from "~/server/supabaseConnection";
import { ExpensesBurnDownQuerySchema } from "~/types/metrics";
import { formatDateToUTCISOString } from "~/utils/date";

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

    const validatedQuery = await getValidatedQuery(
      event,
      ExpensesBurnDownQuerySchema.parse
    );

    const initialDate = new Date(validatedQuery.initial_date);
    const finalDate = new Date(validatedQuery.final_date);
    const budget_id = validatedQuery.budget_id;

    // Get today's date and set to the beginning of the day for comparison
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { data, error } = await userSupabase
      .from("expenses")
      .select(`amount, category_id (name)`)
      .eq("budget_id", budget_id)
      .gte("date", formatDateToUTCISOString(initialDate))
      .lte("date", formatDateToUTCISOString(finalDate))
      .order("category_id", { ascending: true });

    if (error) throw error;

    const validatedData = z
      .object({
        amount: z.number(),
        category_id: z
          .object({
            name: z.string(),
          })
          .transform((data) => data.name),
      })
      .array()
      .parse(data);

    const expensesByCategory = validatedData.reduce(
      (
        acc: Record<string, number>,
        expense: { amount: number; category_id: string }
      ) => {
        const categoryName = expense.category_id;
        acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    return { expensesByCategory };
  } catch (error) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
