import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { MILESTONES } from '../data/milestones';
import { level, runDays } from '../storage';

export default function PathScreen({ state, onRelapse }) {
  const t = useTheme();
  const L = level(state);
  const run = runDays(state);
  const [armed, setArmed] = useState(false);
  const [logged, setLogged] = useState(false);
  const armTimer = useRef(null);

  const next = MILESTONES.find((m) => m.day > L);
  const nodes = [];
  for (let n = Math.max(1, L - 3); n <= L + 6; n++) nodes.push(n);

  const press = () => {
    if (!armed) {
      setArmed(true);
      armTimer.current = setTimeout(() => setArmed(false), 5000);
      return;
    }
    clearTimeout(armTimer.current);
    setArmed(false);
    setLogged(true);
    onRelapse();
    setTimeout(() => setLogged(false), 2600);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
      <View style={s.top}>
        <Text style={[s.mark, { color: t.fg }]}>
          Habil<Text style={{ color: t.safe }}>itate</Text>
        </Text>
        <Text style={[s.note, { color: t.fgFaint }]}>
          {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
        </Text>
      </View>

      <View style={[s.dial, { backgroundColor: t.surface, borderColor: t.line }]}>
        <Text style={[s.dialLabel, { color: t.fgDim }]}>LEVEL</Text>
        <Text style={[s.dialNum, { color: t.fg }]}>{L}</Text>
        <Text style={[s.dialSub, { color: t.fgDim }]}>
          {next
            ? `${next.day - L} ${next.day - L === 1 ? 'day' : 'days'} to ${next.name.toLowerCase()}`
            : 'Past every marker this app knows about.'}
        </Text>
      </View>

      <View style={s.statRow}>
        {[
          [run, 'This run'],
          [state.saves.length, 'Saves'],
          [`${Math.round(state.best)}s`, 'Best hold'],
        ].map(([v, k]) => (
          <View key={k} style={[s.stat, { backgroundColor: t.surface, borderColor: t.line }]}>
            <Text style={[s.statV, { color: t.fg }]}>{v}</Text>
            <Text style={[s.statK, { color: t.fgFaint }]}>{k.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      <Text style={[s.h2, { color: t.fg }]}>The next stretch</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingVertical: 4 }}>
        {nodes.map((n) => {
          const done = n < L, now = n === L;
          return (
            <View
              key={n}
              style={[
                s.node,
                {
                  backgroundColor: now ? t.safe : done ? t.safeDeep : t.surface,
                  borderColor: now || done ? 'transparent' : t.line,
                  opacity: n > L ? 0.45 : 1,
                },
              ]}
            >
              <Text style={[s.nodeN, { color: now ? t.onAccent : t.fg }]}>{n}</Text>
              <Text style={[s.nodeT, { color: now ? t.onAccent : t.fgFaint }]}>{now ? 'NOW' : 'LVL'}</Text>
            </View>
          );
        })}
      </ScrollView>

      <Text style={[s.h2, { color: t.fg }]}>Markers</Text>
      {MILESTONES.map((m) => {
        const hit = L >= m.day;
        return (
          <View key={m.day} style={[s.row, { borderBottomColor: t.lineSoft }]}>
            <View style={[s.pip, { backgroundColor: hit ? t.gold : 'transparent', borderColor: hit ? 'transparent' : t.line }]}>
              <Text style={[s.pipT, { color: hit ? '#0A0D14' : t.fgFaint }]}>{hit ? '✓' : m.day}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[s.rowName, { color: hit ? t.fg : t.fgDim }]}>{m.name}</Text>
              <Text style={[s.rowMeta, { color: t.fgFaint }]}>
                {hit ? 'Unlocked — stays unlocked' : `Level ${m.day} · ${m.day - L} days out`}
              </Text>
            </View>
          </View>
        );
      })}

      <Pressable onPress={press} style={[s.danger, { borderColor: t.line }]}>
        <Text style={[s.dangerT, { color: logged ? t.safe : t.heat }]}>
          {logged ? 'Logged' : armed ? 'Tap again to confirm' : 'I used today — log it'}
        </Text>
        <Text style={[s.dangerSub, { color: t.fgFaint }]}>
          {logged
            ? `Level ${state.banked} kept. Day one of the next run starts now.`
            : armed
            ? `Level ${L} is banked. Your run counter goes to 1.`
            : 'Your level and markers stay exactly where they are'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 },
  mark: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  note: { fontSize: 10, letterSpacing: 1.2, fontWeight: '600' },
  dial: { borderWidth: 1, borderRadius: 22, paddingVertical: 26, paddingHorizontal: 20, alignItems: 'center' },
  dialLabel: { fontSize: 10, letterSpacing: 1.6, fontWeight: '600' },
  dialNum: { fontSize: 76, fontWeight: '800', letterSpacing: -3, lineHeight: 82, fontVariant: ['tabular-nums'] },
  dialSub: { fontSize: 13 },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  stat: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  statV: { fontSize: 21, fontWeight: '700', letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  statK: { fontSize: 9.5, letterSpacing: 0.8, fontWeight: '600', marginTop: 3 },
  h2: { fontSize: 15, fontWeight: '700', marginTop: 28, marginBottom: 10 },
  node: { width: 52, height: 60, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  nodeN: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  nodeT: { fontSize: 8.5, letterSpacing: 0.8, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1 },
  pip: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  pipT: { fontSize: 11, fontWeight: '700', fontVariant: ['tabular-nums'] },
  rowName: { fontSize: 14, fontWeight: '600' },
  rowMeta: { fontSize: 11.5, marginTop: 1 },
  danger: { marginTop: 22, padding: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  dangerT: { fontSize: 13.5, fontWeight: '700' },
  dangerSub: { fontSize: 11.5, marginTop: 3, textAlign: 'center' },
});
