import { existsSync } from "node:fs";
import { basename, isAbsolute, resolve } from "node:path";
import { CHARACTER_SETS } from "asciify-engine/core";
import sharp from "sharp";
import type { ImageMetadata } from "astro";

export type AsciiImageSource = ImageMetadata | string;

export interface AsciiPreviewOptions {
  columns?: number;
  rows?: number;
  cellAspect?: number;
  ramp?: string;
  gamma?: number;
  invert?: boolean;
  dither?: boolean;
  ditherStrength?: number;
  crop?: boolean;
}

const defaultColumns = 48;
const defaultCellAspect = 0.52;
const defaultGamma = 1;
const defaultRamp = CHARACTER_SETS.standard.chars;
const defaultDitherStrength = 0.8;
const cache = new Map<string, Promise<string>>();

const bayer = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function sourceKey(source: AsciiImageSource): string {
  if (typeof source === "string") {
    return source;
  }

  const fsPath = (source as ImageMetadata & { fsPath?: string }).fsPath;

  return fsPath ?? source.src;
}

function resolveSource(source: AsciiImageSource, slug: string): string {
  if (typeof source === "string") {
    if (existsSync(source)) {
      return source;
    }

    const relative = resolve(process.cwd(), source.replace(/^\//, ""));

    if (existsSync(relative)) {
      return relative;
    }

    throw new Error(`ASCII preview source not found: ${source}`);
  }

  const fsPath = (source as ImageMetadata & { fsPath?: string }).fsPath;

  if (fsPath && existsSync(fsPath)) {
    return fsPath;
  }

  if (isAbsolute(source.src) && existsSync(source.src)) {
    return source.src;
  }

  const relative = resolve(process.cwd(), source.src.replace(/^\//, ""));

  if (existsSync(relative)) {
    return relative;
  }

  const publicPath = resolve(
    process.cwd(),
    "public",
    "project-images",
    slug,
    basename(fsPath ?? source.src),
  );

  if (existsSync(publicPath)) {
    return publicPath;
  }

  throw new Error(
    `ASCII preview source not found for project "${slug}": ${source.src}`,
  );
}

async function renderAscii(
  source: AsciiImageSource,
  slug: string,
  options: AsciiPreviewOptions,
): Promise<string> {
  const columns = Math.max(8, Math.round(options.columns ?? defaultColumns));
  const cellAspect = options.cellAspect ?? defaultCellAspect;
  const ramp = Array.from(options.ramp ?? defaultRamp);
  const gamma = options.gamma ?? defaultGamma;
  const invert = options.invert ?? false;
  const dither = options.dither ?? true;
  const ditherStrength = options.ditherStrength ?? defaultDitherStrength;
  const crop = options.crop ?? true;
  const filePath = resolveSource(source, slug);
  const metadata = await sharp(filePath).metadata();
  const sourceWidth = metadata.width ?? 1;
  const sourceHeight = metadata.height ?? 1;
  const rows = Math.max(
    4,
    Math.round(
      options.rows ?? (sourceHeight / sourceWidth) * columns * cellAspect,
    ),
  );
  let pipeline = sharp(filePath).rotate().flatten({ background: "#000" });

  if (options.rows !== undefined && crop) {
    const targetAspect = (columns / rows) * cellAspect;
    const sourceAspect = sourceWidth / sourceHeight;

    if (sourceAspect > targetAspect) {
      const width = Math.max(1, Math.round(sourceHeight * targetAspect));
      const left = Math.max(0, Math.round((sourceWidth - width) / 2));

      pipeline = pipeline.extract({
        left,
        top: 0,
        width,
        height: sourceHeight,
      });
    } else if (sourceAspect < targetAspect) {
      const height = Math.max(1, Math.round(sourceWidth / targetAspect));
      const top = Math.max(0, Math.round((sourceHeight - height) / 2));

      pipeline = pipeline.extract({
        left: 0,
        top,
        width: sourceWidth,
        height,
      });
    }
  }

  const { data, info } = await pipeline
    .resize({ width: columns, height: rows, fit: "fill" })
    .grayscale()
    .normalize()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  const lastIndex = ramp.length - 1;
  const lines: string[] = [];

  for (let y = 0; y < rows; y += 1) {
    let line = "";

    for (let x = 0; x < columns; x += 1) {
      const offset = (y * columns + x) * channels;
      let value = (data[offset] ?? 0) / 255;

      if (invert) {
        value = 1 - value;
      }

      value = Math.pow(clamp(value), gamma);

      if (dither) {
        const threshold =
          (bayer[y % 4][x % 4] / 15 - 0.5) * (ditherStrength / ramp.length);

        value = clamp(value + threshold);
      }

      const index = Math.round(value * lastIndex);
      line += ramp[index] ?? ramp[lastIndex] ?? " ";
    }

    lines.push(line.replace(/\s+$/u, ""));
  }

  return lines.join("\n");
}

export function asciiPreview(
  source: AsciiImageSource,
  slug: string,
  options: AsciiPreviewOptions = {},
): Promise<string> {
  const key = [
    sourceKey(source),
    slug,
    options.columns ?? defaultColumns,
    options.rows ?? "auto",
    options.cellAspect ?? defaultCellAspect,
    options.ramp ?? defaultRamp,
    options.gamma ?? defaultGamma,
    options.invert ?? false,
    options.dither ?? true,
    options.ditherStrength ?? defaultDitherStrength,
    options.crop ?? true,
  ].join("|");
  const cached = cache.get(key);

  if (cached) {
    return cached;
  }

  const promise = renderAscii(source, slug, options);
  cache.set(key, promise);
  promise.catch(() => cache.delete(key));

  return promise;
}

export function clearAsciiPreviewCache(): void {
  cache.clear();
}
