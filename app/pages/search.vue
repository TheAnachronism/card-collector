<script setup lang="ts">
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
    const pattern = /^[A-Z0-9]{2,6}-[A-Z]{1,4}[A-Z]+[0-9]+$/;
    console.log("isLikelySetCode", v, hasDash, hasDigit, pattern.test(v));
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
            console.log("searchBySetCode", q);
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
        <SearchCards />
        <AuthSignInBlock
            title="Search results"
            description="Sign in to browse card search results."
        />
    </div>
</template>
