import {
  mountSurface,
  type PaintFrame,
  type Surface,
} from "asciify-engine/kit";
import { chromaBand, chromaDensity } from "../lib/chroma-spiral";
import {
  readAnsiPalette,
  rgbAtLuminance,
  type Rgb,
} from "../lib/theme-palette";

const LOGO_SOURCE = "/safari-pinned-tab.svg";
const LOGO_COLUMNS = 33;
const LOGO_ROWS = 18;
const LOGO_MIN_CELL_SIZE = 5;
const LOGO_MAX_CELL_SIZE = 15;
const LOGO_CELL_ASPECT = 0.62;
const LOGO_CHARSET = " .:-=+*#%@";
const LOGO_ALPHA_THRESHOLD = 0.02;
const LOGO_DENSITY_FLOOR = 0.5;

export function mountNeofetchLogo(host: HTMLElement): () => void {
  if (host.dataset.neofetchLogoMounted === "true") {
    return () => undefined;
  }

  host.dataset.neofetchLogoMounted = "true";

  let destroyed = false;
  let surface: Surface | null = null;
  let palette: Rgb[] = readAnsiPalette(host);
  let image: HTMLImageElement | null = null;

  let sourceCanvas: HTMLCanvasElement | null = null;
  let sourceContext: CanvasRenderingContext2D | null = null;
  let sourceCols = 0;
  let sourceRows = 0;

  let maskCanvas: HTMLCanvasElement | null = null;
  let maskContext: CanvasRenderingContext2D | null = null;
  let maskCols = 0;
  let maskRows = 0;
  let maskData: Uint8ClampedArray | null = null;

  const showFallback = (): void => {
    host.classList.remove("is-live");
  };

  const showSurface = (): void => {
    host.classList.add("is-live");
  };

  const ensureMask = (cols: number, rows: number): void => {
    if (!image) {
      return;
    }

    if (!maskCanvas || !maskContext || cols !== maskCols || rows !== maskRows) {
      maskCanvas = document.createElement("canvas");
      maskCanvas.width = cols;
      maskCanvas.height = rows;
      maskContext = maskCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      maskCols = cols;
      maskRows = rows;
    }

    if (!maskContext) {
      maskData = null;
      return;
    }

    maskContext.clearRect(0, 0, cols, rows);
    maskContext.drawImage(image, 0, 0, cols, rows);
    maskData = maskContext.getImageData(0, 0, cols, rows).data;
  };

  const paint = ({ pen, width, height, now, still }: PaintFrame): boolean => {
    const cols = LOGO_COLUMNS;
    const rows = LOGO_ROWS;

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

    ensureMask(cols, rows);

    if (!maskData) {
      return false;
    }

    const frame = sourceContext.createImageData(cols, rows);
    const count = palette.length;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const index = (y * cols + x) * 4;
        const alpha = (maskData[index + 3] ?? 0) / 255;

        if (alpha <= LOGO_ALPHA_THRESHOLD) {
          frame.data[index] = 0;
          frame.data[index + 1] = 0;
          frame.data[index + 2] = 0;
          frame.data[index + 3] = 255;
          continue;
        }

        const density = chromaDensity(
          { x, y },
          {
            cols,
            rows,
            time: still ? 0 : now,
            aspect: LOGO_CELL_ASPECT,
          },
        );
        const color =
          palette[chromaBand(density, count)] ?? ([255, 255, 255] as const);
        const amount =
          (LOGO_DENSITY_FLOOR + (1 - LOGO_DENSITY_FLOOR) * density) * alpha;
        const tint = rgbAtLuminance(color, amount);

        frame.data[index] = tint[0];
        frame.data[index + 1] = tint[1];
        frame.data[index + 2] = tint[2];
        frame.data[index + 3] = 255;
      }
    }

    sourceContext.putImageData(frame, 0, 0);
    pen.fillStyle = "#000";
    pen.fillRect(0, 0, width, height);
    pen.drawImage(sourceCanvas, 0, 0, width, height);

    return !still;
  };

  const mount = (): void => {
    if (destroyed || !image) {
      return;
    }

    surface = mountSurface({
      host,
      look: () => ({
        mark: "glyph",
        cellSize: Math.max(
          LOGO_MIN_CELL_SIZE,
          Math.min(
            LOGO_MAX_CELL_SIZE,
            host.clientWidth / (LOGO_COLUMNS * LOGO_CELL_ASPECT),
          ),
        ),
        cellAspect: LOGO_CELL_ASPECT,
        charset: LOGO_CHARSET,
        color: "source",
        hover: "none",
      }),
      ink: () => "--ansi-7",
      layer: "over",
      reducedMotion: () => undefined,
      onFail: () => {
        surface = null;
        showFallback();
      },
      onTheme: () => {
        palette = readAnsiPalette(host);
      },
      paint,
    });

    if (!surface) {
      return;
    }

    const current = surface;

    void current.field.ready
      .then(() => {
        if (!destroyed && surface === current) {
          showSurface();
        }
      })
      .catch(() => {
        if (surface === current) {
          showFallback();
        }
      });
  };

  const logo = new Image();
  logo.decoding = "async";
  logo.src = LOGO_SOURCE;

  void logo
    .decode()
    .then(() => {
      if (destroyed) {
        return;
      }

      image = logo;
      mount();
    })
    .catch(() => {
      showFallback();
    });

  return () => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    surface?.destroy();
    surface = null;
    showFallback();
    delete host.dataset.neofetchLogoMounted;
  };
}
