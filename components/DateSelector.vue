<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define props and emits with default value
const props = withDefaults(defineProps<{
    selectedDate?: Date
}>(), {
    selectedDate: () => new Date()
});

const emit = defineEmits<{
    (e: 'update:selectedDate', date: Date): void
}>();

// Format date as dd/mm/yyyy
const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
};

// Generate an array of 30 dates centered around today
const dateRange = computed(() => {
    const today = new Date();
    const dates = [];

    // Add 15 days before today
    for (let i = -15; i < 0; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
    }

    // Add today
    dates.push(today);

    // Add 15 days after today
    for (let i = 1; i <= 15; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
    }

    return dates;
});

// Use the prop value directly since it now has a default
const currentSelectedDate = ref(props.selectedDate);

// Create a map of refs for each date button
const dateRefs = ref<Map<string, HTMLElement>>(new Map());

// Watch for prop changes
watch(() => props.selectedDate, (newValue) => {
    currentSelectedDate.value = newValue;
});
// Handle date selection
const selectDate = (date: Date) => {
    currentSelectedDate.value = date;
    emit('update:selectedDate', date);
};

// Check if a date is selected
const isSelected = (date: Date) => {
    return date.toDateString() === currentSelectedDate.value.toDateString();
};

// Set up the ref for a date button
const setDateRef = (el: HTMLElement | null, date: Date) => {
    if (el) {
        dateRefs.value.set(date.toDateString(), el);
    }
};


</script>

<template>
    <ScrollArea horizontal>
        <Card class="p-0">
            <CardContent>
                <div class="flex gap-2 overflow-x-auto p-2">
                    <Button v-for="(date, index) in dateRange" :key="index" :ref="(el) => setDateRef(el, date)"
                        :variant="isSelected(date) ? 'default' : 'ghost'" @click="selectDate(date)">
                        {{ formatDate(date) }}
                    </Button>
                </div>
            </CardContent>
        </Card>
    </ScrollArea>
</template>