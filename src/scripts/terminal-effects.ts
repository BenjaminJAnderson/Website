import {
  revealDelay,
  SCRAMBLE_DURATION_MS,
  scrambleFrame,
  shouldScrambleText,
} from "../lib/terminal-effects";
import { getAsciiGlyphs } from "./ascii-charset";

const APPEAR_ATTRIBUTE = "data-terminal-appear";
const APPEAR_DELAY_PROPERTY = "--terminal-appear-delay";
const SCRAMBLE_SKIP_SELECTOR =
  ".terminal-echo__prompt, .term-ascii, .term-palette, .sr-only, [data-neofetch-logo]";
const SCRAMBLE_MAX_NODES = 24;

interface ScrambleJob {
  node: Text;
  source: string;
  start: number;
}

export interface TerminalEffectsHandle {
  stop: () => void;
}

export function mountTerminalEffects(root: HTMLElement): TerminalEffectsHandle {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pending: HTMLElement[] = [];
  let jobs: ScrambleJob[] = [];
  let revealFrame = 0;
  let scrambleFrameId = 0;
  let stopped = false;

  const restoreJobs = (): void => {
    for (const job of jobs) {
      if (job.node.isConnected) {
        job.node.data = job.source;
      }
    }

    jobs = [];

    if (scrambleFrameId) {
      window.cancelAnimationFrame(scrambleFrameId);
      scrambleFrameId = 0;
    }
  };

  const tickScramble = (now: number): void => {
    scrambleFrameId = 0;

    if (stopped) {
      return;
    }

    const remaining: ScrambleJob[] = [];
    const glyphs = getAsciiGlyphs();

    for (const job of jobs) {
      if (!job.node.isConnected) {
        continue;
      }

      const progress = (now - job.start) / SCRAMBLE_DURATION_MS;

      if (progress >= 1) {
        job.node.data = job.source;
        continue;
      }

      job.node.data = scrambleFrame(job.source, progress, glyphs);
      remaining.push(job);
    }

    jobs = remaining;

    if (jobs.length > 0) {
      scrambleFrameId = window.requestAnimationFrame(tickScramble);
    }
  };

  const startScrambleLoop = (): void => {
    if (!scrambleFrameId) {
      scrambleFrameId = window.requestAnimationFrame(tickScramble);
    }
  };

  const collectTextNodes = (element: HTMLElement): Text[] => {
    const nodes: Text[] = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let current = walker.nextNode();

    while (current && nodes.length < SCRAMBLE_MAX_NODES) {
      const node = current as Text;
      const parent = node.parentElement;

      if (!parent?.closest(SCRAMBLE_SKIP_SELECTOR)) {
        if (shouldScrambleText(node.data)) {
          nodes.push(node);
        }
      }

      current = walker.nextNode();
    }

    return nodes;
  };

  const flushReveal = (): void => {
    revealFrame = 0;

    if (stopped) {
      pending.length = 0;
      return;
    }

    const nodes = pending.splice(0);

    if (reducedMotion.matches) {
      return;
    }

    const now = performance.now();
    const glyphs = getAsciiGlyphs();

    nodes.forEach((node, index) => {
      if (!node.isConnected || node.parentElement !== root) {
        return;
      }

      const delay = revealDelay(index);
      node.setAttribute(APPEAR_ATTRIBUTE, "");
      node.style.setProperty(APPEAR_DELAY_PROPERTY, `${delay}ms`);

      const textNodes = collectTextNodes(node);

      if (textNodes.length === 0) {
        return;
      }

      const start = now + delay;

      for (const textNode of textNodes) {
        const source = textNode.data;
        textNode.data = scrambleFrame(source, 0, glyphs);
        jobs.push({
          node: textNode,
          source,
          start,
        });
      }
    });

    if (jobs.length > 0) {
      startScrambleLoop();
    }
  };

  const scheduleReveal = (): void => {
    if (!revealFrame) {
      revealFrame = window.requestAnimationFrame(flushReveal);
    }
  };

  const observer = new MutationObserver((records) => {
    if (stopped || reducedMotion.matches) {
      return;
    }

    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof HTMLElement && node.parentElement === root) {
          pending.push(node);
        }
      }
    }

    if (pending.length > 0) {
      scheduleReveal();
    }
  });

  const handleMotionChange = (): void => {
    if (reducedMotion.matches) {
      pending.length = 0;
      restoreJobs();
    }
  };

  observer.observe(root, { childList: true });
  reducedMotion.addEventListener("change", handleMotionChange);

  return {
    stop: () => {
      if (stopped) {
        return;
      }

      stopped = true;
      observer.disconnect();
      reducedMotion.removeEventListener("change", handleMotionChange);
      pending.length = 0;

      if (revealFrame) {
        window.cancelAnimationFrame(revealFrame);
        revealFrame = 0;
      }

      restoreJobs();
    },
  };
}
