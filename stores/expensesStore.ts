import { defineStore } from "pinia";
import type { Expense } from "~/server/api/expenses/index.get";
import type { Budget } from "~/utils/budgetSchemas";

type BudgetsResponse = Array<Budget & { id: number }>;

type SelectedBudget = Budget & { id: number };

// Separate budget metrics to avoid recursive update
interface BudgetMetrics {
  remainingDailyBudget: number;
  remainingMonthlyBudget: number;
  remainingBudget: number;
}

interface FetchState {
  isLoading: boolean;
  error: string | null;
}

export const useMyExpensesStoreStore = defineStore("myExpensesStoreStore", () => {
  // State
  const budgets = ref<BudgetsResponse>([]);
  const selectedBudget = ref<SelectedBudget | null>(null);
  const expenses = ref<Record<number, Expense[]>>({});
  
  // Separate budget metrics from selectedBudget
  const budgetMetrics = ref<BudgetMetrics>({
    remainingDailyBudget: 0,
    remainingMonthlyBudget: 0,
    remainingBudget: 0
  });
  
  // UI states
  const budgetsFetchState = ref<FetchState>({ isLoading: false, error: null });
  const expensesFetchState = ref<FetchState>({ isLoading: false, error: null });

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
  
  // Calculate budget metrics when expenses or selectedBudget changes
  // but don't modify selectedBudget itself to avoid recursive updates
  const calculateBudgetMetrics = () => {
    if (!selectedBudget.value || !selectedBudget.value.id) {
      budgetMetrics.value = {
        remainingDailyBudget: 0,
        remainingMonthlyBudget: 0,
        remainingBudget: 0
      };
      return;
    }
    
    const budgetId = selectedBudget.value.id;
    const budgetExpenses = expenses.value[budgetId] || [];
    
    const totalExpenses = budgetExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount), 
      0
    );
    
    const startingBudget = Number(selectedBudget.value.startingBudget);
    const maxDailyBudget = Number(selectedBudget.value.maxExpensesPerDay);
    
    // Update the separate metrics object instead of selectedBudget
    budgetMetrics.value = {
      remainingBudget: startingBudget - totalExpenses,
      remainingDailyBudget: maxDailyBudget,
      remainingMonthlyBudget: startingBudget - totalExpenses
    };
  };
  
  // Use watchEffect to run calculations when dependencies change
  watchEffect(() => {
    if (selectedBudget.value && getSelectedBudgetExpenses.value) {
      calculateBudgetMetrics();
    }
  });
  
  // Derived getters for budget calculations now use budgetMetrics
  const getRemainingDailyBudget = computed(() => 
    budgetMetrics.value.remainingDailyBudget
  );
  
  const getRemainingMonthlyBudget = computed(() => 
    budgetMetrics.value.remainingMonthlyBudget
  );
  
  const getRemainingBudget = computed(() => 
    budgetMetrics.value.remainingBudget
  );
  
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
        throw new Error(error.value.message || 'Failed to fetch budgets');
      }
      
      budgets.value = fetchedBudgets.value || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch budgets';
      budgetsFetchState.value.error = errorMessage;
      console.error('Error fetching budgets:', err);
    } finally {
      budgetsFetchState.value.isLoading = false;
    }
  }
  
  async function fetchExpenses(budgetId: number) {
    // Skip if already loading for this budget
    if (expensesFetchState.value.isLoading) return;
    
    try {
      expensesFetchState.value = { isLoading: true, error: null };
      
      const { data: fetchedExpenses, error } = await useFetch<Expense[]>(
        () => `/api/expenses`,
        {
          query: { budgetId },
          key: `expenses-${budgetId}`
        }
      );
      
      if (error.value) {
        throw new Error(error.value.message || 'Failed to fetch expenses');
      }
      
      // Update expenses while preserving other budgets' expenses
      expenses.value = { 
        ...expenses.value, 
        [budgetId]: fetchedExpenses.value || [] 
      };
      
      // Budget metrics will be recalculated automatically via watchEffect
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch expenses';
      expensesFetchState.value.error = errorMessage;
      console.error('Error fetching expenses:', err);
    } finally {
      expensesFetchState.value.isLoading = false;
    }
  }
  
  function setSelectedBudget(budgetId: number) {
    const budget = budgets.value.find((budget) => budget.id === budgetId);
    if (!budget) return;
    
    selectedBudget.value = budget;
    
    // Only fetch expenses if we don't already have them for this budget
    if (!expenses.value[budgetId]?.length) {
      fetchExpenses(budgetId);
    }
    // Budget metrics will be recalculated automatically via watchEffect
  }
  
  // Add/update an expense and recalculate metrics
  function addExpense(expense: Expense) {
    if (!selectedBudget.value?.id) return;
    
    const budgetId = selectedBudget.value.id;
    const currentExpenses = [...(expenses.value[budgetId] || [])];
    
    // Check if expense already exists to update it
    const expenseIndex = currentExpenses.findIndex(e => e.id === expense.id);
    
    if (expenseIndex >= 0) {
      // Update existing expense
      currentExpenses[expenseIndex] = expense;
    } else {
      // Add new expense
      currentExpenses.push(expense);
    }
    
    expenses.value = {
      ...expenses.value,
      [budgetId]: currentExpenses
    };
    
    // Budget metrics will be recalculated automatically via watchEffect
  }
  
  // Delete an expense and recalculate metrics
  function deleteExpense(expenseId: number) {
    if (!selectedBudget.value?.id) return;
    
    const budgetId = selectedBudget.value.id;
    const currentExpenses = expenses.value[budgetId] || [];
    
    expenses.value = {
      ...expenses.value,
      [budgetId]: currentExpenses.filter(e => e.id !== expenseId)
    };
    
    // Budget metrics will be recalculated automatically via watchEffect
  }

  return {
    // State
    budgets,
    selectedBudget,
    expenses,
    budgetMetrics,
    
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
    getRemainingMonthlyBudget,
    getRemainingBudget,
    
    // Actions
    fetchBudgets,
    fetchExpenses,
    setSelectedBudget,
    addExpense,
    deleteExpense
  };
});
