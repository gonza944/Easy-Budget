<script setup lang="ts">
definePageMeta({
  middleware: ['authenticated'],
})
</script>

<template>
  <div class="flex flex-col items-center justify-center h-screen">
    <h1 class="text-4xl font-bold">Hello World</h1>
  </div>
</template>
