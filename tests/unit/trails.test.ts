import { describe, expect, it } from "vitest";
import {
  cursorTrailOptions,
  defaultCursorTrail,
  findCursorTrailOption,
  isCursorTrailPreference,
  normalizeCursorTrailPreference,
} from "../../src/data/trails";

describe("cursor trails", () => {
  it("exposes the five engine styles and off", () => {
    expect(cursorTrailOptions.map((option) => option.id)).toEqual([
      "trail",
      "wake",
      "water",
      "sparkle",
      "spray",
      "off",
    ]);
    expect(defaultCursorTrail).toBe("trail");
  });

  it("finds options by id or label", () => {
    expect(findCursorTrailOption("wake")?.label).toBe("Wake");
    expect(findCursorTrailOption("SPRAY")?.id).toBe("spray");
    expect(findCursorTrailOption("Off")?.id).toBe("off");
    expect(findCursorTrailOption("nope")).toBeUndefined();
  });

  it("validates and normalizes stored preferences", () => {
    expect(isCursorTrailPreference("water")).toBe(true);
    expect(isCursorTrailPreference("off")).toBe(true);
    expect(isCursorTrailPreference("nope")).toBe(false);
    expect(normalizeCursorTrailPreference("sparkle")).toBe("sparkle");
    expect(normalizeCursorTrailPreference("off")).toBe("off");
    expect(normalizeCursorTrailPreference(null)).toBe("trail");
    expect(normalizeCursorTrailPreference("nope")).toBe("trail");
  });
});
