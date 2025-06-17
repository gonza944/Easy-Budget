import { defineStore, storeToRefs } from "pinia";
import { useSelectedDate } from "~/composables/useSelectedDate";
import { useMyBudgetStoreStore } from "~/stores/budgetStore";
import type { Expense, ExpenseCreate } from "~/types/expense";

export const useMyExpensesStore = defineStore("myExpensesStore", () => {
  const budgetStore = useMyBudgetStoreStore();
  const { selectedBudget } = storeToRefs(budgetStore);
  const { selectedDate } = useSelectedDate();
  const { categories } = storeToRefs(useCategoryStore());

  // State
  const expenses = ref<Record<number, Expense[]>>({});

  const getExpensesByBudgetId = computed(() => {
    return (budgetId: number) => expenses.value[budgetId] || [];
  });

  const getExpenses = computed(() => expenses.value);

  const getCategoryFromExpense = computed(() => {
    return (expense: Expense) => {
      return categories.value.find(
        (category) => category.id === expense?.category_id
      );
    };
  });

  // Add watchers for date and budget changes to auto-fetch expenses
  watch([selectedDate, selectedBudget], () => {
    if (selectedBudget.value?.id) {
      fetchExpenses(selectedBudget.value.id);
    }
  });

  // Derived getters for budget calculations now use budgetMetrics
  const getRemainingDailyBudget = computed(() => {
    if (!selectedBudget.value?.id) return 0;

    const budgetId = selectedBudget.value.id;
    const budgetExpenses = expenses.value[budgetId] || [];

    const totalExpenses = budgetExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    const maxDailyBudget = Number(selectedBudget.value.maxExpensesPerDay);

    return maxDailyBudget - totalExpenses;
  });

  async function fetchExpenses(budgetId: number) {
    try {
      const date = selectedDate.value;

      // Format date as YYYY-MM-DD (without time component)
      const formattedDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      const { data: fetchedExpenses, error } = await useFetch<Expense[]>(
        () => `/api/expenses`,
        {
          query: {
            budget_id: budgetId.toString(),
            date: formattedDate,
          },
          key: `expenses-${budgetId}-${formattedDate}`,
        }
      );

      if (error.value) {
        throw new Error(error.value.message || "Failed to fetch expenses");
      }

      // Update expenses while preserving other budgets' expenses
      expenses.value = {
        ...expenses.value,
        [budgetId]: fetchedExpenses.value || [],
      };

      // All calculated data is now handled by individual store watchers
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  }

  // Add/update an expense and recalculate metrics
  async function addExpense(expense: ExpenseCreate) {
    if (!selectedBudget.value?.id) return;

    const budgetId = selectedBudget.value.id;
    const currentExpenses = [...(expenses.value[budgetId] || [])];

    currentExpenses.push({
      ...expense,
      id: currentExpenses.length + 1,
    });

    expenses.value = {
      ...expenses.value,
      [budgetId]: currentExpenses,
    };

    await $fetch<Expense>("/api/expenses", {
      method: "POST",
      body: expense,
    });

    fetchExpenses(budgetId);
  }

  // Delete an expense and recalculate metrics
  async function deleteExpense(expenseId: number) {
    if (!selectedBudget.value?.id) return;

    const budgetId = selectedBudget.value.id;
    const currentExpenses = expenses.value[budgetId] || [];

    expenses.value = {
      ...expenses.value,
      [budgetId]: currentExpenses.filter((e) => e.id !== expenseId),
    };

    await $fetch<Expense>("/api/expenses", {
      method: "DELETE",
      body: {
        id: expenseId,
      },
    });

    fetchExpenses(budgetId);
  }

  return {
    // State
    expenses,

    // Getters
    getExpensesByBudgetId,
    getExpenses,
    getRemainingDailyBudget,
    getCategoryFromExpense,
    // Actions
    fetchExpenses,
    addExpense,
    deleteExpense,
  };
});
