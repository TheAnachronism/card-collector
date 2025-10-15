<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { ConvexClient } from "convex/browser";
import type { FunctionReference } from "convex/server";
import { api as apiUntyped } from "~~/convex/_generated/api";
import type { Id } from "~~/convex/_generated/dataModel";

const route = useRoute();
const client = useConvexClient() as unknown as ConvexClient;

type AppApi = typeof apiUntyped & {
    collections: {
        getById: FunctionReference<
            "query",
            "public",
            { id: Id<"collections"> },
            {
                _id: Id<"collections">;
                name: string;
                cards: Id<"collectionsCard">[];
            } | null
        >;
    };
};
const api = apiUntyped as AppApi;

type CollectionDoc = {
    _id: Id<"collections">;
    name: string;
    cards: Id<"collectionsCard">[];
};

const collection = ref<CollectionDoc | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

async function load() {
    const id = route.params.id as string;
    if (!id) return;
    isLoading.value = true;
    error.value = null;
    try {
        const doc = await client.query(api.collections.getById, {
            id: id as Id<"collections">,
        });
        collection.value = doc as CollectionDoc | null;
    } catch (e: unknown) {
        error.value =
            e instanceof Error ? e.message : "Failed to load collection";
    } finally {
        isLoading.value = false;
    }
}

onMounted(load);
</script>

<template>
    <div class="space-y-6">
        <div
            class="glass p-4 md:p-5 flex items-center justify-between gap-3 shadow-md"
        >
            <div>
                <h1 class="text-lg font-semibold tracking-tight">
                    {{
                        collection?.name ||
                        (isLoading ? "Loading…" : "Collection")
                    }}
                </h1>
                <p class="text-sm">Manage cards in this collection.</p>
            </div>
            <NuxtLink to="/collections" class="text-sm underline"
                >Back</NuxtLink
            >
        </div>

        <div v-if="error" class="text-sm text-red-500">{{ error }}</div>
        <div v-else-if="isLoading" class="text-sm text-muted-foreground">
            Loading…
        </div>
        <div v-else-if="!collection" class="text-sm text-muted-foreground">
            Collection not found.
        </div>
        <div v-else class="space-y-3">
            <Card class="glass p-4">
                <div class="text-sm text-muted-foreground">
                    Cards in this collection:
                    {{ collection.cards?.length || 0 }}
                </div>
            </Card>
        </div>
    </div>
</template>
