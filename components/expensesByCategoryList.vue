
<script lang="ts" setup>
import { UseExpensesByCategoryStore } from '~/stores/useExpensesByCategoryStore';

const { expensesByCategory } = storeToRefs(UseExpensesByCategoryStore());


</script>

<template>
  <Card class="w-xs h-xs aspect-square items-baseline justify-end">
    <CardHeader class="w-full flex-shrink-0">
      <CardTitle>Expenses by Category</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col gap-4 w-full overflow-y-auto flex-1">
      <div v-for="(amount, category) in expensesByCategory" :key="category" class="flex flex-row gap-2 justify-between">
        <p>{{ category }}:</p>
        <p class="text-destructive-foreground">{{ Number(amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}</p>
      </div>
    </CardContent>
  </Card>
</template>

