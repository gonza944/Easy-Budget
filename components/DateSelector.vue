<script setup lang="ts">
import {
    type DateValue,
    fromDate,
    getLocalTimeZone,
} from '@internationalized/date'

import { Calendar } from '@/components/ui/calendar'


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
    <Calendar v-model="internalValue" initial-focus />
</template>