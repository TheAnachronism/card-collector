<script setup lang="ts">
import type { ConvexClient } from 'convex/browser';

const client = useConvexClient() as unknown as ConvexClient
</script>

<template>
  <ConvexBetterAuthProvider :client="client">
    <div class="min-h-dvh relative">
      <div class="app-gradient" />
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
  </ConvexBetterAuthProvider>
</template>

<style>
.page-enter-active,
.page-leave-active,
.layout-enter-active,
.layout-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms ease;
}
.page-enter-from,
.layout-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to,
.layout-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
