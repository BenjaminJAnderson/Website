export const WORDMARK_SOURCE_ASPECT = 1800 / 520;
export const WORDMARK_CELL_SIZE = 8;

export type WordmarkFit = "cover" | "contain";

export function getWordmarkFit(width: number, height: number): WordmarkFit {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return "contain";
  }

  return width / height < WORDMARK_SOURCE_ASPECT ? "cover" : "contain";
}
