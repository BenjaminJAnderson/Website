import { chromaSpiral } from "../lib/chroma-spiral";

const colors = ["#9a9a92", "#bdbdb4", "#e2e2d9"];
const maxCells = 9000;
const frameInterval = 1000 / 30;

export function startBootBackground(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return () => undefined;
  }

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  let width = 0;
  let height = 0;
  let cellWidth = 0;
  let cellHeight = 0;
  let cols = 0;
  let rows = 0;
  let fontSize = 20;
  let running = true;
  let frameId = 0;
  let lastFrame = 0;
  let resizeTimer: number | undefined;

  const setup = (): boolean => {
    const rect = canvas.getBoundingClientRect();

    if (rect.width < 1 || rect.height < 1) {
      return false;
    }

    width = rect.width;
    height = rect.height;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textBaseline = "top";
    ctx.textAlign = "left";

    fontSize = 20;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      cellWidth = ctx.measureText("M").width;
      cellHeight = Math.round(fontSize * 1.45);
      cols = Math.max(1, Math.floor(width / cellWidth));
      rows = Math.max(1, Math.floor(height / cellHeight));

      if (cols * rows <= maxCells) {
        break;
      }

      fontSize += 2;
    }

    return true;
  };

  const draw = (time: number): void => {
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, width, height);
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

    const total = cols * rows;
    const chars = new Array<string>(total);
    const colorIndexes = new Uint8Array(total);
    const context = {
      cols,
      rows,
      time,
      aspect: cellWidth / cellHeight,
    };

    for (let index = 0; index < total; index += 1) {
      const x = index % cols;
      const y = Math.floor(index / cols);
      const cell = chromaSpiral({ x, y }, context);

      chars[index] = cell.char;
      colorIndexes[index] = cell.color;
    }

    for (let color = 0; color < colors.length; color += 1) {
      ctx.fillStyle = colors[color];

      for (let index = 0; index < total; index += 1) {
        if (colorIndexes[index] !== color) {
          continue;
        }

        const x = index % cols;
        const y = Math.floor(index / cols);
        ctx.fillText(chars[index], x * cellWidth, y * cellHeight);
      }
    }
  };

  const frame = (now: number): void => {
    if (!running) {
      return;
    }

    if (now - lastFrame >= frameInterval) {
      lastFrame = now;
      draw(now);
    }

    frameId = window.requestAnimationFrame(frame);
  };

  const start = (): void => {
    if (!running) {
      return;
    }

    if (!setup()) {
      return;
    }

    if (reducedMotion) {
      draw(8000);
      return;
    }

    lastFrame = 0;
    window.cancelAnimationFrame(frameId);
    frameId = window.requestAnimationFrame(frame);
  };

  const stopFrame = (): void => {
    window.cancelAnimationFrame(frameId);
    frameId = 0;
  };

  const handleVisibility = (): void => {
    if (document.hidden) {
      stopFrame();
      return;
    }

    if (!reducedMotion && running) {
      lastFrame = 0;
      frameId = window.requestAnimationFrame(frame);
    }
  };

  const handleResize = (): void => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (reducedMotion) {
        setup();
        draw(8000);
        return;
      }

      start();
    }, 150);
  };

  const observer = new ResizeObserver(handleResize);
  observer.observe(canvas);
  document.addEventListener("visibilitychange", handleVisibility);

  if (document.fonts?.ready) {
    void document.fonts.ready.then(start);
  } else {
    start();
  }

  return () => {
    running = false;
    stopFrame();
    window.clearTimeout(resizeTimer);
    observer.disconnect();
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}
