import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useTheme, mix } from '../theme';
import { hasFeature } from '../billing';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BLOCKS = ['00–04', '04–08', '08–12', '12–16', '16–20', '20–24'];
const MIN_RUNS = 4;

export default function PatternsScreen({ state, entitlement, onWantPaywall }) {
  const t = useTheme();
  const saves = state.saves;
  const unlocked = hasFeature(entitlement, 'patterns-heatmap');

  const grid = DAYS.map(() => BLOCKS.map(() => 0));
  let max = 0;
  saves.forEach((s) => {
    const d = new Date(s.t);
    const wd = (d.getDay() + 6) % 7;
    const bl = Math.floor(d.getHours() / 4);
    grid[wd][bl] += 1;
    if (grid[wd][bl] > max) max = grid[wd][bl];
  });

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
      <View style={st.top}>
        <Text style={[st.mark, { color: t.fg }]}>Patterns</Text>
        <Text style={[st.note, { color: t.fgFaint }]}>FROM YOUR RUNS</Text>
      </View>

      <Text style={[st.lede, { color: t.fgDim }]}>
        The app doesn't ask you to rate your mood, because nobody does that honestly at 11pm. It uses
        when you opened the arena instead. Enough runs and the dark squares show you which hours are
        actually dangerous for you.
      </Text>

      {saves.length < MIN_RUNS ? (
        <View style={[st.empty, { backgroundColor: t.surface, borderColor: t.line }]}>
          <Text style={[st.emptyT, { color: t.fgDim }]}>
            The grid fills in after a few runs.{'\n'}
            <Text style={{ color: t.fg, fontWeight: '700' }}>{saves.length} of {MIN_RUNS}</Text> logged so far.
          </Text>
        </View>
      ) : !unlocked ? (
        <Pressable
          onPress={() => onWantPaywall('Your danger-hours map is part of Plus.')}
          style={[st.locked, { backgroundColor: t.surface, borderColor: t.gold }]}
        >
          <Text style={[st.lockedH, { color: t.gold }]}>PLUS</Text>
          <Text style={[st.lockedT, { color: t.fg }]}>
            {saves.length} sessions are logged and ready to map.
          </Text>
          <Text style={[st.lockedD, { color: t.fgDim }]}>
            The map shows which day and which hours your cravings actually cluster in. Your run log
            below stays free either way.
          </Text>
          <Text style={[st.lockedL, { color: t.safe }]}>See what Plus adds</Text>
        </Pressable>
      ) : (
        <View>
          <View style={st.headRow}>
            <View style={{ width: 34 }} />
            {BLOCKS.map((b) => (
              <Text key={b} style={[st.headC, { color: t.fgFaint }]}>{b}</Text>
            ))}
          </View>
          {DAYS.map((d, r) => (
            <View key={d} style={st.gridRow}>
              <Text style={[st.dayL, { color: t.fgFaint }]}>{d}</Text>
              {BLOCKS.map((b, c) => {
                const v = grid[r][c];
                const a = max ? v / max : 0;
                return (
                  <View
                    key={b}
                    style={[
                      st.cell,
                      {
                        backgroundColor: v ? mix(t.heat, t.surface2, 0.18 + a * 0.82) : t.surface2,
                        borderColor: v ? 'transparent' : t.lineSoft,
                      },
                    ]}
                  />
                );
              })}
            </View>
          ))}
          <View style={st.legend}>
            <View style={[st.key, { backgroundColor: t.surface2 }]} />
            <Text style={[st.legendT, { color: t.fgFaint }]}>none</Text>
            <View style={[st.key, { backgroundColor: mix(t.heat, t.surface2, 0.45) }]} />
            <Text style={[st.legendT, { color: t.fgFaint }]}>some</Text>
            <View style={[st.key, { backgroundColor: t.heat }]} />
            <Text style={[st.legendT, { color: t.fgFaint }]}>your worst hours</Text>
          </View>
        </View>
      )}

      <Text style={[st.h2, { color: t.fg }]}>Run log</Text>
      {saves.length === 0 ? (
        <View style={[st.empty, { backgroundColor: t.surface, borderColor: t.line }]}>
          <Text style={[st.emptyT, { color: t.fgDim }]}>No runs yet.</Text>
        </View>
      ) : (
        saves
          .slice(-12)
          .reverse()
          .map((s, i) => {
            const d = new Date(s.t);
            return (
              <View key={i} style={[st.row, { borderBottomColor: t.lineSoft }]}>
                <View style={[st.pip, { backgroundColor: s.won ? t.safe : t.surface3 }]}>
                  <Text style={{ color: s.won ? t.onAccent : t.fgDim, fontSize: 11, fontWeight: '700' }}>
                    {s.won ? '✓' : '·'}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[st.rowName, { color: t.fg }]}>{s.held} seconds held</Text>
                  <Text style={[st.rowMeta, { color: t.fgFaint }]}>
                    {d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} ·{' '}
                    {d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {s.moves} moves
                    {s.rt ? ` · ${s.rt}ms reaction` : ''}
                  </Text>
                </View>
              </View>
            );
          })
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 },
  mark: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  note: { fontSize: 10, letterSpacing: 1.2, fontWeight: '600' },
  lede: { fontSize: 13.5, lineHeight: 21, marginBottom: 16 },
  headRow: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  headC: { flex: 1, fontSize: 9, textAlign: 'center' },
  gridRow: { flexDirection: 'row', gap: 4, marginBottom: 4, alignItems: 'center' },
  dayL: { width: 34, fontSize: 10 },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 7, borderWidth: 1 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  key: { width: 16, height: 9, borderRadius: 3 },
  legendT: { fontSize: 11, marginRight: 4 },
  locked: { borderWidth: 1.5, borderRadius: 18, padding: 18 },
  lockedH: { fontSize: 10, letterSpacing: 1.3, fontWeight: '700' },
  lockedT: { fontSize: 14.5, fontWeight: '600', marginTop: 8 },
  lockedD: { fontSize: 12.5, lineHeight: 19, marginTop: 6 },
  lockedL: { fontSize: 13.5, fontWeight: '700', marginTop: 12 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: 20, alignItems: 'center' },
  emptyT: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  h2: { fontSize: 15, fontWeight: '700', marginTop: 28, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1 },
  pip: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontSize: 14, fontWeight: '600' },
  rowMeta: { fontSize: 11.5, marginTop: 1 },
});
