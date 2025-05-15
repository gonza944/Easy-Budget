import { z } from "zod";

export const newBudgetSchemaForm = z.object({
  name: z.string().min(1, { message: "Required" }),
  description: z.string().optional(),
  startingBudget: z.string().min(1, { message: "Required" }).transform((val) => parseFloat(val)),
  maxExpensesPerDay: z.string().min(1, { message: "Required" }).transform((val) => parseFloat(val)),
  startDate: z.date().optional().default(new Date()),
});

export const newBudgetSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  startingBudget: z.number().min(1),
  maxExpensesPerDay: z.number().min(1),
  startDate: z.string().optional().default(new Date().toLocaleDateString()),
});

export const BudgetSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().optional(),
    startingBudget: z.number().min(1),
    maxExpensesPerDay: z.number().min(1),
    startDate: z.string().optional().default(new Date().toLocaleDateString()),
  })
);

export type BudgetsResponse = z.infer<typeof BudgetSchema>;
