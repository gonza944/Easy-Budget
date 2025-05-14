<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarDate, DateFormatter, getLocalTimeZone, today } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'
import { toDate } from 'reka-ui/date'
import { computed, ref } from 'vue'

const props = defineProps<{
  name: string
  label?: string
  description?: string
  minValue?: CalendarDate
  maxValue?: CalendarDate
  modelValue?: Date
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Date | undefined]
}>()

const placeholder = ref<CalendarDate | undefined>()

const df = new DateFormatter('en-US', {
  dateStyle: 'long',
})

// Convert JavaScript Date to CalendarDate
const calendarValue = computed(() => {
  if (!props.modelValue) return today(getLocalTimeZone())
  
  const date = props.modelValue
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1, // Month is 0-indexed in JS Date, 1-indexed in CalendarDate
    date.getDate()
  )
})

const defaultMinValue = new CalendarDate(1900, 1, 1)
const defaultMaxValue = today(getLocalTimeZone())

const handleDateChange = (value: DateValue | undefined) => {
  if (!value) {
    emit('update:modelValue', undefined)
    return
  }
  
  // We know it's a CalendarDate because we're using the calendar component
  const calDate = value as CalendarDate
  
  // Convert CalendarDate to JavaScript Date
  const jsDate = new Date(
    calDate.year, 
    calDate.month - 1, // Month is 1-indexed in CalendarDate, 0-indexed in JS Date
    calDate.day
  )
  
  emit('update:modelValue', jsDate)
}
</script>

<template>
  <FormField :name="name">
    <FormItem class="flex flex-col">
      <FormLabel>{{ label ?? "Date" }}</FormLabel>
      <Popover>
        <PopoverTrigger as-child>
          <FormControl>
            <Button variant="outline" :class="[
              'w-[240px] ps-3 text-start font-normal',
              !modelValue && 'text-muted-foreground',
            ]">
              <span>{{ modelValue ? df.format(toDate(calendarValue)) : "Pick a date" }}</span>
              <CalendarIcon class="ms-auto h-4 w-4 opacity-50" />
            </Button>
            <input hidden>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0">
          <Calendar 
            v-model:placeholder="placeholder"
            :model-value="calendarValue"
            calendar-label="Date selection" 
            initial-focus
            :min-value="minValue ?? defaultMinValue" 
            :max-value="maxValue ?? defaultMaxValue" 
            @update:model-value="handleDateChange" 
          />
        </PopoverContent>
      </Popover>
      <FormDescription v-if="description">
        {{ description }}
      </FormDescription>
      <FormMessage />
    </FormItem>
  </FormField>
</template>