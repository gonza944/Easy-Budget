<script setup lang="ts">
import { VisXYContainer, VisLine, VisAxis, VisCrosshair, VisTooltip } from '@unovis/vue'
import type { DataRecord } from '~/types/metrics'
import { utcFormat } from 'd3-time-format'
import type { HTMLAttributes } from 'vue';
import { ChevronDownIcon } from 'lucide-vue-next';

defineProps<{ data: DataRecord[], className?: HTMLAttributes['class'] }>()

const isOpen = ref(true)

const x = (d: DataRecord) => d.x
const y = [
  (d: DataRecord) => d.y,
  (d: DataRecord) => d.y2
]

const color = (d: DataRecord, i: number) => ['var(--chart-1)', 'var(--chart-3)'][i]
const template = (d: DataRecord) => `<div class="flex flex-col gap-4 text-sm">
<span>Date: ${utcFormat('%b %d')(new Date(d.x))}</span>
${d.y !== undefined ? `<span>Remaining Budget: <span class="text-sm font-medium ${d.y >= 0 ? 'text-success' : 'text-destructive-foreground'}">${d.y?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span></span>` : '<span>No expenses recorded yet.</span>'}
</div>`
// Create a function that returns different dash styles based on the line index
const lineDashArray = (d: DataRecord, i: number) => i === 1 ? [3] : []
</script>

<template>
  <Collapsible v-model:open="isOpen">
    <Card :class="className">
      <CardHeader>
        <CollapsibleTriggerResponsive :is-open="isOpen">
          <CardTitle>
            <span>Budget Burndown Chart</span>
          </CardTitle>
        </CollapsibleTriggerResponsive>
      </CardHeader>

      <CollapsibleContent>
        <CardContent>
          <VisXYContainer :data="data" class="budget-chart">
            <VisAxis :gridLine="false" type="x" :tickFormat="utcFormat('%b %d')"
              tickTextColor="var(--muted-foreground)" />
            <VisAxis :gridLine="false" type="y" tickTextColor="var(--muted-foreground)" />
            <VisLine :x="x" :y="y" :lineDashArray="lineDashArray" interpolateMissingData="true" :color="color" />
            <VisCrosshair :color="color" :template="template" />
            <VisTooltip />
          </VisXYContainer>
        </CardContent>
      </CollapsibleContent>
    </Card>
  </Collapsible>
</template>