<script setup lang="ts" generic="TData, TValue">
import type {
  ColumnDef,
  VisibilityState,
} from '@tanstack/vue-table'
import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
} from '@tanstack/vue-table'

import { valueUpdater } from '@/components/ui/table/utils'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EyeIcon, PlusIcon } from 'lucide-vue-next'
import { useColumnVisibility } from '@/composables/useColumnVisibility'

interface ExpensesTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  title: string
  handleAddExpense: () => void
  loading: boolean
}

const columnVisibility = ref<VisibilityState>({
  description: false,
})

const props = defineProps<ExpensesTableProps<TData, TValue>>()

const table = useVueTable({
  get data() { return props.data },
  get columns() { return props.columns },
  getCoreRowModel: getCoreRowModel(),
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  state: {
    get columnVisibility() { return columnVisibility.value },
  },
})

const { toggleDescriptionColumnVisibility } = useColumnVisibility(table)

</script>

<template>
  <Card class="flex flex-col h-full group relative">
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
      <div class="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
        <Button variant="ghost" size="icon" class="h-8 w-8 cursor-pointer text-muted-foreground"
          @click="toggleDescriptionColumnVisibility">
          <EyeIcon class="h-4 w-4" />
        </Button>
      </div>
    </CardHeader>
    <CardContent class="overflow-hidden flex flex-col">
      <Table class="table-auto w-full">
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header"
                :props="header.getContext()" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="loading">
            <TableRow v-for="n in 4" :key="`skeleton-${n}`">
              <TableCell class="w-[70%]">
                <Skeleton class="w-full h-6 rounded" />
              </TableCell>
              <TableCell class="w-[30%]">
                <Skeleton class="w-full h-6 rounded" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else-if="!loading && table.getRowModel().rows?.length === 0">
            <TableRow>
              <TableCell :colspan="columns.length" class="h-24 text-center">
                No Expenses yet.
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow v-for="row in table.getRowModel().rows" :key="row.id"
              :data-state="row.getIsSelected() ? 'selected' : undefined">
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
        <TableFooter v-if="!loading">
          <TableRow>
            <TableCell :colspan="columns.length" class="h-24 text-center">
              <Button size="iconLg" class="cursor-pointer" @click="handleAddExpense">
                <PlusIcon />
              </Button>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <slot />
    </CardContent>
  </Card>
</template>