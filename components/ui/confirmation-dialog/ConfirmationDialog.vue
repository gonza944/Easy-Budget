<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'

type Props = {
    open: boolean
    title: string
    description: string
    cancelText?: string
    actionText: string
    onCancel?: () => void
    onConfirm: () => void
}

const props = withDefaults(defineProps<Props>(), {
    cancelText: 'Cancel',
    onCancel: undefined
})

const emit = defineEmits<{
    'update:open': [value: boolean]
}>()

const isMobile = useMediaQuery('(max-width: 768px)')

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

const handleCancel = () => {
    props.onCancel?.()
    isOpen.value = false
}

const handleConfirm = () => {
    props.onConfirm()
    isOpen.value = false
}
</script>

<template>
    <!-- Mobile: Use Drawer -->
    <Drawer v-if="isMobile" v-model:open="isOpen">
        <DrawerContent class="p-4">
            <DrawerHeader class="pb-6">
                <DrawerTitle class="text-xl font-semibold">{{ title }}</DrawerTitle>

            </DrawerHeader>
            <DrawerDescription class="text-muted-foreground">
                {{ description }}
            </DrawerDescription>
            <DrawerFooter class="pt-4 flex flex-row gap-4 justify-center w-full">
                <Button class="mb-2 flex-1/2" @click="handleConfirm">
                    {{ actionText }}
                </Button>
                <Button variant="outline" class="flex-1/2" @click="handleCancel">
                    {{ cancelText }}
                </Button>
            </DrawerFooter>
        </DrawerContent>
    </Drawer>

    <!-- Desktop: Use AlertDialog -->
    <AlertDialog v-else v-model:open="isOpen">
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{{ title }}</AlertDialogTitle>
                <AlertDialogDescription>
                    {{ description }}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel @click="handleCancel">{{ cancelText }}</AlertDialogCancel>
                <AlertDialogAction @click="handleConfirm">{{ actionText }}</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</template>
