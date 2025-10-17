import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import {
    YGOProDeckCardSchema,
    type YGOProDeckCard,
    type YGOProDeckCardSet,
    type YGOProDeckCardImage,
} from "./responses/YGOProDeckResponses";
import { fixSetCode } from "./lib/cardUtils";

export const findCardBySetCode = internalQuery({
    args: { setCode: v.string() },
    handler: async (ctx, { setCode }) => {
        setCode = fixSetCode(setCode);
        const cardSet = await ctx.db
            .query("cardSets")
            .withIndex("setCode", (q) => q.eq("setCode", setCode))
            .first();

        if (!cardSet) {
            return null;
        }
        const card = await ctx.db.get(cardSet.cardId);

        if (!card) {
            return null;
        }

        const cardSets = await ctx.db
            .query("cardSets")
            .withIndex("cardId", (q) => q.eq("cardId", card._id))
            .collect();

        return {
            ...card,
            cardSets: cardSets,
        };
    },
});

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
                cardImages: cardImages,
            };

            let cardId: Id<"cards">;

            if (existing) {
                await ctx.db.patch(existing._id, doc);
                cardId = existing._id;
            } else {
                cardId = await ctx.db.insert("cards", doc);
            }

            const existingCardSets = await ctx.db
                .query("cardSets")
                .withIndex("cardId", (q) => q.eq("cardId", cardId))
                .collect();

            const existingCardSetCodes = new Set(
                existingCardSets.map((s) => s.setCode),
            );

            const cardSetDocs = cardSets
                .filter((s) => !existingCardSetCodes.has(s.setCode))
                .map((s) => ({
                    cardId,
                    name: s.name,
                    setCode: s.setCode,
                    setRarity: s.setRarity,
                    setRarityCode: s.setRarityCode,
                }));

            for (const s of cardSetDocs) {
                await ctx.db.insert("cardSets", s);
            }
        }
    },
});

// Convenience: server-side search by set code (fetch + upsert + return)
export const searchBySetCode = action({
    args: { setCode: v.string() },
    handler: async (
        ctx,
        { setCode },
    ): Promise<
        {
            id: number;
            name: string;
            type: string;
            frameType: string;
            race: string | undefined;
            attribute: string | null;
            card_sets: YGOProDeckCardSet[];
            card_images: YGOProDeckCardImage[];
        }[]
    > => {
        const dbCard = await ctx.runQuery(internal.cards.findCardBySetCode, {
            setCode,
        });

        if (dbCard) {
            return [
                {
                    id: dbCard.ygoId,
                    name: dbCard.name,
                    type: dbCard.type,
                    frameType: dbCard.frameType,
                    race: dbCard.race,
                    attribute: dbCard.attribute ?? null,
                    card_sets: dbCard.cardSets.map((s) => ({
                        set_name: s.name,
                        set_code: s.setCode,
                        set_price: s.setRarity,
                        set_rarity: s.setRarity,
                        set_rarity_code: s.setRarityCode,
                    })),
                    card_images: dbCard.cardImages.map((i) => ({
                        id: i.id,
                        image_url: i.imageUrl,
                        image_url_small: i.imageUrlSmall,
                        image_url_cropped: i.imageUrlCropped,
                    })),
                },
            ];
        }

        const setCodeCard = await ctx.runAction(
            internal.YGOProDeck.fetchBySetCode,
            {
                setCode,
            },
        );

        if (!setCodeCard) {
            return [];
        }

        const fullCardInfos = (await ctx.runAction(
            internal.YGOProDeck.fetchFullCardInfoById,
            {
                id: setCodeCard.id,
            },
        )) as YGOProDeckCard[];

        if (!fullCardInfos) {
            return [];
        }

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
    handler: async (ctx, { name }): Promise<YGOProDeckCard[]> => {
        const fullCardInfos = await ctx.runAction(
            internal.YGOProDeck.fetchByCardName,
            {
                name,
            },
        );

        if (!fullCardInfos) {
            return [];
        }

        await ctx.runMutation(internal.cards.upsertCards, {
            cards: fullCardInfos,
        });
        return fullCardInfos;
    },
});
