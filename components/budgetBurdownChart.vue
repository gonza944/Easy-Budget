<script setup lang="ts">
import { VisXYContainer, VisLine, VisAxis } from '@unovis/vue'
import type { DataRecord } from '~/types/metrics'

defineProps<{ data: DataRecord[] }>()
const x = (d: DataRecord) => d.x
const y = [
    (d: DataRecord) =>  d.y,
    (d: DataRecord) =>  d.y2
  ]

// Create a function that returns different dash styles based on the line index
const lineDashArray = (d: DataRecord, i: number) => i === 1 ? [3] : []
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Budget Burdown</CardTitle>
    </CardHeader>
    <CardContent>
      <VisXYContainer :data="data">
        <VisAxis :gridLine="false" type="x" />
        <VisAxis :gridLine="false" type="y" />
        <VisLine :x="x" :y="y" :lineDashArray="lineDashArray"/>
      </VisXYContainer>
    </CardContent>
  </Card>
</template>