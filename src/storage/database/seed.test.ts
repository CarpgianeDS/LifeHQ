import { shouldSeed } from './seed';

describe('shouldSeed', () => {
  test('seeds when no marker row exists yet (first run)', () => {
    expect(shouldSeed(null)).toBe(true);
  });

  test('does not seed once a marker row exists — even after the user deletes every task', () => {
    expect(shouldSeed({ value: '2026-07-08T09:00:00.000Z' })).toBe(false);
  });
});
