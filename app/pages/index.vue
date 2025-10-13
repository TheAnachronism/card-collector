<script setup lang="ts"></script>

<template>
  <div class="space-y-6">
    <div
      class="glass p-4 md:p-5 flex items-center justify-between gap-3 shadow-md"
    >
      <div>
        <h1 class="text-lg font-semibold tracking-tight">Welcome back</h1>
        <p class="text-sm">
          Manage your Yugioh collection and decks.
        </p>
      </div>
      <Button>
        New Deck
      </Button>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <Card class="glass p-4">
        <h2
          class="mb-2 text-sm font-medium"
        >
          Recent cards
        </h2>
        <div class="h-32 rounded-md border border-border"></div>
      </Card>
      <Card class="glass p-4">
        <h2
          class="mb-2 text-sm font-medium"
        >
          Decks activity
        </h2>
        <div class="h-32 rounded-md border border-border"></div>
      </Card>
    </div>
  </div>
</template>
