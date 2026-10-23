import { describe, expect, it } from "vitest";
import {
  REVEAL_STAGGER_MS,
  revealDelay,
  scrambleFrame,
  SCRAMBLE_MAX_LENGTH,
  shouldScrambleText,
} from "../../src/lib/terminal-effects";

describe("terminal effects", () => {
  it("staggers every reveal line without a cap", () => {
    const delays = Array.from({ length: 25 }, (_, index) => revealDelay(index));

    expect(delays[0]).toBe(0);
    expect(delays[3]).toBe(3 * REVEAL_STAGGER_MS);
    expect(delays[24]).toBe(24 * REVEAL_STAGGER_MS);
    expect(new Set(delays).size).toBe(delays.length);
    expect(
      delays.every((delay, index) => delay === index * REVEAL_STAGGER_MS),
    ).toBe(true);
    expect(revealDelay(-2)).toBe(0);
  });

  it("selects short single-line text with letters or numbers", () => {
    expect(shouldScrambleText("available commands:")).toBe(true);
    expect(shouldScrambleText("yes")).toBe(true);
    expect(shouldScrambleText("")).toBe(false);
    expect(shouldScrambleText("   ")).toBe(false);
    expect(shouldScrambleText("--- ::: ---")).toBe(false);
    expect(shouldScrambleText("two\nlines")).toBe(false);
    expect(shouldScrambleText("a".repeat(SCRAMBLE_MAX_LENGTH + 1))).toBe(false);
  });

  it("settles to the source text and preserves spacing", () => {
    expect(scrambleFrame("yes", 1)).toBe("yes");
    expect(scrambleFrame("hello world", 0, "#", () => 0)).toBe("##### #####");
    expect(scrambleFrame("hello, world", 0.5, "#", () => 0)).toBe(
      "hell#, #####",
    );
  });

  it("keeps punctuation and whitespace intact while scrambling", () => {
    const frame = scrambleFrame("a-b c!", 0, "#%", () => 0);
    expect(frame).toHaveLength("a-b c!".length);
    expect(frame[1]).toBe("-");
    expect(frame[3]).toBe(" ");
    expect(frame[5]).toBe("!");
  });
});
