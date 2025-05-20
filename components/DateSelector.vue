<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';


const state = useMyExpensesStoreStore();
const selectedDate = computed(() => state.getSelectedDate);
const setSelectedDate = state.setSelectedDate;

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

    // Generate dates from -15 to +15 days from today
    for (let i = -15; i <= 15; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
    }

    return dates;
});

// Check if a date is selected
const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.value.toDateString();
};

</script>

<template>
    <ScrollArea horizontal>
        <Card class="p-0">
            <CardContent>
                <div class="flex gap-2 overflow-x-auto p-2">
                    <Button v-for="(date, index) in dateRange" :key="index" :variant="isSelected(date) ? 'default' : 'ghost'" @click="setSelectedDate(date)">
                        {{ formatDate(date) }}
                    </Button>
                </div>
            </CardContent>
        </Card>
    </ScrollArea>
</template>