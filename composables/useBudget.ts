import type { BudgetApiResponse } from "~/server/api/budgets/index.post";
import type { Budget, NewBudgetSchema } from "~/utils/budgetSchemas";


export const useBudget = () => {
  const queryString = ref("");
  const selectedBudget = useState<Budget | null>(() => null);
  const { fetchExpenses } = useMyExpensesStore();
  const { data: budgets } = useNuxtData<Budget[]>(`budgets`);


  const fetchBudgets = async (name?: string) => {
    queryString.value = name ? `?name=${name}` : "";

    await useFetch<Budget[]>(() => `/api/budgets${queryString.value}`, {
      key: `budgets`, // Use string directly instead of computed
      transform: (data) =>
        data.map((budget) => ({
          ...budget,
          startingBudget: Number(budget.startingBudget),
          maxExpensesPerDay: Number(budget.maxExpensesPerDay),
        })),
    });
  };

  const getBudgets = () => {
    return budgets;
  };

  const setSelectedBudget = (budgetId: number) => {
    if (selectedBudget.value?.id === budgetId) return;
    const budgets = getBudgets();
    const budget = budgets.value?.find((budget) => budget.id === budgetId);
    if (!budget) return;
    selectedBudget.value = budget;
    fetchExpenses(budgetId);
  };

  const deleteBudget = async (budgetId: number) => {
    const budgets = getBudgets();
    let previousBudgets: Budget[] = [];

    return await $fetch("/api/budgets", {
      method: "DELETE",
      body: { id: Number(budgetId) },
      onRequest() {
        // Store the previously cached value to restore if fetch fails
        previousBudgets = budgets.value || [];

        // Optimistically remove the budget from the list
        budgets.value = previousBudgets.filter((budget) => budget.id !== budgetId);
      },
      onResponseError() {
        // Rollback the data if the request failed
        budgets.value = previousBudgets;
      },
      async onResponse() {
        // Invalidate budgets in the background if the request succeeded
        await refreshNuxtData("budgets");
      },
    });
  };

  const createBudget = async (budget: NewBudgetSchema) => {
    const budgets = getBudgets();
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
        };

        budgets.value = [optimisticBudget,...previousBudgets];
      },
      onResponseError() {
        // Rollback the data if the request failed
        budgets.value = previousBudgets;
      },
      async onResponse({response}) {
        // Invalidate budgets in the background if the request succeeded
        await refreshNuxtData("budgets");
        budgets.value = [response._data.data,...previousBudgets];
      },
    });
  };

  return {
    fetchBudgets,
    getBudgets,
    setSelectedBudget,
    selectedBudget,
    deleteBudget,
    createBudget,
  };
};
