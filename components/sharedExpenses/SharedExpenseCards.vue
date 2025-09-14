<script lang="ts" setup>
import { MenuIcon } from 'lucide-vue-next';


const isPopoverOpen = ref<boolean[]>([]);
const store = useMySharedActivitiesStore();
const { setSelectedSharedActivity , fetchSharedActivities, deleteSharedActivity } = store;
const { sharedActivities } = storeToRefs(store);
const sharedActivityToDelete = ref<number | null>(null);
const isDeleteDialogOpen = ref(false);

await callOnce(async () => {
    fetchSharedActivities();
}, { mode: 'navigation' });

const handleDeleteClick = (id: number, index: number) => {
    isPopoverOpen.value[index] = !isPopoverOpen.value[index];
    sharedActivityToDelete.value = Number(id);
    isDeleteDialogOpen.value = true;
};

const navigateToSharedExpense = (id: number) => {
    setSelectedSharedActivity(Number(id));
};

const handleDeleteCancel = () => {
    sharedActivityToDelete.value = null;
    isDeleteDialogOpen.value = false;
};

const handleDeleteConfirm = () => {
    if (sharedActivityToDelete.value) {
        deleteSharedActivity(sharedActivityToDelete.value);
    }
    sharedActivityToDelete.value = null;
    isDeleteDialogOpen.value = false;
};
</script>

<template>
    <Card
        v-for="(sharedActivity, index) in sharedActivities.values()"
        :key="sharedActivity.id"
        class="w-xs 4xl:w-sm aspect-square cursor-pointer group hover:animate-pulse transition-all duration-300 items-baseline justify-end relative"
        @click="navigateToSharedExpense(sharedActivity.id)">
        <div class="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
            <Popover v-model:open="isPopoverOpen[index]">
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" class="h-8 w-8" @click.stop>
                        <MenuIcon class="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent class="p-4" align="end" side="bottom">
                    <Button variant="ghost" class="w-full justify-start rounded-sm h-9 px-2 text-destructive-foreground"
                        @click="handleDeleteClick(sharedActivity.id, index)">
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
    <ConfirmationDialog 
        v-if="isDeleteDialogOpen" 
        v-model:open="isDeleteDialogOpen" 
        title="Delete Shared Activity"
        description="Are you sure you want to delete this shared activity? This action cannot be undone."
        action-text="Delete" 
        :on-cancel="handleDeleteCancel" 
        :on-confirm="handleDeleteConfirm" />
</template>