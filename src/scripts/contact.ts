import {
  decode,
  toastStack,
  type DecodeHandle,
  type ToastStackHandle,
} from "asciify-engine/kit";
import { site } from "../data/site";

const boot = document.querySelector<HTMLElement>("[data-terminal-boot]");
const output = document.querySelector<HTMLElement>("[data-terminal-output]");
const title = document.querySelector<HTMLElement>("[data-contact-title]");
const copyButton = document.querySelector<HTMLButtonElement>(
  "[data-contact-copy]",
);
const panel = document.querySelector<HTMLElement>("[data-contact-tui]");
const navOptions = panel
  ? Array.from(panel.querySelectorAll<HTMLElement>("[data-contact-nav]"))
  : [];
const status = document.querySelector<HTMLElement>("#terminal-status");

let decodeHandle: DecodeHandle | null = null;
let toastHandle: ToastStackHandle | null = null;
let toastHost: HTMLElement | null = null;
let outputObserver: MutationObserver | null = null;
let started = false;

function notify(titleText: string, body: string): void {
  if (toastHandle) {
    toastHandle.push({ title: titleText, body });
    return;
  }

  if (status) {
    status.textContent = `${titleText}: ${body}`;
  }
}

async function copyText(value: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard unavailable");
  }

  await navigator.clipboard.writeText(value);
}

async function copyEmail(): Promise<void> {
  try {
    await copyText(site.email);
    notify("email copied", site.email);
  } catch {
    notify("copy failed", site.email);
  }
}

function handleCopyClick(): void {
  void copyEmail();
}

function getCenter(element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function resolveNavOrigin(): HTMLElement | null {
  const active = document.activeElement;

  if (!(active instanceof HTMLElement)) {
    return null;
  }

  if (navOptions.includes(active)) {
    return active;
  }

  return (
    active
      .closest(".contact-card")
      ?.querySelector<HTMLElement>("[data-contact-nav]") ?? null
  );
}

function findDirectionalOption(
  origin: HTMLElement,
  direction: string,
): HTMLElement | null {
  const originCenter = getCenter(origin);
  const horizontal = direction === "ArrowLeft" || direction === "ArrowRight";
  const positive = direction === "ArrowRight" || direction === "ArrowDown";
  const crossThreshold = horizontal ? 0.75 : 0.25;
  let best: { option: HTMLElement; score: number } | null = null;

  for (const option of navOptions) {
    if (option === origin) {
      continue;
    }

    const center = getCenter(option);
    const dx = center.x - originCenter.x;
    const dy = center.y - originCenter.y;
    const signedAxis = horizontal ? dx : dy;
    const axis = Math.abs(signedAxis);
    const cross = Math.abs(horizontal ? dy : dx);

    if (positive ? signedAxis <= 1 : signedAxis >= -1) {
      continue;
    }

    if (axis < cross * crossThreshold) {
      continue;
    }

    const score = axis + cross * 0.5;

    if (!best || score < best.score) {
      best = { option, score };
    }
  }

  return best?.option ?? null;
}

function handlePanelKeyDown(event: KeyboardEvent): void {
  if (event.key === "Escape" || event.key === "Backspace") {
    event.preventDefault();
    window.location.assign("/");
    return;
  }

  if (
    event.key !== "ArrowDown" &&
    event.key !== "ArrowUp" &&
    event.key !== "ArrowLeft" &&
    event.key !== "ArrowRight"
  ) {
    return;
  }

  if (navOptions.length === 0) {
    return;
  }

  const origin = resolveNavOrigin();

  if (!origin) {
    return;
  }

  event.preventDefault();

  const next = findDirectionalOption(origin, event.key);

  next?.focus({ preventScroll: true });
}

function watchTitle(): void {
  if (!output || !title) {
    return;
  }

  outputObserver = new MutationObserver(() => {
    if (title.isConnected) {
      return;
    }

    decodeHandle?.destroy();
    decodeHandle = null;
    outputObserver?.disconnect();
    outputObserver = null;
  });
  outputObserver.observe(output, { childList: true });
}

function start(): void {
  if (started) {
    return;
  }

  started = true;

  if (title) {
    try {
      decodeHandle = decode(title, {
        scramble: true,
        settle: "text",
        duration: 1200,
      });
    } catch {
      decodeHandle = null;
    }
  }

  if (copyButton) {
    toastHost = document.createElement("div");
    toastHost.className = "contact-toasts";
    document.body.append(toastHost);

    try {
      toastHandle = toastStack(toastHost, {
        max: 2,
        duration: 3200,
        label: "Contact notifications",
      });
    } catch {
      toastHandle = null;
      toastHost.remove();
      toastHost = null;
    }

    copyButton.addEventListener("click", handleCopyClick);
  }

  watchTitle();

  panel?.addEventListener("keydown", handlePanelKeyDown);

  window.requestAnimationFrame(() => {
    if (panel?.contains(document.activeElement)) {
      return;
    }

    navOptions[0]?.focus({ preventScroll: true });
  });
}

if (!boot || boot.hidden) {
  start();
} else {
  let bootObserver: MutationObserver | null = new MutationObserver(() => {
    if (!boot.hidden) {
      return;
    }

    bootObserver?.disconnect();
    bootObserver = null;
    start();
  });

  bootObserver.observe(boot, {
    attributes: true,
    attributeFilter: ["hidden"],
  });
}

window.addEventListener(
  "pagehide",
  () => {
    decodeHandle?.destroy();
    decodeHandle = null;
    toastHandle?.destroy();
    toastHandle = null;
    toastHost?.remove();
    toastHost = null;
    outputObserver?.disconnect();
    outputObserver = null;
    copyButton?.removeEventListener("click", handleCopyClick);
    panel?.removeEventListener("keydown", handlePanelKeyDown);
  },
  { once: true },
);
