import { describe, it, expect } from 'vitest';
import { parseDate, extractDates } from '../dateParser';

describe('dateParser', () => {
  describe('parseDate', () => {
    it('should parse MM/DD format', () => {
      const result = parseDate('12/25');
      expect(result).not.toBeNull();
      expect(result?.date.getMonth()).toBe(11); // December
      expect(result?.date.getDate()).toBe(25);
    });

    it('should parse Chinese date format', () => {
      const result = parseDate('12月25日');
      expect(result).not.toBeNull();
      expect(result?.date.getMonth()).toBe(11);
      expect(result?.date.getDate()).toBe(25);
    });

    it('should return null for invalid input', () => {
      expect(parseDate('')).toBeNull();
      expect(parseDate('invalid')).toBeNull();
    });
  });

  describe('extractDates', () => {
    it('should extract start date from simple input', () => {
      const result = extractDates('12/20');
      expect(result.startDate).not.toBeNull();
    });

    it('should extract date range', () => {
      const result = extractDates('12/20到12/25');
      expect(result.startDate).not.toBeNull();
      expect(result.endDate).not.toBeNull();
    });
  });
});
