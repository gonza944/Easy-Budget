<template>
  <div class="w-full h-screen bg-layout-background text-foreground px-4 md:px-0">
    <NavBar />
    <main>
      <slot />
    </main>
    <ToggleMenu />
  </div>

</template>

<script lang="ts" setup>
</script>

<style></style>