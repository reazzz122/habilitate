// South African support lines.
//
// VERIFIED: 2026-10-12 (SADAG and SANCA numbers confirmed against published
// sources on that date). Re-verify every six months. A disconnected crisis
// number in a recovery app is worse than no number at all, because the person
// calling it concludes nobody is there.
export const RESOURCES = [
  {
    name: 'SADAG substance abuse line',
    detail: '24 hours, every day. Counsellors who refer to rehabs, clinics and social workers.',
    numbers: [
      { label: 'Call', value: '0800 12 13 14' },
      { label: 'WhatsApp (08:00–17:00)', value: '087 163 2025' },
    ],
  },
  {
    name: 'SANCA',
    detail: '32 clinics nationwide. Detox, outpatient counselling, community programmes — subsidised.',
    numbers: [
      { label: 'National office', value: '011 892 3829' },
      { label: 'WhatsApp', value: '076 535 1701' },
    ],
  },
  {
    name: 'Alcoholics Anonymous SA',
    detail: 'Meetings countrywide. The only requirement is wanting to stop drinking.',
    numbers: [{ label: 'National helpline', value: '0861 435 722' }],
  },
  {
    name: 'Al-Anon / Alateen',
    detail: 'For the family and friends around someone who drinks.',
    numbers: [{ label: 'Helpline', value: '0861 25 26 66' }],
  },
  {
    name: 'LifeLine Southern Africa',
    detail: '24-hour crisis counselling, any kind of crisis.',
    numbers: [{ label: 'National line', value: '0861 322 322' }],
  },
  {
    name: 'Emergency',
    detail: 'Immediate danger, medical or otherwise.',
    numbers: [
      { label: 'Police', value: '10111' },
      { label: 'All emergencies (mobile)', value: '112' },
    ],
  },
];

export const DISCLAIMER =
  'Habilitate is a self-tracking tool. It does not diagnose anything, it does not replace a doctor, counsellor, sponsor or treatment programme, and it cannot tell whether you are safe. Withdrawal from alcohol and from benzodiazepines can be medically dangerous and sometimes needs supervised detox — if you are stopping either, speak to a doctor before you stop, not after. If you are in immediate danger, call 10111 or 112.';
