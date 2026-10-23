import { mountChromaSurface } from "./chroma-surface";

export const BOOT_BACKGROUND_FADE_MS = 1000;

export interface BootHero {
  destroy: () => void;
  pulse: (element?: HTMLElement) => void;
}

export function startBootHero(
  host: HTMLElement,
  clearElement: HTMLElement,
): BootHero {
  const chroma = mountChromaSurface(host, {
    clear: clearElement,
  });

  return {
    destroy: chroma.destroy,
    pulse: (element) => {
      chroma.pulse(element ?? host, 1.4);
    },
  };
}
