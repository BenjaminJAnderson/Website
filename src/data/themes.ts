import type { Theme } from "../lib/themes";
import themeData from "./themes.json";

export const DEFAULT_THEME_ID = "vantablack";
export const THEME_STORAGE_KEY = "engiebenji.theme";

export const themes = themeData as Theme[];
export const themeById = new Map(themes.map((theme) => [theme.id, theme]));

const fallbackTheme = themes[0];

if (!fallbackTheme) {
  throw new Error("No Omarchy themes were pulled into the site.");
}

export const defaultTheme = themeById.get(DEFAULT_THEME_ID) ?? fallbackTheme;
