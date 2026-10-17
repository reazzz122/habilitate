import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Share, Linking } from 'react-native';
import { useTheme } from '../theme';
import { maskEmail, signOut, backupAvailable } from '../auth';
import { hasFeature, restore } from '../billing';
import { buildReport, wipeAll, level } from '../storage';
import { PRIVACY_URL, DELETE_ACCOUNT_URL } from '../config';

function Block({ children, t }) {
  return <View style={[s.block, { backgroundColor: t.surface, borderColor: t.line }]}>{children}</View>;
}

function Row({ t, label, value, onPress, danger, last }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[s.row, { borderBottomColor: last ? 'transparent' : t.lineSoft }]}
    >
      <Text style={[s.rowL, { color: danger ? t.heat : onPress ? t.safe : t.fg }]}>{label}</Text>
      {value ? <Text style={[s.rowV, { color: t.fgDim }]}>{value}</Text> : null}
    </Pressable>
  );
}

export default function SettingsScreen({ state, session, entitlement, onSignedOut, onWantAuth, onWantPaywall, onEntitled, onWiped }) {
  const t = useTheme();
  const [note, setNote] = useState(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const plus = entitlement && entitlement.plus;

  const shareReport = async () => {
    if (!hasFeature(entitlement, 'counsellor-report')) {
      onWantPaywall('The counsellor report is part of Plus.');
      return;
    }
    try {
      await Share.share({ message: buildReport(state) });
    } catch (e) {
      setNote('Could not open the share sheet.');
    }
  };

  const doRestore = async () => {
    setNote('Checking the store…');
    const res = await restore();
    if (res.error) { setNote(res.error); return; }
    if (res.found) { onEntitled(res.entitlement); setNote('Plus restored.'); return; }
    setNote('No previous purchase found.');
  };

  const doWipe = async () => {
    const ok = await wipeAll();
    if (ok) onWiped();
    else setNote('Could not clear the data on this phone.');
  };

  const planLabel =
    !entitlement || !entitlement.plus
      ? 'Free'
      : entitlement.source === 'hardship'
      ? 'Plus — hardship unlock'
      : entitlement.source === 'test'
      ? 'Plus — test mode'
      : 'Plus';

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
      <View style={s.top}>
        <Text style={[s.mark, { color: t.fg }]}>Settings</Text>
        <Text style={[s.note, { color: t.fgFaint }]}>LEVEL {level(state)}</Text>
      </View>

      <Text style={[s.h2, { color: t.fg }]}>Backup</Text>
      <Block t={t}>
        {session ? (
          <>
            <Row
              t={t}
              label={session.provider === 'google' ? 'Signed in with Google' : 'Signed in as'}
              value={maskEmail(session.email)}
            />
            <Row
              t={t}
              label="Sign out"
              onPress={async () => { await signOut(); onSignedOut(); }}
              last
            />
          </>
        ) : (
          <Row
            t={t}
            label={backupAvailable() ? 'Back up my levels' : 'Backup not configured'}
            value={backupAvailable() ? undefined : 'Local only'}
            onPress={backupAvailable() ? onWantAuth : undefined}
            last
          />
        )}
      </Block>
      <Text style={[s.help, { color: t.fgFaint }]}>
        {session
          ? 'Signing out leaves every level and marker on this phone. It only disconnects the backup.'
          : 'Without an account your levels live on this phone only. A reset or lost phone loses them.'}
      </Text>

      <Text style={[s.h2, { color: t.fg }]}>Plan</Text>
      <Block t={t}>
        <Row t={t} label="Current plan" value={planLabel} />
        {!plus && <Row t={t} label="See what Plus adds" onPress={() => onWantPaywall(null)} />}
        <Row t={t} label="Restore a purchase" onPress={doRestore} last />
      </Block>
      {entitlement && entitlement.source === 'hardship' && (
        <Text style={[s.help, { color: t.fgFaint }]}>
          Your hardship unlock has no expiry. If things change later and you want to pay, you can —
          but nothing here will ask you again.
        </Text>
      )}

      <Text style={[s.h2, { color: t.fg }]}>Share with a counsellor</Text>
      <Block t={t}>
        <Row
          t={t}
          label="Send my summary"
          value={plus ? undefined : 'Plus'}
          onPress={shareReport}
          last
        />
      </Block>
      <Text style={[s.help, { color: t.fgFaint }]}>
        Plain text you can paste into WhatsApp, an email or a clinical note. It says in the report
        itself that the game metrics are not a validated clinical measure.
      </Text>

      <Text style={[s.h2, { color: t.fg }]}>Privacy</Text>
      <Block t={t}>
        <Row t={t} label="Privacy policy"
             onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})} />
        <Row t={t} label="How to delete your account"
             onPress={() => Linking.openURL(DELETE_ACCOUNT_URL).catch(() => {})} last />
      </Block>
      <Text style={[s.help, { color: t.fgFaint }]}>
        What the app records, why, and the rights you have over it under POPIA.
      </Text>

      <Text style={[s.h2, { color: t.fg }]}>Your data</Text>
      <Block t={t}>
        {!confirmWipe ? (
          <Row t={t} label="Delete everything" onPress={() => setConfirmWipe(true)} danger last />
        ) : (
          <>
            <Row t={t} label={`This erases level ${level(state)} and cannot be undone.`} />
            <Row t={t} label="Yes, delete it all" onPress={doWipe} danger />
            <Row t={t} label="Keep my data" onPress={() => setConfirmWipe(false)} last />
          </>
        )}
      </Block>
      <Text style={[s.help, { color: t.fgFaint }]}>
        Everything is stored on this phone. Deleting here removes all of it — levels, runs, account
        link and plan.
      </Text>

      {note && <Text style={[s.toast, { color: t.fgDim }]}>{note}</Text>}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 },
  mark: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  note: { fontSize: 10, letterSpacing: 1.2, fontWeight: '600' },
  h2: { fontSize: 15, fontWeight: '700', marginTop: 24, marginBottom: 9 },
  block: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1 },
  rowL: { fontSize: 14, fontWeight: '600', flex: 1, minWidth: 0 },
  rowV: { fontSize: 12.5 },
  help: { fontSize: 11.5, lineHeight: 18, marginTop: 8 },
  toast: { fontSize: 12.5, marginTop: 18, textAlign: 'center' },
});
