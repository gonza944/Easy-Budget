<script lang="ts" setup>
import { UseExpensesByCategoryStore } from '~/stores/useExpensesByCategoryStore';

const { expensesByCategory, loading } = storeToRefs(UseExpensesByCategoryStore());

const isOpen = ref(true)
</script>

<template>
  <Collapsible v-model:open="isOpen">
    <Card class="w-full md:w-xs 2xl:w-md h-xs 2xl:h-md md:aspect-square items-baseline justify-end">
      <CardHeader class="w-full flex-shrink-0">
        <CollapsibleTriggerResponsive :is-open="isOpen">
          <CardTitle>
            <span>Expenses by Category</span>
          </CardTitle>
        </CollapsibleTriggerResponsive>
      </CardHeader>
      <CollapsibleContent class="w-full">
        <CardContent class="flex flex-col gap-4 w-full overflow-y-auto flex-1">
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
        </CardContent>
      </CollapsibleContent>
    </Card>
  </Collapsible>
</template>
