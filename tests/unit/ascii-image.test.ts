import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  asciiPreview,
  clearAsciiPreviewCache,
} from "../../src/lib/ascii-image";

const temporaryDirectories: string[] = [];

function makeImagePath(): string {
  const directory = mkdtempSync(join(tmpdir(), "ascii-image-"));
  temporaryDirectories.push(directory);

  return join(directory, "source.png");
}

async function writeImage(
  path: string,
  width: number,
  height: number,
  background: { r: number; g: number; b: number },
): Promise<void> {
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background,
    },
  })
    .png()
    .toFile(path);
}

beforeEach(() => {
  clearAsciiPreviewCache();
});

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("asciiPreview", () => {
  it("renders a deterministic character grid with the expected shape", async () => {
    const path = makeImagePath();
    await writeImage(path, 16, 9, { r: 255, g: 255, b: 255 });

    const art = await asciiPreview(path, "test", {
      columns: 40,
      dither: false,
    });
    const lines = art.split("\n");

    expect(lines).toHaveLength(12);
    expect(lines.every((line) => line.length <= 40)).toBe(true);
    expect(art).toContain("@");
  });

  it("uses an explicit row count for uniform contact-sheet plates", async () => {
    const path = makeImagePath();
    await writeImage(path, 16, 9, { r: 255, g: 255, b: 255 });

    const art = await asciiPreview(path, "test", {
      columns: 24,
      rows: 8,
      dither: false,
    });

    expect(art.split("\n")).toHaveLength(8);
  });

  it("returns the same cached promise for identical options", () => {
    const path = makeImagePath();

    const first = asciiPreview(path, "test", { columns: 16 });
    const second = asciiPreview(path, "test", { columns: 16 });

    expect(second).toBe(first);
  });

  it("rejects a missing source with a useful error", async () => {
    await expect(
      asciiPreview("/definitely/missing-project-cover.webp", "missing"),
    ).rejects.toThrow(/not found/);
  });
});
