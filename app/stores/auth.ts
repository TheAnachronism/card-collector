import { defineStore } from "pinia";
import { computed } from "vue";
import { authClient } from "@/lib/auth-client";

export const useAuthStore = defineStore("auth", () => {
    const session = authClient.useSession();

    const isLoading = computed(() => !!session.value.isPending);
    const isAuthenticated = computed(() => !!session.value.data?.session);
    // Single source of truth, exclusive states
    const status = computed<"loading" | "authenticated" | "unauthenticated">(
        () => (isLoading.value ? "loading" : isAuthenticated.value ? "authenticated" : "unauthenticated"),
    );
    const isUnauthenticated = computed(() => status.value === "unauthenticated");

    const userName = computed(
        () => session.value.data?.user?.name ?? "You",
    );
    const userImage = computed(
        () => session.value.data?.user?.image ?? "",
    );

    return {
        isLoading,
        isAuthenticated,
        isUnauthenticated,
        status,
        userName,
        userImage,
    };
});


