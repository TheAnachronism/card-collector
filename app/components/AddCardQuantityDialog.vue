<script setup lang="ts">
import type { ConvexClient } from "convex/browser";
import { api } from "~~/convex/_generated/api";
import type { Id } from "~~/convex/_generated/dataModel";
import type { YGOProDeckCard } from "~~/convex/responses/YGOProDeckResponses";

const props = defineProps<{
    open: boolean;
    card: YGOProDeckCard | null;
    collectionId: Id<"collections">;
    setCode: string;
}>();

const emit = defineEmits<{
    "update:open": [value: boolean];
    added: [];
}>();

const client = useConvexClient() as unknown as ConvexClient;
const quantity = ref(1);
const isLoading = ref(false);
const error = ref<string | null>(null);

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit("update:open", value),
});

async function onAdd() {
    if (!props.card || quantity.value < 1) return;

    isLoading.value = true;
    error.value = null;

    try {
        await client.mutation(api.collections.addCard, {
            collectionId: props.collectionId,
            ygoId: props.card.id,
            setCode: props.setCode,
            quantity: quantity.value,
        });

        emit("added");
        isOpen.value = false;
        quantity.value = 1;
    } catch (e: unknown) {
        error.value =
            e instanceof Error ? e.message : "Failed to add card to collection";
    } finally {
        isLoading.value = false;
    }
}

function onClose() {
    isOpen.value = false;
    quantity.value = 1;
    error.value = null;
}
</script>

<template>
    <Dialog v-model:open="isOpen" @close="onClose">
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Add Card to Collection</DialogTitle>
                <DialogDescription>
                    Specify the quantity of this card to add to your collection.
                </DialogDescription>
            </DialogHeader>

            <div v-if="card" class="space-y-4 py-4">
                <div class="space-y-2">
                    <div class="font-semibold">{{ card.name }}</div>
                    <div class="text-sm text-muted-foreground">
                        Set Code: {{ setCode }}
                    </div>
                </div>

                <div class="space-y-2">
                    <label for="quantity" class="text-sm font-medium">
                        Quantity
                    </label>
                    <Input
                        id="quantity"
                        v-model.number="quantity"
                        type="number"
                        min="1"
                        class="w-full"
                        :disabled="isLoading"
                    />
                </div>

                <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
            </div>

            <DialogFooter>
                <Button variant="outline" @click="onClose" :disabled="isLoading">
                    Cancel
                </Button>
                <Button
                    @click="onAdd"
                    :disabled="isLoading || !card || quantity < 1"
                >
                    {{ isLoading ? "Adding…" : "Add Card" }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

