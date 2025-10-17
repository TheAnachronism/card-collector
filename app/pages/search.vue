<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { ConvexClient } from "convex/browser";
import type { FunctionReference } from "convex/server";
import { api as apiUntyped } from "~~/convex/_generated/api";
import type { YGOProDeckCard } from "~~/convex/responses/YGOProDeckResponses";
import { useAuthStore } from "@/stores/auth";

const client = useConvexClient() as unknown as ConvexClient;

type AppApi = typeof apiUntyped & {
    cards: {
        searchBySetCode: FunctionReference<
            "action",
            "public",
            { setCode: string },
            YGOProDeckCard[]
        >;
        searchByCardName: FunctionReference<
            "action",
            "public",
            { name: string },
            YGOProDeckCard[]
        >;
    };
};
const api = apiUntyped as AppApi;

const query = ref("");
const results = ref<YGOProDeckCard[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const auth = useAuthStore();

function isLikelySetCode(value: string): boolean {
    const v = value.trim().toUpperCase();
    if (v.length < 3) return false;
    const hasDash = v.includes("-");
    const hasDigit = /\d/.test(v);
    const pattern = /^[A-Z0-9]{2,6}-[A-Z]{1,4}[A-Z0-9]*$/;
    return (hasDash && hasDigit) || pattern.test(v);
}

async function onSearch() {
    if (!auth.isAuthenticated) return;
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

watch(
    () => auth.status,
    (status) => {
        if (status !== "authenticated") {
            results.value = [];
            error.value = null;
            isLoading.value = false;
        }
    },
    { immediate: true },
);
</script>

<template>
    <div class="space-y-6">
        <Card class="glass p-4 space-y-3">
            <h2 class="text-sm font-medium">Search cards</h2>
            <div class="flex gap-2">
                <Input
                    v-model="query"
                    placeholder="Enter card name or set code (e.g. 'Blue-Eyes' or 'MRD-EN000')"
                    class="flex-1"
                    :disabled="!auth.isAuthenticated || isLoading"
                    @keydown.enter="onSearch"
                />
                <Button
                    :disabled="!query || isLoading || !auth.isAuthenticated"
                    @click="onSearch"
                >
                    {{ isLoading ? "Searching…" : "Search" }}
                </Button>
            </div>
            <p class="text-xs text-muted-foreground">
                Tip: We'll auto-detect set codes and names.
            </p>
            <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
            <p
                v-if="!auth.isAuthenticated"
                class="text-sm text-muted-foreground"
            >
                Sign in to search the card database.
            </p>
        </Card>

        <template v-if="auth.isAuthenticated">
            <div
                v-if="results.length"
                class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
            >
                <Card
                    v-for="card in results"
                    :key="card.id"
                    class="overflow-hidden glass"
                >
                    <div class="relative bg-muted/40">
                        <NuxtImg v-if="firstImage(card)" :src="firstImage(card)!" :alt="card.name" class="px-2 w-full object-top max-h-64 object-cover" />
                        <div
                            v-else
                            class="w-full grid place-items-center text-muted-foreground text-sm"
                        >
                            No image
                        </div>
                    </div>
                    <div class="p-3 space-y-1">
                        <div class="font-semibold leading-tight line-clamp-2">
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
                                class="rounded bg-accent/30 text-[11px] px-1.5 py-0.5 text-muted-foreground"
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
            <div v-else class="text-sm text-muted-foreground">
                Enter a query to search for cards.
            </div>
        </template>
        <AuthSignInBlock title="Search results" description="Sign in to browse card search results." />
    </div>
</template>
