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