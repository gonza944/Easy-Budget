<script setup lang="ts">
import { computed } from 'vue';
import { useForm } from 'vee-validate';
import { newBudgetSchemaForm } from '~/utils/budgetSchemas';
import { toTypedSchema } from '@vee-validate/zod';
import { useMediaQuery } from '@vueuse/core';

const isOpen = defineModel<boolean>('modelValue', { required: true });

const isMobile = useMediaQuery('(max-width: 768px)');
const formSchema = toTypedSchema(newBudgetSchemaForm);

const form = useForm({
  validationSchema: formSchema,
});

const { createBudget } = useMyBudgetStoreStore();


const isFormValid = computed(() => {
  return Object.keys(form.errors.value).length === 0 && form.meta.value.touched;
});

const onSubmit = form.handleSubmit(async (values) => {
  isOpen.value = false;
  createBudget({
    ...values,
    selected: true
  });
});

</script>

<template>
  <Drawer v-if="isMobile" :open="isOpen" @update:open="isOpen = $event">
    <DrawerContent class="p-4">
      <DrawerHeader class="pb-8">
        <DrawerTitle class="text-2xl font-bold">Create a New Budget</DrawerTitle>
      </DrawerHeader>
      <NewBudgetForm :form="form" :on-submit="onSubmit" />
      <DrawerFooter>
        <Button type="submit" @click="onSubmit" :disabled="!isFormValid">
          Submit
        </Button>
      </DrawerFooter>
    </DrawerContent>
  </Drawer>
  <!-- Desktop -->
  <Dialog v-else :open="isOpen" @update:open="isOpen = $event">
    <DialogContent class="sm:max-w-md">
      <DialogHeader class="pb-4">
        <DialogTitle class="text-2xl font-bold">Create a New Budget</DialogTitle>
      </DialogHeader>
      <NewBudgetForm :form="form" :on-submit="onSubmit" />

      <DialogFooter>
        <Button type="submit" @click="onSubmit" :disabled="!isFormValid">
          Submit
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>