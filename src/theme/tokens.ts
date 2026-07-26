// Design tokens from the LifeHQ design handoff (design_handoff_lifehq_prototype/README.md).

import type { CategoryKey, PriorityKey } from '../types/models';

// Re-exported so existing `import type { CategoryKey } from '../theme/tokens'`
// call sites keep working — the theme maps these domain keys to colors, it
// does not own them (defined in src/types/models.ts).
export type { CategoryKey, PriorityKey };

export const colors = {
  canvasBg: '#FBFAF8',
  screenBg: '#F7F4EF',
  surface: '#ffffff',
  accent: '#B5651D',
  textPrimary: '#1A1A1A',
  textMuted: '#A39C93',
  textSecondary: '#6B6560',
  textBody: '#3D3A36',
  divider: '#F1EEE8',
  inputBorder: '#ECE7E0',
  reviewText: '#8A4E15',
  reviewBg: '#F3E3D2',
  tescoAction: '#3B5B7D',
  success: '#4F7D5D',

  category: {
    house: { fg: '#4F7D5D', bg: '#E5EFE7' },
    bills: { fg: '#B5651D', bg: '#F3E3D2' },
    admin: { fg: '#3B5B7D', bg: '#E4EBF2' },
    oisin: { fg: '#7A5C8E', bg: '#EFE7F2' },
  } satisfies Record<CategoryKey, { fg: string; bg: string }>,

  priority: {
    high: '#B4432E',
    medium: '#B5651D',
    low: '#6B8F7A',
  } satisfies Record<PriorityKey, string>,
} as const;

export const typography = {
  screenTitle: { fontSize: 28, fontWeight: '700' as const },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.4,
  },
  body: { fontSize: 15, fontWeight: '500' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  meta: { fontSize: 12.5, fontWeight: '400' as const },
  metaStrong: { fontSize: 12.5, fontWeight: '600' as const },
};

export const radii = {
  card: 16,
  pill: 100,
  iconSm: 8,
  iconMd: 14,
  checkbox: 100,
  checkboxSquare: 6,
};

export const spacing = {
  screenH: 20,
  cardPadding: 15,
  rowGapSm: 8,
  rowGapMd: 12,
  sectionGapSm: 18,
  sectionGapLg: 26,
};
