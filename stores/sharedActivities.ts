import { defineStore } from 'pinia'
import type { ActivityBalances, SettlementTransactionWithMembers, SharedActivityWithMembers, SharedExpenseWithMember } from '~/types/sharedExpenses';

export const useMySharedActivitiesStore = defineStore('sharedActivitiesStore', () => {
  const sharedActivities = ref<SharedActivityWithMembers[]>([]);
  const selectedSharedActivity = ref<SharedActivityWithMembers | null>(null);
  const selectedSharedActivityBalances = ref<ActivityBalances | null>(null);
  const selectedSharedActivityExpenses = ref<SharedExpenseWithMember[] | null>(null);
  const selectedSharedActivitySettlements = ref<SettlementTransactionWithMembers[] | null>(null);

  const clearSharedActivities = () => {
    sharedActivities.value = [];
    selectedSharedActivity.value = null;
    selectedSharedActivityBalances.value = null;
    selectedSharedActivityExpenses.value = null;
    selectedSharedActivitySettlements.value = null;
  }

  const fetchSharedActivities = async () => {
    const { data } = await useFetch<SharedActivityWithMembers[]>('/api/shared-activities', {
      key: 'shared-activities',
    });
    sharedActivities.value = data.value || [];
  }

  const setSelectedSharedActivity = async (sharedActivity: SharedActivityWithMembers) => {
    selectedSharedActivity.value = sharedActivity;
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
  }
})
