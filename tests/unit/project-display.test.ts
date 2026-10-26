import { describe, expect, it } from "vitest";
import type { ImageMetadata } from "astro";
import type { ProjectEntry } from "../../src/lib/project-display";
import {
  getAdjacentProjects,
  groupProjectsByStatus,
  projectId,
  projectImageFilename,
  projectRepoLabel,
  publicProjectImagePath,
} from "../../src/lib/project-display";

function makeProject(
  id: string,
  status: ProjectEntry["data"]["status"],
  title: string,
): ProjectEntry {
  return {
    id,
    data: {
      title,
      summary: `${title} summary`,
      status,
      year: 2022,
      tech: ["Astro"],
      tags: [],
      cover: {
        src: `/src/assets/projects/${id}/cover.webp`,
        width: 1600,
        height: 900,
        format: "webp",
      },
      coverAlt: `${title} cover`,
      gallery: [],
      featured: true,
      order: 0,
      draft: false,
    },
  } as unknown as ProjectEntry;
}

const projects = [
  makeProject("cube", "shipped", "CUBE"),
  makeProject("orthodox", "shipped", "ORTHODOX"),
  makeProject("engiebenji", "in-progress", "ENGIEBENJI"),
  makeProject("prototype", "prototype", "PROTOTYPE"),
  makeProject("archive", "archived", "ARCHIVE"),
];

describe("groupProjectsByStatus", () => {
  it("groups in shipped, in-progress, prototype, archived order", () => {
    const groups = groupProjectsByStatus(projects);

    expect(groups.map((group) => group.status)).toEqual([
      "shipped",
      "in-progress",
      "prototype",
      "archived",
    ]);
    expect(groups[0]?.projects.map((project) => project.id)).toEqual([
      "cube",
      "orthodox",
    ]);
    expect(groups[0]?.label).toBe("shipped");
  });
});

describe("getAdjacentProjects", () => {
  it("returns the surrounding projects without wrapping", () => {
    expect(getAdjacentProjects(projects, "cube")).toEqual({
      previous: undefined,
      next: projects[1],
    });
    expect(getAdjacentProjects(projects, "orthodox")).toEqual({
      previous: projects[0],
      next: projects[2],
    });
    expect(getAdjacentProjects(projects, "archive")).toEqual({
      previous: projects[3],
      next: undefined,
    });
  });

  it("returns an empty result for an unknown project", () => {
    expect(getAdjacentProjects(projects, "missing")).toEqual({});
  });
});

describe("project display helpers", () => {
  it("formats project ids", () => {
    expect(projectId(0)).toBe("01");
    expect(projectId(9)).toBe("10");
  });

  it("strips protocol and host prefixes from repository labels", () => {
    expect(projectRepoLabel("https://github.com/BenjaminJAnderson/CUBE")).toBe(
      "github.com/BenjaminJAnderson/CUBE",
    );
    expect(projectRepoLabel("https://www.example.com/")).toBe("example.com");
  });

  it("maps image metadata to a public project image path", () => {
    const image = {
      src: "/src/assets/projects/cube/cover.webp",
      width: 1600,
      height: 900,
      format: "webp",
    } as ImageMetadata;

    expect(projectImageFilename(image)).toBe("cover.webp");
    expect(publicProjectImagePath("cube", image)).toBe(
      "/project-images/cube/cover.webp",
    );
  });
});
