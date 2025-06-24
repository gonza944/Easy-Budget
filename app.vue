<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'

</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <Toaster richColors />
  </ClientOnly>
</template>
