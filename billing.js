// Entitlements and the paywall boundary.
//
// THE RULE, and it is not negotiable in a refactor: nothing that keeps someone
// safe is ever behind a payment. Not the day count, not the arena, not the
// helplines, not relapse logging. A person reaching for this app during a
// craving at 2am must never meet a price.
//
// What Plus sells is insight and continuity — the pattern analysis, backup
// across devices, the counsellor report, deeper arena floors. Useful, worth
// money, and nobody is less safe for not having it.
//
// FREE_FOREVER below is the enforcement point. If a future feature belongs on
// that list, put it there rather than arguing with the paywall.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  REVENUECAT_IOS_KEY, REVENUECAT_ANDROID_KEY, ENTITLEMENT, PRICES,
} from './config';

const ENT_KEY = 'habilitate.entitlement.v1';

export const FREE_FOREVER = [
  'day-count',
  'levels',
  'milestones',
  'arena',
  'relapse-log',
  'helplines',
  'run-log',
];

export const PLUS_FEATURES = [
  'patterns-heatmap',
  'cloud-backup',
  'counsellor-report',
  'deep-floors',
];

export const FEATURE_COPY = {
  'patterns-heatmap': {
    name: 'Your danger hours',
    detail: 'The full day-by-hour map of when cravings actually hit you, built from every run.',
  },
  'cloud-backup': {
    name: 'Backup and restore',
    detail: 'Your levels survive a lost, stolen or reset phone.',
  },
  'counsellor-report': {
    name: 'Counsellor report',
    detail: 'A one-page summary you can hand to a counsellor, sponsor or doctor.',
  },
  'deep-floors': {
    name: 'Five floors',
    detail: 'Two more floors in the arena, so a bad run has further to fall before it ends.',
  },
};

export const billingAvailable = () =>
  Boolean(Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY);

let Purchases = null;
function sdk() {
  if (Purchases) return Purchases;
  try {
    // Required lazily so a build without the native module still runs.
    Purchases = require('react-native-purchases').default;
  } catch (e) {
    Purchases = null;
  }
  return Purchases;
}

export async function readEntitlement() {
  try {
    const raw = await AsyncStorage.getItem(ENT_KEY);
    return raw ? JSON.parse(raw) : { plus: false, source: null };
  } catch (e) {
    return { plus: false, source: null };
  }
}

async function writeEntitlement(ent) {
  try { await AsyncStorage.setItem(ENT_KEY, JSON.stringify(ent)); } catch (e) {}
  return ent;
}

export function hasFeature(entitlement, feature) {
  if (FREE_FOREVER.includes(feature)) return true;
  return Boolean(entitlement && entitlement.plus);
}

export async function init() {
  const local = await readEntitlement();
  if (!billingAvailable()) return local;
  const P = sdk();
  if (!P) return local;
  try {
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
    await P.configure({ apiKey });
    const info = await P.getCustomerInfo();
    const active = Boolean(info.entitlements.active[ENTITLEMENT]);
    // A hardship grant is never revoked by a store check.
    if (local.source === 'hardship') return local;
    return writeEntitlement({ plus: active, source: active ? 'store' : null });
  } catch (e) {
    return local;
  }
}

export async function offerings() {
  if (!billingAvailable()) {
    return {
      testMode: true,
      packages: [
        { key: 'monthly', ...PRICES.monthly },
        { key: 'annual', ...PRICES.annual },
        { key: 'lifetime', ...PRICES.lifetime },
      ],
    };
  }
  const P = sdk();
  try {
    const current = (await P.getOfferings()).current;
    if (!current) return { testMode: true, packages: [] };
    return {
      testMode: false,
      packages: current.availablePackages.map((p) => ({
        key: p.identifier,
        id: p.product.identifier,
        label: p.product.priceString,
        note: p.product.description,
        _pkg: p,
      })),
    };
  } catch (e) {
    return { testMode: true, packages: [], error: 'Could not reach the store.' };
  }
}

export async function purchase(pkg) {
  if (!billingAvailable() || !pkg._pkg) {
    // Local test mode: grant Plus so the flow is walkable without a store
    // account. Never ships enabled, because billingAvailable() gates it.
    return { entitlement: await writeEntitlement({ plus: true, source: 'test' }) };
  }
  const P = sdk();
  try {
    const { customerInfo } = await P.purchasePackage(pkg._pkg);
    const active = Boolean(customerInfo.entitlements.active[ENTITLEMENT]);
    return { entitlement: await writeEntitlement({ plus: active, source: 'store' }) };
  } catch (e) {
    if (e && e.userCancelled) return { cancelled: true };
    return { error: 'The purchase did not go through. You have not been charged.' };
  }
}

export async function restore() {
  if (!billingAvailable()) return { error: 'Purchases are not configured in this build.' };
  const P = sdk();
  try {
    const info = await P.restorePurchases();
    const active = Boolean(info.entitlements.active[ENTITLEMENT]);
    return {
      entitlement: await writeEntitlement({ plus: active, source: active ? 'store' : null }),
      found: active,
    };
  } catch (e) {
    return { error: 'Could not reach the store to check.' };
  }
}

// Hardship unlock.
//
// Early recovery wrecks people financially — jobs gone, savings gone. Charging
// that person for the tool that helps them stay stopped is the wrong trade, and
// commercially it is nothing: they were never going to subscribe. One tap,
// no questions, no proof, no expiry.
//
// If this ever gets turned into a form with questions, the point has been lost.
export async function grantHardship() {
  return writeEntitlement({ plus: true, source: 'hardship', at: Date.now() });
}
