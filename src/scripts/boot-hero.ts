import { mountSurface } from "asciify-engine/kit";
import { chromaBand, chromaDensity } from "../lib/chroma-spiral";
import { readAnsiPalette, rgbAtLuminance } from "../lib/theme-palette";

export const BOOT_BACKGROUND_FADE_MS = 1000;

export interface BootHero {
  destroy: () => void;
  pulse: (element?: HTMLElement) => void;
}

export function startBootHero(
  host: HTMLElement,
  clearElement: HTMLElement,
): BootHero {
  let sourceCanvas: HTMLCanvasElement | null = null;
  let sourceContext: CanvasRenderingContext2D | null = null;
  let sourceCols = 0;
  let sourceRows = 0;
  const palette = readAnsiPalette(host);

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

  const surface = mountSurface({
    host,
    look: () => ({
      mark: "glyph",
      cellSize: 11,
      cellAspect: 0.62,
      charset: " .:-=+*#%@",
      color: "source",
      hover: "none",
      clear: {
        element: clearElement,
        padding: 28,
        feather: 0.4,
      },
    }),
    ink: () => "--ascii-ink",
    reducedMotion: () => undefined,
    paint,
  });

  let destroyed = false;

  return {
    destroy: () => {
      destroyed = true;
      surface?.destroy();
    },
    pulse: (element) => {
      if (!surface || destroyed) {
        return;
      }

      const field = surface.field;

      void field.ready
        .then(() => {
          if (!destroyed && surface.live) {
            field.pulse({ element, strength: 1.4 });
          }
        })
        .catch(() => undefined);
    },
  };
}
