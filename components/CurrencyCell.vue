<script setup lang="ts">
import type { ColumnDefinition } from '~/types';
import type { Expense } from '~/types/expense';

interface Props {
  item: Expense;
  column: ColumnDefinition<Expense>;
}

const props = defineProps<Props>();

// Get the amount from the item using the column key
const amount = computed(() => {
  const value = props.item[props.column.key];
  return typeof value === 'number'
    ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    : value;
});
</script>

<template>
  <div class="text-right text-destructive-foreground">
    {{ amount }}
  </div>
</template> 