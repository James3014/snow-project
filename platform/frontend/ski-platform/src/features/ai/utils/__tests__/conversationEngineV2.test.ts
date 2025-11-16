/**
 * ConversationEngineV2 整合測試
 * 測試完整的對話流程
 */

import { describe, it, expect } from 'vitest';
import {
  createInitialContext,
  processUserInput,
  handleTripCreated,
  handleError,
  type ConversationContext,
  type ConversationResponse,
} from '../conversationEngineV2';

describe('ConversationEngineV2 - 整合測試', () => {

  // ==================== Suite 1: 初始化 ====================
  describe('Suite 1: 初始化', () => {
    it('應該創建初始上下文', () => {
      const context = createInitialContext();

      expect(context.state).toBe('MAIN_MENU');
      expect(context.tripForm).toBeDefined();
      expect(context.tripData).toBeDefined();
      expect(context.conversationHistory).toEqual([]);
    });

    it('初始表單應該是空的', () => {
      const context = createInitialContext();

      expect(context.tripForm.resort.status).toBe('empty');
      expect(context.tripForm.startDate.status).toBe('empty');
      expect(context.tripForm.endDate.status).toBe('empty');
      expect(context.tripData.resort).toBeUndefined();
    });
  });

  // ==================== Suite 2: 基本對話流程 ====================
  describe('Suite 2: 基本對話流程', () => {
    it('應該處理完整的行程輸入', async () => {
      let context = createInitialContext();

      const { response, updatedContext } = await processUserInput(
        '野澤 3月20-25日 公開找2個人',
        context
      );

      expect(response.message).toBeTruthy();
      expect(updatedContext.tripData.resort).toBeDefined();
      expect(updatedContext.tripData.startDate).toBeDefined();
      expect(updatedContext.tripData.endDate).toBeDefined();
      expect(updatedContext.tripData.visibility).toBe('public');
      expect(updatedContext.tripData.maxBuddies).toBe(2);
    });

    it('應該記錄對話歷史', async () => {
      let context = createInitialContext();

      const { updatedContext } = await processUserInput('野澤', context);

      expect(updatedContext.conversationHistory.length).toBe(1);
      expect(updatedContext.conversationHistory[0].userInput).toBe('野澤');
      expect(updatedContext.conversationHistory[0].timestamp).toBeInstanceOf(Date);
    });
  });

  // ==================== Suite 3: 多輪對話 ====================
  describe('Suite 3: 多輪對話', () => {
    it('應該支持逐步填寫表單', async () => {
      let context = createInitialContext();

      // 第一輪：雪場
      let result = await processUserInput('二世谷', context);
      context = result.updatedContext;

      expect(context.state).toBe('AWAITING_DATE');
      expect(context.tripData.resort).toBeDefined();
      expect(result.response.message).toContain('日期');

      // 第二輪：日期
      result = await processUserInput('3月20日', context);
      context = result.updatedContext;

      expect(context.state).toBe('AWAITING_DURATION');
      expect(context.tripData.startDate).toBeDefined();

      // 第三輪：天數
      result = await processUserInput('5天', context);
      context = result.updatedContext;

      expect(context.state).toBe('CONFIRMING_TRIP');
      expect(context.tripData.duration).toBe(5);
      expect(context.conversationHistory.length).toBe(3);
    });

    it('應該支持修改已填寫的欄位', async () => {
      let context = createInitialContext();

      // 第一輪
      let result = await processUserInput('野澤 3月20-25日', context);
      context = result.updatedContext;
      const firstResort = context.tripData.resort?.matchedValue;

      // 第二輪：改變雪場
      result = await processUserInput('改去二世谷', context);
      context = result.updatedContext;

      expect(context.tripData.resort?.matchedValue).not.toBe(firstResort);
      expect(context.tripData.resort?.matchedValue).toContain('二世谷');
      // 日期應該保留
      expect(context.tripData.startDate).toBeDefined();
    });
  });

  // ==================== Suite 4: 狀態轉換 ====================
  describe('Suite 4: 狀態轉換', () => {
    it('應該從 MAIN_MENU 轉換到 AWAITING_DATE', async () => {
      let context = createInitialContext();
      expect(context.state).toBe('MAIN_MENU');

      const { updatedContext } = await processUserInput('野澤', context);

      expect(updatedContext.state).toBe('AWAITING_DATE');
    });

    it('應該轉換到 CONFIRMING_TRIP 當所有欄位填寫完成', async () => {
      let context = createInitialContext();

      const { updatedContext } = await processUserInput(
        '野澤 3月20-25日 公開找2個人',
        context
      );

      expect(updatedContext.state).toBe('CONFIRMING_TRIP');
    });

    it('CONFIRMING_TRIP 狀態應該提供確認按鈕', async () => {
      let context = createInitialContext();

      const { response } = await processUserInput(
        '野澤 3月20-25日 公開找2個人',
        context
      );

      expect(response.requiresConfirmation).toBe(true);
      expect(response.buttonOptions).toBeDefined();
      expect(response.buttonOptions?.some(btn => btn.action === 'CONFIRM')).toBe(true);
    });
  });

  // ==================== Suite 5: 特殊功能 ====================
  describe('Suite 5: 特殊功能', () => {
    it('應該識別雪場列表查詢', async () => {
      let context = createInitialContext();

      const { response } = await processUserInput('有哪些雪場', context);

      expect(response.message).toContain('43個');
      expect(response.message).toContain('二世谷');
      expect(response.message).toContain('野澤');
    });

    it('應該處理確認關鍵字', async () => {
      let context = createInitialContext();

      // 先建立完整行程
      let result = await processUserInput('野澤 3月20-25日', context);
      context = result.updatedContext;
      expect(context.state).toBe('CONFIRMING_TRIP');

      // 確認
      result = await processUserInput('確定', context);

      expect(result.response.nextState).toBe('TRIP_CREATED');
      expect(result.response.message).toContain('已建立');
      expect(result.updatedContext.tripForm.resort.status).toBe('empty'); // 表單已重置
    });

    it('應該處理多種確認關鍵字', async () => {
      const confirmKeywords = ['確定', '是', '好', 'yes', 'ok'];

      for (const keyword of confirmKeywords) {
        let context = createInitialContext();
        let result = await processUserInput('野澤 3月20-25日', context);
        context = result.updatedContext;

        result = await processUserInput(keyword, context);

        expect(result.response.nextState).toBe('TRIP_CREATED');
      }
    });
  });

  // ==================== Suite 6: tripData 向後兼容 ====================
  describe('Suite 6: tripData 向後兼容', () => {
    it('tripData 應該與 tripForm 同步', async () => {
      let context = createInitialContext();

      const { updatedContext } = await processUserInput(
        '野澤 3月20-25日',
        context
      );

      // tripData 應該反映 tripForm 的內容
      expect(updatedContext.tripData.resort).toBeDefined();
      expect(updatedContext.tripData.startDate).toBeDefined();
      expect(updatedContext.tripData.endDate).toBeDefined();
      expect(updatedContext.tripData.duration).toBe(6);
    });

    it('tripData 應該正確處理 empty 狀態', async () => {
      const context = createInitialContext();

      // 空表單的 tripData 應該都是 undefined
      expect(context.tripData.resort).toBeUndefined();
      expect(context.tripData.startDate).toBeUndefined();
      expect(context.tripData.duration).toBeUndefined();
    });
  });

  // ==================== Suite 7: 錯誤處理 ====================
  describe('Suite 7: 錯誤處理', () => {
    it('handleError 應該創建錯誤回應', () => {
      const context = createInitialContext();

      const { response, updatedContext } = handleError('測試錯誤', context);

      expect(response.nextState).toBe('ERROR');
      expect(response.message).toContain('測試錯誤');
      expect(updatedContext.state).toBe('ERROR');
      expect(updatedContext.error).toBe('測試錯誤');
    });

    it('錯誤狀態應該提供重新開始按鈕', () => {
      const context = createInitialContext();

      const { response } = handleError('測試錯誤', context);

      expect(response.buttonOptions).toBeDefined();
      expect(response.buttonOptions?.some(btn => btn.action === 'RESTART')).toBe(true);
    });
  });

  // ==================== Suite 8: handleTripCreated ====================
  describe('Suite 8: handleTripCreated', () => {
    it('應該重置表單並提供選項', () => {
      let context = createInitialContext();

      // 先填寫一些資料
      context.tripForm.resort = {
        status: 'filled',
        value: {
          resort: { resort_id: 'test', names: { zh: '測試', en: 'Test', ja: 'テスト' } } as any,
          confidence: 1,
          matchedField: 'zh',
          matchedValue: '測試'
        }
      };

      const { response, updatedContext } = handleTripCreated(context);

      expect(response.nextState).toBe('TRIP_CREATED');
      expect(response.message).toContain('成功建立');
      expect(updatedContext.tripForm.resort.status).toBe('empty');
      expect(response.buttonOptions).toBeDefined();
    });
  });

  // ==================== Suite 9: 完整 E2E 流程 ====================
  describe('Suite 9: 完整 E2E 流程', () => {
    it('應該完成完整的對話流程：從輸入到確認', async () => {
      let context = createInitialContext();
      expect(context.state).toBe('MAIN_MENU');

      // Step 1: 用戶說出完整行程
      let result = await processUserInput('二世谷 3月20-25日 公開找2個人', context);
      context = result.updatedContext;

      expect(context.state).toBe('CONFIRMING_TRIP');
      expect(context.tripData.resort).toBeDefined();
      expect(context.tripData.startDate).toBeDefined();
      expect(context.tripData.endDate).toBeDefined();
      expect(context.tripData.duration).toBe(6);
      expect(context.tripData.visibility).toBe('public');
      expect(context.tripData.maxBuddies).toBe(2);

      // Step 2: 用戶確認
      result = await processUserInput('確定', context);
      context = result.updatedContext;

      expect(context.state).toBe('TRIP_CREATED');
      expect(result.response.message).toContain('已建立');

      // Step 3: 表單已重置，可以開始新的對話
      expect(context.tripForm.resort.status).toBe('empty');
      expect(context.conversationHistory.length).toBe(2);
    });

    it('應該完成完整的多輪對話流程', async () => {
      let context = createInitialContext();

      // Round 1: 雪場
      let result = await processUserInput('想去野澤', context);
      context = result.updatedContext;
      expect(context.state).toBe('AWAITING_DATE');

      // Round 2: 日期
      result = await processUserInput('3月20日出發', context);
      context = result.updatedContext;
      expect(context.state).toBe('AWAITING_DURATION');

      // Round 3: 天數
      result = await processUserInput('去5天', context);
      context = result.updatedContext;
      expect(context.state).toBe('CONFIRMING_TRIP');

      // Round 4: 添加找伴
      result = await processUserInput('公開找2個人', context);
      context = result.updatedContext;
      expect(context.tripData.visibility).toBe('public');
      expect(context.tripData.maxBuddies).toBe(2);

      // Round 5: 確認
      result = await processUserInput('好', context);
      context = result.updatedContext;
      expect(context.state).toBe('TRIP_CREATED');

      // 驗證對話歷史
      expect(context.conversationHistory.length).toBe(5);
    });
  });
});
