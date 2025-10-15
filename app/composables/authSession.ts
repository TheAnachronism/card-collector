import type { authClient as AuthClientType } from "@/lib/auth-client";

function decodeJwtExp(token: string): number | null {
    try {
        const parts = token.split(".");
        if (parts.length < 2 || !parts[1]) return null;
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = atob(base64);
        const payload = JSON.parse(json) as { exp?: number };
        return typeof payload.exp === "number" ? payload.exp : null;
    } catch {
        return null;
    }
}

export function isConvexJwtFresh(
    cookieHeader?: string,
    skewMs = 5000,
): boolean {
    if (!cookieHeader) return false;
    const match = /better-auth\.convex_jwt=([^;]+)/.exec(cookieHeader);
    if (!match) return false;
    const jwt = match[1]!;
    const exp = decodeJwtExp(jwt);
    if (!exp) return false;
    return Date.now() < exp * 1000 - skewMs;
}

export function createBetterAuthHydrator(authClient: typeof AuthClientType) {
    let inFlightGetSession: Promise<void> | null = null;
    let lastHydrateAt = 0;
    const HYDRATE_COOLDOWN_MS = 1500;

    const ensureSessionHydrated = async () => {
        if (inFlightGetSession) return inFlightGetSession;
        const now = Date.now();
        if (now - lastHydrateAt < HYDRATE_COOLDOWN_MS) return;

        const cookieHeader = authClient.getCookie?.() as string | undefined;
        const cached = authClient.getSessionData?.()?.session;
        // Skip hydration if we have cached session and a fresh convex_jwt
        if (cached && isConvexJwtFresh(cookieHeader)) return;
        if (!cookieHeader) return;

        inFlightGetSession = (async () => {
            try {
                await authClient.getSession({
                    fetchOptions: {
                        headers: { "Better-Auth-Cookie": cookieHeader },
                    },
                });
                authClient.updateSession?.();
            } finally {
                lastHydrateAt = Date.now();
                inFlightGetSession = null;
            }
        })();
        return inFlightGetSession;
    };

    return { ensureSessionHydrated };
}
