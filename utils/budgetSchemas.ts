import { z } from "zod";

export const newBudgetSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startingBudget: z.number().min(1),
  maxExpensesPerDay: z.number().min(1),
  startDate: z.date().optional().default(new Date()),
});

export const BudgetSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().optional(),
    startingBudget: z.number().min(1),
    maxExpensesPerDay: z.number().min(1),
  })
);

export type BudgetsResponse = z.infer<typeof BudgetSchema>;
