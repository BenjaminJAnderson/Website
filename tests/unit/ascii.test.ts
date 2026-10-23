import { describe, expect, it } from "vitest";
import {
  asciiCharsetOptions,
  asciiGlyphs,
  defaultAsciiCharset,
  findAsciiCharsetOption,
  normalizeAsciiCharsetPreference,
} from "../../src/data/ascii";

describe("ascii character sets", () => {
  it("exposes the curated ramps in order", () => {
    expect(asciiCharsetOptions.map((option) => option.id)).toEqual([
      "standard",
      "asciify",
      "minimal",
      "detailed",
      "letters",
      "technical",
      "blocks",
      "braille",
    ]);
    expect(defaultAsciiCharset).toBe("standard");
  });

  it("finds options by id or label", () => {
    expect(findAsciiCharsetOption("blocks")?.label).toBe("Tonal blocks");
    expect(findAsciiCharsetOption("TONAL BLOCKS")?.id).toBe("blocks");
    expect(findAsciiCharsetOption("asciify")?.id).toBe("asciify");
    expect(findAsciiCharsetOption("nope")).toBeUndefined();
  });

  it("normalizes stored preferences", () => {
    expect(normalizeAsciiCharsetPreference("braille")).toBe("braille");
    expect(normalizeAsciiCharsetPreference(null)).toBe("standard");
    expect(normalizeAsciiCharsetPreference("nope")).toBe("standard");
  });

  it("returns non-empty glyphs without whitespace", () => {
    for (const option of asciiCharsetOptions) {
      const glyphs = asciiGlyphs(option.chars);
      expect(glyphs.length).toBeGreaterThan(0);
      expect(glyphs.every((glyph) => glyph.trim().length > 0)).toBe(true);
    }

    expect(asciiGlyphs(" .:-=+*#%@")).toEqual([
      ".",
      ":",
      "-",
      "=",
      "+",
      "*",
      "#",
      "%",
      "@",
    ]);
    expect(asciiGlyphs("   ").length).toBeGreaterThan(0);
  });
});
