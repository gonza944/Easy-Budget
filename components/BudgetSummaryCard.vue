<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  monthlyBudget: number | null;
  monthlyBudgetLoading: boolean;
  remainingDailyBudget: number;
};

defineProps<Props>();
</script>

<template>
  <Card class="w-xs aspect-square items-baseline justify-end">
    <CardHeader>
      <CardTitle>Budgets</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col gap-4 w-full">
      <div class="flex flex-row gap-2 justify-between">
        <p>Monthly Budget:</p>
        <template v-if="monthlyBudgetLoading">
          <Skeleton class="w-[30%] h-10 rounded-full" />
        </template>
        <template v-else>
          <p :class="{
            'text-destructive-foreground': (monthlyBudget || 0) < 0, 
            'text-success': (monthlyBudget || 0) >= 0
          }">
            {{ Number(monthlyBudget).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
          </p>
        </template>
      </div>

      <div class="flex flex-row gap-2 justify-between">
        <p>Daily Budget:</p>
        <template v-if="monthlyBudgetLoading">
          <Skeleton class="w-[30%] h-10 rounded-full" />
        </template>
        <template v-else>
          <p :class="{ 
            'text-destructive-foreground': remainingDailyBudget < 0, 
            'text-success': remainingDailyBudget >= 0 
          }">
            {{ remainingDailyBudget.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) }}
          </p>
        </template>
      </div>
    </CardContent>
  </Card>
</template> 