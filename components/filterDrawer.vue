<template>
  <Drawer :open="isOpen" @update:open="isOpen = $event">
    <DrawerContent class="flex flex-col gap-4 items-center justify-center pb-8">
      <DrawerHeader>
        <DrawerTitle class="text-2xl font-bold">Seleccionar fecha</DrawerTitle>
      </DrawerHeader>

      <Calendar v-model="internalValue" locale="es-AR" initial-focus />
      <Button variant="default" class="w-xs" @click="onTodayClick">Hoy</Button>

    </DrawerContent>
  </Drawer>
</template>

<script lang="ts" setup>
import {
  type DateValue,
  fromDate,
  getLocalTimeZone,
} from '@internationalized/date'

const isOpen = defineModel<boolean>('isOpen')
const selectedDate = defineModel<Date>('selectedDate')

const internalValue = computed({
  get: () => selectedDate.value ? fromDate(selectedDate.value, getLocalTimeZone()) : undefined,
  set: (value: DateValue | undefined) => {
    if (value) {
      selectedDate.value = value.toDate(getLocalTimeZone())
    } else {
      selectedDate.value = new Date()
    }
    isOpen.value = false
  }
})

const onTodayClick = () => {
  selectedDate.value = new Date()
  isOpen.value = false
}

</script>
