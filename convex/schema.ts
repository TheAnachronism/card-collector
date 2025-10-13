import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const cardSetSchema = v.object({
  name: v.string(),
  setCode: v.string(),
  setRarity: v.string(),
  setRarityCode: v.string(),
});

export default defineSchema({
  cards: defineTable({
    name: v.string(),
    type: v.string(),
    frameType: v.string(),
    description: v.string(),
    atk: v.number(),
    def: v.number(),
    level: v.number(),
    race: v.string(),
    attribute: v.string(),
    cardSets: cardSetSchema,
  }),
  collectionsCard: defineTable({
    card: v.id("cards"),
    quantity: v.number(),
    box: v.optional(v.id("boxes")),
  }),
  collections: defineTable({
    name: v.string(),
    cards: v.array(v.id("collectionsCard")),
  }),
  boxes: defineTable({
    name: v.string(),
    cards: v.array(v.id("collectionsCard")),
  }),
});
