<template>
  <nav class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2 flex items-center">
    <div class="flex-1 flex justify-end items-center">
      <Button v-if="loggedIn" variant="ghost" size="sm" @click="logout">
        Logout
      </Button>
      <Button v-else variant="ghost" size="sm" @click="login">
        Login
      </Button>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { Button } from '@/components/ui/button'

const { loggedIn, clear: clearSession } = useUserSession()

async function logout() {
  await clearSession()
  await navigateTo('/login')
}

function login() {
  navigateTo('/login')
}
</script>

<style>

</style>