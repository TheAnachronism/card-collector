<script setup lang="ts">
import useSearchDialog from "@/composables/useSearchDialog";
import type { Id } from "~~/convex/_generated/dataModel";

const searchDialog = useSearchDialog();

const collectionId = computed(() => {
    return searchDialog.props.value?.collectionId as
        | Id<"collections">
        | undefined;
});
</script>

<template>
    <Dialog
        v-model:open="searchDialog.isOpen.value"
        @close="searchDialog.close"
    >
        <DialogContent
            class="w-full max-w-[min(100vw-1.5rem,56rem)] lg:min-w-4xl overflow-hidden rounded-lg p-4 sm:p-6 lg:p-8"
        >
            <DialogHeader>
                <DialogTitle>Search Cards</DialogTitle>
                <DialogDescription>
                    {{
                        collectionId
                            ? "Search for cards by set code to add to your collection."
                            : "Search for cards by name or set code."
                    }}
                </DialogDescription>
            </DialogHeader>

            <SearchCards
                :collection-id="collectionId"
                @card-added="searchDialog.close"
            />
        </DialogContent>
    </Dialog>
</template>
