<script lang="ts" setup>
import { toTypedSchema } from '@vee-validate/zod';
import { useForm } from 'vee-validate';
import DatePicker from '~/components/datePicker.vue';
import { newBudgetSchema } from '~/utils/budgetSchemas';

definePageMeta({
  middleware: ['authenticated'],
})

const formSchema = toTypedSchema(newBudgetSchema);

const form = useForm({
  validationSchema: formSchema,
});

const onSubmit = form.handleSubmit((values) => {
  $fetch('/api/budgets', {
    method: 'POST',
    body: values,
  });
});

</script>

<template>
  <div class="flex flex-col gap-6 items-center justify-center h-full">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create a new budget</CardTitle>
      </CardHeader>
      <CardContent>
        <form @submit="onSubmit">
          <FormField v-slot="{ componentField }" name="name">
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input type="text" v-bind="componentField" />
              </FormControl>
              <FormDescription>
                This is the name of the budget. 
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="description">
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us a little bit about the budget" class="resize-none"
                  v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="startingBudget">
            <FormItem>
              <FormLabel>Starting Budget</FormLabel>
              <FormControl>
                <Input type="text" v-bind="componentField" format="currency" />
              </FormControl>
              <FormDescription>
                How much money you have to start with.
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="maxExpensesPerDay">
            <FormItem>
              <FormLabel>Max Expenses Per Day</FormLabel>
              <FormControl>
                <Input type="text" v-bind="componentField" format="currency" />
              </FormControl>
              <FormDescription>
                This is the maximum amount of money you can spend per day.
              </FormDescription>
              <FormMessage />
            </FormItem>
          </FormField>

          <DatePicker v-model="form.values.startDate" name="startDate" label="Start Date"
            description="This is the start date of the budget." />

          <Button type="submit">
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
