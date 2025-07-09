<script setup lang="ts">
import {
    type DateValue,
    fromDate,
    getLocalTimeZone,
} from '@internationalized/date'

import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'


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

const setToday = () => {
    selectedDate.value = new Date()
}

// Get today's day number
const todayDay = computed(() => {
    return new Date().getDate()
})
</script>

<template>
    <TooltipProvider>
        <Tooltip>
            <Card class="relative group items-center justify-center hidden md:block">
                <CardContent>
                    <TooltipTrigger
                        class="absolute right-3 top-3 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button variant="default" size="icon" class="h-8 w-8" title="Set to today's date"
                            @click="setToday">
                            <span class="text-xs font-light text-primary-foreground">{{ todayDay }}</span>
                        </Button>
                    </TooltipTrigger>
                    <Calendar v-model="internalValue" initial-focus />
                </CardContent>
            </Card>
            <TooltipContent>
                <p>Set to today's date</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>

</template>