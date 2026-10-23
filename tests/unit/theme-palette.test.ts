import { describe, expect, it } from "vitest";
import { rgbAtLuminance } from "../../src/lib/theme-palette";

describe("rgbAtLuminance", () => {
  it("scales a neutral colour to the requested luminance", () => {
    expect(rgbAtLuminance([100, 100, 100], 0.5)).toEqual([128, 128, 128]);
  });

  it("uses neutral grey when the source has no chroma", () => {
    expect(rgbAtLuminance([0, 0, 0], 0.4)).toEqual([102, 102, 102]);
  });

  it("clamps the target luminance to the valid range", () => {
    expect(rgbAtLuminance([255, 255, 255], -1)).toEqual([0, 0, 0]);
    expect(rgbAtLuminance([255, 255, 255], 2)).toEqual([255, 255, 255]);
  });
});
