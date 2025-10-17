import { createClient, type GenericCtx } from "../lib/client";
import { convex, crossDomain } from "../lib/plugins";
import { components } from "./_generated/api";
import { query, type QueryCtx } from "./_generated/server";
import { betterAuth } from "better-auth";
import type { DataModel } from "./_generated/dataModel";

const siteUrl = process.env.SITE_URL!;

export const authComponent = createClient<DataModel>(components.betterAuth, {
  verbose: true,
});

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false }
) => {
  return betterAuth({
    trustedOrigins: [siteUrl],
    logger: {
      disabled: optionsOnly,
    },
    emailAndPassword: {
      enabled: false,
    },
    database: authComponent.adapter(ctx),
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID as string,
        clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      },
    },
    user: {
      deleteUser: {
        enabled: true,
      },
    },
    plugins: [crossDomain({ siteUrl }), convex()],
    account: {
      accountLinking: {
        enabled: true,
      },
    },
  });
};

// Below are example helpers and functions for getting the current user
// Feel free to edit, omit, etc.
export const safeGetUser = async (ctx: QueryCtx) => {
  return authComponent.safeGetAuthUser(ctx);
};

export const getUserId = async (ctx: QueryCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject;
};

export const getUser = async (ctx: QueryCtx) => {
  return authComponent.getAuthUser(ctx);
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // console.log("identity", await ctx.auth.getUserIdentity());
    return safeGetUser(ctx);
  },
});
