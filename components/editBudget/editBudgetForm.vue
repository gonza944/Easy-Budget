<script lang="ts" setup>
import type { useForm } from 'vee-validate';
import { maxCalendarDate } from '~/utils/date';

const { form } = defineProps<{
    form: ReturnType<typeof useForm>;
    onSubmit: () => void;
}>();


</script>

<template>
    <form class="flex flex-col gap-6 " @submit="form.handleSubmit(onSubmit)">
        <BudgetTypeAmount :form="form" />
    </form>
</template>