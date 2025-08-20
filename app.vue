<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'

</script>

<template>
   <NuxtLoadingIndicator :height="6" color="#d87757" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <Toaster richColors />
  </ClientOnly>
</template>
