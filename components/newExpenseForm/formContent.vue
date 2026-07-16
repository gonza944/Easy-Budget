<template>
  <form class="flex flex-col gap-4" @submit.prevent="handleFormSubmit">
    <!-- Name field -->
    <FormField v-slot="{ componentField, errorMessage }" name="name">
      <FormItem>
        <FormLabel>Nombre</FormLabel>
        <FormControl>
          <Input v-bind="componentField" placeholder="Nombre del gasto" />
        </FormControl>
        <Transition name="slide-fade">
          <FormMessage v-if="errorMessage" />
        </Transition>
      </FormItem>
    </FormField>

    <!-- Category field -->
    <FormField v-slot="{ componentField, errorMessage: categoryError }" name="category" class="flex-1">
      <FormItem class="h-full flex flex-col">
        <FormLabel>Categoría</FormLabel>
        <Combobox
          v-model:open="categoryOpen"
          :model-value="componentField.modelValue"
          :reset-model-value-on-clear="true"
          @update:model-value="componentField.onChange"
        >
          <FormControl class="w-full">
            <ComboboxAnchor>
              <div class="relative w-full items-center">
                <ComboboxInput
                  class="text-base md:text-sm"
                  placeholder="Selecciona una categoría"
                  :model-value="categorySearch"
                  :display-value="displayCategory"
                  @update:model-value="(value) => updateCategorySearch(value, componentField.modelValue, componentField.onChange)"
                />
                <ComboboxTrigger class="absolute end-0 inset-y-0 flex items-center justify-center px-3">
                  <ChevronsUpDown class="size-4 text-muted-foreground" />
                </ComboboxTrigger>
              </div>
            </ComboboxAnchor>
          </FormControl>

          <ComboboxList>
            <ComboboxEmpty>
              <Button
                v-if="categorySearch.trim()"
                type="button"
                variant="ghost"
                class="w-full justify-start"
                @mousedown.prevent
                @click="selectDraft(componentField.onChange)"
              >
                <Plus class="size-4" />
                Crear “{{ categorySearch.trim() }}”
              </Button>
              <span v-else>No se encontraron resultados.</span>
            </ComboboxEmpty>

            <ComboboxGroup class="overflow-y-auto max-h-48 md:max-h-72">
              <ComboboxItem v-for="category in categories" :key="category.id" :value="category.id"
                class="text-base md:text-sm">
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

    <!-- type and Amount row -->
    <div class="flex flex-row gap-4 items-center justify-between">
      <div class="flex space-x-2 mt-5">
        <Switch id="expense-type" v-model="isExpense" />
        <Label for="expense-type">{{ isExpense ? 'Gasto' : 'Ingreso' }}</Label>
      </div>

      <!-- Amount field -->
      <FormField v-slot="{ componentField, errorMessage: amountError }" name="amount" class="flex-1">
        <FormItem class="h-full flex flex-col w-full">
          <FormLabel>Monto</FormLabel>
          <FormControl>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input type="text" inputmode="decimal" placeholder="0.00" class="pl-7" v-bind="componentField"
                @input="onNumberInput" />
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
        <FormLabel>Descripción</FormLabel>
        <FormControl>
          <Textarea v-bind="componentField" placeholder="Descripción (opcional)" class="resize-none" rows="2" />
        </FormControl>
        <Transition name="slide-fade">
          <FormMessage v-if="errorMessage" />
        </Transition>
      </FormItem>
    </FormField>
  </form>
</template>

<script lang="ts" setup>
import { ChevronsUpDown, Check, Plus } from 'lucide-vue-next';
import type { Category, CategorySelection } from '~/types/category';

type Props = {
  categories: Category[];
  onNumberInput: (e: Event) => void;
  handleFormSubmit: () => void;
};

const isExpense = defineModel<boolean>('isExpense', { required: true });
const props = defineProps<Props>();
const categoryOpen = ref(false);
const categorySearch = ref('');

const displayCategory = (selection: CategorySelection | undefined) => {
  if (typeof selection === 'number') {
    return props.categories.find((category) => category.id === selection)?.name || '';
  }

  return selection?.name || '';
};

const updateCategorySearch = (
  search: string,
  selection: CategorySelection | undefined,
  onChange: (value: CategorySelection | undefined) => void,
) => {
  categorySearch.value = search;
  if (selection && search !== displayCategory(selection)) onChange(undefined);
};

const selectDraft = (onChange: (value: CategorySelection) => void) => {
  const name = categorySearch.value.trim();
  if (!name) return;

  onChange({ kind: 'draft', name });
  categoryOpen.value = false;
};
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
