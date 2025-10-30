<script setup lang="ts">
import type { ConvexClient } from "convex/browser";
import { api } from "~~/convex/_generated/api";
import type { YGOProDeckCard } from "~~/convex/responses/YGOProDeckResponses";
import type { Id } from "~~/convex/_generated/dataModel";
import AddCardQuantityDialog from "./AddCardQuantityDialog.vue";

const props = defineProps<{
    collectionId?: Id<"collections">;
}>();

const emit = defineEmits<{
    cardAdded: [];
}>();

const client = useConvexClient() as unknown as ConvexClient;

const query = ref("");
const isLoading = ref(false);
const results = ref<YGOProDeckCard[]>([]);
const error = ref<string | null>(null);
const selectedCard = ref<YGOProDeckCard | null>(null);
const selectedSetCode = ref("");
const quantityDialogOpen = ref(false);
const searchedBySetCode = ref(false);

function isLikelySetCode(value: string): boolean {
    const v = value.trim().toUpperCase();
    if (v.length < 3) return false;
    const hasDash = v.includes("-");
    const hasDigit = /\d/.test(v);
    const pattern = /^[A-Z0-9]{2,6}-[A-Z]{1,4}[A-Z]+[0-9]+$/;
    return (hasDash && hasDigit) || pattern.test(v);
}

async function onSearch() {
    const q = query.value.trim();
    if (!q) return;
    error.value = null;
    isLoading.value = true;
    results.value = [];
    searchedBySetCode.value = false;
    try {
        if (isLikelySetCode(q)) {
            searchedBySetCode.value = true;
            const res = await client.action(api.cards.searchBySetCode, {
                setCode: q,
            });
            if (Array.isArray(res) && res.length > 0) {
                results.value = (res ?? []) as YGOProDeckCard[];
            } else {
                searchedBySetCode.value = false;
                const resName = await client.action(
                    api.cards.searchByCardName,
                    {
                        name: q,
                    },
                );
                results.value = (resName ?? []) as YGOProDeckCard[];
            }
        } else {
            searchedBySetCode.value = false;
            const res = await client.action(api.cards.searchByCardName, {
                name: q,
            });
            results.value = (res ?? []) as YGOProDeckCard[];
        }
    } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : "Search failed";
    } finally {
        isLoading.value = false;
    }
}

function onCardClick(card: YGOProDeckCard) {
    if (!props.collectionId || !searchedBySetCode.value) return;

    // Use the set code from the search query
    const searchedSetCode = query.value.trim();
    
    // Find the set code that matches the search query
    // Since searchBySetCode returns cards with that set code, we should find a match
    const normalizedQuery = searchedSetCode.toUpperCase();
    const matchingSet = card.card_sets?.find((s) => {
        const setCodeUpper = s.set_code.toUpperCase();
        return (
            setCodeUpper === normalizedQuery ||
            setCodeUpper.includes(normalizedQuery) ||
            normalizedQuery.includes(setCodeUpper)
        );
    });

    if (matchingSet) {
        selectedCard.value = card;
        // Use the actual set code from the card's sets (normalized)
        selectedSetCode.value = matchingSet.set_code;
        quantityDialogOpen.value = true;
    } else if (card.card_sets && card.card_sets.length > 0) {
        // Fallback: if no exact match, use the first set code
        // This shouldn't happen if searchBySetCode worked correctly
        selectedCard.value = card;
        selectedSetCode.value = card.card_sets[0].set_code;
        quantityDialogOpen.value = true;
    }
}

function onCardAdded() {
    emit("cardAdded");
    quantityDialogOpen.value = false;
}

function firstImage(card: YGOProDeckCard): string | null {
    const img = card.card_images?.[0];
    return img?.image_url_small ?? img?.image_url ?? null;
}
</script>

<template>
    <div class="flex flex-col gap-6 overflow-hidden mb-10">
        <Card class="glass p-4 space-y-3">
            <h2 class="text-sm font-medium">Search cards</h2>
            <div
                class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
            >
                <Input
                    v-model="query"
                    placeholder="Enter card name or set code (e.g. 'Blue-Eyes' or 'MRD-EN000')"
                    class="flex-1"
                    :disabled="isLoading"
                    @keydown.enter="onSearch"
                />
                <Button
                    class="w-full sm:w-auto"
                    :disabled="!query || isLoading"
                    @click="onSearch"
                >
                    {{ isLoading ? "Searching…" : "Search" }}
                </Button>
            </div>
            <p
                class="text-sm text-muted-foreground"
                :class="{ 'opacity-0': !results.length }"
            >
                Found {{ results.length }} cards
            </p>
            <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
        </Card>
    </div>

    <ScrollArea
        v-if="results.length"
        class="-m-4 h-[55dvh] max-h-[600px] px-4 pb-2 sm:-m-6 sm:h-[60dvh] sm:px-6 sm:pb-3 lg:-m-8 lg:h-[65dvh] lg:px-8"
    >
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card
                v-for="card in results"
                :key="card.id"
                class="overflow-hidden glass"
                :class="{
                    'cursor-pointer hover:ring-2 hover:ring-primary':
                        collectionId && searchedBySetCode,
                }"
                @click="onCardClick(card)"
            >
                <div class="relative bg-muted/40">
                    <NuxtImg
                        v-if="firstImage(card)"
                        :src="firstImage(card)!"
                        :alt="card.name"
                        class="w-full max-h-64 object-cover object-top px-2"
                    />
                    <div
                        v-else
                        class="grid w-full place-items-center text-sm text-muted-foreground"
                    >
                        No image
                    </div>
                </div>
                <div class="space-y-1 p-3">
                    <div class="line-clamp-2 font-semibold leading-tight">
                        {{ card.name }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                        {{ card.type }} •
                        {{ card.race || card.attribute || "N/A" }}
                    </div>
                    <div
                        v-if="card.card_sets?.length"
                        class="mt-2 flex flex-wrap gap-1"
                    >
                        <span
                            v-for="s in card.card_sets.slice(0, 3)"
                            :key="s.set_code"
                            class="rounded bg-accent/30 px-1.5 py-0.5 text-[11px] text-muted-foreground"
                        >
                            {{ s.set_code }}
                        </span>
                        <span
                            v-if="card.card_sets.length > 3"
                            class="text-[11px] text-muted-foreground"
                        >
                            +{{ card.card_sets.length - 3 }} more
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    </ScrollArea>
    <div v-else class="text-sm text-muted-foreground">
        Enter a query to search for cards.
    </div>

    <AddCardQuantityDialog
        v-if="collectionId"
        v-model:open="quantityDialogOpen"
        :card="selectedCard"
        :collection-id="collectionId"
        :set-code="selectedSetCode"
        @added="onCardAdded"
    />
</template>
