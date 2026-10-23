export type Rgb = readonly [number, number, number];

export const ANSI_COLOR_COUNT = 16;

const LUMINANCE_RED = 0.2126;
const LUMINANCE_GREEN = 0.7152;
const LUMINANCE_BLUE = 0.0722;

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

export function rgbAtLuminance(color: Rgb, luminance: number): Rgb {
  const target = Math.round(Math.min(1, Math.max(0, luminance)) * 255);
  const current =
    color[0] * LUMINANCE_RED +
    color[1] * LUMINANCE_GREEN +
    color[2] * LUMINANCE_BLUE;

  if (current < 1) {
    return [clampChannel(target), clampChannel(target), clampChannel(target)];
  }

  const scale = target / current;

  return [
    clampChannel(color[0] * scale),
    clampChannel(color[1] * scale),
    clampChannel(color[2] * scale),
  ];
}

function readColor(
  context: CanvasRenderingContext2D,
  token: string | undefined,
  fallback: string,
): Rgb {
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = fallback;

  if (token) {
    context.fillStyle = token;
  }

  context.fillRect(0, 0, 1, 1);
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;

  return [red ?? 255, green ?? 255, blue ?? 255];
}

export function readAnsiPalette(
  host: HTMLElement,
  count = ANSI_COLOR_COUNT,
): Rgb[] {
  const root = document.documentElement;
  const rootStyle = getComputedStyle(root);
  const fallback = getComputedStyle(host).color || rootStyle.color || "#ffffff";
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return [];
  }

  const palette: Rgb[] = [];

  for (let index = 0; index < count; index += 1) {
    const token = rootStyle.getPropertyValue(`--ansi-${index}`).trim();
    palette.push(readColor(context, token, fallback));
  }

  return palette;
}
