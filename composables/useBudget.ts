import type { Budget } from "~/utils/budgetSchemas";

export const useBudget = () => {
  const queryString = ref("");

  const fetchBudgets = async (name?: string) => {
    queryString.value = name ? `?name=${name}` : "";

    await useFetch<Budget[]>(
      () => `/api/budgets${queryString.value}`,
      {
        key: computed(() => `budgets`),
        transform: (data) =>
          data.map((budget) => ({
            ...budget,
            startingBudget: Number(budget.startingBudget),
            maxExpensesPerDay: Number(budget.maxExpensesPerDay),
          })),
      }
    );
  };

  const getBudgets = () => {
    const { data: budgets } = useNuxtData<Budget[]>(`budgets`);
    console.log('budgets en el composable', budgets.value);
    return budgets;
  };

  return {
    fetchBudgets,
    getBudgets,
  };
};
