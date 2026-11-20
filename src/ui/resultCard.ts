// Shareable end-of-run card: a 1080x1920 poster drawn entirely with Canvas 2D
// paths. No images, no network, no DOM reads; the only DOM touch is creating
// the canvas (and, for saving, a temporary <a download>).

export interface ResultCardData {
  headline: string;      // already localized, e.g. "Дожил до ночи 7" / "Все 99 ночей"
  subline: string;       // e.g. "Пережито 6 полных ночей"
  cause: string;         // e.g. "Звонарь настиг за границей света"
  tagsLine: string;      // e.g. "Вынесено бирок: 3"
  buildLabel: string;    // e.g. "Сборка"
  build: string[];       // 0–4 card names, e.g. ["Сухая сердцевина", "Отражатель костра"]
  footer: string;        // game title, e.g. "99 Ночей у Костра"
  night: number;         // 1..99, used for the big numeral and the progress track
  stage: number;         // 0..5 silhouette stage of the monster (more antler forks at higher stages)
  victory: boolean;
  fontFamily?: string;   // CSS font-family to use; default "'BD Mono', ui-monospace, Consolas, monospace"
}

const W = 1080;
const H = 1920;
const M = 72; // side / top / bottom margin
const CX = W / 2;
const TEXT_W = W - M * 2;
const CAP = 0.73; // cap height of the mono faces we use, in em
const DEFAULT_FONT = "'BD Mono', ui-monospace, Consolas, monospace";
const STAGE_NIGHTS = [1, 10, 20, 30, 50, 75];
const LAST_NIGHT = 99;

type RGB = readonly [number, number, number];
type Pt = readonly [number, number];
type Ctx = CanvasRenderingContext2D;

// ---------------------------------------------------------------- colour ---

function hex(h: string): RGB {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: RGB, b: RGB, t: number): RGB {
  const k = Math.min(1, Math.max(0, t));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}
function scale(c: RGB, k: number): RGB {
  return [Math.min(255, c[0] * k), Math.min(255, c[1] * k), Math.min(255, c[2] * k)];
}
function css(c: RGB, a = 1): string {
  return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
}

const INK = hex('#ece6d8');
const EMBER = hex('#bf532f');
const EMBER_EDGE = hex('#ffc56f');
const BRONZE = hex('#c08338');
const CHIP = hex('#23262f');

interface Palette {
  skyTop: RGB; skyMid: RGB; skyLow: RGB; fog: RGB;
  firFar: RGB; firMid: RGB; firNear: RGB;
  groundCold: RGB; groundEdge: RGB; groundWarm: RGB;
  wood: RGB; rim: RGB; scrim: RGB;
}

const NIGHT: Palette = {
  skyTop: hex('#0a1220'), skyMid: hex('#101b2e'), skyLow: hex('#2c4261'), fog: hex('#3a5577'),
  firFar: hex('#22354f'), firMid: hex('#142035'), firNear: hex('#080e18'),
  groundCold: hex('#121925'), groundEdge: hex('#4d2c22'), groundWarm: hex('#b0602e'),
  wood: hex('#2b2224'), rim: hex('#7794a8'), scrim: hex('#06090f'),
};

const DAWN: Palette = {
  skyTop: hex('#5a5270'), skyMid: hex('#6b5d7b'), skyLow: hex('#c79aa2'), fog: hex('#d9b3b0'),
  firFar: hex('#a17f93'), firMid: hex('#6a5873'), firNear: hex('#2f283a'),
  groundCold: hex('#473d4c'), groundEdge: hex('#6c4d4c'), groundWarm: hex('#a8704c'),
  wood: hex('#2b2224'), rim: hex('#e2bfb0'), scrim: hex('#17121c'),
};

// ---------------------------------------------------------------- helpers ---

/** Deterministic PRNG so the same run always yields the same picture. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function trace(ctx: Ctx, pts: readonly Pt[], dx = 0, dy = 0): void {
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (i === 0) ctx.moveTo(p[0] + dx, p[1] + dy);
    else ctx.lineTo(p[0] + dx, p[1] + dy);
  }
  ctx.closePath();
}

function fillPoly(ctx: Ctx, pts: readonly Pt[], style: string): void {
  trace(ctx, pts);
  ctx.fillStyle = style;
  ctx.fill();
}

/** A plank: a quad around the axis a→b with widths w1 (at a) and w2 (at b). */
function taper(a: Pt, b: Pt, w1: number, w2: number): Pt[] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return [
    [a[0] + nx * w1 / 2, a[1] + ny * w1 / 2],
    [b[0] + nx * w2 / 2, b[1] + ny * w2 / 2],
    [b[0] - nx * w2 / 2, b[1] - ny * w2 / 2],
    [a[0] - nx * w1 / 2, a[1] - ny * w1 / 2],
  ];
}

function pointAt(line: readonly Pt[], f: number): Pt {
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < line.length; i++) {
    const l = Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
    seg.push(l);
    total += l;
  }
  let d = clamp(f, 0, 1) * total;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const t = seg[i] > 0 ? d / seg[i] : 0;
      return [
        line[i][0] + (line[i + 1][0] - line[i][0]) * t,
        line[i][1] + (line[i + 1][1] - line[i][1]) * t,
      ];
    }
    d -= seg[i];
  }
  return line[line.length - 1];
}

function rotate(pts: readonly Pt[], ox: number, oy: number, a: number): Pt[] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return pts.map((p): Pt => {
    const x = p[0] - ox;
    const y = p[1] - oy;
    return [ox + x * c - y * s, oy + x * s + y * c];
  });
}

// ------------------------------------------------------------------- text ---

interface TextStyle { size: number; tracking: number; family: string }

function setFont(ctx: Ctx, st: TextStyle): void {
  ctx.font = `400 ${st.size}px ${st.family}`;
}

function graphemes(text: string): string[] {
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const out: string[] = [];
    for (const s of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)) out.push(s.segment);
    return out;
  }
  return Array.from(text);
}

/** Width of `text` in the current font with `tracking` px between glyphs. */
function textWidth(ctx: Ctx, text: string, tracking: number): number {
  const g = graphemes(text);
  let w = 0;
  for (const ch of g) w += ctx.measureText(ch).width;
  return w + tracking * Math.max(0, g.length - 1);
}

function widthOf(ctx: Ctx, text: string, st: TextStyle): number {
  setFont(ctx, st);
  return textWidth(ctx, text, st.size * st.tracking);
}

/** Letter-spaced fill; the canvas letterSpacing property is not universal, so glyphs are placed by hand. */
function drawText(ctx: Ctx, text: string, x: number, y: number, st: TextStyle, color: string, shadow = 0.5): void {
  setFont(ctx, st);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const tr = st.size * st.tracking;
  const g = graphemes(text);
  const pass = (withShadow: boolean): void => {
    ctx.save();
    if (withShadow) {
      ctx.shadowColor = `rgba(4,6,10,${shadow})`;
      ctx.shadowBlur = Math.max(6, st.size * 0.22);
      ctx.shadowOffsetY = Math.max(1, st.size * 0.03);
    }
    ctx.fillStyle = color;
    let cx = x;
    for (const ch of g) {
      ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + tr;
    }
    ctx.restore();
  };
  // Shadow first for the whole run, then clean glyphs, so no glyph is dimmed by its neighbour's shadow.
  if (shadow > 0) pass(true);
  pass(false);
}

function clean(text: string): string {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

function ellipsize(ctx: Ctx, text: string, st: TextStyle, maxW: number): string {
  if (widthOf(ctx, text, st) <= maxW) return text;
  const g = graphemes(text);
  while (g.length > 1) {
    g.pop();
    const t = g.join('').trimEnd() + '…';
    if (widthOf(ctx, t, st) <= maxW) return t;
  }
  return '…';
}

/** Greedy word wrap; a single word wider than the box is broken by glyph. */
function wrap(ctx: Ctx, text: string, st: TextStyle, maxW: number): string[] {
  const lines: string[] = [];
  let line = '';
  const push = (word: string): void => {
    if (widthOf(ctx, word, st) <= maxW) { line = word; return; }
    let part = '';
    for (const ch of graphemes(word)) {
      if (part && widthOf(ctx, part + ch, st) > maxW) { lines.push(part); part = ch; } else part += ch;
    }
    line = part;
  };
  for (const word of text.split(' ')) {
    if (!word) continue;
    if (!line) { push(word); continue; }
    if (widthOf(ctx, `${line} ${word}`, st) <= maxW) line = `${line} ${word}`;
    else { lines.push(line); line = ''; push(word); }
  }
  if (line) lines.push(line);
  return lines;
}

interface Fitted { lines: string[]; st: TextStyle }

/** Largest size in [min, max] at which the text wraps into at most `maxLines`; ellipsis as a last resort. */
function fitLines(ctx: Ctx, text: string, family: string, tracking: number, max: number, min: number, maxW: number, maxLines: number): Fitted {
  for (let size = max; size >= min; size -= 2) {
    const st: TextStyle = { size, tracking, family };
    const lines = wrap(ctx, text, st, maxW);
    if (lines.length <= maxLines) return { lines, st };
  }
  const st: TextStyle = { size: min, tracking, family };
  const lines = wrap(ctx, text, st, maxW).slice(0, maxLines);
  const rest = wrap(ctx, text, st, maxW).slice(maxLines - 1).join(' ');
  lines[maxLines - 1] = ellipsize(ctx, rest, st, maxW);
  return { lines, st };
}

/** Headline: one line if it stays big, otherwise the most balanced two-line split at the largest size that fits. */
function fitHeadline(ctx: Ctx, text: string, family: string, maxW: number): Fitted {
  const tracking = 0.04;
  const MAX = 104;
  const ONE_LINE_MIN = 78;
  const MIN = 46;
  for (let size = MAX; size >= ONE_LINE_MIN; size -= 2) {
    const st: TextStyle = { size, tracking, family };
    if (widthOf(ctx, text, st) <= maxW) return { lines: [text], st };
  }
  const words = text.split(' ').filter(Boolean);
  for (let size = MAX; size >= MIN; size -= 2) {
    const st: TextStyle = { size, tracking, family };
    if (widthOf(ctx, text, st) <= maxW) return { lines: [text], st };
    let best: string[] | null = null;
    let bestW = Infinity;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      const w = Math.max(widthOf(ctx, a, st), widthOf(ctx, b, st));
      if (w <= maxW && w < bestW) { best = [a, b]; bestW = w; }
    }
    if (best) return { lines: best, st };
  }
  return fitLines(ctx, text, family, tracking, MIN, MIN, maxW, 2);
}

// ------------------------------------------------------------------ scene ---

interface Scene {
  ringCY: number;   // centre of the ember ring / the fire
  rx: number;
  ry: number;
  feetY: number;    // where the monster stands
  horizon: number;
  figureTop: number; // topmost y the monster (antler tips) may reach
}

function drawSky(ctx: Ctx, pal: Palette, sc: Scene, victory: boolean): void {
  const g = ctx.createLinearGradient(0, 0, 0, sc.horizon);
  g.addColorStop(0, css(pal.skyTop));
  g.addColorStop(0.42, css(pal.skyMid));
  g.addColorStop(1, css(pal.skyLow));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const r = rng(victory ? 7001 : 4242);
  if (!victory) {
    // sparse faceted stars, thinning toward the fog band
    for (let i = 0; i < 70; i++) {
      const x = r() * W;
      const y = r() * r() * sc.horizon * 0.8;
      const s = 1.2 + r() * 2.2;
      ctx.fillStyle = css(hex('#c9d6e6'), 0.12 + r() * 0.4);
      trace(ctx, [[x, y - s], [x + s, y], [x, y + s], [x - s, y]]);
      ctx.fill();
    }
  } else {
    // long flat dawn clouds
    for (let i = 0; i < 6; i++) {
      const x = r() * W;
      const y = sc.horizon * (0.42 + r() * 0.4);
      const w = 180 + r() * 320;
      const h = 8 + r() * 14;
      ctx.fillStyle = css(hex('#e7b9ad'), 0.12 + r() * 0.12);
      trace(ctx, [[x - w / 2, y], [x - w * 0.2, y - h], [x + w * 0.3, y - h * 0.7], [x + w / 2, y + 2], [x + w * 0.1, y + h * 0.5], [x - w * 0.3, y + h * 0.4]]);
      ctx.fill();
    }
  }
}

function drawMoon(ctx: Ctx, x: number, y: number, rad: number): void {
  const halo = ctx.createRadialGradient(x, y, rad * 0.6, x, y, rad * 4.2);
  halo.addColorStop(0, 'rgba(150,180,214,0.34)');
  halo.addColorStop(0.35, 'rgba(120,150,190,0.12)');
  halo.addColorStop(1, 'rgba(120,150,190,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x - rad * 4.2, y - rad * 4.2, rad * 8.4, rad * 8.4);

  const n = 14;
  const rim: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.2;
    rim.push([x + Math.cos(a) * rad, y + Math.sin(a) * rad]);
  }
  fillPoly(ctx, rim, '#d7dee6');
  // a lit facet fan and a few flat "maria" so the disc reads as low-poly, not a circle
  ctx.save();
  trace(ctx, rim);
  ctx.clip();
  fillPoly(ctx, [[x - rad, y - rad], [x + rad * 0.2, y - rad], [x - rad * 0.1, y + rad * 0.1], [x - rad, y + rad * 0.5]], 'rgba(240,244,248,0.55)');
  fillPoly(ctx, [[x + rad * 0.15, y + rad * 0.2], [x + rad, y - rad * 0.2], [x + rad, y + rad], [x - rad * 0.2, y + rad]], 'rgba(120,140,164,0.34)');
  fillPoly(ctx, [[x - rad * 0.45, y - rad * 0.3], [x - rad * 0.1, y - rad * 0.42], [x + rad * 0.05, y - rad * 0.12], [x - rad * 0.3, y + rad * 0.04]], 'rgba(140,158,180,0.42)');
  fillPoly(ctx, [[x + rad * 0.2, y + rad * 0.3], [x + rad * 0.5, y + rad * 0.22], [x + rad * 0.42, y + rad * 0.55], [x + rad * 0.14, y + rad * 0.56]], 'rgba(130,148,172,0.4)');
  fillPoly(ctx, [[x - rad * 0.5, y + rad * 0.4], [x - rad * 0.24, y + rad * 0.34], [x - rad * 0.3, y + rad * 0.62]], 'rgba(140,158,180,0.36)');
  ctx.restore();
}

function drawSun(ctx: Ctx, x: number, y: number, rad: number): void {
  const glow = ctx.createRadialGradient(x, y, rad * 0.4, x, y, rad * 9);
  glow.addColorStop(0, 'rgba(255,226,196,0.62)');
  glow.addColorStop(0.3, 'rgba(250,196,170,0.24)');
  glow.addColorStop(1, 'rgba(250,196,170,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, y - rad * 9, W, rad * 18);
  const n = 12;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.3;
    pts.push([x + Math.cos(a) * rad, y + Math.sin(a) * rad]);
  }
  fillPoly(ctx, pts, '#f8e2cc');
}

/** One angular fir: stacked drooping tiers, asymmetric, with a slightly lit half. */
function drawFir(ctx: Ctx, x: number, base: number, h: number, halfW: number, tiers: number, r: () => number, body: RGB, lit: string | CanvasGradient | null, litSide: 1 | -1): void {
  const top = base - h;
  const trunkH = h * 0.07;
  const crown = h - trunkH;
  const lean = (r() - 0.5) * halfW * 0.12;
  const side = (dir: 1 | -1): Pt[] => {
    const pts: Pt[] = [];
    for (let i = 0; i < tiers; i++) {
      const t1 = (i + 1) / tiers;
      const tierH = crown / tiers;
      const y1 = top + crown * t1 + (r() - 0.5) * tierH * 0.18;
      const out = halfW * (0.16 + 0.84 * Math.pow(t1, 0.92)) * (0.86 + r() * 0.26);
      const inn = out * (0.36 + r() * 0.14);
      pts.push([x + lean * (1 - t1) + dir * out, y1]);
      if (i < tiers - 1) pts.push([x + lean * (1 - t1) + dir * inn, y1 - tierH * (0.22 + r() * 0.12)]);
    }
    return pts;
  };
  const right = side(1);
  const left = side(-1);
  const tw = Math.max(2, halfW * 0.07);
  const apex: Pt = [x + lean, top];
  const lastY = top + crown;
  const outline: Pt[] = [apex, ...right, [x + tw, lastY - 2], [x + tw, base], [x - tw, base], [x - tw, lastY - 2], ...left.slice().reverse()];
  fillPoly(ctx, outline, css(body));
  if (lit) {
    const half = litSide === 1 ? right : left;
    trace(ctx, [apex, ...half, [x, lastY - 2]]);
    ctx.fillStyle = lit;
    ctx.fill();
  }
}

function drawForestBack(ctx: Ctx, pal: Palette, sc: Scene, victory: boolean): void {
  const r = rng(victory ? 911 : 137);
  // far layer: small, dense, nearly dissolved in the fog band
  for (let x = -30; x < W + 40; x += 34 + r() * 40) {
    const h = 110 + r() * 150;
    drawFir(ctx, x, sc.horizon + 14 + r() * 10, h, h * (0.2 + r() * 0.06), 4 + Math.floor(r() * 2), r, pal.firFar, null, 1);
  }
  // fog between the layers
  let fog = ctx.createLinearGradient(0, sc.horizon - 330, 0, sc.horizon + 60);
  fog.addColorStop(0, css(pal.fog, 0));
  fog.addColorStop(1, css(pal.fog, victory ? 0.5 : 0.42));
  ctx.fillStyle = fog;
  ctx.fillRect(0, sc.horizon - 330, W, 390);

  // middle layer: taller toward the edges so the clearing behind the figure stays open
  const litMid = mix(pal.firMid, pal.fog, victory ? 0.2 : 0.14);
  for (let x = -40; x < W + 60; x += 70 + r() * 70) {
    const edge = clamp(Math.abs(x - CX) / 400, 0, 1);
    const h = (230 + r() * 150) * (0.5 + 0.8 * edge * edge);
    drawFir(ctx, x, sc.horizon + 26 + r() * 16, h, h * (0.2 + r() * 0.05), 5 + Math.floor(r() * 2), r, pal.firMid, css(litMid), 1);
  }
  fog = ctx.createLinearGradient(0, sc.horizon - 200, 0, sc.horizon + 60);
  fog.addColorStop(0, css(pal.fog, 0));
  fog.addColorStop(1, css(pal.fog, victory ? 0.4 : 0.34));
  ctx.fillStyle = fog;
  ctx.fillRect(0, sc.horizon - 200, W, 260);
}

function drawForestFront(ctx: Ctx, pal: Palette, sc: Scene, victory: boolean): void {
  const r = rng(victory ? 3131 : 2718);
  // Big framing firs at the card edges; their inner halves catch a little firelight.
  const glow = victory ? hex('#7a565a') : hex('#6a3220');
  const warm = ctx.createLinearGradient(0, sc.ringCY + 80, 0, sc.ringCY - 620);
  warm.addColorStop(0, css(mix(pal.firNear, glow, victory ? 0.4 : 0.55)));
  warm.addColorStop(0.45, css(mix(pal.firNear, glow, 0.16)));
  warm.addColorStop(1, css(mix(pal.firNear, pal.skyLow, 0.1)));
  const specs: Array<[number, number, number, number, 1 | -1, boolean]> = [
    [-70, sc.ringCY + 150, 1270, 250, 1, false],
    [W + 80, sc.ringCY + 170, 1340, 270, -1, false],
    [62, sc.ringCY + 60, 880, 150, 1, true],
    [W - 44, sc.ringCY + 40, 800, 140, -1, true],
  ];
  for (const [x, base, h, hw, side, lit] of specs) {
    drawFir(ctx, x, base, h, hw, 8 + Math.floor(r() * 2), r, pal.firNear, lit ? warm : null, side);
  }
}

function drawGround(ctx: Ctx, pal: Palette, sc: Scene, victory: boolean): void {
  const r = rng(victory ? 606 : 505);
  const rows = 22;
  const cols = 17;
  const x0 = -90;
  const span = W + 180;
  const depth = H - sc.horizon + 40;
  const grid: Pt[][] = [];
  for (let k = 0; k <= rows; k++) {
    const row: Pt[] = [];
    const y = sc.horizon + depth * Math.pow(k / rows, 1.45);
    const yNext = sc.horizon + depth * Math.pow((k + 1) / rows, 1.45);
    const cell = yNext - y;
    for (let j = 0; j <= cols; j++) {
      const jx = (r() - 0.5) * (span / cols) * 0.62;
      const jy = k === 0 ? (r() - 0.5) * 12 : (r() - 0.5) * cell * 0.62;
      row.push([x0 + (span * j) / cols + jx, y + jy]);
    }
    grid.push(row);
  }
  const fx = CX;
  const fy = sc.ringCY;
  const shade = (a: Pt, b: Pt, c: Pt, bias: number): string => {
    const px = (a[0] + b[0] + c[0]) / 3;
    const py = (a[1] + b[1] + c[1]) / 3;
    const d = Math.hypot((px - fx) / sc.rx, (py - fy) / sc.ry);
    let col: RGB;
    if (d < 1) col = mix(pal.groundEdge, pal.groundWarm, Math.pow(1 - d, 0.85));
    else col = mix(pal.groundCold, pal.groundEdge, Math.exp(-(d - 1) * (victory ? 1.6 : 3.4)) * (victory ? 0.9 : 0.72));
    return css(scale(col, 0.9 + r() * 0.2 + bias));
  };
  for (let k = 0; k < rows; k++) {
    for (let j = 0; j < cols; j++) {
      const a = grid[k][j];
      const b = grid[k][j + 1];
      const c = grid[k + 1][j + 1];
      const d = grid[k + 1][j];
      const flip = r() > 0.5;
      const t1: Pt[] = flip ? [a, b, c] : [a, b, d];
      const t2: Pt[] = flip ? [a, c, d] : [b, c, d];
      for (const [tri, bias] of [[t1, 0.04], [t2, -0.04]] as Array<[Pt[], number]>) {
        const style = shade(tri[0], tri[1], tri[2], bias);
        trace(ctx, tri);
        ctx.fillStyle = style;
        ctx.fill();
        // hairline in the same colour closes anti-aliasing seams between facets
        ctx.strokeStyle = style;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
  // fog lying on the far ground, so the figure's legs read against it
  const fog = ctx.createLinearGradient(0, sc.horizon - 70, 0, sc.horizon + 190);
  fog.addColorStop(0, css(pal.fog, 0));
  fog.addColorStop(0.3, css(pal.fog, victory ? 0.62 : 0.5));
  fog.addColorStop(1, css(pal.fog, 0));
  ctx.fillStyle = fog;
  ctx.fillRect(0, sc.horizon - 70, W, 260);
}

/** Faceted elliptical band between two radii (perspective: thicker toward the viewer). */
function ellipseBand(ctx: Ctx, cx: number, cy: number, rxO: number, ryO: number, rxI: number, ryI: number, lift: number, wobble: readonly number[]): void {
  const n = wobble.length;
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w = wobble[i % n];
    const x = cx + Math.cos(a) * rxO * w;
    const y = cy + Math.sin(a) * ryO * w;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  for (let i = n; i >= 0; i--) {
    const a = (i / n) * Math.PI * 2;
    const w = wobble[i % n];
    const x = cx + Math.cos(a) * rxI * w;
    const y = cy - lift + Math.sin(a) * ryI * w;
    if (i === n) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill('evenodd');
}

function drawEmberRing(ctx: Ctx, sc: Scene, victory: boolean): void {
  const r = rng(99);
  const wobble: number[] = [];
  for (let i = 0; i < 64; i++) wobble.push(0.985 + r() * 0.03);
  const k = victory ? 0.55 : 1;
  // soft heat halo
  ctx.fillStyle = css(EMBER, 0.14 * k);
  ellipseBand(ctx, CX, sc.ringCY, sc.rx + 20, sc.ry + 9, sc.rx - 26, sc.ry - 11, 0, wobble);
  ctx.fillStyle = css(EMBER, 0.22 * k);
  ellipseBand(ctx, CX, sc.ringCY, sc.rx + 9, sc.ry + 4, sc.rx - 14, sc.ry - 6, 0, wobble);
  // the ring itself and its bright inner edge
  ctx.fillStyle = css(victory ? mix(EMBER, hex('#6c4d4c'), 0.45) : EMBER, victory ? 0.85 : 1);
  ellipseBand(ctx, CX, sc.ringCY, sc.rx, sc.ry, sc.rx - 9, sc.ry - 4, 1.2, wobble);
  ctx.fillStyle = css(EMBER_EDGE, victory ? 0.5 : 0.95);
  ellipseBand(ctx, CX, sc.ringCY, sc.rx - 8, sc.ry - 3.6, sc.rx - 11.5, sc.ry - 5.2, 0.9, wobble);
  // loose embers scattered along it
  for (let i = 0; i < 34; i++) {
    const a = r() * Math.PI * 2;
    const off = 0.955 + r() * 0.07;
    const x = CX + Math.cos(a) * sc.rx * off;
    const y = sc.ringCY + Math.sin(a) * sc.ry * off;
    const s = (2 + r() * 3.4) * (0.75 + 0.35 * (Math.sin(a) + 1));
    ctx.fillStyle = css(r() > 0.45 ? EMBER_EDGE : EMBER, (0.6 + r() * 0.4) * (victory ? 0.6 : 1));
    trace(ctx, [[x - s, y], [x, y - s * 0.6], [x + s, y], [x, y + s * 0.6]]);
    ctx.fill();
  }
}

function drawFire(ctx: Ctx, sc: Scene, victory: boolean): void {
  const fx = CX;
  const fy = sc.ringCY + 8;
  const f = victory ? 0.74 : 1;
  const at = (pts: Array<[number, number]>): Pt[] => pts.map(([x, y]): Pt => [fx + x * f, fy + y * f]);
  const r = rng(victory ? 81 : 80);

  // ember bed and the back logs
  fillPoly(ctx, at([[-78, 14], [-40, -6], [44, -8], [82, 12], [52, 28], [-50, 30]]), css(hex('#7a2f1c')));
  fillPoly(ctx, at([[-52, 12], [-20, 0], [30, -2], [54, 12], [26, 22], [-30, 22]]), css(hex('#e0772f')));
  const log = (a: Pt, b: Pt, w: number): void => {
    const q = taper([fx + a[0] * f, fy + a[1] * f], [fx + b[0] * f, fy + b[1] * f], w * f, w * f * 0.9);
    fillPoly(ctx, q, '#2a1912');
    fillPoly(ctx, [q[0], q[1], [(q[1][0] + q[2][0]) / 2, (q[1][1] + q[2][1]) / 2], [(q[0][0] + q[3][0]) / 2, (q[0][1] + q[3][1]) / 2]], '#8a4a26');
  };
  log([-84, 16], [34, -30], 22);
  log([88, 18], [-30, -34], 22);

  // flames, outer to core
  fillPoly(ctx, at([[-54, 4], [-62, -40], [-40, -76], [-47, -122], [-16, -92], [-5, -164], [15, -106], [36, -134], [32, -76], [58, -44], [52, 4]]), css(hex('#d05a2a')));
  fillPoly(ctx, at([[-38, 4], [-42, -34], [-23, -64], [-19, -98], [0, -74], [9, -124], [23, -70], [40, -38], [36, 4]]), css(hex('#f08a30')));
  fillPoly(ctx, at([[-22, 4], [-24, -26], [-9, -50], [2, -86], [15, -44], [24, -22], [20, 4]]), css(EMBER_EDGE));
  fillPoly(ctx, at([[-10, 4], [-9, -18], [2, -44], [11, -16], [9, 4]]), '#fff2cf');

  // front log and stones
  log([-66, 26], [64, 30], 24);
  const stone = (x: number, y: number, s: number): void => {
    const p = at([[x - s, y + s * 0.5], [x - s * 0.7, y - s * 0.4], [x + s * 0.2, y - s * 0.7], [x + s, y - s * 0.1], [x + s * 0.8, y + s * 0.6]]);
    fillPoly(ctx, p, victory ? '#3a3340' : '#1b1a22');
    fillPoly(ctx, [p[1], p[2], p[3], [(p[1][0] + p[3][0]) / 2, (p[1][1] + p[3][1]) / 2 + s * 0.3 * f]], victory ? '#8b6a66' : '#6a3a28');
  };
  stone(-104, 26, 20);
  stone(108, 30, 22);
  stone(-58, 48, 17);
  stone(70, 50, 16);

  // sparks
  for (let i = 0; i < (victory ? 8 : 13); i++) {
    const up = 20 + r() * r() * 260;
    const x = fx + (r() - 0.5) * (60 + up * 0.7) * f;
    const y = fy - (120 + up) * f;
    const s = 2 + r() * 3.5;
    ctx.fillStyle = css(r() > 0.5 ? EMBER_EDGE : hex('#f08a30'), clamp(1 - up / 300, 0.15, 0.95));
    trace(ctx, [[x, y - s], [x + s * 0.8, y], [x, y + s], [x - s * 0.8, y]]);
    ctx.fill();
  }

  // additive glow
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(fx, fy - 50 * f, 10, fx, fy - 50 * f, 380 * f);
  g.addColorStop(0, `rgba(255,170,90,${victory ? 0.3 : 0.42})`);
  g.addColorStop(0.35, `rgba(220,100,50,${victory ? 0.1 : 0.16})`);
  g.addColorStop(1, 'rgba(200,80,40,0)');
  ctx.fillStyle = g;
  ctx.fillRect(fx - 400, fy - 450, 800, 800);
  ctx.restore();
}

// ---------------------------------------------------------------- monster ---

type PartKind = 'wood' | 'woodLit' | 'hollow' | 'bell' | 'bellDark' | 'bellLight';
interface Part { pts: Pt[]; kind: PartKind; tone: number; rim: number }

/** One half of the antler crown, base at the origin, growing up and toward `side`. Tines = 2 + stage. */
function antlerHalf(side: 1 | -1, stage: number, r: () => number): Part[] {
  const k = 1 + 0.045 * stage;
  const parts: Part[] = [];
  const beam: Pt[] = ([[0, 0], [34, -50], [96, -80], [146, -128], [170, -196]] as Array<[number, number]>)
    .map(([x, y]): Pt => [x * k * side, y * k]);
  const bw = [33, 28, 22, 15, 5];
  for (let i = 0; i < beam.length - 1; i++) {
    parts.push({ pts: taper(beam[i], beam[i + 1], bw[i], bw[i + 1]), kind: 'wood', tone: r() * 2 - 1, rim: 0.6 });
  }
  const n = 2 + stage;
  for (let i = 0; i < n; i++) {
    const lo = Math.max(0.13, 0.3 - 0.035 * n);
    const hi = Math.min(0.89, 0.6 + 0.06 * n);
    const f = lo + (hi - lo) * (n === 1 ? 0.5 : i / (n - 1));
    const base = pointAt(beam, f);
    const len = (88 - 36 * f) * k * (0.84 + r() * 0.32);
    const ang = -Math.PI / 2 + side * (0.04 + 0.3 * f + (r() - 0.5) * 0.22);
    const mid: Pt = [base[0] + Math.cos(ang) * len * 0.58, base[1] + Math.sin(ang) * len * 0.58];
    const bend = ang - side * 0.32;
    const tip: Pt = [mid[0] + Math.cos(bend) * len * 0.42, mid[1] + Math.sin(bend) * len * 0.42];
    const w0 = 18 - 6 * f;
    parts.push({ pts: taper(base, mid, w0, w0 * 0.62), kind: 'wood', tone: r() * 2 - 1, rim: 0.45 });
    parts.push({ pts: taper(mid, tip, w0 * 0.62, 2), kind: 'wood', tone: r() * 2 - 1, rim: 0.45 });
    if (stage >= 3 && i % 2 === 1) {
      const fa = ang + side * 0.78;
      const fl = len * 0.42;
      parts.push({ pts: taper(mid, [mid[0] + Math.cos(fa) * fl, mid[1] + Math.sin(fa) * fl], w0 * 0.52, 1.8), kind: 'wood', tone: r() * 2 - 1, rim: 0.4 });
    }
  }
  return parts;
}

/** The Bell-ringer, front view, feet at the origin, y up = negative. About 620 units to the top of the head. */
function monsterParts(stage: number): Part[] {
  const r = rng(1700 + stage * 13);
  const P: Part[] = [];
  const wood = (pts: Pt[], rim = 1): void => { P.push({ pts, kind: 'wood', tone: r() * 2 - 1, rim }); };
  const mir = (pts: Pt[]): Pt[] => pts.map((p): Pt => [-p[0], p[1]]);

  // plank legs and block hooves
  wood(taper([-46, -272], [-57, -142], 48, 38));
  wood(taper([-57, -152], [-64, -24], 36, 44));
  wood([[-96, 0], [-38, 0], [-41, -30], [-86, -34]]);
  wood(taper([48, -272], [53, -140], 48, 38));
  wood(taper([53, -150], [70, -24], 36, 44));
  wood([[44, 0], [104, 0], [95, -34], [49, -30]]);
  // knee blocks
  wood([[-78, -160], [-38, -164], [-40, -132], [-76, -130]]);
  wood([[34, -162], [74, -158], [72, -128], [36, -132]]);

  // long arms hang behind the shoulder boards; three hooked claws each
  wood(taper([-132, -482], [-166, -320], 42, 34));
  wood(taper([-166, -334], [-158, -176], 34, 28));
  wood([[-178, -184], [-140, -182], [-138, -140], [-180, -142]]);
  for (let c = 0; c < 3; c++) {
    const x = -172 + c * 15;
    const knee: Pt = [x - 6, -104];
    wood(taper([x, -146], knee, 12, 8), 0.4);
    wood(taper(knee, [x + 5 + c * 2, -52 - (c === 1 ? 10 : 0)], 8, 1.6), 0.4);
  }
  wood(taper([132, -482], [174, -326], 42, 34));
  wood(taper([174, -340], [190, -186], 34, 28));
  wood([[172, -194], [210, -190], [210, -148], [174, -152]]);
  for (let c = 0; c < 3; c++) {
    const x = 180 + c * 15;
    const knee: Pt = [x + 8, -112];
    wood(taper([x, -154], knee, 12, 8), 0.4);
    wood(taper(knee, [x - 3 + c * 2, -60 - (c === 1 ? 10 : 0)], 8, 1.6), 0.4);
  }

  // pelvis, hollow chest, bell, then the frame boards over the bell's hanger
  wood([[-72, -344], [72, -344], [66, -274], [-66, -274]]);
  P.push({ pts: [[-56, -470], [56, -470], [56, -356], [-56, -356]], kind: 'hollow', tone: 0, rim: 0 });
  P.push({ pts: [[-2.5, -470], [2.5, -470], [2.5, -444], [-2.5, -444]], kind: 'bellDark', tone: 0, rim: 0 });
  P.push({ pts: [[-8, -448], [8, -448], [15, -436], [20, -400], [27, -389], [-27, -389], [-20, -400], [-15, -436]], kind: 'bell', tone: 0, rim: 0 });
  P.push({ pts: [[-8, -448], [-1, -448], [-4, -389], [-27, -389], [-20, -400], [-15, -436]], kind: 'bellDark', tone: 0, rim: 0 });
  P.push({ pts: [[8, -448], [15, -436], [20, -400], [27, -389], [15, -389], [11, -436]], kind: 'bellLight', tone: 0, rim: 0 });
  P.push({ pts: [[0, -389], [7, -381], [0, -373], [-7, -381]], kind: 'bellDark', tone: 0, rim: 0 });
  wood([[-92, -496], [-52, -494], [-50, -338], [-88, -340]]);
  wood([[52, -494], [92, -496], [88, -340], [50, -338]]);
  wood([[-90, -368], [90, -366], [86, -334], [-86, -332]]);
  wood([[-98, -504], [98, -506], [94, -466], [-94, -464]]);

  // skirt of hanging shards
  for (let i = 0; i < 8; i++) {
    const x0 = -88 + i * 21.5 + (r() - 0.5) * 4;
    const w = 25 + r() * 7;
    const tipY = -248 + r() * 46 - (i === 3 || i === 4 ? 34 : 0);
    wood([[x0, -344], [x0 + w, -344], [x0 + w - 2, tipY - 20], [x0 + w / 2 + (r() - 0.5) * 8, tipY], [x0 + 2, tipY - 14]], 0.6);
  }

  // layered shoulder boards
  const sh1: Pt[] = taper([-28, -518], [-154, -464], 32, 27);
  const sh2: Pt[] = taper([-74, -490], [-176, -436], 25, 20);
  wood(sh2);
  wood(mir(taper([-74, -492], [-180, -440], 25, 20)));
  wood(sh1);
  wood(mir(taper([-28, -518], [-158, -468], 32, 27)));

  // neck, then the tilted head group: antlers behind the long eyeless wedge
  wood(taper([0, -504], [3, -566], 34, 26));
  const tilt = -0.075;
  const headGroup: Part[] = [];
  for (const side of [-1, 1] as const) {
    const ar = rng(5200 + stage * 31 + (side === 1 ? 7 : 0));
    for (const part of antlerHalf(side, stage, ar)) {
      headGroup.push({ ...part, pts: part.pts.map((p): Pt => [p[0] + side * 24, p[1] - 640]) });
    }
  }
  headGroup.push({ pts: [[-41, -654], [41, -654], [35, -596], [15, -514], [-13, -514], [-35, -596]], kind: 'wood', tone: -0.3, rim: 1 });
  headGroup.push({ pts: [[4, -654], [41, -654], [35, -596], [15, -514], [2, -514]], kind: 'woodLit', tone: 0, rim: 1 });
  // brow plank where the antlers are bolted on
  headGroup.push({ pts: [[-47, -662], [47, -664], [44, -640], [-45, -638]], kind: 'wood', tone: 0.4, rim: 1 });
  for (const part of headGroup) P.push({ ...part, pts: rotate(part.pts, 0, -560, tilt) });
  return P;
}

function drawParts(ctx: Ctx, parts: readonly Part[], pal: Palette, xf: (p: Pt) => Pt, rimPx: number, warmFrom: number, hollow: string): void {
  const warm = hex('#5a2c20');
  for (const part of parts) {
    const pts = part.pts.map(xf);
    if (part.kind === 'hollow') { fillPoly(ctx, pts, hollow); continue; }
    if (part.kind === 'bell') { fillPoly(ctx, pts, css(BRONZE)); continue; }
    if (part.kind === 'bellDark') { fillPoly(ctx, pts, css(scale(BRONZE, 0.62))); continue; }
    if (part.kind === 'bellLight') { fillPoly(ctx, pts, css(mix(BRONZE, hex('#ffe0a0'), 0.5))); continue; }
    // flat per-plank tone, warmed a little toward the fire at the bottom
    let localY = 0;
    for (const p of part.pts) localY += p[1];
    localY /= part.pts.length;
    let body = part.tone >= 0 ? mix(pal.wood, hex('#3b3033'), part.tone * 0.55) : mix(pal.wood, hex('#1c1618'), -part.tone * 0.6);
    if (part.kind === 'woodLit') body = mix(pal.wood, pal.rim, 0.16);
    if (warmFrom > 0) body = mix(body, warm, clamp(1 - -localY / warmFrom, 0, 1) * 0.5);
    const rw = rimPx * part.rim;
    ctx.save();
    trace(ctx, pts);
    ctx.clip();
    ctx.fillStyle = css(pal.rim);
    ctx.fill();
    // the same plank, shifted away from the light: what is left uncovered is the cold rim
    trace(ctx, pts, -rw, rw * 0.72);
    ctx.fillStyle = css(body);
    ctx.fill();
    ctx.strokeStyle = css(body);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

function drawMonster(ctx: Ctx, pal: Palette, sc: Scene, stage: number): void {
  const parts = monsterParts(stage);
  let minY = 0;
  for (const part of parts) for (const p of part.pts) minY = Math.min(minY, p[1]);
  const REF = 980; // tallest silhouette (stage 5); keeps the body the same size across stages
  const s = (sc.feetY - sc.figureTop) / Math.max(REF, -minY);
  const xf = (p: Pt): Pt => [CX + p[0] * s, sc.feetY + p[1] * s];

  // contact shadow on the fogged ground
  ctx.fillStyle = 'rgba(8,10,16,0.5)';
  ctx.beginPath();
  ctx.ellipse(CX, sc.feetY + 2, 128 * s, 13 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  drawParts(ctx, parts, pal, xf, Math.max(2.6, 5.2 * s), 330, 'rgba(10,8,12,0.82)');

  // a breath of bronze light in the chest so the bell reads at thumbnail size
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const b = xf([0, -414]);
  const g = ctx.createRadialGradient(b[0], b[1], 2, b[0], b[1], 70 * s);
  g.addColorStop(0, 'rgba(192,131,56,0.3)');
  g.addColorStop(1, 'rgba(192,131,56,0)');
  ctx.fillStyle = g;
  ctx.fillRect(b[0] - 80 * s, b[1] - 80 * s, 160 * s, 160 * s);
  ctx.restore();
}

/** Victory: the two halves of the antler crown lie in the ash beside the fire. */
function drawFallenCrown(ctx: Ctx, pal: Palette, sc: Scene): void {
  const r = rng(404);
  const lay = (side: 1 | -1, ox: number, oy: number, ang: number, sz: number): void => {
    // ash bed
    const ash: Pt[] = [];
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 0.82 + r() * 0.3;
      ash.push([ox + side * 130 * sz + Math.cos(a) * 170 * sz * k, oy - 8 * sz + Math.sin(a) * 34 * sz * k]);
    }
    fillPoly(ctx, ash, 'rgba(70,60,72,0.5)');
    fillPoly(ctx, ash.slice(0, 6), 'rgba(168,154,158,0.36)');
    const parts = antlerHalf(side, 4, rng(side === 1 ? 5407 : 5400));
    // a shard of the broken skull plate still attached at the base
    parts.unshift({ pts: [[-side * 26, 14], [side * 16, 18], [side * 22, -18], [-side * 8, -26], [-side * 30, -8]], kind: 'wood', tone: -0.4, rim: 0.8 });
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const xf = (p: Pt): Pt => {
      const x = p[0] * c - p[1] * s;
      const y = p[0] * s + p[1] * c;
      return [ox + x * sz, oy + y * sz * 0.78]; // tipped over onto the ground plane
    };
    // shadow under the antler
    for (const part of parts) {
      trace(ctx, part.pts.map(xf), 4, 7);
      ctx.fillStyle = 'rgba(40,30,44,0.42)';
      ctx.fill();
    }
    drawParts(ctx, parts, pal, xf, 3.4, 0, '');
  };
  lay(-1, CX - 84, sc.ringCY + 60, -0.62, 0.98);
  lay(1, CX + 96, sc.ringCY + 70, 0.66, 0.92);
}

// ---------------------------------------------------------------- overlay ---

function drawVignette(ctx: Ctx, victory: boolean): void {
  const g = ctx.createRadialGradient(CX, H * 0.52, H * 0.3, CX, H * 0.52, H * 0.66);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, victory ? 'rgba(24,16,30,0.26)' : 'rgba(0,0,0,0.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function chamfered(ctx: Ctx, x: number, y: number, w: number, h: number, c: number): void {
  ctx.beginPath();
  ctx.moveTo(x + c, y);
  ctx.lineTo(x + w - c, y);
  ctx.lineTo(x + w, y + c);
  ctx.lineTo(x + w, y + h - c);
  ctx.lineTo(x + w - c, y + h);
  ctx.lineTo(x + c, y + h);
  ctx.lineTo(x, y + h - c);
  ctx.lineTo(x, y + c);
  ctx.closePath();
}

interface ChipLayout { text: string; st: TextStyle; x: number; row: number; w: number }

function layoutChips(ctx: Ctx, names: readonly string[], family: string): { chips: ChipLayout[]; rows: number } {
  const PAD = 24;
  const GAP = 14;
  let best: { chips: ChipLayout[]; rows: number } = { chips: [], rows: 0 };
  // shrink the type before letting the badges spill onto a third row
  for (const size of [28, 26, 24, 22]) {
    const chips: ChipLayout[] = [];
    let x = 0;
    let row = 0;
    for (const name of names) {
      let st: TextStyle = { size, tracking: 0.03, family };
      for (let sz = size; sz >= 18 && widthOf(ctx, name, st) > TEXT_W - PAD * 2; sz -= 2) st = { size: sz, tracking: 0.03, family };
      const text = ellipsize(ctx, name, st, TEXT_W - PAD * 2);
      const w = Math.min(TEXT_W, Math.ceil(widthOf(ctx, text, st)) + PAD * 2);
      if (x > 0 && x + w > TEXT_W) { x = 0; row++; }
      chips.push({ text, st, x, row, w });
      x += w + GAP;
    }
    best = { chips, rows: chips.length ? row + 1 : 0 };
    if (best.rows <= 2) break;
  }
  return best;
}

// ------------------------------------------------------------------- main ---

/** Draws the 1080×1920 card and returns the canvas. */
export function drawResultCard(data: ResultCardData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('resultCard: 2D canvas is not available');

  const family = data.fontFamily && data.fontFamily.trim() ? data.fontFamily : DEFAULT_FONT;
  const victory = !!data.victory;
  const pal = victory ? DAWN : NIGHT;
  const night = clamp(Math.round(Number.isFinite(data.night) ? data.night : 1), 1, LAST_NIGHT);
  const stage = clamp(Math.round(Number.isFinite(data.stage) ? data.stage : 0), 0, 5);
  const accent = EMBER_EDGE;
  // the dawn palette is light, so its text shadows are kept softer
  const shadowK = victory ? 0.62 : 1;
  const put = (text: string, x: number, y: number, st: TextStyle, color: string, shadow = 0.5): void =>
    drawText(ctx, text, x, y, st, color, shadow * shadowK);

  const headline = clean(data.headline);
  const subline = clean(data.subline);
  const cause = clean(data.cause);
  const tagsLine = clean(data.tagsLine);
  const buildLabel = clean(data.buildLabel);
  const footer = clean(data.footer);
  const build = (Array.isArray(data.build) ? data.build : []).map(clean).filter(Boolean).slice(0, 4);

  // ---- measure the two text blocks first; the scene is fitted between them ----
  const numSt: TextStyle = { size: 148, tracking: -0.02, family };
  const numText = String(night);
  const numW = widthOf(ctx, numText, numSt);
  const numBase = M + numSt.size * CAP;

  const head = headline ? fitHeadline(ctx, headline, family, TEXT_W) : { lines: [], st: { size: 96, tracking: 0.04, family } };
  const headLH = head.st.size * 1.14;
  const headTop = numBase + 58;
  const headLast = headTop + head.st.size * CAP + headLH * Math.max(0, head.lines.length - 1);
  const sub = subline ? fitLines(ctx, subline, family, 0.05, 38, 26, TEXT_W, 2) : { lines: [], st: { size: 38, tracking: 0.05, family } };
  const subLH = sub.st.size * 1.3;
  const subFirst = (head.lines.length ? headLast : numBase) + 40 + sub.st.size * CAP;
  const topBottom = sub.lines.length ? subFirst + subLH * (sub.lines.length - 1) + 12 : headLast + 12;

  const BAR = 26; // inset of the cause text behind its ember bar
  const causeFit = cause ? fitLines(ctx, cause, family, 0.03, 36, 28, TEXT_W - BAR, 3) : { lines: [], st: { size: 36, tracking: 0.03, family } };
  const causeLH = causeFit.st.size * 1.32;
  const tagsFit = tagsLine ? fitLines(ctx, tagsLine, family, 0.05, 30, 24, TEXT_W - BAR, 2) : { lines: [], st: { size: 30, tracking: 0.05, family } };
  const tagsLH = tagsFit.st.size * 1.34;
  const labelSt: TextStyle = { size: 22, tracking: 0.22, family };
  const labelText = buildLabel ? ellipsize(ctx, buildLabel, labelSt, TEXT_W) : '';
  const chipLay = layoutChips(ctx, build, family);
  const CHIP_H = 60;
  const CHIP_GAP = 14;
  const footSt: TextStyle = { size: 30, tracking: 0.2, family };
  if (footer) for (let sz = 30; sz >= 20 && widthOf(ctx, footer, footSt) > TEXT_W - 60; sz -= 2) footSt.size = sz;
  const footText = footer ? ellipsize(ctx, footer, footSt, TEXT_W - 60) : '';

  // bottom block, measured bottom-up
  const footBase = H - M;
  const ruleY = footBase - footSt.size * CAP - 30;
  let cursor = ruleY - 36;
  const chipsH = chipLay.rows > 0 ? chipLay.rows * CHIP_H + (chipLay.rows - 1) * CHIP_GAP : 0;
  const chipsTop = cursor - chipsH;
  if (chipLay.rows > 0) cursor = chipsTop - 20;
  const labelBase = cursor;
  if (chipLay.rows > 0 && labelText) cursor -= labelSt.size * CAP + 40;
  else if (chipLay.rows > 0) cursor -= 20;
  const tagsBase = cursor; // baseline of the last tags line
  if (tagsFit.lines.length) cursor -= tagsFit.st.size * CAP + tagsLH * (tagsFit.lines.length - 1) + 26;
  const causeLast = cursor;
  if (causeFit.lines.length) cursor -= causeFit.st.size * CAP + causeLH * (causeFit.lines.length - 1);
  const bottomTop = cursor;

  // ---- scene anchors ----
  const ringCY = Math.max(Math.min(1440, bottomTop - 178), topBottom + 430);
  const rx = 372;
  const ry = 88;
  const feetY = ringCY - ry - 46;
  const sc: Scene = {
    ringCY, rx, ry, feetY,
    horizon: feetY - 74,
    figureTop: Math.max(topBottom + 30, feetY - 880),
  };

  // ---- paint, back to front ----
  drawSky(ctx, pal, sc, victory);
  if (victory) drawSun(ctx, CX + 176, sc.horizon - 150, 50);
  else {
    const fs = (sc.feetY - sc.figureTop) / 980;
    drawMoon(ctx, CX + 250 * fs, sc.figureTop + 172 * fs, clamp(100 * fs, 54, 88));
  }
  drawForestBack(ctx, pal, sc, victory);
  drawGround(ctx, pal, sc, victory);
  if (!victory) drawMonster(ctx, pal, sc, stage);
  drawEmberRing(ctx, sc, victory);
  if (victory) drawFallenCrown(ctx, pal, sc);
  drawFire(ctx, sc, victory);
  drawForestFront(ctx, pal, sc, victory);
  drawVignette(ctx, victory);

  // scrims keep the type legible whatever is behind it
  const top = ctx.createLinearGradient(0, 0, 0, topBottom + 120);
  top.addColorStop(0, css(pal.scrim, victory ? 0.24 : 0.55));
  top.addColorStop(0.7, css(pal.scrim, victory ? 0.14 : 0.3));
  top.addColorStop(1, css(pal.scrim, 0));
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, topBottom + 120);
  const scrimTop = bottomTop - 104;
  const bot = ctx.createLinearGradient(0, scrimTop, 0, H);
  bot.addColorStop(0, css(pal.scrim, 0));
  bot.addColorStop(Math.min(0.5, 104 / (H - scrimTop)), css(pal.scrim, 0.8));
  bot.addColorStop(1, css(pal.scrim, 0.94));
  ctx.fillStyle = bot;
  ctx.fillRect(0, scrimTop, W, H - scrimTop);

  // ---- top block: numeral, track, headline, subline ----
  const ink = css(INK);
  const dim = css(INK, 0.62);
  put(numText, M - numSt.size * 0.04, numBase, numSt, ink);

  const tx0 = M + numW + 40;
  const tx1 = W - M;
  const trackY = numBase - 40;
  const nx = (n: number): number => tx0 + ((n - 1) / (LAST_NIGHT - 1)) * (tx1 - tx0);
  const smallSt: TextStyle = { size: 28, tracking: 0.1, family };
  put(`/ ${LAST_NIGHT}`, tx0, trackY - 30, smallSt, dim);
  ctx.fillStyle = css(INK, 0.26);
  ctx.fillRect(tx0, trackY - 1, tx1 - tx0, 2);
  ctx.fillStyle = css(accent);
  ctx.fillRect(tx0, trackY - 1.5, Math.max(0, nx(night) - tx0), 3);
  const tickSt: TextStyle = { size: 18, tracking: 0.02, family };
  let lastLabelRight = -Infinity;
  for (const n of STAGE_NIGHTS) {
    const x = Math.round(nx(n));
    const reached = n <= night;
    ctx.fillStyle = reached ? css(accent) : css(INK, 0.5);
    ctx.fillRect(x - 1, trackY - 9, 2, 18);
    const label = String(n);
    const lw = widthOf(ctx, label, tickSt);
    const lx = clamp(x - lw / 2, tx0, tx1 - lw);
    if (lx > lastLabelRight + 8) {
      put(label, lx, numBase, tickSt, reached ? css(INK, 0.8) : css(INK, 0.46), 0.4);
      lastLabelRight = lx + lw;
    }
  }
  ctx.fillStyle = css(INK, 0.5);
  ctx.fillRect(tx1 - 2, trackY - 9, 2, 18);
  // current-night marker
  const mx = nx(night);
  ctx.fillStyle = css(pal.scrim, 0.9);
  trace(ctx, [[mx, trackY - 13], [mx + 13, trackY], [mx, trackY + 13], [mx - 13, trackY]]);
  ctx.fill();
  ctx.fillStyle = css(accent);
  trace(ctx, [[mx, trackY - 9], [mx + 9, trackY], [mx, trackY + 9], [mx - 9, trackY]]);
  ctx.fill();

  head.lines.forEach((line, i) => put(line, M, headTop + head.st.size * CAP + headLH * i, head.st, ink, 0.6));
  sub.lines.forEach((line, i) => put(line, M, subFirst + subLH * i, sub.st, css(INK, 0.86)));

  // ---- bottom block: cause, tags, build badges, footer ----
  if (causeFit.lines.length) {
    const first = causeLast - causeLH * (causeFit.lines.length - 1);
    const barTop = first - causeFit.st.size * CAP - 4;
    const barBottom = (tagsFit.lines.length ? tagsBase : causeLast) + 6;
    ctx.fillStyle = css(victory ? accent : EMBER);
    ctx.fillRect(M, barTop, 5, barBottom - barTop);
    causeFit.lines.forEach((line, i) => put(line, M + BAR, first + causeLH * i, causeFit.st, ink));
  }
  tagsFit.lines.forEach((line, i) => put(line, M + (causeFit.lines.length ? BAR : 0), tagsBase - tagsLH * (tagsFit.lines.length - 1 - i), tagsFit.st, css(INK, 0.78)));

  if (chipLay.rows > 0) {
    if (labelText) put(labelText, M, labelBase, labelSt, dim, 0.4);
    for (const chip of chipLay.chips) {
      const x = M + chip.x;
      const y = chipsTop + chip.row * (CHIP_H + CHIP_GAP);
      chamfered(ctx, x + 0.5, y + 0.5, chip.w - 1, CHIP_H - 1, 9);
      ctx.fillStyle = css(CHIP, 0.94);
      ctx.fill();
      ctx.strokeStyle = 'rgba(236,230,216,0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();
      const tw = widthOf(ctx, chip.text, chip.st);
      put(chip.text, x + (chip.w - tw) / 2, y + CHIP_H / 2 + chip.st.size * CAP / 2, chip.st, ink, 0);
    }
  }

  ctx.fillStyle = css(INK, 0.22);
  ctx.fillRect(M, ruleY, TEXT_W, 2);
  if (footText) put(footText, M, footBase, footSt, css(INK, 0.74), 0.4);
  // a small ember mark closes the footer line
  const ex = W - M - 12;
  const ey = footBase - footSt.size * CAP / 2;
  ctx.fillStyle = css(EMBER);
  trace(ctx, [[ex, ey - 12], [ex + 12, ey], [ex, ey + 12], [ex - 12, ey]]);
  ctx.fill();
  ctx.fillStyle = css(EMBER_EDGE);
  trace(ctx, [[ex, ey - 5], [ex + 5, ey], [ex, ey + 5], [ex - 5, ey]]);
  ctx.fill();

  return canvas;
}

/** Draws the card and triggers a PNG download named `filename` (default "99-nights-result.png"). */
export function saveResultCard(data: ResultCardData, filename = '99-nights-result.png'): void {
  const canvas = drawResultCard(data);
  const download = (href: string, done: () => void): void => {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    // give the browser a moment to start the download before the URL goes away
    setTimeout(done, 1500);
  };
  if (typeof canvas.toBlob !== 'function') {
    download(canvas.toDataURL('image/png'), () => undefined);
    return;
  }
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    download(url, () => URL.revokeObjectURL(url));
  }, 'image/png');
}
