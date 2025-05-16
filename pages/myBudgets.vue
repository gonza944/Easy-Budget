<script lang="ts" setup>
import { PlusIcon, SearchIcon } from 'lucide-vue-next';

definePageMeta({
  middleware: ['authenticated'],
})

const { user } = useUserSession();
const budgetName = ref('');
const isModalOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const budgetToDelete = ref<string | null>(null);

useUpdateMenuElements([
  {
    label: "New Budget",
    onClick: () => { isModalOpen.value = true },
  },
]);

// Single useFetch that handles both initial and filtered data
const { data: budgets, refresh } = await useFetch<BudgetsResponse>(() => {
  return `/api/budgets${budgetName.value ? `?name=${budgetName.value}` : ''}`;
}, {
  key: computed(() => `budgets-${budgetName.value || 'all'}`),
  transform: (data) => data.map((budget) => ({
    ...budget,
    startingBudget: Number(budget.startingBudget),
    maxExpensesPerDay: Number(budget.maxExpensesPerDay)
  }))
});

watch(budgetName, () => {
  if (budgetName.value.length === 0 || budgetName.value.length > 2) {
    refresh();
  }
});

const handleDeleteClick = (budgetId: string) => {
  budgetToDelete.value = budgetId;
  isDeleteDialogOpen.value = true;
};
</script>


<template>
  <div class="h-full flex flex-col gap-8 items-center pt-[20vh]">
    <h1 class="text-2xl md:text-4xl font-bold mb-8 text-center">Welcome Back, {{ user?.name }}</h1>
    <div class="flex w-full md:w-xl items-center gap-1.5">
      <Input id="budget-name" v-model="budgetName" type="text" placeholder="Budget Name" class="h-12 bg-background" />
      <Button type="submit" size="iconLg">
        <SearchIcon />
      </Button>
    </div>


    <div class="relative w-full flex justify-center">
      <ScrollArea class="w-full" v-if="budgets && budgets.length > 0">
        <div class="flex gap-4 pb-4 overflow-x-auto md:justify-center"
          :class="budgets && budgets.length > 0 ? 'px-4' : ''">
          <div v-for="budget in budgets" :key="budget.id" class="w-xs flex-shrink-0">
            <BudgetCard :budget="budget" :onDeleteClick="() => handleDeleteClick(budget.id)" />
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Button v-if="!budgets || budgets.length === 0" size="iconLg"
        class="cursor-pointer md:static fixed bottom-8 right-8 z-10 shadow-lg" @click="isModalOpen = true">
        <PlusIcon />
      </Button>
    </div>
    <NewBudgetForm v-model="isModalOpen" :success="refresh" />

    <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Budget</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this budget? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteDialogOpen = false">Cancel</AlertDialogCancel>
          <AlertDialogAction @click="isDeleteDialogOpen = false">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
