<script lang="ts" setup>
import { PlusIcon, SearchIcon } from 'lucide-vue-next';

definePageMeta({
  middleware: ['authenticated'],
})

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
  <div class="h-full flex flex-col gap-8 items-center pt-[20vh]">
    <h1 class="text-4xl font-bold mb-8">Welcome Back, {{ user?.name }}</h1>
    <div class="flex w-xl items-center gap-1.5">
      <Input id="budget-name" v-model="budgetName" type="text" placeholder="Budget name" class="h-12" />
      <Button type="submit" size="iconLg">
        <SearchIcon class="h-7 w-7" />
      </Button>
    </div>


    <div class="flex gap-8 items-center justify-center">
      <div v-for="budget in budgets" :key="budget.id" class="flex gap-4">
        <Card class="aspect-square bg-secondary cursor-pointer group hover:animate-pulse transition-all duration-300">
          <CardHeader class="justify-center">
            <CardTitle class="text-lg font-semibold">{{ budget.name }}</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col items-center text-left">
            <p class="break-words">{{ budget.description }}</p>
          </CardContent>
          <CardFooter class="flex flex-col items-center justify-center">
            <p>starting budget: {{ budget.startingBudget }}</p>
            <p>Daily budget: {{ budget.maxExpensesPerDay }}</p>
          </CardFooter>
        </Card>
      </div>

      <Button size="iconXl" class="cursor-pointer">
        <PlusIcon class="h-10 w-10" />
      </Button>
    </div>
  </div>
</template>
