import { defineStore } from "pinia";
import { toast } from "vue-sonner";
import type { BudgetApiResponse } from "~/server/api/budgets/index.post";
import type { Budget, NewBudgetSchema } from "~/utils/budgetSchemas";


export const useMyBudgetStoreStore = defineStore("myBudgetStoreStore", () => {
  const budgets = ref<Budget[]>();
  const selectedBudget = ref<Budget | null>(null);
  const queryString = ref("");
  const loading = ref(false);

  const showErrorToast = (message: string) => {
    toast.error(message);
  }

  const fetchBudgets = async (name?: string) => {
    queryString.value = name ? `?name=${name}` : "";
    loading.value = !budgets.value;
    const { data } = await useFetch<Budget[]>(() => `/api/budgets${queryString.value}`, {
      key: `budgets`, // Use string directly instead of computed
      transform: (data) =>
        data.map((budget) => ({
          ...budget,
          startingBudget: Number(budget.startingBudget),
          maxExpensesPerDay: Number(budget.maxExpensesPerDay),
        })),
    });
    budgets.value = data.value || [];
    
    // Auto-set the selected budget from the fetched data
    const selected = budgets.value.find(budget => budget.selected);
    if (selected) {
      selectedBudget.value = selected;
    }
    loading.value = false;
  };

  // Fetch only the selected budget for faster loading
  const fetchSelectedBudget = async () => {
    const { data } = await useFetch<Budget | null>('/api/budgets/selected', {
      key: 'selected-budget',
      transform: (budget: Budget | null) =>
        budget ? {
          ...budget,
          startingBudget: Number(budget.startingBudget),
          maxExpensesPerDay: Number(budget.maxExpensesPerDay),
        } : null,
    });
    
    if (data.value) {
      selectedBudget.value = data.value;
    }
    
    return data.value;
  };

  const setSelectedBudget = async (budgetId: number) => {
    if (selectedBudget.value?.id === budgetId) return;
    
    const budget = budgets.value?.find((budget) => budget.id === budgetId);
    if (!budget) return;

    let previousBudgets: Budget[] = [];
    let previousSelected: Budget | null = null;

    return await $fetch('/api/budgets/select', {
      method: 'PATCH',
      body: { budgetId },
      onRequest() {
        // Store the previously cached values to restore if fetch fails
        previousBudgets = budgets.value || [];
        previousSelected = selectedBudget.value;

        // Optimistically update local state
        if (selectedBudget.value) {
          selectedBudget.value.selected = false;
        }
        budget.selected = true;
        selectedBudget.value = budget;

        // Update the budgets array to reflect the change
        budgets.value = previousBudgets.map(b => ({
          ...b,
          selected: b.id === budgetId
        }));
      },
      onResponseError() {
        // Rollback the data if the request failed
        budgets.value = previousBudgets;
        selectedBudget.value = previousSelected;
        showErrorToast("Failed to select budget");
      },
      async onResponse() {
        // Invalidate budgets in the background if the request succeeded
        await fetchBudgets();
      },
    });
  };

  const deleteBudget = async (budgetId: number) => {
    let previousBudgets: Budget[] = [];
    let previousSelected: Budget | null = null;

    return await $fetch("/api/budgets", {
      method: "DELETE",
      body: { id: Number(budgetId) },
      onRequest() {
        // Store the previously cached value to restore if fetch fails
        previousBudgets = budgets.value || [];
        previousSelected = selectedBudget.value;

        // Optimistically remove the budget from the list
        budgets.value = previousBudgets.filter((budget) => budget.id !== budgetId);
        
        // Clear selected budget if it was the one being deleted
        if (selectedBudget.value?.id === budgetId) {
          selectedBudget.value = null;
        }
      },
      onResponseError() {
        // Rollback the data if the request failed
        budgets.value = previousBudgets;
        selectedBudget.value = previousSelected;
        showErrorToast("Failed to delete budget");
      },
      async onResponse() {
        // Invalidate budgets in the background if the request succeeded
        await fetchBudgets();
      },
    });
  };

  const createBudget = async (budget: NewBudgetSchema) => {
    let previousBudgets: Budget[] = [];

    return await $fetch<BudgetApiResponse>("/api/budgets", {
      method: "POST",
      body: budget,
      onRequest() {
        // Store the previously cached value to restore if fetch fails
        previousBudgets = budgets.value || [];

        // Optimistically update the budgets with a temporary ID
        const optimisticBudget: Budget = {
          ...budget,
          id: Date.now(), // Use timestamp as temporary ID to avoid conflicts
          startDate: formatDateToUTCISOString(budget.startDate),
          startingBudget: Number(budget.startingBudget),
          maxExpensesPerDay: Number(budget.maxExpensesPerDay),
          selected: false, // New budgets are not selected by default
        };

        budgets.value = [optimisticBudget,...previousBudgets];
      },
      onResponseError() {
        // Rollback the data if the request failed
        budgets.value = previousBudgets;
        showErrorToast("Failed to create budget");
      },
      async onResponse() {
        // Invalidate budgets in the background if the request succeeded
        await fetchBudgets();
      },
    });
  };

  return {
    fetchBudgets,
    fetchSelectedBudget,
    budgets,
    selectedBudget,
    setSelectedBudget,
    deleteBudget,
    createBudget,
    loading,
  };
});
