<script lang="ts" setup>
import { toTypedSchema } from '@vee-validate/zod'
import { ArchiveIcon, PencilIcon, PlusIcon, RotateCcwIcon } from 'lucide-vue-next'
import { useMediaQuery } from '@vueuse/core'
import { useForm } from 'vee-validate'
import { ConfirmationDialog } from '~/components/ui/confirmation-dialog'
import CategoryForm from '~/components/categories/CategoryForm.vue'
import { CreateCategorySchema, type Category } from '~/types/category'

definePageMeta({ middleware: ['authenticated'] })

const router = useRouter()
const categoryStore = useCategoryStore()
const { categories, loading } = storeToRefs(categoryStore)
const isMobile = useMediaQuery('(max-width: 768px)')
const isFormOpen = ref(false)
const isArchiveDialogOpen = ref(false)
const isSubmitting = ref(false)
const editingCategory = ref<Category | null>(null)
const archiveTarget = ref<Category | null>(null)

callOnce(categoryStore.fetchCategories, { mode: 'navigation' })

const form = useForm({
  validationSchema: toTypedSchema(CreateCategorySchema),
  initialValues: { name: '', description: '' },
})

const isFormValid = computed(() =>
  Object.keys(form.errors.value).length === 0 && form.meta.value.touched,
)
const formTitle = computed(() => editingCategory.value ? 'Editar categoría' : 'Nueva categoría')
const archiveAction = computed(() => archiveTarget.value?.archived_at ? 'Restaurar' : 'Archivar')
const archiveDescription = computed(() => archiveTarget.value?.archived_at
  ? 'La categoría volverá a estar disponible al crear gastos.'
  : 'La categoría dejará de estar disponible al crear gastos. Los gastos existentes no cambiarán.',
)

const updateFormOpen = (open: boolean) => {
  if (!isSubmitting.value) isFormOpen.value = open
}

const openForm = (category?: Category) => {
  editingCategory.value = category || null
  form.resetForm({
    values: {
      name: category?.name || '',
      description: category?.description || '',
    },
  })
  isFormOpen.value = true
}

const saveCategory = form.handleSubmit(({ name, description }) => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  const input = { name, description: description || undefined }
  const save = editingCategory.value
    ? categoryStore.updateCategory({ id: editingCategory.value.id, ...input })
    : categoryStore.createCategory(input)

  isFormOpen.value = false
  void save
    .catch((error) => console.error('Error saving category:', error))
    .finally(() => { isSubmitting.value = false })
})

const requestArchive = (category: Category) => {
  archiveTarget.value = category
  isArchiveDialogOpen.value = true
}

const confirmArchive = () => {
  const category = archiveTarget.value
  archiveTarget.value = null
  if (!category) return

  void categoryStore.updateCategory({
    id: category.id,
    archived: !category.archived_at,
  }).catch((error) => console.error('Error updating category:', error))
}

const { updateMenuElements, updateMenuTitle } = useMenuElements()
onMounted(() => {
  updateMenuElements([{ label: 'Ir a mis presupuestos', onClick: () => router.push('/myBudgets') }])
  updateMenuTitle('Categorías')
})
</script>

<template>
  <div>
    <main class="mx-auto w-full max-w-4xl px-4 py-10">
      <Card class="flex flex-col">
        <CardHeader class="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Categorías</CardTitle>
            <CardDescription>Organiza las categorías disponibles para tus gastos.</CardDescription>
          </div>
          <Button type="button" @click="openForm()">
            <PlusIcon /> Nueva categoría
          </Button>
        </CardHeader>
        <CardContent class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead class="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="loading">
              <TableRow v-for="n in 4" :key="n">
                <TableCell v-for="cell in 4" :key="cell">
                  <Skeleton class="h-6 w-full" />
                </TableCell>
              </TableRow>
              </template>
              <TableRow v-else-if="categories.length === 0">
                <TableCell :colspan="4" class="h-24 text-center">Todavía no hay categorías.</TableCell>
              </TableRow>
              <TableRow v-for="category in categories" :key="category.id">
              <TableCell class="font-medium">{{ category.name }}</TableCell>
              <TableCell class="text-muted-foreground">{{ category.description || '—' }}</TableCell>
              <TableCell>{{ category.archived_at ? 'Archivada' : 'Activa' }}</TableCell>
              <TableCell class="text-right">
                <Button type="button" variant="ghost" size="icon" :aria-label="`Editar ${category.name}`"
                  @click="openForm(category)">
                  <PencilIcon />
                </Button>
                <Button type="button" variant="ghost" size="icon"
                  :aria-label="`${category.archived_at ? 'Restaurar' : 'Archivar'} ${category.name}`"
                  @click="requestArchive(category)">
                  <RotateCcwIcon v-if="category.archived_at" />
                  <ArchiveIcon v-else />
                </Button>
              </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>

    <Drawer v-if="isMobile" :open="isFormOpen" @update:open="updateFormOpen">
      <DrawerContent class="w-full p-4">
        <DrawerHeader>
          <DrawerTitle class="text-2xl font-bold">{{ formTitle }}</DrawerTitle>
        </DrawerHeader>
        <CategoryForm :form="form" :on-submit="saveCategory" />
        <DrawerFooter>
          <Button class="w-full" type="submit" form="category-form" :disabled="!isFormValid || isSubmitting">Guardar</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
    <Dialog v-else :open="isFormOpen" @update:open="updateFormOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="text-2xl font-bold">{{ formTitle }}</DialogTitle>
        </DialogHeader>
        <CategoryForm :form="form" :on-submit="saveCategory" />
        <DialogFooter>
          <Button type="submit" form="category-form" :disabled="!isFormValid || isSubmitting">Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <ConfirmationDialog v-model:open="isArchiveDialogOpen" :title="`${archiveAction} categoría`"
      :description="archiveDescription" :action-text="archiveAction" :on-cancel="() => archiveTarget = null"
      :on-confirm="confirmArchive" />
  </div>
</template>
