import { mountSurface, type Surface } from "asciify-engine/kit";
import { chromaBand, chromaDensity } from "../lib/chroma-spiral";
import { readAnsiPalette, rgbAtLuminance } from "../lib/theme-palette";

export interface ChromaSurfaceOptions {
  clear?: HTMLElement | false;
  cellSize?: number;
  lazy?: boolean;
}

export interface ChromaPulsePoint {
  x: number;
  y: number;
}

export interface ChromaSurfaceHandle {
  readonly supported: boolean;
  pulse: (target: Element | ChromaPulsePoint, strength?: number) => void;
  play: () => void;
  pause: () => void;
  destroy: () => void;
}

export function mountChromaSurface(
  host: HTMLElement,
  options: ChromaSurfaceOptions = {},
): ChromaSurfaceHandle {
  let sourceCanvas: HTMLCanvasElement | null = null;
  let sourceContext: CanvasRenderingContext2D | null = null;
  let sourceCols = 0;
  let sourceRows = 0;
  let palette = readAnsiPalette(host);
  let destroyed = false;

  const paint = ({
    pen,
    w,
    h,
    now,
    still,
  }: {
    pen: CanvasRenderingContext2D;
    w: number;
    h: number;
    now: number;
    still: boolean;
  }): boolean => {
    const cell = 10;
    const cols = Math.max(40, Math.ceil(w / cell));
    const rows = Math.max(24, Math.ceil(h / cell));

    if (
      !sourceCanvas ||
      !sourceContext ||
      cols !== sourceCols ||
      rows !== sourceRows
    ) {
      sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = cols;
      sourceCanvas.height = rows;
      sourceContext = sourceCanvas.getContext("2d");
      sourceCols = cols;
      sourceRows = rows;
    }

    if (!sourceContext) {
      return false;
    }

    const image = sourceContext.createImageData(cols, rows);

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const density = chromaDensity(
          { x, y },
          {
            cols,
            rows,
            time: now,
            aspect: 0.62,
          },
        );
        const color =
          palette[chromaBand(density, palette.length)] ??
          ([255, 255, 255] as const);
        const tint = rgbAtLuminance(color, density);
        const index = (y * cols + x) * 4;

        image.data[index] = tint[0];
        image.data[index + 1] = tint[1];
        image.data[index + 2] = tint[2];
        image.data[index + 3] = 255;
      }
    }

    sourceContext.putImageData(image, 0, 0);
    pen.fillStyle = "#000";
    pen.fillRect(0, 0, w, h);
    pen.drawImage(sourceCanvas, 0, 0, w, h);

    return !still;
  };

  let surface: Surface | null = mountSurface({
    host,
    kit: {
      current: {
        lazy: options.lazy ?? true,
      },
    },
    look: () => ({
      mark: "glyph",
      cellSize: options.cellSize ?? 11,
      cellAspect: 0.62,
      charset: " .:-=+*#%@",
      color: "source",
      hover: "none",
      clear: options.clear
        ? {
            element: options.clear,
            padding: 28,
            feather: 0.4,
          }
        : false,
    }),
    ink: () => "--ascii-ink",
    reducedMotion: () => undefined,
    onTheme: () => {
      palette = readAnsiPalette(host);
    },
    paint,
  });

  const supported = surface !== null;

  return {
    supported,
    pulse: (target, strength = 1.4) => {
      if (!surface || destroyed) {
        return;
      }

      const current = surface;

      void current.field.ready
        .then(() => {
          if (destroyed || !current.live) {
            return;
          }

          if (target instanceof Element) {
            current.field.pulse({ element: target, strength });
          } else {
            current.field.pulse({ x: target.x, y: target.y, strength });
          }
        })
        .catch(() => undefined);
    },
    play: () => {
      if (!destroyed) {
        surface?.play();
      }
    },
    pause: () => {
      if (!destroyed) {
        surface?.pause();
      }
    },
    destroy: () => {
      destroyed = true;
      surface?.destroy();
      surface = null;
    },
  };
}
