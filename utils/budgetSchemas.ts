import { z } from "zod";

// API schema for backend processing
export const newBudgetSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  startingBudget: z.number().min(1),
  budgetType: z.enum(["daily", "monthly"]).default("monthly"),
  budgetAmount: z.number().min(1),
  startDate: z.string().optional().default(new Date().toLocaleDateString()),
});

// Updated budget schema with current budget period info
export const BudgetSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional().nullable(),
  startingBudget: z.number().min(1),
  startDate: z.string().optional().default(new Date().toLocaleDateString()),
  selected: z.boolean().default(false),
  currentPeriod: z
    .object({
      id: z.number(),
      dailyAmount: z.number(),
      monthlyAmount: z.number(),
      validFromYear: z.number(),
      validFromMonth: z.number(),
      isCurrent: z.boolean(),
    })
    .optional(),
});

export const BudgetPeriodSchema = z.object({
  id: z.number(),
  budgetId: z.number(),
  dailyAmount: z.number(),
  monthlyAmount: z.number(),
  validFromYear: z.number(),
  validFromMonth: z.number(),
  validUntilYear: z.number().optional().nullable(),
  validUntilMonth: z.number().optional().nullable(),
  isCurrent: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateBudgetPeriodSchema = z.object({
  budgetId: z.number(),
  budgetType: z.enum(["daily", "monthly"]),
  budgetAmount: z.number().min(1),
  validFromYear: z.number(),
  validFromMonth: z.number(),
});

// Reusable schema for budget type and amount fields
export const budgetTypeAmountSchema = z.object({
  budgetType: CreateBudgetPeriodSchema.shape.budgetType,
  budgetAmount: z.union([
    z.string().min(1, { message: "Required" }).transform((val) => parseFloat(val)),
    z.number().min(1, { message: "Required" })
  ]),
});

// Form schema for frontend (accepts either daily or monthly input)
export const newBudgetSchemaForm = z
  .object({
    name: z.string().min(1, { message: "Required" }),
    description: z.string().optional(),
    startingBudget: z
      .string()
      .min(1, { message: "Required" })
      .transform((val) => parseFloat(val)),
    startDate: z.date().optional().default(new Date()),
  })
  .extend(budgetTypeAmountSchema.shape);

export const NewBudgetSchema = BudgetSchema.omit({ id: true }).extend({
  startDate: z.date().optional().default(new Date()),
});

export const BudgetsSchema = z.array(BudgetSchema);

// API Response schemas
export const BudgetApiResponseSchema = z.object({
  success: z.boolean(),
  data: BudgetSchema.optional(),
  error: z.string().optional(),
});

export const CreateBudgetApiResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      id: z.number(),
      name: z.string(),
      description: z.string().optional().nullable(),
      startingBudget: z.number(),
      startDate: z.string(),
      currentPeriod: BudgetPeriodSchema.pick({
        dailyAmount: true,
        monthlyAmount: true,
        validFromYear: true,
        validFromMonth: true,
        isCurrent: true,
      }),
    })
    .optional(),
  error: z.string().optional(),
});

export const DeleteBudgetApiResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

// Export types
export type NewBudgetSchema = z.infer<typeof NewBudgetSchema>;
export type Budget = z.infer<typeof BudgetSchema>;
export type BudgetPeriod = z.infer<typeof BudgetPeriodSchema>;
export type CreateBudgetPeriod = z.infer<typeof CreateBudgetPeriodSchema>;
export type BudgetsResponse = z.infer<typeof BudgetsSchema>;
export type BudgetApiResponse = z.infer<typeof BudgetApiResponseSchema>;
export type CreateBudgetApiResponse = z.infer<
  typeof CreateBudgetApiResponseSchema
>;
export type DeleteBudgetApiResponse = z.infer<
  typeof DeleteBudgetApiResponseSchema
>;
export type EditCurrentPeriodBudget = z.infer<typeof budgetTypeAmountSchema>;
