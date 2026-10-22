import { BOOT_SESSION_KEY } from "../data/boot";
import { startBootHero } from "./boot-hero";
import { startBootWordmark } from "./boot-wordmark";

interface BootOptions {
  onEnter: () => void;
}

export function startBoot({ onEnter }: BootOptions): void {
  const boot = document.querySelector<HTMLElement>("[data-terminal-boot]");

  if (!boot) {
    onEnter();
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
  let previouslyConfirmed = false;

  try {
    previouslyConfirmed = sessionStorage.getItem(BOOT_SESSION_KEY) === "1";
  } catch {
    previouslyConfirmed = false;
  }

  if (previouslyConfirmed) {
    boot.hidden = true;
    onEnter();
    return;
  }

  let active = true;
  let stopHero = (): void => undefined;
  let stopWordmark = (): void => undefined;

  if (content) {
    try {
      stopHero = startBootHero(boot, content);
    } catch {
      stopHero = () => undefined;
    }
  }

  if (wordmark) {
    void startBootWordmark(wordmark)
      .then((stop) => {
        if (active) {
          stopWordmark = stop;
        } else {
          stop();
        }
      })
      .catch(() => undefined);
  }

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const finish = (): void => {
    if (!active) {
      return;
    }

    active = false;
    stopHero();
    stopWordmark();
    document.removeEventListener("keydown", handleKey, true);
    boot.hidden = true;

    try {
      sessionStorage.setItem(BOOT_SESSION_KEY, "1");
    } catch {
      // Session storage may be unavailable in private contexts.
    }

    onEnter();
  };

  const cancel = (): void => {
    if (!active) {
      return;
    }

    if (question) {
      question.hidden = true;
    }

    if (cancelBlock) {
      cancelBlock.hidden = false;
      cancelBlock.focus({ preventScroll: true });
    }
  };

  const showPrompt = (): void => {
    boot.classList.remove("is-typing");
    lines.forEach((line) => line.classList.add("is-visible"));

    if (question) {
      question.hidden = false;
      question.focus({ preventScroll: true });
    }
  };

  const reveal = (): void => {
    if (reducedMotion || lines.length === 0) {
      showPrompt();
      return;
    }

    boot.classList.add("is-typing");
    lines.forEach((line, index) => {
      window.setTimeout(() => {
        line.classList.add("is-visible");
      }, index * 65);
    });

    window.setTimeout(showPrompt, lines.length * 65 + 120);
  };

  const handleKey = (event: KeyboardEvent): void => {
    if (!active) {
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
  document.addEventListener("keydown", handleKey, true);

  reveal();
}
