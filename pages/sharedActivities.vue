<script lang="ts" setup>
import { PlusIcon, SearchIcon } from 'lucide-vue-next';
import SharedExpenseCards from '~/components/sharedExpenses/SharedExpenseCards.vue';

definePageMeta({
  middleware: ['authenticated'],
})

const router = useRouter();
const sharedActivitiesStore = useMySharedActivitiesStore();
const { sharedActivities } = storeToRefs(sharedActivitiesStore);
const { updateMenuElements, updateMenuTitle } = useMenuElements();



onMounted(() => {
  updateMenuElements([
    {
      label: "Create Shared Activity",
      onClick: () => { },
    },
    {
      label: "Go to My Expenses",
      onClick: () => { router.push('/dashboard') },
    },
    {
      label: "Go to My Budgets",
      onClick: () => { router.push('/myBudgets') },
    },
  ]);
  updateMenuTitle("Shared Activities");
});

</script>

<template>
  <div class="h-[100dvh] flex flex-col gap-8 items-center md:justify-center pt-10 md:pt-0">
    <div class="flex flex-col items-center md:flex-row md:items-center md:gap-4 mb-8">
      <NuxtImg src="/Logo.png" alt="Easy Budget Logo" class="h-24 md:h-24 w-auto mb-0" />
      <h1 class="text-2xl md:text-4xl font-bold text-center">Join the Fun: Revisit Your Shared Activities!</h1>
    </div>
    <div class="flex w-full md:w-xl items-center gap-1.5">
      <Input id="shared-activity-name" type="text" placeholder="Shared Activity Name" class="h-12 bg-background" />
      <Button type="submit" size="iconLg">
        <SearchIcon />
      </Button>
    </div>


    <div class="relative w-full flex justify-center">
      <AsyncScrollableArea>
        <template #content>
          <SharedExpenseCards />
        </template>
      </AsyncScrollableArea>

      <Button v-if="sharedActivities?.size === 0" size="iconLg"
        class="cursor-pointer md:static fixed bottom-8 right-8 z-10 shadow-lg">
        <PlusIcon />
      </Button>
    </div>

  </div>
</template>