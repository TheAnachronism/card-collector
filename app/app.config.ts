export default defineAppConfig({
  ui: {},
  nuxtIcon: {},
  /** Head config */
  head: {
    htmlAttrs: {
      class: "dark",
      lang: "en",
    },
    viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
    meta: [
      { name: "theme-color", content: "#0b1220" },
      { name: "color-scheme", content: "dark" },
    ],
  },
  /** Route/page transitions */
  pageTransition: { name: "page", mode: "out-in" },
  layoutTransition: { name: "layout", mode: "out-in" },
});
