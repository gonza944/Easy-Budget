import { computed } from 'vue';
import type { Table } from '@tanstack/vue-table';

export function useColumnVisibility<TData>(table: Table<TData>) {
  const descriptionColumn = computed(() => table.getColumn('description'));

  const toggleDescriptionColumnVisibility = () => {
    if (descriptionColumn.value) {
      descriptionColumn.value.toggleVisibility(!descriptionColumn.value.getIsVisible());
    }
  };

  return {
    toggleDescriptionColumnVisibility,
  };
} 