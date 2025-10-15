import type { BetterAuthClientPlugin, Store } from "better-auth";
import type { BetterFetchOption } from "@better-fetch/fetch";
import type { crossDomain } from ".";

interface CookieAttributes {
    value: string;
    expires?: Date;
    "max-age"?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
}

export function parseSetCookieHeader(
    header: string,
): Map<string, CookieAttributes> {
    const cookieMap = new Map<string, CookieAttributes>();

    // Safely split combined Set-Cookie header into individual cookie strings.
    // We cannot simply split on ", " because Expires attributes contain commas.
    const parts: string[] = [];
    let start = 0;
    let inExpires = false;
    for (let i = 0; i < header.length; i++) {
        const char = header[i];
        // Detect start of Expires attribute (case-insensitive)
        if (!inExpires && header.slice(i, i + 8).toLowerCase() === "expires=") {
            inExpires = true;
        }
        if (inExpires && char === ";") {
            // Expires attribute ended
            inExpires = false;
        }
        if (char === "," && !inExpires) {
            // Split between cookies, trim any trailing space after comma
            parts.push(header.slice(start, i).trim());
            // Skip a space after comma if present
            if (header[i + 1] === " ") {
                start = i + 2;
            } else {
                start = i + 1;
            }
        }
    }
    // Push last segment
    if (start <= header.length) {
        const last = header.slice(start).trim();
        if (last) parts.push(last);
    }

    for (const cookie of parts) {
        const segments = cookie.split(/;\s*/);
        const nameValue = segments.shift();
        if (!nameValue) continue;
        const eqIdx = nameValue.indexOf("=");
        if (eqIdx === -1) continue;
        const name = nameValue.slice(0, eqIdx);
        const value = nameValue.slice(eqIdx + 1);

        const cookieObj: CookieAttributes = { value };

        for (const attr of segments) {
            const [attrNameRaw, ...attrValParts] = attr.split("=");
            const attrName = (attrNameRaw || "").toLowerCase();
            const attrValue = attrValParts.join("=");
            // Attributes like Secure/HttpOnly may be flags without values
            if (!attrName) continue;
            if (attrName === "expires") {
                (cookieObj as CookieAttributes).expires = attrValue
                    ? new Date(attrValue)
                    : undefined;
            } else if (attrName === "max-age") {
                (cookieObj as CookieAttributes)["max-age"] = attrValue
                    ? Number(attrValue)
                    : undefined;
            } else if (
                attrName === "domain" ||
                attrName === "path" ||
                attrName === "samesite"
            ) {
                // Assign as string attributes
                (
                    cookieObj as unknown as Record<
                        "domain" | "path" | "samesite",
                        string | boolean
                    >
                )[attrName as "domain" | "path" | "samesite"] = attrValue || "";
            } else if (attrName === "secure" || attrName === "httponly") {
                if (attrName === "secure") {
                    (cookieObj as CookieAttributes).secure = true;
                } else {
                    (cookieObj as CookieAttributes).httpOnly = true;
                }
            }
        }

        cookieMap.set(name, cookieObj);
    }

    return cookieMap;
}

interface StoredCookie {
    value: string;
    expires: Date | null;
}

export function getSetCookie(header: string, prevCookie?: string) {
    const parsed = parseSetCookieHeader(header);
    let toSetCookie: Record<string, StoredCookie> = {};
    parsed.forEach((cookie, key) => {
        const expiresAt = cookie["expires"];
        const maxAge = cookie["max-age"];
        const expires = expiresAt
            ? new Date(String(expiresAt))
            : maxAge
              ? new Date(Date.now() + Number(maxAge) * 1000)
              : null;
        toSetCookie[key] = {
            value: cookie["value"],
            expires,
        };
    });
    if (prevCookie) {
        try {
            const prevCookieParsed = JSON.parse(prevCookie);
            toSetCookie = {
                ...prevCookieParsed,
                ...toSetCookie,
            };
        } catch {
            //
        }
    }
    return JSON.stringify(toSetCookie);
}

export function getCookie(cookie: string) {
    let parsed = {} as Record<string, StoredCookie>;
    try {
        parsed = JSON.parse(cookie) as Record<string, StoredCookie>;
    } catch {
        // noop
    }
    const pairs: string[] = [];
    for (const [key, value] of Object.entries(parsed)) {
        if (value.expires && value.expires < new Date()) {
            continue;
        }
        pairs.push(`${key}=${value.value}`);
    }
    return pairs.join("; ");
}

export const crossDomainClient = (
    opts: {
        storage?: {
            setItem: (key: string, value: string) => void;
            getItem: (key: string) => string | null;
        };
        storagePrefix?: string;
        disableCache?: boolean;
    } = {},
) => {
    let store: Store | null = null;
    const cookieName = `${opts?.storagePrefix || "better-auth"}_cookie`;
    const localCacheName = `${opts?.storagePrefix || "better-auth"}_session_data`;
    const storage =
        opts?.storage ||
        (typeof window !== "undefined" ? localStorage : undefined);

    return {
        id: "cross-domain",
        $InferServerPlugin: {} as ReturnType<typeof crossDomain>,
        getActions(_, $store) {
            store = $store;
            return {
                /**
                 * Get the stored cookie.
                 *
                 * You can use this to get the cookie stored in the device and use it in your fetch
                 * requests.
                 *
                 * @example
                 * ```ts
                 * const cookie = client.getCookie();
                 * fetch("https://api.example.com", {
                 * 	headers: {
                 * 		cookie,
                 * 	},
                 * });
                 */
                getCookie: () => {
                    const cookie = storage?.getItem(cookieName);
                    return getCookie(cookie || "{}");
                },
                /**
                 * Notify the session signal.
                 *
                 * This is used to trigger an update in useSession, generally when a new session
                 * token is set.
                 *
                 * @example
                 * ```ts
                 * client.notifySessionSignal();
                 * ```
                 */
                updateSession: () => {
                    $store.notify("$sessionSignal");
                },
                /**
                 * Get the stored session data.
                 *
                 * @example
                 * ```ts
                 * const sessionData = client.getSessionData();
                 * ```
                 */
                getSessionData: () => {
                    const sessionData = storage?.getItem(localCacheName);
                    return sessionData ? JSON.parse(sessionData) : null;
                },
            };
        },
        fetchPlugins: [
            {
                id: "convex",
                name: "Convex",
                hooks: {
                    async onSuccess(context) {
                        if (!storage) {
                            return;
                        }
                        // Collect all occurrences of the custom header (case-insensitive)
                        let setCookie = "";
                        for (const [
                            key,
                            value,
                        ] of context.response.headers.entries()) {
                            if (
                                key.toLowerCase() === "set-better-auth-cookie"
                            ) {
                                setCookie = setCookie
                                    ? `${setCookie}, ${value}`
                                    : value;
                            }
                        }
                        if (setCookie) {
                            const prevCookie = storage.getItem(cookieName);
                            const toSetCookie = getSetCookie(
                                setCookie || "",
                                prevCookie ?? undefined,
                            );
                            storage.setItem(cookieName, toSetCookie);
                            // Avoid immediately re-triggering get-session if we're already in get-session
                            const urlStr = context.request.url.toString();
                            if (!urlStr.includes("/get-session")) {
                                store?.notify("$sessionSignal");
                            }
                        }

                        if (
                            context.request.url
                                .toString()
                                .includes("/get-session") &&
                            !opts?.disableCache
                        ) {
                            const data = context.data;
                            storage.setItem(
                                localCacheName,
                                JSON.stringify(data),
                            );
                        }
                    },
                },
                async init(url, options) {
                    if (!storage) {
                        return {
                            url,
                            options: options as BetterFetchOption,
                        };
                    }
                    options = options || {};
                    const storedCookie = storage.getItem(cookieName);
                    const cookie = getCookie(storedCookie || "{}");
                    options.credentials = "omit";
                    options.headers = {
                        ...options.headers,
                        "Better-Auth-Cookie": cookie,
                    };
                    if (url.includes("/sign-out")) {
                        await storage.setItem(cookieName, "{}");
                        store?.atoms.session?.set({
                            data: null,
                            error: null,
                            isPending: false,
                        });
                        storage.setItem(localCacheName, "{}");
                    }
                    return {
                        url,
                        options: options as BetterFetchOption,
                    };
                },
            },
        ],
    } satisfies BetterAuthClientPlugin;
};
