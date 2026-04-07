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
        <span class="sr-only">Abrir menú</span>
        <MoreHorizontal class="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="p-4">
      <DropdownMenuItem class="text-destructive-foreground p-2 cursor-pointer" @click="handleDelete">Eliminar gasto</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>


  <ConfirmationDialog
    v-model:open="isDeleteDialogOpen"
    title="Eliminar gasto"
    description="¿Seguro que quieres eliminar este gasto? Esta acción no se puede deshacer."
    action-text="Eliminar"
    :on-confirm="handleDeleteConfirm"
  />
</template>
