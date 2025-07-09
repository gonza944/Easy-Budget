<script setup lang="ts">
import DateSelector from '@/components/DateSelector.vue';
import ExpensesTable from '~/components/ui/expenses-table/ExpensesTable.vue';
import { useRouter } from 'vue-router';
import NewExpenseForm from '~/components/newExpenseForm.vue';
import { columns } from '~/components/ui/expenses-table/columns';
import { storeToRefs } from 'pinia';
import { useBurnDownChartStore } from '~/stores/useBurnDownChartStore';
import { UseExpensesTotalsStore } from '~/stores/useExpensesTotalsStore';
import { useSelectedDate } from '~/composables/useSelectedDate';
import { useCategoryStore } from '~/stores/categoryStore';
import BudgetSummaryCard from '~/components/BudgetSummaryCard.vue';

definePageMeta({
  middleware: ['authenticated'],
})

const { fetchCategories } = useCategoryStore();
const { fetchSelectedBudget } = useMyBudgetStoreStore();
const { updateMenuElements, updateMenuTitle } = useMenuElements();

callOnce(fetchCategories);
callOnce(fetchSelectedBudget);

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
  ]);

  updateMenuTitle(`${selectedBudget?.value?.name} Dashboard`);
})
</script>

<template>
  <div class="pt-4 flex flex-col items-center justify-center md:h-[87dvh]">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto px-2">
      <div class="flex flex-col gap-4 md:col-span-2">
        <BudgetBurdownChart :data="expensesBurnDown || []" class="w-full order-2 md:order-none"/>

        <div class="flex flex-col md:flex-row gap-4 w-full justify-center order-1 md:order-none">
          <DateSelector v-model:selectedDate="selectedDate" />
          <BudgetSummaryCard :monthly-budget="monthlyBudget ?? null" :monthly-budget-loading="monthlyBudgetLoading"
            :remaining-daily-budget="getRemainingDailyBudget" />
          <ExpensesByCategoryList />
        </div>
      </div>

      <ExpensesTable title="Expenses" :data="expenses || []" :columns="columns" :handleAddExpense="handleAddExpense"
        :loading="expensesLoading" />
    </div>


    <NewExpenseForm v-model="showExpenseForm" />
    <FilterDrawer v-model:isOpen="showDateSelector" v-model:selectedDate="selectedDate" />
  </div>

</template>
