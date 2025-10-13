import { createAuthClient } from "better-auth/vue";
import { convexClient, crossDomainClient } from "~~/lib/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_CONVEX_SITE_URL,
  plugins: [

    crossDomainClient(),
    convexClient(),
  ],
});
