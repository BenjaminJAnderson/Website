import { mountChromaSurface, type ChromaSurfaceHandle } from "./chroma-surface";

const RIPPLE_PULSE_MS = 1000;
const RIPPLE_STRENGTH = 1.4;

export interface TerminalRippleHandle {
  prime: () => void;
  trigger: (from: HTMLElement) => boolean;
  destroy: () => void;
}

export function mountTerminalRipple(): TerminalRippleHandle {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let host: HTMLDivElement | null = null;
  let surface: ChromaSurfaceHandle | null = null;
  let pauseTimer = 0;
  let destroyed = false;
  let unsupported = false;

  const ensure = (): ChromaSurfaceHandle | null => {
    if (destroyed || unsupported || motionQuery.matches) {
      return null;
    }

    if (surface) {
      return surface;
    }

    host = document.createElement("div");
    host.className = "terminal-ripple";
    host.setAttribute("aria-hidden", "true");
    document.body.append(host);

    surface = mountChromaSurface(host, {
      lazy: false,
    });

    if (!surface.supported) {
      unsupported = true;
      surface.destroy();
      surface = null;
      host.remove();
      host = null;
      return null;
    }

    surface.pause();

    return surface;
  };

  const prime = (): void => {
    ensure();
  };

  const trigger = (from: HTMLElement): boolean => {
    if (destroyed || motionQuery.matches) {
      return false;
    }

    const current = ensure();

    if (!current || !host) {
      return false;
    }

    const rect = from.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      return false;
    }

    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    window.clearTimeout(pauseTimer);
    host.style.setProperty("--terminal-ripple-x", `${x}px`);
    host.style.setProperty("--terminal-ripple-y", `${y}px`);
    host.classList.remove("is-pulsing");
    void host.offsetWidth;
    host.classList.add("is-pulsing");

    current.play();
    current.pulse({ x, y }, RIPPLE_STRENGTH);

    pauseTimer = window.setTimeout(() => {
      host?.classList.remove("is-pulsing");
      current.pause();
    }, RIPPLE_PULSE_MS);

    return true;
  };

  return {
    prime,
    trigger,
    destroy: () => {
      destroyed = true;
      window.clearTimeout(pauseTimer);
      surface?.destroy();
      surface = null;
      host?.remove();
      host = null;
    },
  };
}
