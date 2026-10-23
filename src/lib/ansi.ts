const SGR_PATTERN = /\u001b\[([0-9;]*)m/g;

export interface AnsiStyle {
  fg: number | null;
  bg: number | null;
  bold: boolean;
  dim: boolean;
}

export interface AnsiSegment {
  text: string;
  style: AnsiStyle;
}

function defaultStyle(): AnsiStyle {
  return { fg: null, bg: null, bold: false, dim: false };
}

function applySgr(style: AnsiStyle, params: string): void {
  const codes = params === "" ? ["0"] : params.split(";");

  for (const value of codes) {
    const code = Number.parseInt(value, 10);

    if (!Number.isFinite(code)) {
      continue;
    }

    if (code === 0) {
      Object.assign(style, defaultStyle());
    } else if (code === 1) {
      style.bold = true;
    } else if (code === 2) {
      style.dim = true;
    } else if (code === 22) {
      style.bold = false;
      style.dim = false;
    } else if (code >= 30 && code <= 37) {
      style.fg = code - 30;
    } else if (code === 39) {
      style.fg = null;
    } else if (code >= 40 && code <= 47) {
      style.bg = code - 40;
    } else if (code === 49) {
      style.bg = null;
    } else if (code >= 90 && code <= 97) {
      style.fg = code - 90 + 8;
    } else if (code >= 100 && code <= 107) {
      style.bg = code - 100 + 8;
    }
  }
}

export function parseAnsi(input: string): AnsiSegment[] {
  const segments: AnsiSegment[] = [];
  const style = defaultStyle();
  let cursor = 0;

  for (const match of input.matchAll(SGR_PATTERN)) {
    const index = match.index ?? 0;

    if (index > cursor) {
      segments.push({
        text: input.slice(cursor, index),
        style: { ...style },
      });
    }

    applySgr(style, match[1] ?? "");
    cursor = index + match[0].length;
  }

  if (cursor < input.length) {
    segments.push({ text: input.slice(cursor), style: { ...style } });
  }

  return segments;
}

function styleClasses(style: AnsiStyle): string[] {
  const classes: string[] = [];

  if (style.fg !== null) {
    classes.push(`ansi-fg-${style.fg}`);
  }

  if (style.bg !== null) {
    classes.push(`ansi-bg-${style.bg}`);
  }

  if (style.bold) {
    classes.push("ansi-bold");
  }

  if (style.dim) {
    classes.push("ansi-dim");
  }

  return classes;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function ansiToHtml(input: string): string {
  return parseAnsi(input)
    .map(({ text, style }) => {
      const classes = styleClasses(style);
      const escaped = escapeHtml(text);

      if (classes.length === 0) {
        return escaped;
      }

      return `<span class="${classes.join(" ")}">${escaped}</span>`;
    })
    .join("");
}

export function appendAnsi(parent: Node, input: string): void {
  for (const { text, style } of parseAnsi(input)) {
    const classes = styleClasses(style);

    if (classes.length === 0) {
      parent.appendChild(document.createTextNode(text));
      continue;
    }

    const span = document.createElement("span");
    span.className = classes.join(" ");
    span.textContent = text;
    parent.appendChild(span);
  }
}
