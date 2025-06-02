export const useUseExpensesTotals = () => {
  const fetchMonthlyBudget = async (budget_id: number, target_date: Date) => {
    await useFetch("/api/metrics/monthlyBudget", {
      query: {
        budget_id,
        target_date: target_date.toISOString(),
      },
      key: `monthlyBudget`,
    });
  };

  const monthlyBudget = computed(() => {
    return useNuxtData("monthlyBudget");
  });

  return {
    fetchMonthlyBudget,
    monthlyBudget,
  };
};
