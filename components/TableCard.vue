<script setup lang="ts" generic="T extends object">
import { cn } from '@/lib/utils';
import { EyeIcon } from 'lucide-vue-next';
import type { ColumnDefinition } from '~/types';

interface TableCardProps<T extends object> {
  title: string;
  content: T[];
  config: Array<ColumnDefinition<T>>;
  class?: string;
}

const props = defineProps<TableCardProps<T>>();
const condensedMode = defineModel<boolean>('condensedMode', { default: false });

const toggleCondensedMode = () => {
  condensedMode.value = !condensedMode.value;
};
</script>

<template>
  <Card :class="cn('flex flex-col h-full group relative', props.class)">
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
    </CardHeader>
    <div class="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
      <Button variant="ghost" size="icon" class="h-8 w-8" @click.stop="toggleCondensedMode">
        <EyeIcon class="h-4 w-4" :class="condensedMode ? 'text-muted-foreground opacity-50' : ''" />
      </Button>
    </div>
    <CardContent class="overflow-hidden flex flex-col">
      <div class="w-full overflow-x-auto">
        <Table class="w-full table-auto">
          <TableHeader>
            <TableRow>
              <TableHead v-for="column in config" :key="String(column.key)" :class="cn('break-words hyphens-auto', column.headerClass)">
                {{ column.columnHeaderText }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="(item, index) in content" :key="index">
              <TableCell v-for="column in config" :key="`${index}-${String(column.key)}`" 
                :class="cn('break-words whitespace-normal hyphens-auto', column.class)">
                <template v-if="column.renderer">
                  <component :is="column.renderer" :item="item" :column="column" />
                </template>
                <template v-else>
                  {{ item[column.key] }}
                </template>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <slot />
    </CardContent>
  </Card>
</template>