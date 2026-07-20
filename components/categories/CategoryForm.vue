<script lang="ts" setup>
import type { useForm } from 'vee-validate'

defineProps<{
  form: ReturnType<typeof useForm>
  onSubmit: () => Promise<void>
}>()
</script>

<template>
  <form id="category-form" class="flex w-full flex-col gap-4" @submit.prevent="onSubmit">
    <FormField v-slot="{ componentField }" name="name">
      <FormItem>
        <FormLabel>Nombre</FormLabel>
        <FormControl>
          <Input v-bind="componentField" placeholder="Ej. Supermercado" autofocus />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" name="description">
      <FormItem>
        <FormLabel>Descripción</FormLabel>
        <FormControl>
          <Textarea v-bind="componentField" class="resize-none" placeholder="Opcional" rows="3" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
  </form>
</template>
