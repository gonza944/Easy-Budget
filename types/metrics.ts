import { z } from "zod";

export const MonthlyBudgetQuerySchema = z.object({
  budget_id: z.string().transform((val) => Number(val)),
  target_date: z.string().transform((val) => {
    // Parse as UTC to avoid timezone issues
    // Split the date string and create a UTC date
    const [year, month, day] = val.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }),
});

export type MonthlyBudgetQuery = z.infer<typeof MonthlyBudgetQuerySchema>;


export const RemainingBudgetQuerySchema = z.object({
  budget_id: z.string().transform((val) => Number(val)),
});

export type RemainingBudgetQuery = z.infer<typeof RemainingBudgetQuerySchema>;

export const ExpensesBurnDownQuerySchema = z.object({
  initial_date: z.string().transform((val) => {
    const [year, month, day] = val.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }),
  final_date: z.string().transform((val) => {
    const [year, month, day] = val.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }),
  budget_id: z.string().transform((val) => Number(val)),
});

export type ExpensesBurnDownQuery = z.infer<typeof ExpensesBurnDownQuerySchema>;


export type DataRecord = {
  x: number;
  y: number;
  y2: number;
}