// Fill these in to turn on cloud backup and real purchases.
//
// Until then the app runs complete and offline: every safety feature works,
// backup is honestly reported as unavailable, and the paywall runs in a local
// test mode so you can see the flow without a store account.
//
// These are PUBLIC keys and belong in the client. Never put a Supabase
// service_role key or a store secret in this file — it ships inside the app
// bundle and anyone can read it.

export const SUPABASE_URL = 'https://bgbhqmgfwqvcgpmiloes.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnYmhxbWdmd3F2Y2dwbWlsb2VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5ODgxNzksImV4cCI6MjA5NjU2NDE3OX0.hHq3J4tUlHHQfT32ioYjIFix9ImIE_ETVR6D0iTMbpY';
// ^ anon key, role=anon, verified. Public by design and safe in the bundle.
//   Row Level Security is what protects the data, NOT this key.

// Google sign-in needs no keys in this file. It runs through Supabase's own
// authorize endpoint, so the Google client ID and secret live in the Supabase
// dashboard instead of in the app bundle. Two things to set there:
//
//   Authentication -> Providers -> Google : enable it, paste the client ID
//     and secret from Google Cloud Console (OAuth consent screen + a Web
//     application credential).
//   Authentication -> URL Configuration -> Redirect URLs : add
//     habilitate://auth-callback   and, for testing in Expo Go, exp://**
//
// In Google Cloud Console the authorised redirect URI is Supabase's callback,
// NOT the app's scheme:  https://<your-project>.supabase.co/auth/v1/callback

export const REVENUECAT_IOS_KEY = '';
export const REVENUECAT_ANDROID_KEY = '';

// Entitlement id as configured in RevenueCat.
export const ENTITLEMENT = 'plus';

// Shown on the paywall. Store prices are authoritative once RevenueCat is
// wired — these are the fallback labels for local test mode.
export const PRICES = {
  monthly: { id: 'habilitate_plus_monthly', label: 'R39 / month' },
  annual: { id: 'habilitate_plus_annual', label: 'R299 / year', note: 'Works out to R25 a month' },
  lifetime: { id: 'habilitate_plus_lifetime', label: 'R599 once', note: 'No recurring charge, ever' },
};
