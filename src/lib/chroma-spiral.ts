const density = "ben";

interface Vec2 {
  x: number;
  y: number;
}

export interface SpiralContext {
  cols: number;
  rows: number;
  time: number;
  aspect: number;
}

export interface SpiralCell {
  char: string;
  color: 0 | 1 | 2;
}

function vec2(x = 0, y = 0): Vec2 {
  return { x, y };
}

function map(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

function add(a: Vec2, b: Vec2, out: Vec2): Vec2 {
  out.x = a.x + b.x;
  out.y = a.y + b.y;
  return out;
}

function subN(v: Vec2, n: number, out: Vec2): Vec2 {
  out.x = v.x - n;
  out.y = v.y - n;
  return out;
}

function mulN(v: Vec2, n: number, out: Vec2): Vec2 {
  out.x = v.x * n;
  out.y = v.y * n;
  return out;
}

function rot(v: Vec2, angle: number, out: Vec2): Vec2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const x = v.x * cos - v.y * sin;
  const y = v.x * sin + v.y * cos;

  out.x = x;
  out.y = y;
  return out;
}

function length(v: Vec2): number {
  return Math.hypot(v.x, v.y);
}

export function chromaSpiral(
  coord: { x: number; y: number },
  context: SpiralContext,
): SpiralCell {
  const t = context.time * 0.0002;
  const m = Math.min(context.cols, context.rows);
  const st = vec2(
    (2 * (coord.x - context.cols / 2) * context.aspect) / m,
    (2 * (coord.y - context.rows / 2)) / m,
  );
  const temp = vec2();

  for (let i = 0; i < 3; i += 1) {
    const offset = i * 3;
    const v = vec2(Math.sin(t * 3 + offset), Math.cos(t * 2 + offset));

    add(st, v, st);
    const angle = -t + length(subN(st, 0.5, temp));
    rot(st, angle, st);
  }

  mulN(st, 0.6, st);

  const s = Math.cos(t) * 2;
  let c = Math.sin(st.x * 3 + s) + Math.sin(st.y * 21);
  c = map(Math.sin(c * 0.5), -1, 1, 0, 1);

  const charIndex = Math.min(
    density.length - 1,
    Math.max(0, Math.floor(c * density.length)),
  );
  return {
    char: density[charIndex] ?? density[0],
    color: charIndex as 0 | 1 | 2,
  };
}
