<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import TableCard from '@/components/TableCard.vue';
import DateSelector from '@/components/DateSelector.vue';

const router = useRouter();
const store = useMyExpensesStoreStore();
const { getExpensesByBudgetId } = store;

const getSelectedBudget = computed(() => store.getSelectedBudget);
const getRemainingDailyBudget = computed(() => store.getRemainingDailyBudget);
const getRemainingMonthlyBudget = computed(() => store.getRemainingMonthlyBudget);
const getRemainingBudget = computed(() => store.getRemainingBudget);

const expenses = computed(() => getExpensesByBudgetId(getSelectedBudget?.value?.id || 0));
if (!getSelectedBudget.value) {
  router.push('/myBudgets');
}

// Selected date from DateSelector
const selectedDate = ref(new Date());

// Config for the expenses table
const expensesConfig = [
  {
    columnHeaderText: 'Name',
    key: 'name',
    class: 'font-medium',
    headerClass: 'text-left'
  },
  {
    columnHeaderText: 'Description',
    key: 'description',
    class: 'break-words'
  },
  {
    columnHeaderText: 'Amount',
    key: 'amount',
    class: 'text-right text-destructive-foreground',
    headerClass: 'text-right'
  }
];

useUpdateMenuElements([
  {
    label: "Go to My Budgets",
    onClick: () => { router.push('/myBudgets') },
  },
]);

</script>

<template>
  <div class="h-full flex flex-col gap-4">
    <ResizablePanelGroup id="handle-demo-group-1" direction="horizontal" class="h-full pt-10">
      <ResizablePanel id="handle-demo-panel-1" :default-size="60" class="flex flex-col gap-4">
        <DateSelector v-model:selectedDate="selectedDate" />
        <div class="flex gap-4 justify-between">
          <Card class="w-1/3">
            <CardHeader>
              <CardTitle>Total Expenses</CardTitle>
            </CardHeader>
            <CardContent :class="{ 'text-destructive-foreground': getRemainingBudget < 0, 'text-success': getRemainingBudget >= 0 }">
              {{ getRemainingBudget }}
            </CardContent>
          </Card>

          <Card class="w-1/3">
            <CardHeader>
              <CardTitle>Monthly Budget</CardTitle>
            </CardHeader>
            <CardContent :class="{ 'text-destructive-foreground': getRemainingMonthlyBudget < 0, 'text-success': getRemainingMonthlyBudget >= 0 }">
              {{ getRemainingMonthlyBudget }}
            </CardContent>
          </Card>

          <Card class="w-1/3">
            <CardHeader>
              <CardTitle>Daily Budget</CardTitle>
            </CardHeader>
            <CardContent :class="{ 'text-destructive-foreground': getRemainingDailyBudget < 0, 'text-success': getRemainingDailyBudget >= 0 }">
              {{ getRemainingDailyBudget }}
            </CardContent>
          </Card>
        </div>

        <Card class="h-[50dvh]">
          <CardHeader>
            <CardTitle>Dashboards</CardTitle>
          </CardHeader>
        </Card>
      </ResizablePanel>
      <ResizableHandle id="handle-demo-handle-1" class="px-2" />
      <ResizablePanel id="handle-demo-panel-2" :default-size="40">
        <TableCard title="Expenses" :content="expenses || []" :config="expensesConfig" class="h-[90dvh]" />
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</template>