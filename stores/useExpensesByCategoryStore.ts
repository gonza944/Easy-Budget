import { defineStore, storeToRefs } from "pinia";

export const UseExpensesByCategoryStore = defineStore(
  "myUseExpensesByCategoryStore",
  () => {
    const expensesByCategory = ref<Record<string, number>>({});
    const loading = ref(false);

    const fetchExpensesByCategory = async (
      budget_id: number,
      startDate: string,
      endDate: string
    ) => {
      loading.value = true;
      const { data } = await useFetch<{expensesByCategory: Record<string, number>}>("/api/metrics/totalExpensesByCategory", {
        query: {
          initial_date: startDate,
          final_date: endDate,
          budget_id,
        },
        key: `expensesByCategory-${budget_id}-${startDate}-${endDate}`,
        transform: (data) => {
          if (!data || !data.expensesByCategory) {
            return { expensesByCategory: {} };
          }
          const sortedEntries = Object.entries(data.expensesByCategory).sort(
            (a, b) => b[1] - a[1]
          );
          return { expensesByCategory: Object.fromEntries(sortedEntries) };
        },
      });

      expensesByCategory.value = data.value?.expensesByCategory || {};
      loading.value = false;
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
            fetchExpensesByCategory(currentBudgetId, startDate, endDate);
          }
        },
        { immediate: true }
      );
    });

    return {
      expensesByCategory,
      fetchExpensesByCategory,
      loading,
    };
  }
); 