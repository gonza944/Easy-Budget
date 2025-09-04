import { z } from 'zod';
import { ExpenseSchema, ExpenseCreateSchema, UpdateExpenseSchema } from './expense';

// ===== MEMBERS TABLE =====
export const MemberSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  display_name: z.string(),
  user_id: z.string().uuid().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateMemberSchema = z.object({
  email: z.string().email(),
  display_name: z.string(),
  user_id: z.string().uuid().optional().nullable(),
});

// ===== SHARED ACTIVITIES TABLE =====
export const SharedActivitySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  is_active: z.boolean(),
});

export const CreateSharedActivitySchema = z.object({
  name: z.string().min(1, "Activity name is required"),
  description: z.string().optional().nullable(),
});

export const DeleteSharedActivitySchema = z.object({
  id: z.number(),
});

// ===== ACTIVITY PARTICIPATIONS TABLE =====
export const ActivityParticipationSchema = z.object({
  id: z.number(),
  activity_id: z.number(),
  member_id: z.number(),
  joined_at: z.string(),
});

export const CreateActivityParticipationSchema = z.object({
  activity_id: z.number(),
  member_id: z.number(),
});

// ===== SPLIT CALCULATION SCHEMAS =====
export const EqualSplitSchema = z.object({
  type: z.literal('equal'),
  participants: z.array(z.object({
    member_id: z.number(),
  })),
});

export const CustomSplitSchema = z.object({
  type: z.literal('custom'),
  participants: z.array(z.object({
    member_id: z.number(),
    amount: z.number().positive(),
  })),
});

export const PercentageSplitSchema = z.object({
  type: z.literal('percentage'),
  participants: z.array(z.object({
    member_id: z.number(),
    percentage: z.number().min(0).max(100),
  })),
});

export const SplitCalculationSchema = z.discriminatedUnion('type', [
  EqualSplitSchema,
  CustomSplitSchema,
  PercentageSplitSchema,
]);

// ===== SHARED EXPENSES TABLE =====
export const SharedExpenseSchema = ExpenseSchema.extend({
  activity_id: z.number(),
  paid_by_member_id: z.number(),
  
  // Shared expense specific
  split_calculation: SplitCalculationSchema,
  updated_at: z.string(),
}).omit({
  budget_id: true, // Replace budget_id with activity_id
});

export const CreateSharedExpenseSchema = ExpenseCreateSchema.extend({
  activity_id: z.number(),
  paid_by_member_id: z.number(),
  split_calculation: SplitCalculationSchema,
}).omit({
  budget_id: true, // Replace budget_id with activity_id
});

export const UpdateSharedExpenseSchema = UpdateExpenseSchema.extend({
  split_calculation: SplitCalculationSchema.optional(),
}).omit({
  budget_id: true, // Not needed for shared expenses
});

// ===== SETTLEMENT TRANSACTIONS TABLE =====
export const SettlementTransactionSchema = z.object({
  id: z.number(),
  activity_id: z.number(),
  payer_member_id: z.number(),
  payee_member_id: z.number(),
  amount: z.number().positive(),
  settlement_date: z.string(),
  notes: z.string().nullable(),
  settlement_method: z.string().nullable(),
  created_at: z.string(),
});

export const CreateSettlementTransactionSchema = z.object({
  activity_id: z.number(),
  payer_member_id: z.number(),
  payee_member_id: z.number(),
  amount: z.number().positive("Settlement amount must be greater than 0"),
  notes: z.string().optional().nullable(),
  settlement_method: z.string().optional().nullable(),
});

// ===== BALANCE CALCULATION RESULT =====
export const MemberBalanceSchema = z.object({
  member_id: z.number(),
  member_name: z.string(),
  member_email: z.string().email(),
  net_balance: z.number(),
});

export const ActivityBalancesSchema = z.array(MemberBalanceSchema);

// ===== EXTENDED SCHEMAS FOR API RESPONSES =====
export const SharedActivityWithMembersSchema = SharedActivitySchema.extend({
  members: z.array(MemberSchema),
});

export const SharedActivityWithDetailsSchema = SharedActivitySchema.extend({
  members: z.array(MemberSchema),
  expenses: z.array(SharedExpenseSchema),
  settlements: z.array(SettlementTransactionSchema),
  balances: z.array(MemberBalanceSchema),
});

export const SharedExpenseWithMemberSchema = SharedExpenseSchema.extend({
  paid_by_member: MemberSchema,
  category: z.object({
    id: z.number(),
    name: z.string(),
  }).nullable(),
});

export const SettlementTransactionWithMembersSchema = SettlementTransactionSchema.extend({
  payer_member: MemberSchema,
  payee_member: MemberSchema,
});

// ===== API RESPONSE SCHEMAS =====
export const SharedActivityApiResponseSchema = z.object({
  success: z.boolean(),
  data: SharedActivitySchema.optional(),
  error: z.string().optional(),
});

export const SharedExpenseApiResponseSchema = z.object({
  success: z.boolean(),
  data: SharedExpenseSchema.optional(),
  error: z.string().optional(),
});

export const SettlementApiResponseSchema = z.object({
  success: z.boolean(),
  data: SettlementTransactionSchema.optional(),
  error: z.string().optional(),
});

export const MemberApiResponseSchema = z.object({
  success: z.boolean(),
  data: MemberSchema.optional(),
  error: z.string().optional(),
});

export const DeleteSharedActivityResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

// ===== EXPORT TYPES =====
export type Member = z.infer<typeof MemberSchema>;
export type CreateMember = z.infer<typeof CreateMemberSchema>;

export type SharedActivity = z.infer<typeof SharedActivitySchema>;
export type CreateSharedActivity = z.infer<typeof CreateSharedActivitySchema>;
export type DeleteSharedActivity = z.infer<typeof DeleteSharedActivitySchema>;

export type ActivityParticipation = z.infer<typeof ActivityParticipationSchema>;
export type CreateActivityParticipation = z.infer<typeof CreateActivityParticipationSchema>;

export type EqualSplit = z.infer<typeof EqualSplitSchema>;
export type CustomSplit = z.infer<typeof CustomSplitSchema>;
export type PercentageSplit = z.infer<typeof PercentageSplitSchema>;
export type SplitCalculation = z.infer<typeof SplitCalculationSchema>;

export type SharedExpense = z.infer<typeof SharedExpenseSchema>;
export type CreateSharedExpense = z.infer<typeof CreateSharedExpenseSchema>;
export type UpdateSharedExpense = z.infer<typeof UpdateSharedExpenseSchema>;

export type SettlementTransaction = z.infer<typeof SettlementTransactionSchema>;
export type CreateSettlementTransaction = z.infer<typeof CreateSettlementTransactionSchema>;

export type MemberBalance = z.infer<typeof MemberBalanceSchema>;
export type ActivityBalances = z.infer<typeof ActivityBalancesSchema>;

export type SharedActivityWithMembers = z.infer<typeof SharedActivityWithMembersSchema>;
export type SharedActivityWithDetails = z.infer<typeof SharedActivityWithDetailsSchema>;
export type SharedExpenseWithMember = z.infer<typeof SharedExpenseWithMemberSchema>;
export type SettlementTransactionWithMembers = z.infer<typeof SettlementTransactionWithMembersSchema>;

export type SharedActivityApiResponse = z.infer<typeof SharedActivityApiResponseSchema>;
export type SharedExpenseApiResponse = z.infer<typeof SharedExpenseApiResponseSchema>;
export type SettlementApiResponse = z.infer<typeof SettlementApiResponseSchema>;
export type MemberApiResponse = z.infer<typeof MemberApiResponseSchema>;
export type DeleteSharedActivityResponse = z.infer<typeof DeleteSharedActivityResponseSchema>;

