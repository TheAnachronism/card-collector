<script setup lang="ts"></script>

<template>
  <div class="flex min-h-dvh flex-col bg-background text-foreground">
    <header class="mx-auto w-full max-w-7xl px-4 py-4">
      <NuxtLink to="/" class="inline-flex items-center gap-2">
        <div
          class="grid size-8 place-items-center rounded-md bg-primary/10 text-primary"
        >
          <span class="font-bold">Y</span>
        </div>
        <span class="sr-only md:not-sr-only md:text-sm md:font-semibold">
          Yugioh Manager
        </span>
      </NuxtLink>
    </header>

    <main class="flex flex-1 items-center justify-center px-4 py-8">
      <div class="w-full max-w-md">
        <slot />
      </div>
    </main>
  </div>
</template>
