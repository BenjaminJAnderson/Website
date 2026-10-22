import { getCollection, type CollectionEntry } from "astro:content";

export type ProjectEntry = CollectionEntry<"projects">;

export const statusLabels = {
  shipped: "Shipped",
  "in-progress": "In progress",
  prototype: "Prototype",
  archived: "Archived",
} as const;

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
