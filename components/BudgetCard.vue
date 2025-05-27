<script lang="ts" setup>
import type { Budget } from '~/types';
import { MenuIcon } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

defineProps<{
    budget: Budget;
    onDeleteClick: (id: string) => void;
}>();

const router = useRouter();
const isPopoverOpen = ref(false);
const { setSelectedBudget } = useMyExpensesStore();

const handleDeleteClick = (callback: (id: string) => void, id: string) => {
    isPopoverOpen.value = false;
    callback(id);
};

const navigateToExpenses = (id: string) => {
    setSelectedBudget(Number(id));
    router.push(`/dashboard`);
};
</script>

<template>
    <Card
        class="w-full aspect-square cursor-pointer group hover:animate-pulse transition-all duration-300 items-baseline justify-end relative"
        @click="navigateToExpenses(budget.id)">
        <div class="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
            <Popover v-model:open="isPopoverOpen">
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" class="h-8 w-8" @click.stop>
                        <MenuIcon class="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent class="p-4" align="end" side="bottom">
                    <Button variant="ghost" class="w-full justify-start rounded-sm h-9 px-2 text-destructive-foreground"
                        @click="handleDeleteClick(onDeleteClick, budget.id)">
                        Delete Budget
                    </Button>
                </PopoverContent>
            </Popover>
        </div>
        <CardHeader class="justify-start w-full">
            <CardTitle class="text-lg font-semibold capitalize">{{ budget.name }}</CardTitle>
        </CardHeader>
        <CardContent v-if="budget.description" class="flex flex-col text-left">
            <p class="break-words first-letter:uppercase text-secondary-foreground dark:text-secondary">{{
                budget.description }}</p>
        </CardContent>
    </Card>
</template>