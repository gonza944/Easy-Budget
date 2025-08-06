<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
const { fetch: refreshSession } = useUserSession()
const credentials = reactive({
  email: '',
  password: '',
})

const isLoading = ref(false)
const errorMessage = ref('')

async function login() {
  if (isLoading.value) return
  
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const result = await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials
    })
    
    if (result.success) {
      // Refresh the session on client-side and redirect to the home page
      await refreshSession()
      await navigateTo('/')
    } else {
      errorMessage.value = 'Login failed'
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = 'Bad credentials'
  } finally {
    isLoading.value = false
  }
}

</script>

<template>
  <div class="flex flex-col gap-6 items-baseline justify-end md:items-center md:justify-center h-screen backdrop-blur-md" :class="props.class">
    <Card class="w-full md:max-w-md rounded-none md:rounded-lg md:h-auto">
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent class="h-full">
        <form @submit.prevent="login">
          <div class="flex flex-col gap-6">
            <div class="grid gap-3">
              <Label for="email">Email</Label>
              <Input id="email" v-model="credentials.email" type="email" placeholder="m@example.com" required />
            </div>
            <div class="grid gap-3">
              <div class="flex items-center">
                <Label for="password">Password</Label>
                <a href="#" class="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                  Forgot your password?
                </a>
              </div>
              <Input id="password" v-model="credentials.password" type="password" required />
            </div>
            <div class="flex flex-col gap-3">
              <Button type="submit" class="w-full">
                Login
              </Button>
              <Button variant="outline" class="w-full">
                Login with Google
              </Button>
            </div>
          </div>
          <div class="mt-4 text-center text-sm">
            Don't have an account?
            <a href="#" class="underline underline-offset-4">
              Sign up
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
