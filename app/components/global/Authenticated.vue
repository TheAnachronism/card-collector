<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
const auth = useAuthStore();
</script>

<template>
    <slot v-if="auth.status === 'authenticated'" />
</template>
