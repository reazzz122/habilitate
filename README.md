# Habilitate

A sobriety tracker where every sober day is a level, and a floor-is-lava arena gets you through a craving.

Built by Tebogo van Rooyen (DT3BZA). Expo / React Native.

---

## The two design rules this app is built on

Most of this codebase is ordinary. These two decisions are not, and they should survive any refactor:

**1. The user is never the red team.** Red is the lava — the craving, the trigger, the hazard on the floor. The player marker is always blue. The app never assigns the user to a losing side, never labels them by their worst night, and never uses failure language about the person. Shame is strongly associated with a slip becoming a full return to use, and a recovery app that shames you gets deleted on exactly the day it needed to be open.

**2. Nothing resets to zero.** `level()` is lifetime sober days. It only ever increases. When a user logs that they used, `bankRelapse()` moves the total into `banked` and restarts the *run counter* only — every level and every marker stays unlocked. Zeroing a long streak is a known trigger for "I've lost it all anyway," and it is also why people lie to their own trackers. If a future change makes the headline number go down, that change is wrong.

Falling in the arena is explicitly **not** framed as relapsing. The copy says so out loud, and the seconds survived are still logged as a save.

---

**3. Nothing that keeps someone safe is ever behind a payment.** `FREE_FOREVER` in `src/billing.js` is the enforcement point, and `hasFeature()` consults it before the entitlement. The day count, the arena, every helpline and relapse logging are on that list permanently. A person opening this app mid-craving at 2am must never meet a price. If a new feature belongs on that list, add it there rather than arguing with the paywall.

**4. No account is required, ever.** A sign-up wall is where frightened people leave — being identifiable is the biggest fear in early recovery. First launch mints a local anonymous id and asks for nothing. An account is offered exactly once, as *backup*, and only after the user has a week banked or five sessions logged (`shouldOfferBackup()`). Signing out never deletes local data, and the UI says so, because people assume it will.

---

## What's in it

| Screen | What it does |
|---|---|
| **Path** | Level dial (lifetime sober days), current run, saves, best hold, level ribbon, markers, and the relapse log button |
| **Arena** | The 90-second Hex-A-Gone game. Tiles crumble because *you stood on them*; falling drops you a floor instead of ending the round |
| **Patterns** | Day-of-week × 4-hour heat map built from *when* you opened the arena, plus a run log with reaction times |
| **Help** | SA support lines, tap to call |
| **You** | Account, plan, counsellor report, delete-everything |

### Login

Anonymous-first, as above. Three ways in, in this order on screen: Google, email and password, or no account at all. Auth is plain `fetch` against Supabase's REST endpoints rather than the SDK — one less native dependency to break an Expo Go build. With `SUPABASE_URL` empty in `src/config.js` the app runs in local-only mode and reports backup as unavailable instead of pretending.

**Google sign-in** goes through Supabase's `/auth/v1/authorize?provider=google` endpoint, opened with `WebBrowser.openAuthSessionAsync` and returning tokens on the `habilitate://auth-callback` deep link. Deliberately not a native Google SDK: this way the client ID and secret live in the Supabase dashboard rather than the app bundle, there are no per-platform client IDs, and nothing breaks when the Android signing key changes. It is the only version of this that is maintainable from a phone.

The screen carries a tappable "What does Google share?" line that says, in plain words, that Google returns a name and profile photo and that Habilitate then shows up in the user's Google connected-apps list. In this category that matters: for someone hiding a drinking problem from their household, that list is exposure. Hence three options and Google as none of the defaults.

Setup, all in dashboards, no laptop needed:

1. **Google Cloud Console** — OAuth consent screen, then a credential of type *Web application*. Authorised redirect URI is Supabase's callback, not the app scheme: `https://<project>.supabase.co/auth/v1/callback`
2. **Supabase → Authentication → Providers → Google** — enable, paste the client ID and secret.
3. **Supabase → Authentication → URL Configuration → Redirect URLs** — add `habilitate://auth-callback`, plus `exp://**` while testing in Expo Go.
4. Paste your project URL and anon key into `src/config.js`.

`makeRedirectUri` resolves to the `exp://` tunnel inside Expo Go and to `habilitate://auth-callback` in a real build, so the same code path works in both.

### Subscriptions

RevenueCat (`react-native-purchases`), lazily required so a build without the native module still runs.

| | Free forever | Plus |
|---|---|---|
| Day count, levels, markers | yes | yes |
| Arena, unlimited | yes | yes |
| Every helpline | yes | yes |
| Logging a relapse | yes | yes |
| Run log | yes | yes |
| Danger-hours heat map | — | yes |
| Backup and restore | — | yes |
| Counsellor report | — | yes |
| Five arena floors instead of three | — | yes |

Prices in `src/config.js`: R39/month, R299/year, R599 lifetime. The lifetime option exists because recurring billing on a wrecked budget is itself a reason to churn.

**Hardship unlock.** The paywall carries an "I can't afford this" button that grants Plus outright — no questions, no proof, no expiry (`grantHardship()`). Early recovery destroys people's income, and charging that person for the tool that helps them stay stopped is the wrong trade. Commercially it costs nothing: they were never going to subscribe. A store check never revokes a hardship grant. If this ever becomes a form with questions, the point has been lost.

**Important:** real purchases need an EAS development build. Expo Go cannot run the native module — RevenueCat's Preview API Mode keeps the logic from crashing, but no transaction will complete. With no RevenueCat keys set, the paywall runs in local test mode and tapping a price unlocks Plus without charging anything.

### The telemetry idea

Every arena run logs timestamp, seconds held, move count, and reaction time (ms between a tile under you turning amber and you moving). Patterns builds a vulnerability heat map from the timestamps.

The point is that it never asks you to rate your mood — nobody answers those honestly at 11pm. It infers craving pressure from when you reached for the game.

**Be honest about this in any pitch:** game performance as a proxy for craving intensity is a hypothesis, not a validated clinical measure. It is not published science. Treat the heat map as a prompt for self-reflection, never as a diagnostic.

---

## Running it

```bash
npm install
npx expo install --fix     # reconciles native deps against your installed SDK
npx expo start
```

Scan the QR with Expo Go.

Pinned to **Expo SDK 57 / React Native 0.86 / React 19.2.3** as of October 2026. If `npm install` fights you, the most reliable fix is to scaffold fresh and drop the source in:

```bash
npx create-expo-app@latest habilitate-fresh --template blank
cd habilitate-fresh
npx expo install @react-native-async-storage/async-storage expo-haptics react-native-safe-area-context
# copy App.js, index.js and src/ over from this repo
```

### Phone-only workflow

No laptop needed:

1. Push this repo to GitHub (GitHub mobile web handles uploads fine).
2. Open [snack.expo.dev](https://snack.expo.dev) in your browser and import the repo — Snack runs the app live on your phone through Expo Go.
3. For a real installable build, connect the repo to [EAS Build](https://expo.dev/eas) and build in the cloud. `eas build -p android --profile preview` produces an APK you can sideload.

Snack is the fastest loop for iterating on the arena feel.

---

## Project layout

```
App.js                    shell, tab bar, setup flow, state commits
index.js                  entry point
src/
  game.js                 pure arena logic — no React, no timers
  storage.js              AsyncStorage + the level/banking rules
  theme.js                light + dark tokens, heat-map colour mixing
  data/milestones.js      markers
  data/resources.js       SA helplines (see VERIFIED date in file)
  screens/
    PathScreen.js
    ArenaScreen.js        owns the clock; calls into game.js
    PatternsScreen.js
    HelpScreen.js
web/habilitate.html       the original single-file web prototype
```

`src/game.js` is deliberately pure so the arena rules can be reasoned about and tested without mounting a component.

---

## Before this ships to anyone else

Not polish items. Blockers.

- **Storage.** `AsyncStorage` is unencrypted on-device. Recovery data is health information under **POPIA**, which means it needs a lawful basis, a retention policy, and real security safeguards. Move to `expo-secure-store` for the key material at minimum.
- **Adding login made you a data controller.** The moment an email reaches a server, POPIA applies in full: you need a privacy policy shown *before* the first write, explicit consent, a named information officer registered with the Information Regulator, a breach-notification process, and a retention policy. The in-app delete (Settings → Delete everything) covers the right to deletion locally; once backup is live it has to delete the server copy too. Do not turn on `SUPABASE_URL` in a public build before this is done.
- **Helpline rot.** `src/data/resources.js` carries a `VERIFIED` date. Re-check every six months. A dead crisis number tells the person calling it that nobody is there.
- **Clinical review.** Get an actual addiction counsellor to read the copy before public release. I am confident about the shame and streak-reset reasoning; I am not a clinician and neither is a language model.
- **App store review.** Both stores scrutinise health and recovery apps. Expect to justify the claims in your listing. Describe it as a self-tracking and distraction tool, never as treatment.
- **Apple and third-party login.** App Store guideline 4.8 applies once you offer Google sign-in: you must also offer a login option that limits data collection to name and email and lets users keep their email private. Email-and-password plus the no-account path is the usual way to satisfy it, but Sign in with Apple is the option reviewers never argue with. Budget for adding it before an iOS submission.
- **Google branding.** The sign-in button is text-only on purpose. If you want the official Google mark on it, download the asset from Google's own identity branding guidelines and follow their sizing and clear-space rules — do not redraw it.
- **Fonts.** Currently system fonts. `@expo-google-fonts/bricolage-grotesque` would restore the prototype's display face.

---

## Licence

MIT. See `LICENSE`.
