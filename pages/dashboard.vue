<script setup lang="ts">
import DateSelector from '@/components/DateSelector.vue';
import ExpensesTable from '~/components/ui/expenses-table/ExpensesTable.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'vue-router';
import NewExpenseForm from '~/components/newExpenseForm.vue';
import { columns } from '~/components/ui/expenses-table/columns';
import { storeToRefs } from 'pinia';
import { useBurnDownChartStore } from '~/stores/useBurnDownChartStore';
import { UseExpensesByCategoryStore } from '~/stores/useExpensesByCategoryStore';
import { UseExpensesTotalsStore } from '~/stores/useExpensesTotalsStore';
import { useSelectedDate } from '~/composables/useSelectedDate';
import { useCategoryStore } from '~/stores/categoryStore';

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
  <div class="h-full flex flex-col pt-4 gap-6">
    <div class="flex flex-row gap-4 align-middle">
      <h1 class="text-2xl font-bold">{{ selectedBudget?.name }} Dashboard</h1>
    </div>


    <ResizablePanelGroup id="handle-demo-group-1" direction="horizontal"
      class="h-full flex !flex-col md:!flex-row gap-4">
      <ResizablePanel id="handle-demo-panel-1" :default-size="60" class="flex flex-col gap-4 !basis-auto md:!basis-0">
        <BudgetBurdownChart :data="expensesBurnDown || []" class="w-full" />

        <div class="flex flex-col md:flex-row gap-4 w-full">
          <Card class="hidden md:block">
            <CardContent>
              <DateSelector v-model:selectedDate="selectedDate" />
            </CardContent>
          </Card>
          <ExpensesByCategory :data="expensesByCategory || {}" />
          <div class="flex flex-row md:flex-col gap-4">
            <Card class="w-full">
              <CardHeader>
                <CardTitle>Monthly Budget</CardTitle>
              </CardHeader>
              <template v-if="monthlyBudgetLoading">
                <CardContent>
                  <Skeleton class="w-[30%] h-10 rounded-full" />
                </CardContent>
              </template>
              <template v-else>
                <CardContent
                  :class="{ 'text-destructive-foreground': (monthlyBudget || 0) < 0, 'text-success': (monthlyBudget || 0) >= 0 }">
                  {{ Number(monthlyBudget).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
                </CardContent>
              </template>
            </Card>

            <Card class="w-full">
              <CardHeader>
                <CardTitle>Daily Budget</CardTitle>
              </CardHeader>
              <template v-if="monthlyBudgetLoading">
                <CardContent>
                  <Skeleton class="w-[30%] h-10 rounded-full" />
                </CardContent>
              </template>
              <template v-else>
                <CardContent
                  :class="{ 'text-destructive-foreground': getRemainingDailyBudget < 0, 'text-success': getRemainingDailyBudget >= 0 }">
                  {{ getRemainingDailyBudget.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
                </CardContent>
              </template>
            </Card>
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle id="handle-demo-handle-1" class="hidden md:flex" />
      <ResizablePanel id="handle-demo-panel-2" :default-size="25" class="!basis-auto md:!basis-0">
        <ExpensesTable title="Expenses" :data="expenses || []" :columns="columns" :handleAddExpense="handleAddExpense"
          :loading="expensesLoading" class="h-[54dvh] md:h-[85dvh]" />
      </ResizablePanel>
    </ResizablePanelGroup>

    <!-- New Expense Form Dialog -->
    <NewExpenseForm v-model="showExpenseForm" />
    <FilterDrawer v-model:isOpen="showDateSelector" v-model:selectedDate="selectedDate" />
  </div>
</template>