<script lang="ts" setup>
import { computed, toRef, watch, onMounted } from 'vue'
import type { useForm } from 'vee-validate'
import { calculateBudgetAmounts } from '@/utils/date'

const { form } = defineProps<{
  form: ReturnType<typeof useForm>
}>()

const budgetType = toRef(form.values, 'budgetType')
const budgetAmount = toRef(form.values, 'budgetAmount')

const theOtherBudgetAmount = computed(() => {
  const today = new Date()
  const { dailyAmount, monthlyAmount } = calculateBudgetAmounts(
    budgetType.value, 
    budgetAmount.value, 
    today.getFullYear(), 
    today.getMonth() + 1
  )

  return budgetType.value === 'daily' 
    ? monthlyAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
    : dailyAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
})

// Only allow numeric input with decimals
const onNumberInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  const value = input.value.replace(/[^0-9.]/g, '')

  // Handle decimal points
  const parts = value.split('.')
  if (parts.length > 1) {
    // Keep only first decimal point and limit to 2 decimal places
    input.value = `${parts[0]}.${parts.slice(1).join('').substring(0, 2)}`
  } else {
    input.value = value
  }

  // Trigger validation update
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

// Watch for changes in budgetType and reset budgetAmount when it changes
watch(budgetType, () => {
  form.resetField('budgetAmount')
})

onMounted(() => {
  form.setFieldValue('budgetType', 'monthly')
})
</script>

<template>
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
              <Input 
                type="text" 
                inputmode="decimal" 
                @input="onNumberInput" 
                v-bind="componentField" 
                class="pl-7"
                placeholder="100.00" 
              />
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
</template>
