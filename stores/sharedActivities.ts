import { defineStore } from "pinia";
import { toast } from "vue-sonner";
import {
  SharedActivityApiResponseSchema,
  type ActivityBalances,
  type CreateSharedActivity,
  type SettlementTransactionWithMembers,
  type SharedActivityApiResponse,
  type SharedActivityWithMembers,
  type SharedExpenseWithMember,
} from "~/types/sharedExpenses";

export const useMySharedActivitiesStore = defineStore(
  "sharedActivitiesStore",
  () => {
    const sharedActivities = ref<Map<number, SharedActivityWithMembers>>(
      new Map()
    );
    const selectedSharedActivity = ref<SharedActivityWithMembers | null>(null);
    const selectedSharedActivityBalances = ref<ActivityBalances | null>(null);
    const selectedSharedActivityExpenses = ref<
      SharedExpenseWithMember[] | null
    >(null);
    const selectedSharedActivitySettlements = ref<
      SettlementTransactionWithMembers[] | null
    >(null);
    const loadingSharedActivities = ref(false);

    const clearSharedActivities = () => {
      sharedActivities.value = new Map();
      selectedSharedActivity.value = null;
      selectedSharedActivityBalances.value = null;
      selectedSharedActivityExpenses.value = null;
      selectedSharedActivitySettlements.value = null;
    };

    const fetchSharedActivities = async (nameFilter?: string) => {
      loadingSharedActivities.value = true;
      const query = nameFilter ? { name: nameFilter } : {};
      const { data } = await useFetch<SharedActivityWithMembers[]>(
        "/api/shared-activities",
        {
          key: nameFilter
            ? `shared-activities-${nameFilter}`
            : "shared-activities",
          query,
        }
      );
      sharedActivities.value = new Map(
        data.value?.map((sharedActivity) => [
          sharedActivity.id,
          sharedActivity,
        ]) || []
      );
      loadingSharedActivities.value = false;
    };

    const setSelectedSharedActivity = async (sharedActivityId: number) => {
      selectedSharedActivity.value =
        sharedActivities.value.get(sharedActivityId) || null;
      await Promise.all([
        fetchSelectedSharedActivityBalances(),
        fetchSelectedSharedActivityExpenses(),
        fetchSelectedSharedActivitySettlements(),
      ]);
    };

    const fetchSelectedSharedActivityBalances = async () => {
      const { data } = await useFetch<ActivityBalances>(
        `/api/shared-activities/${selectedSharedActivity.value?.id}/balances`,
        {
          key: `shared-activity-balances-${selectedSharedActivity.value?.id}`,
        }
      );
      selectedSharedActivityBalances.value = data.value || [];
    };

    const fetchSelectedSharedActivitySettlements = async () => {
      const { data } = await useFetch<SettlementTransactionWithMembers[]>(
        `/api/shared-activities/${selectedSharedActivity.value?.id}/settlements`,
        {
          key: `shared-activity-settlements-${selectedSharedActivity.value?.id}`,
        }
      );
      selectedSharedActivitySettlements.value = data.value || [];
    };

    const fetchSelectedSharedActivityExpenses = async () => {
      const { data } = await useFetch<SharedExpenseWithMember[]>(
        `/api/shared-activities/${selectedSharedActivity.value?.id}/expenses`,
        {
          key: `shared-activity-expenses-${selectedSharedActivity.value?.id}`,
        }
      );
      selectedSharedActivityExpenses.value = data.value || [];
    };

    const deleteSharedActivity = async (activityId: number) => {
      let previousActivities = new Map(sharedActivities.value);
      let previousSelected: SharedActivityWithMembers | null = null;
      let previousSelectedBalances: ActivityBalances | null = null;
      let previousSelectedExpenses: SharedExpenseWithMember[] | null = null;
      let previousSelectedSettlements:
        | SettlementTransactionWithMembers[]
        | null = null;

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
            Array.from(previousActivities.entries()).filter(
              ([_, activity]) => activity.id !== activityId
            )
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

    const createSharedActivity = async (
      sharedActivity: CreateSharedActivity
    ) => {
      const previousSharedActivities = new Map(sharedActivities.value);

      return await useFetch<SharedActivityApiResponse>(
        "/api/shared-activities",
        {
          method: "POST",
          body: sharedActivity,
          onRequest() {
            const optimisticSharedActivity: SharedActivityWithMembers = {
              id: Date.now(),
              name: sharedActivity.name,
              description: sharedActivity.description || null,
              members: sharedActivity.participants,
              user_id: '', // Will be set by server
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_active: true,
            };
            sharedActivities.value = new Map([
              [optimisticSharedActivity.id, optimisticSharedActivity],
              ...previousSharedActivities,
            ]);
          },
          async onResponse({response}) {
            const parseResult = SharedActivityApiResponseSchema.safeParse(response._data);
              if (parseResult.success && parseResult.data.success && parseResult.data.data) {
                sharedActivities.value = new Map([
                  [parseResult.data.data.id, parseResult.data.data],
                  ...previousSharedActivities,
                ]);
              }
          },
          onResponseError() {
            sharedActivities.value = new Map(previousSharedActivities);
            toast.error("Failed to create shared activity");
          },
        }
      );
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
      loadingSharedActivities,
      createSharedActivity,
    };
  }
);
