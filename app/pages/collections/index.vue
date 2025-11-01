<script setup lang="ts">
import { computed } from "vue";
import AuthenticatedCollectionsSection from "@/components/AuthenticatedCollectionsSection.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const showCollections = computed(() => auth.status === "authenticated");
</script>

<template>
    <div class="space-y-6">
        <AuthenticatedCollectionsSection v-if="showCollections" />
        <AuthSignInBlock
            title="Collections"
            description="Sign in to create and manage your collections."
        />
    </div>
</template>
