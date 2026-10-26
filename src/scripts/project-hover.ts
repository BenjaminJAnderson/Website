import {
  SCRAMBLE_DURATION_MS,
  scrambleFrame,
  shouldScrambleText,
} from "../lib/terminal-effects";
import { getAsciiGlyphs } from "./ascii-charset";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const summaries = document.querySelectorAll<HTMLElement>(
  ".project-case__summary",
);
const states = new WeakMap<
  HTMLElement,
  { source: string; frame: number; start: number }
>();
let stopped = false;

function restore(target: HTMLElement): void {
  const state = states.get(target);

  if (!state) {
    return;
  }

  window.cancelAnimationFrame(state.frame);
  target.textContent = state.source;
  states.delete(target);
}

function restoreAll(): void {
  for (const summary of summaries) {
    const target = summary.querySelector<HTMLElement>(
      "[data-project-scramble]",
    );

    if (target) {
      restore(target);
    }
  }
}

function tick(target: HTMLElement, start: number): void {
  const state = states.get(target);

  if (stopped || !state || reducedMotion.matches) {
    restore(target);
    return;
  }

  const progress = (performance.now() - start) / SCRAMBLE_DURATION_MS;

  if (progress >= 1) {
    restore(target);
    return;
  }

  target.textContent = scrambleFrame(state.source, progress, getAsciiGlyphs());
  state.frame = window.requestAnimationFrame(() => tick(target, start));
}

function trigger(target: HTMLElement): void {
  if (stopped || reducedMotion.matches) {
    return;
  }

  const previous = states.get(target);

  if (previous) {
    window.cancelAnimationFrame(previous.frame);
  }

  const source = previous?.source ?? target.textContent ?? "";

  if (!shouldScrambleText(source)) {
    return;
  }

  const start = performance.now();
  states.set(target, { source, frame: 0, start });
  tick(target, start);
}

for (const summary of summaries) {
  const target = summary.querySelector<HTMLElement>("[data-project-scramble]");

  if (!target) {
    continue;
  }

  summary.addEventListener("pointerenter", () => trigger(target));
  summary.addEventListener("focusin", () => trigger(target));
}

reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) {
    restoreAll();
  }
});

window.addEventListener(
  "pagehide",
  () => {
    stopped = true;
    restoreAll();
  },
  { once: true },
);
