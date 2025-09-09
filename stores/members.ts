import { defineStore } from "pinia";
import type { Member } from "~/types/sharedExpenses";

export const useMyMembersStore = defineStore("myMembersStore", () => {
  const members = ref<Member[]>([]);
  const loading = ref(false);

  const clearMembers = () => {
    members.value = [];
    loading.value = false;
  };

  const fetchMembers = async () => {
    loading.value = true;
    const { data } = useLazyFetch<Member[]>(`/api/members`, { key: `members` });
    watch(
      data,
      (newData) => {
        if (newData) {
          members.value = newData;
          loading.value = false;
        }
      },
      { immediate: true }
    );
  };

  return {
    members,
    loading,
    clearMembers,
    fetchMembers,
  };
});
