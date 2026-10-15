import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { offerings, purchase, restore, grantHardship, FEATURE_COPY, PLUS_FEATURES } from '../billing';

// The paywall leads with what stays free, not with what costs money.
//
// That ordering is deliberate. Someone who has met a paywall mid-craving in
// another app arrives here braced for it, and the fastest way to earn the next
// thirty seconds of their attention is to show them the arena and the helplines
// are not for sale. The offer reads better after that, not worse.
export default function PaywallScreen({ onEntitled, onClose, reason }) {
  const t = useTheme();
  const [offer, setOffer] = useState(null);
  const [busy, setBusy] = useState(null);
  const [note, setNote] = useState(null);
  const [confirmHardship, setConfirmHardship] = useState(false);

  useEffect(() => { offerings().then(setOffer); }, []);

  const buy = async (pkg) => {
    setBusy(pkg.key); setNote(null);
    const res = await purchase(pkg);
    setBusy(null);
    if (res.cancelled) return;
    if (res.error) { setNote(res.error); return; }
    onEntitled(res.entitlement);
  };

  const doRestore = async () => {
    setBusy('restore'); setNote(null);
    const res = await restore();
    setBusy(null);
    if (res.error) { setNote(res.error); return; }
    if (res.found) { onEntitled(res.entitlement); return; }
    setNote('No previous purchase found on this store account.');
  };

  const doHardship = async () => {
    const ent = await grantHardship();
    onEntitled(ent);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }}>
      <Text style={[s.h1, { color: t.fg }]}>Habilitate Plus</Text>
      {reason ? <Text style={[s.reason, { color: t.fgDim }]}>{reason}</Text> : null}

      <View style={[s.free, { backgroundColor: t.surface, borderColor: t.safe }]}>
        <Text style={[s.freeH, { color: t.safe }]}>FREE FOREVER, NOT A TRIAL</Text>
        <Text style={[s.freeT, { color: t.fg }]}>
          Your day count and levels. The arena, unlimited. Every helpline. Logging a relapse.
        </Text>
        <Text style={[s.freeS, { color: t.fgDim }]}>
          Nothing that helps you stay stopped is behind a price. If you are in a bad hour right now,
          close this and go to the arena.
        </Text>
      </View>

      <Text style={[s.h2, { color: t.fg }]}>What Plus adds</Text>
      {PLUS_FEATURES.map((f) => (
        <View key={f} style={[s.row, { borderBottomColor: t.lineSoft }]}>
          <View style={[s.dot, { backgroundColor: t.gold }]} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[s.rowN, { color: t.fg }]}>{FEATURE_COPY[f].name}</Text>
            <Text style={[s.rowD, { color: t.fgDim }]}>{FEATURE_COPY[f].detail}</Text>
          </View>
        </View>
      ))}

      <Text style={[s.h2, { color: t.fg }]}>Pick one</Text>
      {!offer ? (
        <ActivityIndicator color={t.safe} style={{ marginVertical: 20 }} />
      ) : (
        offer.packages.map((p, i) => (
          <Pressable
            key={p.key}
            onPress={() => buy(p)}
            disabled={Boolean(busy)}
            style={[
              s.price,
              {
                backgroundColor: i === 1 ? t.safe : t.surface,
                borderColor: i === 1 ? 'transparent' : t.line,
              },
            ]}
          >
            {busy === p.key ? (
              <ActivityIndicator color={i === 1 ? t.onAccent : t.fg} />
            ) : (
              <>
                <Text style={[s.priceL, { color: i === 1 ? t.onAccent : t.fg }]}>{p.label}</Text>
                {p.note ? (
                  <Text style={[s.priceN, { color: i === 1 ? t.onAccent : t.fgDim }]}>{p.note}</Text>
                ) : null}
              </>
            )}
          </Pressable>
        ))
      )}

      {offer && offer.testMode && (
        <Text style={[s.test, { color: t.warn }]}>
          Test mode — no store is connected, so tapping a price unlocks Plus locally without charging
          anything. Add your RevenueCat keys in src/config.js for real purchases.
        </Text>
      )}

      {note && <Text style={[s.note, { color: t.heat }]}>{note}</Text>}

      <View style={[s.hardship, { borderColor: t.line }]}>
        {!confirmHardship ? (
          <Pressable onPress={() => setConfirmHardship(true)}>
            <Text style={[s.hardL, { color: t.safe }]}>I can't afford this</Text>
            <Text style={[s.hardD, { color: t.fgFaint }]}>
              Recovery costs people their income. Tap here and Plus is yours anyway.
            </Text>
          </Pressable>
        ) : (
          <View style={{ gap: 10 }}>
            <Text style={[s.hardD, { color: t.fgDim }]}>
              No questions, no proof, no expiry date. Take it.
            </Text>
            <Pressable onPress={doHardship} style={[s.btnGhost, { borderColor: t.safe }]}>
              <Text style={[s.btnGhostT, { color: t.safe }]}>Unlock Plus for free</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Pressable onPress={doRestore} disabled={Boolean(busy)} style={s.textBtn}>
        <Text style={[s.textBtnT, { color: t.fgDim }]}>
          {busy === 'restore' ? 'Checking…' : 'Restore a previous purchase'}
        </Text>
      </Pressable>

      <Pressable onPress={onClose} style={s.textBtn}>
        <Text style={[s.textBtnT, { color: t.fgDim }]}>Not now</Text>
      </Pressable>

      <Text style={[s.small, { color: t.fgFaint }]}>
        Subscriptions renew until you cancel, which you do in your App Store or Play Store account,
        not here. The lifetime option never renews.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '800', letterSpacing: -1, marginBottom: 6 },
  reason: { fontSize: 13.5, lineHeight: 21, marginBottom: 18 },
  free: { borderWidth: 1.5, borderRadius: 18, padding: 16, marginTop: 6, marginBottom: 6 },
  freeH: { fontSize: 10, letterSpacing: 1.3, fontWeight: '700' },
  freeT: { fontSize: 14, lineHeight: 21, fontWeight: '600', marginTop: 8 },
  freeS: { fontSize: 12.5, lineHeight: 19, marginTop: 8 },
  h2: { fontSize: 15, fontWeight: '700', marginTop: 26, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 11, borderBottomWidth: 1 },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  rowN: { fontSize: 14, fontWeight: '600' },
  rowD: { fontSize: 12.5, lineHeight: 19, marginTop: 2 },
  price: { padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 9, minHeight: 58, justifyContent: 'center' },
  priceL: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  priceN: { fontSize: 12, marginTop: 3 },
  test: { fontSize: 11.5, lineHeight: 18, marginTop: 4 },
  note: { fontSize: 12.5, lineHeight: 19, marginTop: 10 },
  hardship: { borderWidth: 1, borderRadius: 16, padding: 15, marginTop: 20 },
  hardL: { fontSize: 14, fontWeight: '700' },
  hardD: { fontSize: 12, lineHeight: 18, marginTop: 3 },
  btnGhost: { borderWidth: 1.5, borderRadius: 13, padding: 13, alignItems: 'center' },
  btnGhostT: { fontSize: 14, fontWeight: '700' },
  textBtn: { marginTop: 16, alignItems: 'center' },
  textBtnT: { fontSize: 13.5, fontWeight: '600' },
  small: { fontSize: 11, lineHeight: 17, marginTop: 22, textAlign: 'center' },
});
