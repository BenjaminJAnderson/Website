import { describe, expect, it } from "vitest";
import { ansiToHtml, parseAnsi } from "../../src/lib/ansi";

describe("parseAnsi", () => {
  it("parses foreground colours", () => {
    expect(parseAnsi("\u001b[31mred\u001b[0m")).toEqual([
      {
        text: "red",
        style: { fg: 1, bg: null, bold: false, dim: false },
      },
    ]);
  });

  it("parses bright backgrounds and bold text", () => {
    expect(parseAnsi("\u001b[1;104mblock\u001b[0m")[0]).toEqual({
      text: "block",
      style: { fg: null, bg: 12, bold: true, dim: false },
    });
  });

  it("resets styles between segments", () => {
    const segments = parseAnsi("\u001b[31mred\u001b[0m plain");

    expect(segments[1]).toEqual({
      text: " plain",
      style: { fg: null, bg: null, bold: false, dim: false },
    });
  });

  it("resets bold and dim with code 22", () => {
    const segments = parseAnsi("\u001b[1;2mquiet\u001b[22mopen");

    expect(segments[0]?.style).toEqual({
      fg: null,
      bg: null,
      bold: true,
      dim: true,
    });
    expect(segments[1]?.style).toEqual({
      fg: null,
      bg: null,
      bold: false,
      dim: false,
    });
  });
});

describe("ansiToHtml", () => {
  it("turns SGR codes into style classes", () => {
    expect(ansiToHtml("\u001b[34mblue\u001b[0m")).toBe(
      '<span class="ansi-fg-4">blue</span>',
    );
  });

  it("renders background blocks", () => {
    expect(ansiToHtml("\u001b[40m   \u001b[0m")).toBe(
      '<span class="ansi-bg-0">   </span>',
    );
  });

  it("escapes HTML in plain and styled text", () => {
    expect(ansiToHtml("a < b & c")).toBe("a &lt; b &amp; c");
    expect(ansiToHtml("\u001b[31m<red>\u001b[0m")).toBe(
      '<span class="ansi-fg-1">&lt;red&gt;</span>',
    );
  });
});
