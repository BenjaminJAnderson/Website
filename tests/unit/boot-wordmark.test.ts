import { describe, expect, it } from "vitest";
import {
  getWordmarkFit,
  WORDMARK_SOURCE_ASPECT,
} from "../../src/lib/boot-wordmark";

describe("boot wordmark fit", () => {
  it("covers tall and narrow hosts", () => {
    expect(getWordmarkFit(360, 217)).toBe("cover");
    expect(getWordmarkFit(920, 324)).toBe("cover");
  });

  it("contains wide hosts", () => {
    expect(getWordmarkFit(1200, 300)).toBe("contain");
    expect(getWordmarkFit(920, 260)).toBe("contain");
  });

  it("falls back to contain for invalid dimensions", () => {
    expect(getWordmarkFit(0, 100)).toBe("contain");
    expect(getWordmarkFit(100, 0)).toBe("contain");
    expect(getWordmarkFit(Number.NaN, 100)).toBe("contain");
  });

  it("keeps the source aspect boundary on contain", () => {
    expect(getWordmarkFit(WORDMARK_SOURCE_ASPECT, 1)).toBe("contain");
  });
});
