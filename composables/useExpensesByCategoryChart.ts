export const useExpensesByCategoryChart = () => {
  const fetchExpensesByCategory = (
    budget_id: number,
    startDate: string,
    endDate: string
  ) => {
   return useFetch("/api/metrics/totalExpensesByCategory", {
      query: {
        initial_date: startDate,
        final_date: endDate,
        budget_id,
      },
      key: `expensesByCategory`,
    });
  };

  const expensesByCategory = computed(() => {
    const { data } = useNuxtData<{
      expensesByCategory: Record<string, number>;
    }>(`expensesByCategory`);
    return data.value;
  });
  return {
    fetchExpensesByCategory,
    expensesByCategory,
  };
};
