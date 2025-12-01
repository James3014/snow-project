import { describe, it, expect } from 'vitest';
import {
  formatDate,
  isAskingForResortList,
  checkUserConfirmation,
  createInitialContext,
} from '../conversation/utils';

describe('conversation utils', () => {
  describe('formatDate', () => {
    it('should format date to MM/DD', () => {
      const date = new Date(2024, 11, 25); // Dec 25, 2024
      const result = formatDate(date);
      expect(result).toContain('12');
      expect(result).toContain('25');
    });
  });

  describe('isAskingForResortList', () => {
    it('should detect resort list questions', () => {
      expect(isAskingForResortList('有哪些雪場')).toBe(true);
      expect(isAskingForResortList('雪場列表')).toBe(true);
      expect(isAskingForResortList('支援哪些雪場')).toBe(true);
    });

    it('should return false for non-list questions', () => {
      expect(isAskingForResortList('去二世谷')).toBe(false);
      expect(isAskingForResortList('建立行程')).toBe(false);
    });
  });

  describe('checkUserConfirmation', () => {
    it('should detect confirmation', () => {
      expect(checkUserConfirmation('確定')).toBe('confirm');
      expect(checkUserConfirmation('是')).toBe('confirm');
      expect(checkUserConfirmation('好')).toBe('confirm');
      expect(checkUserConfirmation('yes')).toBe('confirm');
    });

    it('should detect cancellation', () => {
      expect(checkUserConfirmation('取消')).toBe('cancel');
      expect(checkUserConfirmation('不要')).toBe('cancel');
      expect(checkUserConfirmation('no')).toBe('cancel');
    });

    it('should return unclear for ambiguous input', () => {
      expect(checkUserConfirmation('也許')).toBe('unclear');
      expect(checkUserConfirmation('再想想')).toBe('unclear');
    });
  });

  describe('createInitialContext', () => {
    it('should create context with default values', () => {
      const context = createInitialContext();
      expect(context.state).toBe('MAIN_MENU');
      expect(context.tripData).toEqual({});
      expect(context.conversationHistory).toEqual([]);
    });
  });
});
