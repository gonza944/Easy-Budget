<script lang="ts" setup>
import { MenuIcon, XIcon } from 'lucide-vue-next';


export type MenuElement = {
  label: string;
  onClick: () => void;
};

const isOpen = useState('menu', () => false);
const elements = useState<MenuElement[]>('menuElements', () => []);
const menuTitle = useState<string>('menuTitle', () => 'Menu');

const onClickWrapper = (onClick: () => void) => {
  isOpen.value = false;
  onClick();
}

const { logout: authLogout } = useAuth()

async function logout() {
  // Use the enhanced logout function from useAuth
  await authLogout()
  
  // Navigate to login after logout
  await navigateTo('/login')
}

</script>

<template>
  <div class="fixed bottom-[5%] right-0 left-0 mx-auto z-10 w-full max-w-sm flex flex-col gap-4">
    <!-- Backdrop blur overlay -->
    <Transition enter-active-class="transition duration-300 ease-out"
      leave-active-class="transition duration-200 ease-in" enter-from-class="opacity-0" enter-to-class="opacity-100"
      leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="isOpen" class="fixed inset-0 bg-secondary-foreground/20 backdrop-blur-md z-[-1]"
        @click="isOpen = false"/>
    </Transition>

    <Transition enter-active-class="transition duration-500 ease-out"
      leave-active-class="transition duration-200 ease-in" enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100" leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0">
      <Card v-if="isOpen">
        <CardContent class="flex flex-col gap-4 items-start px-2">
          <Button v-for="element in elements" :key="element.label" variant="ghost"
            @click="onClickWrapper(element.onClick)" class="w-full py-6 text-sm text-left justify-start">
            {{ element.label }}
          </Button>
          <Divider class="text-primary" />
          <Button variant="ghost" @click="logout" class="w-full py-6 text-sm text-left justify-start text-destructive-foreground">
            Logout
          </Button>
        </CardContent>
      </Card>
    </Transition>

    <Button variant="outline" @click="isOpen = !isOpen"
      class="w-full flex justify-between py-6 text-sm hover:bg-primary hover:text-primary-foreground">
      {{ menuTitle }}
      <Transition mode="out-in" enter-active-class="transition-transform duration-300 ease-in-out"
        leave-active-class="transition-transform duration-300 ease-in-out" enter-from-class="rotate-0 scale-100"
        enter-to-class="rotate-90 scale-110" leave-from-class="rotate-90 scale-110" leave-to-class="rotate-0 scale-100">
        <XIcon v-if="isOpen" class="w-6 h-6" key="close-icon" />
        <MenuIcon v-else class="w-6 h-6" key="menu-icon" />
      </Transition>
    </Button>
  </div>
</template>

<style></style>