<script lang="ts" setup>
import { useMediaQuery } from '@vueuse/core';
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { budgetTypeAmountSchema } from '~/utils/budgetSchemas';

const isOpen = defineModel<boolean>('modelValue', { required: true });
const isMobile = useMediaQuery('(max-width: 768px)');

const formSchema = toTypedSchema(budgetTypeAmountSchema);

const form = useForm({
  validationSchema: formSchema,
});

const { editCurrentPeriodBudget } = useMyBudgetStoreStore();

const isFormValid = computed(() => {
  return Object.keys(form.errors.value).length === 0 && form.meta.value.touched;
});

const onSubmit = form.handleSubmit(async (values) => {
  editCurrentPeriodBudget(values);
  isOpen.value = false;
});
</script>

<template>
  <Drawer v-if="isMobile" :open="isOpen" @update:open="isOpen = $event">
    <DrawerContent class="p-4">
      <DrawerHeader>
        <DrawerTitle class="text-2xl font-bold">Edit Budget</DrawerTitle>
      </DrawerHeader>
      <EditBudgetForm :form="form" :on-submit="onSubmit" />
      <DrawerFooter>
        <Button type="submit" @click="onSubmit" :disabled="!isFormValid">
          Submit
        </Button>
      </DrawerFooter>
    </DrawerContent>

  </Drawer>
  <Dialog v-else :open="isOpen" @update:open="isOpen = $event">
    <DialogContent>
      <DialogHeader>
        <DialogTitle class="text-2xl font-bold">Edit Budget</DialogTitle>
      </DialogHeader>
      <EditBudgetForm :form="form" :on-submit="onSubmit" />
      <DialogFooter>
        <Button type="submit" @click="onSubmit" :disabled="!isFormValid">
          Submit
        </Button>
      </DialogFooter>
    </DialogContent>

  </Dialog>
</template>
