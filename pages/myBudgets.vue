<script lang="ts" setup>
import { PlusIcon, SearchIcon } from 'lucide-vue-next'

const { user } = useUserSession();
const budgetName = ref('');

// Single useFetch that handles both initial and filtered data
const { data: budgets, refresh } = await useFetch<BudgetsResponse>(() => {
  return `/api/budgets${budgetName.value ? `?name=${budgetName.value}` : ''}`;
}, {
  key: computed(() => `budgets-${budgetName.value || 'all'}`)
});

// Only trigger fetch if search is at least 3 chars or empty
watch(budgetName, () => {
  if (budgetName.value.length === 0 || budgetName.value.length > 2) {
    refresh();
  }
});
</script>


<template>
  <div class="h-full flex flex-col gap-8 items-center mt-[20vh]">
    <h1 class="text-4xl font-bold mb-8">Welcome Back, {{ user?.name }}</h1>
    <div class="flex w-full max-w-sm items-center gap-1.5">
      <Input id="budget-name" v-model="budgetName" type="text" placeholder="Budget name"/>
      <Button type="submit">
        <SearchIcon class="h-6 w-6" />
      </Button>
    </div>


    <Card v-for="budget in budgets" :key="budget.id" class="w-1/12 aspect-square items-center justify-center">
      <CardHeader>
        <CardTitle>{{ budget.name }}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{{ budget.description }}</p>
        <p>{{ budget.startingBudget }}</p>
        <p>{{ budget.maxExpensesPerDay }}</p>
      </CardContent>
    </Card>
    <Card class="w-1/12 aspect-square items-center justify-center">
      <CardHeader>
        <CardTitle class="hidden">New budget</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>
          <PlusIcon class="h-6 w-6" />
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
