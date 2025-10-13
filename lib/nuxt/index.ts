import { createCookieGetter } from "better-auth/cookies";
import { JWT_COOKIE_NAME } from "../plugins/convex";
import { type CreateAuth, getStaticAuth } from "../client";
import type { GenericDataModel } from "convex/server";
import { defineEventHandler, getCookie, toWebRequest } from "h3";
import type { H3Event } from "h3";

export const getToken = <DataModel extends GenericDataModel>(
  createAuth: CreateAuth<DataModel>,
  event: H3Event
) => {
  const options = getStaticAuth(createAuth).options;
  const createCookie = createCookieGetter(options);
  const cookie = createCookie(JWT_COOKIE_NAME);
  const token = getCookie(event, cookie.name);

  // Warn if there's a secure cookie name mismatch (secure vs insecure prefix)
  if (!token) {
    const isSecure = cookie.name.startsWith("__Secure-");
    const insecureCookieName = cookie.name.replace("__Secure-", "");
    const insecureCookie = getCookie(event, insecureCookieName);
    const secureCookieName = isSecure
      ? cookie.name
      : `__Secure-${insecureCookieName}`;
    const secureCookie = getCookie(event, secureCookieName);
    if (isSecure && insecureCookie) {
      console.warn(
        `Looking for secure cookie ${cookie.name} but found insecure cookie ${insecureCookieName}`
      );
    }
    if (!isSecure && secureCookie) {
      console.warn(
        `Looking for insecure cookie ${cookie.name} but found secure cookie ${secureCookieName}`
      );
    }
  }
  return token ?? undefined;
};

const handler = (request: Request, opts?: { convexSiteUrl?: string }) => {
  const requestUrl = new URL(request.url);
  const convexSiteUrl = opts?.convexSiteUrl ?? process.env.CONVEX_SITE_URL;
  if (!convexSiteUrl) {
    throw new Error("CONVEX_SITE_URL is not set");
  }
  const nextUrl = `${convexSiteUrl}${requestUrl.pathname}${requestUrl.search}`;
  const newRequest = new Request(nextUrl, request);
  newRequest.headers.set("accept-encoding", "application/json");
  return fetch(newRequest, { method: request.method, redirect: "manual" });
};

export const nuxtHandler = (opts?: { convexSiteUrl?: string }) =>
  defineEventHandler((event) => handler(toWebRequest(event), opts));
