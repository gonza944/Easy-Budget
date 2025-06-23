<script setup lang="ts">
definePageMeta({
  middleware: ['authenticated'],
  redirect: '/dashboard'
})
</script>
