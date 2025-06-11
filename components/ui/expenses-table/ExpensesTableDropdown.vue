<script setup lang="ts">
import { MoreHorizontal } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
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
  isDeleteDialogOpen.value = false
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


  <AlertDialog v-model:open="isDeleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Expense</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this expense? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="isDeleteDialogOpen = false">Cancel</AlertDialogCancel>
          <AlertDialogAction @click="handleDeleteConfirm">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
</template>