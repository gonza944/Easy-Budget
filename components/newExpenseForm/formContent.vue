
<template>
  <form class="flex flex-col gap-4" @submit.prevent="handleFormSubmit">
    <!-- Name field -->
    <FormField v-slot="{ componentField, errorMessage }" name="name">
      <FormItem>
        <FormLabel>Name</FormLabel>
        <FormControl>
          <Input v-bind="componentField" placeholder="Expense name" />
        </FormControl>
        <Transition name="slide-fade">
          <FormMessage v-if="errorMessage" />
        </Transition>
      </FormItem>
    </FormField>

    <!-- Category and Amount row -->
    <div class="flex flex-col sm:flex-row gap-4">
      <!-- Category field -->
      <FormField v-slot="{ componentField, errorMessage: categoryError }" name="category_id" class="flex-1">
        <FormItem class="h-full flex flex-col">
          <FormLabel>Category</FormLabel>
          <Combobox 
            :model-value="componentField.modelValue"
            @update:model-value="componentField.onChange"
          >
            <FormControl class="w-full">
              <ComboboxAnchor>
                <div class="relative w-full items-center">
                  <ComboboxInput 
                    placeholder="Select category"
                    :display-value="(val: number) => {
                      if (!val) return '';
                      const category = categories.find(cat => cat.id === val);
                      return category ? category.name : '';
                    }"
                  />
                  <ComboboxTrigger class="absolute end-0 inset-y-0 flex items-center justify-center px-3">
                    <ChevronsUpDown class="size-4 text-muted-foreground" />
                  </ComboboxTrigger>
                </div>
              </ComboboxAnchor>
            </FormControl>

            <ComboboxList>
              <ComboboxEmpty>
                Nothing found.
              </ComboboxEmpty>

              <ComboboxGroup>
                <ComboboxItem 
                  v-for="category in categories" 
                  :key="category.id" 
                  :value="category.id"
                >
                  {{ category.name }}

                  <ComboboxItemIndicator>
                    <Check class="ml-auto h-4 w-4" />
                  </ComboboxItemIndicator>
                </ComboboxItem>
              </ComboboxGroup>
            </ComboboxList>
          </Combobox>
          <Transition name="slide-fade">
            <FormMessage v-if="categoryError" :class="{ 'opacity-0': !categoryError }">
              {{ categoryError || ' ' }}
            </FormMessage>
          </Transition>
        </FormItem>
      </FormField>

      <!-- Amount field -->
      <FormField v-slot="{ componentField, errorMessage: amountError }" name="amount" class="flex-1">
        <FormItem class="h-full flex flex-col">
          <FormLabel>Amount</FormLabel>
          <FormControl>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input 
                type="text" 
                inputmode="decimal" 
                placeholder="0.00"
                class="pl-7"
                v-bind="componentField"
                @input="onNumberInput"
              />
            </div>
          </FormControl>
          <Transition name="slide-fade">
            <FormMessage v-if="amountError" :class="{ 'opacity-0': !amountError }">
              {{ amountError || ' ' }}
            </FormMessage>
          </Transition>
        </FormItem>
      </FormField>
    </div>

    <!-- Description field -->
    <FormField v-slot="{ componentField, errorMessage }" name="description">
      <FormItem>
        <FormLabel>Description</FormLabel>
        <FormControl>
          <Textarea v-bind="componentField" placeholder="Description (optional)" class="resize-none" rows="2" />
        </FormControl>
        <Transition name="slide-fade">
          <FormMessage v-if="errorMessage" />
        </Transition>
      </FormItem>
    </FormField>
  </form>
</template>

<script lang="ts" setup>
import { ChevronsUpDown, Check } from 'lucide-vue-next';

type Props = {
  categories: Array<{ id: number; name: string }>;
  onNumberInput: (e: Event) => void;
  handleFormSubmit: () => void;
};

defineProps<Props>();
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
  max-height: 0;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  transform: translateY(0);
  opacity: 1;
  max-height: 40px;
}
</style>

