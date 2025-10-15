import { v, type Infer } from "convex/values";

export const YGOProDeckCardSetSchema = v.object({
    set_name: v.string(),
    set_code: v.string(),
    set_price: v.string(),
    set_rarity: v.string(),
    set_rarity_code: v.string(),
});

export type YGOProDeckCardSet = Infer<typeof YGOProDeckCardSetSchema>;

const YGOProDeckCardPricesSchema = v.object({
    amazon_price: v.string(),
    cardmarket_price: v.string(),
    coolstuffinc_price: v.string(),
    ebay_price: v.string(),
    tcgplayer_price: v.string(),
});

const YGOProDeckBanlistInfoSchema = v.object({
    ban_goat: v.union(v.literal("Forbidden"), v.literal("Limited"), v.literal("Semi-Limited")),
    ban_ocg: v.union(v.literal("Forbidden"), v.literal("Limited"), v.literal("Semi-Limited")),
    ban_tcg: v.union(v.literal("Forbidden"), v.literal("Limited"), v.literal("Semi-Limited")),
})

export const YGOProDeckCardSchema = v.object({
    id: v.number(),
    name: v.string(),
    type: v.string(),
    frameType: v.string(),
    desc: v.string(),
    atk: v.optional(v.number()),
    def: v.optional(v.number()),
    level: v.optional(v.number()),
    race: v.optional(v.string()),
    archetype: v.optional(v.string()),
    attribute: v.optional(v.string()),
    linkval: v.optional(v.number()),
    typeline: v.optional(v.array(v.string())),
    ygoprodeck_url: v.optional(v.string()),
    humanReadableCardType: v.optional(v.string()),
    banlist_info: v.optional(YGOProDeckBanlistInfoSchema),
    card_sets: v.array(YGOProDeckCardSetSchema),
    card_prices: v.optional(v.array(YGOProDeckCardPricesSchema)),
    card_images: v.array(
        v.object({
            id: v.number(),
            image_url: v.string(),
            image_url_small: v.string(),
            image_url_cropped: v.string(),
        }),
    ),
});

export type YGOProDeckCard = Infer<typeof YGOProDeckCardSchema>;

export const YGOProDeckCardSetInfoSchema = v.object({
    id: v.number(),
    name: v.string(),
    set_name: v.string(),
    set_rarity: v.string(),
});

export type YGOProDeckCardSetInfo = Infer<typeof YGOProDeckCardSetInfoSchema>;