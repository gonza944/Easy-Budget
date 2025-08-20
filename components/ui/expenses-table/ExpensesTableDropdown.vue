<script setup lang="ts">
import { MoreHorizontal } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { ConfirmationDialog } from '~/components/ui/confirmation-dialog'
import { useMyExpensesStore } from '~/stores/expensesStore'

const expensesStore = useMyExpensesStore()

const props = defineProps<{
  expense: {
    id: number
  }
}>()

const isDeleteDialogOpen = ref(false)

const handleDelete = () => {
  isDeleteDialogOpen.value = true
}

const handleDeleteConfirm = () => {
  expensesStore.deleteExpense(props.expense.id)
}

</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="w-8 h-8 p-0">
        <span class="sr-only">Open menu</span>
        <MoreHorizontal class="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="p-4">
      <DropdownMenuItem class="text-destructive-foreground p-2 cursor-pointer" @click="handleDelete">Delete expense</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>


  <ConfirmationDialog
    v-model:open="isDeleteDialogOpen"
    title="Delete Expense"
    description="Are you sure you want to delete this expense? This action cannot be undone."
    action-text="Delete"
    :on-confirm="handleDeleteConfirm"
  />
</template>