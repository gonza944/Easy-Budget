<script lang="ts" setup>
import type { Budget } from '~/types';

defineProps<{
    budget: Budget;
}>();
</script>

<template>
    <Card
        class="w-full aspect-square cursor-pointer group hover:animate-pulse transition-all duration-300 items-baseline justify-end">
        <CardHeader class="justify-left w-full">
            <CardTitle class="text-lg font-semibold capitalize">{{ budget.name }}</CardTitle>
        </CardHeader>
        <CardContent v-if="budget.description" class="flex flex-col text-left">
            <p class="break-words first-letter:uppercase text-secondary-foreground dark:text-secondary">{{
                budget.description }}</p>
        </CardContent>
    </Card>
</template>