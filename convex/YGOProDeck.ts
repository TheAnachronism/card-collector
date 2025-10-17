import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import type {
    YGOProDeckCardSetInfo,
    YGOProDeckCard,
} from "./responses/YGOProDeckResponses";
import { fixSetCode } from "./lib/cardUtils";

const YGOProDeckCardSetInfoEndpoint =
    "https://db.ygoprodeck.com/api/v7/cardsetsinfo.php";
const YGOProDeckCardInfoEndpoint =
    "https://db.ygoprodeck.com/api/v7/cardinfo.php";

export const fetchBySetCode = internalAction({
    args: { setCode: v.string() },
    handler: async (
        ctx,
        { setCode },
    ): Promise<YGOProDeckCardSetInfo | null> => {
        // Replace the two-letter code with 'EN'
        setCode = fixSetCode(setCode);
        const url = `${YGOProDeckCardSetInfoEndpoint}?setcode=${encodeURIComponent(
            setCode,
        )}`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.status === 400) {
            return null;
        }
        if (!res.ok) {
            throw new Error(`YGOProDeck error ${res.status}`);
        }
        const body = (await res.json()) as YGOProDeckCardSetInfo;
        return body;
    },
});

export const fetchFullCardInfoById = internalAction({
    args: { id: v.number() },
    handler: async (ctx, { id }): Promise<YGOProDeckCard[]> => {
        const url = `${YGOProDeckCardInfoEndpoint}?id=${id}`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.status === 400) {
            return [];
        }
        if (!res.ok) {
            throw new Error(`YGOProDeck error ${res.status}`);
        }
        const body = (await res.json()) as { data: YGOProDeckCard[] };
        for (const card of body.data) {
            card.def = card.def && card.def > 0 ? card.def : undefined;
        }
        return body.data;
    },
});

export const fetchByCardName = internalAction({
    args: { name: v.string() },
    handler: async (ctx, { name }): Promise<YGOProDeckCard[]> => {
        const url = `${YGOProDeckCardInfoEndpoint}?fname=${name}`;
        const res = await fetch(url, { cache: "no-store" });
        if (res.status === 400) {
            return [];
        }
        if (!res.ok) {
            throw new Error(`YGOProDeck error ${res.status}`);
        }
        const body = (await res.json()) as { data: YGOProDeckCard[] };
        return fixNullValues(body.data);
    },
});

function fixNullValues(cards: YGOProDeckCard[]): YGOProDeckCard[] {
    for (const card of cards) {
        if (!card.def) {
            card.def = undefined;
        }
    }

    return cards;
}
