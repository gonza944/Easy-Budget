<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
const { getSelectedBudget, getExpenses } = useMyExpensesStoreStore();

const expenses = computed(() => getExpenses[getSelectedBudget?.id]);

useUpdateMenuElements([
  {
    label: "Go to My Budgets",
    onClick: () => { router.push('/myBudgets') },
  },
]);

</script>

<template>
  <ResizablePanelGroup direction="horizontal">
    <ResizablePanel>One</ResizablePanel>
    <ResizableHandle with-handle />
    <ResizablePanel>
      <Table>
        <TableBody>
          <TableRow v-for="expense in expenses" :key="expense.id">
            <TableCell class="font-medium">
              {{ expense.name }}
            </TableCell>
            <TableCell>{{ expense.description }}</TableCell>
            <TableCell class="text-right">
              {{ expense.amount }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </ResizablePanel>
  </ResizablePanelGroup>
</template>