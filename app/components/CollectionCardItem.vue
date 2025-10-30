<script setup lang="ts">
import type { Id } from "~~/convex/_generated/dataModel";

interface CollectionCardData {
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
}

const props = defineProps<{
    collectionCard: CollectionCardData;
}>();

function firstImage(): string | null {
    const img = props.collectionCard.card.cardImages?.[0];
    return img?.imageUrlSmall ?? img?.imageUrl ?? null;
}
</script>

<template>
    <Card class="overflow-hidden glass">
        <div class="relative bg-muted/40">
            <NuxtImg
                v-if="firstImage()"
                :src="firstImage()!"
                :alt="collectionCard.card.name"
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
                {{ collectionCard.card.name }}
            </div>
            <div class="text-xs font-medium text-muted-foreground">
                {{ collectionCard.setCode }}
            </div>
            <div class="text-xs text-muted-foreground">
                {{ collectionCard.card.type }} •
                {{ collectionCard.card.race || collectionCard.card.attribute || "N/A" }}
            </div>
            <div class="mt-2 flex items-center justify-end">
                <span class="text-xs text-muted-foreground">
                    Qty: {{ collectionCard.quantity }}
                </span>
            </div>
        </div>
    </Card>
</template>

