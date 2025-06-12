<script lang="ts" setup>
import { PlusIcon, SearchIcon } from 'lucide-vue-next';

definePageMeta({
  middleware: ['authenticated'],
})

const { user } = useUserSession();
const { getBudgets, fetchBudgets, deleteBudget } = useBudget();
const budgetName = ref('');
const isModalOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const budgetToDelete = ref<number | null>(null);
await callOnce(fetchBudgets);
const budgets = getBudgets();

useUpdateMenuElements([
  {
    label: "New Budget",
    onClick: () => { isModalOpen.value = true },
  },
]);

watch(budgetName, async () => {
  if (budgetName.value.length === 0 || budgetName.value.length > 2) {
    await fetchBudgets(budgetName.value);
  }
});

const handleDeleteClick = (budgetId: number) => {
  budgetToDelete.value = budgetId;
  isDeleteDialogOpen.value = true;
};

const handleDeleteConfirm = async () => {
  if (budgetToDelete.value) {
    await deleteBudget(budgetToDelete.value);
    isDeleteDialogOpen.value = false;
  }
};
</script>


<template>
  <div class="h-full flex flex-col gap-8 items-center pt-[10dvh] md:pt-[20vh]">
    <div class="flex flex-col items-center md:flex-row md:items-center md:gap-4 mb-8">
      <NuxtImg src="/Logo.png" alt="Easy Budget Logo" class="h-20 md:h-16 w-auto mb-3 md:mb-0" />
      <h1 class="text-2xl md:text-4xl font-bold text-center">Welcome Back, {{ user?.name }}</h1>
    </div>
    <div class="flex w-full md:w-xl items-center gap-1.5">
      <Input id="budget-name" v-model="budgetName" type="text" placeholder="Budget Name" class="h-12 bg-background" />
      <Button type="submit" size="iconLg">
        <SearchIcon />
      </Button>
    </div>


    <div class="relative w-full flex justify-center">
      <ScrollArea class="w-full" v-if="budgets && budgets.length > 0">
        <div class="flex gap-4 pb-4 overflow-x-auto justify-center" :class="budgets?.length > 0 ? 'px-4' : ''">
          <div v-for="budget in budgets" :key="budget.id" class="w-xs flex-shrink-0">
            <BudgetCard :budget="budget" :onDeleteClick="() => handleDeleteClick(budget.id)" />
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Button v-if="budgets?.length === 0" size="iconLg"
        class="cursor-pointer md:static fixed bottom-8 right-8 z-10 shadow-lg" @click="isModalOpen = true">
        <PlusIcon />
      </Button>
    </div>
    <NewBudgetForm v-model="isModalOpen" />

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
          <AlertDialogAction @click="handleDeleteConfirm">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
