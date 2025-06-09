<script setup lang="ts">
import { VisSingleContainer, VisDonut } from '@unovis/vue'
import type { HTMLAttributes } from 'vue';

defineProps<{ data: number[], class?: HTMLAttributes['class'] }>()
const value = (d: number) => d
</script>

<template>
  <Card :class="class">
    <CardHeader>
      <CardTitle>Expenses by Category</CardTitle>
    </CardHeader>
    <CardContent>
      <VisSingleContainer :data="data">
        <VisDonut :value="value"/>
      </VisSingleContainer>
    </CardContent>
  </Card>
</template>