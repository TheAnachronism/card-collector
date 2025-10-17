<script setup lang="ts">
defineProps<{
    title: string;
    description: string;
}>();

const auth = useAuthStore();
</script>

<template>
    <Card v-if="!auth.isAuthenticated" class="glass p-5 space-y-3">
        <h2 class="text-lg font-semibold">{{ title }}</h2>
        <p class="text-muted-foreground">
            {{ description }}
        </p>
        <div class="flex justify-end">
            <NuxtLink to="/login" class="inline-flex">
                <Button size="sm">Sign in</Button>
            </NuxtLink>
        </div>
    </Card>
</template>
