<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import type { Expense } from '~/types'; // Corrected import path for Expense

interface Props {
  item: Expense;
}

const props = defineProps<Props>();

const store = useMyExpensesStoreStore();
const { getCategoryFromExpense } = store;

const category = computed(() => {
  return getCategoryFromExpense(props.item);
});

const categoryName = computed(() => category.value?.name || 'Uncategorized');
</script>

<template>
  <div class="flex flex-col">
    <p class="text-sm font-medium">{{ item.name }}</p>
    <Badge class="mt-1 text-xs">{{ categoryName }}</Badge>
  </div>
</template>