import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "shadcn-nuxt", "convex-nuxt", "nuxt-lucide-icons"],
  css: ["~/assets/css/tailwind.css"],
  alias: {
    "@": resolve(__dirname, "./app/"),
  },
  convex: {
    url: process.env.CONVEX_URL,
  },
  shadcn: {
    prefix: "",
    componentDir: "~/components/ui",
  },
  lucide: {
    namePrefix: "Icon",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
