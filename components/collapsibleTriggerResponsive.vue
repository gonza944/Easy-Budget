<script lang="ts" setup>
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import { ChevronDownIcon } from 'lucide-vue-next';

const props = defineProps<{
  isOpen: boolean
}>()

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md') // true when screen is smaller than md (768px)

defineExpose({
  isMobile,
})
</script>

<template>
  <CollapsibleTrigger v-if="isMobile" as-child>
    <div class="flex items-center justify-between">
      <slot />
      <ChevronDownIcon class="h-5 w-5 transition-transform duration-200 ease-in-out"
        :class="{ 'rotate-180': props.isOpen }" />
    </div>

  </CollapsibleTrigger>

  <slot v-else />
</template>
