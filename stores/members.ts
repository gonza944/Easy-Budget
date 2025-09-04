import { defineStore } from 'pinia'
import type { Member } from '~/types/sharedExpenses';

export const useMyMembersStore = defineStore('myMembersStore', () => {
  const members = ref<Member[]>([]);

  const clearMembers = () => {
    members.value = [];
  }

  const fetchMembers = async () => {
    const { data } = await useFetch<Member[]>(`/api/members`);
    members.value = data.value || [];
  }

  return {
    members,
    clearMembers,
    fetchMembers,
  }
})
