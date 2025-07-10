<script setup lang="ts">
import { CollapsibleContent, type CollapsibleContentProps } from 'reka-ui'

const props = defineProps<CollapsibleContentProps>()
</script>

<template>
  <CollapsibleContent
    data-slot="collapsible-content"
    class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1 overflow-hidden duration-500"
    v-bind="props"
  >
    <slot />
  </CollapsibleContent>
</template>
