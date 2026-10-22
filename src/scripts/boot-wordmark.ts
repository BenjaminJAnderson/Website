import { wordmark } from "asciify-engine/kit";

export function startBootWordmark(element: HTMLElement): () => void {
  const mark = wordmark(element, {
    text: element.textContent?.trim() || "BENJI",
    font: 'Georgia, "Times New Roman", serif',
    fontWeight: 600,
    ink: "--ascii-ink-strong",
    lazy: false,
    look: {
      hover: "trail",
      cellSize: 6,
      charset: " benji",
    },
  });

  mark.update({
    look: {
      hover: "trail",
      cellSize: 6,
      charset: " benji",
    },
  });

  return () => mark.destroy();
}
