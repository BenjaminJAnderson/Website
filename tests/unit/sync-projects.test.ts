import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildRawUrl,
  chooseProjectContent,
  parseProjectMarkdown,
  validateProjectMarkdown,
} from "../../scripts/sync-projects.mjs";

const validMarkdown = `---
title: "ENGIEBENJI"
summary: "A valid project summary."
status: "in-progress"
year: 2022
role: "Design, build and writing"
tech: ["Astro", "TypeScript"]
tags: ["website"]
cover: "../../assets/projects/engiebenji/cover.webp"
coverAlt: "Cover illustration."
gallery: []
repo: "https://github.com/BenjaminJAnderson/Website"
featured: true
order: 3
draft: false
---

## Overview

A project body with enough content to pass validation.
`;

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function makeCachePath(): string {
  const directory = mkdtempSync(join(tmpdir(), "project-sync-"));
  temporaryDirectories.push(directory);
  return join(directory, "src", "content", "projects", "engiebenji.md");
}

describe("parseProjectMarkdown", () => {
  it("separates frontmatter from the body", () => {
    const result = parseProjectMarkdown(validMarkdown);

    expect(result.errors).toEqual([]);
    expect(result.frontmatter).toMatchObject({
      title: "ENGIEBENJI",
      status: "in-progress",
    });
    expect(result.body).toContain("## Overview");
  });

  it("rejects content without frontmatter", () => {
    const result = parseProjectMarkdown("## Overview\n\nNo frontmatter.");

    expect(result.frontmatter).toBeNull();
    expect(result.errors).toContain("missing YAML frontmatter");
  });

  it("rejects malformed YAML", () => {
    const result = parseProjectMarkdown(
      "---\ntitle: [unterminated\n---\n\nBody",
    );

    expect(result.frontmatter).toBeNull();
    expect(result.errors[0]).toMatch(/invalid YAML/);
  });
});

describe("validateProjectMarkdown", () => {
  it("accepts a complete project file", () => {
    const result = validateProjectMarkdown(validMarkdown);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("reports missing fields, bad status and an empty body", () => {
    const result = validateProjectMarkdown(`---
title: "Broken"
status: "lost"
year: "soon"
---

`);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("missing field: summary");
    expect(result.errors).toContain(
      "status must be one of: shipped, in-progress, prototype, archived",
    );
    expect(result.errors).toContain("year must be an integer");
    expect(result.errors).toContain("body must not be empty");
  });

  it("rejects an overly long summary", () => {
    const result = validateProjectMarkdown(
      validMarkdown.replace("A valid project summary.", "x".repeat(181)),
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("summary must be 180 characters or fewer");
  });

  it("checks that the referenced cover exists relative to the cache", () => {
    const cachePath = makeCachePath();

    const missing = validateProjectMarkdown(validMarkdown, { cachePath });
    expect(missing.valid).toBe(false);
    expect(missing.errors).toContain(
      "cover not found: ../../assets/projects/engiebenji/cover.webp",
    );

    const coverPath = resolve(
      dirname(cachePath),
      "../../assets/projects/engiebenji/cover.webp",
    );
    mkdirSync(dirname(coverPath), { recursive: true });
    writeFileSync(coverPath, "image");

    const present = validateProjectMarkdown(validMarkdown, { cachePath });
    expect(present.valid).toBe(true);
  });
});

describe("buildRawUrl", () => {
  it("builds a raw GitHub URL and keeps branch slashes", () => {
    const url = buildRawUrl(
      {
        repo: "BenjaminJAnderson/Website",
        path: "content/projects/engiebenji.md",
      },
      "feature/section layouts",
    );

    expect(url).toBe(
      "https://raw.githubusercontent.com/BenjaminJAnderson/Website/feature/section%20layouts/content/projects/engiebenji.md",
    );
  });
});

describe("chooseProjectContent", () => {
  it("prefers valid remote content", () => {
    const result = chooseProjectContent({
      remoteText: validMarkdown,
      cacheText: validMarkdown.replace("A valid project summary.", "Cached."),
      localText: validMarkdown.replace("A valid project summary.", "Local."),
    });

    expect(result.source).toBe("remote");
    expect(result.text).toBe(validMarkdown);
  });

  it("falls back to the cache when the remote is missing or broken", () => {
    const cached = validMarkdown.replace("A valid project summary.", "Cached.");

    const result = chooseProjectContent({
      remoteText: "not a project file",
      cacheText: cached,
      localText: validMarkdown.replace("A valid project summary.", "Local."),
    });

    expect(result.source).toBe("cache");
    expect(result.text).toBe(cached);
  });

  it("falls back to the local source when remote and cache are both broken", () => {
    const local = validMarkdown.replace("A valid project summary.", "Local.");

    const result = chooseProjectContent({
      remoteText: "not a project file",
      cacheText: "also broken",
      localText: local,
    });

    expect(result.source).toBe("local");
    expect(result.text).toBe(local);
  });

  it("prefers local content when local changes are being developed", () => {
    const local = validMarkdown.replace("A valid project summary.", "Local.");

    const result = chooseProjectContent({
      remoteText: validMarkdown,
      cacheText: validMarkdown,
      localText: local,
      preferLocal: true,
    });

    expect(result.source).toBe("local");
    expect(result.text).toBe(local);
  });

  it("reports every source when nothing validates", () => {
    const result = chooseProjectContent({
      remoteText: "broken",
      cacheText: "broken",
      localText: "broken",
    });

    expect(result.text).toBeNull();
    expect(result.failures.map((failure) => failure.source)).toEqual([
      "remote",
      "cache",
      "local",
    ]);
  });
});
