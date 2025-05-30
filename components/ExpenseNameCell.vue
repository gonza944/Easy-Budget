<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import type { ColumnDefinition } from '~/types'; // Corrected import path for Expense
import type { Expense } from '~/types/expense';

interface Props {
  item: Expense;
  column: ColumnDefinition<Expense>; // Added column prop
}

const props = defineProps<Props>();

const store = useMyExpensesStore();
const { getCategoryFromExpense } = store;

const category = computed(() => {
  return getCategoryFromExpense(props.item);
});

const categoryName = computed(() => category.value?.name || 'Uncategorized');

</script>

<template>
  <div class="flex flex-col">
    <p class="text-sm font-medium">{{ item.name }}</p>
    <Badge class="mt-1 text-xs bg-chart-4 text-secondary-foreground dark:text-secondary dark:bg-chart-2">{{ categoryName }}</Badge>
  </div>
</template>