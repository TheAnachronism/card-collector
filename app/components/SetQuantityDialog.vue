<script setup lang="ts">
import type { ConvexClient } from "convex/browser";
import { api } from "~~/convex/_generated/api";
import type { Id } from "~~/convex/_generated/dataModel";

const props = defineProps<{
    open: boolean;
    collectionCardId: Id<"collectionsCard"> | null;
    currentQuantity: number;
    cardName: string;
    setCode: string;
}>();

const emit = defineEmits<{
    "update:open": [value: boolean];
    updated: [];
}>();

const client = useConvexClient() as unknown as ConvexClient;
const quantity = ref(props.currentQuantity);
const isLoading = ref(false);
const error = ref<string | null>(null);

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit("update:open", value),
});

watch(() => props.open, (newValue) => {
    if (newValue) {
        quantity.value = props.currentQuantity;
        error.value = null;
    }
});

watch(() => props.currentQuantity, (newValue) => {
    if (props.open) {
        quantity.value = newValue;
    }
});

async function onSave() {
    if (!props.collectionCardId || quantity.value < 0) return;

    isLoading.value = true;
    error.value = null;

    try {
        await client.mutation(api.collections.updateCollectionCardQuantity, {
            collectionCardId: props.collectionCardId,
            change: 0,
            absoluteValue: quantity.value,
        });

        emit("updated");
        isOpen.value = false;
    } catch (e: unknown) {
        error.value =
            e instanceof Error ? e.message : "Failed to update quantity";
    } finally {
        isLoading.value = false;
    }
}

function onClose() {
    isOpen.value = false;
    error.value = null;
}
</script>

<template>
    <Dialog v-model:open="isOpen" @close="onClose">
        <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Set Quantity</DialogTitle>
                <DialogDescription>
                    Set the quantity for this card in your collection.
                </DialogDescription>
            </DialogHeader>

            <div class="space-y-4 py-4">
                <div class="space-y-2">
                    <div class="font-semibold">{{ cardName }}</div>
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
                        min="0"
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
                    @click="onSave"
                    :disabled="isLoading || !collectionCardId || quantity < 0"
                >
                    {{ isLoading ? "Saving…" : "Save" }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>

