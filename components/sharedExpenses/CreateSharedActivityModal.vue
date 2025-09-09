<script lang="ts" setup>
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { CreateSharedActivitySchema } from '~/types/sharedExpenses';
import CreateSharedActivityForm from './CreateSharedActivityForm.vue';

const isOpen = defineModel<boolean>('modelValue', { required: true });

const form = useForm({
    validationSchema: toTypedSchema(CreateSharedActivitySchema),
});

const onSubmit = form.handleSubmit(async (values) => {
    console.log(values);
});

const isFormValid = computed(() => {
    return Object.keys(form.errors.value).length === 0 && form.meta.value.touched;
});
</script>

<template>
    <Dialog :open="isOpen" @update:open="isOpen = $event">
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