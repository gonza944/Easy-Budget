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

export const BudgetSchema =  z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional().nullable(),
  startingBudget: z.number().min(1),
  maxExpensesPerDay: z.number().min(1),
  startDate: z.string().optional().default(new Date().toLocaleDateString()),
  selected: z.boolean().default(false),
});

export const NewBudgetSchema = BudgetSchema.omit({ id: true }).extend({
  startDate: z.date().optional().default(new Date()),
});
export type NewBudgetSchema = z.infer<typeof NewBudgetSchema>;

export const BudgetsSchema = z.array(
  BudgetSchema
);

export type BudgetsResponse = z.infer<typeof BudgetsSchema>;
export type Budget = z.infer<typeof BudgetSchema>;

