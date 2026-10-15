import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'habilitate.v1';
export const DAY = 86400000;

export const empty = () => ({
  runStart: dayStart(Date.now()),
  banked: 0,
  saves: [],
  resets: [],
  best: 0,
});

export function dayStart(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function saveState(state) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    return false;
  }
}

// Days in the current run, inclusive of today. Day one is the day you started.
export function runDays(state) {
  if (!state) return 0;
  return Math.max(0, Math.floor((dayStart(Date.now()) - dayStart(state.runStart)) / DAY)) + 1;
}

// Level is lifetime sober days: banked days from previous runs plus this run.
// It never decreases. A relapse banks the total and restarts the run counter
// only — see bankRelapse below. This is deliberate: zeroing a long streak is a
// documented trigger for a slip becoming a full return to use.
export function level(state) {
  if (!state) return 0;
  return state.banked + runDays(state);
}

export function bankRelapse(state) {
  return {
    ...state,
    banked: level(state),
    resets: [...state.resets, Date.now()],
    runStart: dayStart(Date.now()),
  };
}

export function recordSave(state, run) {
  return {
    ...state,
    saves: [...state.saves, run],
    best: Math.max(state.best, run.held),
  };
}

// POPIA gives people the right to have their data deleted. This is the whole
// of it: one key, gone, no server copy to chase while backup is unconfigured.
export async function wipeAll() {
  try {
    await AsyncStorage.multiRemove([
      KEY,
      'habilitate.identity.v1',
      'habilitate.session.v1',
      'habilitate.entitlement.v1',
    ]);
    return true;
  } catch (e) {
    return false;
  }
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BLOCKS = ['00–04', '04–08', '08–12', '12–16', '16–20', '20–24'];

// A counsellor report. Plain text so it pastes into anything — WhatsApp, email,
// a clinical note — without needing a PDF viewer on the other end.
export function buildReport(state) {
  const L = level(state);
  const saves = state.saves;
  const won = saves.filter((s) => s.won).length;
  const lines = [];

  lines.push('HABILITATE — SELF-TRACKING SUMMARY');
  lines.push(`Generated ${new Date().toLocaleDateString()}`);
  lines.push('');
  lines.push(`Lifetime sober days: ${L}`);
  lines.push(`Current run: day ${runDays(state)}`);
  lines.push(`Relapses logged: ${state.resets.length}`);
  lines.push('');
  lines.push(`Craving sessions logged: ${saves.length}`);
  lines.push(`Completed the full 90 seconds: ${won}`);
  lines.push(`Longest hold: ${Math.round(state.best)}s`);

  if (saves.length) {
    const grid = DAYS.map(() => BLOCKS.map(() => 0));
    saves.forEach((s) => {
      const d = new Date(s.t);
      grid[(d.getDay() + 6) % 7][Math.floor(d.getHours() / 4)] += 1;
    });
    let peak = { n: 0, day: null, block: null };
    grid.forEach((row, r) =>
      row.forEach((n, c) => {
        if (n > peak.n) peak = { n, day: DAYS[r], block: BLOCKS[c] };
      })
    );
    if (peak.day) {
      lines.push('');
      lines.push(
        `Most frequent craving window: ${peak.day} ${peak.block} (${peak.n} ${peak.n === 1 ? 'session' : 'sessions'})`
      );
    }

    const rts = saves.filter((s) => s.rt).map((s) => s.rt);
    if (rts.length) {
      const avg = Math.round(rts.reduce((a, b) => a + b, 0) / rts.length);
      lines.push(`Mean in-game reaction time: ${avg}ms across ${rts.length} sessions`);
    }

    lines.push('');
    lines.push('RECENT SESSIONS');
    saves.slice(-10).reverse().forEach((s) => {
      const d = new Date(s.t);
      lines.push(
        `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ` +
          `${s.held}s held, ${s.moves} moves` +
          (typeof s.drops === 'number' ? `, ${s.drops} floors lost` : '') +
          (s.rt ? `, ${s.rt}ms reaction` : '')
      );
    });
  }

  lines.push('');
  lines.push('HOW TO READ THIS');
  lines.push('A "craving session" is the user opening an in-app game to get through an urge.');
  lines.push('Timing data reflects when they reached for the app, which is a proxy for craving');
  lines.push('pressure — not a validated clinical measure. Reaction time and floors lost are game');
  lines.push('metrics and have not been validated against any clinical instrument. Treat all of it');
  lines.push('as a conversation starter, not an assessment.');

  return lines.join('\n');
}
