import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Linking } from 'react-native';
import { useTheme } from '../theme';
import { RESOURCES, DISCLAIMER } from '../data/resources';

export default function HelpScreen() {
  const t = useTheme();

  const call = (value) => {
    const digits = value.replace(/\s/g, '');
    Linking.openURL(`tel:${digits}`).catch(() => {});
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
      <View style={s.top}>
        <Text style={[s.mark, { color: t.fg }]}>Help now</Text>
        <Text style={[s.note, { color: t.fgFaint }]}>SOUTH AFRICA</Text>
      </View>

      <Text style={[s.lede, { color: t.fgDim }]}>
        A game is a way to get through ten minutes. It isn't treatment and it isn't a person. These are.
      </Text>

      {RESOURCES.map((r) => (
        <View key={r.name} style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
          <Text style={[s.cardN, { color: t.fg }]}>{r.name}</Text>
          <Text style={[s.cardD, { color: t.fgDim }]}>{r.detail}</Text>
          {r.numbers.map((n) => (
            <View key={n.value} style={{ marginTop: 8 }}>
              <Pressable
                onPress={() => call(n.value)}
                accessibilityRole="button"
                accessibilityLabel={`Call ${r.name} on ${n.value}`}
                style={[s.num, { backgroundColor: t.surface2 }]}
              >
                <Text style={[s.numT, { color: t.fg }]} selectable>{n.value}</Text>
                <Text style={[s.numGo, { color: t.safe }]}>CALL</Text>
              </Pressable>
              <Text style={[s.numL, { color: t.fgFaint }]}>{n.label}</Text>
            </View>
          ))}
        </View>
      ))}

      <Text style={[s.disclaim, { color: t.fgFaint, borderTopColor: t.lineSoft }]}>{DISCLAIMER}</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 },
  mark: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  note: { fontSize: 10, letterSpacing: 1.2, fontWeight: '600' },
  lede: { fontSize: 13.5, lineHeight: 21, marginBottom: 16 },
  card: { borderWidth: 1, borderRadius: 16, padding: 15, marginBottom: 9 },
  cardN: { fontSize: 14.5, fontWeight: '700' },
  cardD: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  num: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 11, borderRadius: 10 },
  numT: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: 0.3 },
  numGo: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  numL: { fontSize: 10.5, marginTop: 3 },
  disclaim: { fontSize: 11.5, lineHeight: 19, marginTop: 22, paddingTop: 16, borderTopWidth: 1 },
});
