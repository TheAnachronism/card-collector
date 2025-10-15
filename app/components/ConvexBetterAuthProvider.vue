<script setup lang="ts">
import { computed, onUnmounted, provide, ref, watch } from "vue";
import type { InjectionKey } from "vue";
import { authClient } from "@/lib/auth-client";
import { createBetterAuthHydrator } from "@/composables/authSession";

type IConvexClient = {
    setAuth(
        fetchToken: (args: {
            forceRefreshToken: boolean;
        }) => Promise<string | null>,
        onChange: (isAuthenticated: boolean) => void,
    ): void;
    clearAuth?: () => void; // optional
};

// Public shape matching ConvexAuthState
export type ConvexAuthState = {
    isLoading: boolean;
    isAuthenticated: boolean;
};

// Injection key to access ConvexAuthState
const ConvexAuthStateKey: InjectionKey<() => ConvexAuthState> =
    Symbol("ConvexAuthState");

// Props
const props = defineProps<{
    client: IConvexClient;
}>();

if (import.meta.client) {
    const { ensureSessionHydrated } = createBetterAuthHydrator(
        authClient as typeof authClient,
    );

    const url = new URL(window.location.href);
    const token = url.searchParams.get("ott");
    if (token) {
        url.searchParams.delete("ott");
        const result = await authClient.crossDomain.oneTimeToken.verify({
            token,
        });
        const session = result.data?.session;
        if (session) {
            await authClient.getSession({
                fetchOptions: {
                    headers: {
                        Authorization: `Bearer ${session.token}`,
                    },
                },
            });
            authClient.updateSession();
        }
        window.history.replaceState({}, "", url);
    }
    if (!token) {
        try {
            await ensureSessionHydrated();
        } catch {
            // noop
        }
    }
}

function useAuthFromBetterAuth() {
    const session = authClient.useSession();
    const isLoading = computed(() => session.value.isPending);
    const isAuthenticated = computed(() => session.value.data?.session != null);
    const fetchAccessToken = async (_: {
        forceRefreshToken: boolean;
    }): Promise<string | null> => {
        try {
            const headers: Record<string, string> = {};
            const cookieHeader = authClient.getCookie?.();
            if (cookieHeader) headers["Better-Auth-Cookie"] = cookieHeader;

            const sessionData = authClient.getSessionData?.();
            let bearer = sessionData?.session?.token as string | undefined;
            // If we don't have a cached session yet, hydrate it once
            if (!bearer && cookieHeader) {
                try {
                    const hydrator = createBetterAuthHydrator(
                        authClient as typeof authClient,
                    );
                    await hydrator.ensureSessionHydrated();
                    const refreshed = authClient.getSessionData?.();
                    bearer = refreshed?.session?.token as string | undefined;
                } catch {
                    // noop
                }
            }
            if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

            const { data } = await authClient.convex.token({
                fetchOptions: { headers },
            });
            return data?.token ?? null;
        } catch {
            return null;
        }
    };
    return { isLoading, isAuthenticated, fetchAccessToken };
}

const {
    isLoading: authProviderLoading,
    isAuthenticated: authProviderAuthenticated,
    fetchAccessToken,
} = useAuthFromBetterAuth();

const isConvexAuthenticated = ref<boolean | null>(null);

watch(
    [authProviderLoading, authProviderAuthenticated],
    ([loading, authed]) => {
        if (loading && isConvexAuthenticated.value !== null) {
            isConvexAuthenticated.value = null;
        }
        if (!loading && !authed && isConvexAuthenticated.value !== false) {
            isConvexAuthenticated.value = false;
        }
    },
    { immediate: true },
);

watch(
    [authProviderAuthenticated, fetchAccessToken],
    ([authed]) => {
        if (!authed) return;

        let isRelevant = true;
        props.client.setAuth(
            (args) => fetchAccessToken(args),
            (backendReportsIsAuthenticated) => {
                if (isRelevant) {
                    isConvexAuthenticated.value = backendReportsIsAuthenticated;
                }
            },
        );

        return () => {
            isRelevant = false;
            isConvexAuthenticated.value = isConvexAuthenticated.value
                ? false
                : null;
        };
    },
    { immediate: true },
);

onUnmounted(() => {
    if (authProviderAuthenticated.value) {
        props.client.setAuth(
            async () => null,
            () => {},
        );
        isConvexAuthenticated.value = null;
    }
});

// Provide ConvexAuthState to descendants
provide(ConvexAuthStateKey, () => ({
    isLoading: isConvexAuthenticated.value === null,
    isAuthenticated:
        authProviderAuthenticated.value &&
        (isConvexAuthenticated.value ?? false),
}));
</script>

<template>
    <slot />
</template>
