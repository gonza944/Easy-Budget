import { z } from 'zod';
import { supabase } from "../../supabaseConnection";

// Schema for expense entity (response)
export const ExpenseSchema = z.object({
  id: z.number(),
  budget_id: z.number(),
  category_id: z.number(),
  name: z.string(),
  amount: z.number(),
  description: z.string().optional(),
  date: z.string(),
});

// Schema for expenses array
export const ExpensesArraySchema = z.array(ExpenseSchema);

// Schema for query parameters
export const ExpenseQuerySchema = z.object({
  budget_id: z.string().optional(),
  category_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});

// Derive TypeScript types from Zod schemas
export type Expense = z.infer<typeof ExpenseSchema>;
export type ExpensesResponse = z.infer<typeof ExpensesArraySchema>;
export type ExpenseQuery = z.infer<typeof ExpenseQuerySchema>;

export default defineEventHandler(async (event) => {
  // Validate query parameters
  const query = getQuery(event);
  const validatedQuery = ExpenseQuerySchema.parse(query);
  
  const { budget_id, category_id, start_date, end_date } = validatedQuery;

  let supabaseQuery = supabase.from("expenses").select();
  
  // Apply additional filters if provided
  if (budget_id) {
    supabaseQuery = supabaseQuery.eq('budget_id', budget_id);
  }
  
  if (category_id) {
    supabaseQuery = supabaseQuery.eq('category_id', category_id);
  }
  
  if (start_date) {
    supabaseQuery = supabaseQuery.gte('date', start_date);
  }
  
  if (end_date) {
    supabaseQuery = supabaseQuery.lte('date', end_date);
  }

  // Order by date descending (newest first)
  supabaseQuery = supabaseQuery.order('date', { ascending: false });

  const { data, error } = await supabaseQuery;

  try {
    if (error) {
      throw new Error(error.message);
    }
    
    // Validate response with Zod schema
    const expenses = ExpensesArraySchema.parse(data);
    return expenses;
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return {
      statusCode: 500,
      body: { message: "Failed to fetch expenses", error: error instanceof Error ? error.message : String(error) },
    };
  }
}); 