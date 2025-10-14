<script setup lang="ts">
import { computed, onUnmounted, provide, ref, watch } from "vue";
import type { InjectionKey } from "vue";
import { authClient } from "@/lib/auth-client";

// Convex client's minimal interface
type IConvexClient = {
  setAuth(
    fetchToken: (args: {
      forceRefreshToken: boolean;
    }) => Promise<string | null>,
    onChange: (isAuthenticated: boolean) => void
  ): void;
  clearAuth?: () => void; // optional
};

function tryClearAuth(client: IConvexClient) {
  // If public clearAuth provided
  if (typeof client.clearAuth === "function") {
    client.clearAuth();
    return;
  }
  // If internal BaseConvexClient is available (undocumented)
  const anyClient = client as any;
  if (anyClient.client && typeof anyClient.client.clearAuth === "function") {
    anyClient.client.clearAuth();
    return;
  }
  // Fallback: replace with a fetcher that returns null
  client.setAuth(
    async () => null,
    () => {}
  );
}

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

// Cross-domain OTT handling (client-only)
if (import.meta.client) {
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
      // Notify session updated so dependent composables rerun
      authClient.updateSession();
    }
    window.history.replaceState({}, "", url);
  }
  // Hydrate session from stored cookie on reloads
  if (!token) {
    try {
      const cookieHeader = authClient.getCookie?.();
      await authClient.getSession({
          fetchOptions: {
              headers: cookieHeader ? { "Better-Auth-Cookie": cookieHeader } : {},
            },
        });
      authClient.updateSession?.();
    } catch {
      // noop
    }
  }
}

// Compose auth state from Better Auth (reactive)
function useAuthFromBetterAuth() {
  const session = authClient.useSession();
  const isLoading = computed(() => session.value.isPending);
  const isAuthenticated = computed(() => session.value.data?.session != null);
  const fetchAccessToken = async (_: {
    forceRefreshToken: boolean;
  }): Promise<string | null> => {
    try {
      // Build robust headers for cross-domain and fallback auth
      const headers: Record<string, string> = {};
      // Use root-level actions from cross-domain client plugin
      const cookieHeader = authClient.getCookie?.();
      if (cookieHeader) headers["Better-Auth-Cookie"] = cookieHeader;

      const sessionData = authClient.getSessionData?.();
      console.log("sessionData", sessionData);
      let bearer = sessionData?.session?.token as string | undefined;
      // If we don't have a cached session yet, hydrate it once
      if (!bearer && cookieHeader) {
        try {
          await authClient.getSession({
            fetchOptions: { headers: { "Better-Auth-Cookie": cookieHeader } },
          });
          authClient.updateSession?.();
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

// Track Convex-side auth status (null = loading)
const isConvexAuthenticated = ref<boolean | null>(null);

// Mirror React provider’s state resolution
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
  { immediate: true }
);

// “First effect”: setAuth when the auth provider says we're authenticated
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
      }
    );

    // Cleanup mirrors React: if effect becomes irrelevant, don't go through unauthenticated -> authenticated incorrectly
    return () => {
      isRelevant = false;
      isConvexAuthenticated.value = isConvexAuthenticated.value ? false : null;
    };
  },
  { immediate: true }
);

// “Last effect”: clearAuth after children have unsubscribed (onUnmounted runs after children unmount)
onUnmounted(() => {
  if (authProviderAuthenticated.value) {
    tryClearAuth(props.client);
    isConvexAuthenticated.value = null;
  }
});

// Provide ConvexAuthState to descendants
provide(ConvexAuthStateKey, () => ({
  isLoading: isConvexAuthenticated.value === null,
  isAuthenticated:
    authProviderAuthenticated.value && (isConvexAuthenticated.value ?? false),
}));
</script>

<template>
  <slot />
</template>
