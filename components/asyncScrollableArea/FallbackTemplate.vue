<script lang="ts" setup></script>

<template>
    <div v-for="n in 4" :key="`skeleton-${n}`" class="w-xs flex-shrink-0">
        <Skeleton class="w-full h-10 rounded-full" />
    </div>
</template>