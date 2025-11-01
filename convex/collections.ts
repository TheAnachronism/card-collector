import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUser } from "./auth";
import type { Id } from "./_generated/dataModel";
import { fixSetCode } from "./lib/cardUtils";

// List collections for the current authenticated user
export const listForUser = query({
    args: {},
    handler: async (ctx) => {
        const user = await getUser(ctx);
        return await ctx.db
            .query("collections")
            .withIndex("userId", (q) => q.eq("userId", user._id.toString()))
            .collect();
    },
});

// Create a new collection for the current user
export const create = mutation({
    args: { name: v.string() },
    handler: async (ctx, { name }) => {
        const user = await getUser(ctx);
        const id = await ctx.db.insert("collections", {
            userId: user._id.toString(),
            name,
            cards: [],
        });
        return id;
    },
});

// Get a specific collection by id (ensuring it belongs to current user)
export const getById = query({
    args: { id: v.id("collections") },
    handler: async (ctx, { id }) => {
        const user = await getUser(ctx);
        const doc = await ctx.db.get(id);
        if (!doc || doc.userId !== user._id.toString()) return null;

        // Fetch all collection cards with their details
        const collectionCards = await Promise.all(
            doc.cards.map(async (ccId) => {
                const cc = await ctx.db.get(ccId);
                if (!cc) return null;

                const ownedCard = await ctx.db.get(cc.card);
                if (!ownedCard) return null;

                const card = await ctx.db.get(ownedCard.card);
                if (!card) return null;

                return {
                    _id: ccId,
                    quantity: cc.quantity,
                    setCode: cc.setCode,
                    card: {
                        _id: card._id,
                        name: card.name,
                        ygoId: card.ygoId,
                        type: card.type,
                        race: card.race,
                        attribute: card.attribute,
                        cardImages: card.cardImages,
                    },
                };
            }),
        );

        return {
            ...doc,
            collectionCards: collectionCards.filter((cc) => cc !== null),
        };
    },
});

// Add a card to a collection
export const addCard = mutation({
    args: {
        collectionId: v.id("collections"),
        ygoId: v.number(),
        setCode: v.string(),
        quantity: v.number(),
    },
    handler: async (ctx, { collectionId, ygoId, setCode, quantity }) => {
        const user = await getUser(ctx);

        // Verify collection belongs to user
        const collection = await ctx.db.get(collectionId);
        if (!collection || collection.userId !== user._id.toString()) {
            throw new Error("Collection not found or access denied");
        }

        // Find the card by ygoId
        const card = await ctx.db
            .query("cards")
            .withIndex("ygoId", (q) => q.eq("ygoId", ygoId))
            .first();

        if (!card) {
            throw new Error("Card not found");
        }

        // Normalize set code
        const normalizedSetCode = fixSetCode(setCode);

        // Find or create an ownedCard for this user and card
        let ownedCard = await ctx.db
            .query("ownedCards")
            .withIndex("userId", (q) => q.eq("userId", user._id.toString()))
            .filter((q) => q.eq(q.field("card"), card._id))
            .filter((q) => q.eq(q.field("collection"), collectionId))
            .first()
            .then((result) => result?._id);

        if (!ownedCard) {
            ownedCard = await ctx.db.insert("ownedCards", {
                userId: user._id.toString(),
                card: card._id,
                collection: collectionId,
            });
        }

        // Create a collectionsCard entry
        const collectionsCardId = await ctx.db.insert("collectionsCard", {
            card: ownedCard,
            quantity,
            setCode: normalizedSetCode,
        });

        // Add to collection's cards array
        await ctx.db.patch(collectionId, {
            cards: [...collection.cards, collectionsCardId],
        });

        return collectionsCardId;
    },
});

// Update quantity of a collection card
export const updateCollectionCardQuantity = mutation({
    args: {
        collectionCardId: v.id("collectionsCard"),
        change: v.number(), // Can be positive (increase), negative (decrease), or 0 for absolute set
        absoluteValue: v.optional(v.number()), // If provided, set to this absolute value
    },
    handler: async (ctx, { collectionCardId, change, absoluteValue }) => {
        const user = await getUser(ctx);
        const collectionCard = await ctx.db.get(collectionCardId);
        if (!collectionCard) {
            throw new Error("Collection card not found");
        }

        // Verify ownership through the ownedCard -> collection chain
        const ownedCard = await ctx.db.get(collectionCard.card);
        if (!ownedCard) {
            throw new Error("Owned card not found");
        }

        const collection = await ctx.db.get(ownedCard.collection!);
        if (!collection || collection.userId !== user._id.toString()) {
            throw new Error("Collection not found or access denied");
        }

        let newQuantity: number;
        if (absoluteValue !== undefined) {
            newQuantity = Math.max(0, absoluteValue);
        } else {
            newQuantity = Math.max(0, collectionCard.quantity + change);
        }

        if (newQuantity === 0) {
            // Remove the card from collection
            await ctx.db.patch(collection._id, {
                cards: collection.cards.filter((id) => id !== collectionCardId),
            });
            await ctx.db.delete(collectionCardId);
            return null;
        } else {
            await ctx.db.patch(collectionCardId, {
                quantity: newQuantity,
            });
            return newQuantity;
        }
    },
});

// Remove a collection card entirely
export const removeCollectionCard = mutation({
    args: { collectionCardId: v.id("collectionsCard") },
    handler: async (ctx, { collectionCardId }) => {
        const user = await getUser(ctx);
        const collectionCard = await ctx.db.get(collectionCardId);
        if (!collectionCard) {
            throw new Error("Collection card not found");
        }

        // Verify ownership through the ownedCard -> collection chain
        const ownedCard = await ctx.db.get(collectionCard.card);
        if (!ownedCard) {
            throw new Error("Owned card not found");
        }

        const collection = await ctx.db.get(ownedCard.collection!);
        if (!collection || collection.userId !== user._id.toString()) {
            throw new Error("Collection not found or access denied");
        }

        // Remove from collection's cards array
        await ctx.db.patch(collection._id, {
            cards: collection.cards.filter((id) => id !== collectionCardId),
        });

        // Delete the collection card
        await ctx.db.delete(collectionCardId);
        return null;
    },
});

// Delete a collection (and clean up its collection card refs) if owned by current user
export const remove = mutation({
    args: { id: v.id("collections") },
    handler: async (ctx, { id }) => {
        const user = await getUser(ctx);
        const existing = await ctx.db.get(id);
        if (!existing || existing.userId !== user._id.toString()) {
            return null;
        }
        // Best-effort cleanup of referenced collection card documents
        for (const ccId of existing.cards ?? []) {
            await ctx.db.delete(ccId);
        }
        await ctx.db.delete(id);
        return null;
    },
});
