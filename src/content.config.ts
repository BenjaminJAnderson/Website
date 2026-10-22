import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({
    base: "./src/content/projects",
    pattern: "**/*.{md,mdx}",
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string().max(180),
      status: z.enum(["shipped", "in-progress", "prototype", "archived"]),
      year: z.number().int(),
      period: z.string().optional(),
      date: z.coerce.date().optional(),
      updated: z.coerce.date().optional(),
      role: z.string().optional(),
      tech: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
      cover: image(),
      coverAlt: z.string(),
      gallery: z
        .array(
          z.object({
            src: image(),
            alt: z.string(),
            caption: z.string().optional(),
          }),
        )
        .default([]),
      repo: z.url().optional(),
      demo: z.url().optional(),
      featured: z.boolean().default(false),
      order: z.number().default(0),
      draft: z.boolean().default(false),
    }),
});

export const collections = { projects };
