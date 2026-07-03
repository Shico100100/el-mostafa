import { describe, it, expect } from 'vitest';
import { sortAlphabetically } from './sort-utils';

describe('sortAlphabetically', () => {
  const items = [
    { name: 'ب' },
    { name: 'أ' },
    { name: 'ج' },
    { name: 'ت' },
  ];

  it('sorts by string field', () => {
    const sorted = sortAlphabetically(items, 'name');
    expect(sorted.map(i => i.name)).toEqual(['أ', 'ب', 'ت', 'ج']);
  });

  it('sorts by getter function', () => {
    const sorted = sortAlphabetically(items, i => i.name);
    expect(sorted.map(i => i.name)).toEqual(['أ', 'ب', 'ت', 'ج']);
  });

  it('does not mutate original array', () => {
    const copy = [...items];
    sortAlphabetically(items, 'name');
    expect(items).toEqual(copy);
  });

  it('handles empty array', () => {
    expect(sortAlphabetically([], 'name')).toEqual([]);
  });

  it('handles null/undefined values', () => {
    const withNulls = [
      { name: 'ب' },
      { name: null },
      { name: 'أ' },
    ];
    const sorted = sortAlphabetically(withNulls, 'name');
    expect(sorted.map(i => i.name)).toEqual([null, 'أ', 'ب']);
  });

  it('sorts by numeric field', () => {
    const nums = [{ v: 3 }, { v: 1 }, { v: 2 }];
    const sorted = sortAlphabetically(nums, 'v');
    expect(sorted.map(i => i.v)).toEqual([1, 2, 3]);
  });
});
