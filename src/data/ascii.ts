import { CHARACTER_SETS } from "asciify-engine/core";

export const ASCII_CHARSET_STORAGE_KEY = "engiebenji.ascii-charset";

export type AsciiCharsetId = keyof typeof CHARACTER_SETS;

export interface AsciiCharsetOption {
  id: AsciiCharsetId;
  label: string;
  chars: string;
  description: string;
}

const descriptions: Record<AsciiCharsetId, string> = {
  standard: "Classic density ramp.",
  asciify: "Asciify's brand ramp.",
  minimal: "Four tones, sparse and calm.",
  detailed: "Wider tonal detail.",
  letters: "Letters as density.",
  technical: "Punctuation and symbols.",
  blocks: "Tonal block glyphs.",
  braille: "Braille density.",
};

export const asciiCharsetOptions: readonly AsciiCharsetOption[] = (
  Object.keys(CHARACTER_SETS) as AsciiCharsetId[]
).map((id) => ({
  id,
  label: CHARACTER_SETS[id].label,
  chars: CHARACTER_SETS[id].chars,
  description: descriptions[id],
}));

export const defaultAsciiCharset: AsciiCharsetId = "standard";

export const asciiCharsetById = new Map(
  asciiCharsetOptions.map((option) => [option.id, option]),
);

export function normalizeAsciiCharsetQuery(input: string): string {
  return input.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

export function findAsciiCharsetOption(
  query: string,
): AsciiCharsetOption | undefined {
  const normalized = normalizeAsciiCharsetQuery(query);

  if (!normalized) {
    return undefined;
  }

  return asciiCharsetOptions.find(
    (option) =>
      normalizeAsciiCharsetQuery(option.id) === normalized ||
      normalizeAsciiCharsetQuery(option.label) === normalized,
  );
}

export function isAsciiCharsetId(value: unknown): value is AsciiCharsetId {
  return (
    typeof value === "string" && asciiCharsetById.has(value as AsciiCharsetId)
  );
}

export function normalizeAsciiCharsetPreference(
  value: string | null | undefined,
): AsciiCharsetId {
  return isAsciiCharsetId(value) ? value : defaultAsciiCharset;
}

export function asciiGlyphs(chars: string): string[] {
  const glyphs = Array.from(chars).filter(
    (character) => character.trim().length > 0,
  );

  if (glyphs.length > 0) {
    return glyphs;
  }

  return Array.from(CHARACTER_SETS.standard.chars).filter(
    (character) => character.trim().length > 0,
  );
}

export const identity = `██████╗ ███████╗███╗   ██╗     ██╗██╗
██╔══██╗██╔════╝████╗  ██║     ██║██║
██████╔╝█████╗  ██╔██╗ ██║     ██║██║
██╔══██╗██╔══╝  ██║╚██╗██║██   ██║██║
██████╔╝███████╗██║ ╚████║╚█████╔╝██║
╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚════╝ ╚═╝`;
