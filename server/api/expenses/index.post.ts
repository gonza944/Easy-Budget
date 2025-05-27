import { z } from 'zod';
import { supabase } from "../../supabaseConnection";

// Schema for expense creation payload
export const ExpenseCreateSchema = z.object({
  budget_id: z.number(),
  category_id: z.number(),
  name: z.string(),
  amount: z.number(),
  description: z.string().optional(),
  date: z.string(),
});

// Schema for expense response (same as in GET endpoint)
export const ExpenseSchema = z.object({
  id: z.number(),
  budget_id: z.number(),
  category_id: z.number(),
  name: z.string(),
  amount: z.number(),
  description: z.string().optional(),
  date: z.string().optional(),
});

// Derive TypeScript types from schemas
export type ExpenseCreate = z.infer<typeof ExpenseCreateSchema>;
export type Expense = z.infer<typeof ExpenseSchema>;

export default defineEventHandler(async (event) => {
  try {
    // Parse and validate request body
    const body = await readBody(event);
    const validatedData = ExpenseCreateSchema.parse(body);
    
    // Insert expense into database
    const { data, error } = await supabase
      .from('expenses')
      .insert([validatedData])
      .select();
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (!data || data.length === 0) {
      throw new Error('Failed to create expense: No data returned');
    }
    
    // Validate and return the created expense
    return ExpenseSchema.parse(data[0]);
    
  } catch (error) {
    return {
      statusCode: error instanceof z.ZodError ? 400 : 500,
      body: { 
        message: "Failed to create expense", 
        error: error instanceof Error ? error.message : String(error) 
      }
    };
  }
}); 