import { z } from 'zod';
import { supabase } from "../../supabaseConnection";

// Schema for deleting an expense
export const DeleteExpenseSchema = z.object({
  id: z.number(),
});

// Schema for the response body
export const DeleteResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional()
});

// Derive TypeScript types from Zod schemas
export type DeleteExpense = z.infer<typeof DeleteExpenseSchema>;
export type DeleteResponse = z.infer<typeof DeleteResponseSchema>;

export default defineEventHandler(async (event) => {
  try {
    // Validate request body
    const validatedData = await readValidatedBody(event, DeleteExpenseSchema.parse);
    const { id } = validatedData;

    // Verify the expense exists
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

    // Delete the expense
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq('id', id);

    if (error) {
      throw createError({
        statusCode: 500,
        message: error.message,
      });
    }

    // Validate and return response
    const response: DeleteResponse = {
      success: true
    };
    
    return response;
  } catch (error) {
    console.error("Error deleting expense:", error);
    
    // Ensure error response matches our schema
    const errorResponse: DeleteResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    
    return errorResponse;
  }
}); 