import { describe, expect, it } from "vitest";
import {
  buildTerminalFileSystem,
  completePath,
  findNodeByRoute,
  listDirectory,
  normalizeRoute,
  parentRoute,
  resolvePath,
  type TerminalNode,
} from "../../src/lib/terminal-fs";

const fileSystem = buildTerminalFileSystem(
  [
    {
      slug: "cube",
      summary: "A miniature six-PCB LED cube.",
    },
    {
      slug: "engiebenji",
      summary: "The site itself.",
    },
    {
      slug: "orthodox",
      summary: "A custom ortholinear keyboard.",
    },
  ],
  "/cv/BenjaminAnderson-CV.pdf",
);

function found(node: ReturnType<typeof resolvePath>): TerminalNode {
  expect(node.kind).toBe("found");

  if (node.kind !== "found") {
    throw new Error("Expected a path match.");
  }

  return node.node;
}

describe("buildTerminalFileSystem", () => {
  it("builds the root and project directories", () => {
    expect(listDirectory(fileSystem).map((node) => node.name)).toEqual([
      "about",
      "cv",
      "projects",
    ]);

    const projects = findNodeByRoute(fileSystem, "/projects/");

    expect(projects).toBeDefined();
    if (projects) {
      expect(listDirectory(projects).map((node) => node.name)).toEqual([
        "cube",
        "engiebenji",
        "orthodox",
      ]);
    }
  });

  it("treats the CV as a file", () => {
    const cv = findNodeByRoute(fileSystem, "/")?.children?.find(
      (node) => node.name === "cv",
    );

    expect(cv?.kind).toBe("file");
    expect(cv?.route).toBe("/cv/BenjaminAnderson-CV.pdf");
  });
});

describe("route helpers", () => {
  it("normalizes routes", () => {
    expect(normalizeRoute("")).toBe("/");
    expect(normalizeRoute("/")).toBe("/");
    expect(normalizeRoute("/projects")).toBe("/projects/");
    expect(normalizeRoute("//projects//cube")).toBe("/projects/cube/");
  });

  it("finds parent routes", () => {
    expect(parentRoute("/projects/cube/")).toBe("/projects/");
    expect(parentRoute("/projects/")).toBe("/");
    expect(parentRoute("/")).toBe("/");
  });
});

describe("resolvePath", () => {
  it("resolves relative and absolute directory paths", () => {
    expect(found(resolvePath(fileSystem, "/projects/", "cube")).route).toBe(
      "/projects/cube/",
    );
    expect(
      found(resolvePath(fileSystem, "/projects/cube/", "../../about")).route,
    ).toBe("/about/");
    expect(found(resolvePath(fileSystem, "/", "/projects/cube")).route).toBe(
      "/projects/cube/",
    );
    expect(found(resolvePath(fileSystem, "/", "~/projects")).route).toBe(
      "/projects/",
    );
  });

  it("keeps the current directory for an empty path", () => {
    expect(found(resolvePath(fileSystem, "/projects/", "")).route).toBe(
      "/projects/",
    );
  });

  it("resolves the root and parent directory", () => {
    expect(found(resolvePath(fileSystem, "/projects/", "..")).route).toBe("/");
    expect(found(resolvePath(fileSystem, "/", "~")).route).toBe("/");
  });

  it("returns files as matches", () => {
    expect(found(resolvePath(fileSystem, "/", "cv")).kind).toBe("file");
  });

  it("reports missing and non-directory paths", () => {
    expect(resolvePath(fileSystem, "/", "nope")).toEqual({
      kind: "error",
      reason: "not-found",
      path: "nope",
    });
    expect(resolvePath(fileSystem, "/", "cv/extra")).toEqual({
      kind: "error",
      reason: "not-directory",
      path: "cv/extra",
    });
  });
});

describe("completePath", () => {
  it("completes directories from the root and projects", () => {
    expect(completePath("cd", fileSystem, "/", "cd")).toBe("cd ");
    expect(completePath("cd pro", fileSystem, "/", "cd")).toBe("cd projects/");
    expect(completePath("cd a", fileSystem, "/", "cd")).toBe("cd about/");
    expect(completePath("cd c", fileSystem, "/projects/", "cd")).toBe(
      "cd cube/",
    );
    expect(completePath("cd e", fileSystem, "/projects/", "cd")).toBe(
      "cd engiebenji/",
    );
  });

  it("preserves absolute, home and parent prefixes", () => {
    expect(completePath("cd /pro", fileSystem, "/", "cd")).toBe(
      "cd /projects/",
    );
    expect(completePath("cd ~/pro", fileSystem, "/", "cd")).toBe(
      "cd ~/projects/",
    );
    expect(completePath("cd ../a", fileSystem, "/projects/", "cd")).toBe(
      "cd ../about/",
    );
  });

  it("completes ls entries including files", () => {
    expect(completePath("ls", fileSystem, "/", "ls")).toBe("ls ");
    expect(completePath("ls pro", fileSystem, "/", "ls")).toBe("ls projects/");
    expect(completePath("ls cv", fileSystem, "/", "ls")).toBe("ls cv");
  });

  it("does not complete unmatched directories or the wrong command", () => {
    expect(completePath("cd zzz", fileSystem, "/", "cd")).toBeUndefined();
    expect(completePath("cd c", fileSystem, "/", "cd")).toBeUndefined();
    expect(completePath("cd pro", fileSystem, "/", "ls")).toBeUndefined();
  });
});
