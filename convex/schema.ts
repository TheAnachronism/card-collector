import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const cardSetSchema = v.object({
    name: v.string(),
    setCode: v.string(),
    setRarity: v.string(),
    setRarityCode: v.string(),
});

const cardImageSchema = v.object({
    id: v.number(),
    imageUrl: v.string(),
    imageUrlSmall: v.string(),
    imageUrlCropped: v.string(),
});

export default defineSchema({
    cards: defineTable({
        ygoId: v.number(),
        name: v.string(),
        type: v.string(),
        frameType: v.string(),
        description: v.string(),
        atk: v.optional(v.number()),
        def: v.optional(v.number()),
        level: v.optional(v.number()),
        race: v.string(),
        attribute: v.optional(v.string()),
        cardSets: v.array(cardSetSchema),
        cardImages: v.array(cardImageSchema),
    }).index("ygoId", ["ygoId"]),
    ownedCards: defineTable({
        user: v.id("user"),
        card: v.id("cards"),
        box: v.optional(v.id("boxes")),
        collection: v.optional(v.id("collections")),
    }),
    collectionsCard: defineTable({
        card: v.id("ownedCards"),
        quantity: v.number(),
    }),
    collections: defineTable({
        user: v.id("user"),
        name: v.string(),
        cards: v.array(v.id("collectionsCard")),
    }),
    decks: defineTable({
        user: v.id("user"),
        name: v.string(),
        cards: v.array(v.id("ownedCards")),
    }),
    boxes: defineTable({
        user: v.id("user"),
        name: v.string(),
        cards: v.array(v.id("ownedCards")),
    }),
});
