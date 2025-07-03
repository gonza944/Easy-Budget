<template>
  <Drawer :open="isOpen" @update:open="isOpen = $event">
    <DrawerContent class="flex flex-col gap-4 items-center justify-center pb-8">
      <DrawerHeader>
        <DrawerTitle class="text-2xl font-bold">Select Date</DrawerTitle>
      </DrawerHeader>

      <DateSelector v-model:selectedDate="selectedDate" @click="isOpen = false" />
      <Button variant="default" class="w-xs" @click="onTodayClick">Today</Button>

    </DrawerContent>
  </Drawer>
</template>

<script lang="ts" setup>

const isOpen = defineModel<boolean>('isOpen')
const selectedDate = defineModel<Date>('selectedDate')

const onTodayClick = () => {
  selectedDate.value = new Date()
  isOpen.value = false
}

</script>

<style></style>