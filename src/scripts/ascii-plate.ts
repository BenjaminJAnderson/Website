const plates = document.querySelectorAll<HTMLElement>("[data-ascii-plate]");

function shouldHandle(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

for (const plate of plates) {
  const viewer = plate.nextElementSibling;

  if (!(viewer instanceof HTMLDialogElement)) {
    continue;
  }

  for (const trigger of plate.querySelectorAll<HTMLAnchorElement>(
    "[data-ascii-plate-open]",
  )) {
    trigger.addEventListener("click", (event) => {
      if (!shouldHandle(event)) {
        return;
      }

      event.preventDefault();

      if (!viewer.open) {
        viewer.showModal();
      }
    });
  }

  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) {
      viewer.close();
    }
  });

  viewer
    .querySelector("[data-ascii-plate-close]")
    ?.addEventListener("click", () => {
      viewer.close();
    });
}

const proseViewer = document.querySelector<HTMLDialogElement>(
  "[data-prose-image-viewer]",
);

if (proseViewer) {
  const image = proseViewer.querySelector<HTMLImageElement>(
    "[data-prose-image-viewer-image]",
  );
  const caption = proseViewer.querySelector<HTMLElement>(
    "[data-prose-image-viewer-caption]",
  );

  const openViewer = (link: HTMLAnchorElement): void => {
    const src = link.getAttribute("href");

    if (!src || !image || !caption) {
      return;
    }

    const label = (link.textContent ?? "").replace(/^image:\s*/i, "").trim();

    image.src = src;
    image.alt = label;
    caption.textContent = label;
    proseViewer.setAttribute("aria-label", `Image: ${label}`);

    if (!proseViewer.open) {
      proseViewer.showModal();
    }
  };

  for (const link of document.querySelectorAll<HTMLAnchorElement>(
    '.project-prose a[href^="/project-images/"]:not([data-ascii-plate-open])',
  )) {
    link.addEventListener("click", (event) => {
      if (!shouldHandle(event)) {
        return;
      }

      event.preventDefault();
      openViewer(link);
    });
  }

  proseViewer.addEventListener("click", (event) => {
    if (event.target === proseViewer) {
      proseViewer.close();
    }
  });

  proseViewer
    .querySelector("[data-prose-image-viewer-close]")
    ?.addEventListener("click", () => {
      proseViewer.close();
    });
}
