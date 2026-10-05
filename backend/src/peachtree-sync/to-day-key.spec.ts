import { toDayKey } from './peachtree-sync-invoice.service';

describe('toDayKey', () => {
  it('should treat a date-only value and its midnight-local ISO as the same day', () => {
    expect(toDayKey('2022-08-08')).toBe('2022-08-08');
    expect(toDayKey('2022-08-08T22:00:00.000Z')).toBe('2022-08-08');
    expect(toDayKey('2022-08-08')).toBe(toDayKey('2022-08-08T22:00:00.000Z'));
  });

  it('should still detect a genuinely different day', () => {
    expect(toDayKey('2022-08-08')).not.toBe(
      toDayKey('2022-08-09T22:00:00.000Z'),
    );
  });

  it('should handle Date objects, null and empty values', () => {
    expect(toDayKey(new Date(2022, 7, 8, 12, 0, 0))).toBe('2022-08-08');
    expect(toDayKey(null)).toBe('');
    expect(toDayKey(undefined)).toBe('');
    expect(toDayKey('')).toBe('');
  });
});
