import { z } from "zod";

export const MonthlyBudgetQuerySchema = z.object({
  budget_id: z.string().transform((val) => Number(val)),
  target_date: z.string().transform((val) => new Date(val)),
});

export type MonthlyBudgetQuery = z.infer<typeof MonthlyBudgetQuerySchema>;


export const RemainingBudgetQuerySchema = z.object({
  budget_id: z.string().transform((val) => Number(val)),
});

export type RemainingBudgetQuery = z.infer<typeof RemainingBudgetQuerySchema>;

export const ExpensesBurnDownQuerySchema = z.object({
  initial_date: z.string().transform((val) => new Date(val)),
  final_date: z.string().transform((val) => new Date(val)),
  budget_id: z.string().transform((val) => Number(val)),
});

export type ExpensesBurnDownQuery = z.infer<typeof ExpensesBurnDownQuerySchema>;


export type DataRecord = {
  [key: string]: number | null | undefined
}