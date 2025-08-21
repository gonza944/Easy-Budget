<template>
    <Button variant="outline" @click="onSubmit(false)" :disabled="!isFormValid">Add Another Expense</Button>
    <Button type="submit" @click="onSubmit" :disabled="!isFormValid">
        Add Expense
    </Button>
</template>

<script lang="ts" setup>
type Props = {
    isFormValid: boolean;
    onSubmit: (closeModal?: boolean) => Promise<void>;
};

defineProps<Props>();
</script>
