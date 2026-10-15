// Arena logic — Hex-A-Gone rules, three stacked floors.
//
// The core loop is the Fall Guys one: the floor does not collapse on a timer,
// it collapses because YOU WERE STANDING ON IT. Every tile you leave crumbles
// behind you, and standing still crumbles the tile under your feet. You cannot
// camp and you cannot retrace your steps.
//
// When the tile under you goes, you do not die — you drop to the floor below
// and keep playing. Three floors, three drops. Only going through the bottom
// ends the round early.
//
// That structure is the whole point of this screen. A bad night costs you a
// floor, not the game, and the app says so out loud. Do not refactor falling
// into failure.

export const N = 7;
export const CX = 3;
export const CY = 3;
const R2 = 9.5;

export const LAYERS = 3;        // free
export const PLUS_LAYERS = 5;   // Plus: more room to fall before a round ends
export const ROUND_SECONDS = 90;

// A tile you walk off holds this long before it goes.
export const CRUMBLE_AFTER_LEAVE = 550;
// How long you may stand on one tile. Tightens as the round runs on, so the
// pressure escalates without the rules ever changing.
export const STAND_START = 3000;
export const STAND_END = 1600;
// Stun after dropping a floor — you get a beat to find your feet.
export const FALL_PAUSE = 450;

export const VOID = null;
export const SAFE = 'safe';
export const CRUMBLE = 'crumble';
export const GONE = 'gone';

export function inArena(x, y) {
  const dx = x - CX;
  const dy = y - CY;
  return dx * dx + dy * dy <= R2;
}

export function xy(i) {
  return [i % N, Math.floor(i / N)];
}

export function adjacent(a, b) {
  const [ax, ay] = xy(a);
  const [bx, by] = xy(b);
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by)) === 1;
}

export function newFloor() {
  const cells = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) cells.push(inArena(x, y) ? SAFE : VOID);
  }
  return cells;
}

export function newRound(layers = LAYERS) {
  const floors = [];
  for (let i = 0; i < layers; i++) floors.push(newFloor());
  return {
    floors,
    layers,
    layer: layers - 1, // top floor
    tile: CY * N + CX,
    pending: [], // [{ layer, tile, at }] tiles mid-crumble
    moves: 0,
    drops: 0,
    reactions: [],
    standingSince: 0,
    stunnedUntil: 0,
  };
}

export function playable(cells) {
  const out = [];
  for (let i = 0; i < cells.length; i++) if (cells[i] !== VOID) out.push(i);
  return out;
}

export function neighbours(i) {
  const out = [];
  for (let j = 0; j < N * N; j++) {
    const [x, y] = xy(j);
    if (inArena(x, y) && adjacent(i, j)) out.push(j);
  }
  return out;
}

// Where you can jump right now. A crumbling tile still bears weight — taking it
// is a real option and a real risk, which is where the tension lives.
export function escapes(cells, tile) {
  return neighbours(tile).filter((i) => cells[i] === SAFE || cells[i] === CRUMBLE);
}

export function canMoveTo(cells, from, to) {
  if (cells[to] === VOID) return false;
  if (!adjacent(from, to)) return false;
  return cells[to] === SAFE || cells[to] === CRUMBLE;
}

export function tilesLeft(cells) {
  let n = 0;
  for (let i = 0; i < cells.length; i++) if (cells[i] === SAFE || cells[i] === CRUMBLE) n++;
  return n;
}

// Standing allowance shrinks linearly across the round.
export function standMs(elapsedSeconds) {
  const p = Math.min(1, Math.max(0, elapsedSeconds / ROUND_SECONDS));
  return Math.round(STAND_START + (STAND_END - STAND_START) * p);
}

export function formatClock(seconds) {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return m + ':' + String(r).padStart(2, '0');
}

// --- pure state transitions -------------------------------------------------

// Walk off a tile: it starts crumbling, and the tile you land on is yours.
export function step(round, to, now) {
  const cells = round.floors[round.layer];
  if (!canMoveTo(cells, round.tile, to)) return round;
  const from = round.tile;
  const floors = round.floors.map((f, i) => (i === round.layer ? f.slice() : f));
  if (floors[round.layer][from] === SAFE) floors[round.layer][from] = CRUMBLE;
  return {
    ...round,
    floors,
    tile: to,
    moves: round.moves + 1,
    standingSince: now,
    pending: [...round.pending, { layer: round.layer, tile: from, at: now + CRUMBLE_AFTER_LEAVE }],
  };
}

// Stayed too long: the tile under you begins to go.
export function rot(round, now) {
  const cells = round.floors[round.layer];
  if (cells[round.tile] !== SAFE) return round;
  const floors = round.floors.map((f, i) => (i === round.layer ? f.slice() : f));
  floors[round.layer][round.tile] = CRUMBLE;
  return {
    ...round,
    floors,
    pending: [...round.pending, { layer: round.layer, tile: round.tile, at: now + CRUMBLE_AFTER_LEAVE }],
  };
}

// Resolve every crumble whose moment has come.
export function settle(round, now) {
  const due = round.pending.filter((p) => p.at <= now);
  if (!due.length) return round;
  const floors = round.floors.map((f) => f.slice());
  due.forEach((p) => {
    if (floors[p.layer][p.tile] === CRUMBLE) floors[p.layer][p.tile] = GONE;
  });
  return { ...round, floors, pending: round.pending.filter((p) => p.at > now) };
}

export function isFalling(round) {
  return round.floors[round.layer][round.tile] === GONE;
}

// Drop one floor, landing on the same column. If that spot is already gone, you
// keep going. Returns null when you fall out of the bottom.
export function drop(round, now) {
  let layer = round.layer - 1;
  let drops = round.drops + 1;
  while (layer >= 0 && round.floors[layer][round.tile] === GONE) {
    layer -= 1;
    drops += 1;
  }
  if (layer < 0) return null;
  return { ...round, layer, drops, standingSince: now, stunnedUntil: now + FALL_PAUSE };
}
