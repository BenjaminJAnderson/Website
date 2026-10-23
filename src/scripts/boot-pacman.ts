import { BOOT_SESSION_KEY } from "../data/boot";
import {
  BOOT_BACKGROUND_FADE_MS,
  startBootHero,
  type BootHero,
} from "./boot-hero";
import { BOOT_WORDMARK_ASSEMBLE_MS, startBootWordmark } from "./boot-wordmark";

const INTRO_HOLD_MS = 150;
const EXIT_WORDMARK_MS = 700;
const EXIT_PULSE_DELAY_MS = 250;
const EXIT_FADE_DELAY_MS = 1400;
const EXIT_FADE_MS = 900;
const EXIT_TOTAL_MS = EXIT_FADE_DELAY_MS + EXIT_FADE_MS;

interface BootOptions {
  onReveal?: () => void;
  onEnter: (freshBoot: boolean) => void;
}

interface SequenceStep {
  key: string;
  dots?: number;
  delay: number;
}

const sequence: SequenceStep[] = [
  { key: "sync", dots: 800, delay: 180 },
  { key: "core", delay: 180 },
  { key: "extra", delay: 220 },
  { key: "sync-blank", delay: 80 },
  { key: "install", dots: 900, delay: 220 },
  { key: "resolve", delay: 260 },
  { key: "looking", delay: 340 },
  { key: "install-blank", delay: 80 },
  { key: "packages", delay: 200 },
  { key: "description", delay: 200 },
  { key: "depends", delay: 200 },
  { key: "summary-blank", delay: 80 },
  { key: "download", delay: 180 },
  { key: "installed", delay: 180 },
  { key: "final-blank", delay: 80 },
];

export function startBoot({ onEnter, onReveal }: BootOptions): void {
  const boot = document.querySelector<HTMLElement>("[data-terminal-boot]");

  if (!boot) {
    onEnter(false);
    return;
  }

  const content = document.querySelector<HTMLElement>(
    "[data-terminal-boot-content]",
  );
  const wordmark = document.querySelector<HTMLElement>(
    "[data-terminal-boot-wordmark]",
  );
  const lines = Array.from(
    document.querySelectorAll<HTMLElement>("[data-boot-line]"),
  );
  const question = document.querySelector<HTMLElement>("[data-boot-question]");
  const cancelBlock = document.querySelector<HTMLElement>("[data-boot-cancel]");
  const yes = document.querySelector<HTMLButtonElement>("[data-boot-yes]");
  const no = document.querySelector<HTMLButtonElement>("[data-boot-no]");
  const continueButton = document.querySelector<HTMLButtonElement>(
    "[data-boot-continue]",
  );
  const answerInput =
    document.querySelector<HTMLInputElement>("[data-boot-answer]");
  const answerHint = document.querySelector<HTMLElement>(
    "[data-boot-answer-hint]",
  );
  const lineMap = new Map(
    lines
      .filter((line) => line.dataset.bootKey)
      .map((line) => [line.dataset.bootKey as string, line]),
  );

  let previouslyConfirmed = false;

  try {
    previouslyConfirmed = sessionStorage.getItem(BOOT_SESSION_KEY) === "1";
  } catch {
    previouslyConfirmed = false;
  }

  if (previouslyConfirmed) {
    boot.hidden = true;
    onEnter(false);
    return;
  }

  let active = true;
  let canceled = false;
  let exiting = false;
  let introStarted = false;
  let promptActive = false;
  let sequenceToken = 0;
  let hero: BootHero | null = null;
  let stopWordmark = (): void => undefined;
  let wordmarkAnimation: Animation | null = null;
  const timers = new Set<number>();

  const schedule = (fn: () => void, ms: number): number => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);

    timers.add(id);
    return id;
  };

  const clearTimers = (): void => {
    for (const id of timers) {
      window.clearTimeout(id);
    }

    timers.clear();
  };

  const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => {
      schedule(resolve, ms);
    });

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const completeExit = (): void => {
    if (!active) {
      return;
    }

    active = false;
    exiting = false;
    promptActive = false;
    clearTimers();
    wordmarkAnimation?.cancel();
    wordmarkAnimation = null;
    hero?.destroy();
    hero = null;
    stopWordmark();
    document.removeEventListener("keydown", handleKey, true);
    boot.hidden = true;
    boot.classList.remove("is-leaving");

    try {
      sessionStorage.setItem(BOOT_SESSION_KEY, "1");
    } catch {
      // Session storage may be unavailable in private contexts.
    }

    onEnter(true);
  };

  const finish = (): void => {
    if (!active || exiting) {
      return;
    }

    exiting = true;
    promptActive = false;
    sequenceToken += 1;
    clearTimers();
    document.removeEventListener("keydown", handleKey, true);

    if (reducedMotion) {
      onReveal?.();
      completeExit();
      return;
    }

    if (wordmark) {
      wordmarkAnimation = wordmark.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(0.82)" },
          { transform: "scale(1.18)" },
          { transform: "scale(1)" },
        ],
        {
          duration: EXIT_WORDMARK_MS,
          easing: "cubic-bezier(.23, 1, .32, 1)",
        },
      );
    }

    schedule(() => {
      if (active && exiting) {
        hero?.pulse(wordmark ?? undefined);
      }
    }, EXIT_PULSE_DELAY_MS);

    schedule(() => {
      if (!active || !exiting) {
        return;
      }

      boot.classList.add("is-leaving");
      onReveal?.();
    }, EXIT_FADE_DELAY_MS);

    schedule(completeExit, EXIT_TOTAL_MS);
  };

  const cancel = (): void => {
    if (!active || exiting) {
      return;
    }

    canceled = true;
    promptActive = false;
    sequenceToken += 1;
    clearTimers();
    boot.classList.add("is-background-visible");

    if (question) {
      question.hidden = true;
    }

    if (cancelBlock) {
      cancelBlock.hidden = false;
      cancelBlock.focus({ preventScroll: true });
    }
  };

  const updateAnswerWidth = (): void => {
    if (!answerInput) {
      return;
    }

    answerInput.style.width = `${answerInput.value.length}ch`;
  };

  const showAnswerHint = (): void => {
    if (!answerHint) {
      return;
    }

    answerHint.hidden = false;
  };

  const submitAnswer = (): void => {
    if (!answerInput) {
      finish();
      return;
    }

    const value = answerInput.value.trim().toLowerCase();

    if (!value || value === "y" || value === "yes") {
      finish();
      return;
    }

    if (value === "n" || value === "no") {
      cancel();
      return;
    }

    answerInput.value = "";
    updateAnswerWidth();
    showAnswerHint();
  };

  const showPrompt = (): void => {
    boot.classList.remove("is-typing");
    lines.forEach((line) => line.classList.add("is-visible"));
    promptActive = true;

    if (question) {
      question.hidden = false;
      schedule(() => {
        question.classList.add("is-visible");
      }, 20);
    }

    schedule(() => {
      if (answerInput) {
        updateAnswerWidth();
        answerInput.focus({ preventScroll: true });
      } else if (question) {
        question.focus({ preventScroll: true });
      }
    }, 40);
  };

  const animateDots = async (
    line: HTMLElement,
    duration: number,
    token: number,
  ): Promise<void> => {
    const dots = line.querySelector<HTMLElement>("[data-boot-dots]");

    if (!dots) {
      return;
    }

    const frames = [".", "..", "..."];
    const start = performance.now();
    let index = 0;

    while (performance.now() - start < duration) {
      if (!active || token !== sequenceToken) {
        return;
      }

      dots.textContent = frames[index % frames.length];
      index += 1;
      await sleep(300);
    }

    dots.textContent = "...";
  };

  const runTextSequence = async (): Promise<void> => {
    const token = sequenceToken;

    for (const step of sequence) {
      if (!active || token !== sequenceToken) {
        return;
      }

      const line = lineMap.get(step.key);

      if (!line) {
        continue;
      }

      line.classList.add("is-visible");

      if (step.dots) {
        await animateDots(line, step.dots, token);
      }

      await sleep(step.delay);
    }

    if (active && token === sequenceToken) {
      showPrompt();
    }
  };

  const startIntro = (): void => {
    if (!active || canceled || exiting || introStarted) {
      return;
    }

    introStarted = true;

    if (reducedMotion) {
      boot.classList.add("is-background-visible");
      showPrompt();
      return;
    }

    schedule(() => {
      if (!active || canceled) {
        return;
      }

      boot.classList.add("is-background-visible");
      schedule(runTextSequence, BOOT_BACKGROUND_FADE_MS + INTRO_HOLD_MS);
    }, BOOT_WORDMARK_ASSEMBLE_MS + INTRO_HOLD_MS);
  };

  if (content) {
    try {
      hero = startBootHero(boot, content);
    } catch {
      hero = null;
    }
  }

  boot.classList.add("is-typing");

  if (reducedMotion) {
    startIntro();
  }

  if (wordmark) {
    void startBootWordmark(wordmark)
      .then((stop) => {
        if (active) {
          stopWordmark = stop;

          if (!exiting && !reducedMotion) {
            startIntro();
          }
        } else {
          stop();
        }
      })
      .catch(() => {
        if (active && !reducedMotion) {
          startIntro();
        }
      });
  } else if (!reducedMotion) {
    startIntro();
  }

  const handleKey = (event: KeyboardEvent): void => {
    if (!active || promptActive) {
      return;
    }

    if (event.key === "y" || event.key === "Y") {
      event.preventDefault();
      finish();
      return;
    }

    if (event.key === "n" || event.key === "N") {
      event.preventDefault();
      cancel();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (document.activeElement === no) {
        cancel();
      } else {
        finish();
      }
    }
  };

  yes?.addEventListener("click", finish);
  no?.addEventListener("click", cancel);
  continueButton?.addEventListener("click", finish);
  answerInput?.addEventListener("input", () => {
    updateAnswerWidth();

    if (answerHint) {
      answerHint.hidden = true;
    }
  });
  answerInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitAnswer();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      answerInput.value = "";
      updateAnswerWidth();
    }
  });
  document.addEventListener("keydown", handleKey, true);
}
