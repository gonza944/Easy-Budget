<template>
  <div class="w-full min-h-[100dvh] bg-main-gradient text-foreground md:px-4">
    <main>
      <slot />
    </main>
    <ToggleMenu v-if="loggedIn" />
    <LoadingScreen v-if="isLoading" />
  </div>

</template>

<script lang="ts" setup>
const { loggedIn } = useUserSession();
const { isLoading } = useLoadingScreen();
</script>

<style></style>