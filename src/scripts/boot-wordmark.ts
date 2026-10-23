import { wordmark } from "asciify-engine/kit";
import {
  getWordmarkFit,
  WORDMARK_CELL_SIZE,
  type WordmarkFit,
} from "../lib/boot-wordmark";

export const BOOT_WORDMARK_ASSEMBLE_MS = 1800;

export async function startBootWordmark(
  element: HTMLElement,
): Promise<() => void> {
  try {
    await document.fonts.load('400 16px "Old London"');
  } catch {
    // The fallback face still lets the wordmark mount.
  }

  let fit = getWordmarkFit(element.clientWidth, element.clientHeight);

  const mark = wordmark(element, {
    text: element.textContent?.trim() || "benji",
    font: '"Old London", Georgia, "Times New Roman", serif',
    fontWeight: 400,
    ink: "--ascii-ink-strong",
    lazy: false,
    assemble: "visible",
    duration: BOOT_WORDMARK_ASSEMBLE_MS,
    look: {
      charset: " .:-=+*#%@",
      cellSize: WORDMARK_CELL_SIZE,
      fit,
      hover: "none",
    },
  });

  let frame = 0;
  const observer =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => {
          if (frame) {
            return;
          }

          frame = window.requestAnimationFrame(() => {
            frame = 0;

            const next: WordmarkFit = getWordmarkFit(
              element.clientWidth,
              element.clientHeight,
            );

            if (next !== fit) {
              fit = next;
              mark.update({ look: { fit } });
            }
          });
        });

  observer?.observe(element);

  return () => {
    window.cancelAnimationFrame(frame);
    observer?.disconnect();
    mark.destroy();
  };
}
