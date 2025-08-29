<script lang="ts" setup>
import { UseExpensesByCategoryStore } from '~/stores/useExpensesByCategoryStore';
import { useMediaQuery } from '@vueuse/core';

const { expensesByCategory, loading } = storeToRefs(UseExpensesByCategoryStore());

const isMobile = useMediaQuery('(max-width: 768px)');

const isOpen = ref(!isMobile.value)
</script>

<template>
  <Collapsible v-model:open="isOpen">
    <Card class="w-full md:min-w-xs md:min-h-xs 2xl:min-w-md h-auto md:aspect-square items-baseline justify-end">
      <CardHeader class="w-full flex-shrink-0">
        <CollapsibleTriggerResponsive :is-open="isOpen">
          <CardTitle>
            <span>Expenses by Category</span>
          </CardTitle>
        </CollapsibleTriggerResponsive>
      </CardHeader>
                  <CollapsibleContent class="w-full flex-1 flex flex-col min-h-0">
        <CardContent class="flex-1 overflow-y-auto min-h-0">
          <div class="flex flex-col gap-4">
            <div v-if="loading">
              <div class="flex flex-col gap-4">
                <Skeleton v-for="i in 5" :key="i" class="w-full h-8" />
              </div>
            </div>
            <div v-for="(amount, category) in expensesByCategory" v-else :key="category"
              class="flex flex-row justify-between">
              <p>{{ category }}:</p>
              <p class="text-destructive-foreground">{{ Number(amount).toLocaleString('en-US', {
                style: 'currency', currency:
                  'USD'
                }) }}</p>
            </div>
          </div>
        </CardContent>
      </CollapsibleContent>
    </Card>
  </Collapsible>
</template>
