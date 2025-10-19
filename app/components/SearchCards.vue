<script setup lang="ts">
import type { ConvexClient } from "convex/browser";
import { api } from "~~/convex/_generated/api";
import type { YGOProDeckCard } from "~~/convex/responses/YGOProDeckResponses";

const client = useConvexClient() as unknown as ConvexClient;

const query = ref("");
const isLoading = ref(false);
const results = ref<YGOProDeckCard[]>([]);
const error = ref<string | null>(null);

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
    try {
        if (isLikelySetCode(q)) {
            const res = await client.action(api.cards.searchBySetCode, {
                setCode: q,
            });
            if (Array.isArray(res) && res.length > 0) {
                results.value = (res ?? []) as YGOProDeckCard[];
            } else {
                const resName = await client.action(
                    api.cards.searchByCardName,
                    {
                        name: q,
                    },
                );
                results.value = (resName ?? []) as YGOProDeckCard[];
            }
        } else {
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
</template>
