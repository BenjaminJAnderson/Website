import { describe, expect, it } from "vitest";
import { chromaSpiral } from "../../src/lib/chroma-spiral";
import type { SpiralContext } from "../../src/lib/chroma-spiral";

const context: SpiralContext = {
  cols: 100,
  rows: 40,
  time: 1200,
  aspect: 0.58,
};

describe("chromaSpiral", () => {
  it("returns a character from the ben density", () => {
    const cell = chromaSpiral({ x: 50, y: 20 }, context);

    expect("ben").toContain(cell.char);
    expect([0, 1, 2]).toContain(cell.color);
  });

  it("returns defined output at the edges and corners", () => {
    const coords = [
      { x: 0, y: 0 },
      { x: 99, y: 0 },
      { x: 0, y: 39 },
      { x: 99, y: 39 },
      { x: 0, y: 20 },
      { x: 99, y: 20 },
    ];

    for (const coord of coords) {
      const cell = chromaSpiral(coord, context);

      expect("ben").toContain(cell.char);
      expect([0, 1, 2]).toContain(cell.color);
    }
  });

  it("returns finite, stable output across time", () => {
    const times = [0, 16, 500, 5000, 120000];

    for (const time of times) {
      const cell = chromaSpiral({ x: 50, y: 20 }, { ...context, time });

      expect(Number.isFinite(cell.color)).toBe(true);
      expect("ben").toContain(cell.char);
    }
  });

  it("produces all three letters and shades across the grid", () => {
    const chars = new Set<string>();
    const colors = new Set<number>();

    for (let y = 0; y < context.rows; y += 2) {
      for (let x = 0; x < context.cols; x += 2) {
        const cell = chromaSpiral({ x, y }, context);
        chars.add(cell.char);
        colors.add(cell.color);
      }
    }

    expect([...chars].sort()).toEqual(["b", "e", "n"]);
    expect([...colors].sort()).toEqual([0, 1, 2]);
  });

  it("is deterministic for the same coordinate and context", () => {
    const first = chromaSpiral({ x: 20, y: 10 }, context);
    const second = chromaSpiral({ x: 20, y: 10 }, context);

    expect(second).toEqual(first);
  });
});
