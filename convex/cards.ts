import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import {
    YGOProDeckCardSchema,
    type YGOProDeckCard,
    type YGOProDeckCardSetInfo,
} from "./responses/YGOProDeckResponses";

// Upsert minimal card records into `cards`
export const upsertCards = internalMutation({
    args: { cards: v.array(YGOProDeckCardSchema) },
    handler: async (ctx, { cards }) => {
        for (const c of cards) {
            const ygoId: number = c.id;
            const existing = await ctx.db
                .query("cards")
                .withIndex("ygoId", (q) => q.eq("ygoId", ygoId))
                .first();

            const cardSets = Array.isArray(c.card_sets)
                ? c.card_sets.map((s) => ({
                      name: s.set_name,
                      setCode: s.set_code,
                      setRarity: s.set_rarity,
                      setRarityCode: s.set_rarity_code ?? "",
                  }))
                : [];

            const cardImages = Array.isArray(c.card_images)
                ? c.card_images.map((i) => ({
                      id: i.id,
                      imageUrl: i.image_url,
                      imageUrlSmall: i.image_url_small,
                      imageUrlCropped: i.image_url_cropped,
                  }))
                : [];

            const doc = {
                ygoId,
                name: c.name as string,
                type: c.type as string,
                frameType: c.frameType as string,
                description: (c.desc as string) ?? "",
                atk: c.atk ?? undefined,
                def: c.def ?? undefined,
                level: c.level ?? c.linkval ?? undefined,
                race: c.race as string,
                attribute: c.attribute ?? undefined,
                cardSets: cardSets,
                cardImages: cardImages,
            };

            if (existing) {
                await ctx.db.patch(existing._id, doc);
            } else {
                await ctx.db.insert("cards", doc);
            }
        }
    },
});

// Convenience: server-side search by set code (fetch + upsert + return)
export const searchBySetCode = action({
    args: { setCode: v.string() },
    handler: async (ctx, { setCode }) => {
        const setCodeCard = (await ctx.runAction(
            internal.YGOProDeck.fetchBySetCode,
            {
                setCode,
            },
        )) as YGOProDeckCardSetInfo;

        const fullCardInfos = (await ctx.runAction(
            internal.YGOProDeck.fetchFullCardInfoById,
            {
                id: setCodeCard.id,
            },
        )) as YGOProDeckCard[];

        await ctx.runMutation(internal.cards.upsertCards, {
            cards: fullCardInfos,
        });
        // Return minimal view the client can render immediately
        return fullCardInfos.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            frameType: c.frameType,
            race: c.race,
            attribute: c.attribute ?? null,
            card_sets: c.card_sets ?? [],
            card_images: c.card_images ?? [],
        }));
    },
});

export const searchByCardName = action({
    args: { name: v.string() },
    handler: async (ctx, { name }) => {
        const fullCardInfos = (await ctx.runAction(
            internal.YGOProDeck.fetchByCardName,
            {
                name,
            },
        )) as YGOProDeckCard[];
        await ctx.runMutation(internal.cards.upsertCards, {
            cards: fullCardInfos,
        });
        return fullCardInfos;
    },
});
