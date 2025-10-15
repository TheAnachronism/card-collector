<script setup lang="ts">
const auth = useAuthStore();
</script>

<template>
    <slot v-if="auth.status === 'loading'" />
</template>
