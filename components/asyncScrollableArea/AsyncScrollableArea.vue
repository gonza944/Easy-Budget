<script lang="ts" setup>

</script>

<template>
    <ScrollArea class="w-full">
        <div class="flex gap-4 pb-4 overflow-x-auto justify-center px-4">
            <Suspense>
                <template #fallback>
                    <FallbackTemplate />
                </template>
                <template #default>
                    <slot name="content" />
                </template>
            </Suspense>
        </div>
        <ScrollBar orientation="horizontal" />
    </ScrollArea>
</template>