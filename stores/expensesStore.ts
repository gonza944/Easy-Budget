import { defineStore } from "pinia";
import type { Budget } from "~/utils/budgetSchemas";
import type { Expense, ExpenseCreate } from "~/types/expense";
import type { CategoriesResponse } from "~/types/category";

type BudgetsResponse = Array<Budget & { id: number }>;

type SelectedBudget = Budget & { id: number };

interface FetchState {
  isLoading: boolean;
  error: string | null;
}

export const useMyExpensesStore = defineStore("myExpensesStore", () => {
  // State
  const budgets = ref<BudgetsResponse>([]);
  const selectedBudget = ref<SelectedBudget | null>(null);
  const expenses = ref<Record<number, Expense[]>>({});
  const selectedDate = ref<Date>(new Date());
  const categories = ref<CategoriesResponse>([]);

  // UI states
  const budgetsFetchState = ref<FetchState>({
    isLoading: false,
    error: null,
  });
  const expensesFetchState = ref<FetchState>({
    isLoading: false,
    error: null,
  });
  const { fetchMonthlyBudget, fetchRemainingBudget } = useUseExpensesTotals();
  const { fetchExpensesBurnDown } = useBurnDownChartData();
  const { fetchExpensesByCategory } = useExpensesByCategoryChart();
  // Getters
  const getSelectedBudget = computed(() => selectedBudget.value);

  const getExpensesByBudgetId = computed(() => {
    return (budgetId: number) => expenses.value[budgetId] || [];
  });

  const getSelectedBudgetExpenses = computed(() => {
    if (!selectedBudget.value?.id) return [];
    return expenses.value[selectedBudget.value.id] || [];
  });

  const getExpenses = computed(() => expenses.value);

  const getBudgets = computed(() => budgets.value);

  const getSelectedDate = computed(() => selectedDate.value);

  const getCategories = computed(() => categories.value);

  const getCategoryFromExpense = computed(() => {
    return (expense: Expense) => {
      return categories.value.find(
        (category) => category.id === expense?.category_id
      );
    };
  });

  // Add watchers for date and budget changes to auto-fetch expenses
  watch([selectedDate, selectedBudget], () => {
    fetchCategories();
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

  const isLoadingBudgets = computed(() => budgetsFetchState.value.isLoading);
  const isLoadingExpenses = computed(() => expensesFetchState.value.isLoading);
  const budgetsError = computed(() => budgetsFetchState.value.error);
  const expensesError = computed(() => expensesFetchState.value.error);

  // Actions
  async function fetchBudgets(name?: string) {
    try {
      budgetsFetchState.value = { isLoading: true, error: null };

      const { data: fetchedBudgets, error } = await useFetch<BudgetsResponse>(
        () => `/api/budgets${name ? `?name=${name}` : ""}`,
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

      if (error.value) {
        throw new Error(error.value.message || "Failed to fetch budgets");
      }

      budgets.value = fetchedBudgets.value || [];
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch budgets";
      budgetsFetchState.value.error = errorMessage;
      console.error("Error fetching budgets:", err);
    } finally {
      budgetsFetchState.value.isLoading = false;
    }
  }

  async function fetchExpenses(budgetId: number) {
    // Skip if already loading for this budget
    if (expensesFetchState.value.isLoading) return;

    try {
      expensesFetchState.value = { isLoading: true, error: null };
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

      fetchCalculatedData(budgetId);

      // Budget metrics will be recalculated automatically via watchEffect
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch expenses";
      expensesFetchState.value.error = errorMessage;
      console.error("Error fetching expenses:", err);
    } finally {
      expensesFetchState.value.isLoading = false;
    }
  }

  const fetchCalculatedData = (budgetId: number) => {
    console.log("fetching calculated data", budgetId, selectedDate.value);
    fetchMonthlyBudget(budgetId, selectedDate.value);
    fetchRemainingBudget(budgetId);
    const { startDate, endDate } = calculateFirstAndLastDayOfTheMonth(
      selectedDate.value
    );
    fetchExpensesBurnDown(budgetId, startDate, endDate);
    fetchExpensesByCategory(budgetId, startDate, endDate);
  };

  function setSelectedBudget(budgetId: number) {
    const budget = budgets.value.find((budget) => budget.id === budgetId);
    if (!budget) return;

    selectedBudget.value = budget;
  }

  function setSelectedDate(date: Date) {
    selectedDate.value = date;
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
  async function fetchCategories() {
    const { data: fetchedCategories, error } =
      await useFetch<CategoriesResponse>(() => `/api/categories`, {
        key: `categories`,
      });

    if (error.value) {
      throw new Error(error.value.message || "Failed to fetch categories");
    }

    categories.value = fetchedCategories.value || [];
  }

  return {
    // State
    budgets,
    selectedBudget,
    expenses,
    selectedDate,

    // Fetch states
    isLoadingBudgets,
    isLoadingExpenses,
    budgetsError,
    expensesError,

    // Getters
    getSelectedBudget,
    getExpensesByBudgetId,
    getSelectedBudgetExpenses,
    getExpenses,
    getBudgets,
    getRemainingDailyBudget,
    getSelectedDate,
    getCategories,
    getCategoryFromExpense,
    // Actions
    fetchBudgets,
    fetchExpenses,
    setSelectedBudget,
    setSelectedDate,
    addExpense,
    deleteExpense,
    fetchCategories,
  };
});
