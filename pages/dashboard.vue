<script setup lang="ts">
import { CurrencyCell } from '#components';
import DateSelector from '@/components/DateSelector.vue';
import TableCard from '@/components/TableCard.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusIcon } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import ExpenseNameCell from '~/components/ExpenseNameCell.vue';
import NewExpenseForm from '~/components/newExpenseForm.vue';
import type { ColumnDefinition } from '~/types';
import type { Expense } from '~/types/expense';

const router = useRouter();
const store = useMyExpensesStore();
const { getExpensesByBudgetId, selectedDate: storeSelectedDate } = store;
const { monthlyBudget } = useUseExpensesTotals();
const { expensesBurnDown } = useBurnDownChartData();
const { expensesByCategory } = useExpensesByCategoryChart();

const condensedMode = ref(true);
const showExpenseForm = ref(false);

const getSelectedBudget = computed(() => store.getSelectedBudget);
const getRemainingDailyBudget = computed(() => store.getRemainingDailyBudget);
if (!getSelectedBudget.value) {
  router.push('/myBudgets');
}
const expenses = computed(() => getSelectedBudget?.value?.id ? getExpensesByBudgetId(getSelectedBudget?.value?.id) : []);
const selectedDate = computed(() => storeSelectedDate);

const expensesConfig = computed((): ColumnDefinition<Expense>[] => {
  const config: ColumnDefinition<Expense>[] = [
    {
      columnHeaderText: 'Name',
      key: 'name',
      class: 'font-medium',
      headerClass: 'text-left',
      renderer: ExpenseNameCell
    }
  ];

  if (!condensedMode.value) {
    config.push({
      columnHeaderText: 'Description',
      key: 'description',
      class: 'break-words'
    });
  }

  config.push({
    columnHeaderText: 'Amount',
    key: 'amount',
    class: 'text-right text-destructive-foreground',
    headerClass: 'text-right',
    renderer: CurrencyCell
  });

  return config;
});

const handleAddExpense = () => {
  showExpenseForm.value = !showExpenseForm.value;
};


useUpdateMenuElements([
  {
    label: "Add Expense",
    onClick: () => { handleAddExpense() },
  },
  {
    label: "Go to My Budgets",
    onClick: () => { router.push('/myBudgets') },
  },
]);

console.log('expensesByCategory', expensesByCategory.value);
</script>

<template>
  <div class="h-full flex flex-col pt-4 gap-6">
    <h1 class="text-2xl font-bold">{{ getSelectedBudget?.name }} Dashboard</h1>

    <ResizablePanelGroup id="handle-demo-group-1" direction="horizontal"
      class="h-full flex !flex-col md:!flex-row gap-4">
      <ResizablePanel id="handle-demo-panel-1" :default-size="60" class="flex flex-col gap-4 !basis-auto md:!basis-0">
        <DateSelector v-model:selectedDate="selectedDate" />
        <div class="flex flex-row gap-4 w-full">
          <!-- TODO: Add remaining budget card whenever I have a way to top up the budget -->
          <!-- <Card class="w-full">
            <CardHeader>
              <CardTitle>Total Expenses</CardTitle>
            </CardHeader>
            <CardContent :class="{ 'text-destructive-foreground': (remainingBudget || 0) < 0, 'text-success': (remainingBudget || 0) >= 0 }">
              {{ Number(remainingBudget).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
            </CardContent>
          </Card> -->

          <Card class="w-full">
            <CardHeader>
              <CardTitle>Monthly Budget</CardTitle>
            </CardHeader>
            <CardContent
              :class="{ 'text-destructive-foreground': (monthlyBudget || 0) < 0, 'text-success': (monthlyBudget || 0) >= 0 }">
              {{ Number(monthlyBudget).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
            </CardContent>
          </Card>

          <Card class="w-full">
            <CardHeader>
              <CardTitle>Daily Budget</CardTitle>
            </CardHeader>
            <CardContent
              :class="{ 'text-destructive-foreground': getRemainingDailyBudget < 0, 'text-success': getRemainingDailyBudget >= 0 }">
              {{ getRemainingDailyBudget.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
            </CardContent>
          </Card>
        </div>

        <div class="flex flex-row gap-4 w-full">
          <BudgetBurdownChart :data="expensesBurnDown?.expensesBurnDown || []" class="w-3/4" />
          <ExpensesByCategory :data="Object.values(expensesByCategory?.expensesByCategory || {})" class="w-1/4" />
        </div>
      </ResizablePanel>
      <ResizableHandle id="handle-demo-handle-1" class="hidden md:flex" />
      <ResizablePanel id="handle-demo-panel-2" :default-size="25" class="!basis-auto md:!basis-0">
        <TableCard title="Expenses" :content="expenses || []" :config="expensesConfig"
          v-model:condensed-mode="condensedMode" class="h-[54dvh] md:h-[85dvh]">
          <div class="flex flex-col items-center w-full">
            <Button size="iconLg" class="my-6" @click="handleAddExpense">
              <PlusIcon />
            </Button>
          </div>
        </TableCard>
      </ResizablePanel>
    </ResizablePanelGroup>

    <!-- New Expense Form Dialog -->
    <NewExpenseForm v-model="showExpenseForm" />
  </div>
</template>