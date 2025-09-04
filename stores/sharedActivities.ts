import { defineStore } from 'pinia'
import { toast } from 'vue-sonner'
import type { ActivityBalances, SettlementTransactionWithMembers, SharedActivityWithMembers, SharedExpenseWithMember } from '~/types/sharedExpenses';

export const useMySharedActivitiesStore = defineStore('sharedActivitiesStore', () => {
  const sharedActivities = ref<Map<number, SharedActivityWithMembers>>(new Map());
  const selectedSharedActivity = ref<SharedActivityWithMembers | null>(null);
  const selectedSharedActivityBalances = ref<ActivityBalances | null>(null);
  const selectedSharedActivityExpenses = ref<SharedExpenseWithMember[] | null>(null);
  const selectedSharedActivitySettlements = ref<SettlementTransactionWithMembers[] | null>(null);

  const clearSharedActivities = () => {
    sharedActivities.value = new Map();
    selectedSharedActivity.value = null;
    selectedSharedActivityBalances.value = null;
    selectedSharedActivityExpenses.value = null;
    selectedSharedActivitySettlements.value = null;
  }

  const fetchSharedActivities = async (nameFilter?: string) => {
    const query = nameFilter ? { name: nameFilter } : {};
    const { data } = await useFetch<SharedActivityWithMembers[]>('/api/shared-activities', {
      key: nameFilter ? `shared-activities-${nameFilter}` : 'shared-activities',
      query,
    });
    sharedActivities.value = new Map(data.value?.map((sharedActivity) => [sharedActivity.id, sharedActivity]) || []);
  }

  const setSelectedSharedActivity = async (sharedActivityId: number) => {
    selectedSharedActivity.value = sharedActivities.value.get(sharedActivityId) || null;
    await Promise.all([
      fetchSelectedSharedActivityBalances(),
      fetchSelectedSharedActivityExpenses(),
      fetchSelectedSharedActivitySettlements(),
    ]);
  }

  const fetchSelectedSharedActivityBalances = async () => {
    const { data } = await useFetch<ActivityBalances>(`/api/shared-activities/${selectedSharedActivity.value?.id}/balances`, {
      key: `shared-activity-balances-${selectedSharedActivity.value?.id}`,
    });
    selectedSharedActivityBalances.value = data.value || [];
  }
  
  const fetchSelectedSharedActivitySettlements = async () => {
    const { data } = await useFetch<SettlementTransactionWithMembers[]>(`/api/shared-activities/${selectedSharedActivity.value?.id}/settlements`, {
      key: `shared-activity-settlements-${selectedSharedActivity.value?.id}`,
    });
    selectedSharedActivitySettlements.value = data.value || [];
  }
  
  const fetchSelectedSharedActivityExpenses = async () => {
    const { data } = await useFetch<SharedExpenseWithMember[]>(`/api/shared-activities/${selectedSharedActivity.value?.id}/expenses`, {
      key: `shared-activity-expenses-${selectedSharedActivity.value?.id}`,
    });
    selectedSharedActivityExpenses.value = data.value || [];
  }

  const deleteSharedActivity = async (activityId: number) => {
    let previousActivities = new Map(sharedActivities.value);
    let previousSelected: SharedActivityWithMembers | null = null;
    let previousSelectedBalances: ActivityBalances | null = null;
    let previousSelectedExpenses: SharedExpenseWithMember[] | null = null;
    let previousSelectedSettlements: SettlementTransactionWithMembers[] | null = null;

    return await $fetch("/api/shared-activities", {
      method: "DELETE",
      body: { id: Number(activityId) },
      onRequest() {
        // Store the previously cached values to restore if fetch fails
        previousActivities = new Map(sharedActivities.value);
        previousSelected = selectedSharedActivity.value;
        previousSelectedBalances = selectedSharedActivityBalances.value;
        previousSelectedExpenses = selectedSharedActivityExpenses.value;
        previousSelectedSettlements = selectedSharedActivitySettlements.value;

        // Optimistically remove the activity from the map
        sharedActivities.value = new Map(
          Array.from(previousActivities.entries()).filter(([_, activity]) => activity.id !== activityId)
        );

        // Clear selected activity if it was the one being deleted
        if (selectedSharedActivity.value?.id === activityId) {
          selectedSharedActivity.value = null;
          selectedSharedActivityBalances.value = null;
          selectedSharedActivityExpenses.value = null;
          selectedSharedActivitySettlements.value = null;
        }
      },
      onResponseError() {
        // Rollback the data if the request failed
        sharedActivities.value = previousActivities;
        selectedSharedActivity.value = previousSelected;
        selectedSharedActivityBalances.value = previousSelectedBalances;
        selectedSharedActivityExpenses.value = previousSelectedExpenses;
        selectedSharedActivitySettlements.value = previousSelectedSettlements;
        toast.error("Failed to delete shared activity");
      },
      async onResponse() {
        // Invalidate shared activities in the background if the request succeeded
        await fetchSharedActivities();
      },
    });
  };

  return {
    sharedActivities,
    clearSharedActivities,
    fetchSharedActivities,
    selectedSharedActivity,
    setSelectedSharedActivity,
    selectedSharedActivityBalances,
    fetchSelectedSharedActivityBalances,
    selectedSharedActivityExpenses,
    fetchSelectedSharedActivityExpenses,
    selectedSharedActivitySettlements,
    fetchSelectedSharedActivitySettlements,
    deleteSharedActivity,
  }
})
