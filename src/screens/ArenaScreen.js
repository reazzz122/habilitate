import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme';
import { hasFeature } from '../billing';
import {
  N, LAYERS, PLUS_LAYERS, VOID, SAFE, CRUMBLE, GONE,
  ROUND_SECONDS, standMs, newRound, step, rot, settle, isFalling, drop,
  canMoveTo, escapes, tilesLeft, formatClock, adjacent,
} from '../game';

const GAP = 5;
const FRAME = 100;

function buzz(style) {
  if (Platform.OS === 'web') return;
  try { Haptics.impactAsync(style); } catch (e) { /* optional */ }
}

export default function ArenaScreen({ state, entitlement, onRunComplete }) {
  const layers = hasFeature(entitlement, 'deep-floors') ? PLUS_LAYERS : LAYERS;
  const t = useTheme();
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);

  const r = useRef(newRound(layers));
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(ROUND_SECONDS);
  const [flash, setFlash] = useState(null);
  const [message, setMessage] = useState(
    'Tap a tile next to you to jump. Every tile you leave crumbles — and standing still crumbles the one under you.'
  );

  const loop = useRef(null);
  const leftRef = useRef(ROUND_SECONDS);
  const runningRef = useRef(false);
  const startedAt = useRef(0);
  const rotWarned = useRef(0);

  const stop = () => clearInterval(loop.current);
  useEffect(() => stop, []);

  const finish = useCallback(
    (survived) => {
      stop();
      runningRef.current = false;
      setRunning(false);
      const held = Math.round(Math.min(ROUND_SECONDS, ROUND_SECONDS - Math.max(0, leftRef.current)));
      const floorsLeft = r.current.layer + 1;
      const rs = r.current.reactions;

      onRunComplete({
        t: Date.now(),
        held,
        won: !!survived,
        moves: r.current.moves,
        drops: r.current.drops,
        floor: survived ? floorsLeft : 0,
        rt: rs.length ? Math.round(rs.reduce((a, b) => a + b, 0) / rs.length) : null,
      });

      if (survived && r.current.drops === 0) {
        setMessage('Ninety seconds and you never lost a floor. Logged as a save.');
      } else if (survived) {
        setMessage(
          `You dropped ${r.current.drops} ${r.current.drops === 1 ? 'floor' : 'floors'} and still finished the ninety. Logged as a save.`
        );
      } else {
        setMessage(
          `You went through all ${r.current.layers} floors at ${held} seconds. That is falling in a game, not relapsing. The clock still ran and the seconds still count — logged as a save.`
        );
      }
      buzz(survived ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
    },
    [onRunComplete]
  );

  const frame = useCallback(() => {
    if (!runningRef.current) return;
    const now = Date.now();
    leftRef.current = ROUND_SECONDS - (now - startedAt.current) / 1000;
    setLeft(leftRef.current);

    r.current = settle(r.current, now);

    if (isFalling(r.current)) {
      const next = drop(r.current, now);
      if (!next) { finish(false); return; }
      const lost = next.drops - r.current.drops;
      r.current = next;
      setFlash(`FLOOR ${next.layer + 1}`);
      setTimeout(() => setFlash(null), 900);
      buzz(Haptics.ImpactFeedbackStyle.Heavy);
      rerender();
      if (lost) { /* drop recorded in round state */ }
    }

    if (now >= r.current.stunnedUntil) {
      const elapsed = (now - startedAt.current) / 1000;
      const allow = standMs(elapsed);
      const held = now - r.current.standingSince;
      if (held > allow) {
        const before = r.current.floors[r.current.layer][r.current.tile];
        r.current = rot(r.current, now);
        if (before === SAFE) { rotWarned.current = now; buzz(Haptics.ImpactFeedbackStyle.Light); }
      }
    }

    if (leftRef.current <= 0) { finish(true); return; }
    rerender();
  }, [finish, rerender]);

  const start = () => {
    stop();
    r.current = newRound(layers);
    const now = Date.now();
    r.current.standingSince = now;
    startedAt.current = now;
    leftRef.current = ROUND_SECONDS;
    setLeft(ROUND_SECONDS);
    setFlash(null);
    runningRef.current = true;
    setRunning(true);
    setMessage('Keep moving. You cannot go back the way you came.');
    rerender();
    loop.current = setInterval(frame, FRAME);
  };

  const go = (to) => {
    if (!runningRef.current) return;
    const now = Date.now();
    if (now < r.current.stunnedUntil) return;
    const cells = r.current.floors[r.current.layer];
    if (!canMoveTo(cells, r.current.tile, to)) return;
    if (rotWarned.current) {
      r.current.reactions.push(now - rotWarned.current);
      rotWarned.current = 0;
    }
    r.current = step(r.current, to, now);
    buzz(Haptics.ImpactFeedbackStyle.Light);
    rerender();
  };

  const width = Dimensions.get('window').width - 32;
  const size = Math.floor((width - GAP * (N - 1)) / N);
  const round = r.current;
  const cells = round.floors[round.layer];
  const below = round.layer > 0 ? round.floors[round.layer - 1] : null;

  const fill = (c, i) => {
    if (c === SAFE) return t.safeDeep;
    if (c === CRUMBLE) return t.warn;
    // Gone: you can see the floor below through the hole.
    if (below) return below[i] === GONE ? t.bg : t.surface2;
    return t.bg;
  };

  return (
    <View style={{ paddingHorizontal: 16 }}>
      <View style={s.top}>
        <Text style={[s.mark, { color: t.fg }]}>The Floor</Text>
        <View style={s.floors}>
          {Array.from({ length: round.layers }).map((_, i) => {
            const idx = round.layers - 1 - i; // top floor first
            return (
              <View
                key={idx}
                style={[
                  s.floorBar,
                  {
                    backgroundColor: idx === round.layer ? t.safe : idx < round.layer ? t.surface3 : t.surface2,
                    opacity: idx > round.layer ? 0.3 : 1,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={s.hud}>
        <Text style={[s.clock, { color: t.fg }]}>{formatClock(left)}</Text>
        <Text style={[s.hudNote, { color: t.fgDim }]}>
          {running
            ? `Floor ${round.layer + 1} of ${round.layers}\n${tilesLeft(cells)} tiles under you`
            : `${state.saves.length} saves logged\nBest hold ${Math.round(state.best)}s`}
        </Text>
      </View>

      <View style={[s.meter, { backgroundColor: t.surface2 }]}>
        <View
          style={{
            height: '100%',
            backgroundColor: t.safe,
            width: `${(100 * (ROUND_SECONDS - left)) / ROUND_SECONDS}%`,
          }}
        />
      </View>

      <View style={{ position: 'relative' }}>
        <View style={[s.grid, { width: size * N + GAP * (N - 1) }]}>
          {cells.map((c, i) => {
            if (c === VOID) return <View key={i} style={{ width: size, height: size, margin: GAP / 2 }} />;
            const isPlayer = i === round.tile;
            const reach = running && !isPlayer && adjacent(i, round.tile) && (c === SAFE || c === CRUMBLE);
            return (
              <Pressable
                key={i}
                onPress={() => go(i)}
                accessibilityRole="button"
                accessibilityLabel={isPlayer ? 'You are here' : c === CRUMBLE ? 'Crumbling tile' : c === GONE ? 'Hole' : 'Tile'}
                style={{
                  width: size,
                  height: size,
                  margin: GAP / 2,
                  borderRadius: 11,
                  backgroundColor: fill(c, i),
                  borderWidth: c === GONE ? 1 : reach ? 2 : 0,
                  borderColor: c === GONE ? t.lineSoft : reach ? t.safe : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isPlayer && (
                  <View
                    style={{
                      width: size * 0.46,
                      height: size * 0.46,
                      borderRadius: size,
                      backgroundColor: '#FFFFFF',
                    }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>

        {flash && (
          <View style={s.flashWrap} pointerEvents="none">
            <Text style={[s.flash, { color: t.warn }]}>{flash}</Text>
            <Text style={[s.flashSub, { color: t.fg }]}>still in it</Text>
          </View>
        )}
      </View>

      <Text style={[s.msg, { color: t.fgDim }]}>{message}</Text>

      <Pressable
        onPress={() => (running ? finish(false) : start())}
        style={[
          s.btn,
          { backgroundColor: running ? t.surface : t.safe, borderWidth: running ? 1 : 0, borderColor: t.line },
        ]}
      >
        <Text style={[s.btnText, { color: running ? t.fg : t.onAccent }]}>
          {running ? 'Give up' : state.saves.length ? 'Back on the floor' : 'Start the clock'}
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  mark: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  floors: { flexDirection: 'column', gap: 3, alignItems: 'flex-end' },
  floorBar: { width: 26, height: 4, borderRadius: 2 },
  hud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  clock: { fontSize: 34, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  hudNote: { fontSize: 11, textAlign: 'right', lineHeight: 16 },
  meter: { height: 5, borderRadius: 99, overflow: 'hidden', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'center' },
  flashWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  flash: { fontSize: 42, fontWeight: '800', letterSpacing: -1.5 },
  flashSub: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  msg: { textAlign: 'center', fontSize: 13.5, lineHeight: 20, paddingTop: 16, minHeight: 60 },
  btn: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  btnText: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.2 },
});
