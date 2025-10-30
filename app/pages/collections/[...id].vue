<script setup lang="ts">
import type { ConvexClient } from "convex/browser";
import type { FunctionReference } from "convex/server";
import { api as apiUntyped } from "~~/convex/_generated/api";
import type { Id } from "~~/convex/_generated/dataModel";

import SearchCards from "@/components/SearchCards.vue";
import CollectionCardItem from "@/components/CollectionCardItem.vue";

import useSearchDialog from "@/composables/useSearchDialog";

const route = useRoute();
const router = useRouter();
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
                collectionCards: Array<{
                    _id: Id<"collectionsCard">;
                    quantity: number;
                    setCode: string;
                    card: {
                        _id: Id<"cards">;
                        name: string;
                        ygoId: number;
                        type: string;
                        race: string;
                        attribute?: string;
                        cardImages: Array<{
                            id: number;
                            imageUrl: string;
                            imageUrlSmall: string;
                            imageUrlCropped: string;
                        }>;
                    };
                }>;
            } | null
        >;
    };
};
const api = apiUntyped as AppApi;

const isLoading = ref(false);
const error = ref<string | null>(null);

const searchDialog = useSearchDialog();

const id = computed(() => {
    return (route.params.id as string[])[0] as Id<"collections">;
});

const { data: collection } = useConvexQuery(api.collections.getById, {
    id: id.value
});

async function openSearchCardsDialog() {
    if (!id.value) return;
    searchDialog.open({
        component: SearchCards,
        props: {
            collectionId: id.value,
        },
    });
}

async function deleteCollection() {
    if (!id.value) return;
    const confirmed = window.confirm(
        "Delete this collection? This cannot be undone.",
    );
    if (!confirmed) return;
    error.value = null;
    isLoading.value = true;
    try {
        await client.mutation(api.collections.remove, { id: id.value });
        await router.push("/collections");
    } catch (e: unknown) {
        error.value =
            e instanceof Error ? e.message : "Failed to delete collection";
    } finally {
        isLoading.value = false;
    }
}

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
            <div class="flex items-center gap-2">
                <Button @click="openSearchCardsDialog">
                    <IconSearch class="w-4 h-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    class="text-red-500 hover:text-red-600"
                    @click="deleteCollection"
                >
                    <IconTrash2 class="w-4 h-4" />
                </Button>
                <NuxtLink to="/collections" class="text-sm underline"
                    >Back</NuxtLink
                >
            </div>
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
                    {{ collection.collectionCards?.length || 0 }}
                </div>
            </Card>

            <div
                v-if="collection.collectionCards && collection.collectionCards.length > 0"
                class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
                <CollectionCardItem
                    v-for="collectionCard in collection.collectionCards"
                    :key="collectionCard._id"
                    :collection-card="collectionCard"
                />
            </div>
            <div
                v-else
                class="text-sm text-muted-foreground text-center py-8"
            >
                No cards in this collection yet. Search for cards to add them.
            </div>
        </div>
    </div>
</template>
