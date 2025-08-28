import { useBurnDownChartStore } from "~/stores/useBurnDownChartStore";
import { UseExpensesByCategoryStore } from "~/stores/useExpensesByCategoryStore";
import { UseExpensesTotalsStore } from "~/stores/useExpensesTotalsStore";

export const useRefreshMetrics = () => {
  const refreshAllMetrics = async (budgetId: number, selectedDate: Date) => {
    const { startDate, endDate } = calculateFirstAndLastDayOfTheMonth(selectedDate);
    
    const { fetchExpensesBurnDown } = useBurnDownChartStore();
    const { fetchExpensesByCategory } = UseExpensesByCategoryStore();
    const { fetchMonthlyBudget } = UseExpensesTotalsStore();

    // Fetch all calculated data in parallel for better performance
    await Promise.all([
      fetchExpensesBurnDown(budgetId, startDate, endDate),
      fetchExpensesByCategory(budgetId, startDate, endDate),
      fetchMonthlyBudget(budgetId, selectedDate),
    ]);
  };

  return {
    refreshAllMetrics,
  };
}; 