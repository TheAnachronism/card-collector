<script setup lang="ts">
import type { ConvexClient } from "convex/browser";
import { api } from "~~/convex/_generated/api";
import type { Id } from "~~/convex/_generated/dataModel";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import SetQuantityDialog from "@/components/SetQuantityDialog.vue";

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

const emit = defineEmits<{
    updated: [];
}>();

const client = useConvexClient() as unknown as ConvexClient;
const isSetQuantityDialogOpen = ref(false);
const isLoading = ref(false);

function firstImage(): string | null {
    const img = props.collectionCard.card.cardImages?.[0];
    return img?.imageUrlSmall ?? img?.imageUrl ?? null;
}

async function updateQuantity(change: number) {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
        await client.mutation(api.collections.updateCollectionCardQuantity, {
            collectionCardId: props.collectionCard._id,
            change,
        });
        emit("updated");
    } catch (e: unknown) {
        console.error("Failed to update quantity:", e);
    } finally {
        isLoading.value = false;
    }
}

async function increaseQuantity() {
    await updateQuantity(1);
}

async function decreaseQuantity() {
    await updateQuantity(-1);
}

function openSetQuantityDialog() {
    isSetQuantityDialogOpen.value = true;
}

async function removeCard() {
    if (!confirm("Remove this card from the collection?")) return;
    if (isLoading.value) return;
    isLoading.value = true;
    try {
        await client.mutation(api.collections.removeCollectionCard, {
            collectionCardId: props.collectionCard._id,
        });
        emit("updated");
    } catch (e: unknown) {
        console.error("Failed to remove card:", e);
    } finally {
        isLoading.value = false;
    }
}

function onQuantityUpdated() {
    emit("updated");
}
</script>

<template>
    <ContextMenu>
        <ContextMenuTrigger as-child>
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
                    <div
                        class="absolute top-2 right-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded-md backdrop-blur-sm"
                    >
                        Qty: {{ collectionCard.quantity }}
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
                </div>
            </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
            <ContextMenuItem @click="increaseQuantity" :disabled="isLoading">
                <IconPlus class="w-4 h-4" />
                Increase Quantity
            </ContextMenuItem>
            <ContextMenuItem
                @click="decreaseQuantity"
                :disabled="isLoading || collectionCard.quantity <= 0"
            >
                <IconMinus class="w-4 h-4" />
                Decrease Quantity
            </ContextMenuItem>
            <ContextMenuItem @click="openSetQuantityDialog" :disabled="isLoading">
                <IconEdit class="w-4 h-4" />
                Set Quantity
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
                @click="removeCard"
                variant="destructive"
                :disabled="isLoading"
            >
                <IconTrash2 class="w-4 h-4" />
                Remove Card
            </ContextMenuItem>
        </ContextMenuContent>
    </ContextMenu>

    <SetQuantityDialog
        v-model:open="isSetQuantityDialogOpen"
        :collection-card-id="collectionCard._id"
        :current-quantity="collectionCard.quantity"
        :card-name="collectionCard.card.name"
        :set-code="collectionCard.setCode"
        @updated="onQuantityUpdated"
    />
</template>

