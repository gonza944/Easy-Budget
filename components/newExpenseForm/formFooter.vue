<template>
    <Button variant="outline" @click="onSubmit(false)" :disabled="!isFormValid">Agregar otro gasto</Button>
    <Button type="submit" @click="onSubmit" :disabled="!isFormValid">
        Agregar gasto
    </Button>
</template>

<script lang="ts" setup>
type Props = {
    isFormValid: boolean;
    onSubmit: (closeModal?: boolean) => Promise<void>;
};

defineProps<Props>();
</script>
