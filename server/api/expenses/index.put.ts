import { z } from 'zod';
import { supabase } from "../../supabaseConnection";

// Schema for updating an expense
export const UpdateExpenseSchema = z.object({
  id: z.number(),
  budget_id: z.number().optional(),
  category_id: z.number().optional(),
  name: z.string().optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  date: z.string().or(z.date()).optional()
});

// Schema for the response body
export const ExpenseResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.number(),
    budget_id: z.number(),
    category_id: z.number(),
    name: z.string(),
    amount: z.number(),
    description: z.string().optional(),
    date: z.string()
  }).optional(),
  error: z.string().optional()
});

// Interface for the update data
interface ExpenseUpdateData {
  budget_id?: number;
  category_id?: number;
  name?: string;
  amount?: number;
  description?: string;
  date?: string | Date;
}

// Derive TypeScript types from Zod schemas
export type UpdateExpense = z.infer<typeof UpdateExpenseSchema>;
export type ExpenseResponse = z.infer<typeof ExpenseResponseSchema>;

export default defineEventHandler(async (event) => {
  try {
    // Validate request body
    const validatedData = await readValidatedBody(event, UpdateExpenseSchema.parse);
    const { id, budget_id, category_id, ...otherUpdateData } = validatedData;

    // Check if expense exists
    const { data: expenseData, error: expenseError } = await supabase
      .from("expenses")
      .select('id')
      .eq('id', id)
      .single();

    if (expenseError || !expenseData) {
      throw createError({
        statusCode: 404,
        message: "Expense not found",
      });
    }

    // Prepare update data with proper type
    const updateData: ExpenseUpdateData = { ...otherUpdateData };
    
    // If budget_id is being updated, verify it exists
    if (budget_id) {
      const { data: budgetData, error: budgetError } = await supabase
        .from("budgets")
        .select('id')
        .eq('id', budget_id)
        .single();

      if (budgetError || !budgetData) {
        throw createError({
          statusCode: 404,
          message: "Budget not found",
        });
      }
      
      updateData.budget_id = budget_id;
    }

    // If category_id is being updated, verify it exists
    if (category_id) {
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select('id')
        .eq('id', category_id)
        .single();

      if (categoryError || !categoryData) {
        throw createError({
          statusCode: 404,
          message: "Category not found",
        });
      }
      
      updateData.category_id = category_id;
    }

    // Update the expense
    const { data, error } = await supabase
      .from("expenses")
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message,
      });
    }

    // Validate and return response
    const response: ExpenseResponse = {
      success: true,
      data
    };
    
    return response;
  } catch (error) {
    console.error("Error updating expense:", error);
    
    // Ensure error response matches our schema
    const errorResponse: ExpenseResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    
    return errorResponse;
  }
}); 