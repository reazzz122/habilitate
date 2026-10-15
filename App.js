import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from './src/theme';
import { loadState, saveState, empty, bankRelapse, recordSave, dayStart } from './src/storage';
import { getIdentity, getSession, shouldOfferBackup } from './src/auth';
import { init as initBilling, readEntitlement } from './src/billing';

import PathScreen from './src/screens/PathScreen';
import ArenaScreen from './src/screens/ArenaScreen';
import PatternsScreen from './src/screens/PatternsScreen';
import HelpScreen from './src/screens/HelpScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AuthScreen from './src/screens/AuthScreen';
import PaywallScreen from './src/screens/PaywallScreen';

const TABS = [
  { id: 'path', label: 'Path' },
  { id: 'arena', label: 'Arena' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'help', label: 'Help' },
  { id: 'settings', label: 'You' },
];

function Setup({ onDone }) {
  const t = useTheme();
  const today = new Date();
  const iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const [value, setValue] = useState(iso);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));

  return (
    <View style={[s.setup, { backgroundColor: t.bg }]}>
      <Text style={[s.setupH, { color: t.fg }]}>
        Habil<Text style={{ color: t.safe }}>itate</Text>
      </Text>
      <Text style={[s.setupP, { color: t.fgDim }]}>
        Every sober day is a level. Levels never lock back up — not after a hard night, not after a
        relapse. The number only goes up.
      </Text>
      <Text style={[s.setupL, { color: t.fgDim }]}>FIRST DAY OF THIS RUN</Text>
      <TextInput
        id="setup-date"
        value={value}
        onChangeText={setValue}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={t.fgFaint}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        style={[s.input, { backgroundColor: t.surface, borderColor: t.line, color: t.fg }]}
      />
      <Pressable
        disabled={!valid}
        onPress={() => {
          const [y, m, d] = value.split('-').map(Number);
          onDone(dayStart(new Date(y, m - 1, d).getTime()));
        }}
        style={[s.btn, { backgroundColor: valid ? t.safe : t.surface2 }]}
      >
        <Text style={[s.btnT, { color: valid ? t.onAccent : t.fgFaint }]}>Start at level one</Text>
      </Pressable>
      <Text style={[s.setupFine, { color: t.fgFaint }]}>
        No account needed. Nothing leaves this phone unless you later choose to back it up.
      </Text>
    </View>
  );
}

export default function App() {
  const t = useTheme();
  const scheme = useColorScheme();
  const [state, setState] = useState(null);
  const [session, setSession] = useState(null);
  const [entitlement, setEntitlement] = useState({ plus: false, source: null });
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState('path');
  const [overlay, setOverlay] = useState(null); // 'auth' | 'paywall'
  const [paywallReason, setPaywallReason] = useState(null);
  const [backupPrompted, setBackupPrompted] = useState(false);

  useEffect(() => {
    (async () => {
      await getIdentity(); // mint the anonymous id on first launch
      const [st, se, en] = await Promise.all([loadState(), getSession(), readEntitlement()]);
      setState(st);
      setSession(se);
      setEntitlement(en);
      setReady(true);
      // Reconcile with the store in the background; never blocks first paint.
      initBilling().then(setEntitlement);
    })();
  }, []);

  const commit = useCallback((next) => {
    setState(next);
    saveState(next);
  }, []);

  const openPaywall = useCallback((reason) => {
    setPaywallReason(reason || null);
    setOverlay('paywall');
  }, []);

  if (!ready) {
    return (
      <View style={[s.center, { backgroundColor: t.bg }]}>
        <ActivityIndicator color={t.safe} />
      </View>
    );
  }

  if (!state) {
    return (
      <SafeAreaProvider>
        <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
        <Setup onDone={(runStart) => commit({ ...empty(), runStart })} />
      </SafeAreaProvider>
    );
  }

  if (overlay === 'auth') {
    return (
      <SafeAreaProvider>
        <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
        <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
          <AuthScreen
            onDone={(se) => { setSession(se); setOverlay(null); }}
            onCancel={() => setOverlay(null)}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (overlay === 'paywall') {
    return (
      <SafeAreaProvider>
        <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
        <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
          <PaywallScreen
            reason={paywallReason}
            onEntitled={(en) => { setEntitlement(en); setOverlay(null); }}
            onClose={() => setOverlay(null)}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // One dismissible backup prompt, and only once there is something to lose.
  const offerBackup = !backupPrompted && tab === 'path' && shouldOfferBackup(state, session);

  return (
    <SafeAreaProvider>
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
        {offerBackup && (
          <View style={[s.banner, { backgroundColor: t.surface, borderColor: t.line }]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[s.bannerT, { color: t.fg }]}>Keep these levels if you lose this phone?</Text>
              <Text style={[s.bannerD, { color: t.fgDim }]}>An email and password. Nothing else.</Text>
            </View>
            <Pressable onPress={() => setOverlay('auth')}>
              <Text style={[s.bannerGo, { color: t.safe }]}>Set up</Text>
            </Pressable>
            <Pressable onPress={() => setBackupPrompted(true)}>
              <Text style={[s.bannerNo, { color: t.fgFaint }]}>Later</Text>
            </Pressable>
          </View>
        )}

        <View style={{ flex: 1 }}>
          {tab === 'path' && <PathScreen state={state} onRelapse={() => commit(bankRelapse(state))} />}
          {tab === 'arena' && (
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <ArenaScreen
                state={state}
                entitlement={entitlement}
                onRunComplete={(run) => commit(recordSave(state, run))}
              />
            </View>
          )}
          {tab === 'patterns' && (
            <PatternsScreen state={state} entitlement={entitlement} onWantPaywall={openPaywall} />
          )}
          {tab === 'help' && <HelpScreen />}
          {tab === 'settings' && (
            <SettingsScreen
              state={state}
              session={session}
              entitlement={entitlement}
              onSignedOut={() => setSession(null)}
              onWantAuth={() => setOverlay('auth')}
              onWantPaywall={openPaywall}
              onEntitled={setEntitlement}
              onWiped={() => { setState(null); setSession(null); setEntitlement({ plus: false, source: null }); setTab('path'); }}
            />
          )}
        </View>
      </SafeAreaView>

      <SafeAreaView style={{ backgroundColor: t.surface }} edges={['bottom', 'left', 'right']}>
        <View style={[s.tabs, { borderTopColor: t.line }]}>
          {TABS.map((x) => (
            <Pressable
              key={x.id}
              onPress={() => setTab(x.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === x.id }}
              style={s.tab}
            >
              <View
                style={[
                  s.dot,
                  { backgroundColor: tab === x.id ? t.safe : 'transparent', borderColor: t.fgFaint },
                ]}
              />
              <Text style={[s.tabT, { color: tab === x.id ? t.safe : t.fgFaint }]}>{x.label}</Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  setup: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 14 },
  setupH: { fontSize: 38, fontWeight: '800', letterSpacing: -1.6, textAlign: 'center' },
  setupP: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  setupL: { fontSize: 10, letterSpacing: 1.4, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  setupFine: { fontSize: 11.5, lineHeight: 18, textAlign: 'center', marginTop: 4 },
  input: { padding: 15, borderRadius: 14, borderWidth: 1, fontSize: 16, textAlign: 'center' },
  btn: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 4 },
  btnT: { fontSize: 15.5, fontWeight: '700' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 16, marginBottom: 0, padding: 13, borderRadius: 14, borderWidth: 1 },
  bannerT: { fontSize: 13, fontWeight: '600' },
  bannerD: { fontSize: 11.5, marginTop: 1 },
  bannerGo: { fontSize: 13, fontWeight: '700' },
  bannerNo: { fontSize: 12.5, fontWeight: '600' },
  tabs: { flexDirection: 'row', borderTopWidth: 1 },
  tab: { flex: 1, paddingTop: 11, paddingBottom: 13, alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, borderWidth: 1.5 },
  tabT: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.3 },
});
