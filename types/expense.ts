import { z } from 'zod';

  // Schema for expense creation payload
  export const ExpenseCreateSchema = z.object({
      budget_id: z.number(),
      category_id: z.number(),
      name: z.string(),
      amount: z.number(),
      description: z.string().optional(),
      date: z.string(),
    });

  // Schema for expense form (client-side validation)
  export const ExpenseFormSchema = ExpenseCreateSchema.omit({ budget_id: true, date: true }).extend({
    amount: z.string().min(1, 'Amount is required')
      .transform(val => Number(val)),
    category_id: z.number({
      required_error: 'Please select a category',
      invalid_type_error: 'Please select a category',
    }),
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
  
  // Schema for expenses array
  export const ExpensesArraySchema = z.array(ExpenseSchema);
  
  // Schema for query parameters
  export const ExpenseQuerySchema = z.object({
    budget_id: z.string(),
    category_id: z.string().optional(),
    date: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional()
  });
  
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
  
  // Schema for the update response body
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
  
  // Schema for deleting an expense
  export const DeleteExpenseSchema = z.object({
    id: z.number(),
  });
  
  // Schema for the delete response body
  export const DeleteResponseSchema = z.object({
    success: z.boolean(),
    error: z.string().optional()
  });
  
  // Derive TypeScript types from schemas
  export type ExpenseCreate = z.infer<typeof ExpenseCreateSchema>;
  export type ExpenseForm = z.infer<typeof ExpenseFormSchema>;
  export type Expense = z.infer<typeof ExpenseSchema>;
  export type ExpensesResponse = z.infer<typeof ExpensesArraySchema>;
  export type ExpenseQuery = z.infer<typeof ExpenseQuerySchema>;
  export type UpdateExpense = z.infer<typeof UpdateExpenseSchema>;
  export type ExpenseResponse = z.infer<typeof ExpenseResponseSchema>;
  export type DeleteExpense = z.infer<typeof DeleteExpenseSchema>;
  export type DeleteResponse = z.infer<typeof DeleteResponseSchema>;
  
  // Interface for the update data
  export interface ExpenseUpdateData {
    budget_id?: number;
    category_id?: number;
    name?: string;
    amount?: number;
    description?: string;
    date?: string | Date;
  }