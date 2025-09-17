import { defineStore, storeToRefs } from "pinia";

export const UseExpensesTotalsStore = defineStore(
  "myUseExpensesTotalsStore",
  () => {
    const monthlyBudget = ref<number>();
    const remainingBudget = ref<number>();
    const loading = ref(false);

    const clearExpensesTotals = () => {
      monthlyBudget.value = undefined;
      remainingBudget.value = undefined;
      loading.value = false;
    };

    const fetchMonthlyBudget = async (budget_id: number, target_date: Date) => {
      const parsedDate = formatDateToUTCISOString(target_date);
      loading.value = !remainingBudget.value;
      try {
        const data = await $fetch<number>("/api/metrics/monthlyBudget", {
          query: {
            budget_id,
            target_date: parsedDate,
          },
        });

        monthlyBudget.value = data || 0;
      } catch (error) {
        console.error("Error fetching monthly budget:", error);
      } finally {
        loading.value = false;
      }
    };

    const fetchRemainingBudget = async (budget_id: number) => {
      const data = await $fetch<number>("/api/metrics/remainingBudget", {
        query: {
          budget_id,
        },
      });

      remainingBudget.value = data || 0;
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
            //TODO Uncomment when total budget is implemented
            /* fetchRemainingBudget(currentBudgetId); */
          }
        },
        { immediate: true }
      );
    });

    return {
      monthlyBudget,
      remainingBudget,
      clearExpensesTotals,
      fetchMonthlyBudget,
      fetchRemainingBudget,
      loading,
    };
  }
);
