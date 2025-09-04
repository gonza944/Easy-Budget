<script lang="ts" setup>
import { MenuIcon } from 'lucide-vue-next';


const isPopoverOpen = ref(new Map());
const shouldOpenPopover = computed(() => {
    return isPopoverOpen.value.get(sharedActivityToDelete.value);
});
const store = useMySharedActivitiesStore();
const { setSelectedSharedActivity , fetchSharedActivities} = store;
const { sharedActivities } = storeToRefs(store);
const sharedActivityToDelete = ref<number | null>(null);

await callOnce(async () => {
    fetchSharedActivities();
}, { mode: 'navigation' });

const handleDeleteClick = (id: number) => {
    sharedActivityToDelete.value = id;
};

const navigateToSharedExpense = (id: number) => {
    setSelectedSharedActivity(Number(id));
};
</script>

<template>
    <Card
        v-for="sharedActivity in sharedActivities.values()"
        :key="sharedActivity.id"
        class="w-xs 4xl:w-sm aspect-square cursor-pointer group hover:animate-pulse transition-all duration-300 items-baseline justify-end relative"
        @click="navigateToSharedExpense(sharedActivity.id)">
        <div class="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
            <Popover v-model:open="shouldOpenPopover">
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" class="h-8 w-8" @click.stop>
                        <MenuIcon class="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent class="p-4" align="end" side="bottom">
                    <Button variant="ghost" class="w-full justify-start rounded-sm h-9 px-2 text-destructive-foreground"
                        @click="handleDeleteClick(sharedActivity.id)">
                        Delete Shared Activity
                    </Button>
                </PopoverContent>
            </Popover>
        </div>
        <CardHeader class="justify-start w-full">
            <CardTitle class="text-lg font-semibold capitalize">{{ sharedActivity.name }}</CardTitle>
        </CardHeader>
        <CardContent v-if="sharedActivity.description" class="flex flex-col text-left">
            <p class="break-words first-letter:uppercase text-secondary-foreground dark:text-secondary">{{
                sharedActivity.description }}</p>
        </CardContent>
    </Card>
</template>