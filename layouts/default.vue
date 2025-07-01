<template>
  <div class="w-full h-screen bg-main-gradient text-foreground px-4">
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