import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/eslint",
    "shadcn-nuxt",
    "convex-nuxt",
    "nuxt-lucide-icons",
    "@nuxtjs/color-mode",
    "@pinia/nuxt",
    "@nuxt/image",
  ],
  css: ["~/assets/css/tailwind.css"],
  alias: {
    "@": resolve(__dirname, "./app/"),
  },
  convex: {
    url: process.env.CONVEX_URL,
  },
  image: {
    domains: ["img.ygoprodeck.com"],
    alias: {
      ygoprodeck: "https://img.ygoprodeck.com",
    }
  },
  shadcn: {
    prefix: "",
    componentDir: "~/components/ui",
  },
  lucide: {
    namePrefix: "Icon",
  },
  colorMode: {
    preference: "dark",
    classSuffix: "",
    disableTransition: false,
    storage: "localStorage",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});