import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Linking } from 'react-native';
import { useTheme } from '../theme';
import { PRIVACY_URL } from '../config';

// The first thing anyone sees. It has to earn the next tap from someone who
// may be frightened of being identified, so it leads with what stays on the
// phone rather than with a wall of legal text. Nothing is recorded until
// "I understand" is tapped.
export default function ConsentScreen({ onAccept }) {
  const t = useTheme();
  const [opened, setOpened] = useState(false);

  const openPolicy = () => {
    setOpened(true);
    Linking.openURL(PRIVACY_URL).catch(() => {});
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 48, flexGrow: 1, justifyContent: 'center' }}>
      <Text style={[s.h1, { color: t.fg }]}>
        Before you start
      </Text>

      <Text style={[s.lede, { color: t.fgDim }]}>
        Habilitate records information about your recovery. Here is exactly what that means.
      </Text>

      <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }]}>
        {[
          ['It stays on this phone.',
           'Your sober-day count, the days you log that you used, and your craving sessions are stored on this device. Nothing is sent anywhere.'],
          ['No account needed.',
           'No name, no email, no phone number. An account is offered later, only as a backup, and you can ignore it forever.'],
          ['No ads, no tracking.',
           'There is no advertising in this app and no analytics of any kind. Nothing about you is sold or shared.'],
          ['You can erase it all.',
           'Settings has a Delete everything button. One tap and a confirm, and every record on this phone is gone.'],
        ].map(([head, body]) => (
          <View key={head} style={s.row}>
            <View style={[s.dot, { backgroundColor: t.safe }]} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[s.rowH, { color: t.fg }]}>{head}</Text>
              <Text style={[s.rowB, { color: t.fgDim }]}>{body}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={[s.note, { color: t.fgFaint }]}>
        Information about substance use is health information. By continuing you are agreeing to
        Habilitate recording it on this device for your own use.
      </Text>

      <Pressable onPress={openPolicy} accessibilityRole="link" style={s.linkBtn}>
        <Text style={[s.link, { color: t.safe }]}>
          {opened ? 'Privacy policy — opened in your browser' : 'Read the full privacy policy'}
        </Text>
      </Pressable>

      <Pressable onPress={onAccept} style={[s.btn, { backgroundColor: t.safe }]}>
        <Text style={[s.btnT, { color: t.onAccent }]}>I understand — continue</Text>
      </Pressable>

      <Text style={[s.fine, { color: t.fgFaint }]}>
        Habilitate is a self-tracking tool. It is not treatment and not a medical device. If you are
        stopping alcohol or benzodiazepines, speak to a doctor before you stop — withdrawal from
        those can be dangerous.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 30, fontWeight: '800', letterSpacing: -1, marginBottom: 8 },
  lede: { fontSize: 14.5, lineHeight: 22, marginBottom: 20 },
  card: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 16 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
  rowH: { fontSize: 14.5, fontWeight: '700' },
  rowB: { fontSize: 13, lineHeight: 19.5, marginTop: 3 },
  note: { fontSize: 12.5, lineHeight: 19, marginTop: 18 },
  linkBtn: { marginTop: 14, paddingVertical: 6 },
  link: { fontSize: 14, fontWeight: '700' },
  btn: { padding: 17, borderRadius: 16, alignItems: 'center', marginTop: 18 },
  btnT: { fontSize: 15.5, fontWeight: '700' },
  fine: { fontSize: 11.5, lineHeight: 18, marginTop: 18, textAlign: 'center' },
});
