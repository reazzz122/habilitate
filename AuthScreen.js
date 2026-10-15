import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme';
import { signIn, signUp, requestReset, signInWithGoogle, backupAvailable } from '../auth';

// Backup sign-in. Reachable from Settings and from one dismissible prompt once
// the user has a week banked — never on first launch, and never as a gate.
export default function AuthScreen({ onDone, onCancel }) {
  const t = useTheme();
  const [mode, setMode] = useState('up'); // up | in | reset
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [showGoogleNote, setShowGoogleNote] = useState(false);

  const valid = /\S+@\S+\.\S+/.test(email) && (mode === 'reset' || pw.length >= 8);

  const google = async () => {
    setBusy('google'); setErr(null); setMsg(null);
    const res = await signInWithGoogle();
    setBusy(false);
    if (res.cancelled) return;          // backing out is not an error
    if (res.error) { setErr(res.error); return; }
    if (res.session) onDone(res.session);
  };

  const submit = async () => {
    setBusy('email'); setErr(null); setMsg(null);
    const fn = mode === 'up' ? signUp : mode === 'in' ? signIn : requestReset;
    const res = mode === 'reset' ? await fn(email) : await fn(email, pw);
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    if (res.sent) { setMsg('Check your email for the reset link.'); return; }
    if (res.pendingConfirmation) { setMsg(`Confirm the link sent to ${res.email}, then sign in.`); setMode('in'); return; }
    if (res.session) onDone(res.session);
  };

  const title = mode === 'up' ? 'Back up your levels' : mode === 'in' ? 'Sign in' : 'Reset password';

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }} keyboardShouldPersistTaps="handled">
      <Text style={[s.h1, { color: t.fg }]}>{title}</Text>

      <Text style={[s.lede, { color: t.fgDim }]}>
        {mode === 'up'
          ? 'An email and password, nothing else. No name, no phone number, no contacts. It exists so a lost or reset phone does not cost you your levels.'
          : mode === 'in'
          ? 'Signing in merges whatever is on this phone with your backup, keeping the higher level.'
          : 'We will email you a link to set a new password.'}
      </Text>

      {!backupAvailable() && (
        <View style={[s.warn, { backgroundColor: t.surface, borderColor: t.line }]}>
          <Text style={[s.warnT, { color: t.fgDim }]}>
            Backup is not configured in this build yet, so accounts cannot be created. Everything on
            the Path and Arena screens works without one.
          </Text>
        </View>
      )}

      {mode !== 'reset' && (
        <>
          <Pressable
            onPress={google}
            disabled={Boolean(busy) || !backupAvailable()}
            style={[s.google, { backgroundColor: t.surface, borderColor: t.line }]}
          >
            {busy === 'google' ? (
              <ActivityIndicator color={t.fg} />
            ) : (
              <Text style={[s.googleT, { color: t.fg }]}>Continue with Google</Text>
            )}
          </Pressable>

          <Pressable onPress={() => setShowGoogleNote((v) => !v)}>
            <Text style={[s.googleWhy, { color: t.fgDim }]}>
              {showGoogleNote ? 'What Google shares —' : 'What does Google share?'}
            </Text>
          </Pressable>
          {showGoogleNote && (
            <Text style={[s.googleNote, { color: t.fgFaint }]}>
              Google gives us your email address, your name and your profile photo. Habilitate also
              appears in your Google account's list of connected apps, which anyone holding your
              unlocked phone can open. If you are keeping this private from people around you, use
              an email and password instead — or no account at all.
            </Text>
          )}

          <View style={s.orRow}>
            <View style={[s.rule, { backgroundColor: t.line }]} />
            <Text style={[s.or, { color: t.fgFaint }]}>OR</Text>
            <View style={[s.rule, { backgroundColor: t.line }]} />
          </View>
        </>
      )}

      <Text style={[s.label, { color: t.fgDim }]}>EMAIL</Text>
      <TextInput
        id="auth-email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={t.fgFaint}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        style={[s.input, { backgroundColor: t.surface, borderColor: t.line, color: t.fg }]}
      />

      {mode !== 'reset' && (
        <>
          <Text style={[s.label, { color: t.fgDim }]}>PASSWORD</Text>
          <TextInput
            id="auth-password"
            value={pw}
            onChangeText={setPw}
            placeholder="At least 8 characters"
            placeholderTextColor={t.fgFaint}
            secureTextEntry
            autoCapitalize="none"
            textContentType={mode === 'up' ? 'newPassword' : 'password'}
            style={[s.input, { backgroundColor: t.surface, borderColor: t.line, color: t.fg }]}
          />
        </>
      )}

      {err && <Text style={[s.err, { color: t.heat }]}>{err}</Text>}
      {msg && <Text style={[s.msg, { color: t.safe }]}>{msg}</Text>}

      <Pressable
        disabled={!valid || busy || !backupAvailable()}
        onPress={submit}
        style={[s.btn, { backgroundColor: valid && backupAvailable() ? t.safe : t.surface2 }]}
      >
        {busy === 'email' ? (
          <ActivityIndicator color={t.onAccent} />
        ) : (
          <Text style={[s.btnT, { color: valid && backupAvailable() ? t.onAccent : t.fgFaint }]}>
            {mode === 'up' ? 'Create account' : mode === 'in' ? 'Sign in' : 'Send reset link'}
          </Text>
        )}
      </Pressable>

      <View style={s.links}>
        {mode !== 'up' && (
          <Pressable onPress={() => { setMode('up'); setErr(null); setMsg(null); }}>
            <Text style={[s.link, { color: t.safe }]}>Create an account</Text>
          </Pressable>
        )}
        {mode !== 'in' && (
          <Pressable onPress={() => { setMode('in'); setErr(null); setMsg(null); }}>
            <Text style={[s.link, { color: t.safe }]}>I already have one</Text>
          </Pressable>
        )}
        {mode !== 'reset' && (
          <Pressable onPress={() => { setMode('reset'); setErr(null); setMsg(null); }}>
            <Text style={[s.link, { color: t.fgDim }]}>Forgot password</Text>
          </Pressable>
        )}
      </View>

      <Pressable onPress={onCancel} style={s.skip}>
        <Text style={[s.skipT, { color: t.fgDim }]}>Not now</Text>
        <Text style={[s.skipSub, { color: t.fgFaint }]}>
          The app works fully without an account. You can do this any time from Settings.
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '800', letterSpacing: -0.9, marginBottom: 8 },
  lede: { fontSize: 13.5, lineHeight: 21, marginBottom: 20 },
  warn: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 18 },
  warnT: { fontSize: 12.5, lineHeight: 19 },
  google: { padding: 16, borderRadius: 14, borderWidth: 1, alignItems: 'center', minHeight: 54, justifyContent: 'center' },
  googleT: { fontSize: 15, fontWeight: '700' },
  googleWhy: { fontSize: 11.5, fontWeight: '600', marginTop: 10, textAlign: 'center' },
  googleNote: { fontSize: 11.5, lineHeight: 18, marginTop: 8 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, marginBottom: 2 },
  rule: { flex: 1, height: 1 },
  or: { fontSize: 10, letterSpacing: 1.2, fontWeight: '700' },
  label: { fontSize: 10, letterSpacing: 1.2, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  input: { padding: 15, borderRadius: 14, borderWidth: 1, fontSize: 16 },
  err: { fontSize: 12.5, lineHeight: 19, marginTop: 12 },
  msg: { fontSize: 12.5, lineHeight: 19, marginTop: 12 },
  btn: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  btnT: { fontSize: 15.5, fontWeight: '700' },
  links: { marginTop: 18, gap: 12 },
  link: { fontSize: 13.5, fontWeight: '600' },
  skip: { marginTop: 28, alignItems: 'center' },
  skipT: { fontSize: 13.5, fontWeight: '600' },
  skipSub: { fontSize: 11.5, lineHeight: 18, textAlign: 'center', marginTop: 4 },
});
