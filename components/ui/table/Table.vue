<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@sglara/cn'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class'],
  maxHeight?: string,
  scrollable?: boolean
}>(), {
  scrollable: true
})
</script>

<template>
  <div 
    data-slot="table-container" 
    :class="cn(
      'relative w-full', 
      scrollable ? 'overflow-auto h-full' : ''
    )"
  >
    <table data-slot="table" :class="cn('w-full caption-bottom text-sm', props.class)">
      <slot />
    </table>
  </div>
</template>
