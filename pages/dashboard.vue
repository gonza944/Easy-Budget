<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import TableCard from '@/components/TableCard.vue';
import DateSelector from '@/components/DateSelector.vue';
import { PlusIcon } from 'lucide-vue-next';

interface Expense {
  id: number;
  name: string;
  budget_id: number;
  category_id: number;
  amount: number;
  date: string;
  description?: string;
}

interface ColumnConfig<K extends keyof Expense> {
  columnHeaderText: string;
  key: K;
  class?: string;
  headerClass?: string;
}

const router = useRouter();
const store = useMyExpensesStoreStore();
const { getExpensesByBudgetId } = store;

const condensedMode = ref(false);

const getSelectedBudget = computed(() => store.getSelectedBudget);
const getRemainingDailyBudget = computed(() => store.getRemainingDailyBudget);
const getRemainingMonthlyBudget = computed(() => store.getRemainingMonthlyBudget);
const getRemainingBudget = computed(() => store.getRemainingBudget);

if (!getSelectedBudget.value) {
  router.push('/myBudgets');
}
const expenses = computed(() => getSelectedBudget?.value?.id ? getExpensesByBudgetId(getSelectedBudget?.value?.id) as Expense[] : []);

// Selected date from DateSelector
const selectedDate = ref(new Date());

// Config for the expenses table
const expensesConfig = computed(() => {
  const config: ColumnConfig<keyof Expense>[] = [
    {
      columnHeaderText: 'Name',
      key: 'name',
      class: 'font-medium',
      headerClass: 'text-left'
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
    headerClass: 'text-right'
  });

  return config;
});

const handleAddExpense = () => {
  
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

</script>

<template>
    <div class="h-full flex flex-col pt-4 gap-6">
      <h1 class="text-2xl font-bold">{{ getSelectedBudget?.name }} Dashboard</h1>

      <ResizablePanelGroup 
      id="handle-demo-group-1" 
      direction="horizontal" 
      class="h-full flex !flex-col md:!flex-row gap-4"
    >
      <ResizablePanel 
        id="handle-demo-panel-1" 
        :default-size="60" 
        class="flex flex-col gap-4 !basis-auto md:!basis-0"
      >
        <DateSelector v-model:selectedDate="selectedDate" />
        <div class="flex flex-row gap-4 w-full">
          <Card class="w-full">
            <CardHeader>
              <CardTitle>Total Expenses</CardTitle>
            </CardHeader>
            <CardContent
              :class="{ 'text-destructive-foreground': getRemainingBudget < 0, 'text-success': getRemainingBudget >= 0 }">
              {{ getRemainingBudget }}
            </CardContent>
          </Card>

          <Card class="w-full">
            <CardHeader>
              <CardTitle>Monthly Budget</CardTitle>
            </CardHeader>
            <CardContent
              :class="{ 'text-destructive-foreground': getRemainingMonthlyBudget < 0, 'text-success': getRemainingMonthlyBudget >= 0 }">
              {{ getRemainingMonthlyBudget }}
            </CardContent>
          </Card>

          <Card class="w-full">
            <CardHeader>
              <CardTitle>Daily Budget</CardTitle>
            </CardHeader>
            <CardContent
              :class="{ 'text-destructive-foreground': getRemainingDailyBudget < 0, 'text-success': getRemainingDailyBudget >= 0 }">
              {{ getRemainingDailyBudget }}
            </CardContent>
          </Card>
        </div>

        <Card class=" md:h-[50dvh]">
          <CardHeader>
            <CardTitle>Dashboards</CardTitle>
          </CardHeader>
        </Card>
      </ResizablePanel>
      <ResizableHandle id="handle-demo-handle-1" class="hidden md:flex" />
      <ResizablePanel 
        id="handle-demo-panel-2" 
        :default-size="40"
        class="!basis-auto md:!basis-0"
      >
        <TableCard title="Expenses" :content="expenses || []" :config="expensesConfig"
          v-model:condensed-mode="condensedMode" class="h-[54dvh] md:h-[85dvh]">
          <Button size="iconLg" class="self-center my-6" @click="handleAddExpense">
            <PlusIcon />
          </Button>
        </TableCard>
      </ResizablePanel>
    </ResizablePanelGroup>
    </div>
</template>