import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import type { YGOProDeckCardSetInfo, YGOProDeckCard } from "./responses/YGOProDeckResponses";

const YGOProDeckCardSetInfoEndpoint =
    "https://db.ygoprodeck.com/api/v7/cardsetsinfo.php";
const YGOProDeckCardInfoEndpoint =
    "https://db.ygoprodeck.com/api/v7/cardinfo.php";

export const fetchBySetCode = internalAction({
    args: { setCode: v.string() },
    handler: async (ctx, { setCode }): Promise<YGOProDeckCardSetInfo> => {
        // Replace the two-letter code with 'EN'
        setCode = setCode.replace(/-(?:[A-Z]{2})(\d{3,})$/, "-EN$1");
        const url = `${YGOProDeckCardSetInfoEndpoint}?setcode=${encodeURIComponent(
            setCode,
        )}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
            throw new Error(`YGOProDeck error ${res.status}`);
        }
        const body = (await res.json()) as YGOProDeckCardSetInfo;
        return body;
    },
});

export const fetchFullCardInfoById = internalAction({
    args: { id: v.number() },
    handler: async (ctx, { id }) => {
        const url = `${YGOProDeckCardInfoEndpoint}?id=${id}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
            throw new Error(`YGOProDeck error ${res.status}`);
        }
        const body = (await res.json()) as { data: YGOProDeckCard[] };
        return body.data;
    },
});

export const fetchByCardName = internalAction({
    args: { name: v.string() },
    handler: async (ctx, { name }) => {
        const url = `${YGOProDeckCardInfoEndpoint}?name=${name}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
            throw new Error(`YGOProDeck error ${res.status}`);
        }
        const body = (await res.json()) as { data: YGOProDeckCard[] };
        return body.data;
    },
});