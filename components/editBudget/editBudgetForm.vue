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
        <FormField v-slot="{ componentField }" name="startDate">
            <FormItem>
                <FormLabel>Optional Start Date</FormLabel>
                <FormControl>
                    <DatePicker v-bind="componentField" :maxValue="maxCalendarDate" />
                </FormControl>
            </FormItem>
        </FormField>
    </form>
</template>