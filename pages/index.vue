<script setup lang="ts">
definePageMeta({
  middleware: ['authenticated'],
})

const { data } = await useFetch('/api/instruments', {
  transform: (data) => {
    return data?.map((item: { id: string, name: string }) => {
      return item.name
    })
  }
});

</script>

<template>
  <div class="flex flex-col items-center justify-center h-full">
    <h1 class="text-4xl font-bold">Hello World</h1>
    <p v-for="item in data" :key="item">{{ item }}</p>
  </div>
</template>
