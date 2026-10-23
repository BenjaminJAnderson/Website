export const REVEAL_STAGGER_MS = 60;
export const SCRAMBLE_DURATION_MS = 650;
export const SCRAMBLE_MAX_LENGTH = 200;
export const SCRAMBLE_GLYPHS = "#%*+=-:";

export function revealDelay(
  index: number,
  staggerMs = REVEAL_STAGGER_MS,
): number {
  return Math.max(0, Math.floor(index)) * Math.max(0, staggerMs);
}

export function shouldScrambleText(text: string): boolean {
  const value = text.trim();

  return (
    value.length > 0 &&
    value.length <= SCRAMBLE_MAX_LENGTH &&
    !text.includes("\n") &&
    /[\p{L}\p{N}]/u.test(value)
  );
}

export function scrambleFrame(
  text: string,
  progress: number,
  glyphs: string | readonly string[] = SCRAMBLE_GLYPHS,
  random: () => number = Math.random,
): string {
  if (progress >= 1) {
    return text;
  }

  const characters = Array.from(text);
  const scrambleable = characters.map((character) =>
    /[\p{L}\p{N}]/u.test(character),
  );
  const total = scrambleable.filter(Boolean).length;

  if (total === 0) {
    return text;
  }

  const pool =
    typeof glyphs === "string"
      ? Array.from(glyphs || SCRAMBLE_GLYPHS)
      : glyphs.length > 0
        ? glyphs
        : Array.from(SCRAMBLE_GLYPHS);
  const amount = Math.max(0, progress);
  let seen = 0;

  return characters
    .map((character, index) => {
      if (!scrambleable[index]) {
        return character;
      }

      const lockAt = total === 1 ? 0.2 : 0.2 + 0.8 * (seen / (total - 1));
      seen += 1;

      if (amount >= lockAt) {
        return character;
      }

      const pick = Math.floor(random() * pool.length);

      return pool[pick] ?? pool[0] ?? "#";
    })
    .join("");
}
