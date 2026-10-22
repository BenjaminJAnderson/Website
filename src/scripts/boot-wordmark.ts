import { wordmark } from "asciify-engine/kit";

export const BOOT_WORDMARK_ASSEMBLE_MS = 1800;

export async function startBootWordmark(
  element: HTMLElement,
): Promise<() => void> {
  try {
    await document.fonts.load('400 16px "Old London"');
  } catch {
    // The fallback face still lets the wordmark mount.
  }

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
      cellSize: 6,
      hover: "none",
    },
  });

  return () => mark.destroy();
}
