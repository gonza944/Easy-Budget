<script setup lang="ts">
interface Props {
  id: string | number
  class?: string
  style?: Record<string, string | number>
}

const props = defineProps<Props>()
</script>

<template>
  <svg 
    :id="`orb-${props.id}`"
    :class="props.class"
    :style="props.style" 
    viewBox="0 0 100 100"
  >
    <defs>
      <radialGradient :id="`gradient-${props.id}`" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="currentColor" stop-opacity="0.9" />
        <stop offset="50%" stop-color="currentColor" stop-opacity="0.7" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="0.4" />
      </radialGradient>
      <filter :id="`shadow-${props.id}`" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="currentColor" flood-opacity="0.3"/>
      </filter>
    </defs>
    <circle cx="50" cy="50" r="45" :fill="`url(#gradient-${props.id})`" :filter="`url(#shadow-${props.id})`" />
  </svg>
</template> 