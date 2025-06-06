export const useUseExpensesTotals = () => {
  const fetchMonthlyBudget = (budget_id: number, target_date: Date) => {
    useFetch("/api/metrics/monthlyBudget", {
      query: {
        budget_id,
        target_date: target_date.toISOString(),
      },
      key: `monthlyBudget`,
    });
  };

  const monthlyBudget = computed(() => {
    const { data } = useNuxtData<number>("monthlyBudget");
    return data.value;
  });

  const fetchRemainingBudget = (budget_id: number) => {
    useFetch("/api/metrics/remainingBudget", {
      query: {
        budget_id,
      },
      key: `remainingBudget`,
    });
  };

  const remainingBudget = computed(() => {
    const { data } = useNuxtData<number>("remainingBudget");
    return data.value;
  });

  return {
    fetchMonthlyBudget,
    monthlyBudget,
    remainingBudget,
    fetchRemainingBudget,
  };
};
