<template>
  <Dialog :open="isOpen" @update:open="isOpen = $event">
    <DialogContent class="sm:max-w-md">
      <DialogHeader class="pb-2">
        <DialogTitle class="text-2xl font-bold">Add Expense</DialogTitle>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit.prevent="onSubmit">
        <!-- Name field -->
        <FormField v-slot="{ componentField, errorMessage }" name="name">
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input v-bind="componentField" placeholder="Expense name" />
            </FormControl>
            <Transition name="slide-fade">
              <FormMessage v-if="errorMessage" />
            </Transition>
          </FormItem>
        </FormField>

        <!-- Category and Amount row -->
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Category field -->
          <FormField v-slot="{ componentField, errorMessage: categoryError }" name="category_id" class="flex-1">
            <FormItem class="h-full flex flex-col">
              <FormLabel>Category</FormLabel>
              <Select v-bind="componentField">
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem v-for="category in getCategories" :key="category.id" :value="category.id">
                      {{ category.name }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Transition name="slide-fade">
                <FormMessage v-if="categoryError" :class="{ 'opacity-0': !categoryError }">
                  {{ categoryError || ' ' }}
                </FormMessage>
              </Transition>
            </FormItem>
          </FormField>

          <!-- Amount field -->
          <FormField v-slot="{ componentField, errorMessage: amountError }" name="amount" class="flex-1">
            <FormItem class="h-full flex flex-col">
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input type="text" inputmode="decimal" @input="onNumberInput" v-bind="componentField" class="pl-7"
                    placeholder="0.00" />
                </div>
              </FormControl>
              <Transition name="slide-fade">
                <FormMessage v-if="amountError" :class="{ 'opacity-0': !amountError }">
                  {{ amountError || ' ' }}
                </FormMessage>
              </Transition>
            </FormItem>
          </FormField>
        </div>

        <!-- Description field -->
        <FormField v-slot="{ componentField, errorMessage }" name="description">
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea v-bind="componentField" placeholder="Description (optional)" class="resize-none" rows="2" />
            </FormControl>
            <Transition name="slide-fade">
              <FormMessage v-if="errorMessage" />
            </Transition>
          </FormItem>
        </FormField>
      </form>

      <DialogFooter class="mt-4">
        <Button type="submit" @click="onSubmit" :disabled="!isFormValid">
          Add Expense
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script lang="ts" setup>
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import { useMyExpensesStore } from '~/stores/expensesStore';
import { useMyBudgetStoreStore } from '~/stores/budgetStore';
import { z } from 'zod';
import { ExpenseCreateSchema } from '~/types/expense';
import { useSelectedDate } from '~/composables/useSelectedDate';

const isOpen = defineModel<boolean>('modelValue', { required: true });
const store = useMyExpensesStore();
const { getCategories } = storeToRefs(store);
const { selectedDate } = useSelectedDate();
const budgetStore = useMyBudgetStoreStore();
const { selectedBudget } = storeToRefs(budgetStore);

// Track form errors
const categoryError = ref('');
const amountError = ref('');

// Form schema
const expenseSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, 'Name is required'),
    amount: z.string().min(1, 'Amount is required')
      .transform(val => Number(val))
      .refine(val => !isNaN(val) && val > 0, 'Amount must be greater than 0'),
    description: z.string().optional(),
    category_id: z.number({
      required_error: 'Please select a category',
      invalid_type_error: 'Please select a category',
    }),
  })
);

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

const onSubmit = form.handleSubmit(async (values) => {
  if (!selectedBudget.value?.id) return;
  const date = selectedDate.value;
  const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const expenseData = ExpenseCreateSchema.parse({
    budget_id: selectedBudget.value.id,
    category_id: values.category_id,
    name: values.name,
    amount: Number(values.amount),
    description: values.description || '',
    date: formattedDate,
  });

  store.addExpense(expenseData);
  isOpen.value = false;
});
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
  max-height: 0;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  transform: translateY(0);
  opacity: 1;
  max-height: 40px;
}
</style>
