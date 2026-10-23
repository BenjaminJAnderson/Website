import { cursorTrail, type CursorTrailHandle } from "asciify-engine/kit";
import type { CursorTrailPreference } from "../data/trails";

const TRAIL_INK = "--ascii-ink-strong";
const TRAIL_CHARSET = " .:-=+*#%@";
const TRAIL_CELL_SIZE = 9;

let handle: CursorTrailHandle | null = null;

export function destroyCursorTrail(): void {
  handle?.destroy();
  handle = null;
}

export function applyCursorTrail(
  preference: CursorTrailPreference,
): CursorTrailHandle | null {
  destroyCursorTrail();

  if (preference === "off") {
    return null;
  }

  try {
    handle = cursorTrail({
      style: preference,
      ink: TRAIL_INK,
      charset: TRAIL_CHARSET,
      cellSize: TRAIL_CELL_SIZE,
      globalLook: true,
    });
  } catch {
    handle = null;
  }

  return handle;
}

export function getCursorTrailHandle(): CursorTrailHandle | null {
  return handle;
}
