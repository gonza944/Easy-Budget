<template>
  <div class="w-full min-h-screen bg-main-gradient text-foreground md:px-4">
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