import { defineStore, storeToRefs } from "pinia";
import type { DataRecord } from "~/types/metrics";

export const UseBurnDownChartStore = defineStore(
  "myUseBurnDownChartStore",
  () => {
    const expensesBurnDown = ref<DataRecord[]>([]);

    const fetchExpensesBurnDown = async (
      budget_id: number,
      startDate: string,
      endDate: string
    ) => {
      const { data } = await useFetch<{expensesBurnDown: DataRecord[]}>("/api/metrics/expensesBurnDown", {
        query: {
          initial_date: startDate,
          final_date: endDate,
          budget_id,
        },
        key: `expensesBurnDown-${budget_id}-${startDate}-${endDate}`,
      });

      expensesBurnDown.value = data.value?.expensesBurnDown || [];
    };

    // Watch for changes in selectedBudget and selectedDate to auto-fetch data
    // Using nextTick to avoid circular dependency during store initialization
    nextTick(() => {
      // Use storeToRefs to get reactive refs from the stores
      const { selectedBudget } = storeToRefs(useMyBudgetStoreStore());
      const { selectedDate } = useSelectedDate();
      
      // Create computed values for only the parts we care about
      const budgetId = computed(() => selectedBudget.value?.id);
      const monthYear = computed(() => {
        const date = selectedDate.value;
        return `${date.getFullYear()}-${date.getMonth()}`;
      });
      
      // Watch the computed values that represent meaningful changes
      watch(
        [budgetId, monthYear],
        ([currentBudgetId, _currentMonthYear]) => {
          if (currentBudgetId) {
            const { startDate, endDate } = calculateFirstAndLastDayOfTheMonth(selectedDate.value);
            fetchExpensesBurnDown(currentBudgetId, startDate, endDate);
          }
        },
        { immediate: true }
      );
    });

    return {
      expensesBurnDown,
      fetchExpensesBurnDown,
    };
  }
);
