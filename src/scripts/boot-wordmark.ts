import { wordmark } from "asciify-engine/kit";

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
    look: {
      charset: " .:-=+*#%@",
      cellSize: 6,
      hover: "none",
    },
  });

  return () => mark.destroy();
}
