import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
        cardImages: v.array(cardImageSchema),
    }).index("ygoId", ["ygoId"]),
    cardSets: defineTable({
        cardId: v.id("cards"),
        name: v.string(),
        setCode: v.string(),
        setRarity: v.string(),
        setRarityCode: v.string(),
    })
        .index("cardId", ["cardId"])
        .index("setCode", ["setCode"]),
    ownedCards: defineTable({
        userId: v.string(),
        card: v.id("cards"),
        box: v.optional(v.id("boxes")),
        collection: v.optional(v.id("collections")),
    })
        .index("userId", ["userId"])
        .index("card", ["card"]),
    collectionsCard: defineTable({
        card: v.id("ownedCards"),
        quantity: v.number(),
    }).index("card", ["card"]),
    collections: defineTable({
        userId: v.string(),
        name: v.string(),
        cards: v.array(v.id("collectionsCard")),
    }).index("userId", ["userId"]),
    decks: defineTable({
        userId: v.string(),
        name: v.string(),
        cards: v.array(v.id("ownedCards")),
    }).index("userId", ["userId"]),
    boxes: defineTable({
        userId: v.string(),
        name: v.string(),
        cards: v.array(v.id("ownedCards")),
    }).index("userId", ["userId"]),
});
