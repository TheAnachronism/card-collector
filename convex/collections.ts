import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getUser } from "./auth";

// List collections for the current authenticated user
export const listForUser = query({
    args: {},
    handler: async (ctx) => {
        const user = await getUser(ctx);
        return await ctx.db
            .query("collections")
            .filter((q) => q.eq(q.field("user"), user._id))
            .collect();
    },
});

// Create a new collection for the current user
export const create = mutation({
    args: { name: v.string() },
    handler: async (ctx, { name }) => {
        const user = await getUser(ctx);
        const id = await ctx.db.insert("collections", {
            user: user._id,
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
        if (!doc || doc.user !== user._id) return null;
        return doc;
    },
});

// Delete a collection (and clean up its collection card refs) if owned by current user
export const remove = mutation({
    args: { id: v.id("collections") },
    handler: async (ctx, { id }) => {
        const user = await getUser(ctx);
        const existing = await ctx.db.get(id);
        if (!existing || existing.user !== user._id) {
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
