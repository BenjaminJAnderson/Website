import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://engiebenji.com",
  base: "/",
  trailingSlash: "always",
  output: "static",
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes("/2022/") &&
        !page.includes("/ideas/") &&
        !page.includes("/tags.html"),
    }),
  ],
});
