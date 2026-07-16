<template>
    <Button type="button" variant="outline" @click="onSubmit(false)" :disabled="!isFormValid || isSubmitting">Agregar otro gasto</Button>
    <Button type="button" @click="onSubmit" :disabled="!isFormValid || isSubmitting">
        Agregar gasto
    </Button>
</template>

<script lang="ts" setup>
type Props = {
    isFormValid: boolean;
    isSubmitting: boolean;
    onSubmit: (closeModal?: boolean) => Promise<void>;
};

defineProps<Props>();
</script>
