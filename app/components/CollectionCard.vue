<script setup lang="ts">
import type { Id } from "~~/convex/_generated/dataModel";

interface Collection {
    _id: Id<"collections">;
    name: string;
    cards: string[]; // array of collectionCard ids
}

const props = defineProps<{
    collection: Collection;
    onDelete: (id: Id<"collections">) => void;
}>();

const cardCount = computed(() => props.collection.cards.length);
</script>

<template>
    <Card
        class="flex flex-col justify-between rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200"
    >
        <CardHeader class="pb-2">
            <CardTitle class="text-lg font-semibold truncate">
                {{ collection.name }}
            </CardTitle>
        </CardHeader>

        <CardContent class="text-sm text-muted-foreground">
            {{ cardCount }} card{{ cardCount === 1 ? "" : "s" }}
        </CardContent>

        <CardFooter class="pt-2 flex items-center justify-between">
            <NuxtLink
                :to="`/collections/${collection._id}`"
                class="inline-flex items-center px-5 py-1.5 border border-input rounded-md text-sm font-medium bg-background hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
                View Collection
            </NuxtLink>
            <Button
                variant="ghost"
                size="icon"
                class="text-red-500 hover:text-red-600"
                @click="onDelete(collection._id)"
            >
                <IconTrash2 class="w-4 h-4" />
            </Button>
        </CardFooter>
    </Card>
</template>
