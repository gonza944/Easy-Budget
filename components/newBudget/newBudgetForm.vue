<script lang="ts" setup>
import type { useForm } from 'vee-validate';
import { CalendarDate } from '@internationalized/date';
import { watch, toRef, computed } from 'vue';
import { calculateBudgetAmounts } from '@/utils/date';

const { form } = defineProps<{
  form: ReturnType<typeof useForm>;
  onSubmit: () => void;
}>();


// Calculate max date (10 years from today)
const maxDate = new Date();
maxDate.setFullYear(maxDate.getFullYear() + 10);

const budgetType = toRef(form.values, 'budgetType');
const budgetAmount = toRef(form.values, 'budgetAmount');
const theOtherBudgetAmount = computed(() => {
  const today = new Date();
  const { dailyAmount, monthlyAmount } = calculateBudgetAmounts(budgetType.value, budgetAmount.value, today.getFullYear(), today.getMonth() + 1);

  return budgetType.value === 'daily' ? monthlyAmount.toLocaleString('en-US', {
    style: 'currency', currency: 'USD'
  }) : dailyAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
});

// Convert JavaScript Date to CalendarDate
const maxCalendarDate = new CalendarDate(
  maxDate.getFullYear(),
  maxDate.getMonth() + 1, // Month is 0-indexed in JS Date, 1-indexed in CalendarDate
  maxDate.getDate()
);

// Only allow numeric input with decimals
const onNumberInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const value = input.value.replace(/[^0-9.]/g, '');

  // Handle decimal points
  const parts = value.split('.');
  if (parts.length > 1) {
    // Keep only first decimal point and limit to 2 decimal places
    input.value = `${parts[0]}.${parts.slice(1).join('').substring(0, 2)}`;
  } else {
    input.value = value;
  }

  // Trigger validation update
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

// Watch for changes in budgetType and reset budgetAmount when it changes
watch(budgetType, () => {
  form.resetField('budgetAmount');
});

onMounted(() => {
  form.setFieldValue('budgetType', 'monthly');
});

</script>


<template>
  <form class="flex flex-col gap-6 " @submit="onSubmit">
    <FormField v-slot="{ componentField }" name="name">
      <FormItem class="flex flex-col gap-4">
        <FormLabel>Name</FormLabel>
        <FormControl>
          <Input type="text" v-bind="componentField" placeholder="Budget name" />
        </FormControl>
        <div class="min-h-[20px] block">
          <FormMessage />
        </div>
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="description">
      <FormItem>
        <FormLabel>Description</FormLabel>
        <FormControl>
          <Textarea placeholder="Tell us a little bit about the budget" class="resize-none" v-bind="componentField" />
        </FormControl>
        <div class="min-h-[20px] block">
          <FormMessage />
        </div>
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="startingBudget">
      <FormItem class="flex flex-col">
        <FormLabel>Starting Budget</FormLabel>
        <FormControl>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input type="text" inputmode="decimal" @input="onNumberInput" v-bind="componentField" class="pl-7"
              placeholder="1000.00" />
          </div>
        </FormControl>
        <div class="min-h-[20px] w-full block">
          <FormMessage />
        </div>
      </FormItem>
    </FormField>

    <div class="flex flex-col">

      <div class="flex gap-4 items-center justify-between">
        <FormField v-slot="{ componentField }" name="budgetType">
          <FormItem class="flex flex-col self-start">
            <FormLabel>Budget Type</FormLabel>
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a budget type" />
                </SelectTrigger>
              </FormControl>
              <div class="min-h-[20px] block">
                <FormMessage />
              </div>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="daily">
                    Daily
                  </SelectItem>
                  <SelectItem value="monthly">
                    Monthly
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormItem>
        </FormField>

        <FormField v-slot="{ componentField }" name="budgetAmount">
          <FormItem class="flex flex-col">
            <FormLabel>Budget Amount</FormLabel>
            <FormControl>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="text" inputmode="decimal" @input="onNumberInput" v-bind="componentField" class="pl-7"
                  placeholder="100.00" />
              </div>
            </FormControl>
            <div class="min-h-[20px] w-full block">
              <FormMessage />
            </div>
          </FormItem>
        </FormField>
      </div>

      <p v-if="budgetAmount > 0" class="text-sm text-muted-foreground">
        The {{ budgetType === 'daily' ? 'monthly' : 'daily' }} budget amount is {{ theOtherBudgetAmount }}
      </p>

    </div>

    <FormField v-slot="{ componentField }" name="startDate">
      <FormItem>
        <FormLabel>Start Date</FormLabel>
        <FormControl>
          <DatePicker v-bind="componentField" :maxValue="maxCalendarDate" />
        </FormControl>
      </FormItem>
    </FormField>
  </form>
</template>
