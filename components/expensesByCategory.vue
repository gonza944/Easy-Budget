<script setup lang="ts">
import { VisSingleContainer, VisDonut, VisTooltip } from '@unovis/vue'
import { Donut } from '@unovis/ts'
import type { HTMLAttributes } from 'vue';
import { computed } from 'vue';
import { cn } from '@sglara/cn';

const props = defineProps<{ data: Record<string, number>, class?: HTMLAttributes['class'] }>()

const chartData = computed(() => {
  return Object.entries(props.data || {}).map(([category, amount]) => ({
    category,
    amount
  }));
});

const amountAccessor = (d: { category: string, amount: number }) => d.amount;
const categoryAccessor = (d: { category: string, amount: number }) => d.category;

const tooltipHtml = (d: { data: { category: string, amount: number } }) => {
  return `<div class="flex gap-2 items-center">
    <span>${d.data.category}:</span>
    <span>${d.data.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
  </div>`;
};

const colorAccessor = (d: { category: string, amount: number }, i: number) => {
  const colors = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ];
  return colors[i % colors.length];
};
</script>

<template>
  <Card :class="cn(props.class, 'budget-chart')">
    <CardHeader>
      <CardTitle>Expenses by Category</CardTitle>
    </CardHeader>
    <CardContent>
      <VisSingleContainer :data="chartData">
        <VisDonut :value="amountAccessor" :arcLabel="categoryAccessor" :arcWidth="40" :color="colorAccessor" :padAngle="0.01"/>
        <VisTooltip :triggers="{
          [Donut.selectors.segment]: tooltipHtml
        }" />
      </VisSingleContainer>
    </CardContent>
  </Card>
</template>