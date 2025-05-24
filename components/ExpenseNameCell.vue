<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import type { Expense, ColumnDefinition } from '~/types'; // Corrected import path for Expense

interface Props {
  item: Expense;
  column: ColumnDefinition<Expense>; // Added column prop
}

const props = defineProps<Props>();

const store = useMyExpensesStoreStore();
const { getCategoryFromExpense, getCategoryColor } = store;

const category = computed(() => {
  return getCategoryFromExpense(props.item);
});

const categoryName = computed(() => category.value?.name || 'Uncategorized');

// Get the color for the current category
const badgeColorClass = computed(() => {
  if (category.value?.id) {
    const colorName = getCategoryColor(category.value.id);
    console.log(colorName);
    return colorName ? `bg-${colorName}` : 'bg-primary';
  }
  return 'bg-primary';
});

</script>

<template>
  <div class="flex flex-col">
    <p class="text-sm font-medium">{{ item.name }}</p>
    <Badge class="mt-1 text-xs" :class="badgeColorClass">{{ categoryName }}</Badge>
  </div>
</template>