/**
 * 測試意圖解析器完整流程
 */

const fs = require('fs');
const path = require('path');

// 模擬 matchResort 函數（簡化版）
async function testMatchResort(input) {
  const normalized = input.toLowerCase();

  // 簡單測試：是否包含「苗場」
  if (normalized.includes('苗場')) {
    return {
      resort: {
        resort_id: 'yuzawa_naeba',
        names: { zh: '苗場滑雪場', en: 'Naeba', ja: '苗場' }
      },
      confidence: 0.85,
      matchedField: 'zh'
    };
  }

  return null;
}

// 模擬 detectAction
function detectAction(input) {
  const normalized = input.toLowerCase().trim();

  const CREATE_KEYWORDS = [
    '建立', '建立行程', '新增', '新增行程', '創建', '創建行程',
    '規劃', '規劃行程', '計劃', '安排', '去', '想去',
  ];

  for (const keyword of CREATE_KEYWORDS) {
    if (normalized.includes(keyword.toLowerCase())) {
      return { action: 'CREATE_TRIP', confidence: 1.0 };
    }
  }

  return { action: 'UNKNOWN', confidence: 0.0 };
}

// 簡化的 extractDates
function extractDates(input) {
  // 簡單測試：匹配 「2月3到7日」格式
  const match = input.match(/(\d{1,2})月(\d{1,2})[日號]?到(\d{1,2})[日號]?/);

  if (match) {
    const month = parseInt(match[1]);
    const startDay = parseInt(match[2]);
    const endDay = parseInt(match[3]);

    const year = new Date().getFullYear();
    const startDate = new Date(year, month - 1, startDay);
    const endDate = new Date(year, month - 1, endDay);

    return { startDate, endDate };
  }

  return { startDate: null, endDate: null };
}

// 測試完整流程
async function testFullFlow(input) {
  console.log(`\n測試輸入：「${input}」\n`);

  // 步驟1：檢測動作
  const { action, confidence: actionConfidence } = detectAction(input);
  console.log(`步驟1 - 動作檢測：${action} (信心度: ${actionConfidence})`);

  // 步驟2：匹配雪場
  const resortMatch = await testMatchResort(input);
  console.log(`步驟2 - 雪場匹配：${resortMatch ? resortMatch.resort.names.zh : '無匹配'} (信心度: ${resortMatch?.confidence || 0})`);

  // 步驟3：提取日期
  const dates = extractDates(input);
  console.log(`步驟3 - 日期提取：${dates.startDate ? dates.startDate.toLocaleDateString('zh-TW') : '無'} ~ ${dates.endDate ? dates.endDate.toLocaleDateString('zh-TW') : '無'}`);

  // 步驟4：構建意圖
  const intent = {
    action,
    confidence: actionConfidence,
    resort: resortMatch,
    startDate: dates.startDate,
    endDate: dates.endDate,
    rawInput: input
  };

  console.log('\n最終意圖：');
  console.log(`  動作：${intent.action}`);
  console.log(`  雪場：${intent.resort ? intent.resort.resort.names.zh : '缺失'}`);
  console.log(`  日期：${intent.startDate ? intent.startDate.toLocaleDateString('zh-TW') : '缺失'} ~ ${intent.endDate ? intent.endDate.toLocaleDateString('zh-TW') : '缺失'}`);
  console.log(`  信心度：${intent.confidence}`);

  // 判斷結果
  if (intent.action === 'CREATE_TRIP' && intent.resort && intent.startDate) {
    console.log('\n✅ 成功：應該可以創建行程');
  } else {
    console.log('\n❌ 失敗：缺少必要資訊');
    if (!intent.resort) console.log('  - 缺少雪場資訊');
    if (!intent.startDate) console.log('  - 缺少日期資訊');
  }

  return intent;
}

// 執行測試
async function runTests() {
  const testCases = [
    '新增苗場2月3到7日',
    '2月3到8日去苗場',
    '苗場',
    '去苗場',
  ];

  for (const testCase of testCases) {
    await testFullFlow(testCase);
  }
}

runTests().catch(console.error);
