// First-run disclosure and consent.
//
// Google Play's User Data policy requires a prominent in-app disclosure and
// affirmative consent BEFORE sensitive data is collected — a privacy policy
// URL on the store listing is not enough. POPIA section 26 wants the same
// thing for health data: express consent, given knowingly.
//
// So the gate is real. Nothing is recorded until the user taps through it,
// and the text says plainly what gets stored and where it stays.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'habilitate.consent.v1';

export async function hasConsented() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return false;
    return Boolean(JSON.parse(raw).accepted);
  } catch (e) {
    return false;
  }
}

export async function recordConsent() {
  const rec = { accepted: true, at: Date.now(), version: 1 };
  try { await AsyncStorage.setItem(KEY, JSON.stringify(rec)); } catch (e) {}
  return rec;
}
