// Identity, anonymous-first.
//
// The app is fully usable with no account, forever. A sign-up wall on a
// recovery app is where frightened people leave: being identifiable is the
// single biggest fear in early recovery, and an account asked for before any
// value is delivered reads as surveillance. So:
//
//   - first launch mints a local anonymous id and nothing else
//   - an account is offered only as BACKUP, and only once the user has
//     something worth losing (see shouldOfferBackup)
//   - signing out never deletes local data
//
// The backend is swappable. With no Supabase config present the app runs in
// local-only mode and says so plainly rather than pretending backup works.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

const ID_KEY = 'habilitate.identity.v1';
const SESSION_KEY = 'habilitate.session.v1';

export const backupAvailable = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function randomId() {
  let out = '';
  for (let i = 0; i < 32; i++) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

export async function getIdentity() {
  try {
    const raw = await AsyncStorage.getItem(ID_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through and mint a new one */ }
  const id = { anonId: randomId(), createdAt: Date.now() };
  try { await AsyncStorage.setItem(ID_KEY, JSON.stringify(id)); } catch (e) {}
  return id;
}

export async function getSession() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function putSession(session) {
  try {
    if (session) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else await AsyncStorage.removeItem(SESSION_KEY);
  } catch (e) {}
}

// Offer backup only once the user has something to lose. Nagging a day-one
// user for an account is the behaviour this guard exists to prevent.
export function shouldOfferBackup(state, session) {
  if (session) return false;
  if (!backupAvailable()) return false;
  const lifetime = state.banked + 1;
  return lifetime >= 7 || state.saves.length >= 5;
}

// --- Supabase REST -----------------------------------------------------------
// Plain fetch rather than the SDK: one less native dependency to break an
// Expo Go build, and auth is all that is needed here.

async function authCall(path, body) {
  if (!backupAvailable()) return { error: 'Backup is not configured in this build.' };
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error_description || data.msg || data.message || 'Something went wrong.' };
    }
    return { data };
  } catch (e) {
    return { error: 'No connection. Your data is safe on this phone either way.' };
  }
}

export async function signUp(email, password) {
  const { data, error } = await authCall('signup', { email, password });
  if (error) return { error };
  // With email confirmation on, no token comes back until the link is used.
  if (!data.access_token) return { pendingConfirmation: true, email };
  const session = { email, token: data.access_token, refresh: data.refresh_token, userId: data.user && data.user.id };
  await putSession(session);
  return { session };
}

export async function signIn(email, password) {
  const { data, error } = await authCall('token?grant_type=password', { email, password });
  if (error) return { error };
  const session = { email, token: data.access_token, refresh: data.refresh_token, userId: data.user && data.user.id };
  await putSession(session);
  return { session };
}

export async function requestReset(email) {
  const { error } = await authCall('recover', { email });
  return error ? { error } : { sent: true };
}

// --- Google ------------------------------------------------------------------
//
// Routed through Supabase's own authorize endpoint rather than a native Google
// SDK. That keeps the whole Google side in the Supabase dashboard: no separate
// client IDs per platform, no google-services.json, nothing to regenerate when
// the signing key changes. It is the only version of this that is maintainable
// from a phone.
//
// Worth being clear-eyed about what this costs the user in THIS app: Google
// hands back a real name and profile photo, and Habilitate then appears in
// their Google account's connected-apps list, where anyone holding an unlocked
// phone can see it. For some people that is convenience. For someone hiding a
// drinking problem from their household it is exposure. So Google is offered
// as one option among three, never as the default, and the UI says plainly
// what it shares before the button is tapped.

export function googleRedirectUri() {
  // Resolves to habilitate://auth-callback in a dev/production build and to the
  // exp:// tunnel URL inside Expo Go, so the same code works in both.
  return AuthSession.makeRedirectUri({ scheme: 'habilitate', path: 'auth-callback' });
}

function parseAuthUrl(url) {
  // Handles tokens arriving in the query string or the hash fragment.
  const { params, errorCode } = AuthSession.QueryParams.getQueryParams(url);
  if (errorCode) return { error: errorCode };
  if (params.error_description) return { error: params.error_description };
  if (!params.access_token) return { error: 'Google did not return a sign-in token.' };
  return { token: params.access_token, refresh: params.refresh_token };
}

async function fetchUser(token) {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function signInWithGoogle() {
  if (!backupAvailable()) return { error: 'Backup is not configured in this build.' };

  const redirectUri = googleRedirectUri();
  const authUrl =
    `${SUPABASE_URL}/auth/v1/authorize?provider=google` +
    `&redirect_to=${encodeURIComponent(redirectUri)}`;

  let result;
  try {
    result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
  } catch (e) {
    return { error: 'Could not open the Google sign-in page.' };
  }

  // The user backing out is not an error and gets no error message.
  if (result.type !== 'success' || !result.url) return { cancelled: true };

  const { token, refresh, error } = parseAuthUrl(result.url);
  if (error) return { error };

  const user = await fetchUser(token);
  const session = {
    email: (user && user.email) || 'Google account',
    token,
    refresh,
    userId: user && user.id,
    provider: 'google',
  };
  await putSession(session);
  return { session };
}

// Signing out never touches local progress. The UI says so out loud, because
// in this category people assume it will.
export async function signOut() {
  try { await WebBrowser.maybeCompleteAuthSession(); } catch (e) {}
  await putSession(null);
  return { ok: true };
}

export function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [name, domain] = email.split('@');
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(1, name.length - 2))}@${domain}`;
}
