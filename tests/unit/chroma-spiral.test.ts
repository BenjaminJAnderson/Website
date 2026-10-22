import { describe, expect, it } from "vitest";
import { chromaDensity } from "../../src/lib/chroma-spiral";
import type { SpiralContext } from "../../src/lib/chroma-spiral";

const context: SpiralContext = {
  cols: 120,
  rows: 60,
  time: 1200,
  aspect: 0.62,
};

describe("chromaDensity", () => {
  it("returns a finite value in the 0..1 range", () => {
    const density = chromaDensity({ x: 60, y: 30 }, context);

    expect(Number.isFinite(density)).toBe(true);
    expect(density).toBeGreaterThanOrEqual(0);
    expect(density).toBeLessThanOrEqual(1);
  });

  it("handles edges and corners", () => {
    const coords = [
      { x: 0, y: 0 },
      { x: 119, y: 0 },
      { x: 0, y: 59 },
      { x: 119, y: 59 },
      { x: 0, y: 30 },
      { x: 119, y: 30 },
    ];

    for (const coord of coords) {
      const density = chromaDensity(coord, context);

      expect(Number.isFinite(density)).toBe(true);
      expect(density).toBeGreaterThanOrEqual(0);
      expect(density).toBeLessThanOrEqual(1);
    }
  });

  it("is deterministic for the same coordinate and context", () => {
    expect(chromaDensity({ x: 20, y: 10 }, context)).toBe(
      chromaDensity({ x: 20, y: 10 }, context),
    );
  });

  it("changes over time", () => {
    const first = chromaDensity({ x: 60, y: 30 }, context);
    const second = chromaDensity({ x: 60, y: 30 }, { ...context, time: 5000 });

    expect(second).not.toBe(first);
  });
});
