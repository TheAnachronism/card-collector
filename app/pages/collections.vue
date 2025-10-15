<script setup lang="ts">
import { ref } from "vue";
import type { ConvexClient } from "convex/browser";
import type { FunctionReference } from "convex/server";
import { api as apiUntyped } from "~~/convex/_generated/api";
import type { YGOProDeckCard } from "~~/convex/responses/YGOProDeckResponses";

const client = useConvexClient() as unknown as ConvexClient;
// Extend generated api with our new module to keep types strict before regen
type AppApi = typeof apiUntyped & {
    cards: {
        searchBySetCode: FunctionReference<
            "action",
            "public",
            { setCode: string },
            YGOProDeckCard[]
        >;
    };
};
const api = apiUntyped as AppApi;

const setCode = ref("");
const results = ref<YGOProDeckCard[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);

async function onSearch() {
    error.value = null;
    isLoading.value = true;
    try {
        const res = await client.action(api.cards.searchBySetCode, {
            setCode: setCode.value.trim(),
        });
        results.value = (res ?? []) as YGOProDeckCard[];
    } catch (e: unknown) {
        error.value = e instanceof Error ? e.message : "Search failed";
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
                    Welcome back
                </h1>
                <p class="text-sm">Manage your Yugioh collection and decks.</p>
            </div>
        </div>

        <Card class="glass p-4 space-y-3">
            <h2 class="text-sm font-medium">Search cards by set code</h2>
            <div class="flex gap-2">
                <Input
                    v-model="setCode"
                    placeholder="e.g. MRD-EN000"
                    class="flex-1"
                />
                <Button :disabled="!setCode || isLoading" @click="onSearch">
                    {{ isLoading ? "Searching…" : "Search" }}
                </Button>
            </div>
            <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
            <div v-if="results.length" class="space-y-2">
                <div
                    v-for="card in results"
                    :key="card.id"
                    class="rounded border p-3"
                >
                    <div class="font-medium">{{ card.name }}</div>
                    <div
                        v-if="card.card_sets?.length"
                        class="text-xs text-muted-foreground"
                    >
                        Sets:
                        {{ card.card_sets.map((s) => s.set_code).join(", ") }}
                    </div>
                </div>
            </div>
            <p v-else class="text-sm text-muted-foreground">No results</p>
        </Card>
    </div>
</template>
