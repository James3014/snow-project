/**
 * 全面的雪場識別測試
 * 涵蓋所有可能的輸入情況
 */

interface TestCase {
  input: string;
  expectedResort: string | string[]; // 雪場 ID 或雪場群
  scenario: string;
  shouldMatch: boolean;
}

const TEST_CASES: TestCase[] = [
  // ===== 情況 1: 直接雪場名（短名稱）=====
  {
    input: '苗場',
    expectedResort: 'yuzawa_naeba',
    scenario: '直接輸入：苗場',
    shouldMatch: true,
  },
  {
    input: '野澤溫泉',
    expectedResort: 'nagano_nozawa_onsen',
    scenario: '直接輸入：野澤溫泉',
    shouldMatch: true,
  },
  {
    input: '二世谷',
    expectedResort: 'hokkaido_niseko_moiwa',
    scenario: '直接輸入：二世谷',
    shouldMatch: true,
  },
  {
    input: '留壽都',
    expectedResort: 'hokkaido_rusutsu',
    scenario: '直接輸入：留壽都',
    shouldMatch: true,
  },
  {
    input: '富良野',
    expectedResort: 'hokkaido_furano',
    scenario: '直接輸入：富良野',
    shouldMatch: true,
  },

  // ===== 情況 2: 完整雪場名 =====
  {
    input: '苗場滑雪場',
    expectedResort: 'yuzawa_naeba',
    scenario: '完整名稱：苗場滑雪場',
    shouldMatch: true,
  },
  {
    input: '野澤溫泉滑雪場',
    expectedResort: 'nagano_nozawa_onsen',
    scenario: '完整名稱：野澤溫泉滑雪場',
    shouldMatch: true,
  },
  {
    input: '白馬八方尾根滑雪場',
    expectedResort: 'hakuba_happo_one',
    scenario: '完整名稱：白馬八方尾根滑雪場',
    shouldMatch: true,
  },

  // ===== 情況 3: 句子中的雪場名 =====
  {
    input: '2月3到8日去苗場',
    expectedResort: 'yuzawa_naeba',
    scenario: '句子中：2月3到8日去苗場',
    shouldMatch: true,
  },
  {
    input: '想去野澤溫泉滑雪',
    expectedResort: 'nagano_nozawa_onsen',
    scenario: '句子中：想去野澤溫泉滑雪',
    shouldMatch: true,
  },
  {
    input: '12月去留壽都',
    expectedResort: 'hokkaido_rusutsu',
    scenario: '句子中：12月去留壽都',
    shouldMatch: true,
  },
  {
    input: '明年1月去二世谷滑雪',
    expectedResort: 'hokkaido_niseko_moiwa',
    scenario: '句子中：明年1月去二世谷滑雪',
    shouldMatch: true,
  },
  {
    input: '打算去富良野',
    expectedResort: 'hokkaido_furano',
    scenario: '句子中：打算去富良野',
    shouldMatch: true,
  },

  // ===== 情況 4: 雪場群（應該返回多個選項）=====
  {
    input: '白馬',
    expectedResort: ['hakuba_cortina', 'hakuba_happo_one', 'hakuba_goryu_47', 'hakuba_iwatake', 'hakuba_tsugaike_kogen', 'hakuba_norikura'],
    scenario: '雪場群：白馬（6個雪場）',
    shouldMatch: true,
  },
  {
    input: '湯澤',
    expectedResort: ['yuzawa_gala', 'yuzawa_naeba', 'yuzawa_kagura', 'yuzawa_ishiuchi_maruyama', 'yuzawa_kandatsu', 'yuzawa_maiko_kogen', 'yuzawa_iwappara', 'yuzawa_joetsu_kokusai', 'yuzawa_nakazato', 'yuzawa_naspa_ski_garden', 'yuzawa_park'],
    scenario: '雪場群：湯澤（11個雪場）',
    shouldMatch: true,
  },

  // ===== 情況 5: 英文名稱 =====
  {
    input: 'Naeba',
    expectedResort: 'yuzawa_naeba',
    scenario: '英文：Naeba',
    shouldMatch: true,
  },
  {
    input: 'Hakuba',
    expectedResort: ['hakuba_cortina', 'hakuba_happo_one', 'hakuba_goryu_47', 'hakuba_iwatake', 'hakuba_tsugaike_kogen', 'hakuba_norikura'],
    scenario: '英文：Hakuba（雪場群）',
    shouldMatch: true,
  },
  {
    input: 'Niseko',
    expectedResort: 'hokkaido_niseko_moiwa',
    scenario: '英文：Niseko',
    shouldMatch: true,
  },
  {
    input: 'Rusutsu',
    expectedResort: 'hokkaido_rusutsu',
    scenario: '英文：Rusutsu',
    shouldMatch: true,
  },

  // ===== 情況 6: 複雜組合（日期 + 雪場）=====
  {
    input: '12月20到26去白馬八方',
    expectedResort: 'hakuba_happo_one',
    scenario: '複雜：12月20到26去白馬八方',
    shouldMatch: true,
  },
  {
    input: '2025年1月15日去苗場',
    expectedResort: 'yuzawa_naeba',
    scenario: '複雜：2025年1月15日去苗場',
    shouldMatch: true,
  },
  {
    input: '12-30到1月2號去野澤溫泉',
    expectedResort: 'nagano_nozawa_onsen',
    scenario: '複雜跨年：12-30到1月2號去野澤溫泉',
    shouldMatch: true,
  },

  // ===== 情況 7: 特殊雪場（含特殊字符）=====
  {
    input: 'GALA湯澤',
    expectedResort: 'yuzawa_gala',
    scenario: '特殊：GALA湯澤',
    shouldMatch: true,
  },
  {
    input: '神樂',
    expectedResort: 'yuzawa_kagura',
    scenario: '特殊：神樂',
    shouldMatch: true,
  },
  {
    input: '去GALA',
    expectedResort: 'yuzawa_gala',
    scenario: '句子中：去GALA',
    shouldMatch: true,
  },

  // ===== 情況 8: 容易混淆的名稱 =====
  {
    input: '白馬八方',
    expectedResort: 'hakuba_happo_one',
    scenario: '縮寫：白馬八方 → 白馬八方尾根',
    shouldMatch: true,
  },
  {
    input: '白馬五龍',
    expectedResort: 'hakuba_goryu_47',
    scenario: '縮寫：白馬五龍 → 白馬五龍&Hakuba47',
    shouldMatch: true,
  },

  // ===== 情況 9: 日文名稱 =====
  {
    input: '苗場スキー場',
    expectedResort: 'yuzawa_naeba',
    scenario: '日文：苗場スキー場',
    shouldMatch: true,
  },
  {
    input: 'ニセコ',
    expectedResort: 'hokkaido_niseko_moiwa',
    scenario: '日文：ニセコ',
    shouldMatch: true,
  },

  // ===== 情況 10: 常見拼寫變化 =====
  {
    input: '苗场',
    expectedResort: 'yuzawa_naeba',
    scenario: '簡體：苗场（簡體字）',
    shouldMatch: true,
  },
];

console.log('=== 全面雪場識別測試 ===\n');
console.log(`總共 ${TEST_CASES.length} 個測試案例\n`);

// 按情況分組顯示
const scenarios = [
  '直接輸入',
  '完整名稱',
  '句子中',
  '雪場群',
  '英文',
  '複雜',
  '特殊',
  '縮寫',
  '日文',
  '簡體',
];

scenarios.forEach(scenario => {
  const cases = TEST_CASES.filter(c => c.scenario.startsWith(scenario));
  if (cases.length > 0) {
    console.log(`\n【${scenario}】 (${cases.length} 個測試)`);
    cases.forEach((tc, i) => {
      const isGroup = Array.isArray(tc.expectedResort);
      const expected = isGroup
        ? `${tc.expectedResort.length} 個雪場`
        : tc.expectedResort;
      console.log(`  ${i + 1}. "${tc.input}" → ${expected}`);
    });
  }
});

console.log('\n\n=== 測試執行指南 ===\n');
console.log('1. 複製此測試文件到測試環境');
console.log('2. 實現測試執行邏輯（調用 matchResort 和 getSuggestions）');
console.log('3. 記錄所有失敗的測試案例');
console.log('4. 根據失敗案例改進 resortMatcher.ts');
console.log('5. 重新測試直到全部通過');
console.log('\n建議的測試腳本：');
console.log('```typescript');
console.log('import { matchResort, getSuggestions } from "@/features/ai/utils/resortMatcher";');
console.log('');
console.log('for (const testCase of TEST_CASES) {');
console.log('  const result = await matchResort(testCase.input);');
console.log('  const isGroup = Array.isArray(testCase.expectedResort);');
console.log('  ');
console.log('  if (isGroup) {');
console.log('    // 檢查是否返回建議列表');
console.log('    const suggestions = await getSuggestions(testCase.input);');
console.log('    // 驗證建議列表包含預期的雪場');
console.log('  } else {');
console.log('    // 檢查是否匹配到正確的雪場');
console.log('    if (result?.resort.resort_id !== testCase.expectedResort) {');
console.log('      console.error(`❌ FAILED: ${testCase.scenario}`);');
console.log('    } else {');
console.log('      console.log(`✅ PASSED: ${testCase.scenario}`);');
console.log('    }');
console.log('  }');
console.log('}');
console.log('```');

// 輸出 JSON 格式供程序使用
console.log('\n\n=== JSON 格式（供測試腳本使用）===\n');
console.log(JSON.stringify(TEST_CASES, null, 2));
