import { fieldBackground } from "asciify-engine/kit";

const art = document.querySelector<HTMLElement>("[data-not-found-art]");
const home = document.querySelector<HTMLAnchorElement>("[data-not-found-home]");

if (art) {
  const lost = fieldBackground(art, {
    preset: "notFound",
    text: "404",
    ink: "--ascii-ink-strong",
  });

  const goHome = async (event: MouseEvent): Promise<void> => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    try {
      await lost.scatter(home ?? undefined);
    } catch {
      // Navigation should still happen if the scatter animation fails.
    }

    window.location.assign("/");
  };

  home?.addEventListener("click", (event) => {
    void goHome(event);
  });

  window.addEventListener(
    "pagehide",
    () => {
      lost.destroy();
    },
    { once: true },
  );
}
