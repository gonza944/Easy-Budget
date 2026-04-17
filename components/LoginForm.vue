<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
const credentials = reactive({
  email: '',
  password: '',
})

const { setIsLoading, isLoading } = useLoadingScreen()
const errorMessage = ref('')
const { login: signIn } = useAuth()

async function login() {
  if (isLoading.value) return

  setIsLoading(true)
  errorMessage.value = ''

  try {
    const result = await signIn(credentials)

    if (result.success) {
      await navigateTo('/')
    } else {
      errorMessage.value = result.error || 'Login failed'
      setIsLoading(false)
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = 'Credenciales incorrectas'
    setIsLoading(false)
  }
}

onUnmounted(() => {
  setIsLoading(false)
})

</script>

<template>
  <div
    class="flex flex-col gap-6 items-baseline justify-end md:items-center md:justify-center h-[100dvh] backdrop-blur-md"
    :class="props.class">
    <Card class="w-full md:max-w-md rounded-none md:rounded-lg md:h-auto">
      <CardHeader>
        <CardTitle>Inicia sesión en tu cuenta</CardTitle>
        <CardDescription>
          Ingresa tu correo electrónico para iniciar sesión
        </CardDescription>
      </CardHeader>
      <CardContent class="h-full">
        <form @submit.prevent="login">
          <div class="flex flex-col gap-6">
            <div class="grid gap-3">
              <Label for="email">Correo electrónico</Label>
              <Input id="email" v-model="credentials.email" type="email" placeholder="m@example.com" required />
            </div>
            <div class="grid gap-3">
              <div class="flex items-center">
                <Label for="password">Contraseña</Label>
                <a href="#" class="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <Input id="password" v-model="credentials.password" type="password" required />
            </div>
            <div class="flex flex-col gap-3">
              <Button type="submit" class="w-full">
                Iniciar sesión
              </Button>
              <Button variant="outline" class="w-full">
                Iniciar sesión con Google
              </Button>
            </div>
          </div>
          <div class="mt-4 text-center text-sm">
            ¿No tienes una cuenta?
            <a href="#" class="underline underline-offset-4">
              Crear cuenta
            </a>
          </div>
        </form>

      </CardContent>
    </Card>
  </div>

</template>
