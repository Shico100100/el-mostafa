import { describe, it, expect } from 'vitest';
import {
  productTypeLabel,
  normalizeType,
  shouldShowPrice,
} from './types';

describe('inventory/types', () => {
  describe('productTypeLabel', () => {
    it('returns Arabic label for FINISHED', () => {
      expect(productTypeLabel('FINISHED')).toBe('منتج تام');
    });

    it('returns Arabic label for RAW', () => {
      expect(productTypeLabel('RAW')).toBe('خام');
    });

    it('returns Arabic label for IMPORTED', () => {
      expect(productTypeLabel('IMPORTED')).toBe('مستورد');
    });

    it('returns Arabic label for PACKAGING', () => {
      expect(productTypeLabel('PACKAGING')).toBe('تغليف');
    });

    it('returns Arabic label for SEMI', () => {
      expect(productTypeLabel('SEMI')).toBe('نصف مصنع');
    });

    it('maps RAW_PLASTIC to Arabic label for RAW', () => {
      expect(productTypeLabel('RAW_PLASTIC')).toBe('خام');
    });

    it('maps SEMI_FINISHED to Arabic label for SEMI', () => {
      expect(productTypeLabel('SEMI_FINISHED')).toBe('نصف مصنع');
    });

    it('returns Arabic label for DORMANT', () => {
      expect(productTypeLabel('DORMANT')).toBe('خامل');
    });

    it('returns the type itself for unknown types', () => {
      expect(productTypeLabel('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('normalizeType', () => {
    it('normalizes RAW_PLASTIC to RAW', () => {
      expect(normalizeType('RAW_PLASTIC')).toBe('RAW');
    });

    it('normalizes SEMI_FINISHED to SEMI', () => {
      expect(normalizeType('SEMI_FINISHED')).toBe('SEMI');
    });

    it('passes through FINISHED unchanged', () => {
      expect(normalizeType('FINISHED')).toBe('FINISHED');
    });

    it('passes through RAW unchanged', () => {
      expect(normalizeType('RAW')).toBe('RAW');
    });

    it('passes through IMPORTED unchanged', () => {
      expect(normalizeType('IMPORTED')).toBe('IMPORTED');
    });
  });

  describe('shouldShowPrice', () => {
    it('returns selling for FINISHED', () => {
      expect(shouldShowPrice('FINISHED')).toBe('selling');
    });

    it('returns none for IMPORTED', () => {
      expect(shouldShowPrice('IMPORTED')).toBe('none');
    });

    it('returns none for PACKAGING', () => {
      expect(shouldShowPrice('PACKAGING')).toBe('none');
    });

    it('returns none for RAW_PLASTIC', () => {
      expect(shouldShowPrice('RAW_PLASTIC')).toBe('none');
    });

    it('returns cost for RAW', () => {
      expect(shouldShowPrice('RAW')).toBe('cost');
    });

    it('returns cost for SEMI', () => {
      expect(shouldShowPrice('SEMI')).toBe('cost');
    });

    it('returns cost for unknown types', () => {
      expect(shouldShowPrice('UNKNOWN')).toBe('cost');
    });
  });
});
