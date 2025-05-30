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