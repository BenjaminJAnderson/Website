import { setGlobalLook } from "asciify-engine/kit";
import {
  ASCII_CHARSET_STORAGE_KEY,
  asciiCharsetById,
  asciiGlyphs,
  defaultAsciiCharset,
  normalizeAsciiCharsetPreference,
  type AsciiCharsetId,
} from "../data/ascii";

let activeCharset: AsciiCharsetId = defaultAsciiCharset;

export function applyAsciiCharset(id: AsciiCharsetId): void {
  const option =
    asciiCharsetById.get(id) ?? asciiCharsetById.get(defaultAsciiCharset);

  if (!option) {
    return;
  }

  activeCharset = option.id;
  setGlobalLook({ charset: option.chars });
}

export function getActiveAsciiCharset(): AsciiCharsetId {
  return activeCharset;
}

export function getAsciiGlyphs(): string[] {
  const option =
    asciiCharsetById.get(activeCharset) ??
    asciiCharsetById.get(defaultAsciiCharset);

  return asciiGlyphs(option?.chars ?? "");
}

export function readAsciiCharsetPreference(): AsciiCharsetId {
  try {
    return normalizeAsciiCharsetPreference(
      localStorage.getItem(ASCII_CHARSET_STORAGE_KEY),
    );
  } catch {
    return defaultAsciiCharset;
  }
}

export function saveAsciiCharsetPreference(id: AsciiCharsetId): void {
  try {
    localStorage.setItem(ASCII_CHARSET_STORAGE_KEY, id);
  } catch {
    return;
  }
}

export function resetAsciiCharsetPreference(): void {
  try {
    localStorage.removeItem(ASCII_CHARSET_STORAGE_KEY);
  } catch {
    return;
  }
}
