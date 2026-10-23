const TYPING_HOLD_MS = 480;
const RESOLVE_MS = 170;
const RESOLVE_TICK_MS = 32;
const RESOLVE_TICKS = 4;
const MAX_RESOLVE_CHARS = 8;
const GLYPHS = ["#", "%", "*", "+", "=", ":", "-"];

export interface TerminalCursorHandle {
  sync: () => void;
  destroy: () => void;
}

export function mountTerminalCursor(
  input: HTMLInputElement,
): TerminalCursorHandle {
  const field = input.closest<HTMLElement>("[data-terminal-field]");
  const measure = field?.querySelector<HTMLElement>("[data-terminal-measure]");
  const cursor = field?.querySelector<HTMLElement>("[data-terminal-cursor]");

  if (!field || !measure || !cursor) {
    return { sync: () => undefined, destroy: () => undefined };
  }

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let typingTimer = 0;
  let charWidth = 0;
  let destroyed = false;

  const getCharWidth = (): number => {
    if (charWidth > 0) {
      return charWidth;
    }

    const previous = measure.textContent;
    measure.textContent = "M";
    charWidth = measure.getBoundingClientRect().width || 8;
    measure.textContent = previous;

    return charWidth;
  };

  const positionCursor = (): void => {
    const value = input.value;
    const selection = input.selectionEnd ?? value.length;
    const before = value.slice(0, selection);
    measure.textContent = before;

    const measured = measure.getBoundingClientRect().width;
    const width = getCharWidth();
    const maxLeft = Math.max(0, input.clientWidth - width);
    const left = Math.max(0, Math.min(maxLeft, measured - input.scrollLeft));

    cursor.style.left = `${left}px`;
  };

  const sync = (): void => {
    if (destroyed || frame) {
      return;
    }

    frame = window.requestAnimationFrame(() => {
      frame = 0;

      if (!destroyed) {
        positionCursor();
      }
    });
  };

  const markTyping = (): void => {
    field.classList.add("is-typing");
    window.clearTimeout(typingTimer);
    typingTimer = window.setTimeout(() => {
      field.classList.remove("is-typing");
    }, TYPING_HOLD_MS);
  };

  const randomGlyph = (): string =>
    GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? "#";

  const spawnResolve = (index: number, value: string): void => {
    const character = value[index];

    if (!character || /\s/.test(character)) {
      return;
    }

    measure.textContent = value.slice(0, index);
    const left = measure.getBoundingClientRect().width - input.scrollLeft;

    if (left < 0 || left >= input.clientWidth) {
      return;
    }

    const overlay = document.createElement("span");
    overlay.className = "terminal-prompt__glyph";
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.left = `${left}px`;
    overlay.textContent = randomGlyph();
    field.append(overlay);

    let ticks = 0;
    const interval = window.setInterval(() => {
      if (!overlay.isConnected) {
        window.clearInterval(interval);
        return;
      }

      ticks += 1;
      overlay.textContent = randomGlyph();

      if (ticks >= RESOLVE_TICKS) {
        window.clearInterval(interval);
      }
    }, RESOLVE_TICK_MS);

    window.setTimeout(() => {
      window.clearInterval(interval);
      overlay.remove();
    }, RESOLVE_MS);
  };

  const handleInput = (event: Event): void => {
    markTyping();
    sync();

    if (motionQuery.matches || !(event instanceof InputEvent)) {
      return;
    }

    if (event.isComposing || event.inputType !== "insertText" || !event.data) {
      return;
    }

    const selection = input.selectionStart;

    if (selection === null) {
      return;
    }

    const value = input.value;
    const count = Math.min(event.data.length, MAX_RESOLVE_CHARS);
    const start = Math.max(0, selection - count);

    for (let index = 0; index < count; index += 1) {
      spawnResolve(start + index, value);
    }
  };

  const handleSelectionChange = (): void => {
    if (document.activeElement === input) {
      sync();
    }
  };

  input.addEventListener("input", handleInput);
  input.addEventListener("keydown", markTyping);
  input.addEventListener("keyup", sync);
  input.addEventListener("click", sync);
  input.addEventListener("select", sync);
  input.addEventListener("focus", sync);
  input.addEventListener("blur", sync);
  input.addEventListener("scroll", sync);
  input.addEventListener("compositionupdate", sync);
  input.addEventListener("compositionend", sync);
  document.addEventListener("selectionchange", handleSelectionChange);
  window.addEventListener("resize", sync);

  void document.fonts.ready
    .then(() => {
      charWidth = 0;
      sync();
    })
    .catch(() => undefined);

  field.classList.add("has-block-cursor");
  sync();

  return {
    sync,
    destroy: () => {
      destroyed = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(typingTimer);
      input.removeEventListener("input", handleInput);
      input.removeEventListener("keydown", markTyping);
      input.removeEventListener("keyup", sync);
      input.removeEventListener("click", sync);
      input.removeEventListener("select", sync);
      input.removeEventListener("focus", sync);
      input.removeEventListener("blur", sync);
      input.removeEventListener("scroll", sync);
      input.removeEventListener("compositionupdate", sync);
      input.removeEventListener("compositionend", sync);
      document.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("resize", sync);
      field.classList.remove("has-block-cursor", "is-typing");
      field
        .querySelectorAll(".terminal-prompt__glyph")
        .forEach((node) => node.remove());
    },
  };
}
