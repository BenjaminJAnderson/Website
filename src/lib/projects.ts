import type { ImageMetadata } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";

export type ProjectEntry = CollectionEntry<"projects">;

export interface ProjectCardData {
  slug: string;
  title: string;
  summary: string;
  statusLabel: string;
  year: string;
  tech: string[];
  cover: ImageMetadata;
  coverAlt: string;
  href: string;
}

export const statusLabels = {
  shipped: "Shipped",
  "in-progress": "In progress",
  prototype: "Prototype",
  archived: "Archived",
} as const;

export function toProjectCard(project: ProjectEntry): ProjectCardData {
  const { data } = project;

  return {
    slug: project.id,
    title: data.title,
    summary: data.summary,
    statusLabel: statusLabels[data.status],
    year: data.period ?? String(data.year),
    tech: data.tech,
    cover: data.cover,
    coverAlt: data.coverAlt,
    href: `/projects/${project.id}/`,
  };
}

export async function getPublishedProjects(): Promise<ProjectEntry[]> {
  const projects = await getCollection("projects", ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );

  return projects.sort(
    (a, b) =>
      Number(b.data.featured) - Number(a.data.featured) ||
      a.data.order - b.data.order ||
      b.data.year - a.data.year,
  );
}
