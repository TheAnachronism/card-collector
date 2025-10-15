<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { ConvexClient } from "convex/browser";
import type { FunctionReference } from "convex/server";
import { api as apiUntyped } from "~~/convex/_generated/api";
import type { Id } from "~~/convex/_generated/dataModel";

const client = useConvexClient() as unknown as ConvexClient;

type AppApi = typeof apiUntyped & {
    collections: {
        listForUser: FunctionReference<
            "query",
            "public",
            Record<string, never>,
            Array<{
                _id: Id<"collections">;
                name: string;
                cards: Id<"collectionsCard">[];
            }>
        >;
        create: FunctionReference<
            "mutation",
            "public",
            { name: string },
            Id<"collections">
        >;
        remove: FunctionReference<
            "mutation",
            "public",
            { id: Id<"collections"> },
            null
        >;
    };
};
const api = apiUntyped as AppApi;

type CollectionDoc = {
    _id: Id<"collections">;
    name: string;
    cards: Id<"collectionsCard">[];
};

const collections = ref<CollectionDoc[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const newName = ref("");

async function loadCollections() {
    isLoading.value = true;
    error.value = null;
    try {
        const data = await client.query(
            api.collections.listForUser,
            {} as Record<string, never>,
        );
        collections.value = Array.isArray(data)
            ? (data as CollectionDoc[])
            : [];
    } catch (e: unknown) {
        error.value =
            e instanceof Error ? e.message : "Failed to load collections";
    } finally {
        isLoading.value = false;
    }
}

async function onCreate() {
    const name = newName.value.trim();
    if (!name) return;
    error.value = null;
    isLoading.value = true;
    try {
        await client.mutation(api.collections.create, { name });
        newName.value = "";
        await loadCollections();
    } catch (e: unknown) {
        error.value =
            e instanceof Error ? e.message : "Failed to create collection";
    } finally {
        isLoading.value = false;
    }
}

async function onDelete(id: Id<"collections">) {
    const confirmed = window.confirm(
        "Delete this collection? This cannot be undone.",
    );
    if (!confirmed) return;
    error.value = null;
    isLoading.value = true;
    try {
        await client.mutation(api.collections.remove, { id });
        await loadCollections();
    } catch (e: unknown) {
        error.value =
            e instanceof Error ? e.message : "Failed to delete collection";
    } finally {
        isLoading.value = false;
    }
}

onMounted(loadCollections);
</script>

<template>
    <div class="space-y-6">
        <div
            class="glass p-4 md:p-5 flex items-center justify-between gap-3 shadow-md"
        >
            <div>
                <h1 class="text-lg font-semibold tracking-tight">
                    Welcome back
                </h1>
                <p class="text-sm">Manage your Yugioh collection and decks.</p>
            </div>
        </div>

        <Card class="glass p-4 space-y-3">
            <h2 class="text-sm font-medium">Collections</h2>
            <div class="flex gap-2">
                <Input
                    v-model="newName"
                    placeholder="New collection name"
                    class="flex-1"
                    @keydown.enter="onCreate"
                />
                <Button :disabled="!newName || isLoading" @click="onCreate">
                    {{ isLoading ? "Saving…" : "Create" }}
                </Button>
            </div>
            <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        </Card>

        <div
            v-if="collections.length"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
            <Card
                v-for="c in collections"
                :key="c._id"
                class="glass p-4 flex items-center justify-between gap-3"
            >
                <div class="min-w-0">
                    <NuxtLink :to="`/collections/${c._id}`" class="block">
                        <div class="font-medium truncate">{{ c.name }}</div>
                        <div class="text-xs text-muted-foreground">
                            {{ c.cards?.length || 0 }} cards
                        </div>
                    </NuxtLink>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    class="text-red-500 hover:text-red-600"
                    @click="onDelete(c._id)"
                >
                    <IconTrash2 class="w-4 h-4" />
                </Button>
            </Card>
        </div>
        <div v-else class="text-sm text-muted-foreground">
            You have no collections yet. Create one to get started.
        </div>
    </div>
</template>
