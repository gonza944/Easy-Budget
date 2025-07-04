<script setup lang="ts">
import DateSelector from '@/components/DateSelector.vue';
import ExpensesTable from '~/components/ui/expenses-table/ExpensesTable.vue';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'vue-router';
import NewExpenseForm from '~/components/newExpenseForm.vue';
import { columns } from '~/components/ui/expenses-table/columns';
import { storeToRefs } from 'pinia';
import { useBurnDownChartStore } from '~/stores/useBurnDownChartStore';
import { UseExpensesByCategoryStore } from '~/stores/useExpensesByCategoryStore';
import { UseExpensesTotalsStore } from '~/stores/useExpensesTotalsStore';
import { useSelectedDate } from '~/composables/useSelectedDate';
import { useCategoryStore } from '~/stores/categoryStore';
import BudgetSummaryCard from '~/components/BudgetSummaryCard.vue';

definePageMeta({
  middleware: ['authenticated'],
})

const { fetchCategories } = useCategoryStore();
const { fetchSelectedBudget } = useMyBudgetStoreStore();

callOnce(fetchCategories);
callOnce(fetchSelectedBudget);

const router = useRouter();
const store = useMyExpensesStore();
const { getExpensesByBudgetId } = store;
const { loading: expensesLoading } = storeToRefs(useMyExpensesStore());
const { selectedDate } = useSelectedDate();
const { monthlyBudget, loading: monthlyBudgetLoading } = storeToRefs(UseExpensesTotalsStore());
const { expensesBurnDown } = storeToRefs(useBurnDownChartStore());
const { expensesByCategory } = storeToRefs(UseExpensesByCategoryStore());
const { selectedBudget } = storeToRefs(useMyBudgetStoreStore());

const showExpenseForm = ref(false);
const showDateSelector = ref(false);

const getRemainingDailyBudget = computed(() => store.getRemainingDailyBudget);
const expenses = computed(() => selectedBudget.value?.id ? getExpensesByBudgetId(selectedBudget.value?.id) : []);

const handleAddExpense = () => {
  showExpenseForm.value = !showExpenseForm.value;
};

useUpdateMenuElements([
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

</script>

<template>
  <div class="pt-4">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="flex flex-col gap-4 col-span-2">
        <BudgetBurdownChart :data="expensesBurnDown || []" />

        <div class="flex flex-col md:flex-row gap-4 w-full">
          <BudgetSummaryCard :monthly-budget="monthlyBudget ?? null" :monthly-budget-loading="monthlyBudgetLoading"
            :remaining-daily-budget="getRemainingDailyBudget" />
          <DateSelector v-model:selectedDate="selectedDate" />
          <!-- <ExpensesByCategory :data="expensesByCategory || {}" /> -->
        </div>
      </div>

      <ExpensesTable title="Expenses" :data="expenses || []" :columns="columns" :handleAddExpense="handleAddExpense"
        :loading="expensesLoading" />
    </div>


    <NewExpenseForm v-model="showExpenseForm" />
    <FilterDrawer v-model:isOpen="showDateSelector" v-model:selectedDate="selectedDate" />
  </div>

</template>



<!-- <div class="h-full flex flex-col pt-4 gap-4">
    <h1 class="text-2xl font-bold">{{ selectedBudget?.name }} Dashboard</h1>


    <div
      class="h-full flex flex-col md:flex-row gap-4">
      <div class="flex flex-col gap-4">
        <BudgetBurdownChart :data="expensesBurnDown || []" />

        <div class="flex flex-col md:flex-row gap-4 w-full justify-center">
          <Card class="hidden md:block">
            <CardContent>
              <DateSelector v-model:selectedDate="selectedDate" />
              <Button variant="default" class="w-full" @click="selectedDate = new Date()">Today</Button>
            </CardContent>
          </Card>
          <ExpensesByCategory :data="expensesByCategory || {}" />
            <BudgetSummaryCard 
              :monthly-budget="monthlyBudget ?? null" 
              :monthly-budget-loading="monthlyBudgetLoading"
              :remaining-daily-budget="getRemainingDailyBudget" 
            />
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <ExpensesTable title="Expenses" :data="expenses || []" :columns="columns" :handleAddExpense="handleAddExpense"
          :loading="expensesLoading" class="h-[54dvh] md:h-[85dvh]" />
      </div>
    </div>

    <NewExpenseForm v-model="showExpenseForm" />
    <FilterDrawer v-model:isOpen="showDateSelector" v-model:selectedDate="selectedDate" />
  </div> -->