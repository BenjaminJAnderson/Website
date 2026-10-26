import type { ImageMetadata } from "astro";
import type { CollectionEntry } from "astro:content";
import { basename } from "node:path";
import {
  statusLabels,
  statusOrder,
  type ProjectStatus,
} from "../data/project-status";

export type ProjectEntry = CollectionEntry<"projects">;

export interface ProjectGroup {
  status: ProjectStatus;
  label: string;
  projects: ProjectEntry[];
}

export function groupProjectsByStatus(
  projects: ProjectEntry[],
): ProjectGroup[] {
  return statusOrder
    .map((status) => ({
      status,
      label: statusLabels[status].toLowerCase(),
      projects: projects.filter((project) => project.data.status === status),
    }))
    .filter((group) => group.projects.length > 0);
}

export function getAdjacentProjects(
  projects: ProjectEntry[],
  id: string,
): { previous?: ProjectEntry; next?: ProjectEntry } {
  const index = projects.findIndex((project) => project.id === id);

  if (index === -1) {
    return {};
  }

  return {
    previous: projects[index - 1],
    next: projects[index + 1],
  };
}

export function projectRepoLabel(url: string): string {
  return url.replace(/^https?:\/\/(?:www\.)?/i, "").replace(/\/$/, "");
}

export function projectImageFilename(image: ImageMetadata): string {
  const fsPath = (image as ImageMetadata & { fsPath?: string }).fsPath;

  return basename(fsPath ?? image.src);
}

export function publicProjectImagePath(
  slug: string,
  image: ImageMetadata,
): string {
  return `/project-images/${slug}/${projectImageFilename(image)}`;
}

export function projectId(index: number): string {
  return String(Math.max(0, index) + 1).padStart(2, "0");
}
