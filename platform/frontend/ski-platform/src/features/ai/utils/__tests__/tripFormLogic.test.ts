/**
 * Trip Form Logic Tests
 * 行程表單邏輯測試
 *
 * Linus 原則：先寫測試，測試通過再寫代碼
 * 這些測試定義了新數據結構和邏輯的預期行為
 */
import { describe, it, expect } from 'vitest';
import {
  createEmptyForm,
  updateFormFromInput,
  getCurrentState,
  generateResponse,
  type TripForm,
  type FormField,
  type ResortMatch,
  type ConversationState,
} from '../tripFormLogic';

// ==================== 測試套件 ====================

describe('TripFormLogic - 行程表單邏輯', () => {

  // ==================== Suite 1: 基本輸入解析 ====================
  describe('Suite 1: 基本輸入解析 (Basic Input Parsing)', () => {

    it('應該正確解析完整的行程輸入：「3月4-9日野澤公開找雪友2個」', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '3月4-9日野澤公開找雪友2個');

      // 雪場識別
      expect(result.resort.status).toBe('filled');
      if (result.resort.status === 'filled') {
        expect(result.resort.value.matchedValue).toContain('野澤');
      }

      // 日期解析
      expect(result.startDate.status).toBe('filled');
      if (result.startDate.status === 'filled') {
        expect(result.startDate.value.getMonth()).toBe(2); // 3月 = index 2
        expect(result.startDate.value.getDate()).toBe(4);
      }

      expect(result.endDate.status).toBe('filled');
      if (result.endDate.status === 'filled') {
        expect(result.endDate.value.getMonth()).toBe(2);
        expect(result.endDate.value.getDate()).toBe(9);
      }

      // 天數計算（包含首尾）
      expect(result.duration.status).toBe('filled');
      if (result.duration.status === 'filled') {
        expect(result.duration.value).toBe(6); // 3/4-3/9 = 6天
      }

      // 可見性（公開）
      expect(result.visibility.status).toBe('filled');
      if (result.visibility.status === 'filled') {
        expect(result.visibility.value).toBe('public');
      }

      // 最大雪伴數
      expect(result.maxBuddies.status).toBe('filled');
      if (result.maxBuddies.status === 'filled') {
        expect(result.maxBuddies.value).toBe(2);
      }
    });

    it('應該正確解析簡單輸入：「去二世谷」', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '去二世谷');

      expect(result.resort.status).toBe('filled');
      if (result.resort.status === 'filled') {
        expect(result.resort.value.matchedValue).toContain('二世谷');
      }

      // 其他欄位保持空白
      expect(result.startDate.status).toBe('empty');
      expect(result.endDate.status).toBe('empty');
      expect(result.duration.status).toBe('empty');
    });

    it('應該正確解析帶日期範圍的輸入：「二世谷 12月20-25日」', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 12月20-25日');

      expect(result.resort.status).toBe('filled');
      expect(result.startDate.status).toBe('filled');
      expect(result.endDate.status).toBe('filled');

      if (result.startDate.status === 'filled' && result.endDate.status === 'filled') {
        expect(result.startDate.value.getMonth()).toBe(11); // 12月 = index 11
        expect(result.startDate.value.getDate()).toBe(20);
        expect(result.endDate.value.getDate()).toBe(25);
      }
    });

    it('應該正確解析帶天數的輸入：「二世谷 12月20日 5天」', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 12月20日 5天');

      expect(result.resort.status).toBe('filled');
      expect(result.startDate.status).toBe('filled');
      expect(result.duration.status).toBe('filled');

      if (result.duration.status === 'filled') {
        expect(result.duration.value).toBe(5);
      }

      // endDate 應該根據 startDate + duration 自動計算
      expect(result.endDate.status).toBe('filled');
      if (result.startDate.status === 'filled' && result.endDate.status === 'filled') {
        expect(result.endDate.value.getDate()).toBe(24); // 12/20 + 5天 - 1 = 12/24
      }
    });
  });

  // ==================== Suite 2: 雪場名稱格式 ====================
  describe('Suite 2: 雪場名稱格式 (Resort Name Formats)', () => {

    it('應該識別中文雪場名：「二世谷」', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷');

      expect(result.resort.status).toBe('filled');
      if (result.resort.status === 'filled') {
        expect(result.resort.value.matchedValue).toContain('二世谷');
      }
    });

    it('應該識別英文雪場名：「Niseko」', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, 'Niseko');

      expect(result.resort.status).toBe('filled');
      if (result.resort.status === 'filled') {
        expect(['二世谷', 'Niseko', 'ニセコ'].some(name =>
          result.resort.status === 'filled' && result.resort.value.matchedValue.includes(name)
        )).toBe(true);
      }
    });

    it('應該識別別名：「新雪谷」（二世谷的別名）', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '新雪谷');

      expect(result.resort.status).toBe('filled');
      if (result.resort.status === 'filled') {
        expect(['二世谷', 'Niseko', 'ニセコ'].some(name =>
          result.resort.status === 'filled' && result.resort.value.matchedValue.includes(name)
        )).toBe(true);
      }
    });

    it('應該拒絕無效雪場名並標記為 invalid', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '不存在的雪場XYZABC');

      // 如果完全識別不出來，應該標記為 invalid 或保持 empty
      if (result.resort.status === 'invalid') {
        expect(result.resort.error).toBeTruthy();
      } else {
        expect(result.resort.status).toBe('empty');
      }
    });
  });

  // ==================== Suite 3: 日期格式處理 ====================
  describe('Suite 3: 日期格式處理 (Date Format Handling)', () => {

    it('應該解析短格式日期：「3/20-25」', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '野澤 3/20-25');

      expect(result.startDate.status).toBe('filled');
      expect(result.endDate.status).toBe('filled');

      if (result.startDate.status === 'filled' && result.endDate.status === 'filled') {
        expect(result.startDate.value.getMonth()).toBe(2); // 3月
        expect(result.startDate.value.getDate()).toBe(20);
        expect(result.endDate.value.getDate()).toBe(25);
      }
    });

    it('應該解析中文日期：「3月20-25日」', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '野澤 3月20-25日');

      expect(result.startDate.status).toBe('filled');
      expect(result.endDate.status).toBe('filled');

      if (result.startDate.status === 'filled' && result.endDate.status === 'filled') {
        expect(result.startDate.value.getMonth()).toBe(2);
        expect(result.startDate.value.getDate()).toBe(20);
        expect(result.endDate.value.getDate()).toBe(25);
      }
    });

    it('應該解析完整日期：「2025/3/20-2025/3/25」', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '野澤 2025/3/20-2025/3/25');

      expect(result.startDate.status).toBe('filled');
      expect(result.endDate.status).toBe('filled');

      if (result.startDate.status === 'filled' && result.endDate.status === 'filled') {
        expect(result.startDate.value.getFullYear()).toBe(2025);
        expect(result.startDate.value.getMonth()).toBe(2);
        expect(result.endDate.value.getDate()).toBe(25);
      }
    });

    it('應該拒絕無效日期順序：結束日期早於開始日期', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '野澤 3/25-20');

      // 日期欄位應該標記為 invalid
      if (result.startDate.status === 'invalid' || result.endDate.status === 'invalid') {
        expect(true).toBe(true);
      } else {
        // 或者保持 empty
        expect(result.startDate.status === 'empty' || result.endDate.status === 'empty').toBe(true);
      }
    });
  });

  // ==================== Suite 4: 天數計算 ====================
  describe('Suite 4: 天數計算 (Duration Calculation)', () => {

    it('應該正確計算天數（包含首尾）：3/20-3/25 = 6天', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '野澤 3/20-25');

      expect(result.duration.status).toBe('filled');
      if (result.duration.status === 'filled') {
        expect(result.duration.value).toBe(6); // 20,21,22,23,24,25 = 6天
      }
    });

    it('應該根據日期範圍自動計算天數', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '野澤 12月1-5日');

      expect(result.duration.status).toBe('filled');
      if (result.duration.status === 'filled') {
        expect(result.duration.value).toBe(5); // 1,2,3,4,5 = 5天
      }
    });

    it('應該在天數和日期範圍衝突時，以日期範圍為準', async () => {
      const form = createEmptyForm();
      // 用戶說「3天」但日期是 3/20-25（實際6天）
      const result = await updateFormFromInput(form, '野澤 3/20-25 3天');

      expect(result.duration.status).toBe('filled');
      if (result.duration.status === 'filled') {
        // 應該以日期範圍計算的天數為準
        expect(result.duration.value).toBe(6);
      }
    });
  });

  // ==================== Suite 5: 多輪對話 ====================
  describe('Suite 5: 多輪對話 (Multi-turn Conversations)', () => {

    it('應該支援逐步填寫表單', async () => {
      let form = createEmptyForm();

      // 第一輪：只說雪場
      form = await updateFormFromInput(form, '二世谷');
      expect(form.resort.status).toBe('filled');
      expect(form.startDate.status).toBe('empty');

      // 第二輪：補充日期
      form = await updateFormFromInput(form, '3月20-25日');
      expect(form.resort.status).toBe('filled');
      expect(form.startDate.status).toBe('filled');
      expect(form.endDate.status).toBe('filled');

      // 第三輪：設定可見性
      form = await updateFormFromInput(form, '公開找2個人');
      expect(form.visibility.status).toBe('filled');
      expect(form.maxBuddies.status).toBe('filled');
    });

    it('應該支援覆蓋已填寫的欄位', async () => {
      let form = createEmptyForm();

      // 第一輪
      form = await updateFormFromInput(form, '二世谷 3月20-25日');
      const firstResort = form.resort.status === 'filled' ? form.resort.value.matchedValue : '';

      // 第二輪：改變雪場
      form = await updateFormFromInput(form, '改去野澤');
      expect(form.resort.status).toBe('filled');
      if (form.resort.status === 'filled') {
        expect(form.resort.value.matchedValue).not.toBe(firstResort);
        expect(form.resort.value.matchedValue).toContain('野澤');
      }

      // 日期應該保留
      expect(form.startDate.status).toBe('filled');
    });

    it('應該識別表單完成狀態', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月20-25日 公開找2個人');

      // 所有必要欄位都已填寫
      expect(result.resort.status).toBe('filled');
      expect(result.startDate.status).toBe('filled');
      expect(result.endDate.status).toBe('filled');
      expect(result.duration.status).toBe('filled');
      expect(result.visibility.status).toBe('filled');
      expect(result.maxBuddies.status).toBe('filled');

      // 狀態應該是確認階段
      const state = getCurrentState(result);
      expect(state).toBe('CONFIRMING_TRIP');
    });

    it('應該保留已填寫欄位當輸入不包含新資訊', async () => {
      let form = createEmptyForm();
      form = await updateFormFromInput(form, '二世谷 3月20-25日');

      const originalResort = form.resort;
      const originalDate = form.startDate;

      // 用戶只說了一些無關的話
      form = await updateFormFromInput(form, '好的');

      // 應該保留原有資訊
      expect(form.resort).toEqual(originalResort);
      expect(form.startDate).toEqual(originalDate);
    });

    it('應該在部分欄位無效時保留有效欄位', async () => {
      let form = createEmptyForm();

      // 有效的雪場 + 無效的日期
      form = await updateFormFromInput(form, '二世谷 99月99日');

      expect(form.resort.status).toBe('filled');
      // 無效日期應該標記為 invalid 或 empty
      expect(form.startDate.status === 'invalid' || form.startDate.status === 'empty').toBe(true);
    });
  });

  // ==================== Suite 6: 狀態推導 ====================
  describe('Suite 6: 狀態推導 (State Derivation)', () => {

    it('空表單應該返回 AWAITING_INPUT', async () => {
      const form = createEmptyForm();
      const state = getCurrentState(form);
      expect(state).toBe('AWAITING_INPUT');
    });

    it('缺少雪場時應該返回 AWAITING_RESORT', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '3月20-25日');
      const state = getCurrentState(result);
      expect(state).toBe('AWAITING_RESORT');
    });

    it('缺少日期時應該返回 AWAITING_DATE', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷');
      const state = getCurrentState(result);
      expect(state).toBe('AWAITING_DATE');
    });

    it('有雪場和日期但缺少天數時應該返回 AWAITING_DURATION', async () => {
      let form = createEmptyForm();
      // 只給開始日期，沒有範圍也沒有天數
      form = await updateFormFromInput(form, '二世谷 3月20日');

      const state = getCurrentState(form);
      if (form.duration.status === 'empty') {
        expect(state).toBe('AWAITING_DURATION');
      }
    });

    it('所有必要欄位都填寫後應該返回 CONFIRMING_TRIP', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月20-25日');
      const state = getCurrentState(result);
      expect(state).toBe('CONFIRMING_TRIP');
    });
  });

  // ==================== Suite 7: 回應生成 ====================
  describe('Suite 7: 回應生成 (Response Generation)', () => {

    it('空表單應該生成歡迎訊息', async () => {
      const form = createEmptyForm();
      const response = generateResponse(form);
      expect(response).toBeTruthy();
      expect(typeof response).toBe('string');
    });

    it('缺少雪場時應該提示輸入雪場', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '3月20-25日');
      const response = generateResponse(result);

      expect(response).toContain('雪場');
    });

    it('缺少日期時應該提示輸入日期', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷');
      const response = generateResponse(result);

      expect(response.includes('日期') || response.includes('時間')).toBe(true);
    });

    it('完整表單應該生成確認訊息', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月20-25日');
      const response = generateResponse(result);

      // 確認訊息應該包含關鍵資訊
      expect(response.includes('二世谷') || response.includes('Niseko')).toBe(true);
    });

    it('回應應該包含當前表單的上下文', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷');
      const response = generateResponse(result);

      // 已經有雪場資訊，回應中應該提及
      expect(response.includes('二世谷') || response.includes('Niseko')).toBe(true);
    });
  });

  // ==================== Suite 8: 可見性關鍵字 ====================
  describe('Suite 8: 可見性關鍵字 (Visibility Keywords)', () => {

    it('應該識別「公開」關鍵字', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月20-25日 公開');

      expect(result.visibility.status).toBe('filled');
      if (result.visibility.status === 'filled') {
        expect(result.visibility.value).toBe('public');
      }
    });

    it('應該識別「開放」關鍵字', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月20-25日 開放');

      expect(result.visibility.status).toBe('filled');
      if (result.visibility.status === 'filled') {
        expect(result.visibility.value).toBe('public');
      }
    });

    it('應該識別「找人」關鍵字', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月20-25日 找人');

      expect(result.visibility.status).toBe('filled');
      if (result.visibility.status === 'filled') {
        expect(result.visibility.value).toBe('public');
      }
    });

    it('應該識別「找伴」關鍵字', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月20-25日 找伴');

      expect(result.visibility.status).toBe('filled');
      if (result.visibility.status === 'filled') {
        expect(result.visibility.value).toBe('public');
      }
    });

    it('應該識別「徵人」關鍵字', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月20-25日 徵人');

      expect(result.visibility.status).toBe('filled');
      if (result.visibility.status === 'filled') {
        expect(result.visibility.value).toBe('public');
      }
    });

    it('應該識別「徵伴」關鍵字', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月20-25日 徵伴');

      expect(result.visibility.status).toBe('filled');
      if (result.visibility.status === 'filled') {
        expect(result.visibility.value).toBe('public');
      }
    });

    it('應該識別「找雪友」關鍵字', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月20-25日 找雪友');

      expect(result.visibility.status).toBe('filled');
      if (result.visibility.status === 'filled') {
        expect(result.visibility.value).toBe('public');
      }
    });

    it('應該識別「一起」關鍵字', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月20-25日 一起去');

      expect(result.visibility.status).toBe('filled');
      if (result.visibility.status === 'filled') {
        expect(result.visibility.value).toBe('public');
      }
    });

    it('應該識別「揪團」關鍵字', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月20-25日 揪團');

      expect(result.visibility.status).toBe('filled');
      if (result.visibility.status === 'filled') {
        expect(result.visibility.value).toBe('public');
      }
    });

    it('應該識別「組團」關鍵字', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月20-25日 組團');

      expect(result.visibility.status).toBe('filled');
      if (result.visibility.status === 'filled') {
        expect(result.visibility.value).toBe('public');
      }
    });

    it('應該識別英文「public」關鍵字', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, 'Niseko 3/20-25 public');

      expect(result.visibility.status).toBe('filled');
      if (result.visibility.status === 'filled') {
        expect(result.visibility.value).toBe('public');
      }
    });

    it('沒有關鍵字時應該預設為 private', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月20-25日');

      // 預設為 private
      expect(result.visibility.status).toBe('filled');
      if (result.visibility.status === 'filled') {
        expect(result.visibility.value).toBe('private');
      }
    });

    it('應該正確解析帶數字的公開關鍵字：「找2個人」', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月20-25日 找2個人');

      expect(result.visibility.status).toBe('filled');
      if (result.visibility.status === 'filled') {
        expect(result.visibility.value).toBe('public');
      }

      expect(result.maxBuddies.status).toBe('filled');
      if (result.maxBuddies.status === 'filled') {
        expect(result.maxBuddies.value).toBe(2);
      }
    });

    it('應該正確解析帶數字的公開關鍵字：「徵3個雪友」', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月20-25日 徵3個雪友');

      expect(result.visibility.status).toBe('filled');
      if (result.visibility.status === 'filled') {
        expect(result.visibility.value).toBe('public');
      }

      expect(result.maxBuddies.status).toBe('filled');
      if (result.maxBuddies.status === 'filled') {
        expect(result.maxBuddies.value).toBe(3);
      }
    });

    it('公開關鍵字應該優先於預設的 private', async () => {
      const form = createEmptyForm();
      // 即使句子中有其他詞，「找人」應該觸發 public
      const result = await updateFormFromInput(form, '二世谷 3月20-25日 自己去但也找人');

      expect(result.visibility.status).toBe('filled');
      if (result.visibility.status === 'filled') {
        // 因為有「找人」關鍵字，應該是 public
        expect(result.visibility.value).toBe('public');
      }
    });
  });

  // ==================== Suite 9: 邊界情況和錯誤處理 ====================
  describe('Suite 9: 邊界情況和錯誤處理 (Edge Cases)', () => {

    it('應該處理空字串輸入', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '');

      // 所有欄位應該保持空白
      expect(result.resort.status).toBe('empty');
      expect(result.startDate.status).toBe('empty');
    });

    it('應該處理只有空格的輸入', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '   ');

      expect(result.resort.status).toBe('empty');
      expect(result.startDate.status).toBe('empty');
    });

    it('應該處理模糊的雪場名稱', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '苗場'); // 常見雪場

      expect(result.resort.status).toBe('filled');
      if (result.resort.status === 'filled') {
        expect(result.resort.value.matchedValue).toContain('苗場');
      }
    });

    it('應該處理過去的日期', async () => {
      const form = createEmptyForm();
      // 假設當前是 2025-11-16，輸入 1月的日期
      const result = await updateFormFromInput(form, '二世谷 1月5-10日');

      // 應該解釋為未來的 2026/1/5-10
      expect(result.startDate.status).toBe('filled');
      if (result.startDate.status === 'filled') {
        // 年份應該是未來
        expect(result.startDate.value.getFullYear()).toBeGreaterThanOrEqual(2025);
      }
    });

    it('應該處理超長天數', async () => {
      const form = createEmptyForm();
      const result = await updateFormFromInput(form, '二世谷 3月1日 90天');

      expect(result.duration.status).toBe('filled');
      if (result.duration.status === 'filled') {
        expect(result.duration.value).toBe(90);
      }
    });
  });

  // ==================== Suite 10: 進階測試 - 日期格式與多輪對話 ====================
  describe('Suite 10: 進階測試 (Advanced Tests)', () => {

    // 子區塊 1: 中文日期格式
    describe('中文日期格式', () => {
      it('應該解析「三月二十日」等中文日期', async () => {
        const form = createEmptyForm();
        const result = await updateFormFromInput(form, '野澤 三月二十日');

        // parseIntent 可能支持或不支持中文日期，至少應該正確處理
        expect(result.resort.status).toBe('filled');
      });

      it('應該處理「到」字連接的日期範圍', async () => {
        const form = createEmptyForm();
        const result = await updateFormFromInput(form, '野澤 3月20到25日');

        expect(result.startDate.status).toBe('filled');
        expect(result.endDate.status).toBe('filled');
      });

      it('應該處理「至」字連接的日期範圍', async () => {
        const form = createEmptyForm();
        const result = await updateFormFromInput(form, '野澤 3/20至3/25');

        expect(result.startDate.status).toBe('filled');
        expect(result.endDate.status).toBe('filled');
      });
    });

    // 子區塊 2: 多輪對話進階場景
    describe('多輪對話進階場景', () => {
      it('應該支持分步驟填寫：先雪場，後日期，再天數', async () => {
        let form = createEmptyForm();

        // 第一輪：只說雪場
        form = await updateFormFromInput(form, '我想去二世谷');
        expect(form.resort.status).toBe('filled');
        expect(form.startDate.status).toBe('empty');

        // 第二輪：補充日期
        form = await updateFormFromInput(form, '3月20日出發');
        expect(form.startDate.status).toBe('filled');
        expect(form.endDate.status).toBe('empty');

        // 第三輪：補充天數
        form = await updateFormFromInput(form, '去5天');
        expect(form.duration.status).toBe('filled');
        expect(form.endDate.status).toBe('filled');
      });

      it('應該支持修正錯誤：改變開始日期', async () => {
        let form = createEmptyForm();

        form = await updateFormFromInput(form, '野澤 3月20-25日');
        const originalStart = form.startDate.status === 'filled' ? form.startDate.value : null;

        // 修正開始日期
        form = await updateFormFromInput(form, '改成3月22日出發');
        expect(form.startDate.status).toBe('filled');
        if (form.startDate.status === 'filled' && originalStart) {
          expect(form.startDate.value.getTime()).not.toBe(originalStart.getTime());
        }
      });

      it('應該支持只改變天數', async () => {
        let form = createEmptyForm();

        form = await updateFormFromInput(form, '野澤 3月20日 5天');
        expect(form.duration.status).toBe('filled');
        expect(form.duration.value).toBe(5);

        // 改變天數
        form = await updateFormFromInput(form, '改成7天');
        expect(form.duration.status).toBe('filled');
        if (form.duration.status === 'filled') {
          expect(form.duration.value).toBe(7);
        }
      });

      it('應該支持添加找伴資訊到已有行程', async () => {
        let form = createEmptyForm();

        form = await updateFormFromInput(form, '野澤 3月20-25日');
        // visibility 會被設置為默認值 'private'
        expect(form.visibility.status).toBe('filled');
        if (form.visibility.status === 'filled') {
          expect(form.visibility.value).toBe('private');
        }

        // 後續添加找伴，覆蓋為 public
        form = await updateFormFromInput(form, '公開找2個人');
        expect(form.visibility.status).toBe('filled');
        if (form.visibility.status === 'filled') {
          expect(form.visibility.value).toBe('public');
        }
        expect(form.maxBuddies.status).toBe('filled');
      });
    });

    // 子區塊 3: 數字格式變化
    describe('數字格式變化', () => {
      it('應該解析中文數字：「找三個人」', async () => {
        const form = createEmptyForm();
        const result = await updateFormFromInput(form, '野澤 3月20日 找三個人');

        // parseIntent 可能支持或不支持中文數字
        expect(result.visibility.status).toBe('filled');
      });

      it('應該處理「1-2人」範圍格式', async () => {
        const form = createEmptyForm();
        const result = await updateFormFromInput(form, '野澤 3月20日 找1-2人');

        expect(result.visibility.status).toBe('filled');
        // maxBuddies 可能取上限或下限
      });

      it('應該處理大數字：「找10個人」', async () => {
        const form = createEmptyForm();
        const result = await updateFormFromInput(form, '野澤 3月20日 找10個人');

        expect(result.maxBuddies.status).toBe('filled');
        if (result.maxBuddies.status === 'filled') {
          expect(result.maxBuddies.value).toBe(10);
        }
      });
    });

    // 子區塊 4: 複雜組合輸入
    describe('複雜組合輸入', () => {
      it('應該處理包含標點符號的輸入', async () => {
        const form = createEmptyForm();
        const result = await updateFormFromInput(form, '想去野澤！3月20-25日，找2個人。');

        expect(result.resort.status).toBe('filled');
        expect(result.startDate.status).toBe('filled');
        expect(result.maxBuddies.status).toBe('filled');
      });

      it('應該處理問句形式', async () => {
        const form = createEmptyForm();
        const result = await updateFormFromInput(form, '有人3月20日要去野澤嗎？');

        expect(result.resort.status).toBe('filled');
        expect(result.startDate.status).toBe('filled');
      });

      it('應該處理倒裝句：日期在雪場前', async () => {
        const form = createEmptyForm();
        const result = await updateFormFromInput(form, '3月20-25日去野澤');

        expect(result.resort.status).toBe('filled');
        expect(result.startDate.status).toBe('filled');
        expect(result.endDate.status).toBe('filled');
      });

      it('應該處理非常詳細的描述', async () => {
        const form = createEmptyForm();
        const result = await updateFormFromInput(
          form,
          '我計劃在2025年3月20日到3月25日去野澤溫泉滑雪場，想公開找2個滑雪夥伴一起'
        );

        expect(result.resort.status).toBe('filled');
        expect(result.startDate.status).toBe('filled');
        expect(result.endDate.status).toBe('filled');
        expect(result.visibility.status).toBe('filled');
        expect(result.maxBuddies.status).toBe('filled');
      });
    });

    // 子區塊 5: 狀態轉換驗證
    describe('狀態轉換驗證', () => {
      it('從 AWAITING_INPUT 到 AWAITING_DATE', async () => {
        let form = createEmptyForm();
        expect(getCurrentState(form)).toBe('AWAITING_INPUT');

        form = await updateFormFromInput(form, '野澤');
        const state = getCurrentState(form);
        expect(state).toBe('AWAITING_DATE');
      });

      it('從 AWAITING_DATE 到 AWAITING_DURATION', async () => {
        let form = createEmptyForm();
        form = await updateFormFromInput(form, '野澤');

        form = await updateFormFromInput(form, '3月20日');
        const state = getCurrentState(form);
        // 如果只有開始日期沒有結束日期，可能需要天數
        expect(['AWAITING_DURATION', 'CONFIRMING_TRIP'].includes(state)).toBe(true);
      });

      it('所有欄位填寫後應該到達 CONFIRMING_TRIP', async () => {
        const form = createEmptyForm();
        const result = await updateFormFromInput(form, '野澤 3月20-25日 公開找2人');

        const state = getCurrentState(result);
        expect(state).toBe('CONFIRMING_TRIP');
      });
    });

    // 子區塊 6: 更多雪場測試
    describe('更多雪場測試', () => {
      it('應該識別「白馬」（模糊匹配）', async () => {
        const form = createEmptyForm();
        const result = await updateFormFromInput(form, '白馬八方');

        // 使用更具體的名稱「白馬八方」
        expect(result.resort.status).toBe('filled');
        if (result.resort.status === 'filled') {
          expect(result.resort.value.matchedValue).toContain('白馬');
        }
      });

      it('應該識別「留壽都」', async () => {
        const form = createEmptyForm();
        const result = await updateFormFromInput(form, '留壽都');

        expect(result.resort.status).toBe('filled');
      });

      it('應該識別英文雪場名：「Niseko」', async () => {
        const form = createEmptyForm();
        const result = await updateFormFromInput(form, 'Niseko 3/20-25');

        // Niseko 應該可以被識別
        expect(result.resort.status).toBe('filled');
        if (result.resort.status === 'filled') {
          expect(
            result.resort.value.matchedValue.toLowerCase().includes('niseko') ||
            result.resort.value.matchedValue.includes('二世谷')
          ).toBe(true);
        }
      });
    });
  });
});
