import { defineStore, storeToRefs } from "pinia";

export const UseExpensesTotalsStore = defineStore(
  "myUseExpensesTotalsStore",
  () => {
    const monthlyBudget = ref<number>(0);
    const remainingBudget = ref<number>(0);

    const fetchMonthlyBudget = async (budget_id: number, target_date: Date) => {
      const parsedDate = formatDateToUTCISOString(target_date);

      const { data } = await useFetch<number>("/api/metrics/monthlyBudget", {
        query: {
          budget_id,
          target_date: parsedDate,
        },
        key: `monthlyBudget-${budget_id}-${parsedDate}`,
      });

      monthlyBudget.value = data.value || 0;
    };

    const fetchRemainingBudget = async (budget_id: number) => {
      const { data } = await useFetch<number>("/api/metrics/remainingBudget", {
        query: {
          budget_id,
        },
        key: `remainingBudget-${budget_id}`,
      });

      remainingBudget.value = data.value || 0;
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
            fetchMonthlyBudget(currentBudgetId, selectedDate.value);
            fetchRemainingBudget(currentBudgetId);
          }
        },
        { immediate: true }
      );
    });

    return {
      monthlyBudget,
      remainingBudget,
      fetchMonthlyBudget,
      fetchRemainingBudget,
    };
  }
);
