<script lang="ts" setup>
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { CreateSharedActivitySchema } from '~/types/sharedExpenses';
import CreateSharedActivityForm from './CreateSharedActivityForm.vue';
import { useMediaQuery } from '@vueuse/core';

const isOpen = defineModel<boolean>('modelValue', { required: true });

const { fetchMembers } = useMyMembersStore();
const { createSharedActivity } = useMySharedActivitiesStore();

const isMobile = useMediaQuery('(max-width: 768px)');

callOnce(async () => {
    fetchMembers();
}, { mode: 'navigation' });

const form = useForm({
    validationSchema: toTypedSchema(CreateSharedActivitySchema),
});

const onSubmit = form.handleSubmit(async (values) => {
    createSharedActivity(values);
    isOpen.value = false;
});

const isFormValid = computed(() => {
    return Object.keys(form.errors.value).length === 0 && form.meta.value.touched;
});
</script>

<template>
    <Drawer v-if="isMobile" :open="isOpen" @update:open="isOpen = $event">
        <DrawerContent class="p-4">
            <DrawerHeader class="pb-8">
                <DrawerTitle class="text-2xl font-bold">Create Shared Activity</DrawerTitle>
            </DrawerHeader>
            <CreateSharedActivityForm :form="form" :on-submit="onSubmit" :is-form-valid="isFormValid" />
            <DrawerFooter>
                <Button type="submit" :disabled="!isFormValid" @click="onSubmit">
                    Submit
                </Button>
            </DrawerFooter>
        </DrawerContent>
    </Drawer>
    <!-- Desktop -->
    <Dialog v-else :open="isOpen" @update:open="isOpen = $event">
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create Shared Activity</DialogTitle>
            </DialogHeader>
            <CreateSharedActivityForm :form="form" :on-submit="onSubmit" :is-form-valid="isFormValid" />
            <DialogFooter>
                <Button type="submit" :disabled="!isFormValid" @click="onSubmit">
                    Submit
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>