import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_ID,
  defaultTheme,
  themeById,
  themes,
} from "../../src/data/themes";
import {
  findTheme,
  normalizeThemeQuery,
  suggestThemes,
  themeCss,
  themeToCssVars,
} from "../../src/lib/themes";

describe("theme data", () => {
  it("includes every pulled theme", () => {
    expect(themes).toHaveLength(22);
    expect(new Set(themes.map((theme) => theme.id)).size).toBe(themes.length);
  });

  it("uses Vantablack as the default", () => {
    expect(DEFAULT_THEME_ID).toBe("vantablack");
    expect(defaultTheme.id).toBe(DEFAULT_THEME_ID);
    expect(themeById.get(DEFAULT_THEME_ID)).toBe(defaultTheme);
  });

  it("has sixteen ANSI colours and a valid mode for every theme", () => {
    for (const theme of themes) {
      expect(theme.colors.ansi).toHaveLength(16);
      expect(["dark", "light"]).toContain(theme.mode);

      for (const colour of [
        theme.colors.background,
        theme.colors.foreground,
        theme.colors.accent,
        theme.colors.selection,
        theme.colors.selectionForeground,
        theme.colors.muted,
        theme.colors.lightForeground,
        theme.colors.lighterBackground,
        ...theme.colors.ansi,
      ]) {
        expect(colour).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it("includes both light and dark themes", () => {
    expect(themes.some((theme) => theme.mode === "light")).toBe(true);
    expect(themes.some((theme) => theme.mode === "dark")).toBe(true);
  });
});

describe("theme queries", () => {
  it("normalises hyphens and whitespace", () => {
    expect(normalizeThemeQuery("  Tokyo-Night  ")).toBe("tokyo night");
  });

  it("finds themes by slug, spaced slug and display name", () => {
    const expected = themeById.get("tokyo-night");

    expect(findTheme("tokyo-night", themes)).toBe(expected);
    expect(findTheme("tokyo night", themes)).toBe(expected);
    expect(findTheme("Tokyo Night", themes)).toBe(expected);
  });

  it("returns undefined for an empty query", () => {
    expect(findTheme("", themes)).toBeUndefined();
  });

  it("suggests a close theme name", () => {
    const suggestions = suggestThemes("tokio", themes);

    expect(suggestions[0]?.id).toBe("tokyo-night");
  });

  it("suggests themes from a partial name", () => {
    const suggestions = suggestThemes("latte", themes);

    expect(suggestions[0]?.id).toBe("catppuccin-latte");
  });
});

describe("themeCss", () => {
  it("maps the active theme to site tokens", () => {
    const vars = themeToCssVars(defaultTheme);

    expect(vars).toContain("--bg: #000000;");
    expect(vars).toContain("--text: #ffffff;");
    expect(vars).toContain(
      "--text-dim: color-mix(in oklab, var(--text) 72%, var(--bg));",
    );
    expect(vars).toContain("--focus: #8d8d8d;");
    expect(vars).toContain("--ansi-0: #000000;");
    expect(vars).toContain("--ansi-8: #7a7a7a;");
    expect(vars).toContain("--ansi-15: #ffffff;");
  });

  it("uses the default theme as the root fallback", () => {
    const css = themeCss(themes, DEFAULT_THEME_ID);

    expect(css).toContain(
      `:root,\n:root[data-theme="${DEFAULT_THEME_ID}"] {\n  color-scheme: dark;`,
    );
  });

  it("emits light and dark theme blocks", () => {
    const css = themeCss(themes, DEFAULT_THEME_ID);

    expect(css).toContain(':root[data-theme="catppuccin-latte"] {');
    expect(css).toContain("color-scheme: light;");
    expect(css).toContain(':root[data-theme="miasma"] {');
    expect(css).toContain("color-scheme: dark;");
  });
});
