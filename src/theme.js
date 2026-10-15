import { useColorScheme } from 'react-native';

const dark = {
  bg: '#0A0D14',
  surface: '#141926',
  surface2: '#1D2433',
  surface3: '#262F42',
  fg: '#E8ECF5',
  fgDim: '#8E99B0',
  fgFaint: '#5C6680',
  safe: '#4C9AFF',
  safeDeep: '#1B3C6B',
  heat: '#E8603C',
  warn: '#F2A33C',
  gold: '#E3B341',
  line: 'rgba(255,255,255,0.09)',
  lineSoft: 'rgba(255,255,255,0.05)',
  onAccent: '#FFFFFF',
};

const light = {
  bg: '#EEF1F6',
  surface: '#FFFFFF',
  surface2: '#E4E9F1',
  surface3: '#D4DCE8',
  fg: '#111726',
  fgDim: '#56607A',
  fgFaint: '#8A94AC',
  safe: '#1F6FEB',
  safeDeep: '#C3D9FB',
  heat: '#C94420',
  warn: '#B9780F',
  gold: '#9A6E14',
  line: 'rgba(16,24,40,0.12)',
  lineSoft: 'rgba(16,24,40,0.06)',
  onAccent: '#FFFFFF',
};

export function useTheme() {
  return useColorScheme() === 'light' ? light : dark;
}

// Blend a hex colour toward a base colour. Used for the Patterns heat map,
// where cell intensity encodes how often cravings land in that hour block.
export function mix(hex, baseHex, amount) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex);
  const b = p(baseHex);
  const out = a.map((v, i) => Math.round(v * amount + b[i] * (1 - amount)));
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export const type = {
  display: { fontWeight: '800', letterSpacing: -0.5 },
  heading: { fontWeight: '700', fontSize: 15 },
  body: { fontSize: 14, lineHeight: 21 },
  label: { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
};
