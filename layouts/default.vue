<template>
  <div class="w-full h-screen bg-layout-background text-foreground px-4 md:px-0">
    <NavBar />
    <main>
      <slot />
    </main>
    <ToggleMenu v-if="loggedIn" />
  </div>

</template>

<script lang="ts" setup>
const { loggedIn } = useUserSession();
</script>

<style></style>