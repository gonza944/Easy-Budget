<script lang="ts" setup>
import { PlusIcon, SearchIcon } from 'lucide-vue-next';
import { ConfirmationDialog } from '~/components/ui/confirmation-dialog';

definePageMeta({
  middleware: ['authenticated'],
})

const { user } = useUserSession();
const store = useMyBudgetStoreStore();
const { fetchBudgets, deleteBudget } = store;
const { budgets, loading } = storeToRefs(store);
const budgetName = ref('');
const isModalOpen = ref(false);
const isDeleteDialogOpen = ref(false);
const budgetToDelete = ref<number | null>(null);

callOnce(fetchBudgets,{ mode: 'navigation' });

const { updateMenuElements, updateMenuTitle } = useMenuElements();

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
  }
};

const handleDeleteCancel = () => {
  budgetToDelete.value = null;
};

onMounted(() => {
  updateMenuElements([
    {
      label: "Add Budget",
      onClick: () => { isModalOpen.value = true },
    },
  ]);
  updateMenuTitle("My Budgets");
});
</script>


<template>
  <div class="h-[100dvh] flex flex-col gap-8 items-center md:justify-center pt-10 md:pt-0">
    <div class="flex flex-col items-center md:flex-row md:items-center md:gap-4 mb-8">
      <NuxtImg src="/Logo.png" alt="Easy Budget Logo" class="h-24 md:h-24 w-auto mb-0" />
      <h1 class="text-2xl md:text-4xl font-bold text-center">Welcome Back, {{ user?.name }}</h1>
    </div>
    <div class="flex w-full md:w-xl items-center gap-1.5">
      <Input id="budget-name" v-model="budgetName" type="text" placeholder="Budget Name" class="h-12 bg-background" />
      <Button type="submit" size="iconLg">
        <SearchIcon />
      </Button>
    </div>


    <div class="relative w-full flex justify-center">
      <ScrollArea v-if="budgets && budgets.length > 0" class="w-full">
        <div class="flex gap-4 pb-4 overflow-x-auto justify-center" :class="budgets?.length > 0 ? 'px-4' : ''">
          <div v-if="loading">
            <div v-for="n in 4" :key="`skeleton-${n}`" class="w-xs flex-shrink-0">
              <Skeleton class="w-full h-10 rounded-full" />
            </div>
          </div>
          <template v-else>
          <div v-for="budget in budgets" :key="budget.id" class="w-xs flex-shrink-0">
              <BudgetCard :budget="budget" :on-delete-click="() => handleDeleteClick(budget.id)" />
            </div>
          </template>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Button
        v-if="budgets?.length === 0"
        size="iconLg"
        class="cursor-pointer md:static fixed bottom-8 right-8 z-10 shadow-lg"
        @click="isModalOpen = true"
      >
        <PlusIcon />
      </Button>
    </div>
    <NewBudget v-model="isModalOpen" />

    <ConfirmationDialog
      v-model:open="isDeleteDialogOpen"
      title="Delete Budget"
      description="Are you sure you want to delete this budget? This action cannot be undone."
      action-text="Delete"
      :on-cancel="handleDeleteCancel"
      :on-confirm="handleDeleteConfirm"
    />
  </div>
</template>
