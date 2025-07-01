<script setup lang="ts">
import {
    DateFormatter,
    type DateValue,
    getLocalTimeZone,
    fromDate,
} from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const df = new DateFormatter('en-US', {
    dateStyle: 'long',
})


const { selectedDate } = useSelectedDate();

// Convert between Date and DateValue for internal calendar use
const internalValue = computed({
    get: () => selectedDate.value ? fromDate(selectedDate.value, getLocalTimeZone()) : undefined,
    set: (value: DateValue | undefined) => {
        if (value) {
            selectedDate.value = value.toDate(getLocalTimeZone())
        } else {
            selectedDate.value = new Date()
        }
    }
})
</script>

<template>
    <Popover>
        <PopoverTrigger as-child>
            <Button variant="outline" class='justify-center text-left font-normal text-muted-foreground'>
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{ selectedDate ? df.format(selectedDate) : "Pick a date" }}
            </Button>
        </PopoverTrigger>
        <PopoverContent class="w-auto p-0">
            <Calendar v-model="internalValue" initial-focus />
        </PopoverContent>
    </Popover>
</template>