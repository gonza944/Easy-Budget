<template>
  <Drawer v-if="isMobile" :open="isOpen" @update:open="isOpen = $event">
    <DrawerContent class="p-4">
      <DrawerHeader class="pb-8">
        <DrawerTitle class="text-2xl font-bold">Add Expense</DrawerTitle>
      </DrawerHeader>
      <FormContent
        v-model:is-expense="isExpense" :categories="categories" :on-number-input="onNumberInput"
        :handle-form-submit="handleFormSubmit" />
      <DrawerFooter>
        <FormFooter :is-form-valid="isFormValid" :on-submit="onSubmit" />
      </DrawerFooter>
    </DrawerContent>
  </Drawer>


  <Dialog v-else :open="isOpen" @update:open="isOpen = $event">
    <DialogContent class="sm:max-w-md">
      <DialogHeader class="pb-2">
        <DialogTitle class="text-2xl font-bold">Add Expense</DialogTitle>
      </DialogHeader>

      <FormContent
        v-model:is-expense="isExpense" :categories="categories" :on-number-input="onNumberInput"
        :handle-form-submit="handleFormSubmit" />
      <DialogFooter class="mt-4">
        <FormFooter :is-form-valid="isFormValid" :on-submit="onSubmit" />
      </DialogFooter>
    </DialogContent>

  </Dialog>
</template>

<script lang="ts" setup>
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { useMyExpensesStore } from '~/stores/expensesStore';
import { useMyBudgetStoreStore } from '~/stores/budgetStore';
import { ExpenseCreateSchema, ExpenseFormSchema } from '~/types/expense';
import { useSelectedDate } from '~/composables/useSelectedDate';
import FormContent from './formContent.vue';
import FormFooter from './formFooter.vue';
import { useMediaQuery } from '@vueuse/core';

const isOpen = defineModel<boolean>('modelValue', { required: true });
const isMobile = useMediaQuery('(max-width: 768px)');
const store = useMyExpensesStore();
const { categories } = storeToRefs(useCategoryStore());
const { selectedDate } = useSelectedDate();
const budgetStore = useMyBudgetStoreStore();
const { selectedBudget } = storeToRefs(budgetStore);
const isExpense = ref(true);

// Track form errors
const categoryError = ref('');
const amountError = ref('');

// Form schema - using ExpenseFormSchema from types
const expenseSchema = toTypedSchema(ExpenseFormSchema);

const form = useForm({
  validationSchema: expenseSchema,
  initialValues: {
    name: '',
    amount: '',
    description: '',
    category_id: undefined,
  }
});

const isFormValid = computed(() => {
  return Object.keys(form.errors.value).length === 0 && form.meta.value.touched;
});

// Update error variables when form errors change
watch(() => form.errors.value.amount, (val) => {
  amountError.value = val || '';
});

watch(() => form.errors.value.category_id, (val) => {
  categoryError.value = val || '';
});

// Only allow numeric input with decimals
const onNumberInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const value = input.value.replace(/[^0-9.]/g, '');

  // Handle decimal points
  const parts = value.split('.');
  if (parts.length > 1) {
    input.value = `${parts[0]}.${parts.slice(1).join('').substring(0, 2)}`;
  } else {
    input.value = value;
  }

  input.dispatchEvent(new Event('change', { bubbles: true }));
};

const onSubmit = async (closeModal = true) => {
  return form.handleSubmit(async (values, { resetForm }) => {
    if (!selectedBudget.value?.id) return;
    const date = selectedDate.value;
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const amount = isExpense.value ? Number(values.amount) : Number(values.amount) * -1;

    const expenseData = ExpenseCreateSchema.parse({
      budget_id: selectedBudget.value.id,
      category_id: values.category_id,
      name: values.name,
      amount,
      description: values.description || '',
      date: formattedDate,
    });

    store.addExpense(expenseData);
    if (closeModal) {
      isOpen.value = false;
    }
    resetForm();
  })();
};

const handleFormSubmit = () => onSubmit(true);
</script>
