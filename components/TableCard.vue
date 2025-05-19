<script setup lang="ts" generic="T extends Record<string, any>">
import { cn } from '@/lib/utils';

interface ColumnConfig<K extends keyof T> {
  columnHeaderText: string;
  key: K;
  class?: string;
  headerClass?: string;
}

interface TableCardProps<T> {
  title: string;
  content: T[];
  config: ColumnConfig<keyof T>[];
  class?: string;
}

const props = defineProps<TableCardProps<T>>();
</script>

<template>
  <Card :class="cn('flex flex-col h-full', props.class)">
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
    </CardHeader>
    <CardContent class="flex-1 overflow-hidden flex flex-col">
      <Table class="flex-1">
        <TableHeader>
          <TableRow>
            <TableHead 
              v-for="column in config" 
              :key="column.key"
              :class="column.headerClass"
            >
              {{ column.columnHeaderText }}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="(item, index) in content" :key="index">
            <TableCell 
              v-for="column in config" 
              :key="`${index}-${column.key}`" 
              :class="column.class"
            >
              {{ item[column.key] }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</template> 