import { describe, expect, it } from "vitest";
import {
  buildProjectCommands,
  staticCommands,
  type SiteCommand,
} from "../../src/data/commands";
import { themes } from "../../src/data/themes";
import {
  completeCommand,
  filterCommands,
  findExactCommand,
  getCanonicalInput,
  groupCommands,
  normalizeInput,
  parseCommand,
  resolveCommand,
  suggestCommands,
} from "../../src/lib/commands";

const projectCommands = buildProjectCommands([
  {
    slug: "cube",
    title: "CUBE",
    summary: "A miniature six-PCB LED cube.",
  },
  {
    slug: "orthodox",
    title: "ORTHODOX",
    summary: "A custom ortholinear keyboard.",
  },
]);

const commands: SiteCommand[] = [...staticCommands, ...projectCommands];

describe("normalizeInput", () => {
  it("trims, lowercases and collapses whitespace", () => {
    expect(normalizeInput("  OPEN   Cube  ")).toBe("open cube");
  });
});

describe("parseCommand", () => {
  it("parses open with a project argument", () => {
    expect(parseCommand("open cube")).toEqual({
      name: "open",
      args: ["cube"],
    });
  });

  it("maps cd and go to the target command", () => {
    expect(parseCommand("cd about")).toEqual({ name: "about", args: [] });
    expect(parseCommand("go projects")).toEqual({
      name: "projects",
      args: [],
    });
  });

  it("returns an empty parse for blank input", () => {
    expect(parseCommand("   ")).toEqual({ name: "", args: [] });
  });
});

describe("findExactCommand", () => {
  it("finds commands by id and alias", () => {
    expect(findExactCommand("projects", commands)?.id).toBe("projects");
    expect(findExactCommand("work", commands)?.id).toBe("projects");
    expect(findExactCommand("?", commands)?.id).toBe("help");
  });
});

describe("resolveCommand", () => {
  it("resolves a direct command", () => {
    const result = resolveCommand("about", commands);

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.command.action).toEqual({
        type: "navigate",
        href: "/about/",
      });
    }
  });

  it("resolves uninstall to the uninstall action", () => {
    const result = resolveCommand("uninstall", commands);

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.command.action).toEqual({ type: "uninstall" });
    }
  });

  it("resolves pwd to the path action", () => {
    const result = resolveCommand("pwd", commands);

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.command.action).toEqual({ type: "path" });
    }
  });

  it("resolves shell commands to their actions", () => {
    const cd = resolveCommand("cd", commands);
    const ls = resolveCommand("ls", commands);
    const sections = resolveCommand("sections", commands);

    expect(cd.kind).toBe("success");
    expect(ls.kind).toBe("success");
    expect(sections.kind).toBe("success");

    if (cd.kind === "success") {
      expect(cd.command.action).toEqual({ type: "change-directory" });
    }

    if (ls.kind === "success") {
      expect(ls.command.action).toEqual({ type: "list-directory" });
    }

    if (sections.kind === "success") {
      expect(sections.command.action).toEqual({ type: "sections" });
    }
  });

  it("resolves neofetch to the neofetch action", () => {
    const result = resolveCommand("neofetch", commands);

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.command.action).toEqual({ type: "neofetch" });
      expect(result.command.description).toBe(
        "Show basic information about me.",
      );
    }
  });

  it("resolves theme to the theme list", () => {
    const result = resolveCommand("theme", commands, themes);

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.command.action).toEqual({
        type: "theme",
        query: "list",
      });
    }
  });

  it("resolves theme list, current and reset", () => {
    const list = resolveCommand("theme list", commands, themes);
    const current = resolveCommand("theme current", commands, themes);
    const reset = resolveCommand("theme reset", commands, themes);

    expect(list.kind).toBe("success");
    expect(current.kind).toBe("success");
    expect(reset.kind).toBe("success");

    if (list.kind === "success") {
      expect(list.command.action).toEqual({ type: "theme", query: "list" });
    }

    if (current.kind === "success") {
      expect(current.command.action).toEqual({
        type: "theme",
        query: "current",
      });
    }

    if (reset.kind === "success") {
      expect(reset.command.action).toEqual({ type: "theme", query: "reset" });
    }
  });

  it("resolves a theme by slug or display name", () => {
    const slug = resolveCommand("theme tokyo-night", commands, themes);
    const spaced = resolveCommand("theme Tokyo Night", commands, themes);

    expect(slug.kind).toBe("success");
    expect(spaced.kind).toBe("success");

    if (slug.kind === "success") {
      expect(slug.command.action).toEqual({
        type: "theme",
        query: "tokyo-night",
      });
    }

    if (spaced.kind === "success") {
      expect(spaced.command.action).toEqual({
        type: "theme",
        query: "tokyo-night",
      });
    }
  });

  it("suggests themes for an unknown theme", () => {
    const result = resolveCommand("theme tokio", commands, themes);

    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(result.message).toContain("tokio");
      expect(
        result.suggestions.some(
          (command) => command.id === "theme tokyo-night",
        ),
      ).toBe(true);
    }
  });

  it("resolves open with no argument to the project list", () => {
    const result = resolveCommand("open", commands);

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.command.action).toEqual({ type: "list-projects" });
    }
  });

  it("resolves open cube to the CUBE project", () => {
    const result = resolveCommand("open cube", commands);

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.command.action).toEqual({
        type: "navigate",
        href: "/projects/cube/",
      });
    }
  });

  it("resolves cd cube through the project alias", () => {
    const result = resolveCommand("cd cube", commands);

    expect(result.kind).toBe("success");
    if (result.kind === "success") {
      expect(result.command.id).toBe("open-cube");
    }
  });

  it("returns an empty result for blank input", () => {
    expect(resolveCommand("  ", commands)).toEqual({ kind: "empty" });
  });

  it("returns suggestions for unknown commands", () => {
    const result = resolveCommand("projets", commands);

    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(
        result.suggestions.some((command) => command.id === "projects"),
      ).toBe(true);
    }
  });

  it("returns an error for an unknown project", () => {
    const result = resolveCommand("open nope", commands);

    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(result.message).toContain("nope");
    }
  });
});

describe("filterCommands", () => {
  it("returns grouped defaults for an empty query", () => {
    const results = filterCommands(commands, "");
    const groups = groupCommands(results).map((group) => group.group);

    expect(groups).toEqual(["navigate", "projects", "utility"]);
  });

  it("matches project titles and aliases", () => {
    expect(filterCommands(commands, "cube")[0]?.id).toBe("open-cube");
    expect(filterCommands(commands, "open orthodox")[0]?.id).toBe(
      "open-orthodox",
    );
  });

  it("matches aliases such as work and mail", () => {
    expect(filterCommands(commands, "work")[0]?.id).toBe("projects");
    expect(filterCommands(commands, "mail")[0]?.id).toBe("contact");
  });

  it("matches theme keywords", () => {
    expect(filterCommands(commands, "appearance")[0]?.id).toBe("theme");
  });

  it("returns no matches for unrelated text", () => {
    expect(filterCommands(commands, "zzzzzz")).toEqual([]);
  });
});

describe("suggestCommands", () => {
  it("suggests projects for a close misspelling", () => {
    const suggestions = suggestCommands("projets", commands);

    expect(suggestions[0]?.id).toBe("projects");
  });
});

describe("completeCommand", () => {
  it("completes theme slugs and display names", () => {
    expect(completeCommand("theme vant", commands, themes)).toBe(
      "theme vantablack",
    );
    expect(completeCommand("theme Tokyo N", commands, themes)).toBe(
      "theme tokyo-night",
    );
    expect(completeCommand("theme tokio", commands, themes)).toBe(
      "theme tokyo-night",
    );
  });

  it("keeps theme subcommands and adds a trailing space", () => {
    expect(completeCommand("theme", commands, themes)).toBe("theme ");
    expect(completeCommand("theme current", commands, themes)).toBe(
      "theme current",
    );
    expect(completeCommand("theme reset", commands, themes)).toBe(
      "theme reset",
    );
  });

  it("still completes non-theme commands", () => {
    expect(completeCommand("neo", commands, themes)).toBe("neofetch");
  });

  it("returns undefined when no theme matches", () => {
    expect(completeCommand("theme zzzzz", commands, themes)).toBeUndefined();
  });
});

describe("getCanonicalInput", () => {
  it("returns the shell form for project commands", () => {
    const cube = commands.find((command) => command.id === "open-cube");

    expect(cube).toBeDefined();
    if (cube) {
      expect(getCanonicalInput(cube)).toBe("open cube");
    }
  });

  it("returns the command id for static commands", () => {
    const about = commands.find((command) => command.id === "about");

    expect(about).toBeDefined();
    if (about) {
      expect(getCanonicalInput(about)).toBe("about");
    }
  });
});
