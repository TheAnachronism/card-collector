import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/eslint", "shadcn-nuxt", "convex-nuxt"],
  css: ['~/assets/css/tailwind.css'],
  convex: {
    url: process.env.CONVEX_URL,
  },
  shadcn: {
    prefix: '',
    componentDir: '~/components/ui',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});