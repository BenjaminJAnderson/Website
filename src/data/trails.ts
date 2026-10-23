import type { CursorTrailStyle } from "asciify-engine/kit";

export type CursorTrailPreference = CursorTrailStyle | "off";

export interface CursorTrailOption {
  id: CursorTrailPreference;
  label: string;
  description: string;
}

export const CURSOR_TRAIL_STORAGE_KEY = "engiebenji.cursor-trail";
export const defaultCursorTrail: CursorTrailPreference = "trail";

export const cursorTrailOptions: readonly CursorTrailOption[] = [
  {
    id: "trail",
    label: "Trail",
    description: "An ink trail that follows the pointer.",
  },
  {
    id: "wake",
    label: "Wake",
    description: "A softer, wider band along the pointer path.",
  },
  {
    id: "water",
    label: "Water",
    description: "Rings that spread from the pointer.",
  },
  {
    id: "sparkle",
    label: "Sparkle",
    description: "Glints scattered along the pointer path.",
  },
  {
    id: "spray",
    label: "Spray",
    description: "Diagonal hatched patches sprayed around the pointer.",
  },
  {
    id: "off",
    label: "Off",
    description: "Disable the cursor trail.",
  },
];

export const cursorTrailById = new Map(
  cursorTrailOptions.map((option) => [option.id, option]),
);

export function normalizeCursorTrailQuery(query: string): string {
  return query.trim().toLowerCase().replace(/[-_]+/g, " ");
}

export function findCursorTrailOption(
  query: string,
): CursorTrailOption | undefined {
  const normalized = normalizeCursorTrailQuery(query);

  if (!normalized) {
    return undefined;
  }

  return cursorTrailOptions.find(
    (option) =>
      normalizeCursorTrailQuery(option.id) === normalized ||
      normalizeCursorTrailQuery(option.label) === normalized,
  );
}

export function isCursorTrailPreference(
  value: unknown,
): value is CursorTrailPreference {
  return (
    typeof value === "string" &&
    cursorTrailById.has(value as CursorTrailPreference)
  );
}

export function normalizeCursorTrailPreference(
  value: string | null | undefined,
): CursorTrailPreference {
  return isCursorTrailPreference(value) ? value : defaultCursorTrail;
}
