import { levenshtein } from "./similarity";

export type ThemeMode = "dark" | "light";

export interface ThemeColors {
  background: string;
  foreground: string;
  accent: string;
  selection: string;
  selectionForeground: string;
  muted: string;
  lightForeground: string;
  lighterBackground: string;
  ansi: string[];
}

export interface Theme {
  id: string;
  name: string;
  mode: ThemeMode;
  colors: ThemeColors;
}

export function normalizeThemeQuery(input: string): string {
  return input.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

function themeCandidates(theme: Theme): string[] {
  const id = normalizeThemeQuery(theme.id);
  const name = normalizeThemeQuery(theme.name);

  return [id, name, id.split(" ")[0], name.split(" ")[0]];
}

export function findTheme(query: string, themes: Theme[]): Theme | undefined {
  const normalized = normalizeThemeQuery(query);

  if (!normalized) {
    return undefined;
  }

  return themes.find((theme) => themeCandidates(theme).includes(normalized));
}

export function suggestThemes(
  query: string,
  themes: Theme[],
  limit = 3,
): Theme[] {
  const normalized = normalizeThemeQuery(query);

  if (!normalized) {
    return [];
  }

  const maxDistance = Math.max(2, Math.ceil(normalized.length * 0.45));

  return themes
    .map((theme) => {
      const candidates = themeCandidates(theme);
      const distance = Math.min(
        ...candidates.map((candidate) =>
          candidate.includes(normalized)
            ? 0
            : levenshtein(normalized, candidate),
        ),
      );

      return { theme, distance };
    })
    .filter((entry) => entry.distance <= maxDistance)
    .sort(
      (a, b) =>
        a.distance - b.distance || a.theme.name.localeCompare(b.theme.name),
    )
    .slice(0, limit)
    .map((entry) => entry.theme);
}

export function themeToCssVars(theme: Theme): string {
  const colors = theme.colors;
  const vars: Array<[string, string]> = [
    ["--bg", colors.background],
    ["--text", colors.foreground],
    ["--text-muted", colors.lightForeground],
    ["--text-dim", "color-mix(in oklab, var(--text) 72%, var(--bg))"],
    ["--line", "color-mix(in oklab, var(--text) 14%, var(--bg))"],
    ["--line-strong", "color-mix(in oklab, var(--text) 26%, var(--bg))"],
    ["--selection", colors.selection],
    ["--selection-fg", colors.selectionForeground],
    ["--focus", colors.accent],
    ["--accent", colors.accent],
  ];

  colors.ansi.forEach((color, index) => {
    vars.push([`--ansi-${index}`, color]);
  });

  return vars.map(([name, value]) => `${name}: ${value};`).join("\n");
}

export function themeCss(themes: Theme[], defaultThemeId: string): string {
  return themes
    .map((theme) => {
      const selector =
        theme.id === defaultThemeId
          ? `:root,\n:root[data-theme="${theme.id}"]`
          : `:root[data-theme="${theme.id}"]`;
      const declarations = themeToCssVars(theme)
        .split("\n")
        .map((declaration) => `  ${declaration}`)
        .join("\n");

      return `${selector} {\n  color-scheme: ${theme.mode};\n${declarations}\n}`;
    })
    .join("\n\n");
}
