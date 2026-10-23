import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputPath = join(root, "src", "data", "themes.json");
const omarchyPath = process.env.OMARCHY_PATH ?? "/usr/share/omarchy";
const themeRoots = [
  join(omarchyPath, "themes"),
  join(homedir(), ".config", "omarchy", "themes"),
];

const ansiFields = [
  "background",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "foreground",
  "muted",
  "bright_red",
  "bright_green",
  "bright_yellow",
  "bright_blue",
  "bright_magenta",
  "bright_cyan",
  "bright_foreground",
];

const requiredFields = [
  "background",
  "foreground",
  "accent",
  "selection",
  "selection_foreground",
  "muted",
  "light_foreground",
  "lighter_background",
  ...ansiFields,
];

function displayName(id) {
  return id
    .replace(/(^|-)([a-z])/g, (_, prefix, character) => {
      return `${prefix}${character.toUpperCase()}`;
    })
    .replace(/-/g, " ");
}

function readColors(colorsPath) {
  let output;

  try {
    output = execFileSync(
      "omarchy-theme-color",
      ["--file", colorsPath, "--all"],
      { encoding: "utf8" },
    );
  } catch (error) {
    throw new Error(
      `Could not read ${colorsPath} with omarchy-theme-color: ${error.message}`,
    );
  }

  const colors = new Map();

  for (const line of output.split("\n")) {
    const separator = line.indexOf("\t");

    if (separator === -1) {
      continue;
    }

    colors.set(line.slice(0, separator), line.slice(separator + 1).trim());
  }

  return colors;
}

function requireColor(colors, themeId, field) {
  const value = colors.get(field);

  if (!value) {
    throw new Error(
      `Theme "${themeId}" is missing resolved colour "${field}".`,
    );
  }

  return value;
}

function collectThemes() {
  const themes = new Map();

  for (const themeRoot of themeRoots) {
    if (!existsSync(themeRoot)) {
      continue;
    }

    for (const entry of readdirSync(themeRoot, { withFileTypes: true })) {
      const themePath = join(themeRoot, entry.name);

      if (!entry.isDirectory() && !entry.isSymbolicLink()) {
        continue;
      }

      let stats;

      try {
        stats = statSync(themePath);
      } catch {
        continue;
      }

      if (!stats.isDirectory()) {
        continue;
      }

      const colorsPath = join(themePath, "colors.toml");

      if (!existsSync(colorsPath)) {
        continue;
      }

      themes.set(entry.name, colorsPath);
    }
  }

  return themes;
}

function buildTheme(id, colorsPath) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error(`Theme directory "${id}" is not a safe theme id.`);
  }

  const colors = readColors(colorsPath);
  const values = Object.fromEntries(
    requiredFields.map((field) => [field, requireColor(colors, id, field)]),
  );
  const mode = requireColor(colors, id, "mode");

  if (mode !== "dark" && mode !== "light") {
    throw new Error(`Theme "${id}" has unsupported mode "${mode}".`);
  }

  return {
    id,
    name: displayName(id),
    mode,
    colors: {
      background: values.background,
      foreground: values.foreground,
      accent: values.accent,
      selection: values.selection,
      selectionForeground: values.selection_foreground,
      muted: values.muted,
      lightForeground: values.light_foreground,
      lighterBackground: values.lighter_background,
      ansi: ansiFields.map((field) => values[field]),
    },
  };
}

const themes = [...collectThemes()]
  .map(([id, colorsPath]) => buildTheme(id, colorsPath))
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

if (themes.length === 0) {
  throw new Error(`No Omarchy themes found in ${themeRoots.join(" or ")}.`);
}

writeFileSync(outputPath, `${JSON.stringify(themes, null, 2)}\n`);

console.log(`Pulled ${themes.length} themes into ${outputPath}`);
