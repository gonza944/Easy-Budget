export const useClearStore = () => {
  const { clearBudgets } = useMyBudgetStoreStore();
  const { clearCategories } = useCategoryStore();
  const { clearExpenses } = useMyExpensesStore();
  const { clearExpensesBurnDown } = useBurnDownChartStore();
  const { clearExpensesByCategory } = UseExpensesByCategoryStore();
  const { clearExpensesTotals } = UseExpensesTotalsStore();

  const clearStore = () => {
    clearNuxtData();
    clearBudgets();
    clearCategories();
    clearExpenses();
    clearExpensesBurnDown();
    clearExpensesByCategory();
    clearExpensesTotals();
  };

  return {
    clearStore,
  };
};
