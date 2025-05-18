import { defineStore } from "pinia";
import type { Expense } from "~/server/api/expenses/index.get";
import type { Budget } from "~/utils/budgetSchemas";

type selectedBudget = Budget & {
  remainingDailyBudget?: number;
  remainingMonthlyBudget?: number;
  remainingBudget?: number;
};

export const useMyExpensesStoreStore = defineStore("myExpensesStoreStore", {
  state: () => {
    return {
      budgets: [] as BudgetsResponse,
      selectedBudget: null as selectedBudget | null,
      expenses: null as { [key: string]: Expense[] } | null,
    };
  },
  actions: {
    async fetchBudgets(name?: string) {
      const { data: budgets } = await useFetch<BudgetsResponse>(
        () => {
          return `/api/budgets${name ? `?name=${name}` : ""}`;
        },
        {
          key: computed(() => `budgets-${name || "all"}`),
          transform: (data) =>
            data.map((budget) => ({
              ...budget,
              startingBudget: Number(budget.startingBudget),
              maxExpensesPerDay: Number(budget.maxExpensesPerDay),
            })),
        }
      );
      this.budgets = budgets.value || [];
    },
    async fetchExpenses(budgetId: number) {
      const { data: expenses } = await useFetch<Expense[]>(
        () => `/api/expenses?budgetId=${budgetId}`
      );
      this.expenses = { [budgetId]: expenses.value || [] };
    },
    setSelectedBudget(budgetId: number) {
      this.selectedBudget =
        this.budgets.find((budget) => budget.id === budgetId) || null;
      this.fetchExpenses(budgetId);
    },
  },
  getters: {
    getSelectedBudget: (state) => state.selectedBudget,
    getExpenses: (state) => state.expenses,
    getBudgets: (state) => state.budgets,
    getRemainingDailyBudget: (state) =>
      state.selectedBudget?.remainingDailyBudget,
    getRemainingMonthlyBudget: (state) =>
      state.selectedBudget?.remainingMonthlyBudget,
    getRemainingBudget: (state) => state.selectedBudget?.remainingBudget,
  },
});
