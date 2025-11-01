<script setup lang="ts">
import { computed } from "vue";
import type { Id } from "~~/convex/_generated/dataModel";
import CollectionDetailsSection from "@/components/CollectionDetailsSection.vue";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const auth = useAuthStore();

const collectionId = computed(
    () => (route.params.id as string[])[0] as Id<"collections">,
);
const showDetails = computed(() => auth.status === "authenticated");
</script>

<template>
    <div class="space-y-6">
        <CollectionDetailsSection
            v-if="showDetails"
            :collection-id="collectionId"
        />
        <AuthSignInBlock
            v-else
            title="Collection"
            description="Sign in to view and manage this collection."
        />
    </div>
</template>
