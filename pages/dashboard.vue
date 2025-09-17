<script setup lang="ts">

import DateSelector from '@/components/DateSelector.vue';
import ExpensesTable from '~/components/ui/expenses-table/ExpensesTable.vue';
import { useRouter } from 'vue-router';
import NewExpenseForm from '~/components/newExpenseForm/newExpenseForm.vue';
import { columns } from '~/components/ui/expenses-table/columns';
import { storeToRefs } from 'pinia';
import { useBurnDownChartStore } from '~/stores/useBurnDownChartStore';
import { UseExpensesTotalsStore } from '~/stores/useExpensesTotalsStore';
import { useSelectedDate } from '~/composables/useSelectedDate';
import BudgetSummaryCard from '~/components/BudgetSummaryCard.vue';

definePageMeta({
  middleware: ['authenticated'],
})

const { fetchSelectedBudget } = useMyBudgetStoreStore();
const { fetchCategories } = useCategoryStore();
const { updateMenuElements, updateMenuTitle } = useMenuElements();

await callOnce(fetchSelectedBudget, { mode: 'navigation' });
// We shouldn't ever await this, as it's a useLazyFetch
callOnce(fetchCategories, { mode: 'navigation' });

const router = useRouter();
const store = useMyExpensesStore();
const { getExpensesByBudgetId } = store;
const { loading: expensesLoading } = storeToRefs(useMyExpensesStore());
const { selectedDate } = useSelectedDate();
const { monthlyBudget, loading: monthlyBudgetLoading } = storeToRefs(UseExpensesTotalsStore());
const { expensesBurnDown } = storeToRefs(useBurnDownChartStore());
const { selectedBudget } = storeToRefs(useMyBudgetStoreStore());

const showExpenseForm = ref(false);
const showDateSelector = ref(false);

const getRemainingDailyBudget = computed(() => store.getRemainingDailyBudget);
const expenses = computed(() => selectedBudget.value?.id ? getExpensesByBudgetId(selectedBudget.value?.id) : []);

const handleAddExpense = () => {
  showExpenseForm.value = !showExpenseForm.value;
};

onMounted(() => {
  updateMenuElements([
    {
      label: "Add Expense",
      onClick: () => { handleAddExpense() },
    },
    {
      label: "Select Date",
      onClick: () => { showDateSelector.value = !showDateSelector.value },
    },
    {
      label: "Go to My Budgets",
      onClick: () => { router.push('/myBudgets') },
    },
    {
      label: "Go to Shared Activities",
      onClick: () => { router.push('/sharedActivities') },
    },
  ]);

  updateMenuTitle(`${selectedBudget?.value?.name} Dashboard`);
})
</script>

<template>
  <div class="flex flex-col items-center justify-center md:h-[100dvh] pt-4 md:pt-0">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto px-2">
      <div class="flex flex-col gap-4 md:col-span-2">
        <BudgetBurdownChart class="w-full order-2 md:order-none" />

        <div class="flex flex-col md:flex-row gap-4 w-full order-1 md:order-none md:overflow-x-auto">
          <DateSelector className="hidden md:block" v-model:selectedDate="selectedDate" />
          <BudgetSummaryCard :remaining-monthly-budget="monthlyBudget ?? null" :monthly-budget-loading="monthlyBudgetLoading"
            :remaining-daily-budget="getRemainingDailyBudget" />
          <ExpensesByCategoryList />
        </div>
      </div>

      <ExpensesTable title="Expenses" :data="expenses || []" :columns="columns" :handleAddExpense="handleAddExpense"
        :loading="expensesLoading" />
    </div>


    <NewExpenseForm v-if="showExpenseForm" v-model="showExpenseForm" />
    <FilterDrawer v-if="showDateSelector" v-model:isOpen="showDateSelector" v-model:selectedDate="selectedDate" />
  </div>

</template>
