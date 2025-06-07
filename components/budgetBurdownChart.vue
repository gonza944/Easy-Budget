<script setup lang="ts">
import { VisXYContainer, VisLine, VisAxis, VisCrosshair, VisTooltip } from '@unovis/vue'
import type { DataRecord } from '~/types/metrics'
import { timeFormat } from 'd3-time-format'

defineProps<{ data: DataRecord[] }>()
const x = (d: DataRecord) => d.x
const y = [
  (d: DataRecord) => d.y,
  (d: DataRecord) => d.y2
]

const color = (d: DataRecord, i: number) => ['var(--chart-1)', 'var(--chart-2)'][i]
const template = (d: DataRecord) => `<div class="flex flex-col gap-4 text-secondary-foreground text-sm">
<span>date: ${timeFormat('%b %d')(new Date(d.x))}</span>
<span>Remaining Budget: ${d.y?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
</div>`
// Create a function that returns different dash styles based on the line index
const lineDashArray = (d: DataRecord, i: number) => i === 1 ? [3] : []
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Budget Burdown</CardTitle>
    </CardHeader>
    <CardContent>
      <VisXYContainer :data="data" class="budget-chart">
        <VisAxis :gridLine="false" type="x" :tickFormat="timeFormat('%b %d')" />
        <VisAxis :gridLine="false" type="y" />
        <VisLine :x="x" :y="y" :lineDashArray="lineDashArray" interpolateMissingData="true" :color="color" />
        <VisCrosshair :color="color" :template="template" />
        <VisTooltip />
      </VisXYContainer>
    </CardContent>
  </Card>
</template>