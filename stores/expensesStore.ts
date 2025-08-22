import { defineStore, storeToRefs } from "pinia";
import { useSelectedDate } from "~/composables/useSelectedDate";
import { useMyBudgetStoreStore } from "~/stores/budgetStore";
import type { Expense, ExpenseCreate } from "~/types/expense";
import { toast } from "vue-sonner";

export const useMyExpensesStore = defineStore("myExpensesStore", () => {
  const { selectedDate } = useSelectedDate();
  const { categories } = storeToRefs(useCategoryStore());
  const showErrorToast = (message: string) => {
    toast.error(message);
  }
  // State
  const expenses = ref<Record<number, Expense[]>>({});
  const loading = ref(false);

  const clearExpenses = () => {
    expenses.value = {};
    loading.value = false;
  };

  const getExpensesByBudgetId = computed(() => {
    return (budgetId: number) => expenses.value[budgetId] || [];
  });

  const getCategoryFromExpense = computed(() => {
    return (expense: Expense) => {
      return categories.value.find(
        (category) => category.id === expense?.category_id
      );
    };
  });

  // Watch for changes in selectedBudget and selectedDate to auto-fetch expenses
  // Using nextTick to avoid circular dependency during store initialization
  nextTick(() => {
    // Access stores within the watcher to avoid circular dependency
    const { selectedBudget } = storeToRefs(useMyBudgetStoreStore());

    // Create computed values for only the parts we care about
    const budgetId = computed(() => selectedBudget.value?.id);

    // Watch the computed values that represent meaningful changes
    watch(
      [budgetId, selectedDate],
      ([currentBudgetId, _currentDate]) => {
        if (currentBudgetId) {
          fetchExpenses(currentBudgetId);
        }
      },
      { immediate: true }
    );
  });

  // Derived getters for budget calculations
  const getRemainingDailyBudget = computed(() => {
    // Access budget store within computed to avoid circular dependency
    const budgetStore = useMyBudgetStoreStore();
    const selectedBudget = budgetStore.selectedBudget;

    if (!selectedBudget?.id) return 0;

    const budgetId = selectedBudget.id;
    const budgetExpenses = expenses.value[budgetId] || [];

    const totalExpenses = budgetExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );

    const maxDailyBudget = Number(selectedBudget.maxExpensesPerDay);

    return maxDailyBudget - totalExpenses;
  });

  async function fetchExpenses(budgetId: number) {
    debugger;
    try {
      loading.value = !expenses.value[budgetId];
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
    } catch (error) {
      console.error("Error fetching expenses:", error);
      showErrorToast("Failed to fetch expenses");
    } finally {
      loading.value = false;
    }
  }

  // Add/update an expense and recalculate metrics
  async function addExpense(expense: ExpenseCreate) {
    // Access budget store within function to avoid circular dependency
    const { selectedBudget } = storeToRefs(useMyBudgetStoreStore());
    const { refreshAllMetrics } = useRefreshMetrics();

    if (!selectedBudget.value?.id) return;

    const budgetId = selectedBudget.value.id;
    let previousExpenses: Expense[] = [];

    return await $fetch<Expense>("/api/expenses", {
      method: "POST",
      body: expense,
      onRequest() {
        // Store the previously cached value to restore if fetch fails
        previousExpenses = expenses.value[budgetId] || [];

        // Optimistically add the expense with a temporary ID
        const optimisticExpense: Expense = {
          ...expense,
          id: Date.now(), // Temporary ID
        };

        expenses.value = {
          ...expenses.value,
          [budgetId]: [...previousExpenses, optimisticExpense],
        };
      },
      onResponseError() {
        // Rollback the data if the request failed
        expenses.value = {
          ...expenses.value,
          [budgetId]: previousExpenses,
        };
        showErrorToast("Failed to add expense");
      },
      async onResponse() {
        // Revalidate data on success
        fetchExpenses(budgetId);
        refreshAllMetrics(budgetId, selectedDate.value);
      },
    });
  }

  // Delete an expense and recalculate metrics
  async function deleteExpense(expenseId: number) {
    const { selectedBudget } = storeToRefs(useMyBudgetStoreStore());
    const { refreshAllMetrics } = useRefreshMetrics();

    if (!selectedBudget.value?.id) return;

    const budgetId = selectedBudget.value.id;
    let previousExpenses: Expense[] = [];

    return await $fetch<Expense>("/api/expenses", {
      method: "DELETE",
      body: {
        id: expenseId,
      },
      onRequest() {
        // Store the previously cached value to restore if fetch fails
        previousExpenses = expenses.value[budgetId] || [];

        // Optimistically remove the expense from the list
        expenses.value = {
          ...expenses.value,
          [budgetId]: previousExpenses.filter((e) => e.id !== expenseId),
        };
      },
      onResponseError() {
        // Rollback the data if the request failed
        expenses.value = {
          ...expenses.value,
          [budgetId]: previousExpenses,
        };
        showErrorToast("Failed to delete expense");
      },
      async onResponse() {
        // Revalidate data on success
        fetchExpenses(budgetId);
        refreshAllMetrics(budgetId, selectedDate.value);
      },
    });
  }

  return {
    // State
    expenses,

    // Getters
    getExpensesByBudgetId,
    getRemainingDailyBudget,
    getCategoryFromExpense,
    loading,
    // Actions
    clearExpenses,
    fetchExpenses,
    addExpense,
    deleteExpense,
  };
});
